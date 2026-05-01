from __future__ import annotations

import argparse
import json
import math
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import duckdb
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


APP_ROOT = Path(__file__).resolve().parents[1]
DATA_LAKE = APP_ROOT.parent.parent
DEFAULT_ARCHIVE = Path.home() / "Downloads" / "archive.zip"
PROCESSED = DATA_LAKE / "90_processed" / "dubai_transactions_parquet"
TABLES_DIR = DATA_LAKE / "90_processed" / "dubai_market_tables"
OUTPUT_JSON = APP_ROOT / "src" / "data" / "dubai-transactions-market.json"
CATALOG_JSON = APP_ROOT / "data" / "catalog" / "dubai_transactions_archive_summary.json"
DOC_PATH = APP_ROOT / "docs" / "fonatprop-dubai-transactions-ingestion-2026-05-01.md"

USECOLS = [
    "transaction_id",
    "trans_group_en",
    "procedure_name_en",
    "instance_date",
    "property_type_en",
    "property_sub_type_en",
    "property_usage_en",
    "reg_type_en",
    "area_id",
    "area_name_en",
    "building_name_en",
    "project_number",
    "project_name_en",
    "master_project_en",
    "nearest_landmark_en",
    "nearest_metro_en",
    "nearest_mall_en",
    "rooms_en",
    "has_parking",
    "procedure_area",
    "actual_worth",
    "meter_sale_price",
    "rent_value",
    "meter_rent_price",
]

STRING_COLS = [
    "transaction_id",
    "trans_group_en",
    "procedure_name_en",
    "property_type_en",
    "property_sub_type_en",
    "property_usage_en",
    "reg_type_en",
    "area_id",
    "area_name_en",
    "building_name_en",
    "project_number",
    "project_name_en",
    "master_project_en",
    "nearest_landmark_en",
    "nearest_metro_en",
    "nearest_mall_en",
    "rooms_en",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build Dubai historical transaction parquet and market tables for FonatProp."
    )
    parser.add_argument(
        "--archive",
        type=Path,
        default=DEFAULT_ARCHIVE,
        help="Path to archive.zip containing Transactions.csv.",
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Rebuild parquet and tables even when a parquet cache exists.",
    )
    parser.add_argument(
        "--chunksize",
        type=int,
        default=125_000,
        help="CSV rows per chunk.",
    )
    return parser.parse_args()


def safe_float(series: pd.Series) -> pd.Series:
    return pd.to_numeric(
        series.astype(str).str.replace(",", "", regex=False).str.strip(),
        errors="coerce",
    )


def clean_text(series: pd.Series) -> pd.Series:
    return (
        series.fillna("")
        .astype(str)
        .str.strip()
        .replace({"nan": "", "None": "", "null": ""})
    )


def json_default(value: Any) -> Any:
    if hasattr(value, "item"):
        return value.item()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def clean_for_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: clean_for_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [clean_for_json(item) for item in value]
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if hasattr(value, "item"):
        return clean_for_json(value.item())
    return value


def find_transactions_member(archive: zipfile.ZipFile) -> str:
    for info in archive.infolist():
        if info.filename.lower().endswith("transactions.csv"):
            return info.filename
    raise FileNotFoundError("No Transactions.csv file found inside archive.")


