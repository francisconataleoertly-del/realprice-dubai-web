# FonatProp investment and renovation research

Date: 2026-04-30
Surface: localhost laboratory first, later production only after validation
Markets: Dubai and France

## Product objective

The investment and renovation modules should answer one commercial question:

Should this property be bought, rented long-term, rented short-term, subdivided, renovated for rent, or renovated for resale?

To answer that credibly, FonatProp needs four engines:

1. Historical price engine
   - Dubai: DLD transactions, Dubai Pulse, DLD house price methodology, community/building time series.
   - France: DVF/DVF+, Notaires-INSEE indices, commune/city/department time series.

2. Inflation and construction-cost engine
   - Dubai/UAE: Dubai CPI, UAE CPI, construction/material indices where available.
   - France: INSEE CPI, BT01/BT50/IPEA/ICC construction and renovation indices.

3. Income engine
   - Long-term rent: Ejari/rental index for Dubai; rent benchmarks and encadrement des loyers for France.
   - Short-term rent: Dubai DET holiday-home rules; France meublé de tourisme rules, 90/120 night constraints and DPE restrictions.

4. Renovation procurement engine
   - Searchable material catalog by country, room, category, supplier, unit, price, tier and source URL.
   - This should start with seeded retail/guide prices, then move to automated refreshes or partner feeds.

## Investment data sources

### Dubai

Priority sources:

1. DLD Real Estate Data
   - Use for current transaction rows.
   - Fields include transaction date, amount, property size, property type, sub type, freehold status.
   - Source: https://dubailand.gov.ae/en/open-data/real-estate-data/

2. Dubai Pulse DLD historical transactions
   - Use for multi-year historical training, community/building price per sqft and liquidity.
   - Source: https://www.gslb.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open

3. DLD House Price Index methodology
   - Use as methodological benchmark for repeat-sales/hedonic index logic.
   - Source: https://dubailand.gov.ae/media/qnslugbi/the-dubai-house-price-index-methodology.pdf

4. Dubai CPI
   - Use to separate nominal property appreciation from real/inflation-adjusted appreciation.
   - Source: https://www.dubaipulse.gov.ae/data/dsc-statistics/dsc_consumer_price_index-open

5. Dubai holiday-home / Airbnb regulation
   - Short-term rentals are legal as holiday homes, but require DET/DTCM registration and unit permit before advertising.
   - Source: https://www.houst.com/airbnb-rules/dubai
   - Official historical regulation context: https://www.dubaidet.gov.ae/-/media/dotsite/migrated/pdfs/2016/05/prs-may-2016/update-holiday-homes-regulations.pdf

6. Market benchmarks
   - DXBinteract, Property Monitor, Bayut, Property Finder and Property Index are useful external benchmarks, but FonatProp should rely on DLD/Ejari where possible.
   - DXBinteract: https://dxbinteract.com/our-mission
   - Property Monitor: https://propertymonitor.com/products-and-services/pm/pmiq
   - Bayut rental index: https://www.bayut.com/property-market-analysis/index/rent/properties/dubai/
   - Property Index: https://www.propertyindex.ae/

Model implications:

- Build historical price per sqft by zone, building, property type, rooms, ready/off-plan, and transaction year/quarter.
- Calculate CAGR by zone and building for 1Y, 3Y, 5Y, and full available history.
- Calculate real CAGR by deflating price index with Dubai CPI.
- Separate gross yield and net yield.
- Net yield must include service charges, property management, vacancy, maintenance, furnishing amortization for short-term rentals, DET costs if Airbnb, and agent fees.

### France

Priority sources:

1. DVF official
   - Backbone for transaction history since 2014, excluding Alsace, Moselle and Mayotte.
   - Source: https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres/

2. API Donnees foncieres / DVF+
   - Useful for programmatic sale/mutation access and geospatial queries.
   - Source: https://www.data.gouv.fr/fr/dataservices/api-dvf/

3. DVF statistics
   - Useful cleaned aggregated statistics for national/commune views.
   - Source: https://www.data.gouv.fr/datasets/statistiques-dvf/

4. Notaires-INSEE old housing price indices
   - Quarterly data since 1992, including apartments/houses and local indices.
   - Source: https://www.insee.fr/fr/statistiques/8669035
   - Long-series context: https://www.igedd.developpement-durable.gouv.fr/evolution-du-prix-de-l-immobilier-d-habitation-a-a2056.html

5. INSEE CPI
   - Official inflation index for France.
   - Source: https://www.data.gouv.fr/datasets/indice-des-prix-a-la-consommation-dataset-principal
   - API BDM: https://www.data.gouv.fr/fr/dataservices/api-bdm//

6. INSEE construction and renovation indices
   - IPEA, ICC, ICP-F and BT indices are critical for projecting future renovation costs.
   - Source: https://www.insee.fr/fr/statistiques/2015347
   - BT01/BT50 monthly context: https://www.insee.fr/fr/statistiques/8897485

