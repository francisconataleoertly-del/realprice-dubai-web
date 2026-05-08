# FonatProp Market Research Sweep

Date: 2026-05-01

Scope: Dubai, France, AI valuation, lead capture, investment, renovation, materials, public APIs, commercial data sources and competitive references.

## Executive takeaway

FonatProp should not present itself as a generic valuation widget.

The strongest product thesis is:

- Dubai: official DLD transaction intelligence plus broker-facing AI valuation and lead capture.
- France: official DVF + DPE + rents + building data + renovation intelligence.
- Shared product: a premium AI real estate workflow that converts web visitors and reduces broker valuation time.

The most defensible angle is not only "AI valuation".
It is "AI valuation with official transaction evidence, renovation cost intelligence and lead capture built for brokerages."

## Dubai data stack

### Official transaction backbone

Use Dubai Pulse / DLD transactions as the core price truth.

Source:
https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open

Useful details found:

- Publisher: Dubai Land Department.
- Dataset: `dld_transactions-open`.
- Last visible update: 11 Feb 2026.
- File size shown: about 974.90 MB.
- Source frequency: daily.
- Provenance: sale, mortgage, inheritance, merge, separation and sub-separation transactions recorded by DLD.

Product use:

- model training
- building/project medians
- price-per-sqft bands
- mispricing radar
- broker valuation justification
- deck proof point

### Rental index

Dubai Smart Rental Index is important for investor and landlord workflows.

Sources:

- DLD Smart Rental Index announcement: https://dubailand.gov.ae/en/news-media/smart-rental-index-announcement/
- Smart Rental Index PDF: https://dubailand.gov.ae/media/thwlcxn4/smart_rental_index_en.pdf
- Dubai REST: https://dubailand.gov.ae/en/eservices/dubai-rest/

Useful product angle:

- rent cap / fair rent check
- investor yield realism
- legal rent increase context
- building-level quality signal

### Service charges

Service charge intelligence should be added to investment.

Sources:

- DLD / Dubai REST service charge access: https://dubailand.gov.ae/en/eservices/dubai-rest/
- DLD help page describing Service Charge Index access: https://dubailand.gov.ae/en/how-do-i

Product use:

- net yield, not only gross yield
- building-level operating cost
- investor risk flag

### Address / location

Makani should be considered for Dubai location normalization.

Source:
https://www.makani.ae/makaniservice/Makani.svc/help

Use:

- address matching
- map validation
- cross-linking user-entered property locations to official coordinates

### Utilities and environment

DEWA tariffs matter for investment and running-cost estimates.

Source:
https://www.dewa.gov.ae/en/consumer/billing/slab-tariff

Use:

- running-cost score
- tenant cost estimate
- investor operating assumptions

## France data stack

### Official transaction backbone

DVF is the France equivalent of the core transaction layer.

Source:
https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres/

Useful details found:

- Latest visible update: 7 April 2026.
- Open data since 2019 under the French legal publication framework.
- Covers real estate mutations, except some excluded territories.

Product use:

- valuation benchmark
- commune and property-type medians
- model training
- investor price discipline

### DPE energy layer

DPE is one of France's biggest differentiators versus Dubai.

Sources:

- API DPE logements: https://www.data.gouv.fr/dataservices/API-DPE-logements
- ADEME DPE existing dwellings: https://data.ademe.fr/datasets/dpe-v2-logements-existants
- Ministry DPE rules: https://www.economie.gouv.fr/particuliers/gerer-mon-argent/investir-dans-limmobilier/ce-quil-faut-savoir-sur-le-diagnostic-de-performance-energetique-dpe

Critical product signal:

- Since 1 Jan 2025, G-rated homes in metropolitan France can no longer be newly rented.
- DPE drives value, liquidity, rental legality and renovation urgency.

Use:

- green premium / brown discount
- rental-ban risk
- renovation urgency
- investor capex estimate
- lead magnet for France page

### Rent realism

France investment should use OLL where available and Carte des loyers as fallback.

Sources:

- OLL data on data.gouv: https://www.data.gouv.fr/fr/organizations/observatoires-locaux-des-loyers/datasets/
- OLL portal: https://www.observatoires-des-loyers.org/
- Open data access note: https://www.observatoires-des-loyers.org/comment-faire-pour/comment-acceder-aux-resultats-en-open-data
- Carte des loyers 2025: https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025
- Ministry explanation: https://www.ecologie.gouv.fr/politiques-publiques/carte-loyers

