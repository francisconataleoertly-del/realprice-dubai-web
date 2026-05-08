-- FonatProp lead inbox
-- Stores website widget, France report and broker demo inquiries.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  market text not null default 'dubai' check (market in ('dubai', 'france')),
  source text not null default 'website',
  event text,
  agency_id text,
  section text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  name text,
  email text,
  phone text,
  address text,
  zone text,
  property_type text,
  rooms text,
  area_m2 numeric,
  estimated_value numeric,
  valuation_low numeric,
  valuation_high numeric,
  valuation_range_label text,
  currency text not null default 'AED',
  agent_email text,
  agent_phone text,
  assigned_to uuid references auth.users(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  user_agent text,
  referer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_market_status_created_idx
on public.leads (market, status, created_at desc);

create index if not exists leads_email_idx
on public.leads (email);

create index if not exists leads_agency_created_idx
on public.leads (agency_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

alter table public.leads enable row level security;

drop policy if exists "leads public insert" on public.leads;
create policy "leads public insert"
on public.leads
for insert
with check (
  (email is not null and length(email) >= 5)
  or (phone is not null and length(phone) >= 6)
);

drop policy if exists "leads admin read" on public.leads;
create policy "leads admin read"
on public.leads
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "leads admin update" on public.leads;
create policy "leads admin update"
on public.leads
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "leads admin delete" on public.leads;
create policy "leads admin delete"
on public.leads
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
