# FonatProp France: Investment & Renovation Research

Date: 2026-04-30

Purpose: collect the highest-value France datasets and official services that can materially improve `investment` and `renovation` inside `fonatprop.com/france`.

This note is not a generic France data dump. It focuses on the layers that help answer real investor and renovation questions:

- `Can I rent this asset at the level I underwrite?`
- `Is there a legal rent cap or a tension-zone rule I need to respect?`
- `How much capex is likely before this becomes rentable or financeable?`
- `Will local risks, permits, or future supply pressure hurt the deal?`
- `What aid, contractors, and renovation support exist around the asset?`

## Executive take

The best immediate France upgrade for FonatProp is not more transaction data alone.

For `investment`, the missing edge is:

- official or quasi-official `rent realism`
- `legal rent constraints`
- `future supply pressure`
- `risk and capex drag`

For `renovation`, the missing edge is:

- `DPE / energy urgency`
- `cost bands by work package`
- `aid eligibility context`
- `local execution network`
- `urbanism / parcel feasibility`

## 1. Official observed rents: the most important missing investment layer

### A. OLL - Observatoires Locaux des Loyers

URL:
- `https://www.data.gouv.fr/datasets/resultats-nationaux-des-observatoires-locaux-des-loyers/`

Why it matters:

- This is one of the strongest official rent references France offers.
- It is far better for investor realism than using sale prices alone.
- It can anchor `expected rent`, `gross yield`, and `rent realism` by local market.

Useful product fields:

- `rent_eur_m2`
- `furnished_vs_unfurnished`
- `rooms`
- `construction_period`
- `city_center_vs_rest`
- `apartment_vs_house`

How to use it in FonatProp:

- Use `OLL` as the premium rent source where coverage exists.
- Prefer it over scraped asking rents when present.
- Feed it into `/investment` as the baseline annual rent assumption.

### B. Carte des loyers / loyers d'annonce par commune

URL:
- `https://www.data.gouv.fr/fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/`

Why it matters:

- This gives much wider territorial coverage than `OLL`.
- It is built from a very large ad base and is useful as a fallback when `OLL` is absent.
- For FonatProp, this is the right second-tier rent layer after `OLL`.

Important caveat:

- Use the quality flags and observation thresholds.
- Where confidence is weak, mark the rent estimate as `market signal` rather than `official observed rent`.

Best use:

- `OLL` first
- `carte des loyers` second
- listing-based B2B data only as a later supplement

## 2. Legal rent context: critical for investment underwriting

### A. Encadrement des loyers

URLs:
- `https://www.data.gouv.fr/fr/datasets/loyers-de-reference-encadrement-des-loyers-a-paris/`
- `https://www.data.gouv.fr/fr/datasets/encadrement-des-loyers-a-lyon-et-villeurbanne/`
- `https://www.data.gouv.fr/fr/datasets/encadrement-des-loyers-sur-le-territoire-de-plaine-commune/`

Why it matters:

- If a city is rent-controlled, the investor cannot underwrite freely.
- This should directly constrain `max legal rent`.
- Without this, FonatProp France can overstate investment upside.

Best use in product:

- compute `legal_rent_cap_eur_m2`
- compare `observed_rent_eur_m2` vs `legal_rent_cap_eur_m2`
- flag:
  - `rent cap active`
  - `market rent above legal cap`
  - `yield constrained by regulation`

### B. Zones tendues

URL:
- `https://www.service-public.fr/simulateur/calcul/zones-tendues`

Why it matters:

- This is a strong legal/tension signal for the local housing market.
- It affects the rental context, notice rules, vacancy tax exposure, and general market tightness.

Product use:

- binary `zone_tendue`
- legal and investor context badge
- demand/tension support signal inside the France radar and investment score

### C. Zonage ABC

URL:
- `https://www.data.gouv.fr/datasets/zonages-logement-abc-et-zonages-i-ii-iii/`

Why it matters:

- This is not a rent value by itself, but it is a useful housing-tension classification.
- It helps sort markets by structural pressure and policy relevance.

Product use:

- `market_tension_zone`
- investment sorting
- explainability for why some communes price and rent differently

## 3. Future supply pressure: missing from most simple France models

