# FonatProp France Data Sources Backlog

Date: 2026-04-29

Purpose: collect France-side datasets and APIs for `fonatprop.com/france`, with a focus on sources that were not already in the original France brief. Priority is product usefulness for valuation, map UX, investment analysis, renovation context, and premium neighborhood storytelling.

## What is new vs. your original France list

The biggest additions are:
- `RNB` as the building identity layer France is otherwise missing
- `BDNB` as the building enrichment layer
- `API Cadastre` and `Parcellaire Express` for parcel-level joins
- `API Carto GPU` for urban planning and zoning overlays
- `BPE` for structured amenities at national scale
- `OLL` for observed rents
- `TLV` and `zonage ABC` for legal and investment rules
- `Basilic` and `Parcs et jardins publics` for richer lifestyle layers
- `Acces Libre` for accessibility metadata
- `Sitadel` for forward housing supply
- `Meteo-France climatology API` for climate and resilience context

## Highest-value additions for FonatProp France

If I had to prioritize the next non-obvious France layers after DVF, DPE, BAN, transport and Georisques:
1. `RNB`
2. `BDNB`
3. `API Cadastre` plus `Parcellaire Express`
4. `BPE`
5. `OLL`
6. `API Carto GPU`
7. `TLV` plus `zonage ABC`
8. `Sitadel`
9. `Basilic` plus `DATAtourisme`
10. `Acces Libre`

## Verified sources to add

### 1. RNB: Referentiel National des Batiments
- Dataset: `https://www.data.gouv.fr/datasets/referentiel-national-des-batiments`
- API: `https://www.data.gouv.fr/dataservices/api-rnb/`
- Why it matters:
  - France does not naturally give you one clean building ID in DVF.
  - `RNB` is the closest equivalent to the building/project identity layer you implicitly get more easily in Dubai.
- Product use:
  - one building sheet across multiple addresses
  - address deduplication in dense cities
  - better joins between DVF, DPE, building and parcel data

### 2. BDNB: Base de donnees nationale des batiments
- Dataset: `https://www.data.gouv.fr/datasets/base-de-donnees-nationale-des-batiments/`
- Open API: `https://www.data.gouv.fr/dataservices/api-bdnb-open`
- Open Plus API: `https://www.data.gouv.fr/dataservices/api-bdnb-open-plus`
- Why it matters:
  - official building enrichment at national scale
  - building-level context that DVF alone does not provide
- Product use:
  - enrich valuation cards
  - building profile panels
  - renovation and energy context before you have a full in-house France ML stack

### 3. API Cadastre
- API: `https://www.data.gouv.fr/dataservices/api-cadastre/`
- Why it matters:
  - easier parcel queries than building a full cadastre workflow immediately
- Product use:
  - parcel lookup from the France map
  - address to parcel resolution
  - parcel metadata in the valuation detail panel

### 4. Parcellaire Express
- Dataset: `https://www.data.gouv.fr/datasets/parcellaire-express-pci/`
- Why it matters:
  - parcel geometry layer assembled from cadastral data
- Product use:
  - parcel polygons on map
  - joins between address, parcel, transaction and risk data
  - cleaner parcel overlays than ad hoc geocoding only

### 5. API Carto - urbanisme / GPU
- API: `https://www.data.gouv.fr/dataservices/api-carto-module-geoportail-de-lurbanisme-gpu`
- Why it matters:
  - official urban planning and zoning intersection by geometry
  - useful for PLU and regulatory overlays
- Product use:
  - zoning context in the map
  - urban planning constraints in the property detail
  - future renovation / development feasibility hints

### 6. API Carto - cadastre
- API: `https://www.data.gouv.fr/dataservices/api-carto-module-cadastre/`
- Why it matters:
  - simplified access to parcel geometries and divisions
- Product use:
  - fast parcel geometry retrieval
  - map-side cadastre tools without building everything from raw files first

### 7. BPE: Base permanente des equipements
- Dataset: `https://www.data.gouv.fr/datasets/base-permanente-des-equipements-1`
- Why it matters:
  - structured national amenity backbone
  - much cleaner than random POI scraping
- Product use:
  - school proximity
  - healthcare proximity
  - retail / culture / sport / transport amenity scoring
  - France neighborhood score and radar

### 8. OLL: Observatoires locaux des loyers
- National results: `https://www.data.gouv.fr/datasets/resultats-nationaux-des-observatoires-locaux-des-loyers`
- Agglomeration results: `https://www.data.gouv.fr/datasets/resultats-des-observatoires-locaux-des-loyers-par-agglomeration/`
- Why it matters:
  - observed rents by housing type, room count, construction period and occupancy age
- Product use:
  - rental yield realism
  - rent benchmark panel
  - France investment mode

### 9. TLV and zones tendues
- TLV communes list: `https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-tlv-1`
- Zones tendues simulator data: `https://www.data.gouv.fr/datasets/simulateur-des-zones-tendues/`
- Why it matters:
  - official tension classification and vacancy-tax context
- Product use:
  - legal investment context
  - landlord guidance
  - location-level compliance messaging

### 10. Zonage ABC
- Dataset: `https://www.data.gouv.fr/datasets/zonages-logement-abc-et-zonages-i-ii-iii/`
- Why it matters:
  - official tension / housing classification used by financing and housing policy
