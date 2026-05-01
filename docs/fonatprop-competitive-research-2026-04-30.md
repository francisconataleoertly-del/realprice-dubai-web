# FonatProp competitive and data research

Date: 2026-04-30
Markets: Dubai and France
Goal: understand competitors, data moats, product positioning, and practical ways to reduce valuation error.

## Executive read

FonatProp should not position itself as "another public estimate website". Dubai already has strong consumer-facing valuation and market transparency products from Bayut, Property Finder, DXBinteract, Property Monitor, REIDIN, and newer dashboard clones. The better wedge is broker-first: private valuation workspace, client-ready explanation report, lead-capture widget, comparables, confidence score, rental yield, and opportunity/risk radar.

France has better official raw data than Dubai for a solo/team build because DVF, DPE, BAN, Georisques, API Geo, transport data, and rent-regulation data are openly reusable. The competitor threat is not raw access to DVF; it is data cleaning, enrichment, UX, trust, and distribution. MeilleursAgents/SeLoger owns consumer mindshare, PriceHubble owns enterprise AVM/API credibility, and Yanport owns B2B data/API workflows for residential professionals.

The product should make accuracy visible: every valuation should include a range, confidence level, comparable count, recency, distance radius, model/data warnings, and "what would change this estimate". The app should refuse overconfidence when data is thin.

## Dubai competitor map

| Competitor | What they sell | Data/claim | Threat to FonatProp | Gap FonatProp can attack |
| --- | --- | --- | --- | --- |
| Bayut TruEstimate | Free public sale/rent valuation, owner portfolio, rental yield, comparable properties | Says it uses DLD transaction data, Bayut listing data, AI, confidence level, sale and rental reports | Very strong consumer reach and portal distribution | Public exact valuation is not the broker workflow. FonatProp can offer agency-branded lead widget plus private agent workspace and report control |
| Property Finder valuation + Data Guru | Home valuation, current and 6-month forecast, Data Guru market info, community insights | Claims millions of data points, transaction history, live listings, neighbourhood trends, expert/sentiment layer, historical median sales error around 4.7% | Strongest portal competitor for consumer journey and agent ecosystem | FonatProp can be neutral/agency-owned, not portal-owned, and focus on private client conversations |
| DXBinteract | Open-access Dubai market intelligence, transactions, maps, reports, cycles, agents, developers | Built around Dubai transaction data and methodology exclusions for market integrity | Default reference for transaction transparency | Not a private workflow, not agency-branded, less focused on lead capture and valuation handoff |
| Property Monitor / PMiQ / valu'd | Paid SaaS market intelligence, broker-grade AVM, reports, service charges, comparables | Cleansed/curated Dubai database, industry analytics, AVM for partners | Closest professional competitor | FonatProp must be simpler, prettier, faster for brokers, with client-facing output and widget distribution |
| REIDIN | Data analytics, maps, API, indices, custom dashboards, valuation algorithms | R-Insight, R-Map, R-Rebis, APIs, transaction/listing/trend/supply datasets | Institutional credibility with CBRE/Knight Frank/Savills-style users | FonatProp should not fight as a generic data terminal. Win with agent workflow and sales-ready outputs |
| DLD / Dubai REST | Official owner/property services, rental index, valuation requests, portfolio tools | Official DLD services and open data | Ultimate source of truth and legal benchmark | Slow/official workflow; not a broker sales and lead-conversion product |
| ValuStrat and valuation firms | Formal valuations, price indices, advisory | RICS/DLD/RERA credibility | Trust anchor for formal valuation | FonatProp should clearly say "market estimate / broker intelligence", not formal RICS valuation |
| New dashboard clones: Property Index, DataDXB, RealEstateIQ, PropertyIntel, DXBData | Market dashboards, price indices, investor analytics, developer scorecards | Mostly DLD/Dubai Pulse plus enrichment | Noise and fast copycats | Brand, UX, workflow, API quality, and broker-specific distribution matter more than just charts |

## France competitor map

