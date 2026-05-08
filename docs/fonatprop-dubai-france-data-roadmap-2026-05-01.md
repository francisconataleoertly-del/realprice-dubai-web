# FonatProp Dubai + France Data Roadmap

Date: 2026-05-01  
Scope: Dubai and France only. Argentina is out of scope.

## What Changed Today

- Production deploy completed and aliased to `https://fonatprop.com`.
- Dubai and France radar now show visual market signals backed by real data layers, not decorative placeholders.
- Valuation APIs now return reliability, warnings and comparable evidence.
- `/api/data-health` now exposes dataset coverage and freshness for both markets.

## Current Live Data Health

From `https://fonatprop.com/api/data-health` after deploy:

- Dubai:
  - Source: Dubai Land Department transaction-trained address profiles.
  - Rows cleaned: 222,132.
  - Latest transaction date in local profile layer: 2026-03-27.
  - Building profiles: 3,117.
  - Project profiles: 1,677.
  - Zone profiles: 74.

- France:
  - Source: DVF / Demandes de valeurs foncières.
  - Publisher: DGFiP / Etalab, data.gouv.fr.
  - Rows cleaned: 5,891,681.
  - Coverage: 908 communes, 97 departments.
  - Year range in processed local layer: 2021-2025.

## Priority 1: Data Sources To Integrate Next

### Dubai

1. DLD transactions from Dubai Pulse / DLD open data.
   - Official Dubai Pulse dataset: https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open
   - DLD official real estate data page: https://dubailand.gov.ae/en/open-data/real-estate-data/
   - Why it matters: this should remain the backbone for valuation, comparable evidence, radar and market freshness.
   - Product use: show exact comparable transactions, building medians, project medians and mispricing radar.

2. Rental Index / Ejari rental intelligence.
   - Official DLD rental index page: https://dubailand.gov.ae/en/eservices/rental-index/
   - Why it matters: investment needs rent, not just sale price.
   - Product use: gross yield, net yield, rent legality/fair-rent warning, owner pricing guidance.

3. Service Charge Index.
   - Official DLD service fee indicator: https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index
   - Why it matters: Dubai ROI can be wrong if service charges are missing.
   - Product use: net yield, annual holding cost, investor report.

4. Dubai Statistics Center construction/material indicators.
   - Dubai Statistics Center construction material price indicator examples appear under DSC publications.
   - Why it matters: renovation and investor underwriting need local material-cost inflation.
   - Product use: renovation budget confidence, material inflation alert, contractor quote sanity check.

### France

1. DVF official transactions.
   - Official dataset: https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres
   - Current official update observed: 2026-04-07.
   - Why it matters: this is the France transaction backbone, equivalent to DLD for public valuation.
   - Product use: comparable evidence, commune/department medians, price trend and investment score.

2. DPE logements.
   - API DPE logements: https://www.data.gouv.fr/fr/dataservices/api-dpe-logements/
   - Why it matters: DPE class changes price, liquidity and renovation upside in France.
   - Product use: valuation adjustment, renovation ROI, energy-risk warning, investor report.

3. BAN / Base Adresse Nationale.
   - API Adresse / BAN: https://www.data.gouv.fr/dataservices/api-adresse-base-adresse-nationale-ban
   - Why it matters: address quality controls parcel, DPE, risk and comparable matching.
   - Product use: address autocomplete, geocode confidence, parcel-ready valuation.

4. Géorisques.
   - Official site: https://www.georisques.gouv.fr/
   - Why it matters: flood, clay, radon, industrial and seismic risks affect price, insurance and buyer confidence.
   - Product use: due-diligence score, investor risk flags, broker warning.

5. Encadrement des loyers and zones tendues.
   - Paris rent reference dataset: https://www.data.gouv.fr/datasets/loyers-de-reference-encadrement-des-loyers
   - Zones tendues dataset: https://www.data.gouv.fr/datasets/zones-tendues
   - Why it matters: legal rent caps affect investment yield and short-term pricing assumptions.
   - Product use: legal rent ceiling, yield warning, investor underwriting.

## Priority 2: Product Features That Should Exist

### Valuation Report

Every valuation should show:

- Estimated value.
- Low/high range.
- Confidence score.
- 3 to 5 comparable evidence rows.
- Data freshness.
- Warning if address-level match is weak.
- Warning if sample size is low.
- Final CTA: contact broker / request full report.

### Investment Engine

Dubai:

- Sale price from DLD.
- Rent benchmark from Rental Index/Ejari.
- Service charge from DLD indicator.
- Net yield after service charge.
- Holding cost and resale sensitivity.

France:

- Sale price from DVF.
- Rent cap / zones tendues check.
- DPE class penalty or upside.
- Notary/acquisition cost estimate.
- Net yield after property tax, management and vacancy.

### Renovation Engine

Dubai:

- Use renovation tiers rather than exact contractor quotes until supplier APIs are available.
- Add material inflation warning from DSC construction materials indicators.
- Separate cosmetic, kitchen, bathroom, flooring, AC/MEP and full fit-out scopes.

France:

- Add DPE-driven renovation recommendations.
- Separate bathroom, kitchen, flooring, windows, insulation, heat pump, electrical upgrade and facade.
- Attach MaPrimeRénov eligibility later.
- Always show price ranges, not fake exact quotes.

### Radar

Current radar:

- Dubai: building median vs zone benchmark from DLD profile layer.
- France: commune median vs department benchmark from DVF layer.

Next radar stage:

- Add admin property upload.
- Store asking price, m2, address, photos, market and owner status.
- Run valuation automatically.
- Turn the listing green/yellow/red using asking price vs model range.
- Save every score in an audit table.

## Suggested Technical Order

1. Add Supabase table `published_properties`.
2. Add admin form for Dubai/France property upload.
3. Add server-side valuation call on save.
4. Store `asking_price`, `estimated_value`, `low`, `high`, `reliability_score`, `signal`, `data_source`.
5. Make radar read `published_properties` first; fallback to current benchmark signals if empty.
6. Add PDF/WhatsApp report generation.
7. Add DPE/BAN/Géorisques enrichment for France.
8. Add Rental Index/Service Charge enrichment for Dubai.

## Positioning

FonatProp should not claim “perfect valuation.”  
The stronger positioning is:

> AI valuation backed by official transaction evidence, confidence scoring and broker-grade review signals.

That is more credible and more sellable.