def write_parquet(archive_path: Path, chunksize: int, rebuild: bool) -> dict[str, Any]:
    if PROCESSED.exists() and not rebuild and any(PROCESSED.glob("year=*/*.parquet")):
        return {
            "status": "reused_existing_parquet",
            "path": str(PROCESSED),
        }

    if PROCESSED.exists():
        shutil.rmtree(PROCESSED)
    PROCESSED.mkdir(parents=True, exist_ok=True)

    part_counters: dict[int, int] = {}
    raw_rows = 0
    clean_sales_rows = 0
    skipped_rows = 0
    min_date: pd.Timestamp | None = None
    max_date: pd.Timestamp | None = None

    with zipfile.ZipFile(archive_path) as archive:
        member = find_transactions_member(archive)
        with archive.open(member) as raw:
            chunks = pd.read_csv(
                raw,
                usecols=USECOLS,
                dtype=str,
                chunksize=chunksize,
                encoding="utf-8",
                low_memory=False,
            )

            for chunk_index, chunk in enumerate(chunks, start=1):
                raw_rows += len(chunk)
                chunk.columns = [str(col).strip() for col in chunk.columns]

                for column in STRING_COLS:
                    chunk[column] = clean_text(chunk[column])

                chunk["instance_date"] = pd.to_datetime(
                    chunk["instance_date"],
                    format="%d-%m-%Y",
                    errors="coerce",
                )
                chunk["procedure_area_m2"] = safe_float(chunk["procedure_area"])
                chunk["actual_worth_aed"] = safe_float(chunk["actual_worth"])
                chunk["source_meter_sale_price_aed"] = safe_float(chunk["meter_sale_price"])
                chunk["rent_value_aed"] = safe_float(chunk["rent_value"])
                chunk["meter_rent_price_aed"] = safe_float(chunk["meter_rent_price"])
                chunk["has_parking"] = safe_float(chunk["has_parking"]).fillna(0).astype("int8")

                sales = chunk[
                    (chunk["trans_group_en"].str.lower() == "sales")
                    & chunk["instance_date"].notna()
                    & chunk["procedure_area_m2"].between(5, 200_000)
                    & chunk["actual_worth_aed"].between(10_000, 5_000_000_000)
                ].copy()

                if sales.empty:
                    skipped_rows += len(chunk)
                    continue

                calculated_price = sales["actual_worth_aed"] / sales["procedure_area_m2"]
                sales["price_per_m2_aed"] = sales["source_meter_sale_price_aed"].where(
                    sales["source_meter_sale_price_aed"].gt(0),
                    calculated_price,
                )
                sales = sales[sales["price_per_m2_aed"].between(10, 2_000_000)].copy()
                sales["year"] = sales["instance_date"].dt.year.astype("int16")
                sales["month"] = sales["instance_date"].dt.to_period("M").astype(str)
                sales["is_residential"] = sales["property_usage_en"].str.contains(
                    "Residential",
                    case=False,
                    na=False,
                )

                if sales.empty:
                    skipped_rows += len(chunk)
                    continue

                chunk_min = sales["instance_date"].min()
                chunk_max = sales["instance_date"].max()
                min_date = chunk_min if min_date is None else min(min_date, chunk_min)
                max_date = chunk_max if max_date is None else max(max_date, chunk_max)

                output = sales[
                    [
                        "transaction_id",
                        "instance_date",
                        "year",
                        "month",
                        "procedure_name_en",
                        "property_type_en",
                        "property_sub_type_en",
                        "property_usage_en",
                        "reg_type_en",
                        "is_residential",
                        "area_id",
                        "area_name_en",
                        "building_name_en",
                        "project_number",
                        "project_name_en",
                        "master_project_en",
                        "nearest_landmark_en",
                        "nearest_metro_en",
                        "nearest_mall_en",
                        "rooms_en",
                        "has_parking",
                        "procedure_area_m2",
                        "actual_worth_aed",
                        "price_per_m2_aed",
                        "rent_value_aed",
                        "meter_rent_price_aed",
                    ]
                ]

                for year, year_frame in output.groupby("year"):
                    year_int = int(year)
                    year_dir = PROCESSED / f"year={year_int}"
                    year_dir.mkdir(parents=True, exist_ok=True)
                    part = part_counters.get(year_int, 0)
                    table = pa.Table.from_pandas(year_frame, preserve_index=False)
                    pq.write_table(table, year_dir / f"part-{part:04d}.parquet")
                    part_counters[year_int] = part + 1

                clean_sales_rows += len(output)
                print(
                    f"chunk {chunk_index}: raw={len(chunk):,} clean_sales={len(output):,}"
                )

    return {
        "status": "rebuilt",
        "path": str(PROCESSED),
        "raw_rows_seen": raw_rows,
        "clean_sales_rows": clean_sales_rows,
        "skipped_rows_estimate": skipped_rows,
        "min_date": min_date.strftime("%Y-%m-%d") if min_date is not None else None,
        "max_date": max_date.strftime("%Y-%m-%d") if max_date is not None else None,
        "year_partitions": sorted(part_counters),
    }


def connect_market() -> duckdb.DuckDBPyConnection:
    source = str(PROCESSED / "year=*" / "*.parquet").replace("\\", "/")
    con = duckdb.connect()
    con.execute(
        f"""
        create or replace view dubai_sales as
        select *
        from read_parquet('{source}')
        """
    )
    return con


def records(con: duckdb.DuckDBPyConnection, sql: str) -> list[dict[str, Any]]:
    return con.execute(sql).fetchdf().to_dict("records")


def scalar(con: duckdb.DuckDBPyConnection, sql: str) -> Any:
    return con.execute(sql).fetchone()[0]