| Competitor | What they sell | Data/claim | Threat to FonatProp | Gap FonatProp can attack |
| --- | --- | --- | --- | --- |
| MeilleursAgents / SeLoger | Consumer estimation, price maps, agency lead generation, market barometers | Transactions, listings, partner agency data, data-science team | Biggest consumer trust and SEO competitor | FonatProp should be pro-grade and transparent, not just a consumer lead form |
| PriceHubble | Enterprise AVM/API, valuation, rent, market reports, portfolio tools | Multi-country AVM, sale/rental models, confidence score, value ranges, energy/EPC prediction, API-first | Strongest enterprise AVM competitor | FonatProp can start with SMB agencies and better visual, local, explainable workflows |
| Yanport | B2B real estate data API and estimation tools | Estimation of price/rent across France, listings/market data, API for residential professionals | Strong B2B data/API competitor | FonatProp can differentiate with cross-source official data, risk/energy/investment modules, and client-ready narratives |
| SeLoger estimation / LaCoteImmo ecosystem | Consumer estimates and price per sqm pages | Current market data and AI estimation claims | Strong funnel and brand | FonatProp should avoid pure SEO battle early; use broker widget + reports |
| Castorus | Listing history, price changes, browser extension | Tracks changes across major listing sites | Good radar/opportunity reference | FonatProp can integrate "price cut + DVF + DPE + risk + rent legality" rather than just price history |
| LyBox / Horiz.io | Rental investment calculators, yield, cash flow, tax simulations | Investor workflow, paid tiers | Threat to investment module | FonatProp can combine valuation, market data, renovation, DPE, rent caps, and broker reports in one place |
| Notaires / Perval / BIEN | Notarial transaction databases and official price indices | Perval covers France excluding Ile-de-France; BIEN covers Ile-de-France; used for Notaires-INSEE indices | Highest credibility, but access is restricted/paid | Use as validation/premium benchmark later, not MVP dependency |
| Stream.estate / other real estate APIs | API for valuation, comparables, market benchmarks, DPE-style enrichment | Granular French property data API | Build-vs-buy alternative and competitor | Use as benchmark/backup if open-data pipeline is slow |

## Data sources to prioritize

### Dubai

1. DLD open real estate data: sales, rents, projects, valuations, units, brokers, developers.
2. Dubai Pulse historical DLD transaction datasets.
3. Ejari/rental contract signals where available through DLD/rental index/open data.
4. Service charges and building/project metadata.
5. POIs, transit, waterfront, school, mall, metro, landmark distances.
6. Active listings only through compliant partnerships or licensed APIs. Avoid aggressive scraping of Property Finder/Bayut in Dubai because UAE cybercrime/data/privacy/IP risk is higher than in France.

### France

1. DVF official, DGFiP: backbone for sale transaction history. Updated semi-annually, latest official update verified as 2026-04-07.
2. DVF geolocalisee / Etalab and DVF+ open data by Cerema: best for maps and PostGIS workflows.
3. API Donnees foncieres: useful for GeoJSON-by-commune/bbox and lighter programmatic access.
4. DPE ADEME: key feature for France. DPE affects sale/rent desirability and renovation risk; use post-July-2021 datasets as primary.
5. BAN / Geoplateforme geocoding: use the newer IGN/Geoplateforme direction, not only the old api-adresse endpoint.
6. Cadastre and parcel geometry.
7. API Geo: communes, departments, postal codes, reverse commune lookup.
8. Georisques: flood, seismic, radon, soil, industrial and natural risk. Important for due diligence and risk discount.
9. INSEE: demographic, income, housing stock, IRIS-level socioeconomics where available.
10. Transport.data.gouv.fr and IDFM/RATP/SNCF GTFS: accessibility scoring.
11. Encadrement des loyers and zones tendues: required for France investment/rental module.
12. Construction/renovation: INSEE BT01, MaPrimeRenov, CAPEB/BatiPrix if paid data is acceptable later.
13. Listings: start with partnerships/APIs (Yanport, portal partnerships, Stream.estate-style vendors) before scraping at scale.

