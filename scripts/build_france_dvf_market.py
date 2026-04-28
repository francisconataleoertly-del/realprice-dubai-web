from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path

import duckdb
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


DATA_LAKE = Path(r"C:\Users\franc\FonatProp_Data_Lake")
FRANCE_RAW = DATA_LAKE / "02_france"
PROCESSED = DATA_LAKE / "90_processed" / "france_dvf_residential_parquet"
OUTPUT = Path("src/data/france-dvf-market.json")

USECOLS = [
    "Date mutation",
    "Nature mutation",
    "Valeur fonciere",
    "Code postal",
    "Commune",
    "Code departement",
    "Code commune",
    "Type local",
    "Surface reelle bati",
    "Nombre pieces principales",
]


def slugify(value: str) -> str:
    return (
        value.lower()
        .replace(" ", "-")
        .replace("'", "-")
        .replace("’", "-")
        .replace("/", "-")
    )


def to_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(
        series.astype(str).str.replace(",", ".", regex=False).str.strip(),
        errors="coerce",
    )


def build_parquet() -> None:
    if PROCESSED.exists():
        shutil.rmtree(PROCESSED)
    PROCESSED.mkdir(parents=True, exist_ok=True)

    zip_paths = sorted(FRANCE_RAW.glob("valeursfoncieres-*.txt.zip"))
    if not zip_paths:
        raise FileNotFoundError(f"No DVF ZIP files found in {FRANCE_RAW}")

    for zip_path in zip_paths:
        year = zip_path.stem.split("-")[-1].split(".")[0]
        year_dir = PROCESSED / f"year={year}"
        year_dir.mkdir(parents=True, exist_ok=True)
        part = 0
        kept_rows = 0

        with zipfile.ZipFile(zip_path) as archive:
            member = next(
                info.filename
                for info in archive.infolist()
                if info.filename.lower().endswith(".txt")
            )
            with archive.open(member) as raw:
                chunks = pd.read_csv(
                    raw,
                    sep="|",
                    dtype=str,
                    usecols=USECOLS,
                    chunksize=250_000,
                    encoding="utf-8-sig",
                    low_memory=False,
                )

                for chunk in chunks:
                    chunk = chunk.rename(
                        columns={
                            "Date mutation": "date_mutation",
                            "Nature mutation": "nature_mutation",
                            "Valeur fonciere": "value_eur",
                            "Code postal": "postal_code",
                            "Commune": "commune",
                            "Code departement": "department_code",
                            "Code commune": "commune_code",
                            "Type local": "property_type",
                            "Surface reelle bati": "area_m2",
                            "Nombre pieces principales": "rooms",
                        }
                    )

                    chunk = chunk[
                        chunk["property_type"].isin(["Maison", "Appartement"])
                        & chunk["nature_mutation"].isin(
                            ["Vente", "Vente en l'état futur d'achèvement"]
                        )
                    ].copy()

                    if chunk.empty:
                        continue

                    chunk["value_eur"] = to_numeric(chunk["value_eur"])
                    chunk["area_m2"] = to_numeric(chunk["area_m2"])
                    chunk["rooms"] = to_numeric(chunk["rooms"])
                    chunk["year"] = int(year)
                    chunk["price_per_m2"] = chunk["value_eur"] / chunk["area_m2"]

                    chunk = chunk[
                        chunk["value_eur"].between(10_000, 20_000_000)
                        & chunk["area_m2"].between(9, 1_000)
                        & chunk["price_per_m2"].between(200, 50_000)
                    ].copy()

                    if chunk.empty:
                        continue

                    chunk["commune"] = chunk["commune"].fillna("").str.title()
                    chunk["department_code"] = (
                        chunk["department_code"].fillna("").astype(str).str.zfill(2)
                    )
                    chunk["commune_code"] = chunk["commune_code"].fillna("").astype(str)
                    chunk["postal_code"] = chunk["postal_code"].fillna("").astype(str)
                    chunk["rooms"] = chunk["rooms"].fillna(0).astype("int16")

                    out = chunk[
                        [
                            "year",
                            "date_mutation",
                            "nature_mutation",
                            "department_code",
                            "commune_code",
                            "postal_code",
                            "commune",
                            "property_type",
                            "value_eur",
                            "area_m2",
                            "rooms",
                            "price_per_m2",
                        ]
                    ]

                    table = pa.Table.from_pandas(out, preserve_index=False)
                    pq.write_table(table, year_dir / f"part-{part:04d}.parquet")
                    part += 1
                    kept_rows += len(out)

        print(f"{year}: kept {kept_rows:,} residential rows")