7. Short-term rental regulation
   - Meublé de tourisme regime, 120 nights for primary residence, communes may reduce to 90 from 2025, DPE minimum E for many cases.
   - Source: https://www.notaires.fr/en/node/38843
   - Additional 2026 operational summary: https://www.houst.com/airbnb-rules/france

Model implications:

- Build city/commune price history by property type: apartment vs house.
- For each property, create a matched micro-market series:
  - commune
  - department
  - nearest comparable cluster
  - Notaires-INSEE regional index fallback if DVF sample is thin
- Estimate real appreciation:
  - nominal property price index CAGR
  - minus CPI inflation CAGR
  - adjusted by local transaction liquidity and DPE/renovation risk
- Add rent legality checks:
  - zone tendue
  - encadrement des loyers
  - DPE rental restrictions
  - Airbnb night cap/change-of-use requirement

## Investment decision model

For every property, FonatProp should calculate:

1. Buy-and-hold value
   - purchase price
   - acquisition fees
   - mortgage payment
   - annual rent
   - operating cost
   - property tax
   - expected appreciation
   - sale exit fees

2. Long-term rent scenario
   - gross yield
   - net yield
   - monthly cash flow
   - rent cap warning
   - vacancy assumption

3. Short-term rental scenario
   - allowed or restricted
   - permit requirements
   - occupancy assumption
   - nightly rate
   - platform fee
   - cleaning and management
   - furnishing amortization
   - night cap if France primary residence

4. Renovate and rent
   - renovation budget
   - expected rent uplift
   - DPE/risk improvement if France
   - payback period

5. Renovate and resell
   - renovation budget
   - resale value uplift
   - selling fees
   - time-to-market
   - margin after contingency

6. Subdivision
   - only show as "requires legal/technical validation".
   - France: copropriété, planning permission, surface, sanitary/electrical compliance, rental rules.
   - Dubai: building/community rules, owner association/NOC, DLD/title constraints, fit-out approvals.

## Renovation material catalog

I added a first seed catalog in:

- `src/data/renovation-materials.ts`
- `src/components/renovation/RenovationMaterialSearch.tsx`

The catalog is visible in:

- Dubai renovation section: `src/app/realprice/components/ReformaSection.tsx`
- France renovation section: `src/app/france/FranceMarketClient.tsx`

Current schema:

- market: `dubai` or `france`
- room: bathroom, kitchen, flooring, walls, doors, windows, pool, MEP, whole home
- category
- product/material name
- supplier
- unit
- currency
- low/high price
- quality tier
- source URL
- capture date
- notes
- keywords

Seeded supplier/source examples:

France:
- Leroy Merlin France: floor tiles, shower mixers.
- Castorama France: shower screens, Hansgrohe thermostatic mixers.
- Brico Depot France: laminate and floor tile benchmarks.
- La Maison Saint-Gobain and RenoEstim: installed bathroom renovation ranges.
- Pool cost guides: coque pool construction benchmarks.

Dubai:
- ACE UAE: bathroom taps and mixers.
- Danube Home / Namshi: concealed shower set.
- NQCART Dubai: Mapei, Weber, Soudal, Caparol materials.
- UAE/Dubai pool contractor guides: standard and luxury pool benchmarks.

## Important limits

1. This is not "all materials in the world" yet.
   - It is the correct database and UI foundation.
   - The next step is automated ingestion.

2. Retail prices move constantly.
   - Every item needs `capturedAt`.
   - Later, add `lastCheckedAt`, `availability`, `shipping`, and `supplier confidence`.

3. Retail product price is not installed cost.
   - Materials are one layer.
   - Labour, demolition, waterproofing, waste, permits, delivery, contractor margin and contingency must be separate.

4. Airbnb projections are regulatory-sensitive.
   - Do not show "Airbnb is best" without permit/night-cap/legal checks.

## Next technical steps

1. Create `scripts/refresh_renovation_materials.py`
   - Read supplier URLs.
   - Extract visible products/prices.
   - Write normalized JSON with capture timestamps.

2. Move seed data from TypeScript to JSON.
   - Better for refresh jobs and manual review.

3. Add an investment scenario engine.
   - Inputs: purchase price, area, city/zone, property type, renovation budget, rent type.
   - Outputs: buy/rent/Airbnb/renovate/sell verdicts.

4. Build historical data tables.
   - Dubai: `zone_year_price_index`, `building_year_price_index`.
   - France: `commune_year_price_index`, `city_year_price_index`, `notaires_index_history`, `cpi_history`, `construction_index_history`.

5. Add confidence flags.
   - Low transaction count.
   - Bad geocode.
   - Thin rent data.
   - Airbnb restriction.
   - DPE restriction.

## Research expansion: 2026-05-01

I added a structured source registry so the research can become ingestion work:

- `data/catalog/fonatprop_source_registry.json`
- `data/catalog/fonatprop_source_registry_summary.json`
- `scripts/refresh_fonatprop_source_registry.py`

Current registry coverage:

- 49 total sources.
- 24 investment sources.
- 25 renovation sources.
- 7 target analytical tables.
- 147 material/component taxonomy entries across bathroom, kitchen, flooring, walls/ceilings, doors/windows, MEP, structure, exterior/pool, France energy works and Dubai-specific renovation checks.