Important caution:

- Carte des loyers indicators should be treated carefully where observations are low, R2 is below 0.5 or prediction intervals are wide.

Use:

- gross yield
- rent cap comparison
- investor realism
- avoid overpromising rent

### Building and parcel intelligence

France should connect address -> building -> parcel -> urbanism -> risk.

Sources:

- BDNB API: https://www.data.gouv.fr/dataservices/api-bdnb-open
- Cadastre and parcel guide: https://api.gouv.fr/guides/amenagement-cadastre
- BAN geocoding migration note: https://adresse.data.gouv.fr/outils/api-doc/adresse
- GPU urbanism source: https://artificialisation.developpement-durable.gouv.fr/bases-donnees/geoportail-lurbanisme-gpu
- Georisques API: https://api.gouv.fr/les-api/api-georisques

Important note:

- Old `api-adresse.data.gouv.fr` is deprecated and was scheduled for decommissioning at the end of January 2026.
- New work should move toward Geoplateforme geocoding.

Use:

- address matching
- parcel-level risk
- renovation feasibility
- extension / upper-floor feasibility
- legal urbanism flags

### Amenities and future supply

Sources:

- INSEE BPE: https://www.insee.fr/fr/metadonnees/source/serie/s1161
- Sitadel / construction: https://www.statistiques.developpement-durable.gouv.fr/construction-de-logements-resultats-fin-mars-2026-france-entiere

Useful details:

- BPE 2024 includes 229 equipment/service types.
- BPE is localized down to commune, IRIS and coordinates depending on the equipment.
- Sitadel3 replaces Sitadel2 from March 2026 for new housing construction statistics.

Use:

- amenities score
- accessibility score
- future supply pressure
- local investment risk

## Renovation and materials

### France material anchors

Retail and guide sources now support a real materials database.

Sources:

- Leroy Merlin: https://www.leroymerlin.fr/
- Castorama bathroom category: https://www.castorama.fr/salle-de-bains-et-wc/cat_id_3322.cat/
- Brico Depot flooring category: https://www.fr.bricodepot.com/catalogue/construction-renovation/carrelage-stratifie-parquet/
- IKEA France kitchens: https://www.ikea.com/fr/fr/cat/solutions-cuisine-ka003/
- IKEA METOD kitchens: https://www.ikea.com/fr/fr/cat/metod-cuisines-ka005/
- Prix Travaux kitchen guide: https://www.prix-travaux.fr/prix-cuisine/
- Travaux.com garage guide: https://www.travaux.com/construction-renovation-maison/guide-des-prix/prix-construction-garage
- La Maison Saint-Gobain bathroom guide: https://www.lamaisonsaintgobain.fr/salles-de-bain/conseils/renovation-de-la-salle-de-bain/prix-d-une-salle-de-bain
- RenoEstim bathroom guide: https://www.renoestim.fr/guide/prix-renovation-salle-de-bain
- Prix-travaux pool guide: https://www.prix-travaux.fr/piscine-a-coque/
- Liner Online pool renovation: https://liner-online.com/changer-son-liner-piscine-signes-dusure-et-bonnes-pratiques/

Product use:

- room-by-room renovation calculator
- materials-only scenario
- supply-and-install scenario
- full-project scenario
- investor capex estimate
- renovation lead magnet

### Price examples to keep in product

Bathroom:

- Castorama: vanity unit examples around EUR 139-169.
- Castorama: 80 x 120 shower tray around EUR 179.90-229.90.
- Castorama: Grohe wall-hung WC pack around EUR 329.90-429.90.
- RenoEstim: bathroom renovation around EUR 500-1,500/m2.
- Saint-Gobain guide: complete bathroom renovation around EUR 1,000-3,000/m2.

Kitchen:

- IKEA: METOD base sink unit example around EUR 298.
- IKEA: SALJAN worktop example around EUR 65.
- IKEA: METOD / MAXIMERA base example around EUR 339.
- Prix Travaux: kitchen installation and renovation ranges should be used as full-project fallback.

Floors and walls:

- Brico Depot tile example: around EUR 21.90/m2.
- Leroy Merlin and Brico Depot category pages support tiles, laminate and wall products.

Heavy works:

- Garage construction: EUR 200-950/m2 guide range.
- House raising / upper-floor creation: keep as a premium warning range.
- Pool shell and pool renovation should stay project-level, not m2-only.

## Competitor and positioning notes

### Lead capture widgets

Sources:

- HomeScore: https://www.homescore.io/
- Casalead: https://casalead.de/
- HomeValuation.ai: https://homevaluation.ai/home
- REalyse Pulse widget: https://pulse.realyse.com/widget

Pattern:

- Most valuation widgets sell the same promise: visitor enters address, gets valuation, agent receives lead.
- FonatProp must differentiate with market evidence and premium broker workflow, not only "instant estimate".

### Dubai market intelligence competitors

Sources:

- Property Index: https://www.propertyindex.ae/
- Dubai REST: https://dubailand.gov.ae/en/eservices/dubai-rest/
- Property Monitor: https://propertymonitor.com/
- DXBinteract: https://dev.dxbinteract.com/

Positioning:

- Competitors prove that official DLD intelligence is valuable.
- FonatProp should position the broker workflow and widget as the product layer on top of official data.

### France and Europe valuation competitors

Sources:

- PriceHubble: https://www.pricehubble.com/
- Yanport: https://www.yanport.com/
- MeilleursAgents: https://www.meilleursagents.com/

Positioning:

- France is more competitive in AVM.
- The edge should be DPE + renovation + legal rent + broker workflow, not only price estimate.

## Product recommendations

### Dubai next

1. Add service charges to investment.
2. Add Smart Rental Index context to rental yield.
3. Keep the lead widget as a broad range, not a final valuation.
4. Add building/project confidence labels based on transaction depth.
5. Radar should compare published price vs building/project medians.

### France next

1. Move geocoding toward Geoplateforme.
2. Use DVF for price, DPE for energy, OLL/Carte des loyers for rent, BDNB for building context.
3. Add rental-ban risk to renovation and investment.
4. Add materials and installed work ranges to renovation.
5. Add Sitadel future-supply pressure to investment.

### Deck / sales story

Keep the story simple:

- Brokerages spend too long valuing properties.
- Too much pricing depends on broker opinion.
- Website visitors leave without converting.
- FonatProp uses AI and real transaction evidence.
- Private workflow helps the broker.
- Public widget captures leads first and shows a broad AI range.

## Additional sweep: high-value sources found next

This section adds data sources and product ideas that were not central in the first pass but can make FonatProp feel more complete.

## Dubai: next product-grade layers

### Ejari rent contracts

Dubai Pulse has a DLD open dataset for tenancy contracts registered in Ejari.

Source:
https://www.dubaipulse.gov.ae/data/dld-registration/dld_rent_contracts-open

Useful details found:

- Publisher: Dubai Land Department.
- Dataset: `dld_rent_contracts-open`.
- Updated: 11 Feb 2026.
- Size shown: about 4.4 GB.
- Source frequency: daily.
- Data provenance: Ejari system.

Product use:

- real rent comparables
- renewal risk
- building rent bands
- owner/investor net yield
- rental radar by building or community

Important product point:

The sales dataset gives value. Ejari gives rent reality.
Together they make a stronger investor module than price data alone.

### Dubai building permits

Dubai Municipality has an open dataset for building permits.

Source:
https://www.dubaipulse.gov.ae/data/dm-general/dm_building_permits-open

Useful details found:

- Publisher: Dubai Municipality.
- Dataset: `dm_building_permits-open`.
- Updated: 26 Jan 2026.
- Size shown: about 328 MB.
- Source frequency: daily.
- SDP update frequency: monthly.
- Expected daily ingestion: around 150 records.

Product use:

- construction pipeline
- neighborhood development momentum
- future supply pressure
- renovation / extension permit context
- investor risk around oversupply

### Dubai building quality and safety

Dubai introduced a new building quality and safety law in 2026.

Source:
https://dlp.dubai.gov.ae/Legislation%20Reference/2026/Law%20No.%20%283%29%20of%202026%20Concerning%20the%20Quality%20and%20Safety%20of%20Buildings.pdf

