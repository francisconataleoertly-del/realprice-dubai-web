# FonatProp France Materials Pricing Research

Last updated: 2026-04-30

## Why this matters

For `FonatProp France`, renovation cannot stay at the level of generic `EUR/m2` bands.
If we want investment and reform to feel real, we need:

- retailer anchors for actual materials and fixtures
- installed ranges for bathrooms, kitchens and whole-home works
- project-level benchmarks for pool, garage and upper-floor creation
- a structure that lets the frontend move from `category ranges` to `searchable procurement intelligence`

The France catalog already supports that path in code:

- data file: `src/data/renovation-materials.ts`
- UI surface: `src/components/renovation/RenovationMaterialSearch.tsx`
- France API: `src/app/api/france/renovation/route.ts`

## Current France coverage

The live seed catalog now covers these France rooms/scopes:

- bathroom
- kitchen
- flooring
- walls
- windows
- doors
- pool
- mep
- whole_home

## High-signal price anchors

### Bathroom

- Wall-hung WC pack: `EUR 345.98 / set`
  Source: https://www.leroymerlin.fr/produits/complet-pack-wc-suspendu-82-cm-bati-support-pour-wc-a-reservoir-wc-suspendu-plaque-de-declenchement-ronde-blanche-97294266.html
- Vanity unit 90 cm: `EUR 359 / unit`
  Source: https://www.leroymerlin.fr/produits/meuble-simple-vasque-2t-l-90-x-h-57-x-p-48-1-cm-blanc-charm-86138457.html
- Shower column: `EUR 249 / unit`
  Source: https://www.leroymerlin.fr/produits/colonne-de-douche-avec-robinet-sensea-icone-chrome-91795229.html
- Shower tray 120 x 80: `EUR 339 / unit`
  Source: https://www.leroymerlin.fr/produits/receveur-de-douche-strato-extra-plat-blanc-120-x-80-cm-luxtone-34712874.html
- Walk-in shower screen: `EUR 159.90-189.90 / unit`
  Sources:
  https://www.castorama.fr/salle-de-bains-et-wc/douche/paroi-de-douche/cat_id_470.cat
  https://www.castorama.fr/mitigeur-de-douche-thermostatique-chrome-hansgrohe-thermo-ecostat-life/4059625522219_CAFR.prd
- Bathroom installed range: `EUR 500-1,500 / m2`
  Source: https://www.renoestim.fr/guide/prix-renovation-salle-de-bain
- Full supplied-and-installed bathroom: `EUR 1,000-3,000 / m2`
  Source: https://www.lamaisonsaintgobain.fr/salles-de-bain/conseils/renovation-de-la-salle-de-bain/prix-d-une-salle-de-bain

### Kitchen

- IKEA base cabinet for hob/oven: `EUR 127.99 / unit`
  Source: https://www.ikea.com/fr/fr/p/metod-maximera-element-bas-table-cuisson-four-tir-blanc-nickebo-anthracite-mat-s89498223/
- Stainless sink with drainer: `EUR 129.90 / unit`
  Source: https://www.leroymerlin.fr/produits/evier-a-encastrer-inox-lynx-1-bac-avec-egouttoir-63814436.html
- Laminate worktop 315 cm: `EUR 199 / unit`
  Source: https://www.leroymerlin.fr/produits/plan-de-travail-stratifie-marbre-oscuro-l-315-x-p-65-cm-ep-38-mm-89297492.html
- Compact worktop 300 cm: `EUR 509 / unit`
  Source: https://www.leroymerlin.fr/produits/plan-de-travail-compact-gesso-blanc-l-300-x-p-63-cm-ep-12-mm-82837406.html
- Induction hob: `EUR 449 / unit`
  Source: https://www.leroymerlin.fr/produits/cuisine/plaque-de-cuisson/plaque-a-induction/
- Built-in oven: `EUR 469.98 / unit`
  Source: https://www.leroymerlin.fr/produits/cuisine/four/four-encastrable/
- Integrated dishwasher: `EUR 394.95 / unit`
  Source: https://www.leroymerlin.fr/produits/cuisine/lave-vaisselle/lave-vaisselle-encastrable/
- Kitchen mixer benchmarks: `EUR 89.90-119 / unit`
  Sources:
  https://www.leroymerlin.fr/produits/mitigeur-de-cuisine-avec-douchette-delinia-fanny-argent-84752041.html

### Floors and walls

- Entry-level floor tile: `EUR 9.99-10.90 / m2`
  Source: https://www.leroymerlin.fr/produits/revetement-sol-et-mur/carrelage/carrelage-sol/