### Sitadel - logements autorises et commences

URL:
- `https://www.data.gouv.fr/datasets/logements-autorises-et-commences-series-mensuelles-communales-en-date-de-prise-en-compte/`

Why it matters:

- This is one of the best official forward-looking supply signals.
- It helps answer whether new units are coming into the market.
- It is very useful for investors in medium and peripheral cities where supply shocks matter.

Product use:

- `authorized_units_12m`
- `started_units_12m`
- `supply_pressure_score`
- `future competition risk`

Suggested display:

- low / medium / high new supply pressure
- text like `new supply building in this commune`

## 4. Renovation urgency: DPE is a core underwriting layer, not just a green metric

### A. API DPE logements

URL:
- `https://www.data.gouv.fr/dataservices/api-dpe-logements`

### B. DPE logements existants

URL:
- `https://data.ademe.fr/datasets/dpe03existant`

Why it matters:

- In France, energy performance is directly linked to rental usability, buyer perception, and renovation capex.
- This is not optional context. It is central to investment and reform.

Most important product fields:

- `dpe_class`
- `ghg_class`
- `estimated_energy_cost`
- `surface`
- `heating_type`
- `construction_period`

### C. France Rénov' rental-ban timeline

URL:
- `https://france-renov.gouv.fr/interdiction-location-et-passoires-thermiques`

Why it matters:

- This is the strongest product narrative for renovation urgency.
- A bad DPE is not only a comfort issue. It can become a rental blockage or pricing drag.

Product use:

- `rental_ban_risk`
- `years_to_compliance`
- `needs_renovation_before_lease`

## 5. Renovation cost estimation: use official work-package datasets, not generic blog heuristics

### ADEME cost datasets

URLs:
- `https://www.data.gouv.fr/fr/datasets/couts-des-travaux-de-renovation-chauffage/`
- `https://www.data.gouv.fr/datasets/couts-des-travaux-de-renovation-isolation/`
- `https://www.data.gouv.fr/fr/datasets/couts-des-travaux-de-renovation-photovoltaique/`

Why they matter:

- These are directly relevant to the renovation estimator.
- They are far more defensible than a hand-made cost table.
- They let FonatProp break capex into actual renovation gestures.

Best use:

- build `cost bands` by:
  - heating
  - insulation
  - solar / photovoltaics
- estimate:
  - `minimum works`
  - `likely works`
  - `full energy-upgrade scenario`

Important note:

- Keep these as `scenario bands`, not fake precision to the euro.

## 6. Aid and execution network: essential if FonatProp wants to go beyond diagnosis

### A. MaPrimeRénov' and public aid context

URLs:
- `https://france-renov.gouv.fr/aides/maprimerenov`
- `https://www.anah.gouv.fr/presse/maprimerenov-reouverture-du-guichet-la-promulgation-de-la-loi-de-finances`

Why it matters:

- Users do not only ask `how much will it cost?`
- They ask `what help exists and what is the net cost after aid?`

Product use:

- `aid_possible`
- `aid_program_context`
- `net_cost_after_aid_band`

### B. RGE company list

URL:
- `https://www.data.gouv.fr/datasets/liste-des-entreprises-rge/`

Why it matters:

- RGE matters because aid and execution often depend on certified professionals.
- This is a practical post-estimate layer.

Product use:

- `rge_count_10km`
- `recommended_local_rge_network`
- local execution confidence for renovation scenarios

### C. Mon Accompagnateur Rénov'

URL:
- `https://www.data.gouv.fr/fr/datasets/liste-mon-accompagnateur-renov/`

Why it matters:

- It helps position FonatProp as a serious renovation-intelligence tool, not just a calculator.
- Good for larger works and more formal energy-upgrade projects.

### D. France Rénov' spaces by commune

URL:
- `https://www.data.gouv.fr/fr/datasets/espaces-conseil-france-renov-couverts-par-commune/`

Why it matters:

- Local support availability is a confidence layer for renovation feasibility.

### E. Communes covered by programmed renovation operations

URL:
- `https://www.data.gouv.fr/fr/datasets/liste-des-communes-couvertes-par-une-operation-programmee/`

Why it matters:

