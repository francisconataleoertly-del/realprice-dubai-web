from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import requests


ROOT = Path(__file__).resolve().parents[1]
FRANCE_PARQUET = Path.home() / "FonatProp_Data_Lake" / "90_processed" / "france_dvf_residential_parquet"
DUBAI_METRICS_URL = "https://web-production-9051f.up.railway.app/metrics"


def evaluate_dubai() -> dict[str, object]:
    response = requests.get(DUBAI_METRICS_URL, timeout=30)
    response.raise_for_status()
    payload = response.json()

    metrics = payload.get("metrics", {})
    summary = payload.get("summary", {})
    return {
        "market": "dubai",
        "source": "live_backend_metrics",
        "rows_evaluated": summary.get("test"),
        "mape_pct": round(float(metrics.get("mape_pct", 0)), 4),
        "mae_aed": round(float(metrics.get("mae_aed", 0)), 2),
        "median_absolute_error_aed": round(float(metrics.get("medae", 0)), 2),
        "within_10pct": round(float(metrics.get("within_10pct", 0)), 4),
        "within_20pct": round(float(metrics.get("within_20pct", 0)), 4),
        "r2": round(float(metrics.get("r2", 0)), 6),
        "train_rows": summary.get("train"),
        "test_rows": summary.get("test"),
        "date_range": {
            "min_date": summary.get("min_date"),
            "max_date": summary.get("max_date"),
        },
    }


def evaluate_france() -> dict[str, object]:
    parts = [
        pd.read_parquet(FRANCE_PARQUET / f"year={year}")
        for year in [2021, 2022, 2023, 2024, 2025]
    ]
    df = pd.concat(parts, ignore_index=True)

    df = df[df["property_type"].isin(["Appartement", "Maison"])].copy()
    for column in ["area_m2", "rooms", "value_eur", "price_per_m2"]:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df = df[
        df["area_m2"].between(12, 400)
        & df["value_eur"].between(15_000, 5_000_000)
        & df["price_per_m2"].between(300, 30_000)
    ].copy()

    train = df[df["year"].between(2021, 2024)].copy()
    test = df[df["year"] == 2025].copy()

    baselines = (
        train.groupby(["commune", "property_type"])
        .agg(
            transactions=("value_eur", "size"),
            median_price_per_m2=("price_per_m2", "median"),
        )
        .reset_index()
    )
    baselines = baselines[baselines["transactions"] >= 15].copy()

    test = test.merge(baselines, on=["commune", "property_type"], how="inner")
    room_signal = test["area_m2"] / test["rooms"].clip(lower=1)
    layout_adjustment = pd.Series(0.0, index=test.index)

    is_apartment = test["property_type"] == "Appartement"
    is_house = test["property_type"] == "Maison"

    layout_adjustment.loc[is_apartment & room_signal.lt(16)] = -0.04
    layout_adjustment.loc[is_apartment & room_signal.gt(34)] = 0.04
    layout_adjustment.loc[is_house & room_signal.lt(22)] = -0.03
    layout_adjustment.loc[is_house & room_signal.gt(48)] = 0.04

    test["predicted_eur"] = (
        test["median_price_per_m2"] * test["area_m2"] * (1 + layout_adjustment)
    ).round()

    absolute_error = (test["predicted_eur"] - test["value_eur"]).abs()
    ape = absolute_error / test["value_eur"]

    return {
        "market": "france",
        "source": "dvf_commune_statistical_v1_backtest",
        "holdout_year": 2025,
        "train_years": [2021, 2022, 2023, 2024],
        "rows_evaluated": int(len(test)),
        "mape_pct": round(float(ape.mean() * 100), 4),
        "mdape_pct": round(float(ape.median() * 100), 4),
        "mae_eur": round(float(absolute_error.mean()), 2),
        "within_10pct": round(float((ape <= 0.10).mean() * 100), 4),
        "within_20pct": round(float((ape <= 0.20).mean() * 100), 4),
        "coverage_rule": "commune + property_type baseline with at least 15 training transactions",
    }


def main() -> None:
    payload = {
        "dubai": evaluate_dubai(),
        "france": evaluate_france(),
    }
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
