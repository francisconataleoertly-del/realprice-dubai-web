# FonatProp x C&B widget installation

This is the production embed for the C&B pilot. The token is an agency credential and must be generated in FonatProp admin or Supabase, then inserted only on the C&B website. Do not publish it in a proposal, screenshot, chat, repository, or public document.

```html
<div
  id="fonatprop-widget"
  data-fonatprop-widget
  data-agency-id="candb"
  data-agency-token="C_AND_B_WIDGET_TOKEN"
  data-mode="banner"
  data-widget-mode="valuation"
  data-brand-color="#111111"
  data-banner-title="Request a private property review"
  data-banner-cta="Start private review"
></div>
<script src="https://fonatprop.com/widget/embed.js" defer></script>
```

## Where it goes

Place the `<div>` where the widget should appear on the C&B page, ideally below the first property-value or investment call to action. Place the script once per page, after the div or in the site's global custom-code area.

## Provisioning checklist

1. Create a separate agency with ID `candb`, market `dubai`, a unique token, and the C&B production domains in `allowed_hosts`.
2. Keep routing disabled or `manual` until C&B confirms the receiving email, WhatsApp template and broker contact.
3. Add `candbproject.com` and `www.candbproject.com`; add a staging host only during testing.
4. Run one test with a real browser from an allowed host. Confirm the lead is stored, consent is recorded, the notification audit is written, and no PII appears in logs.
5. Remove staging hosts before launch if they are not part of the approved pilot.

The public snippet does not contain the agent phone, notification phone, email, CRM webhook, or WhatsApp credentials. Those values are server-side agency configuration.
