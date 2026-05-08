# FonatProp outbound setter system

Date: 2026-05-04

Scope: FonatProp Dubai, FonatProp France, and the broker demo sales motion.

## Goal

Build a repeatable outbound engine where human setters book qualified Zoom calls and an AI setter assistant does the slow work: research, scoring, personalization, draft messages, follow-ups, and CRM logging.

The AI should not mass-message agencies autonomously. It should prepare approved, personalized outreach and respect opt-out rules. This protects deliverability, avoids platform bans, and keeps FonatProp looking like a serious global proptech instead of a spam operation.

## Commercial model

Best first version:

- Setter only earns on qualified attended Zooms, not random leads.
- Qualified means: owner, director, branch manager, senior broker, or marketing/operations lead at an active real estate agency.
- Dubai target: brokerages selling or renting residential property, with active listings and a website or social lead funnel.
- France target: agencies, mandataires, property managers, renovation/investor advisors, or boutique brokerages in cities where DVF/DPE/rent-control logic gives FonatProp an edge.
- Suggested pilot payout: USD 20-50 per qualified attended Zoom.
- Suggested close commission: 10-20% of first month, setup fee, or first invoice.
- Stronger setter plan: 5-10% of the first 3 months if they consistently book qualified calls.

Keep the rule simple: no attendance, no payout; no decision-maker, no qualified call.

## Lead stages

Use these stages in the Lead Inbox:

- New: identified but not contacted.
- Researched: agency has website, market, city, contact, and pain hypothesis.
- Contacted: first message sent.
- Follow-up 1: first follow-up sent.
- Follow-up 2: second follow-up sent.
- Qualified: replied with interest and fits ICP.
- Zoom booked: calendar invite confirmed.
- Attended: prospect joined the call.
- Won: customer paid or signed.
- Lost: no fit, no budget, competitor, or no response.
- Do not contact: opted out or bad-fit contact.

## AI assistant responsibilities

The assistant can safely do:

- Build agency lists from public websites, LinkedIn pages, Google results, directories, portals, and official registries.
- Score agencies by fit, activity, geography, property type, and likely pain.
- Write a one-line personalization based on the agency website or listings.
- Draft outreach in English, French, Arabic, or Spanish.
- Draft short follow-ups.
- Prepare Zoom notes and demo flow.
- Log leads into Supabase/Lead Inbox through approved internal APIs.
- Flag risky contacts or missing consent.

The assistant should not:

- Send bulk WhatsApp messages to scraped numbers.
- Pretend to be a human if it is operating automatically.
- Claim official partnership with DLD, DVF, ADEME, INSEE, Google, or any portal.
- Promise exact valuations.
- Contact people who opted out.
- Use personal data beyond what is needed for B2B outreach.

## Claude or Codex setup

Create a dedicated project/agent named:

`FonatProp AI Setter Research Assistant`

Give it these resources:

- `docs/codex-handoff-fonatprop-2026-04-29.md`
- Latest broker deck PDF/PPTX
- Product URLs: `https://fonatprop.com/fonatprop`, `https://fonatprop.com/france`, `https://fonatprop.com/broker-demo`
- Lead Inbox/API docs
- This file
- Pricing rules and calendar link
- Approved outreach templates

Tools it should have:

- Browser/search
- Spreadsheet or CRM access
- Calendar link
- Supabase/Lead Inbox write access through a limited API key, not the database service key
- Email draft access, not automatic send access at first

If using Claude Agent Skills, create a custom skill folder with:

- `SKILL.md`: ICP, rules, messaging style, legal/compliance limits
- `templates/`: message templates
- `scripts/`: optional CSV-to-lead-inbox importer
- `references/`: deck, pricing, product one-pager

## System prompt

