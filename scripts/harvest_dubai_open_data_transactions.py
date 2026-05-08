from __future__ import annotations

import argparse
import csv
import http.client
import io
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


APP_ROOT = Path(__file__).resolve().parents[1]
DATA_LAKE = APP_ROOT.parent.parent
OUTPUT_DIR = DATA_LAKE / "90_processed" / "dubai_live_transactions"
CATALOG_JSON = APP_ROOT / "data" / "catalog" / "dubai_live_transactions_manifest.json"

DLD_REAL_ESTATE_DATA_URL = "https://dubailand.gov.ae/en/open-data/real-estate-data/"

GROUPS = {
    "all": "",
    "sales": "1",
    "mortgages": "2",
    "gifts": "3",
}

REGISTRATION_TYPES = {
    "all": "",
    "ready": "0",
    "off-plan": "1",
}

FREEHOLD = {
    "all": "",
    "yes": "1",
    "no": "0",
}

USAGES = {
    "all": "",
    "residential": "1",
    "commercial": "2",
    "other": "3",
}

PROPERTY_TYPES = {
    "all": "",
    "land": "1",
    "building": "2",
    "unit": "3",
}

TRANSACTION_LABELS = {
    "TRANSACTION_NUMBER": "Transaction Number",
    "INSTANCE_DATE": "Transaction Date",
    "GROUP_EN": "Transaction Type",
    "PROCEDURE_EN": "Transaction sub type",
    "IS_OFFPLAN_EN": "Registration type",
    "IS_FREE_HOLD_EN": "Is Free Hold?",
    "USAGE_EN": "Usage",
    "AREA_EN": "Area",
    "PROP_TYPE_EN": "Property Type",
    "PROP_SB_TYPE_EN": "Property Sub Type",
    "TRANS_VALUE": "Amount",
    "PROCEDURE_AREA": "Transaction Size (sq.m)",
    "ACTUAL_AREA": "Property Size (sq.m)",
    "ROOMS_EN": "Room(s)",
    "PARKING": "Parking",
    "NEAREST_METRO_EN": "Nearest Metro",
    "NEAREST_MALL_EN": "Nearest Mall",
    "NEAREST_LANDMARK_EN": "Nearest Landmark",
    "TOTAL_BUYER": "No. of Buyer",
    "TOTAL_SELLER": "No. of Seller",
    "MASTER_PROJECT_EN": "Master Project",
    "PROJECT_EN": "Project",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Harvest live official Dubai Land Department open-data transactions."
    )
    parser.add_argument(
        "--from-date",
        required=True,
        help="Start date in YYYY-MM-DD format. The DLD endpoint currently serves current-year data.",
    )
    parser.add_argument(
        "--to-date",
        required=True,
        help="End date in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--group",
        choices=sorted(GROUPS),
        default="sales",
        help="Transaction group to request.",
    )
    parser.add_argument(
        "--registration-type",
        choices=sorted(REGISTRATION_TYPES),
        default="all",
        help="Ready/off-plan filter.",
    )
    parser.add_argument(
        "--freehold",
        choices=sorted(FREEHOLD),
        default="all",
        help="Freehold filter.",
    )
    parser.add_argument(
        "--usage",
        choices=sorted(USAGES),
        default="all",
        help="Usage filter.",
    )
    parser.add_argument(
        "--property-type",
        choices=sorted(PROPERTY_TYPES),
        default="all",
        help="Property type filter.",
    )
    parser.add_argument(
        "--area-id",
        default="",
        help="Optional DLD area id.",
    )
    parser.add_argument(
        "--take",
        type=int,
        default=100,
        help="Rows per page for JSON pagination.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=3,
        help="Maximum JSON pages to fetch. Use 0 to continue until all rows are fetched.",
    )
    parser.add_argument(
        "--sort",
        default="INSTANCE_DATE_DESC",
        help="DLD sort expression, e.g. INSTANCE_DATE_DESC or TRANS_VALUE_DESC.",
    )
    parser.add_argument(
        "--download-csv",
        action="store_true",
        help="Also download DLD's CSV export for the full filter.",
    )
    parser.add_argument(
        "--pause",
        type=float,
        default=0.2,
        help="Pause between JSON page requests in seconds.",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="Retries per DLD request before saving partial results and stopping.",
    )
    parser.add_argument(
        "--request-timeout",
        type=int,
        default=45,
        help="HTTP request timeout in seconds.",
    )
    return parser.parse_args()


def iso_to_dld_date(value: str) -> str:
    return datetime.strptime(value, "%Y-%m-%d").strftime("%m/%d/%Y")


def compact_date(value: str) -> str:
    return datetime.strptime(value, "%Y-%m-%d").strftime("%Y%m%d")


def request_json(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str],
    *,
    timeout: int,
) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def request_bytes(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str],
    *,
    timeout: int,
) -> tuple[bytes, dict[str, str]]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read(), dict(response.headers.items())