- This is useful for identifying places where there may be a stronger local renovation framework or support logic.

## 7. Urbanism and technical feasibility: key for serious reform work

### A. API Carto GPU

URL:
- `https://www.data.gouv.fr/dataservices/api-carto-module-geoportail-de-lurbanisme-gpu`

Why it matters:

- Renovation is not only about cost and energy.
- It is also about what can legally be changed on the parcel or building.

Product use:

- urbanism overlays
- protected areas
- planning rules
- renovation or extension feasibility flags

### B. API Cadastre

URL:
- `https://www.data.gouv.fr/dataservices/api-cadastre/`

Why it matters:

- Parcel identity and geometry are essential for land, house, extension, and legal-feasibility work.

### C. BDNB - Base de données nationale des bâtiments

URLs:
- `https://www.data.gouv.fr/datasets/base-de-donnees-nationale-des-batiments/`
- `https://www.data.gouv.fr/dataservices/api-bdnb-open`

Why it matters:

- BDNB gives building-level context France otherwise lacks in plain DVF.
- It is very relevant for renovation, building targeting, and pre-underwriting.

Product use:

- building identity and attributes
- crosswalk with DPE / RNB / Sitadel
- building-level enrichment for renovation and investment flows

## 8. Risk drag: this belongs in both investment and renovation

### Georisques API

URL:
- `https://www.data.gouv.fr/dataservices/api-georisques`

Why it matters:

- Risk is part of yield, insurance, resale friction, and works feasibility.
- It should feed both:
  - `investment risk adjustment`
  - `renovation complexity adjustment`

Product use:

- flood
- clay shrink-swell
- radon
- seismicity
- industrial / polluted-site context where relevant

## 9. Best product moves for FonatProp France now

If I had to choose the highest-return product upgrades for the next France iteration:

### Investment mode

1. Add `official or semi-official rent realism`
   - `OLL` where available
   - `carte des loyers` elsewhere

2. Add `legal rent constraint`
   - Paris / Lyon / Plaine Commune rent-control layers
   - `zones tendues`

3. Add `future supply pressure`
   - `Sitadel`

4. Add `risk haircut`
   - `Georisques`

5. Add `capex drag`
   - DPE + ADEME cost bands

### Renovation mode

1. Add `DPE urgency + rental-ban timeline`
2. Add `energy-upgrade work-package estimator`
3. Add `aid and net-cost scenario`
4. Add `RGE / Accompagnateur / local support network`
5. Add `urbanism feasibility`

## 10. Suggested underwriting fields

### For `/investment`

- `sale_price_eur`
- `official_rent_eur_m2`
- `market_rent_eur_m2`
- `legal_rent_cap_eur_m2`
- `zone_tendue`
- `zonage_abc`
- `gross_yield`
- `yield_after_capex`
- `supply_pressure_score`
- `risk_score`
- `dpe_class`
- `estimated_capex_band_eur`

### For `/renovation`

- `dpe_class`
- `rental_ban_risk`
- `recommended_work_packages`
- `heating_upgrade_cost_band`
- `insulation_cost_band`
- `solar_option_cost_band`
- `aid_possible`
- `net_cost_after_aid_band`
- `rge_count_nearby`
- `accompagnateur_available`
- `urbanism_constraint_flag`
- `risk_complexity_flag`

## 11. Recommended integration order

### Phase 1

- `OLL`
- `carte des loyers`
- `encadrement des loyers`
- `zones tendues`
- `DPE`
- `Georisques`
- `ADEME renovation cost datasets`

### Phase 2

- `Sitadel`
- `RGE`
- `Mon Accompagnateur Rénov'`
- `France Rénov' spaces by commune`
- `communes couvertes par une opération programmée`

### Phase 3

- `API Carto GPU`
- `Cadastre`
- `BDNB`

## 12. Practical product rule

For France, the strongest version of FonatProp is:

- `DVF / DVF+` for sale reality
- `OLL + carte des loyers` for rent reality
- `encadrement + zones tendues` for legal reality
- `DPE + ADEME + aids + RGE` for renovation reality
- `Georisques + Sitadel + GPU` for downside and feasibility reality

That combination is what turns the France product from a price viewer into an actual investor and renovation decision tool.