def query_market_data() -> dict:
    con = duckdb.connect()
    source = str(PROCESSED / "year=*" / "*.parquet").replace("\\", "/")
    con.execute(
        f"""
        create temp view dvf as
        select *
        from read_parquet('{source}', hive_partitioning = true)
        """
    )

    totals = con.execute(
        """
        select
          count(*)::bigint as clean_rows,
          count(distinct commune_code)::bigint as communes,
          count(distinct department_code)::bigint as departments,
          min(year)::int as min_year,
          max(year)::int as max_year,
          median(price_per_m2)::double as median_price_per_m2,
          median(value_eur)::double as median_value_eur
        from dvf
        """
    ).fetchone()

    by_year = con.execute(
        """
        select
          year,
          property_type,
          count(*)::bigint as transactions,
          round(median(price_per_m2))::bigint as median_price_per_m2,
          round(median(value_eur))::bigint as median_value_eur,
          round(avg(area_m2))::bigint as avg_area_m2
        from dvf
        group by year, property_type
        order by year, property_type
        """
    ).fetchdf()

    by_department = con.execute(
        """
        select
          department_code,
          property_type,
          count(*)::bigint as transactions,
          round(median(price_per_m2))::bigint as median_price_per_m2,
          round(median(value_eur))::bigint as median_value_eur
        from dvf
        group by department_code, property_type
        having count(*) >= 500
        order by transactions desc
        """
    ).fetchdf()

    by_commune = con.execute(
        """
        with ranked as (
          select
            commune,
            commune_code,
            department_code,
            property_type,
            count(*)::bigint as transactions,
            round(median(price_per_m2))::bigint as median_price_per_m2,
            round(median(value_eur))::bigint as median_value_eur,
            round(avg(area_m2))::bigint as avg_area_m2,
            row_number() over (partition by property_type order by count(*) desc) as volume_rank
          from dvf
          group by commune, commune_code, department_code, property_type
          having count(*) >= 80
        )
        select *
        from ranked
        where volume_rank <= 900
        order by property_type, volume_rank
        """
    ).fetchdf()

    top_markets = con.execute(
        """
        select
          commune,
          department_code,
          property_type,
          count(*)::bigint as transactions,
          round(median(price_per_m2))::bigint as median_price_per_m2
        from dvf
        group by commune, department_code, property_type
        having count(*) >= 250
        order by median_price_per_m2 desc
        limit 20
        """
    ).fetchdf()

    cities = [
        "Paris",
        "Marseille",
        "Lyon",
        "Toulouse",
        "Nice",
        "Nantes",
        "Montpellier",
        "Bordeaux",
        "Lille",
        "Rennes",
        "Strasbourg",
        "Orleans",
        "Orléans",
        "Cannes",
        "Neuilly-Sur-Seine",
        "Boulogne-Billancourt",
    ]
    city_sql = ",".join(["?"] * len(cities))
    featured = con.execute(
        f"""
        select
          commune,
          department_code,
          property_type,
          count(*)::bigint as transactions,
          round(median(price_per_m2))::bigint as median_price_per_m2,
          round(median(value_eur))::bigint as median_value_eur,
          round(avg(area_m2))::bigint as avg_area_m2
        from dvf
        where commune in ({city_sql})
        group by commune, department_code, property_type
        having count(*) >= 30
        order by commune, property_type
        """,
        cities,
    ).fetchdf()

    def records(df: pd.DataFrame) -> list[dict]:
        return json.loads(df.to_json(orient="records", force_ascii=False))

    return {
        "generated_at": pd.Timestamp.now("UTC").isoformat(),
        "source": {
            "name": "DVF / Demandes de valeurs foncieres",
            "publisher": "DGFiP / Etalab, data.gouv.fr",
            "raw_path": str(FRANCE_RAW),
            "method": "Filtered to Maison/Appartement, Vente/VEFA, residential area and price-per-m2 sanity ranges.",
        },
        "coverage": {
            "clean_rows": int(totals[0]),
            "communes": int(totals[1]),
            "departments": int(totals[2]),
            "min_year": int(totals[3]),
            "max_year": int(totals[4]),
            "median_price_per_m2": round(float(totals[5])),
            "median_value_eur": round(float(totals[6])),
        },
        "by_year": records(by_year),
        "by_department": records(by_department),
        "by_commune": records(by_commune),
        "top_markets": records(top_markets),
        "featured": records(featured),
    }


def main() -> None:
    build_parquet()
    data = query_market_data()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
