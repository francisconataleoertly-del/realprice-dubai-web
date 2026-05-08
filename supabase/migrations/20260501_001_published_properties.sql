-- FonatProp published properties
-- Stores operator-published Dubai/France listings and their valuation/radar signal.

create extension if not exists pgcrypto;

create table if not exists public.published_properties (
  id uuid primary key default gen_random_uuid(),
  market text not null check (market in ('dubai', 'france')),
  title text not null,
  address text,
  zone text,
  property_type text not null,
  rooms text,
  area_m2 numeric not null check (area_m2 > 0),
  asking_price numeric not null check (asking_price > 0),
  estimated_value numeric not null check (estimated_value > 0),
  low_value numeric,
  high_value numeric,
  diff_pct numeric not null,
  signal text not null check (signal in ('green', 'yellow', 'red')),
  confidence_score integer not null default 60 check (confidence_score between 0 and 100),
  source_label text,
  source_transactions integer,
  image_url text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  valuation_payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists published_properties_market_status_idx
on public.published_properties (market, status, created_at desc);

create index if not exists published_properties_signal_idx
on public.published_properties (market, signal);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_published_properties_updated_at on public.published_properties;
create trigger set_published_properties_updated_at
before update on public.published_properties
for each row
execute function public.set_updated_at();

alter table public.published_properties enable row level security;

drop policy if exists "published properties public read" on public.published_properties;
create policy "published properties public read"
on public.published_properties
for select
using (status = 'published');

drop policy if exists "published properties admin read" on public.published_properties;
create policy "published properties admin read"
on public.published_properties
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "published properties admin insert" on public.published_properties;
create policy "published properties admin insert"
on public.published_properties
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "published properties admin update" on public.published_properties;
create policy "published properties admin update"
on public.published_properties
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

drop policy if exists "published properties admin delete" on public.published_properties;
create policy "published properties admin delete"
on public.published_properties
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
