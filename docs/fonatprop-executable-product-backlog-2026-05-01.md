# FonatProp Executable Product Backlog

Date: 2026-05-01

Purpose: turn the broker + architect opportunity map into an execution-ready
product backlog with concrete screens, endpoints, tables, rollout order and
commercial logic.

Scope:

- Dubai private broker workflow
- Dubai public widget
- France valuation, investment and renovation expansion
- premium B2B product, not a portal clone

## One-line product strategy

FonatProp should not stop at `AI valuation`.

It should become a broker-and-project decision system:

- value now
- capture owner lead
- win the mandate
- publish with the right price
- monitor live listing health
- estimate renovation and feasibility
- show post-works value and rent upside

## Who pays and why

### Primary buyer

- agency owner
- top broker
- boutique developer
- renovation-minded investor

### Internal users

- listing broker
- valuation desk
- sales manager
- architect or renovation adviser

### Core jobs to be done

1. Win the seller mandate faster.
2. Defend the asking price with evidence, not opinion.
3. Capture more owner leads from site traffic.
4. Know when a listing is overpriced before weeks are wasted.
5. Know whether a renovation is worth doing and whether it is feasible.
6. Convert rough renovation ranges into usable investment underwriting.

## Product principles

1. Every result should end with a next action.
2. Every number should show source quality and confidence.
3. Every premium screen should be exportable or shareable.
4. France needs legal, urbanism and DPE awareness.
5. Dubai needs DLD, rental, service-charge and listing-price awareness.
6. Renovation should separate:
   - materials only
   - supply + install
   - full project

## Epic 1: Mandate Pack

This is the fastest path to sales.

### Problem

Brokers still need a seller-ready deliverable after the valuation.
Without it, FonatProp remains a nice internal tool instead of a mandate-winning
system.

### User promise

`Generate a seller-ready valuation pack in minutes.`

### Screens

#### 1. Broker valuation result

Location:

- Dubai private workflow first
- France second

Needed blocks:

- headline value range
- confidence grade
- 5 to 10 sold comparables
- listing strategy:
  - fast sale price
  - target price
  - ambitious price
- rental snapshot
- if relevant, renovation-before-sale note
- share button
- export PDF button

#### 2. Seller-facing share link

Public-but-tokenized report page:

- branded for the agency
- no admin controls
- easy on mobile
- visible CTA:
  - book valuation call
  - send documents
  - request visit

#### 3. Report history

Private broker table:

- owner name
- address
- created at
- version
- shared / not shared
- opened / not opened
- converted / not converted

### API endpoints

- `POST /api/mandate-pack/create`
- `GET /api/mandate-pack/:reportId`
- `POST /api/mandate-pack/:reportId/share`
- `POST /api/mandate-pack/:reportId/export-pdf`
- `GET /api/mandate-pack/list`

### Data inputs

- valuation result
- comparable sales
- confidence score
- geocode quality
- market trend by area
- rent signal
- risk flags
- optional renovation scenario

### Tables

- `mandate_reports`
- `mandate_report_comparables`
- `mandate_report_events`
- `mandate_report_recipients`

### KPI

- report share rate
- report open rate
- mandate conversion rate
- days from lead to appointment

### MVP

- Dubai only
- PDF export
- share link
- confidence + comps + pricing band

### V2

- France version
- renovation-before-sale scenario
- voice note or broker intro block
- seller engagement tracking

## Epic 2: Listing Radar

This is the operating system layer brokers will keep open daily.

### Problem

Agencies often publish too high, react too late and do not know whether weak
performance comes from price, media or demand.

### User promise

`Know which listings are healthy, overpriced or losing momentum.`

### Screens

#### 1. Radar portfolio board

Columns:

- listing
- published price
- FonatProp model value
- market delta
- green / amber / red
- days live
- expected days live
- price-cut suggestion
- lead count
- owner follow-up status

#### 2. Listing detail