Product use:

- building risk flags
- due diligence checklist
- premium broker report
- renovation compliance prompts

### Al Sa'fat green building system

Dubai Municipality's Al Sa'fat system replaced older Dubai Green Building Regulations.

Sources:

- Dubai Municipality Al Sa'fat: https://www.dm.gov.ae/municipality-business/al-safat-dubai-green-building-system/
- Green Building Certification: https://www.dm.gov.ae/municipality-business/green-building-certification/

Useful details found:

- Al Sa'fat became the Dubai Green Building System replacing older regulations from 19 Oct 2020.
- The system was updated in 2020 and 2023.

Product use:

- sustainability score
- new-build quality signal
- renovation upgrade checklist
- investor premium/discount factor

### Dubai renovation ranges

Contractor and renovation guides show usable Dubai renovation bands.

Sources:

- Dubai renovation guide: https://abdullacarpentryest.ae/blog/dubai-renovation-cost-guide-2026-how-much-does-renovation-cost-in-dubai/
- Bathroom renovation guide: https://revivehub.ae/bathroom-renovation-dubai-2025-26-safe-guide/
- Flooring and tiling guide: https://revivehub.ae/flooring-and-tiling-dubai-guide-2025/
- Renovation company guide: https://karnakhome.com/how-to-choose-renovation-company-dubai-2026/

Important example ranges found:

- Dubai bathroom partial renovation: about AED 8,000-28,000 depending on level.
- Dubai full small bathroom: about AED 12,000-80,000 depending on level.
- Dubai full master bathroom: about AED 18,000-130,000 depending on level.
- Dubai tiling works: about AED 100-500+/m2 depending on finish.

Product use:

- renovation ROI calculator for Dubai
- flip/hold scenario
- owner upgrade budget
- listing quality uplift estimate

## France: legal and investment layers

### Rent control datasets

France has city/metro-specific datasets for rent control.

Sources:

- Paris rent control dataset: https://www.data.gouv.fr/datasets/logement-encadrement-des-loyers/
- Lyon rent control 2025-2026: https://www.data.gouv.fr/datasets/encadrement-des-loyers-de-la-metropole-de-lyon-2025-2026
- Ministry explanation: https://www.economie.gouv.fr/location-en-zone-tendue-et-encadrement-des-loyers-ce-quil-faut-savoir

Product use:

- legal rent cap
- investor yield realism
- warning if expected rent exceeds allowed rent
- city-specific underwriting

### Short-term rental regulation

Loi Le Meur changes how France short-term rentals should be handled.

Sources:

- Loi Le Meur summary: https://fr.wikipedia.org/wiki/Loi_Le_Meur
- Atout France webinar PDF: https://www.atout-france.fr/sites/default/files/2026-01/Support_Webinaire%20Loi%20Le%20Meur_030725.pdf

Useful details found:

- The law was promulgated on 19 Nov 2024.
- A national registration teleservice for furnished tourist rentals is planned by 20 May 2026.
- DPE becomes a more important constraint for furnished tourist rentals.

Product use:

- Airbnb/short-let feasibility warning
- investor strategy selector: long-term rent vs furnished tourism
- DPE-linked rental compliance risk

### Construction and permit APIs

France has emerging permit APIs that can help investors and merchants.

Sources:

- Data.gouv reuse: https://www.data.gouv.fr/reuses/api-rest-pour-interroger-les-311-000-permis-de-construire-france-avec-geocodage-ban
- PermisAPI: https://permisapi.fr/
- Data.gouv housing and urbanism portal: https://www.data.gouv.fr/en/pages/donnees_logement-urbanisme/

Useful details found:

- PermisAPI claims 311,000+ permits since 2022.
- It covers building, planning, development and demolition permits.
- It advertises geocoding and risk context.

Product use:

- future supply pressure
- property development radar
- merchant-dealer opportunity scoring
- detect renovation/conversion activity around a target asset

### Vacant housing and tax

Vacant housing taxation changed in the France 2026 finance context.

Source:
https://zerologementvacant.beta.gouv.fr/blog-et-actualites/reforme-de-la-fiscalite-sur-les-logements-vacants-ce-que-prevoit-la-loi-finances-pour-2026/

Product use:

- investor vacancy risk
- owner lead generation
- "vacant property recovery" angle
- local market pressure score

### Investment tax devices

Service-Public describes investment rental devices like Denormandie and Loc'Avantages.

Source:
https://www.service-public.gouv.fr/particuliers/vosdroits/F35782

Useful product angle:

- Denormandie is relevant for old housing with improvement or transformation works.
- Loc'Avantages is relevant when owners accept regulated rent levels under agreement.

Product use:

- investor tax prompts
- works threshold warnings
- rent-level strategy

## France: energy renovation and subsidy intelligence

### Simul'Aid€s API

API.gouv references an API for renovation aid simulation.

Source:
https://api.gouv.fr/les-api/api_aides_renovation_energetique

Product use:

- estimate possible subsidies
- net capex after aid
- owner lead magnet
- renovation decision support

### Mes Aides Réno

Mes Aides Réno is a public calculator reference from DINUM / BetaGouv and France Rénov.

Source:
https://www.data.gouv.fr/organizations/mes-aides-reno

Product use:

- match user profile to aid estimate
- explain subsidy logic inside renovation flow
- connect renovation pricing to financial assistance

### ANAH 2026 aid guide

ANAH published a 2026 financial aid guide.

Source:
https://www.anah.gouv.fr/sites/default/files/2026-02/Anah-FR-Guide_des_aides_Fev2026_WEB_20260224.pdf

Product use:

- reliable aid explanation
- renovation funnel
- investor owner-occupier distinction

### DPE rental-ban calendar

Use official or government-adjacent sources for the rental ban logic and treat commercial summaries only as supporting references.

Sources:

- Service-Public owner note: https://www.service-public.gouv.fr/particuliers/actualites/A17975
- Economy ministry rent control note: https://www.economie.gouv.fr/location-en-zone-tendue-et-encadrement-des-loyers-ce-quil-faut-savoir

Product use:

- DPE G: already a rental red flag.
- DPE F: major 2028 risk.
- DPE E: long-term 2034 risk.

## Global expansion notes

FonatProp should stay Dubai + France for now, but the future data roadmap can learn from other countries.

### UK

HM Land Registry Price Paid Data is one of the cleanest transaction datasets in Europe.

Source:
https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads

Useful details found:

- Includes England and Wales sales lodged with HM Land Registry.
- Covers transactions from 1 Jan 1995 to the current monthly data.
- Last visible update: 9 Apr 2026.
- February 2026 was listed as current month in the page snapshot.

Product learning:

- UK would be strong for a future transaction-based AVM.
- The public data model is clean, but EPC, flood risk and planning data would need joining.

### Netherlands

The Dutch market is document-heavy and data-rich, but transaction access often goes through Kadaster or commercial wrappers.

Sources:

- CBS/Kadaster price index dataset: https://data.overheid.nl/en/dataset/d51ebdf7-9302-49b9-a601-ff7a5ca15ab1
- Kadaster transaction API wrapper example: https://docs.altum.ai/english/property-valuation-and-market/kadaster-transaction-api
- HuisValue competitor reference: https://huisvalue.nl/
- PropSure competitor reference: https://propsure.ai/

Product learning:

- Netherlands shows a good direction for document-grounded property intelligence.
- FonatProp France can borrow the idea: DPE, cadastre, parcel, energy, risk and rent rules summarized by AI.

## New product modules to consider

### Dubai Investor Score

Inputs:

- DLD sale comps
- Ejari rent comps
- service charges
- Smart Rental Index
- building permits nearby
- Al Sa'fat / building quality where available

Output:

- gross yield
- estimated net yield
- rent legality / increase context
- service-charge drag
- supply pressure
- building quality risk

### France Renovation ROI

Inputs:

- DVF value baseline
- DPE
- rental-ban calendar
- OLL / Carte des loyers
- rent control
- materials catalog
- installed ranges
- aid simulation
- RGE / France Renov context

Output:

- capex range
- net capex after possible aid
- rental legality risk
- value uplift signal
- investor path: hold, rent, renovate, avoid

### AI Deal Room

Shared idea for both markets:

- Upload address or listing.
- AI reads property context.
- System compares official evidence.
- System estimates value, rent, renovation and risk.
- Broker gets a client-ready summary.

This is more defensible than a simple web widget.
