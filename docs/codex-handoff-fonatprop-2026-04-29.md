# FonatProp Codex Handoff

Date: 2026-04-29  
Owner: Francisco Natale Oertly  
Purpose: portable context for a fresh Codex/Claude/ChatGPT session if the current chat breaks.

## One-Line Product Context

FonatProp is an AI-powered real estate intelligence product. The immediate commercial focus is Dubai brokerages: a private AI valuation workspace for agents plus a public lead-capture widget they can embed on their websites. France is being added as a separate market inside the same app, not mixed with Dubai.

## Main Local Repositories And Folders

- Main active web app: `C:\Users\franc\FonatProp_Data_Lake\03_apps\realprice-dubai-web`
- Data lake root: `C:\Users\franc\FonatProp_Data_Lake`
- France raw data: `C:\Users\franc\FonatProp_Data_Lake\02_france`
- France processed DVF parquet cache: `C:\Users\franc\FonatProp_Data_Lake\90_processed\france_dvf_residential_parquet`
- Older frontend/Dubai project references: `C:\Users\franc\realprice-github`
- Older API repo: `C:\Users\franc\realprice-api`
- Standalone widget folder created earlier: `C:\home\claude\realprice-widget`

## Production URLs

- Main domain: `https://fonatprop.com`
- Dubai app route: `https://fonatprop.com/fonatprop`
- Broker demo: `https://fonatprop.com/broker-demo`
- France route under construction: `https://fonatprop.com/france`
- Legacy/live valuation API: `https://web-production-9051f.up.railway.app`
- API docs: `https://web-production-9051f.up.railway.app/docs`

## Current Branding

- Final brand name: `FonatProp`
- Tagline: `AI-powered real estate intelligence`
- Desired style: premium, cinematic, dark mode, real estate/investor-grade, not playful.
- Logo assets are under: `public/brand/`
- Important logo-like files seen/used:
  - `public/brand/fonatprop-logo-nav.png`
  - `public/brand/fonatprop-final-icon.png`
  - `public/brand/fonatprop-logo-lockup-clean.png`
  - `public/brand/fonatprop-logo-lockup-clean.webp`
- User strongly dislikes boxed/blue-background logo treatment in the app. Preferred on web/demo: icon and wordmark floating cleanly, no obvious rectangular blue box. Dynamic logo video should not be used on the website, only in PowerPoint if useful.

## Dubai Product Scope

Immediate sellable offer for tomorrow/near-term meetings:

1. Private AI valuation workspace for broker/agency use.
2. Public lead-capture widget for the brokerage website.

Messaging distinction is critical:

- Private valuation: for the agency/agent, precise internal workflow.
- Public widget: broad/general estimate and lead capture, not a public exact valuation tool.
- Avoid language implying every website visitor gets exact valuation.
- Avoid awkward phrase `seller lead`; use `qualified property conversations`, `owner inquiries`, `valuation-intent leads`, or `property-intent leads`.

## Dubai API And Model Context

Live API base:

```text
https://web-production-9051f.up.railway.app
```

Known endpoints:

- `POST /predict`
- `GET /zones`
- `GET /metrics`
- `GET /zone-stats/{zone}`
- `GET /rental-yield/{zone}`
- `GET /service-charges/{zone}`
- `POST /comparables`
- `POST /investment`
- `GET /trends`
- `GET /trends/{zone}`
- `GET /renovation`
- `POST /renovation/estimate`

Validated Dubai model context:

- XGBoost v4-ish, R2 around `0.889`, MAPE around `12.7%`.
- Trained on roughly `234K` DLD transactions after later enrichment, with previous API notes referencing `98,775` clean training rows.
- User wants the valuation experience to be extremely reliable for Dubai broker demos.

Important Dubai endpoint in the Next.js app:

- `src/app/api/predict-address/route.ts`
- It proxies/preferentially calls the Railway `/predict-address` API and falls back to local slim address profiles.

## Google, Supabase, And Env Vars

Do not hardcode secrets in committed files.

Vercel env vars already discussed/used:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FONATPROP_API_BASE_URL`

Supabase:

- Project was created for FonatProp.
- Auth is intended to support email login/register.
- Earlier migration:
  `supabase/migrations/20260423_001_fonatprop_auth_foundation.sql`
- Tables planned/created there:
  - `profiles`
  - `subscriptions`
  - `master_access`
- Goal:
  - everybody can see public landing.
  - logged-in users can access public/logged tools.
  - paid/pro users eventually access valuation/investment/renovation.
  - Francisco should always have master/admin access.

## Broker Demo

Route:

- `src/app/broker-demo/BrokerDemoClient.tsx`
- Production URL: `https://fonatprop.com/broker-demo`

