# FonatProp Dubai Transactions Ingestion - 2026-05-01

Processed source: `C:\Users\franc\Downloads\archive.zip`

## Result

- Clean sales rows: 785,800
- Residential sales rows: 652,444
- Date range: 1997-11-08 to 2023-03-17
- Areas: 232
- Projects: 1,918
- Latest complete score year: 2022
- Parquet files: 243
- Parquet size: 34,923,537 bytes

## Data Lake Outputs

- Parquet: `C:\Users\franc\FonatProp_Data_Lake\90_processed\dubai_transactions_parquet`
- Tables: `C:\Users\franc\FonatProp_Data_Lake\90_processed\dubai_market_tables`
- Postgres schema: `C:\Users\franc\FonatProp_Data_Lake\90_processed\dubai_market_tables\dubai_market_tables_schema.sql`
- App JSON: `C:\Users\franc\FonatProp_Data_Lake\03_apps\realprice-dubai-web\src\data\dubai-transactions-market.json`

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