Key new sources:

- Dubai Ejari rent contracts through Dubai Pulse, needed for real yield.
- Dubai DLD Rental Index, needed for legal rent-increase and long-term rent validation.
- Dubai Statistics Center average construction material prices, needed as an official renovation cost anchor.
- France OLL rents, Carte des loyers, encadrement des loyers and zones tendues, needed for legal rent and yield.
- INSEE BT01/BT50 construction indices, needed to project renovation cost inflation.
- France and Dubai retailer/trade supplier map for material snapshots: ACE, Danube Home, Danube Building Materials, NQCART, RAK Ceramics, SANIPEX/BAGNODESIGN, Leroy Merlin, Castorama, Brico Depot, POINT.P, CEDEO, Gedimat, Chausson, BigMat, Richardson, RenoEstim, La Maison Saint-Gobain and BatiPrix.

The important product decision remains:

- Official data first for investment: DLD, Ejari, CPI, DVF+, INSEE, OLL and rent-law datasets.
- Retail and trade feeds second for renovation: visible prices, quote feeds, or partner CSVs.
- Production must show source attribution, capture date, confidence and legal/regulatory warnings.

## Deep research expansion: 2026-05-01

The source registry was expanded from 49 to 93 sources:

- 43 investment sources.
- 50 renovation sources.
- 11 target analytical tables.
- 147 material/component taxonomy entries.

New investment-critical findings:

- Dubai net yield needs official service charges. Added Dubai Pulse `dld_oa_service_charges-open` and Mollak Service Charge Index.
- Dubai mortgage scenarios need EIBOR/base-rate data. Added CBUAE EIBOR as the mortgage-rate benchmark.
- Dubai short-term rental projections need tourism demand proxy. Added DET Tourism Performance Report for visitors, occupancy, ADR/RevPAR context.
- Dubai supply pressure needs unit/project/building sources. Added DLD units/projects/buildings open-data leads.
- France ROI needs acquisition costs, property tax and credit constraints. Added Service Public notary-fee simulator, DGFiP transfer-duty base, fiscalite locale/taxe fonciere, Banque de France housing-loan series and taux d'usure.
- France future supply and vacancy need Sitadel and LOVAC. Added permits/starts and vacant-private-housing aggregate datasets.
- France Airbnb/short-term rental needs official activity/regulatory signals. Added DGE API meubles as restricted/regulatory source and INSEE tourism occupancy as demand proxy.
- France DPE must be modelled as both legal constraint and price factor. Added ADEME DPE API and Notaires de France green-value source.

New renovation-critical findings:

- France installed renovation inflation should use IPEA, not only BT01/BT50. IPEA observes prices charged by companies/artisans to final clients, including supply and installation.
- France DPE renovation budgets need ADEME cost studies for insulation gestures.
- France material-market coverage now includes retail, trade, pro, paint, wood, bathroom and comparator sources: Bricofute, BatiPrix.pro comparator, BatiCompare, MaterioScan, Mr.Bricolage, Bricomarche, Bricoman, Lapeyre, Tollens, Zolpan, Espace Aubade, Tereva, Dispano, Wurth and PROLIANS.
- Dubai material-market coverage now includes marketplaces and trade suppliers beyond ACE/Danube/NQCART: Amalme, Insha'at, MawadOnline, ClickCement, AL ADRAN and The New Excellent.
- Dubai construction-material inflation should use the official Dubai Statistics Center average material price dataset first, then DSC historical reports and third-party reports like Linesight only as benchmarks.

Practical ingestion order from this research wave:

1. Official investment backbone:
   - DLD transactions, DLD rent contracts, DLD service charges, Dubai CPI, CBUAE EIBOR.
   - DVF+, ADEME DPE, Notaires-INSEE, INSEE CPI, Banque de France rates, fiscalite locale, OLL rents, encadrement/zones tendues.

2. Official supply/risk layer:
   - Dubai units/projects/buildings, DET tourism reports.
   - France Sitadel, LOVAC, INSEE tourism occupancy, Georisques.

3. Renovation official cost layer:
   - Dubai Statistics Center average construction material prices.
   - INSEE IPEA, BT01/BT50 and ADEME renovation cost studies.

4. Renovation market price layer:
   - Retail snapshots: Leroy Merlin, Castorama, Brico Depot, ACE, Danube Home, NQCART.
   - Trade/quote layer: POINT.P, CEDEO, Gedimat, Chausson, BigMat, Tereva, Aubade, Danube Building Materials, RAK Ceramics, SANIPEX/BAGNODESIGN, AL ADRAN.

5. Production safeguards:
   - Every investment output needs source, date, sample size, confidence and legal warnings.
   - Every renovation output needs material price, installed-cost range, labour estimate, contingency, region/store and last-captured date.
   - Renovation catalog stale.

6. Add admin import surface.
   - CSV upload for materials.
   - Supplier, item, room, unit, price, source, capture date.