User wants broker demo:

- All English, no Arabic.
- Clear, sales-focused, short.
- Explain value fast:
  - private AI valuation for agents.
  - public lead widget for brokerage websites.
- Background photos should be real high-quality Dubai photos, visible enough, not crushed too dark.
- Header/logo should be clean, premium.
- Widget section should show the new/better widget.

Widget context:

- Standalone widget is in `C:\home\claude\realprice-widget\embed.js`.
- Local widget demo from Claude was served at:
  - `http://localhost:8080/`
  - `http://localhost:8080/embed.js`
- Widget embed model:

```html
<div
  data-realprice-widget
  data-mode="banner"
  data-agency-id="dubana-001"
  data-agent-phone="+971501234567"
  data-agent-email="info@dubana.ae"
  data-lead-webhook="https://hooks.zapier.com/hooks/catch/123/abc/"
></div>
<script src="./embed.js" async></script>
```

Widget behavior:

- Captures name, email, phone.
- Then asks address/building, bedrooms, area.
- Sends webhook events:
  - `banner_lead_captured`
  - `banner_address_estimate`
- Also produces WhatsApp/email handoff.
- For production, preferred architecture is central webhook under FonatProp backend, not each agency owning Zapier unless needed.

## Broker Deck / PowerPoint

Current generated premium deck:

- Desktop: `C:\Users\franc\OneDrive\Desktop\FonatProp_Broker_Deck_PREMIUM.pptx`
- Downloads: `C:\Users\franc\Downloads\FonatProp_Broker_Deck_PREMIUM.pptx`

Generator:

- `scripts/build_fonatprop_broker_sales_deck.py`

Latest change:

- Pricing slide redesigned with:
  - widget as standalone card.
  - valuation tokens as clearer table.
  - no text overflow.
- Final slide button made as a real PowerPoint shape with text and hyperlink, not an invisible overlay.

Deck desired structure:

1. Founder/Product Intro
2. Brokerage Problem
3. FonatProp Solution
4. How It Works
5. Pricing
6. Live Demo / CTA

Pricing currently requested:

- Widget Lead Capture: `AED 1,099/mo` / `$299/mo`
- AI Valuation Tokens:
  - 10 valuations/mo: `AED 1,465` / `$399`
  - 20 valuations/mo: `AED 2,199` / `$599`
  - 50 valuations/mo: `AED 4,400` / `$1,199`
  - 100 valuations/mo: `AED 7,345` / `$2,000`
  - 200 valuations/mo: `AED 12,855` / `$3,500`
- Add-on/bundle line:
  - Extra valuation credits available.
  - Widget + AI valuation bundles available.

Demo link only on final slide:

```text
https://fonatprop.com/broker-demo
```

## France Market Work

France must be a separate market, not mixed with Dubai.

Route:

- `src/app/france/page.tsx`
- Main client:
  `src/app/france/FranceMarketClient.tsx`

France should visually feel as premium as Dubai:

- same product quality.
- sections: `Valuation`, `Map`, `Radar`, `Investment`, `Renovation`.
- rotating backgrounds from real France locations, not only Paris:
  - Paris night / Eiffel Tower
  - Lyon
  - Côte d’Azur / Nice
  - Alps
  - Bordeaux
  - Provence if assets are added

Current France page already exists, but is still being improved. It uses:

- `src/data/france-dvf-market.json`
- `GoogleMapsLoader`
- `FonatPropLogo`
- sections inside `FranceMarketClient.tsx`

France data builder:

- `scripts/build_france_dvf_market.py`

Generated JSON:

- `src/data/france-dvf-market.json`

Generated from DVF raw data in data lake. Latest known JSON coverage after regeneration:

- `5,891,681` clean rows
- `908` communes
- `97` departments
- years `2021-2025`
- national median around `EUR 2,689/m2`
- median transaction value around `EUR 199,300`

Important bug fixed:

- `by_commune` previously repeated the same commune many times because of a SQL window/ranking join issue.
- Fixed in `scripts/build_france_dvf_market.py`.
- Regenerate with:

