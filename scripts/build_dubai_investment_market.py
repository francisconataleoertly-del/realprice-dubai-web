from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import duckdb
import pandas as pd


APP_ROOT = Path(__file__).resolve().parents[1]
DATA_LAKE = APP_ROOT.parent.parent
HISTORICAL_PARQUET = DATA_LAKE / "90_processed" / "dubai_transactions_parquet"
LIVE_MANIFEST = APP_ROOT / "data" / "catalog" / "dubai_live_transactions_manifest.json"
OUTPUT_DIR = DATA_LAKE / "90_processed" / "dubai_investment_market"
OUTPUT_JSON = APP_ROOT / "src" / "data" / "dubai-investment-market.json"
CATALOG_JSON = APP_ROOT / "data" / "catalog" / "dubai_investment_market_manifest.json"
DOC_PATH = APP_ROOT / "docs" / "fonatprop-dubai-investment-market-2026-05-01.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build Dubai investment market tables from historical DLD archive plus live DLD exports."
    )
    parser.add_argument(
        "--historical-parquet",
        type=Path,
        default=HISTORICAL_PARQUET,
        help="Partitioned parquet directory from build_dubai_transactions_market.py.",
    )
    parser.add_argument(
        "--live-csv",
        type=Path,
        help="DLD live open-data export CSV. Defaults to the latest live manifest export.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=OUTPUT_DIR,
        help="Output directory for investment CSV tables.",
    )
    return parser.parse_args()


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


def sql_path(path: Path) -> str:
    return str(path).replace("\\", "/").replace("'", "''")


