# FonatProp Dubai - valuation error reduction plan

Date: 2026-05-07

## Current truth

The public Dubai benchmark should not be treated as one single number for every valuation.

Current defendable layers:

- Broad legacy benchmark: 12.70% MAPE, R2 0.889, 81.6% within +/-20%, 19,755 test rows.
- Address/building workflow: 10.20% mean error, 7.62% median error, 85.2% within +/-20%, 500 building checks.
- New v5 clean temporal experiment: 10.67% MAPE on building-room rows with >=20 historical support, 7.76% median error, 85.8% within +/-20%, 19,958 holdout rows.

## Important caveat

The old v4 trainer parses ISO dates with `dayfirst=True`. That can turn dates like `2026-03-12` into `2026-12-03`. The benchmark must be regenerated with ISO-safe parsing before using it as an investor-grade or audit-grade metric.

The old v4 feature pipeline also computes some median price features before the temporal split. That can make the broad MAPE optimistic. The new v5 experiment fits historical group medians from train history only and adds as-of monthly features that use only prior months.

## What was tested

New experiment script:

`C:\Users\franc\FonatProp_Data_Lake\04_transactions\dubai_transactions_project\realprice_model_v5_experiment.py`

Run:

```powershell
python realprice_model_v5_experiment.py --input Transactions_2018plus.csv --metrics-json realprice_model_v5_lag_experiment_metrics.json --model-out realprice_model_v5_lag_experiment.pkl --max-train-rows 180000
```

Dataset after cleaning:

- 209,032 residential sale rows.
- Train rows: 167,225.
- Test rows: 41,807.
- Date range: 2018-01-02 to 2026-03-27.
- Split date: 2022-10-09.
- 74 zones, 2,926 buildings, 1,483 projects.

Best useful segment from v5:

- Building + property type + rooms support >=20.
- Rows: 19,958.
- MAPE: 10.67%.
- Median APE: 7.76%.
- Within +/-10%: 60.16%.
- Within +/-20%: 85.84%.

## Product interpretation

Do not sell all valuations as the same precision.

Recommended public confidence tiers:

- Tier A: building-room support >=20, show "AI high confidence", typical error 8-11%.
- Tier B: building or project support >=20, show "strong market support", typical error 10-12%.
- Tier C: zone-only or weak support, show wider range and "broker review required", expected error 17-30%.

This lowers the commercial precision number honestly by only claiming the lower error where the model has enough evidence.

## Data that should lower the real model error

1. DLD units/buildings

Source: Dubai Land Department Real Estate Data.

Useful fields:

- Unit: unit number, property size, balcony area, common area, actual common area, floor, room type, parking, building name, master project, project number, project name, area, zone.
- Building: built-up area, building levels, shops, flats, offices, swimming pools, elevators, floors, rooms, parking, project name, area, zone.

Expected impact:

- Better unit-level matching.
- Better tower/floor/building quality proxy.
- Better distinction between two units in same project.

2. DLD rent contracts / Ejari

Source: Dubai Pulse `dld_rent_contracts-open`.

Useful fields:

- annual_amount
- contract_amount
- contract_reg_type_en
- contract_start_date / end_date
- property size
- property subtype
- rooms
- area
- master project
- project name

Expected impact:

- Rental yield feature by project/room/area.
- Investor-demand proxy.
- Market liquidity proxy.
- Better investment module.

3. DLD/RERA service charges / Mollak

Source: Dubai Pulse `dld_oa_service_charges-open`.

Useful fields:

- project_id
- project_name
- budget_year
- service_cost per square foot
- service_category_name_en
- management_company_name_en

Expected impact:

- Net-yield correction.
- Building quality/cost proxy.
- Better separation of premium towers vs weak towers inside the same zone.

4. DLD projects/developers

Source: Dubai Land Department Real Estate Data.

Useful fields:

- developer name
- project status
- completion percent
- project value
- completion date
- total buildings
- total units
- master project

Expected impact:

- Developer premium/discount.
- Off-plan risk and completion-status correction.
- More accurate project-level valuation.

## Next implementation target

Build `realprice_model_v5_dubai.py` as a production candidate:

- ISO-safe date parsing.
- Target = log price per m2.
- As-of monthly market features.
- Train-only static encodings.
- DLD unit/building enrichment.
- Ejari rent-yield enrichment.
- Mollak service-charge enrichment.
- Confidence-tiered output.

Acceptance target:

- Tier A MAPE under 10%.
- Tier B MAPE under 12%.
- Broad market MAPE under 15% on strict temporal holdout.
- No leakage.
- Methodology file ready for brokers/investors.
