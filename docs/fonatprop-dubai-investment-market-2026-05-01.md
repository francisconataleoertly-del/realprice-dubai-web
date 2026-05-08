# FonatProp Dubai Investment Market

Created: 2026-05-01T03:25:48.698745+00:00

## Result

The Dubai investment layer now combines:

- Historical DLD archive rows: 785,800
- Live DLD open-data sales rows: 14,083
- Combined cleaned sales rows: 799,883

Live coverage in this run:

- Date range: 2026-03-31 to 2026-04-30
- Areas: 182
- Projects: 1864
- Sales value: AED 48,433,079,537.19

## Outputs

- Data lake tables: `C:\Users\franc\FonatProp_Data_Lake\90_processed\dubai_investment_market`
- App JSON: `src/data/dubai-investment-market.json`
- Catalog: `data/catalog/dubai_investment_market_manifest.json`
- API route: `/api/dubai/investment`

## Important Caveat

The historical archive ends in March 2023 and the live DLD export is April
2026. That gives FonatProp a real current market layer, but the 2024-2025 bridge
still needs Dubai Pulse or approved API/partner access before the module should
make confident multi-year forecasts.
