# FonatProp Market Data Intelligence

Date: 2026-04-29

Purpose: collect the most useful verified data layers for FonatProp as a serious proptech product, with separate stacks for Dubai and France. This note focuses on what improves valuation accuracy, investment analysis, renovation planning, map quality, and neighborhood intelligence.

## Executive view

FonatProp should treat the two markets differently:
- `Dubai` is a platform and regulatory market with stronger entity-specific services, rent rules, service-charge logic, project status workflows, and address systems.
- `France` is an open-data market with stronger public transaction transparency, building-energy data, parcel data, and legal rent / renovation intelligence.

The product should not try to force one exact data model across both markets. The right move is:
- common UI and product grammar
- separate valuation pipelines
- separate address intelligence
- separate legal / investment logic

## Dubai: highest-value verified layers

### 1. Transactions and official market backbone
- Digital Dubai / Dubai Pulse landing:
  - `https://www.digitaldubai.ae/data/get-data/1000`
  - `https://www.digitaldubai.ae/apps-services/details/dubaipulse`
  - `https://www.dubaipulse.gov.ae/data/category`
- Why it matters:
  - official data backbone for city datasets
  - real-estate categories exist on Dubai Pulse
- FonatProp use:
  - official contextual datasets around the DLD transaction core
  - transport, demographics, housing, and city analytics

### 2. DLD / Dubai REST ecosystem
- Dubai REST update:
  - `https://dubailand.gov.ae/en/news-media/dubai-land-department-enhances-dubai-rest-real-estate-services-via-improved-interactive-interface/`
- Why it matters:
  - official app includes off-plan project completion percentage, actual project photos, escrow references, license checks, rental calculator, service fee indicator, investment map and project status workflows
- FonatProp use:
  - investor intelligence
  - project-tracking context
  - off-plan monitoring cues

### 3. Rental Index and Smart Rent logic
- Rental Index service:
  - `https://dubailand.gov.ae/en/eservices/rental-index/?r=1`
  - `https://dubailand.gov.ae/en/eservices/rental-index/rental-index`
- Smart Residential Rent Index explainer:
  - `https://dubailand.gov.ae/media/thwlcxn4/smart_rental_index_en.pdf`
- FAQ context:
  - `https://dubailand.gov.ae/en/frequently-asked-questions`
- Why it matters:
  - rent guidance in Dubai is rule-driven and official
  - DLD explicitly states the smart residential rent index relies on building classifications and AI-backed criteria
- FonatProp use:
  - rent benchmark module
  - renewal / landlord scenario analysis
  - investor underwriting context

### 4. Service Charge Index / Mollak
- Service Charge Index:
  - `https://dubailand.gov.ae/en/eservices/service-charge-index-overview/`
  - `https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index`
- Legacy/public Mollak page:
  - `https://mollak.dubailand.gov.ae/publicpages/service-charge-index.html`
- Why it matters:
  - service charges are a real underwriting variable in Dubai
- FonatProp use:
  - investment cashflow realism
  - building-level ownership cost profile
  - broker discussions that go beyond sale price only

### 5. Makani address intelligence
- Makani public service:
  - `https://www.makani.ae/MakaniPublicDataService/MakaniPublic.svc`
  - `https://www.makani.ae/makaniservice/Makani.svc/help`
- Why it matters:
  - Dubai has an official addressing and navigation identity layer
- FonatProp use:
  - address normalization
  - exact location lookup
  - future building and parcel crosswalks

### 6. Transport and mobility
- RTA open data:
  - `https://rta.ae/wps/portal/rta/ae/home/open-data?lang=en`
- Why it matters:
  - official mobility context and station/ridership ecosystem
- FonatProp use:
  - commute scoring
  - transit-access layers
  - neighborhood and investor narrative

### 7. Schools and family-driven neighborhood quality
- KHDA school ratings:
  - `https://web.khda.gov.ae/en/About-Us/Whats-New/Dubai-school-inspection-ratings`
- KHDA inspection key findings:
  - `https://web.khda.gov.ae/en/About-Us/Whats-New/Inspection-Key-Findings-2023-2024`
- Note verified:
  - KHDA announced a pause on school inspections for the `2025-26` year, while still monitoring through targeted visits:
    `https://web.khda.gov.ae/en/About-Us/News/2025/KHDA-announces-pause-on-school-inspections-for-202`
- FonatProp use:
  - premium family-buyer map layers
  - school proximity plus school quality context

### 8. Utilities and occupancy costs
- DEWA slab tariff:
  - `https://www.dewa.gov.ae/en/consumer/billing/slab-tariff`
- DEWA move-in / move-out:
  - `https://www.dewa.gov.ae/en/about-us/service-guide/consumer-services/move-to`