def with_retries(label: str, retries: int, pause: float, fn: Any) -> Any:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return fn()
        except (
            TimeoutError,
            urllib.error.URLError,
            urllib.error.HTTPError,
            http.client.RemoteDisconnected,
            ConnectionResetError,
        ) as exc:
            last_error = exc
            print(f"{label} attempt={attempt} failed={type(exc).__name__}: {exc}")
            if attempt < retries:
                time.sleep(pause * attempt)
    if last_error:
        raise last_error
    raise RuntimeError(f"{label} failed without an exception")


def fetch_api_config() -> dict[str, Any]:
    req = urllib.request.Request(
        DLD_REAL_ESTATE_DATA_URL,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    html = urllib.request.urlopen(req, timeout=45).read().decode("utf-8", "ignore")
    match = re.search(r"window\.apiConfig\s*=\s*(\{.*?\})\s*;", html, re.S)
    if not match:
        raise RuntimeError("Could not find window.apiConfig on the DLD Real Estate Data page.")
    config = json.loads(match.group(1))
    if not config.get("consumerId") or not config.get("openDataApi"):
        raise RuntimeError("DLD apiConfig did not include consumerId/openDataApi.")
    return config


def build_headers(config: dict[str, Any], accept: str = "application/json, */*") -> dict[str, str]:
    return {
        "User-Agent": "Mozilla/5.0",
        "Accept": accept,
        "Accept-Language": "en-US,en;q=0.9",
        "AppUser": "",
        "consumer-id": config["consumerId"],
        "Content-Type": "application/json; charset=utf-8",
        "Origin": "https://dubailand.gov.ae",
        "Referer": DLD_REAL_ESTATE_DATA_URL,
    }


def build_filter(args: argparse.Namespace, *, take: int, skip: int | str) -> dict[str, str]:
    return {
        "P_FROM_DATE": iso_to_dld_date(args.from_date),
        "P_TO_DATE": iso_to_dld_date(args.to_date),
        "P_GROUP_ID": GROUPS[args.group],
        "P_IS_OFFPLAN": REGISTRATION_TYPES[args.registration_type],
        "P_IS_FREE_HOLD": FREEHOLD[args.freehold],
        "P_AREA_ID": args.area_id,
        "P_USAGE_ID": USAGES[args.usage],
        "P_PROP_TYPE_ID": PROPERTY_TYPES[args.property_type],
        "P_TAKE": str(take),
        "P_SKIP": str(skip),
        "P_SORT": args.sort,
    }


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False, sort_keys=True))
            fh.write("\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fieldnames = list(rows[0].keys())
    for row in rows[1:]:
        for key in row.keys():
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def harvest_rows(
    args: argparse.Namespace,
    config: dict[str, Any],
    headers: dict[str, str],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    endpoint = config["openDataApi"].rstrip("/") + "/transactions"
    rows: list[dict[str, Any]] = []
    skip = 0
    total: int | None = None
    page = 0
    stopped_on_error: str | None = None
    while True:
        payload = build_filter(args, take=args.take, skip=skip)
        try:
            response = with_retries(
                f"json_page skip={skip}",
                args.retries,
                max(args.pause, 1.0),
                lambda: request_json(
                    endpoint,
                    payload,
                    headers,
                    timeout=args.request_timeout,
                ),
            )
        except Exception as exc:
            stopped_on_error = f"{type(exc).__name__}: {exc}"
            print(f"stopping_after_error={stopped_on_error}")
            break
        result = response.get("response", {}).get("result") or []
        if total is None and result:
            total = int(result[0].get("TOTAL") or 0)
        rows.extend(result)
        page += 1
        print(
            f"page={page} skip={skip} rows={len(result)} total={total if total is not None else 'unknown'}"
        )
        if not result:
            break
        skip += args.take
        if total is not None and skip >= total:
            break
        if args.max_pages and page >= args.max_pages:
            break
        time.sleep(args.pause)
    stats = {
        "json_rows_downloaded": len(rows),
        "json_reported_total": total,
        "json_pages_downloaded": page,
        "json_incomplete": bool(total is not None and len(rows) < total),
        "stopped_on_error": stopped_on_error,
    }
    return rows, stats


def download_csv_export(
    args: argparse.Namespace,
    config: dict[str, Any],
    headers: dict[str, str],
) -> tuple[bytes, dict[str, str]]:
    endpoint = config["openDataApi"].rstrip("/") + "/transactions/export/csv"
    payload = {
        "parameters": build_filter(args, take=-1, skip=""),
        "command": "transactions",
        "labels": TRANSACTION_LABELS,
    }
    return with_retries(
        "csv_export",
        args.retries,
        max(args.pause, 1.0),
        lambda: request_bytes(
            endpoint,
            payload,
            headers,
            timeout=max(args.request_timeout, 90),
        ),
    )


def summarize_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    values = [float(row["TRANS_VALUE"]) for row in rows if row.get("TRANS_VALUE") not in (None, "")]
    dates = [row.get("INSTANCE_DATE") for row in rows if row.get("INSTANCE_DATE")]
    areas = sorted({row.get("AREA_EN") for row in rows if row.get("AREA_EN")})
    projects = sorted({row.get("PROJECT_EN") for row in rows if row.get("PROJECT_EN")})
    groups = sorted({row.get("GROUP_EN") for row in rows if row.get("GROUP_EN")})
    return {
        "rows": len(rows),
        "min_instance_date": min(dates) if dates else None,
        "max_instance_date": max(dates) if dates else None,
        "groups": groups,
        "areas": len(areas),
        "projects": len(projects),
        "total_trans_value_aed": round(sum(values), 2) if values else 0,
        "sample_areas": areas[:12],
        "sample_projects": projects[:12],
    }


def count_csv_rows(csv_bytes: bytes) -> int:
    text = csv_bytes.decode("utf-8-sig", "replace")
    reader = csv.reader(io.StringIO(text))
    count = sum(1 for _ in reader)
    return max(count - 1, 0)


def main() -> None:
    args = parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CATALOG_JSON.parent.mkdir(parents=True, exist_ok=True)

    config = fetch_api_config()
    headers = build_headers(config)
    csv_headers = build_headers(config, accept="text/csv, */*")
    source_config = {
        "real_estate_data_url": DLD_REAL_ESTATE_DATA_URL,
        "open_data_transactions_endpoint": config["openDataApi"].rstrip("/") + "/transactions",
        "open_data_transactions_csv_export_endpoint": config["openDataApi"].rstrip("/")
        + "/transactions/export/csv",
        "consumer_id_source": "DLD public apiConfig.consumerId",
    }

    rows, page_stats = harvest_rows(args, config, headers)
    prefix = (
        f"dld_open_data_transactions_{compact_date(args.from_date)}_{compact_date(args.to_date)}"
        f"_{args.group}_{args.registration_type}_{args.usage}_{args.property_type}"
    )
    jsonl_path = OUTPUT_DIR / f"{prefix}.jsonl"
    csv_rows_path = OUTPUT_DIR / f"{prefix}_paged_rows.csv"
    manifest_path = OUTPUT_DIR / f"{prefix}_manifest.json"
    write_jsonl(jsonl_path, rows)
    write_csv(csv_rows_path, rows)

    csv_export_path: Path | None = None
    csv_export_headers: dict[str, str] = {}
    csv_export_rows = 0
    if args.download_csv:
        csv_bytes, csv_export_headers = download_csv_export(args, config, csv_headers)
        csv_export_rows = count_csv_rows(csv_bytes)
        csv_export_path = OUTPUT_DIR / f"{prefix}_dld_export.csv"
        csv_export_path.write_bytes(csv_bytes)
        print(f"csv_export_rows={csv_export_rows} csv_export_bytes={len(csv_bytes)} path={csv_export_path}")

    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": source_config,
        "filters": build_filter(args, take=args.take, skip=0),
        "arguments": {
            "from_date": args.from_date,
            "to_date": args.to_date,
            "group": args.group,
            "registration_type": args.registration_type,
            "freehold": args.freehold,
            "usage": args.usage,
            "property_type": args.property_type,
            "area_id": args.area_id,
            "take": args.take,
            "max_pages": args.max_pages,
            "sort": args.sort,
            "download_csv": args.download_csv,
        },
        "outputs": {
            "jsonl": str(jsonl_path),
            "paged_rows_csv": str(csv_rows_path),
            "dld_export_csv": str(csv_export_path) if csv_export_path else None,
            "manifest": str(manifest_path),
        },
        "page_stats": page_stats,
        "row_summary": summarize_rows(rows),
        "csv_export": {
            "bytes": csv_export_path.stat().st_size if csv_export_path else 0,
            "rows": csv_export_rows,
            "content_type": csv_export_headers.get("Content-Type") if csv_export_headers else None,
            "content_disposition": csv_export_headers.get("Content-Disposition")
            if csv_export_headers
            else None,
        },
        "notes": [
            "This uses Dubai Land Department's public Real Estate Data page and open-data endpoints.",
            "DLD's page directs previous-year data to Dubai Pulse; live page filters are intended for current-year data.",
            "No private credentials are stored. The script extracts the public consumer id from the DLD page at runtime.",
        ],
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    CATALOG_JSON.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"jsonl={jsonl_path}")
    print(f"paged_rows_csv={csv_rows_path}")
    print(f"manifest={manifest_path}")
    print(f"catalog={CATALOG_JSON}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        raise SystemExit(f"HTTP {exc.code}: {body[:1000]}") from exc