def get_live_csv(default_manifest: Path, explicit_path: Path | None) -> Path:
    if explicit_path:
        if not explicit_path.exists():
            raise FileNotFoundError(explicit_path)
        return explicit_path

    if default_manifest.exists():
        manifest = json.loads(default_manifest.read_text(encoding="utf-8"))
        csv_path = manifest.get("outputs", {}).get("dld_export_csv")
        if csv_path and Path(csv_path).exists():
            return Path(csv_path)

    candidates = sorted(
        (DATA_LAKE / "90_processed" / "dubai_live_transactions").glob("*_dld_export.csv"),
        key=lambda item: (item.stat().st_mtime, item.stat().st_size),
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError(
            "No live DLD CSV export found. Run harvest_dubai_open_data_transactions.py first."
        )
    return candidates[0]


def records(con: duckdb.DuckDBPyConnection, sql: str) -> list[dict[str, Any]]:
    return con.execute(sql).fetchdf().to_dict("records")


def scalar(con: duckdb.DuckDBPyConnection, sql: str) -> Any:
    return con.execute(sql).fetchone()[0]


def copy_table(con: duckdb.DuckDBPyConnection, sql: str, filename: str, output_dir: Path) -> str:
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / filename
    con.execute(f"COPY ({sql}) TO '{sql_path(target)}' (HEADER, DELIMITER ',')")
    return str(target)


def build_views(con: duckdb.DuckDBPyConnection, historical_parquet: Path, live_csv: Path) -> None:
    historical_source = sql_path(historical_parquet / "year=*" / "*.parquet")
    live_source = sql_path(live_csv)

    con.execute(
        f"""
        create or replace view historical_sales_raw as
        select
          'historical_archive' as source_layer,
          1 as source_priority,
          transaction_id::varchar as transaction_id,
          instance_date::timestamp as instance_date,
          year::int as year,
          month::varchar as month,
          procedure_name_en::varchar as procedure_name_en,
          property_type_en::varchar as property_type_en,
          property_sub_type_en::varchar as property_sub_type_en,
          property_usage_en::varchar as property_usage_en,
          reg_type_en::varchar as reg_type_en,
          is_residential::boolean as is_residential,
          area_id::varchar as area_id,
          area_name_en::varchar as area_name_en,
          project_number::varchar as project_number,
          project_name_en::varchar as project_name_en,
          master_project_en::varchar as master_project_en,
          nearest_landmark_en::varchar as nearest_landmark_en,
          nearest_metro_en::varchar as nearest_metro_en,
          nearest_mall_en::varchar as nearest_mall_en,
          rooms_en::varchar as rooms_en,
          has_parking::boolean as has_parking,
          procedure_area_m2::double as procedure_area_m2,
          actual_worth_aed::double as actual_worth_aed,
          price_per_m2_aed::double as price_per_m2_aed
        from read_parquet('{historical_source}')
        """
    )

    con.execute(
        f"""
        create or replace view live_sales_raw as
        select
          'dld_live_open_data' as source_layer,
          2 as source_priority,
          cast("Transaction Number" as varchar) as transaction_id,
          coalesce(
            try_cast("Transaction Date" as timestamp),
            try_strptime(cast("Transaction Date" as varchar), '%Y-%m-%d %H:%M:%S')
          ) as instance_date,
          extract(year from coalesce(
            try_cast("Transaction Date" as timestamp),
            try_strptime(cast("Transaction Date" as varchar), '%Y-%m-%d %H:%M:%S')
          ))::int as year,
          strftime(coalesce(
            try_cast("Transaction Date" as timestamp),
            try_strptime(cast("Transaction Date" as varchar), '%Y-%m-%d %H:%M:%S')
          ), '%Y-%m') as month,
          cast("Transaction sub type" as varchar) as procedure_name_en,
          cast("Property Type" as varchar) as property_type_en,
          cast("Property Sub Type" as varchar) as property_sub_type_en,
          cast("Usage" as varchar) as property_usage_en,
          cast("Registration type" as varchar) as reg_type_en,
          cast("Usage" as varchar) ilike '%Residential%' as is_residential,
          '' as area_id,
          cast("Area" as varchar) as area_name_en,
          '' as project_number,
          cast("Project" as varchar) as project_name_en,
          cast("Master Project" as varchar) as master_project_en,
          cast("Nearest Landmark" as varchar) as nearest_landmark_en,
          cast("Nearest Metro" as varchar) as nearest_metro_en,
          cast("Nearest Mall" as varchar) as nearest_mall_en,
          cast("Room(s)" as varchar) as rooms_en,
          case
            when nullif(cast("Parking" as varchar), '') is null then false
            when try_cast("Parking" as int) > 0 then true
            else false
          end as has_parking,
          try_cast(replace(cast("Transaction Size (sq.m)" as varchar), ',', '') as double) as procedure_area_m2,
          try_cast(replace(cast("Amount" as varchar), ',', '') as double) as actual_worth_aed,
          try_cast(replace(cast("Amount" as varchar), ',', '') as double)
            / nullif(try_cast(replace(cast("Transaction Size (sq.m)" as varchar), ',', '') as double), 0)
            as price_per_m2_aed
        from read_csv_auto('{live_source}', header=true, ignore_errors=true)
        where cast("Transaction Type" as varchar) = 'Sales'
        """
    )

    con.execute(
        """
        create or replace view combined_sales as
        with raw as (
          select * from historical_sales_raw
          union all
          select * from live_sales_raw
        ),
        cleaned as (
          select
            *,
            regexp_replace(upper(trim(coalesce(area_name_en, ''))), '[^A-Z0-9]+', '', 'g') as area_key,
            regexp_replace(upper(trim(coalesce(project_name_en, ''))), '[^A-Z0-9]+', '', 'g') as project_key,
            case
              when transaction_id is null or trim(transaction_id) = ''
              then source_layer || ':' || coalesce(cast(instance_date as varchar), '') || ':' ||
                   coalesce(area_name_en, '') || ':' || coalesce(project_name_en, '') || ':' ||
                   coalesce(cast(actual_worth_aed as varchar), '')
              else trim(transaction_id)
            end as dedupe_key
          from raw
          where instance_date is not null
            and actual_worth_aed between 10000 and 5000000000
            and procedure_area_m2 between 5 and 200000
            and price_per_m2_aed between 10 and 2000000
            and nullif(trim(coalesce(area_name_en, '')), '') is not null
        )
        select * exclude(dedupe_key, source_priority)
        from cleaned
        qualify row_number() over(partition by dedupe_key order by source_priority desc) = 1
        """
    )


def latest_complete_historical_year(con: duckdb.DuckDBPyConnection) -> int:
    return int(
        scalar(
            con,
            """
            with months as (
              select year, count(distinct month) as month_count
              from combined_sales
              where source_layer = 'historical_archive'
              group by year
            )
            select max(year)::int
            from months
            where month_count = 12
            """,
        )
    )


def build_outputs(
    con: duckdb.DuckDBPyConnection,
    output_dir: Path,
    historical_parquet: Path,
    live_csv: Path,
) -> dict[str, Any]:
    if output_dir.exists():
        for child in output_dir.iterdir():
            if child.is_file():
                child.unlink()
    output_dir.mkdir(parents=True, exist_ok=True)

    latest_full_year = latest_complete_historical_year(con)
    latest_live_year = int(
        scalar(
            con,
            """
            select max(year)::int
            from combined_sales
            where source_layer = 'dld_live_open_data'
            """,
        )
    )
    base_year = latest_full_year - 5

    table_paths = {
        "area_year_stats": copy_table(
            con,
            """
            select
              year,
              area_key,
              any_value(area_name_en) as area_name_en,
              property_type_en,
              is_residential,
              count(*)::bigint as transactions,
              median(price_per_m2_aed)::double as median_price_per_m2_aed,
              avg(price_per_m2_aed)::double as avg_price_per_m2_aed,
              quantile_cont(price_per_m2_aed, 0.25)::double as p25_price_per_m2_aed,
              quantile_cont(price_per_m2_aed, 0.75)::double as p75_price_per_m2_aed,
              median(actual_worth_aed)::double as median_actual_worth_aed,
              avg(procedure_area_m2)::double as avg_area_m2,
              sum(actual_worth_aed)::double as total_sales_value_aed,
              min(instance_date)::date::varchar as first_transaction_date,
              max(instance_date)::date::varchar as last_transaction_date,
              string_agg(distinct source_layer, '|') as source_layers
            from combined_sales
            group by year, area_key, property_type_en, is_residential
            order by year, area_name_en, property_type_en
            """,
            "dubai_investment_area_year_stats.csv",
            output_dir,
        ),
        "area_month_stats": copy_table(
            con,
            """
            select
              month,
              area_key,
              any_value(area_name_en) as area_name_en,
              property_type_en,
              is_residential,
              count(*)::bigint as transactions,
              median(price_per_m2_aed)::double as median_price_per_m2_aed,
              median(actual_worth_aed)::double as median_actual_worth_aed,
              sum(actual_worth_aed)::double as total_sales_value_aed,
              min(instance_date)::date::varchar as first_transaction_date,
              max(instance_date)::date::varchar as last_transaction_date,
              string_agg(distinct source_layer, '|') as source_layers
            from combined_sales
            group by month, area_key, property_type_en, is_residential
            having count(*) >= 3
            order by month, area_name_en, property_type_en
            """,
            "dubai_investment_area_month_stats.csv",
            output_dir,
        ),
        "project_year_stats": copy_table(
            con,
            """
            select
              year,
              project_key,
              any_value(project_name_en) as project_name_en,
              area_key,
              any_value(area_name_en) as area_name_en,
              property_type_en,
              count(*)::bigint as transactions,
              median(price_per_m2_aed)::double as median_price_per_m2_aed,
              median(actual_worth_aed)::double as median_actual_worth_aed,
              avg(procedure_area_m2)::double as avg_area_m2,
              sum(actual_worth_aed)::double as total_sales_value_aed,
              min(instance_date)::date::varchar as first_transaction_date,
              max(instance_date)::date::varchar as last_transaction_date,
              string_agg(distinct source_layer, '|') as source_layers
            from combined_sales
            where nullif(project_key, '') is not null
            group by year, project_key, area_key, property_type_en
            having count(*) >= 3
            order by year, transactions desc
            """,
            "dubai_investment_project_year_stats.csv",
            output_dir,
        ),
        "area_investment_signals": copy_table(
            con,
            f"""
            with yearly as (
              select
                year,
                area_key,
                any_value(area_name_en) as area_name_en,
                property_type_en,
                count(*)::bigint as transactions,
                median(price_per_m2_aed)::double as median_price_per_m2_aed,
                median(actual_worth_aed)::double as median_actual_worth_aed,
                sum(actual_worth_aed)::double as total_sales_value_aed
              from combined_sales
              where is_residential
              group by year, area_key, property_type_en
              having count(*) >= 5
            ),
            hist_current as (
              select * from yearly where year = {latest_full_year}
            ),
            hist_previous as (
              select * from yearly where year = {latest_full_year - 1}
            ),
            hist_base as (
              select * from yearly where year = {base_year}
            ),
            live_current as (
              select * from yearly where year = {latest_live_year}
            ),
            signals as (
              select
                coalesce(l.area_key, h.area_key) as area_key,
                coalesce(l.area_name_en, h.area_name_en) as area_name_en,
                coalesce(l.property_type_en, h.property_type_en) as property_type_en,
                {latest_full_year}::int as historical_full_year,
                {latest_live_year}::int as live_year,
                h.transactions as historical_transactions,
                h.median_price_per_m2_aed as historical_median_price_per_m2_aed,
                h.total_sales_value_aed as historical_total_sales_value_aed,
                hp.median_price_per_m2_aed as previous_year_price_per_m2_aed,
                case
                  when hp.median_price_per_m2_aed > 0 and h.median_price_per_m2_aed is not null
                  then (h.median_price_per_m2_aed / hp.median_price_per_m2_aed - 1) * 100
                end as historical_yoy_price_per_m2_pct,
                hb.median_price_per_m2_aed as five_year_base_price_per_m2_aed,
                case
                  when hb.median_price_per_m2_aed > 0 and h.median_price_per_m2_aed is not null
                  then (pow(h.median_price_per_m2_aed / hb.median_price_per_m2_aed, 1.0 / 5) - 1) * 100
                end as historical_five_year_cagr_pct,
                l.transactions as live_transactions,
                l.median_price_per_m2_aed as live_median_price_per_m2_aed,
                l.median_actual_worth_aed as live_median_actual_worth_aed,
                l.total_sales_value_aed as live_total_sales_value_aed,
                case
                  when h.median_price_per_m2_aed > 0 and l.median_price_per_m2_aed is not null
                  then (l.median_price_per_m2_aed / h.median_price_per_m2_aed - 1) * 100
                end as live_vs_historical_price_per_m2_pct
              from live_current l
              full outer join hist_current h using(area_key, property_type_en)
              left join hist_previous hp on h.area_key = hp.area_key and h.property_type_en = hp.property_type_en
              left join hist_base hb on h.area_key = hb.area_key and h.property_type_en = hb.property_type_en
            )
            select
              *,
              case
                when coalesce(live_transactions, 0) >= 100 and coalesce(historical_transactions, 0) >= 100 then 0.85
                when coalesce(live_transactions, 0) >= 40 and coalesce(historical_transactions, 0) >= 40 then 0.70
                when coalesce(live_transactions, 0) >= 10 or coalesce(historical_transactions, 0) >= 50 then 0.50
                else 0.30
              end as confidence_score,
              case
                when coalesce(live_transactions, 0) >= 100 and coalesce(historical_transactions, 0) >= 100 then 'high'
                when coalesce(live_transactions, 0) >= 40 and coalesce(historical_transactions, 0) >= 40 then 'medium'
                when coalesce(live_transactions, 0) >= 10 or coalesce(historical_transactions, 0) >= 50 then 'watch'
                else 'thin'
              end as confidence_label,
              case
                when coalesce(live_transactions, 0) < 10 then 'watchlist_only'
                when historical_median_price_per_m2_aed is null and live_transactions >= 20 then 'new_live_market'
                when live_vs_historical_price_per_m2_pct > 35 and historical_five_year_cagr_pct > 5 then 'premium_momentum'
                when live_vs_historical_price_per_m2_pct > 15 and live_transactions >= 40 then 'active_repricing'
                when live_vs_historical_price_per_m2_pct between -10 and 15 and historical_five_year_cagr_pct > 4 then 'steady_compounder'
                when live_vs_historical_price_per_m2_pct < -15 then 'value_reset_check_quality'
                else 'neutral'
              end as investment_signal,
              dense_rank() over(order by coalesce(live_total_sales_value_aed, 0) desc) as live_value_rank,
              dense_rank() over(order by coalesce(live_transactions, 0) desc) as live_liquidity_rank
            from signals
            order by confidence_score desc, live_total_sales_value_aed desc nulls last
            """,
            "dubai_investment_area_signals.csv",
            output_dir,
        ),
        "project_investment_signals": copy_table(
            con,
            f"""
            with yearly as (
              select
                year,
                project_key,
                any_value(project_name_en) as project_name_en,
                area_key,
                any_value(area_name_en) as area_name_en,
                property_type_en,
                count(*)::bigint as transactions,
                median(price_per_m2_aed)::double as median_price_per_m2_aed,
                median(actual_worth_aed)::double as median_actual_worth_aed,
                sum(actual_worth_aed)::double as total_sales_value_aed
              from combined_sales
              where is_residential and nullif(project_key, '') is not null
              group by year, project_key, area_key, property_type_en
              having count(*) >= 3
            ),
            hist_current as (
              select * from yearly where year = {latest_full_year}
            ),
            live_current as (
              select * from yearly where year = {latest_live_year}
            ),
            signals as (
              select
                coalesce(l.project_key, h.project_key) as project_key,
                coalesce(l.project_name_en, h.project_name_en) as project_name_en,
                coalesce(l.area_key, h.area_key) as area_key,
                coalesce(l.area_name_en, h.area_name_en) as area_name_en,
                coalesce(l.property_type_en, h.property_type_en) as property_type_en,
                {latest_full_year}::int as historical_full_year,
                {latest_live_year}::int as live_year,
                h.transactions as historical_transactions,
                h.median_price_per_m2_aed as historical_median_price_per_m2_aed,
                h.total_sales_value_aed as historical_total_sales_value_aed,
                l.transactions as live_transactions,
                l.median_price_per_m2_aed as live_median_price_per_m2_aed,
                l.median_actual_worth_aed as live_median_actual_worth_aed,
                l.total_sales_value_aed as live_total_sales_value_aed,
                case
                  when h.median_price_per_m2_aed > 0 and l.median_price_per_m2_aed is not null
                  then (l.median_price_per_m2_aed / h.median_price_per_m2_aed - 1) * 100
                end as live_vs_historical_price_per_m2_pct
              from live_current l
              full outer join hist_current h using(project_key, area_key, property_type_en)
            )
            select
              *,
              case
                when coalesce(live_transactions, 0) >= 30 and coalesce(historical_transactions, 0) >= 30 then 0.80
                when coalesce(live_transactions, 0) >= 12 and coalesce(historical_transactions, 0) >= 12 then 0.65
                when coalesce(live_transactions, 0) >= 6 then 0.50
                else 0.30
              end as confidence_score,
              case
                when coalesce(live_transactions, 0) >= 30 and coalesce(historical_transactions, 0) >= 30 then 'high'
                when coalesce(live_transactions, 0) >= 12 and coalesce(historical_transactions, 0) >= 12 then 'medium'
                when coalesce(live_transactions, 0) >= 6 then 'watch'
                else 'thin'
              end as confidence_label,
              case
                when coalesce(live_transactions, 0) < 6 then 'watchlist_only'
                when historical_median_price_per_m2_aed is null and live_transactions >= 6 then 'new_live_project'
                when live_vs_historical_price_per_m2_pct > 25 and live_transactions >= 12 then 'project_repricing'
                when live_vs_historical_price_per_m2_pct < -15 then 'discount_or_mix_shift'
                else 'neutral'
              end as investment_signal,
              dense_rank() over(order by coalesce(live_total_sales_value_aed, 0) desc) as live_value_rank,
              dense_rank() over(order by coalesce(live_transactions, 0) desc) as live_liquidity_rank
            from signals
            order by confidence_score desc, live_total_sales_value_aed desc nulls last
            """,
            "dubai_investment_project_signals.csv",
            output_dir,
        ),
    }

    coverage = records(
        con,
        """
        select
          count(*)::bigint as combined_sales_rows,
          sum(case when source_layer = 'historical_archive' then 1 else 0 end)::bigint as historical_sales_rows,
          sum(case when source_layer = 'dld_live_open_data' then 1 else 0 end)::bigint as live_sales_rows,
          min(instance_date)::date::varchar as min_date,
          max(instance_date)::date::varchar as max_date,
          min(case when source_layer = 'dld_live_open_data' then instance_date end)::date::varchar as live_min_date,
          max(case when source_layer = 'dld_live_open_data' then instance_date end)::date::varchar as live_max_date,
          count(distinct area_key)::bigint as areas,
          count(distinct nullif(project_key, ''))::bigint as projects,
          median(price_per_m2_aed)::double as median_price_per_m2_aed,
          sum(actual_worth_aed)::double as total_sales_value_aed
        from combined_sales
        """,
    )[0]

    source_layers = records(
        con,
        """
        select
          source_layer,
          count(*)::bigint as rows,
          min(instance_date)::date::varchar as min_date,
          max(instance_date)::date::varchar as max_date,
          count(distinct area_key)::bigint as areas,
          count(distinct nullif(project_key, ''))::bigint as projects,
          sum(actual_worth_aed)::double as total_sales_value_aed
        from combined_sales
        group by source_layer
        order by source_layer
        """,
    )

    by_year = records(
        con,
        """
        select
          year,
          source_layer,
          property_type_en,
          count(*)::bigint as transactions,
          median(price_per_m2_aed)::double as median_price_per_m2_aed,
          sum(actual_worth_aed)::double as total_sales_value_aed
        from combined_sales
        group by all
        order by year, source_layer, property_type_en
        """,
    )

    top_area_signals = records(
        con,
        f"""
        select *
        from read_csv_auto('{sql_path(Path(table_paths["area_investment_signals"]))}')
        where live_transactions is not null
        order by confidence_score desc, live_total_sales_value_aed desc
        limit 50
        """,
    )

    top_project_signals = records(
        con,
        f"""
        select *
        from read_csv_auto('{sql_path(Path(table_paths["project_investment_signals"]))}')
        where live_transactions is not null
        order by confidence_score desc, live_total_sales_value_aed desc
        limit 50
        """,
    )

    live_area_pulse = records(
        con,
        f"""
        select
          area_name_en,
          property_type_en,
          live_transactions,
          live_median_price_per_m2_aed,
          live_total_sales_value_aed,
          confidence_label,
          investment_signal,
          live_value_rank,
          live_liquidity_rank
        from read_csv_auto('{sql_path(Path(table_paths["area_investment_signals"]))}')
        where live_transactions is not null
        order by live_total_sales_value_aed desc
        limit 20
        """,
    )

    table_file_stats = {
        name: {
            "path": path,
            "bytes": Path(path).stat().st_size,
        }
        for name, path in table_paths.items()
    }

    return clean_for_json(
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "market": "dubai",
            "purpose": "Investment market intelligence combining historical DLD transaction archive with live DLD open-data exports.",
            "source": {
                "historical": {
                    "name": "Dubai Real Estate Transactions archive",
                    "publisher": "Dubai Land Department source mirrored through Kaggle archive",
                    "coverage_note": "Historical archive currently ends on 2023-03-17.",
                },
                "live": {
                    "name": "Dubai Land Department Real Estate Data",
                    "publisher": "Dubai Land Department",
                    "source_page": "https://dubailand.gov.ae/en/open-data/real-estate-data/",
                    "csv_file": str(live_csv),
                    "coverage_note": "Live DLD public page is current-year oriented; previous-year data is referred to Dubai Pulse.",
                },
            },
            "pipeline": {
                "historical_parquet": str(historical_parquet),
                "tables_dir": str(output_dir),
                "table_paths": table_file_stats,
                "latest_full_historical_year": latest_full_year,
                "latest_live_year": latest_live_year,
                "comparison_base_year": latest_full_year,
                "historical_cagr_base_year": base_year,
            },
            "coverage": coverage,
            "source_layers": source_layers,
            "by_year": by_year,
            "top_area_signals": top_area_signals,
            "top_project_signals": top_project_signals,
            "live_area_pulse": live_area_pulse,
            "caveats": [
                "2023 remains partial in the historical archive.",
                "The live DLD export harvested in this run covers April 2026 and is partial-year data.",
                "The 2024-2025 gap still needs Dubai Pulse or partner/API access for continuous annual history.",
                "Live-vs-historical percentages compare current live observations to the latest complete historical year and should be treated as direction, not a final forecast.",
                "Investment signals are ranking aids; final buy/rent/Airbnb decisions still need rent, service charge, financing and legal-rule layers.",
            ],
        }
    )