- Why it matters:
  - recurring occupancy costs affect rental and end-user affordability
- FonatProp use:
  - living-cost sidebars
  - investor hold-cost modeling
  - relocation / owner-occupier calculators

### 9. Construction, permitting, and quality risk
- Build in Dubai / building permits:
  - `https://www.dubai.ae/living/property-housing/building-permit`
- Building quality and safety law:
  - `https://www.protocol.dubai.ae/en/media-listing/news-events/mohammed-bin-rashid-issues-law-on-quality-safety-of-buildings-in-dubai/`
- Why it matters:
  - regulation is moving toward a unified building database and stronger safety/quality oversight
- FonatProp use:
  - renovation and due-diligence roadmap
  - future building-quality flags
  - development feasibility and regulatory overlays

### 10. Current market activity references
- DLD Q1 2026 transactions release:
  - `https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026/`
- DLD Q1 2026 rental release:
  - `https://dubailand.gov.ae/en/news-media/dubai-s-rental-market-charts-stable-trajectory-reflecting-integrated-regulatory-environment-and-sustained-public-confidence/`
- Why it matters:
  - official macro validation and investor narrative for deck, website and market pages

### 11. Commercial intelligence layers worth evaluating
- Property Monitor PMiQ:
  - `https://propertymonitor.com/products-and-services/pm/pmiq`
- DXBinteract:
  - `https://dev.dxbinteract.com/`
  - `https://dxbinteract.com/news/dubai-property-transaction-data-structure`
- Property Finder Market Watch:
  - `https://www.propertyfinder.ae/en/insightshub/market_watch/2026-annually-2026-364`
- Bayut market reports and area guides:
  - `https://www.bayut.com/mybayut/dubai-sales-market-report-2025/`
  - `https://www.bayut.com/area-guides/`
- Why they matter:
  - they add listings, search demand, pricing sentiment, building-level transaction browsing, and investment storytelling around the official DLD backbone

## France: highest-value verified layers

### 1. Transaction truth
- DVF:
  - `https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres/`
- DVF geolocalized:
  - `https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/`
- DVF+:
  - `https://datafoncier.cerema.fr/donnees/autres-donnees-foncieres/dvfplus-open-data`
- API donnees foncieres:
  - `https://www.data.gouv.fr/dataservices/api-donnees-foncieres`

### 2. Building identity and enrichment
- RNB:
  - `https://www.data.gouv.fr/datasets/referentiel-national-des-batiments`
  - `https://www.data.gouv.fr/dataservices/api-rnb/`
- BDNB:
  - `https://www.data.gouv.fr/datasets/base-de-donnees-nationale-des-batiments/`
  - `https://www.data.gouv.fr/dataservices/api-bdnb-open`
  - `https://www.data.gouv.fr/dataservices/api-bdnb-open-plus`

### 3. Energy and renovation base
- DPE API:
  - `https://www.data.gouv.fr/dataservices/api-dpe-logements`
- DPE datasets:
  - `https://data.ademe.fr/datasets/dpe03existant`
  - `https://data.ademe.fr/datasets/dpe02neuf`
  - `https://data.ademe.fr/datasets/dpe01tertiaire`

### 4. Address and parcel intelligence
- BAN / Geoplateforme migration note:
  - `https://adresse.data.gouv.fr/outils/api-doc/adresse`
- Geoplateforme geocoding:
  - `https://www.data.gouv.fr/dataservices/api-geoplateforme-geocodage`
- API Cadastre:
  - `https://www.data.gouv.fr/dataservices/api-cadastre/`
- Parcellaire Express:
  - `https://www.data.gouv.fr/datasets/parcellaire-express-pci/`
- geo.api.gouv.fr:
  - `https://geo.api.gouv.fr/`

### 5. Risks and due diligence
- API Georisques:
  - `https://www.data.gouv.fr/dataservices/api-georisques/`
- Georisques docs:
  - `https://www.georisques.gouv.fr/doc-api`

### 6. Official rents and legal investment context
- OLL national results:
  - `https://www.data.gouv.fr/datasets/resultats-nationaux-des-observatoires-locaux-des-loyers`
- OLL by agglomeration:
  - `https://www.data.gouv.fr/datasets/resultats-des-observatoires-locaux-des-loyers-par-agglomeration/`
- Paris rent control data:
  - `https://www.data.gouv.fr/datasets/logement-encadrement-des-loyers/`
- TLV communes:
  - `https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-tlv-1`
- Zones tendues simulator data:
  - `https://www.data.gouv.fr/datasets/simulateur-des-zones-tendues/`
- Zonage ABC:
  - `https://www.data.gouv.fr/datasets/zonages-logement-abc-et-zonages-i-ii-iii/`