```powershell
cd C:\Users\franc\FonatProp_Data_Lake\03_apps\realprice-dubai-web
python scripts\build_france_dvf_market.py
```

France helper/API files added:

- `src/lib/france-market.ts`
- `src/app/api/france/valuation/route.ts`
- `src/app/api/france/communes/route.ts`
- `src/app/api/france/market/route.ts`
- `src/app/api/france/renovation/route.ts`

Planned France APIs:

- `POST /api/france/valuation`
- `GET /api/france/communes`
- `GET /api/france/market`
- `GET|POST /api/france/renovation`

France valuation V1:

- Statistical, based on DVF median by commune and property type.
- Not full ML yet.
- Inputs:
  - address
  - commune
  - property_type: `Appartement` or `Maison`
  - area_m2
  - rooms
- Future enrichment:
  - DPE energy label.
  - BAN/Géoplateforme geocoding.
  - cadastre/parcelle.
  - Géorisques.
  - transport.
  - INSEE.
  - encadrement des loyers.

France raw/source plan:

- DVF official: `https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres/`
- DVF geolocated: `https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/`
- DVF app reference: `https://github.com/etalab/DVF-app.git`
- DVF visual validation: `https://app.dvf.etalab.gouv.fr/`
- DVF+/Cerema: `https://datafoncier.cerema.fr/donnees/autres-donnees-foncieres/dvfplus-open-data`
- ADEME DPE: `https://www.data.gouv.fr/dataservices/api-dpe-logements`
- BAN / address geocoding: use current official/Géoplateforme direction rather than old deprecated endpoint when possible.
- API Géo: `https://geo.api.gouv.fr`
- Géorisques: `https://georisques.gouv.fr`
- Transport: `https://transport.data.gouv.fr`
- INSEE APIs and BT01 for macro/construction.
- Encadrement des loyers / zones tendues for investment/rent legality.

## Market Selector / Homepage Idea

User liked split-market entry:

- Left half: France / Eiffel Tower.
- Right half: Dubai / Burj Khalifa.
- Full-screen black-and-white photos.
- On hover: image moves slightly and becomes color.
- Center: circular FonatProp icon/logo with app name below.
- No big top nav; user requested remove top menu bar from market selector.
- Route idea:
  - `fonatprop.com` = market selector.
  - `fonatprop.com/fonatprop` = Dubai.
  - `fonatprop.com/france` = France.

## Design Preferences And Pitfalls

Do:

- Premium dark mode.
- Real city photos visible, not completely dark.
- Large editorial typography.
- Short, concrete, sales-readable language.
- Explain value in one sentence.
- Use photos that are clearly Dubai for Dubai, clearly France for France.
- Check mobile/responsive; user noticed mobile/minimized windows can look weird or freeze.

Avoid:

- Childish PowerPoint/template aesthetics.
- Overlapping text.
- Tiny paragraphs.
- Too many slides.
- Arabic in broker/demo/deck unless specifically requested again; latest advice was English only.
- Saying “seller lead” repeatedly.
- Making public widget sound like exact public valuation.
- Logo with ugly blue rectangle on web/demo.

## Commands

From active app repo:

```powershell
cd C:\Users\franc\FonatProp_Data_Lake\03_apps\realprice-dubai-web
npm run dev
npm run build
python scripts\build_france_dvf_market.py
python scripts\build_fonatprop_broker_sales_deck.py
```

Common local URLs:

- Next app usually: `http://localhost:3000`
- Dubai app: `http://localhost:3000/fonatprop`
- Broker demo: `http://localhost:3000/broker-demo`
- France: `http://localhost:3000/france`
- Standalone widget demo if served separately: `http://localhost:8080/`

## Current Risk / Next Steps

If continuing from here, check:

1. Run `git status` before editing.
2. Finish/verify France page integration with new `src/lib/france-market.ts` and API routes.
3. Run `npm run build`.
4. If build fails, fix TypeScript first.
5. Open `FonatProp_Broker_Deck_PREMIUM.pptx` and verify pricing/CTA visually.
6. Keep heavy raw DVF/Dubai files out of git; commit only scripts, app code, aggregated JSON, docs, and optimized assets.

## Communication Preference

Francisco wants execution, not vague planning. If something fails, do not answer with raw cryptic JSON. Explain the failure in plain Spanish and immediately fix or give the exact next step.