def write_schema(output_dir: Path) -> None:
    (output_dir / "dubai_investment_market_schema.sql").write_text(
        """-- FonatProp Dubai investment market tables.
-- Built from historical DLD archive parquet plus live DLD open-data CSV exports.

create table if not exists dubai_investment_area_year_stats (
  year integer,
  area_key text,
  area_name_en text,
  property_type_en text,
  is_residential boolean,
  transactions bigint,
  median_price_per_m2_aed double precision,
  avg_price_per_m2_aed double precision,
  p25_price_per_m2_aed double precision,
  p75_price_per_m2_aed double precision,
  median_actual_worth_aed double precision,
  avg_area_m2 double precision,
  total_sales_value_aed double precision,
  first_transaction_date date,
  last_transaction_date date,
  source_layers text
);

create table if not exists dubai_investment_area_signals (
  area_key text,
  area_name_en text,
  property_type_en text,
  historical_full_year integer,
  live_year integer,
  historical_transactions bigint,
  historical_median_price_per_m2_aed double precision,
  historical_total_sales_value_aed double precision,
  previous_year_price_per_m2_aed double precision,
  historical_yoy_price_per_m2_pct double precision,
  five_year_base_price_per_m2_aed double precision,
  historical_five_year_cagr_pct double precision,
  live_transactions bigint,
  live_median_price_per_m2_aed double precision,
  live_median_actual_worth_aed double precision,
  live_total_sales_value_aed double precision,
  live_vs_historical_price_per_m2_pct double precision,
  confidence_score double precision,
  confidence_label text,
  investment_signal text,
  live_value_rank bigint,
  live_liquidity_rank bigint
);
""",
        encoding="utf-8",
    )


