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

CITY_COORDS = {
    "Paris": (48.8566, 2.3522),
    "Paris 01": (48.864, 2.336),
    "Paris 02": (48.868, 2.343),
    "Paris 03": (48.864, 2.361),
    "Paris 04": (48.854, 2.357),
    "Paris 05": (48.844, 2.35),
    "Paris 06": (48.849, 2.333),
    "Paris 07": (48.856, 2.312),
    "Paris 08": (48.872, 2.312),
    "Paris 09": (48.878, 2.337),
    "Paris 10": (48.876, 2.36),
    "Paris 11": (48.858, 2.38),
    "Paris 12": (48.84, 2.39),
    "Paris 13": (48.832, 2.355),
    "Paris 14": (48.833, 2.326),
    "Paris 15": (48.841, 2.3),
    "Paris 16": (48.863, 2.276),
    "Paris 17": (48.887, 2.307),
    "Paris 18": (48.892, 2.344),
    "Paris 19": (48.883, 2.383),
    "Paris 20": (48.864, 2.398),
    "Lyon": (45.764, 4.8357),
    "Marseille": (43.2965, 5.3698),
    "Toulouse": (43.6047, 1.4442),
    "Nice": (43.7102, 7.262),
    "Nantes": (47.2184, -1.5536),
    "Montpellier": (43.6119, 3.8772),
    "Bordeaux": (44.8378, -0.5792),
    "Lille": (50.6292, 3.0573),
    "Rennes": (48.1173, -1.6778),
    "Strasbourg": (48.5734, 7.7521),
    "Grenoble": (45.1885, 5.7245),
    "Cannes": (43.5528, 7.0174),
    "Antibes": (43.5804, 7.1251),
    "Aix-En-Provence": (43.5297, 5.4474),
    "Boulogne-Billancourt": (48.8397, 2.2399),
    "Neuilly-Sur-Seine": (48.8846, 2.2697),
    "Levallois-Perret": (48.8932, 2.2879),
    "Saint-Tropez": (43.2677, 6.6407),
    "La Rochelle": (46.1603, -1.1511),
}

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
    if PROCESSED.exists() and any(PROCESSED.glob("year=*/*.parquet")):
        print(f"Using existing parquet cache: {PROCESSED}")
        return

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
        with commune_year as (
          select
            commune,
            commune_code,
            department_code,
            property_type,
            year,
            count(*)::bigint as year_transactions,
            median(price_per_m2)::double as year_median_price_per_m2
          from dvf
          group by commune, commune_code, department_code, property_type, year
        ),
        trend as (
          select
            commune_code,
            property_type,
            min(year) as first_year,
            max(year) as latest_year,
            arg_min(year_median_price_per_m2, year) as first_median_price_per_m2,
            arg_max(year_median_price_per_m2, year) as latest_median_price_per_m2
          from commune_year
          group by commune_code, property_type
        ),
        base as (
          select
            commune,
            commune_code,
            department_code,
            property_type,
            count(*)::bigint as transactions,
            round(median(price_per_m2))::bigint as median_price_per_m2,
            round(median(value_eur))::bigint as median_value_eur,
            round(avg(area_m2))::bigint as avg_area_m2
          from dvf
          group by commune, commune_code, department_code, property_type
          having count(*) >= 80
        ),
        enriched as (
          select
            b.*,
            round(
              case
                when t.first_median_price_per_m2 > 0 and t.latest_year > t.first_year
                then (power(t.latest_median_price_per_m2 / t.first_median_price_per_m2, 1.0 / (t.latest_year - t.first_year)) - 1) * 100
                else 0
              end,
              2
            )::double as cagr_pct,
            least(100, greatest(1, round(20 + log10(b.transactions + 1) * 18)))::int as liquidity_score
          from base b
          left join trend t
            on b.commune_code = t.commune_code
           and b.property_type = t.property_type
        ),
        ranked as (
          select
            commune,
            commune_code,
            department_code,
            property_type,
            transactions,
            median_price_per_m2,
            median_value_eur,
            avg_area_m2,
            cagr_pct,
            liquidity_score,
            row_number() over (partition by property_type order by transactions desc) as volume_rank
          from enriched
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

    top_trends = con.execute(
        """
        with commune_year as (
          select
            commune,
            commune_code,
            department_code,
            property_type,
            year,
            count(*)::bigint as transactions,
            median(price_per_m2)::double as median_price_per_m2
          from dvf
          group by commune, commune_code, department_code, property_type, year
        ),
        pairs as (
          select
            a.commune,
            a.commune_code,
            a.department_code,
            a.property_type,
            a.year as first_year,
            b.year as latest_year,
            a.median_price_per_m2 as first_price,
            b.median_price_per_m2 as latest_price,
            a.transactions + b.transactions as support_transactions
          from commune_year a
          join commune_year b
            on a.commune_code = b.commune_code
           and a.property_type = b.property_type
          where a.year = (select min(year) from dvf)
            and b.year = (select max(year) from dvf)
            and a.transactions >= 20
            and b.transactions >= 20
            and a.median_price_per_m2 > 0
        )
        select
          commune,
          commune_code,
          department_code,
          property_type,
          support_transactions,
          round(first_price)::bigint as first_price_per_m2,
          round(latest_price)::bigint as latest_price_per_m2,
          round((power(latest_price / first_price, 1.0 / nullif(latest_year - first_year, 0)) - 1) * 100, 2)::double as cagr_pct
        from pairs
        order by cagr_pct desc
        limit 30
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

    def add_coords(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["lat"] = df["commune"].map(lambda value: CITY_COORDS.get(str(value), (None, None))[0])
        df["lon"] = df["commune"].map(lambda value: CITY_COORDS.get(str(value), (None, None))[1])
        return df

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
        "by_commune": records(add_coords(by_commune)),
        "top_markets": records(top_markets),
        "top_trends": records(top_trends),
        "featured": records(add_coords(featured)),
        "pipeline": {
            "next_sources": [
                "ADEME DPE for energy labels and energy renovation discounts/premiums",
                "BAN / Geoplateforme for address-level geocoding",
                "API Geo for commune, department and region normalization",
                "Georisques for flood, soil, seismic, radon and due-diligence flags",
                "Transport.data.gouv.fr GTFS for accessibility scoring",
                "Encadrement des loyers and zones tendues for legal rent constraints",
                "INSEE and BT01 for demographics, construction cost and macro context",
            ]
        },
    }


def main() -> None:
    build_parquet()
    data = query_market_data()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