Blocks:

- current price versus model
- current price versus comparable listings
- lead velocity
- watchlist notes
- what to do now
- suggested message to owner

#### 3. Alert center

Rules:

- overpriced by x percent
- lead velocity below threshold
- no activity after y days
- price cut recommended
- demand recovered after edit

### API endpoints

- `POST /api/listings/import`
- `GET /api/listings/radar`
- `GET /api/listings/:listingId`
- `POST /api/listings/:listingId/reprice-suggestion`
- `POST /api/listings/:listingId/note`
- `POST /api/listings/:listingId/status`

### Data inputs

Dubai:

- live DLD transactions
- live asking price
- rental index
- service charge
- area and project medians

France:

- DVF and future live listing feed when available
- rent realism
- legal rent cap when applicable
- liquidity by city / district

### Tables

- `broker_listings`
- `broker_listing_snapshots`
- `broker_listing_alerts`
- `broker_listing_notes`
- `broker_listing_lead_metrics`

### KPI

- average days on market
- percent of red listings corrected within 7 days
- price-cut response time
- owner retention on difficult mandates

### MVP

- Dubai first
- manual CSV or form upload
- traffic-light status
- price-cut recommendation

### V2

- France live listings
- portal sync
- owner-facing weekly update

## Epic 3: France Project Twin

This is the strongest differentiated feature for France.

### Problem

A valuation alone does not answer the real investor or architect question:
`Can this project be done here, what will it cost, and what will it be worth after?`

### User promise

`Resolve feasibility, budget, risks and post-works value from one address.`

### Screens

#### 1. Address intake

Fields:

- address
- objective
- property type
- approximate size

Objectives:

- sell now
- renovate then sell
- buy to let
- improve DPE
- split / extend / reconfigure

#### 2. Project Twin result

Blocks:

- current value
- current rent reality
- DPE and rental-ban risk
- urbanism and parcel constraints
- georisks
- building facts
- recommended work packages
- gross and net renovation budget
- post-works value
- post-works rent
- payback / IRR signal

#### 3. Feasibility lane

Simple verdicts:

- feasible
- feasible with caution
- blocked pending study

Reasons:

- PLU / GPU issue
- parcel constraint
- DPE urgency
- risk exposure
- subsidy opportunity

#### 4. Expert next step

CTA blocks:

- request architect review
- request renovation budget
- export investor memo

### API endpoints

- `POST /api/france/project-twin/resolve`
- `GET /api/france/project-twin/:id`
- `POST /api/france/project-twin/:id/scenario`
- `POST /api/france/project-twin/:id/export`

### Data inputs

- DVF / France valuation engine
- OLL
- carte des loyers
- encadrement des loyers
- zones tendues / zonage ABC
- DPE API
- RNB
- BDNB
- Cadastre
- GPU / urbanism
- Georisques
- Sitadel
- renovation materials catalog
- aid layers:
  - MaPrimeRenov
  - RGE
  - Mon Accompagnateur Renov
  - France Renov advisers

### Tables

- `fr_project_twin_runs`
- `fr_project_twin_scenarios`
- `fr_asset_resolutions`
- `fr_asset_risks`
- `fr_asset_urbanism`
- `fr_asset_energy`
- `fr_asset_rent_rules`
- `fr_asset_value_uplift`

### KPI

- address resolution success rate
- scenario export rate
- architect referral rate
- investor session-to-contact conversion

### MVP

- address
- current value
- DPE risk
- rent realism
- georisks
- recommended works
- post-renovation value range

### V2

- parcel and GPU summary card
- permit-history card
- scenario comparison
- advisor routing

## Epic 4: Scope Builder

This is the renovation engine that makes FonatProp useful, not decorative.

### Problem

`EUR/m2` bands alone are too vague for investors, architects and serious
sellers.

### User promise

`Build a room-by-room scope with a real budget structure.`

### Screens

#### 1. Scope picker