def write_doc(summary: dict[str, Any]) -> None:
    coverage = summary["coverage"]
    live = next((item for item in summary["source_layers"] if item["source_layer"] == "dld_live_open_data"), {})
    DOC_PATH.write_text(
        f"""# FonatProp Dubai Investment Market

Created: {summary["generated_at"]}

## Result

The Dubai investment layer now combines:

- Historical DLD archive rows: {coverage["historical_sales_rows"]:,}
- Live DLD open-data sales rows: {coverage["live_sales_rows"]:,}
- Combined cleaned sales rows: {coverage["combined_sales_rows"]:,}

Live coverage in this run:

- Date range: {live.get("min_date")} to {live.get("max_date")}
- Areas: {live.get("areas")}
- Projects: {live.get("projects")}
- Sales value: AED {round(float(live.get("total_sales_value_aed") or 0), 2):,}

## Outputs

- Data lake tables: `{summary["pipeline"]["tables_dir"]}`
- App JSON: `src/data/dubai-investment-market.json`
- Catalog: `data/catalog/dubai_investment_market_manifest.json`
- API route: `/api/dubai/investment`

## Important Caveat

The historical archive ends in March 2023 and the live DLD export is April
2026. That gives FonatProp a real current market layer, but the 2024-2025 bridge
still needs Dubai Pulse or approved API/partner access before the module should
make confident multi-year forecasts.
""",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    live_csv = get_live_csv(LIVE_MANIFEST, args.live_csv)
    if not args.historical_parquet.exists():
        raise FileNotFoundError(args.historical_parquet)

    con = duckdb.connect()
    build_views(con, args.historical_parquet, live_csv)
    summary = build_outputs(con, args.output_dir, args.historical_parquet, live_csv)
    write_schema(args.output_dir)

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_JSON.parent.mkdir(parents=True, exist_ok=True)
    DOC_PATH.parent.mkdir(parents=True, exist_ok=True)

    OUTPUT_JSON.write_text(
        json.dumps(summary, indent=2, ensure_ascii=True, default=json_default, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    CATALOG_JSON.write_text(
        json.dumps(summary, indent=2, ensure_ascii=True, default=json_default, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    write_doc(summary)

    print(f"live_csv={live_csv}")
    print(f"tables_dir={args.output_dir}")
    print(f"app_json={OUTPUT_JSON}")
    print(f"catalog={CATALOG_JSON}")
    print(f"doc={DOC_PATH}")
    print(
        "coverage="
        + json.dumps(
            {
                "combined_sales_rows": summary["coverage"]["combined_sales_rows"],
                "historical_sales_rows": summary["coverage"]["historical_sales_rows"],
                "live_sales_rows": summary["coverage"]["live_sales_rows"],
                "latest_full_historical_year": summary["pipeline"]["latest_full_historical_year"],
                "latest_live_year": summary["pipeline"]["latest_live_year"],
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
