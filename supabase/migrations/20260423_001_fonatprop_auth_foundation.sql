-- FonatProp auth foundation
-- Run this in Supabase SQL Editor or through Supabase migrations.

create extension if not exists pgcrypto;

create table if not exists public.master_access (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

alter table public.master_access enable row level security;

drop policy if exists "master_access service role only" on public.master_access;
create policy "master_access service role only"
on public.master_access
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'pro' check (plan in ('member', 'pro')),
  billing_status text not null default 'complimentary',
  is_master boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists phone text;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null default 'pro' check (plan in ('member', 'pro')),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    new.role = old.role;
    new.plan = old.plan;
    new.billing_status = old.billing_status;
    new.is_master = old.is_master;
    new.email = old.email;
  end if;

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists protect_profiles_update on public.profiles;
create trigger protect_profiles_update
before update on public.profiles
for each row
execute function public.protect_profile_fields();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create or replace function public.bootstrap_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  master_match boolean;
  new_name text;
  new_phone text;
begin
  select exists(
    select 1
    from public.master_access ma
    where lower(ma.email) = lower(new.email)
  )
  into master_match;

  new_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  );
  new_phone := coalesce(
    new.phone,
    new.raw_user_meta_data ->> 'phone',
    ''
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    plan,
    billing_status,
    is_master
  )
  values (
    new.id,
    lower(new.email),
    nullif(trim(new_name), ''),
    nullif(trim(new_phone), ''),
    case when master_match then 'admin' else 'user' end,
    'pro',
    case when master_match then 'owner' else 'complimentary' end,
    master_match
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        phone = coalesce(excluded.phone, public.profiles.phone),
        role = case when public.profiles.is_master then 'admin' else public.profiles.role end,
        plan = case when public.profiles.plan is null then 'pro' else public.profiles.plan end,
        is_master = public.profiles.is_master or excluded.is_master;

  if master_match then
    insert into public.subscriptions (
      user_id,
      provider,
      plan,
      status
    )
    select new.id, 'manual', 'pro', 'active'
    where not exists (
      select 1 from public.subscriptions s where s.user_id = new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.bootstrap_profile();

insert into public.profiles (
  id,
  email,
  full_name,
  phone,
  role,
  plan,
  billing_status,
  is_master
)
select
  u.id,
  lower(u.email),
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ''),
  nullif(trim(coalesce(u.phone, u.raw_user_meta_data ->> 'phone', '')), ''),
  case
    when exists (
      select 1 from public.master_access ma where lower(ma.email) = lower(u.email)
    ) then 'admin'
    else 'user'
  end,
  'pro',
  case
    when exists (
      select 1 from public.master_access ma where lower(ma.email) = lower(u.email)
    ) then 'owner'
    else 'complimentary'
  end,
  exists (
    select 1 from public.master_access ma where lower(ma.email) = lower(u.email)
  )
from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles update own name" on public.profiles;
create policy "profiles update own name"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "subscriptions select own" on public.subscriptions;
create policy "subscriptions select own"
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "subscriptions service role manage" on public.subscriptions;
create policy "subscriptions service role manage"
on public.subscriptions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
