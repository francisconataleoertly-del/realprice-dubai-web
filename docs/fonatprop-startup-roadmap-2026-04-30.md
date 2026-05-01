# FonatProp startup roadmap

Date: 2026-04-30
Scope: Dubai broker product + France market expansion

## What I changed now

1. Added a Dubai methodology/trust section to `/fonatprop`.
   - Positioning: broker trust, not public guesswork.
   - Explains DLD-first data, private workspace vs public widget, confidence logic, and local-market expansion.

2. Added a France data-moat section to `/france`.
   - Positions France as more than DVF.
   - Explains DVF, DPE, Georisques, BAN/API Geo, rental regulation, and notaires as future validation.

3. Fixed Recharts prerender warnings in the France investment module.
   - Charts now mount client-side with stable containers.
   - `npm run build` passes cleanly.

## Product priorities

### Must have before serious sales

1. Confidence score everywhere.
   - Dubai and France valuations should show a confidence grade, not just a number.
   - Confidence should depend on comparable count, recency, distance, property-type match, geocode quality, and model coverage.

2. Comparable evidence.
   - Every valuation should show 5-10 relevant sold comparables.
   - Include date, area, building/commune, price, price per sqm/sqft, and similarity score.

3. Client-ready report export.
   - Brokers need a PDF/share link more than another dashboard.
   - Report should include estimate, range, comps, source notes, yield, risks, and next-step CTA.

4. Lead inbox for widget submissions.
   - The widget is commercially strong only if the broker can see inquiries.
   - MVP: admin table with lead name, phone, email, property, estimate range, source site, status.

5. Legal/product wording.
   - Dubai: "market estimate", "broker intelligence", "not a formal RERA/RICS valuation".
   - France: "statistical estimate", "not expert appraisal", source limitations for DVF/DPE/geocoding.

### Dubai model upgrades

1. Separate primary/off-plan vs resale.
2. Normalize project/building names.
3. Add service-charge impact to valuation and investment.
4. Use Ejari/rental index where available for yield.
5. Build segment error tables by area, building, property type, bedrooms, and transaction volume.

### France model upgrades

1. Load DVF+ open data into PostgreSQL/PostGIS.
2. Join DPE by address/geocode and create DPE price-impact features.
3. Add Georisques risk flags by coordinate/parcelle.
4. Add zones tendues and rent-control ceilings to investment.
5. Train France ML v1 only after data joins are stable.
6. Validate against DVF explorer, MeilleursAgents/SeLoger estimates, and notaires public price stats.

## Sections to add next

### `/fonatprop`

1. "Broker report preview"
   - Show a realistic one-page valuation report.
   - This is sales-critical for agencies.

2. "Agency lead inbox"
   - Show the public widget producing a structured lead.
   - Name, phone, property, estimated range, handoff status.

3. "Why agencies use FonatProp instead of portals"
   - Portal valuation belongs to Bayut/Property Finder.
   - FonatProp valuation belongs to the agency.

### `/france`

1. "DPE impact"
   - Show A/B/C vs F/G price and renovation consequences.

2. "Risk layer"
   - Georisques card: flood, soil, radon, industrial risk.

3. "Rent legality"
   - Zones tendues and encadrement des loyers for investor workflows.

4. "Comparable explorer"
   - Map/list of recent nearby DVF sales with filters.

### `/broker-demo`

1. Shorter sales story above the fold.
2. Clear CTA: "Install the widget on your agency website".
3. Show one fake-but-realistic broker lead flow.
4. Add pricing tied to current deck pricing.

## Business wedge

Do not sell "AI valuation" by itself. Sell:

"A broker-owned valuation and lead-conversion system that turns real market data into client conversations."

Dubai first commercial wedge:
- private workspace for agents
- public widget for agency websites
- monthly SaaS + valuation credits
- report/export as premium feature

France expansion wedge:
- official-data intelligence for agencies and investors
- DVF + DPE + risk + rent law in one place
- professional reports, not consumer SEO pages
