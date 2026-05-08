# FonatProp Outbound Setter System

This folder is the operating system for booking qualified demos for FonatProp.

Markets in scope:

- Dubai: broker demo, AI valuation workflow, website valuation widget.
- France: commercial product for agencies using DVF, DPE, rent rules, investment and renovation logic.

Do not use this system for bulk spam. The goal is premium, researched, low-volume outreach that books real Zoom calls with decision-makers.

## Daily Workflow

1. Add researched leads to `outbound/leads.csv`.
2. Run `python scripts/fonatprop_setter_pipeline.py`.
3. Review the scored output in `outbound/generated/scored_leads.csv`.
4. Review drafted messages in `outbound/generated/outreach_messages.md`.
5. Send only approved messages from the new FonatProp email or WhatsApp Business.
6. Update each lead stage after contact.

## Lead Stages

- `new`: found but not researched.
- `researched`: website/social/contact verified.
- `contacted`: first message sent.
- `follow_up_1`: first follow-up sent.
- `follow_up_2`: second follow-up sent.
- `qualified`: replied and fits the customer profile.
- `zoom_booked`: meeting scheduled.
- `attended`: meeting happened.
- `won`: paid or signed.
- `lost`: no fit, no budget, no response, or competitor.
- `do_not_contact`: opt-out or bad contact.

## Qualification Rules

A lead is strong when it has:

- Real estate agency, brokerage, mandataire network, property manager, or investor advisory activity.
- Active website, listings, Instagram, LinkedIn, portal profile, or visible lead funnel.
- Decision-maker or team lead contact.
- A clear pain: slow valuations, subjective broker pricing, weak website conversion, owner lead capture, renovation/investment advisory.

## Safe Outreach Rules

- Do not claim official partnership with DLD, DVF, ADEME, INSEE, Google, Meta, or any government body.
- Do not promise exact valuations.
- Use "AI-assisted valuation", "confidence range", "verified transaction evidence", "official/open data", or "broker workflow".
- Keep WhatsApp for warm/public business numbers and small manual batches.
- Stop immediately if someone asks not to be contacted.
- Keep messages short enough to read on mobile.

## Files

- `leads.csv`: working lead database.
- `setter-config.example.json`: sender identity, calendar link, market focus.
- `templates/`: approved outreach copy.
- `generated/`: created by the pipeline, ignored if empty.