## Error reduction plan

### Model architecture

1. Keep separate market models: Dubai and France should not share trained weights. They can share UI and reporting logic.
2. Use a layered valuation stack:
   - baseline: median price per sqm by micro-market, property type, bedrooms/rooms, and recency
   - comparable engine: nearest and most similar closed transactions
   - ML model: XGBoost/LightGBM/CatBoost with spatial, temporal, property, building, and market features
   - ensemble/calibration: blend model with comparables and neighborhood median depending on confidence
3. Add quantile prediction or conformal prediction so every estimate has a range, not only a point estimate.
4. Use confidence gates. If comparable count, recency, geocode quality, or property-type match is weak, show wider range and lower confidence.

### Cleaning rules that matter most

1. Remove non-market and administrative records where possible: related-party transfers, bulk deals, mortgage/refinance artifacts, land/commercial noise when estimating residential units.
2. Separate off-plan/primary market vs resale in Dubai.
3. Separate apartment, villa/house, land, commercial, and mixed lots. Do not train one broad model unless type-specific features are robust.
4. Normalize surfaces: Dubai sq ft vs France sqm, transaction size vs property size, built-up vs plot size.
5. Detect outliers using price-per-sqm/price-per-sqft by local micro-market, not global thresholds.
6. Deduplicate listings and transactions; repeated listings and multi-lot DVF mutations can poison France medians.
7. Track source freshness. France DVF lags by publication cycle; Dubai DLD is fresher but still needs classification.

### Features with highest expected lift

Dubai:
- building/project fixed effects
- area/community, master project, waterfront, metro/mall/landmark distances
- floor/room/parking where available
- service charge
- rental contract/rental yield
- primary vs resale/off-plan
- developer/project delivery and supply pipeline

France:
- exact commune/IRIS/neighborhood, department, urban density
- DPE label, energy consumption, GES label, heating type where available
- building age/period and floor for apartments
- distance to transit/jobs/services
- Georisques risk flags
- zones tendues and rent-control ceiling for investment
- renovation cost proxy and MaPrimeRenov eligibility
- local liquidity: recent transaction count, days/listing signals if partnered data exists

### Validation protocol

1. Time-based backtest, not random split: train on older sales, test on later sales.
2. Report MdAPE/MAPE by segment, not only national/global:
   - Dubai: area, building, property type, bedroom count, primary/resale
   - France: commune, department, property type, DPE class, rural/urban, transaction count bucket
3. Benchmark against visible competitors on a sample:
   - Dubai: Bayut TruEstimate, Property Finder valuation, DXBinteract comps, Property Monitor if accessible
   - France: MeilleursAgents, SeLoger, DVF explorer, notaires public stats, PriceHubble/Yanport if demo access is possible
4. Track failure cases as product data:
   - no comps
   - bad geocode
   - stale market
   - unusual asset
   - luxury/outlier
   - renovation/condition unknown
   - missing DPE or unreliable DPE match
5. For broker demo reliability, prefer "conservative credible" over "flashy exact". A valuation range with 8 strong comps is more sellable than one fake-precise number.

## Product positioning

### Dubai offer

Private broker workspace:
- instant market estimate
- confidence score
- comps table
- rent/yield
- service charge impact
- client-ready PDF/report
- "why this price" explanation

Public agency widget:
- branded by agency
- captures owner/property-intent lead
- broad estimate or "valuation range preview"
- pushes lead to WhatsApp/email/CRM
- avoids promising exact public valuation

### France offer

Professional France valuation workspace:
- DVF-backed price range
- DPE impact
- risks/environment
- rent legality and investment yield
- renovation estimate
- comparables and map
- confidence score and source transparency

France differentiation:
- "DVF + DPE + risk + transport + rent law" in one workflow
- not just a price per sqm page
- not just an investment calculator
- not just a lead form

## Build priorities