```text
You are the FonatProp AI Setter Research Assistant.

Your job is to help book qualified 15-minute Zoom calls for FonatProp, a proptech product for real estate agencies in Dubai and France.

FonatProp Dubai helps brokerages produce AI-assisted property valuations using verified Dubai transaction data and capture website visitors through a premium valuation widget.

FonatProp France helps agencies use official French market signals such as DVF, DPE, rent constraints, renovation economics, and investment checks.

You are not allowed to spam. You research first, personalize every message, and only draft outreach that a human can review or send.

Rules:
- Never claim FonatProp is officially partnered with DLD, DVF, ADEME, INSEE, Google, Meta, or any government body.
- Say "built with official/open market data" or "trained on verified transaction data" when accurate.
- Do not promise exact prices. Say AI-assisted valuation, range, confidence, comparable evidence, or broker workflow.
- Keep messages short, direct, respectful, and premium.
- Always include an opt-out friendly tone.
- If the contact is not a real estate decision-maker, mark it as low priority.
- If a person asks not to be contacted, mark Do not contact and stop.
- Goal CTA: "Would a 15-minute Zoom this week be useful?"

For every lead, output:
1. Company
2. Country/city
3. Website/social URL
4. Decision-maker or role
5. Why they fit
6. Pain hypothesis
7. Suggested first message
8. Follow-up 1
9. Follow-up 2
10. CRM stage
```

## Dubai opener

```text
Hi {name}, quick one. I saw {agency} is active in {area/signal}.

We built FonatProp for Dubai agencies: AI-assisted valuation plus a website widget that captures owners before they leave the site. The valuation flow is backed by verified Dubai transaction data, so brokers do not rely only on opinion.

Would a 15-minute Zoom this week be useful?
```

## France opener

```text
Bonjour {name}, j'ai vu que {agency} travaille sur {city/signal}.

We are building FonatProp France for agencies that want faster AI-assisted valuations using French market signals like DVF, DPE, rent rules, renovation economics, and investment checks.

Would a short 15-minute demo be useful this week?
```

## Follow-up 1

```text
Just checking if this is relevant.

The simple idea: faster AI valuation for your team, and a premium website widget that turns valuation visitors into qualified leads.

Worth a quick look?
```

## Follow-up 2

```text
Last note from me.

If valuation speed or website lead conversion is not a priority right now, no problem. If it is, I can show the Dubai/France workflow in 15 minutes.
```

## Human setter script for Zoom booking

Use this when someone replies with interest:

```text
Perfect. The demo is short: valuation workflow, public widget, lead capture, and how an agency can use it with its current website.

Here is the calendar link: {calendar_link}

If another person handles tech/marketing/operations, feel free to invite them too.
```

## Demo call structure

- Minute 0-2: ask about their current valuation and lead capture process.
- Minute 2-5: show the pain: manual valuations are slow, subjective, and inconsistent.
- Minute 5-8: show AI valuation backed by transaction evidence.
- Minute 8-11: show website widget capturing name, phone, email, and property intent.
- Minute 11-13: explain pricing and implementation.
- Minute 13-15: close next step: pilot, setup, or second call with decision-maker.

## Compliance notes

- For France/EU, B2B email outreach is generally more flexible than B2C, but recipients must be able to refuse future solicitation.
- For WhatsApp outbound, do not send automated first messages to scraped numbers. Use WhatsApp mainly for inbound, warm opt-in, or replies after clear permission.
- Always keep an unsubscribe/opt-out path for email campaigns.
- Keep a do-not-contact list.
- Store only the minimum needed lead data.

## Google Maps operational notes

- Use `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for client-side Maps JavaScript loading.
- Do not hardcode fallback API keys in React components.
- Restrict the browser key in Google Cloud to allowed referrers:
  - `https://fonatprop.com/*`
  - `https://www.fonatprop.com/*`
  - Vercel preview domains if needed for testing
  - `http://localhost:3000/*` only if local testing needs the same key
- Restrict APIs to only what the app uses:
  - Maps JavaScript API
  - Places API
  - Geocoding API only if client-side geocoding is required
- For server-side geocoding later, create a separate server key with IP restrictions and never expose it to the browser.

## Sources to keep nearby

- Claude Agent Skills: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Claude computer use: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
- Google Maps API security: https://developers.google.com/maps/api-security-best-practices
- CNIL relationship/prospecting guide: https://www.cnil.fr/sites/default/files/atoms/files/bpi-cnil-rgpd_fiche_2_ameliorez-maitrisez-votre-relation-client_0.pdf
