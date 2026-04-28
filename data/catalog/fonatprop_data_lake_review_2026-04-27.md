# FonatProp Data Lake Review - 2026-04-27

## Executive Read

The current `C:\Users\franc\FonatProp_Data_Lake` load is mostly France data. The strongest asset is DVF / Valeurs Foncieres, which is highly useful for a future France valuation engine. The folder does not currently contain meaningful new Dubai data.

## What Is Valuable

| Dataset | Path | Usefulness | Notes |
|---|---|---:|---|
| Normalized DVF gzip | `02_france/dvf.csv.gz` | 10/10 | Best candidate for France AVM. Includes mutation id, date, price, address, commune, parcel id, property type, built area, rooms, longitude and latitude. |
| Official annual raw DVF ZIPs | `02_france/valeursfoncieres-2021..2025.txt.zip` | 10/10 | Official raw backfill. 20,382,915 estimated data rows across 2021-2025. Strong for validation and rebuilding a clean warehouse. |
| Loiret/Orleans DVF CSV | `02_france/dvf.csv` | 7/10 | Useful quick prototype/sample. Not national: department 45 only. Has 216,493 rows and repeated headers. |
| Methodology PDF | `02_france/rapport-methodologique-2024.pdf` | 7/10 | Useful for definitions, caveats and product credibility. |

## Less Useful / Not Core

| Dataset | Why |
|---|---|
| `transactions-par-pays.*` | Looks like AFD/development finance transactions, not property transactions for valuation. |
| `transaction-par-projets.*` | Also AFD/project finance oriented, not residential real estate. |
| `les-transactions-de-l-afd.*` | AFD transactions, not useful for property pricing. |
| `liste-des-transactions-immobilieres.csv` | Tiny sample and appears to be Montreal/Quebec municipal transactions, not France real estate. |
| `Unconfirmed 50494.crdownload` | Incomplete browser download. Needs redownload or deletion later. |

## Key Counts

| File | Estimated rows |
|---|---:|
| `valeursfoncieres-2021.txt.zip` | 4,674,542 |
| `valeursfoncieres-2022.txt.zip` | 4,676,187 |
| `valeursfoncieres-2023.txt.zip` | 3,817,426 |
| `valeursfoncieres-2024.txt.zip` | 3,499,931 |
| `valeursfoncieres-2025.txt.zip` | 3,714,829 |
| Total raw annual rows | 20,382,915 |

## DVF Gzip Sample Profile

Sampled first 1,500,000 rows from `dvf.csv.gz`.

| Signal | Finding |
|---|---|
| Date range in sample | 2021-01-02 to 2021-12-31 |
| Main mutation | Vente |
| Top property types | Maison, Appartement, Dependence, Commercial/local |
| Coordinates | Present, but some missing |
| Built area | Missing for land/dependence rows, available for residential rows |
| Valid price + built area rows in sample | 486,214 |

## Product Implication

This is enough to start a France engine, but not by copying the Dubai model directly. France needs a clean DVF pipeline:

1. Convert raw annual ZIPs and/or normalized gzip to partitioned Parquet by year and department.
2. Build one canonical transaction table using `id_mutation`, parcel, address, local type, price, area, rooms and coordinates.
3. Filter for residential `Maison` and `Appartement`; separate land, dependencies and commercial.
4. Deduplicate multi-lot transactions carefully because DVF can repeat one sale across multiple rows.
5. Add commune/department/geospatial features before modeling.

## Recommended Next Step

Create `90_processed/france_dvf_parquet/` with partitioned Parquet files. That will make analysis and model training fast instead of streaming huge gzip/zip files every time.