1. Make confidence scoring real in both markets.
2. Add visible comparable evidence in the UI before adding more decorative sections.
3. Build a model-evaluation notebook/script that outputs segment error tables.
4. For France, upgrade from statistical V1 to ML V1 only after DVF+ and DPE joins are stable.
5. For Dubai, improve building/project normalization and primary/resale separation before chasing more features.
6. Add report export for brokers: this is more commercially useful than a generic dashboard.
7. Make every claim source-backed in the app copy: DLD/DVF/DPE/Georisques/etc.

## Source links

Dubai:
- DLD open real estate data: https://dubailand.gov.ae/en/open-data/real-estate-data/
- Dubai REST/DLD services: https://dubailand.gov.ae/en/news-media/dubai-land-department-enhances-dubai-rest-real-estate-services-via-improved-interactive-interface/
- Bayut TruEstimate: https://www.bayut.com/property-market-analysis/tru-estimate//
- Bayut TruEstimate report details: https://support.bayut.com/hc/en-us/articles/28577551045522-What-information-is-included-in-a-TruEstimate-Sales-report
- Property Finder valuation: https://www.propertyfinder.ae/en/tools/home-value-estimator
- Property Finder Data Guru context: https://www.propertyfinder.ae/en/about-us.html
- DXBinteract mission: https://dxbinteract.com/our-mission
- DXBinteract data methodology: https://dxbinteract.com/news/dubai-property-transaction-data-structure
- Property Monitor PMiQ: https://propertymonitor.com/products-and-services/pm/pmiq
- Property Monitor AVM partners: https://propertymonitor.com/valud-partners
- REIDIN: https://reidin.com/
- Dubai data regulations: https://www.digitaldubai.ae/data/regulations
- UAE data protection laws: https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws.

France:
- DVF official: https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres/
- API Donnees foncieres: https://www.data.gouv.fr/dataservices/api-donnees-foncieres/
- Cerema Datafoncier install/PostGIS context: https://datafoncier.cerema.fr/ressources/installer-une-base-donnees-fichiers-fonciers-et-dv3f
- DVF explorer: https://app.dvf.etalab.gouv.fr/
- DPE logements existants ADEME: https://data.ademe.fr/datasets/dpe03existant
- Georisques API: https://georisques.gouv.fr/api
- Georisques for real estate: https://api.gouv.fr/guides/geo-risques
- BAN/API address: https://www.data.gouv.fr/dataservices/API-Adresse-%28Base-Adresse-Nationale-BAN%29/
- BAN to IGN/Geoplateforme transition: https://adresse.data.gouv.fr/blog/lapi-adresse-de-la-base-adresse-nationale-est-transferee-a-lign
- API Geo communes: https://www.geo.api.gouv.fr/decoupage-administratif/communes
- Transport.data.gouv.fr API: https://www.data.gouv.fr/en/dataservices/le-point-dacces-national-aux-donnees-de-transport/
- Encadrement des loyers: https://www.data.gouv.fr/datasets/logement-encadrement-des-loyers/
- Perval/notaires: https://www.immobilier.notaires.fr/fr/articles/conseils-et-actualites/actualites/pervalfr-la-base-notariale-pour-une-estimation-immobiliere-fiable
- Notaires-INSEE bases BIEN/Perval: https://www.insee.fr/fr/metadonnees/source/indicateur/p1643/presentation
- MeilleursAgents data science: https://www.meilleursagents.com/expertise-scientifique/
- PriceHubble API: https://www.pricehubble.com/en/pages/real-estate-api/
- PriceHubble AVM: https://www.pricehubble.com/en/data/automated-valuation-models/
- Yanport API: https://www.yanport.com/solutions/api
- Yanport estimation: https://www.yanport.com/pages/estimation-immobiliere
- Castorus: https://www.castorus.com/
- LyBox: https://www.lybox.fr/
- Horiz.io: https://horiz.io/

AVM/reference:
- RICS automated valuation models: https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/automated-valuation-models
- Zillow AVM accuracy/model evolution reference: https://www.zillow.com/news/how-zillow-spent-20-years-teaching-ai-to-understand-home-value/
