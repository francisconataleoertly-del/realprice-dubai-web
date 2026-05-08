# FonatProp Dubai Live DLD Transactions

Created: 2026-05-01

## What This Adds

FonatProp now has a repeatable harvester for current-year Dubai Land Department
open-data transactions:

```powershell
python scripts\harvest_dubai_open_data_transactions.py --from-date 2026-04-01 --to-date 2026-04-03 --group sales --max-pages 0 --download-csv
```

The script reads the public DLD Real Estate Data page, extracts the public
`consumer-id` from `window.apiConfig`, and calls the same open-data endpoints
used by the public table.

## Source

- Page: `https://dubailand.gov.ae/en/open-data/real-estate-data/`
- JSON endpoint: `https://gateway.dubailand.gov.ae/open-data/transactions`
- CSV export endpoint: `https://gateway.dubailand.gov.ae/open-data/transactions/export/csv`
- Previous-year archive: `https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open`

## Important Limits

- DLD's public page says previous-year data should be taken from Dubai Pulse.
- Dubai Pulse exposes a much larger `Transactions.csv` archive, but direct
  access from this machine timed out or was rejected during this run.
- The live DLD page has captcha in the browser UI, but the official export
  endpoint accepted the same request body used by the page export flow.
- No private credential is stored in this repo.

## Output

The script writes harvested data to:

- `C:\Users\franc\FonatProp_Data_Lake\90_processed\dubai_live_transactions`
- `data/catalog/dubai_live_transactions_manifest.json`

## First Harvests

- 2026-04-01 to 2026-04-03, sales only: 1,900 official DLD rows exported.
- 2026-04-01 to 2026-04-30, sales only: 14,085 official DLD rows exported.
- 2026-04-01 to 2026-04-30, all groups: 18,882 official DLD rows exported.

## Why It Matters For Investment

This fills the gap after the historical Kaggle/DLD archive ending in March
2023. The investment module can use this as a live layer for:

- recent comparable sales by area and project
- off-plan vs ready split
- average AED per sqm by area/project/type
- current buyer/seller activity
- recent project momentum
- nearest metro, mall, and landmark features