- Product use:
  - investment filters
  - subsidy / financing logic
  - compare communes by structural pressure level

### 11. Geoplateforme geocoding migration
- BAN migration note: `https://adresse.data.gouv.fr/outils/api-doc/adresse`
- Geoplateforme geocoding API: `https://www.data.gouv.fr/dataservices/api-geoplateforme-geocodage`
- Why it matters:
  - the old `api-adresse.data.gouv.fr` endpoint is deprecated and the BAN page says it was scheduled for decommissioning at the end of January 2026
  - the Geoplateforme service is the correct target now
- Product use:
  - France address search
  - address validation
  - reverse geocoding
  - parcel-aware search

### 12. Geoplateforme routing and isochrones
- Routing docs: `https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/`
- Data.gouv search page for routing API: `https://www.data.gouv.fr/dataservices`
- Why it matters:
  - official travel-time computation from French public geo infrastructure
- Product use:
  - commute-time scores
  - walkability and drive-time rings
  - map-side "what is reachable in 10 or 20 minutes" features

### 13. geo.api.gouv.fr
- Site: `https://geo.api.gouv.fr/`
- Why it matters:
  - easy normalization for communes, departments, EPCI and regions
- Product use:
  - clean location chips
  - France filters
  - admin joins for charts and summaries

### 14. DATAtourisme
- Dataset: `https://www.data.gouv.fr/datasets/donnees-touristiques-de-la-base-datatourisme/`
- Why it matters:
  - attractions, sites and events with location fields
- Product use:
  - attractions layer
  - tourism intensity storytelling
  - premium location narrative

### 15. Basilic
- Dataset: `https://www.data.gouv.fr/datasets/base-des-lieux-et-equipements-culturels-basilic/`
- Why it matters:
  - geocoded cultural places and equipment from the Ministry of Culture
- Product use:
  - culture proximity scoring
  - premium neighborhood layer
  - stronger France positioning than generic POI lists

### 16. Acces Libre API
- API: `https://www.data.gouv.fr/dataservices/api-acces-libre/`
- Product site: `https://acceslibre.beta.gouv.fr/api/docs/`
- Why it matters:
  - accessibility metadata for establishments receiving the public
- Product use:
  - family / senior / accessibility overlays
  - neighborhood quality signals

### 17. Sitadel
- Monthly communal series: `https://www.data.gouv.fr/datasets/logements-autorises-et-commences-series-mensuelles-communales-en-date-de-prise-en-compte/`
- Why it matters:
  - forward-looking signal on housing permits and starts
- Product use:
  - supply pipeline heatmaps
  - future competition / supply pressure in investment analysis

### 18. Meteo-France climatology API
- API: `https://www.data.gouv.fr/dataservices/api-donnees-climatologiques/`
- Why it matters:
  - climate and historical weather data
- Product use:
  - resilience context
  - comfort storytelling
  - future premium neighborhood context, even if not a valuation-core feature on day one

### 19. BD TOPO
- Dataset: `https://www.data.gouv.fr/datasets/bd-topo-r/`
- Why it matters:
  - richer national topographic reference layer from IGN
- Product use:
  - higher-quality France map overlays
  - roads, built form, context and basemap enrichment

### 20. Parcs et jardins publics ouverts au public
- Dataset: `https://www.data.gouv.fr/datasets/parcs-et-jardins-publics-ouverts-au-public`
- Why it matters:
  - official green-space layer
- Product use:
  - green lifestyle score
  - family-friendly map layer
  - premium neighborhood storytelling

## Best product mapping

### Valuation
- DVF+
- DPE
- RNB
- BDNB
- BAN / Geoplateforme geocoding
- API Cadastre / Parcellaire Express
- Georisques

### Map
- DVF geolocalized
- API Cadastre
- Parcellaire Express
- BPE
- DATAtourisme
- Basilic
- transport.data.gouv.fr
- Acces Libre
- Parcs et jardins publics

### Investment
- OLL
- encadrement des loyers
- TLV / zones tendues
- zonage ABC
- Sitadel
- DPE

### Renovation
- DPE
- BDNB
- RNB
- API Carto GPU
- future subsidy logic

## Recommended implementation order

1. Keep `DVF+`, `DPE`, `BAN`, `Georisques` as the France core.
2. Add `RNB` for building identity.
3. Add `API Cadastre` and `Parcellaire Express` for parcel joins.
4. Add `BDNB` for building enrichment.
5. Add `BPE` for national amenity scoring.
6. Add `OLL` for rent benchmarks.
7. Add `TLV`, `zones tendues`, and `zonage ABC` for legal/investment logic.
8. Add `Sitadel` for supply pipeline.
9. Add `Basilic`, `DATAtourisme`, and `Parcs et jardins publics` for premium map layers.
10. Add `Acces Libre` and `Meteo-France` for richer experience once the valuation base is stable.

## Practical notes

- For search, do not build new France work on the old `api-adresse.data.gouv.fr` endpoint. The BAN docs point to the Geoplateforme geocoding service instead.
- For commercial product work, `DV3F` remains public-sector restricted, so keep the France stack on DVF, DVF+, DPE, RNB, BDNB Open and other open datasets.
- `BDNB Open Plus` may become useful later if the open quota is too small for production traffic.