def copy_table(con: duckdb.DuckDBPyConnection, sql: str, filename: str) -> str:
    TABLES_DIR.mkdir(parents=True, exist_ok=True)
    target = TABLES_DIR / filename
    target_sql = str(target).replace("\\", "/")
    con.execute(f"COPY ({sql}) TO '{target_sql}' (HEADER, DELIMITER ',')")
    return str(target)


def build_tables_and_summary(parquet_result: dict[str, Any], archive_path: Path) -> dict[str, Any]:
    if TABLES_DIR.exists():
        shutil.rmtree(TABLES_DIR)
    TABLES_DIR.mkdir(parents=True, exist_ok=True)

    con = connect_market()
    coverage = records(
        con,
        """
        select
          count(*)::bigint as clean_sales_rows,
          min(instance_date)::date::varchar as min_date,
          max(instance_date)::date::varchar as max_date,
          min(year)::int as min_year,
          max(year)::int as max_year,
          count(distinct area_id)::bigint as areas,
          count(distinct nullif(project_number, ''))::bigint as projects,
          count(distinct property_type_en)::bigint as property_types,
          median(price_per_m2_aed)::double as median_price_per_m2_aed,
          median(actual_worth_aed)::double as median_actual_worth_aed,
          sum(actual_worth_aed)::double as total_sales_value_aed,
          sum(case when is_residential then 1 else 0 end)::bigint as residential_sales_rows
        from dubai_sales
        """,
    )[0]

    latest_full_year = scalar(
        con,
        """
        with months as (
          select year, count(distinct month) as month_count
          from dubai_sales
          group by year
        )
        select max(year)::int
        from months
        where month_count = 12
        """,
    )

    table_paths = {
        "area_year_stats": copy_table(
            con,
            """
            select
              year,
              area_id,
              area_name_en,
              property_type_en,
              is_residential,
              count(*)::bigint as transactions,
              median(price_per_m2_aed)::double as median_price_per_m2_aed,
              avg(price_per_m2_aed)::double as avg_price_per_m2_aed,
              median(actual_worth_aed)::double as median_actual_worth_aed,
              avg(procedure_area_m2)::double as avg_area_m2,
              sum(actual_worth_aed)::double as total_sales_value_aed
            from dubai_sales
            group by all
            order by year, area_name_en, property_type_en
            """,
            "dubai_area_year_stats.csv",
        ),
        "area_month_stats": copy_table(
            con,
            """
            select
              month,
              area_id,
              area_name_en,
              property_type_en,
              is_residential,
              count(*)::bigint as transactions,
              median(price_per_m2_aed)::double as median_price_per_m2_aed,
              median(actual_worth_aed)::double as median_actual_worth_aed,
              sum(actual_worth_aed)::double as total_sales_value_aed
            from dubai_sales
            group by all
            having count(*) >= 3
            order by month, area_name_en, property_type_en
            """,
            "dubai_area_month_stats.csv",
        ),
        "project_year_stats": copy_table(
            con,
            """
            select
              year,
              project_number,
              project_name_en,
              area_id,
              area_name_en,
              property_type_en,
              count(*)::bigint as transactions,
              median(price_per_m2_aed)::double as median_price_per_m2_aed,
              median(actual_worth_aed)::double as median_actual_worth_aed,
              sum(actual_worth_aed)::double as total_sales_value_aed
            from dubai_sales
            where nullif(project_number, '') is not null
               or nullif(project_name_en, '') is not null
            group by all
            having count(*) >= 3
            order by year, transactions desc
            """,
            "dubai_project_year_stats.csv",
        ),
        "property_type_year_stats": copy_table(
            con,
            """
            select
              year,
              property_type_en,
              property_usage_en,
              count(*)::bigint as transactions,
              median(price_per_m2_aed)::double as median_price_per_m2_aed,
              median(actual_worth_aed)::double as median_actual_worth_aed,
              avg(procedure_area_m2)::double as avg_area_m2,
              sum(actual_worth_aed)::double as total_sales_value_aed
            from dubai_sales
            group by all
            order by year, transactions desc
            """,
            "dubai_property_type_year_stats.csv",
        ),
        "area_scorecard": copy_table(
            con,
            f"""
            with yearly as (
              select
                year,
                area_id,
                area_name_en,
                property_type_en,
                count(*) as transactions,
                median(price_per_m2_aed) as median_price_per_m2_aed,
                median(actual_worth_aed) as median_actual_worth_aed,
                sum(actual_worth_aed) as total_sales_value_aed
              from dubai_sales
              where is_residential
              group by all
              having count(*) >= 10
            ),
            current_year as (
              select * from yearly where year = {int(latest_full_year)}
            ),
            previous_year as (
              select * from yearly where year = {int(latest_full_year) - 1}
            ),
            base_year as (
              select * from yearly where year = {int(latest_full_year) - 5}
            )
            select
              c.area_id,
              c.area_name_en,
              c.property_type_en,
              {int(latest_full_year)}::int as score_year,
              c.transactions,
              c.median_price_per_m2_aed,
              c.median_actual_worth_aed,
              c.total_sales_value_aed,
              p.median_price_per_m2_aed as previous_year_price_per_m2_aed,
              case
                when p.median_price_per_m2_aed > 0
                then (c.median_price_per_m2_aed / p.median_price_per_m2_aed - 1) * 100
              end as yoy_price_per_m2_pct,
              b.median_price_per_m2_aed as five_year_base_price_per_m2_aed,
              case
                when b.median_price_per_m2_aed > 0
                then (pow(c.median_price_per_m2_aed / b.median_price_per_m2_aed, 1.0 / 5) - 1) * 100
              end as five_year_cagr_pct,
              dense_rank() over (order by c.transactions desc) as liquidity_rank,
              dense_rank() over (order by c.total_sales_value_aed desc) as value_rank
            from current_year c
            left join previous_year p using(area_id, area_name_en, property_type_en)
            left join base_year b using(area_id, area_name_en, property_type_en)
            order by c.total_sales_value_aed desc
            """,
            "dubai_area_scorecard.csv",
        ),
    }

    by_year = records(
        con,
        """
        select
          year,
          property_type_en,
          count(*)::bigint as transactions,
          median(price_per_m2_aed)::double as median_price_per_m2_aed,
          median(actual_worth_aed)::double as median_actual_worth_aed,
          sum(actual_worth_aed)::double as total_sales_value_aed
        from dubai_sales
        group by all
        order by year, property_type_en
        """,
    )

    top_areas = records(
        con,
        """
        select *
        from read_csv_auto(?)
        order by total_sales_value_aed desc
        limit 40
        """,
    ) if False else []

    area_scorecard_path = table_paths["area_scorecard"].replace("\\", "/")
    top_areas = records(
        con,
        f"""
        select *
        from read_csv_auto('{area_scorecard_path}')
        order by total_sales_value_aed desc
        limit 40
        """,
    )

    top_projects = records(
        con,
        f"""
        select *
        from read_csv_auto('{table_paths["project_year_stats"].replace("\\", "/")}')
        where year = {int(latest_full_year)}
        order by total_sales_value_aed desc
        limit 30
        """,
    )

    source_size = archive_path.stat().st_size if archive_path.exists() else None
    parquet_files = list(PROCESSED.glob("year=*/*.parquet"))
    parquet_bytes = sum(path.stat().st_size for path in parquet_files)

    summary = clean_for_json({
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {
            "name": "Dubai Real Estate Transactions archive",
            "publisher": "Dubai Land Department source mirrored through Kaggle archive",
            "local_archive_path": str(archive_path),
            "archive_size_bytes": source_size,
            "legal_note": (
                "Use as historical research/training seed. For production-grade current decisions, "
                "refresh against DLD/Dubai Pulse official feeds and preserve source attribution."
            ),
        },
        "pipeline": {
            "parquet_result": parquet_result,
            "parquet_path": str(PROCESSED),
            "parquet_file_count": len(parquet_files),
            "parquet_size_bytes": parquet_bytes,
            "tables_dir": str(TABLES_DIR),
            "table_paths": table_paths,
            "latest_full_year": int(latest_full_year),
        },
        "coverage": coverage,
        "by_year": by_year,
        "top_areas": top_areas,
        "top_projects": top_projects,
        "caveats": [
            "The archive ends on 2023-03-17, so 2023 is partial.",
            "Scorecards use the latest complete year to avoid partial-year distortion.",
            "Rows are filtered to sales with valid date, area, value, and price per square meter.",
            "Dubai Pulse/DLD official refresh is still needed for 2023-present production freshness.",
        ],
    })

    with OUTPUT_JSON.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, ensure_ascii=True, default=json_default, allow_nan=False)
        handle.write("\n")

    with CATALOG_JSON.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, ensure_ascii=True, default=json_default, allow_nan=False)
        handle.write("\n")

    schema_sql = TABLES_DIR / "dubai_market_tables_schema.sql"
    schema_sql.write_text(
        """-- FonatProp Dubai market tables generated from the historical transactions archive.
-- Load CSV outputs with \\copy or your preferred Postgres/Supabase bulk loader.

create table if not exists dubai_area_year_stats (
  year integer,
  area_id text,
  area_name_en text,
  property_type_en text,
  is_residential boolean,
  transactions bigint,
  median_price_per_m2_aed double precision,
  avg_price_per_m2_aed double precision,
  median_actual_worth_aed double precision,
  avg_area_m2 double precision,
  total_sales_value_aed double precision
);

create table if not exists dubai_area_month_stats (
  month text,
  area_id text,
  area_name_en text,
  property_type_en text,
  is_residential boolean,
  transactions bigint,
  median_price_per_m2_aed double precision,
  median_actual_worth_aed double precision,
  total_sales_value_aed double precision
);

create table if not exists dubai_project_year_stats (
  year integer,
  project_number text,
  project_name_en text,
  area_id text,
  area_name_en text,
  property_type_en text,
  transactions bigint,
  median_price_per_m2_aed double precision,
  median_actual_worth_aed double precision,
  total_sales_value_aed double precision
);

create table if not exists dubai_property_type_year_stats (
  year integer,
  property_type_en text,
  property_usage_en text,
  transactions bigint,
  median_price_per_m2_aed double precision,
  median_actual_worth_aed double precision,
  avg_area_m2 double precision,
  total_sales_value_aed double precision
);

create table if not exists dubai_area_scorecard (
  area_id text,
  area_name_en text,
  property_type_en text,
  score_year integer,
  transactions bigint,
  median_price_per_m2_aed double precision,
  median_actual_worth_aed double precision,
  total_sales_value_aed double precision,
  previous_year_price_per_m2_aed double precision,
  yoy_price_per_m2_pct double precision,
  five_year_base_price_per_m2_aed double precision,
  five_year_cagr_pct double precision,
  liquidity_rank bigint,
  value_rank bigint
);
""",
        encoding="utf-8",
    )

    DOC_PATH.write_text(
        f"""# FonatProp Dubai Transactions Ingestion - 2026-05-01

Processed source: `{archive_path}`

## Result

- Clean sales rows: {coverage["clean_sales_rows"]:,}
- Residential sales rows: {coverage["residential_sales_rows"]:,}
- Date range: {coverage["min_date"]} to {coverage["max_date"]}
- Areas: {coverage["areas"]:,}
- Projects: {coverage["projects"]:,}
- Latest complete score year: {int(latest_full_year)}
- Parquet files: {len(parquet_files):,}
- Parquet size: {parquet_bytes:,} bytes

## Data Lake Outputs

- Parquet: `{PROCESSED}`
- Tables: `{TABLES_DIR}`
- Postgres schema: `{schema_sql}`
- App JSON: `{OUTPUT_JSON}`

## Tables

- `dubai_area_year_stats.csv`
- `dubai_area_month_stats.csv`
- `dubai_project_year_stats.csv`
- `dubai_property_type_year_stats.csv`
- `dubai_area_scorecard.csv`

## Production Note

This is valuable historical intelligence for FonatProp Dubai investment, radar,
map and valuation features. It is not a replacement for a current DLD/Dubai
Pulse feed. Treat it as the historical layer, then append official refreshed
transactions and Ejari/rental data when access is stable.
""",
        encoding="utf-8",
    )

    return summary


def main() -> int:
    args = parse_args()
    archive_path = args.archive.expanduser().resolve()
    if not archive_path.exists():
        raise FileNotFoundError(f"Archive not found: {archive_path}")

    parquet_result = write_parquet(archive_path, args.chunksize, args.rebuild)
    summary = build_tables_and_summary(parquet_result, archive_path)

    print(f"Clean sales rows: {summary['coverage']['clean_sales_rows']:,}")
    print(f"Residential sales rows: {summary['coverage']['residential_sales_rows']:,}")
    print(f"Date range: {summary['coverage']['min_date']} to {summary['coverage']['max_date']}")
    print(f"Areas: {summary['coverage']['areas']:,}")
    print(f"Projects: {summary['coverage']['projects']:,}")
    print(f"Parquet: {PROCESSED}")
    print(f"Tables: {TABLES_DIR}")
    print(f"App JSON: {OUTPUT_JSON.relative_to(APP_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