Project types:

- bathroom
- kitchen
- floors
- walls and paint
- windows
- doors
- DPE upgrade
- garage
- pool
- upper-floor creation
- whole-home rental refresh

#### 2. Cost mode toggle

- materials only
- supply + install
- full project

#### 3. Quality tier toggle

- basic
- mid
- premium
- luxury

#### 4. Output card

- materials budget
- labour budget
- professional fees
- contingency
- subsidy estimate
- timeline band
- likely uplift to sale value
- likely uplift to rent

#### 5. Procurement detail

- example SKUs
- source links
- confidence badge:
  - retailer anchor
  - guide range
  - official aid
  - structural benchmark

### API endpoints

- `GET /api/france/renovation/materials`
- `POST /api/france/renovation/scope`
- `POST /api/france/renovation/scope/compare`
- `GET /api/france/renovation/suppliers`

Dubai extension later:

- `POST /api/dubai/renovation/scope`

### Data inputs

- current France materials catalog
- retailer anchors
- installed price guides
- heavy-works benchmarks
- DPE upgrade rules
- aid rules
- optional value-uplift model

### Tables

- `renovation_scope_templates`
- `renovation_material_skus`
- `renovation_labor_ranges`
- `renovation_heavy_work_ranges`
- `renovation_subsidy_rules`
- `renovation_scope_runs`

### KPI

- scope creation rate
- export rate
- contractor referral rate
- pre-sale renovation adoption rate

### MVP

- France only
- room packs
- mode toggle
- quality tiers
- net budget after aid estimate

### V2

- contractor matching
- time schedule
- procurement list export
- Dubai fit-out version

## Cross-epic data foundation

These tables should be treated as shared infrastructure:

- `property_valuations`
- `property_comparables`
- `property_confidence_scores`
- `property_rent_signals`
- `property_risk_signals`
- `property_energy_signals`
- `property_urbanism_signals`
- `property_supply_signals`
- `property_leads`
- `property_reports`

## Suggested rollout order

### Phase 1: sellable in 30 days

Build:

1. Mandate Pack
2. Dubai Listing Radar MVP
3. France Scope Builder MVP

Why:

- easiest to explain
- easiest to demo
- directly tied to broker pain
- strongest near-term commercial value

### Phase 2: France underwriting depth in 60 days

Build:

1. France Project Twin MVP
2. France rent legality layer
3. DPE + risk + aid integration

Why:

- this is where FonatProp becomes more than a presentation layer
- strongest moat versus generic AVM tools

### Phase 3: operating system in 90 days

Build:

1. listing alert automation
2. owner follow-up workflow
3. architect / contractor routing
4. scenario comparison and export

Why:

- daily product habit
- referral and partner revenue
- harder to replace

## What can already be sold before full build

Even before the full roadmap is complete, the sales message is already strong:

### Dubai

- private AI valuation for brokers
- public widget for owner lead capture
- broker report export
- pricing radar after publication

### France

- official-data valuation
- investment underwriting with legal and DPE context
- renovation scope builder
- future project feasibility layer

## Commercial positioning

Do not pitch:

- `we have an AVM`

Pitch:

- `we help agencies win mandates with AI-backed pricing`
- `we turn anonymous traffic into qualified owner leads`
- `we tell investors and architects what a project can become`
- `we connect valuation, renovation and feasibility in one workflow`

## The best two product names inside FonatProp

### 1. `Mandate Pack`

Easy to understand.
Immediate sales value.

### 2. `Project Twin`

Feels premium.
Feels architectural.
Feels harder to copy.

Those two can become the signature layers of the brand.

## My recommendation

If resources are tight, do not split attention evenly.

Build in this order:

1. `Mandate Pack`
2. `Dubai Listing Radar`
3. `France Scope Builder`
4. `France Project Twin`

This order gives the best mix of:

- sales clarity
- demo quality
- actual utility
- defensible product depth