### 7. Amenities, attractions, lifestyle
- BPE:
  - `https://www.data.gouv.fr/datasets/base-permanente-des-equipements-1`
- DATAtourisme:
  - `https://www.data.gouv.fr/datasets/donnees-touristiques-de-la-base-datatourisme/`
- Basilic:
  - `https://www.data.gouv.fr/datasets/base-des-lieux-et-equipements-culturels-basilic/`
- Parcs et jardins publics:
  - `https://www.data.gouv.fr/datasets/parcs-et-jardins-publics-ouverts-au-public`
- Acces Libre API:
  - `https://www.data.gouv.fr/dataservices/api-acces-libre/`
  - `https://acceslibre.beta.gouv.fr/api/docs/`

### 8. Transport and access
- National transport data:
  - `https://transport.data.gouv.fr/`
- IDF Mobilites network:
  - `https://transport.data.gouv.fr/datasets/reseau-urbain-et-interurbain-dile-de-france-mobilites/`

### 9. Future supply and development pressure
- Sitadel monthly communal housing starts and permits:
  - `https://www.data.gouv.fr/datasets/logements-autorises-et-commences-series-mensuelles-communales-en-date-de-prise-en-compte/`
- API Carto urbanisme / GPU:
  - `https://www.data.gouv.fr/dataservices/api-carto-module-geoportail-de-lurbanisme-gpu`

### 10. Renovation costs, contractors, and cost indices
- ADEME renovation costs - chauffage:
  - `https://www.data.gouv.fr/fr/datasets/couts-des-travaux-de-renovation-chauffage/`
- ADEME renovation costs - isolation:
  - `https://www.data.gouv.fr/datasets/couts-des-travaux-de-renovation-isolation/`
- ADEME renovation costs - photovoltaique:
  - `https://www.data.gouv.fr/fr/datasets/couts-des-travaux-de-renovation-photovoltaique/`
- RGE firms:
  - `https://www.data.gouv.fr/datasets/liste-des-entreprises-rge`
- Historical RGE firms:
  - `https://www.data.gouv.fr/datasets/historique-des-entreprises-rge-depuis-2014`
- Insee construction cost and maintenance indices:
  - `https://www.insee.fr/fr/statistiques/2015347`
  - `https://www.insee.fr/fr/statistiques/8974776`
  - `https://www.insee.fr/fr/metadonnees/source/indicateur/p1626/description`

### 11. Commercial intelligence layers worth evaluating
- Yanport market observatory:
  - `https://www.yanport.com/solutions/data-360/observatoire-marches-immobiliers`
- Yanport data studies:
  - `https://www.yanport.com/blog/tags/donnees-immobilieres`
- Bien'ici observatory:
  - `https://corporate.bienici.com/actualites/press-details/lobservatoire-immobilier-bienici-au-premier-trimestre-2026`
- Notaires public price portal:
  - `https://www.immobilier.notaires.fr/fr/prix-immobilier-france`
- Castorus:
  - `https://www.castorus.com/`
- Why they matter:
  - they add live listing behavior, listing duration, asking-price changes, portal supply and professional-market indicators that DVF alone does not provide

## What each market should feed

### Dubai valuation and investment
- DLD transactions and internal model profiles
- Rental Index and Smart Rent logic
- Service Charge Index
- Makani
- DEWA cost context
- Dubai REST project status and off-plan progress

### Dubai renovation and operating cost
- Build in Dubai
- Law No. 3 of 2026 building quality context
- DEWA tariffs and deposits
- service charges

### France valuation and investment
- DVF / DVF+
- DPE
- RNB
- BDNB
- Cadastre / Parcellaire Express
- OLL
- TLV / zones tendues / encadrement / zonage ABC
- Georisques

### France renovation and reform
- DPE
- BDNB
- RNB
- ADEME renovation cost datasets
- RGE firms
- Insee BT01 / ICC / IPEA
- GPU planning overlays

## Practical build order for FonatProp

1. Keep separate valuation stacks for Dubai and France.
2. Improve France address resolution with postal-code-aware commune matching.
3. Add `RNB`, `BDNB`, `Cadastre`, and `OLL` to France before attempting a more serious ML model.
4. Add `Rental Index`, `Service Charge Index`, `Makani`, and `DEWA` context to Dubai investment tools.
5. Add `Sitadel`, `BPE`, `Basilic`, `DATAtourisme`, and `RTA` layers for premium map storytelling.
6. Keep a source registry and smoke tests so the product does not depend on memory or manual checking.

## Notes

- Do not build commercial dependencies on France `DV3F`; it is restricted to public-sector beneficiaries.
- For France geocoding, move future work to the Geoplateforme flow rather than legacy BAN endpoints.
- For Dubai, rent and service-charge logic should be treated as official decision-support signals, not scraped approximations.
