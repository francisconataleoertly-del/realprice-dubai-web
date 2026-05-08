from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
PARQUET_DIR = ROOT.parent.parent / "90_processed" / "france_dvf_residential_parquet"
COMPARABLES_PATH = ROOT / "data" / "france-dvf-comparables.json"


def extract_postcode(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    digits = "".join(ch for ch in text if ch.isdigit())
    if 3 <= len(digits) <= 5:
        return digits.zfill(5)
    for token in text.split():
        if token.isdigit():
            return token.zfill(5)
    return None


def weighted_quantile(values: np.ndarray, weights: np.ndarray, quantile: float) -> float | None:
    mask = np.isfinite(values) & np.isfinite(weights) & (weights > 0)
    if not mask.any():
        return None
    values = values[mask]
    weights = weights[mask]
    order = np.argsort(values)
    values = values[order]
    weights = weights[order]
    total = weights.sum()
    if total <= 0:
        return None
    threshold = total * quantile
    running = np.cumsum(weights)
    index = np.searchsorted(running, threshold, side="left")
    index = min(index, len(values) - 1)
    return float(values[index])


def score_comparable(area_source: float, area_target: float, rooms_source: float | None, rooms_target: float) -> tuple[float, float]:
    area_gap = abs(math.log(max(area_source, 1) / max(area_target, 1)))
    if rooms_source is None or not math.isfinite(rooms_source):
        room_gap = 2
    else:
        room_gap = abs(rooms_source - rooms_target)
    area_weight = math.exp(-3.4 * area_gap)
    room_weight = 1.0 if room_gap == 0 else 0.8 if room_gap == 1 else 0.58
    return area_weight, room_weight


def months_old(date_text: str, latest_date: pd.Timestamp) -> int:
    date = pd.to_datetime(date_text, errors="coerce")
    if pd.isna(date):
        return 24
    months = (latest_date.year - date.year) * 12 + (latest_date.month - date.month)
    return max(0, int(months))


def build_anchor(
    postcode: str | None,
    property_type: str,
    area_m2: float,
    rooms: float,
    commune_psm: float,
    comparables_by_postcode: dict[str, dict[str, list[dict]]],
) -> dict:
    if not postcode:
        return {"source": "commune_fallback", "used_count": 0}

    candidates = comparables_by_postcode.get(postcode, {}).get(property_type, [])
    if not candidates:
        return {"source": "commune_fallback", "used_count": 0}

    latest_date = pd.to_datetime(max(row["d"] for row in candidates), errors="coerce")
    if pd.isna(latest_date):
        latest_date = pd.Timestamp("2025-12-31")

    scored: list[dict] = []
    for row in candidates:
        area_weight, room_weight = score_comparable(float(row["s"]), area_m2, row.get("r"), rooms)
        recency_weight = 0.45 + 0.55 * math.exp(-months_old(row["d"], latest_date) / 18)
        weight = area_weight * room_weight * recency_weight
        if weight <= 0.08:
            continue
        room_gap = abs((row.get("r") if row.get("r") is not None else 99) - rooms) if row.get("r") is not None else 99
        scored.append({"row": row, "weight": weight, "room_gap": room_gap})

    scored.sort(key=lambda entry: entry["weight"], reverse=True)
    exact_room_count = sum(1 for entry in scored if entry["room_gap"] == 0)
    preferred = [entry for entry in scored if entry["room_gap"] == 0] if exact_room_count >= 4 else scored
    used = preferred[:18]

    if len(used) < 3:
        return {"source": "commune_fallback", "used_count": 0}

    psm_values = np.array([float(entry["row"]["p"]) for entry in used], dtype=float)
    weights = np.array([float(entry["weight"]) for entry in used], dtype=float)
    anchor_psm = weighted_quantile(psm_values, weights, 0.5)
    low_psm = weighted_quantile(psm_values, weights, 0.25)
    high_psm = weighted_quantile(psm_values, weights, 0.75)
    if anchor_psm is None:
        return {"source": "commune_fallback", "used_count": 0}

    dispersion = 0.0
    if low_psm and high_psm:
      dispersion = max(0.0, (high_psm - low_psm) / max(anchor_psm, 1))

    if len(used) >= 12:
        blended_weight = 0.82
    elif len(used) >= 8:
        blended_weight = 0.72
    elif len(used) >= 5:
        blended_weight = 0.60
    else:
        blended_weight = 0.46

    if dispersion > 0.55:
        blended_weight *= 0.78
    if dispersion > 0.75:
        blended_weight *= 0.72

    anchor_gap = abs(anchor_psm - commune_psm) / max(commune_psm, 1)
    if anchor_gap > 0.45:
        blended_weight *= 0.82
    if exact_room_count < 2:
        blended_weight *= 0.9

    blended_weight = max(0.24, min(0.86, blended_weight))

    return {
        "source": "postcode_weighted_comparables",
        "used_count": len(used),
        "exact_room_count": exact_room_count,
        "anchor_psm": anchor_psm,
        "blended_weight": blended_weight,
    }


def compute_metrics(errors: np.ndarray) -> dict[str, float]:
    return {
        "mape_pct": float(errors.mean() * 100.0),
        "mdape_pct": float(np.median(errors) * 100.0),
        "within_10pct": float((errors <= 0.10).mean() * 100.0),
        "within_20pct": float((errors <= 0.20).mean() * 100.0),
    }


def load_partitioned_parquet(dataset_dir: Path, years: list[int], columns: list[str]) -> pd.DataFrame:
    year_prefixes = {f"year={year}" for year in years}
    files = sorted(
        file
        for file in dataset_dir.rglob("*.parquet")
        if any(part in year_prefixes for part in file.parts)
    )
    if not files:
        raise FileNotFoundError(f"No parquet files found in {dataset_dir}")

    frames: list[pd.DataFrame] = []
    for file in files:
        frame = pd.read_parquet(file, columns=columns)
        year_token = next((part for part in file.parts if part.startswith("year=")), None)
        if year_token and "year" not in frame.columns:
            frame["year"] = int(year_token.split("=", 1)[1])
        frames.append(frame)
    return pd.concat(frames, ignore_index=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample-size", type=int, default=100000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--output",
        default=str(ROOT / "tmp" / "france_v2_holdout_metrics.json"),
    )
    args = parser.parse_args()

    dataset = json.loads(COMPARABLES_PATH.read_text(encoding="utf-8"))
    comparables_by_postcode: dict[str, dict[str, list[dict]]] = {}
    for postcode, rows in dataset["by_postcode"].items():
        bucket: dict[str, list[dict]] = {}
        for row in rows:
            bucket.setdefault(row["t"], []).append(row)
        comparables_by_postcode[postcode] = bucket

    df = load_partitioned_parquet(
        PARQUET_DIR,
        years=[2021, 2022, 2023, 2024, 2025],
        columns=[
            "year",
            "department_code",
            "property_type",
            "area_m2",
            "value_eur",
            "price_per_m2",
            "postal_code",
            "rooms",
            "commune_code",
        ],
    )
    df = df[
        df["property_type"].isin(["Appartement", "Maison"])
        & df["area_m2"].between(12, 400)
        & df["value_eur"].between(15_000, 5_000_000)
        & df["price_per_m2"].between(300, 30_000)
    ].copy()

    df["postal_code"] = df["postal_code"].map(extract_postcode)
    df["rooms_clean"] = pd.to_numeric(df["rooms"], errors="coerce")

    train = df[df["year"].between(2021, 2024)].copy()
    holdout = df[df["year"] == 2025].copy()

    stats = (
        train.groupby(["department_code", "commune_code", "property_type"])
        .agg(
            median_price_per_m2_eur=("price_per_m2", "median"),
            q25_price_per_m2_eur=("price_per_m2", lambda s: float(s.quantile(0.25))),
            q75_price_per_m2_eur=("price_per_m2", lambda s: float(s.quantile(0.75))),
            transactions=("price_per_m2", "size"),
        )
        .reset_index()
    )
    holdout = holdout.merge(
        stats,
        on=["department_code", "commune_code", "property_type"],
        how="left",
    )
    holdout = holdout[holdout["transactions"].fillna(0) >= 15].copy()

    if args.sample_size and len(holdout) > args.sample_size:
        holdout = holdout.sample(args.sample_size, random_state=args.seed).copy()

    predictions: list[float] = []
    actuals: list[float] = []

    for row in holdout.itertuples(index=False):
        commune_psm = float(row.median_price_per_m2_eur)
        rooms = float(row.rooms_clean) if pd.notna(row.rooms_clean) else max(1.0, round(float(row.area_m2) / 24.0))
        anchor = build_anchor(
            row.postal_code,
            row.property_type,
            float(row.area_m2),
            rooms,
            commune_psm,
            comparables_by_postcode,
        )

        if anchor["source"] == "postcode_weighted_comparables":
            blended_psm = round(
                anchor["blended_weight"] * anchor["anchor_psm"]
                + (1 - anchor["blended_weight"]) * commune_psm
            )
            layout_adjustment = 0.0
            if anchor["exact_room_count"] < 2:
                room_signal = float(row.area_m2) / max(rooms, 1.0)
                if row.property_type == "Appartement":
                    layout_adjustment = -0.03 if room_signal < 16 else 0.03 if room_signal > 34 else 0.0
                else:
                    layout_adjustment = -0.02 if room_signal < 22 else 0.03 if room_signal > 48 else 0.0
            estimate = blended_psm * float(row.area_m2) * (1 + layout_adjustment)
        else:
            estimate = commune_psm * float(row.area_m2)

        predictions.append(float(estimate))
        actuals.append(float(row.value_eur))

    y_true = np.array(actuals, dtype=float)
    y_pred = np.array(predictions, dtype=float)
    errors = np.abs(y_pred - y_true) / y_true
    mae_eur = float(np.mean(np.abs(y_pred - y_true)))

    result = {
        "market": "france",
        "model": "dvf_postcode_comparables_v2",
        "sample_size": int(len(holdout)),
        "train_years": [2021, 2022, 2023, 2024],
        "holdout_year": 2025,
        "metrics": {
            **compute_metrics(errors),
            "mae_eur": mae_eur,
        },
        "dataset": {
            "parquet_dir": str(PARQUET_DIR),
            "comparables_path": str(COMPARABLES_PATH),
        },
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
