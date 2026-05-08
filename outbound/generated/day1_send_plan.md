# FonatProp Day 1 Send Plan

Date: 2026-05-05

Goal: send a controlled first outbound batch from the new FonatProp email, then use WhatsApp Business only for warm/manual follow-up where the number is public.

## Before Sending

1. Use the new email account, not your personal email.
2. Add a simple signature:

```text
Francisco Nataleo
Founder, FonatProp
AI valuation workflow for real estate agencies
https://fonatprop.com/fonatprop
fonatprop@gmail.com
WhatsApp: +54 9 11 2640-9578
```

3. If your new email is not `fonatprop@gmail.com`, replace it in the signature.
4. Do not add attachments on Day 1. Send only text plus the website link.
5. Send manually or in very small batches. Do not blast all contacts at once.

## Day 1 Batch

Send the first 15 from:

`outbound/generated/day1_email_batch.csv`

Recommended order:

1. White and Co Real Estate
2. Espace Real Estate
3. Allsopp and Allsopp
4. haus and haus
5. D and B Properties
6. AX Capital
7. Metropolitan Premium Properties
8. McCone Properties
9. Treo Homes
10. Provident Real Estate
11. Exclusive Links
12. Springfield Properties
13. Paragon Properties
14. Aqua Properties
15. Union Square House

## Sending Rhythm

- Send 5 emails.
- Wait 20-30 minutes.
- Send 5 more.
- Wait 20-30 minutes.
- Send 5 more.

## What To Do When Someone Replies

If they reply positively:

```text
Perfect. The demo is short: AI valuation workflow, website widget, lead capture, and how an agency can use it with its current website.

Would tomorrow or the day after work for a 15-minute Zoom?
```

If they ask for info:

```text
Of course. FonatProp helps Dubai brokerages speed up property valuations with AI-assisted ranges backed by verified transaction evidence, and adds a premium website widget that captures owner leads before visitors leave.

The broker still controls the final conversation. The product just gives the team a stronger starting point and more qualified leads.

I can show it in 15 minutes if useful.
```

If they say no:

```text
No problem, thanks for replying. I will not follow up again.
```

Then mark the lead as `lost` or `do_not_contact` in `outbound/leads.csv`.

## Follow-Up Timing

- Follow-up 1: 3 business days after first email.
- Follow-up 2: 7 business days after first email.
- Stop after follow-up 2 unless they reply.

## WhatsApp Business Rule

Do not use WhatsApp as a mass first-touch channel.

Use WhatsApp only when:

- The number is publicly listed as a business contact.
- The agency looks high-fit.
- You send manually.
- You keep it short and respectful.

Daily WhatsApp safe start: 5-10 manual messages, not more.

