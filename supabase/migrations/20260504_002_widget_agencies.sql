-- FonatProp widget agencies
-- Stores per-agency widget credentials, allowed domains and lead routing.

create extension if not exists pgcrypto;

create table if not exists public.widget_agencies (
  id uuid primary key default gen_random_uuid(),
  agency_id text not null unique,
  label text not null,
  market text not null default 'dubai' check (market in ('dubai', 'france', 'multi')),
  token text not null,
  allowed_hosts text[] not null default '{}'::text[],
  agent_phone text,
  agent_email text,
  lead_webhook text not null default '/api/leads',
  is_active boolean not null default true,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists widget_agencies_market_active_idx
on public.widget_agencies (market, is_active, created_at desc);

create index if not exists widget_agencies_agency_id_idx
on public.widget_agencies (agency_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_widget_agencies_updated_at on public.widget_agencies;
create trigger set_widget_agencies_updated_at
before update on public.widget_agencies
for each row
execute function public.set_updated_at();

alter table public.widget_agencies enable row level security;

drop policy if exists "widget agencies admin read" on public.widget_agencies;
create policy "widget agencies admin read"
on public.widget_agencies
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "widget agencies admin insert" on public.widget_agencies;
create policy "widget agencies admin insert"
on public.widget_agencies
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "widget agencies admin update" on public.widget_agencies;
create policy "widget agencies admin update"
on public.widget_agencies
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

drop policy if exists "widget agencies admin delete" on public.widget_agencies;
create policy "widget agencies admin delete"
on public.widget_agencies
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