- Mid tile: `EUR 14.90-18.95 / m2`
  Sources:
  https://www.leroymerlin.fr/produits/revetement-sol-et-mur/carrelage/carrelage-sol/
  https://www.fr.bricodepot.com/catalogue/construction-renovation/carrelage-stratifie-parquet/produit-de-pose-de-finition-dentretien/
- Premium tile: `EUR 26.90-54.90 / m2`
  Source: https://www.leroymerlin.fr/produits/revetement-sol-et-mur/carrelage/carrelage-sol/
- Budget laminate: `EUR 7.49 / m2`
  Source: https://www.fr.bricodepot.com/catalogue/construction-renovation/carrelage-stratifie-parquet/produit-de-pose-de-finition-dentretien/
- Interior paint 10L: `EUR 49.90 / 10L`
  Source: https://www.leroymerlin.fr/produits/peinture-mur-plafond-boiserie-blanc-velours-luxens-couvrant-10l-20-grat-95909005.html
- BA13 plasterboard: `EUR 13.80 / unit`
  Source: https://www.leroymerlin.fr/produits/plaque-de-platre-ba13-280-x-120-cm-standard-knauf-66639664.html
- Glass wool insulation: `EUR 3.30 / m2`
  Source: https://www.leroymerlin.fr/produits/rouleau-de-laine-de-verre-kraft-supralaine-10x1-2m-ep-100mm-70591171.html
- Cladding benchmark: `EUR 41.90-44.90 / m2`
  Source: https://www.castorama.fr/materiaux-et-gros-oeuvre/cat_id_2711.cat/

### Windows and doors

- PVC double-glazed window: `EUR 125 / unit`
  Source: https://www.leroymerlin.fr/produits/fenetre-oscillo-battant-pvc-essentiel-h-105xl-80cm-1-vantail-tirant-g-blanc-96357383.html
- Interior door block: `EUR 99.90 / unit`
  Source: https://www.leroymerlin.fr/produits/menuiserie/porte-interieure/bloc-porte/bloc-porte-postforme-droite-huisserie-88mm-h-204-x-l-83-cm-poussant-gauche-63691733.html
- Motorized sectional garage door: `EUR 699 / unit`
  Source: https://www.leroymerlin.fr/produits/menuiserie/porte-de-garage/porte-de-garage-sectionnelle/porte-de-garage-sectionnelle-avec-portillon/porte-garage-sectionnelle-motorisee-avec-portillon-p.html?p=8

### MEP and energy

- Entry thermodynamic water heater: `EUR 598.99 / unit`
  Source: https://www.leroymerlin.fr/produits/chauffe-eau-electrique-lydos-hybride-ariston-100l-90491377.html
- Premium thermodynamic water heater: `EUR 2,099.96 / unit`
  Source: https://www.leroymerlin.fr/produits/chauffage-et-ventilation/chauffe-eau-et-ballon-eau-chaude/chauffe-eau-thermodynamique/chauffe-eau-thermodynamique-monobloc-elensio-de-dietrich-200-air-ambiant-air-exterieur-86386440.html

### Pool, garage and structural works

- Polyester shell pool: `EUR 15,000-27,000 / project`
  Source: https://www.prix-travaux.fr/piscine-a-coque/
- Full pool renovation: `EUR 8,000-15,000 / project`
  Source: https://liner-online.com/changer-son-liner-piscine-signes-dusure-et-bonnes-pratiques/
- New garage construction: `EUR 200-950 / m2`
  Source: https://www.travaux.com/construction-renovation-maison/guide-des-prix/prix-construction-garage
- House raising / second-floor creation: `EUR 1,800-4,000 / m2`
  Source: https://compiegne.lamaisondestravaux.com/extension/surelevation-maison/info-conseils/surelevation-de-maison-contraintes-et-options-possibles

## Product use inside FonatProp France

These anchors are useful for more than a static info panel.

### Investment

Use them to estimate:

- capex band before purchase
- room-by-room repositioning cost
- rent-upside versus renovation budget
- yield after light, mid or premium works

### Renovation

Use them to generate:

- bathroom pack estimates
- kitchen replacement scenarios
- wall, paint and insulation refresh budgets
- opening replacement budgets
- garage and pool project feasibility
- upper-floor or extension warning ranges

## Recommended next layer

The next sensible step is to separate the France renovation logic into three pricing layers:

1. `Retail anchors`
   Exact fixtures and materials with supplier links.
2. `Installed ranges`
   Bathroom, kitchen and whole-home ranges including labour.
3. `Heavy works`
   Structural, garage, pool and second-floor creation bands.

That would let the user switch between:

- `materials only`
- `supply + install`
- `full project`

without pretending that a shower mixer and a whole bathroom rebuild belong in the same pricing bucket.
