-- FonatProp widget routing compatibility
-- Keeps the database constraint aligned with the routing modes supported by the app.

alter table if exists public.widget_agencies
  drop constraint if exists widget_agencies_lead_routing_mode_check;

alter table if exists public.widget_agencies
  add constraint widget_agencies_lead_routing_mode_check
  check (
    lead_routing_mode in (
      'email',
      'webhook',
      'email_webhook',
      'whatsapp',
      'whatsapp_email',
      'whatsapp_webhook',
      'all',
      'manual'
    )
  );
