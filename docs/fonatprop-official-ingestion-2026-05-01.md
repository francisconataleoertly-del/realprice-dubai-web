# FonatProp Official Ingestion Run - 2026-05-01

This note records the first controlled official-source ingestion for the
FonatProp investment and renovation engines. Localhost remains the test lab.
`fonatprop.com` will only show these changes after deployment and after the
app/API read the generated manifests.

## Outputs

- Script: `scripts/ingest_fonatprop_official_sources.py`
- Registry: `data/catalog/fonatprop_source_registry.json`
- Registry summary: `data/catalog/fonatprop_source_registry_summary.json`
- Ingestion manifest: `data/catalog/fonatprop_official_ingestion_manifest.json`
- Ingestion summary: `data/catalog/fonatprop_official_ingestion_summary.json`
- Data lake samples: `90_processed/fonatprop_official_ingest/samples`
- Data lake metadata: `90_processed/fonatprop_official_ingest/metadata`

## Smoke Run Result

Command:

```powershell
python scripts\ingest_fonatprop_official_sources.py --mode smoke --max-bytes 1048576 --timeout 12
```

Result:

- 49 official/high-authority sources checked.
- 45 resources discovered.
- 23 resources sampled.
- 27 local files inventoried.
- 6.60 GB of local market data detected across the existing data lake inventory.
- 3.96 MB of safe samples written outside the frontend bundle.

## Ready For Normalization

France is now the strongest immediate path because most priority sources are
open and reachable:

- DVF official metadata and local DVF files.
- ADEME DPE API page and ADEME renovation/isolation cost dataset.
- Encadrement des loyers.
- Zones tendues.
- Sitadel housing supply series.
- LOVAC vacant housing.
- Fiscalite locale.
- DMTG transfer-duty base.
- Banque de France housing loan and usury-rate references.
- INSEE CPI, BT construction indices, IPEA maintenance indices, tourism page.
- Service-public notary fee reference.
- Notaires valeur verte reference.

Dubai is partially ready:

- Local Dubai government CSV seeds were copied into the data lake sample area.
- DLD rental index and Mollak service charge pages were sampled.
- DLD real estate current page was reachable.
- Dubai Pulse datasets for DLD transactions, Ejari rents, service charges,
  units, projects, Dubai CPI, and DSC construction material prices timed out or
  blocked the current automated session. These need token/API access, manual
  bulk export, or a retry connector.
- CBUAE EIBOR and Dubai DET tourism pages returned HTTP 403 from the local
  script, even though they remain valid official research references.

## Product Tables To Build Next

Investment:

- `property_price_history_monthly`
- `property_rent_history_monthly`
- `property_inflation_index`
- `property_financing_rates`
- `property_transaction_cost_rules`
- `property_service_charge_rules`
- `property_tourism_demand_index`
- `property_supply_pipeline_index`
- `property_investment_scenarios`

Renovation:

- `renovation_material_skus`
- `renovation_material_price_snapshots`
- `renovation_labor_cost_ranges`
- `renovation_room_templates`
- `renovation_energy_upgrade_rules`
- `renovation_supplier_confidence`

## App Work Needed

- In the France investment section, replace static scenario copy with the
  manifest-backed source inventory and eventually normalized history tables.
- In the Dubai investment section, keep broker-demo presentation stable while
  building DLD/Ejari/Dubai Pulse extraction behind the scenes.
- In renovation, turn the current seeded material catalog into a searchable
  source-attributed catalog with confidence labels: official index, retailer
  listed price, supplier quote, guide range, or manual benchmark.
- Every projection must show assumptions: historical price basis, inflation
  basis, rent basis, financing basis, tax/notary basis, renovation basis, and
  confidence.

## Production Rule

Nothing here changes `fonatprop.com` by itself. These files are local/data-lake
work. To make production use them, deploy the frontend and connect the API or
static data loaders to the generated JSON/normalized database tables.
