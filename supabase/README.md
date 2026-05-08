# FonatProp Supabase Setup

## 1. Run the auth foundation SQL

Open Supabase:

- `SQL Editor`
- create a new query
- paste the contents of:
  - `supabase/migrations/20260423_001_fonatprop_auth_foundation.sql`
- run it

This creates:

- `public.profiles`
- `public.subscriptions`
- `public.master_access`
- triggers for new users
- RLS policies so users only read their own profile/subscription

## Auth URL configuration

In Supabase Dashboard:

- `Authentication`
- `URL Configuration`

Set:

```text
Site URL: https://fonatprop.com
```

Add redirect URLs:

```text
https://fonatprop.com/**
https://www.fonatprop.com/**
http://localhost:3000/**
http://localhost:3002/**
```

## Email provider

In Supabase Dashboard:

- `Authentication`
- `Sign In / Providers`
- `Email`

Enable:

- Email provider
- Allow new users to sign up
- Confirm email, if you want email verification before first login

## Google provider

In Supabase Dashboard:

- `Authentication`
- `Sign In / Providers`
- `Google`

Enable Google and paste the Google OAuth Client ID and Client Secret.

The Google OAuth app must allow this redirect URI:

```text
https://ryaaggulcxwstieoxaqs.supabase.co/auth/v1/callback
```

The app already sends users back through:

```text
https://fonatprop.com/auth/callback?next=/app
```

## 2. Give yourself permanent master access

After the migration, run:

```sql
insert into public.master_access (email, note)
values ('YOUR_EMAIL_HERE', 'FonatProp owner')
on conflict (email) do update
set note = excluded.note;
```

Then, if your user already exists, promote it:

```sql
update public.profiles
set role = 'admin',
    plan = 'pro',
    billing_status = 'owner',
    is_master = true
where lower(email) = lower('YOUR_EMAIL_HERE');
```

Log out and log back in.

## 3. Current behavior

- signed-in users default to `member`
- promoted operators / master users are `admin`
- `admin` users are forced to `plan = 'pro'`
- `/admin` remains reserved for `admin`

## 4. Published properties / Radar inventory

To let `/admin` publish real Dubai and France properties into the public radar,
run this migration in Supabase SQL Editor:

```text
supabase/migrations/20260501_001_published_properties.sql
```

This creates:

- `public.published_properties`
- public read access for `status = 'published'`
- admin insert/update/delete access
- radar fields: asking price, estimated value, low/high range, confidence score and green/yellow/red signal

Until this migration is applied, the app safely falls back to benchmark radar data.

## 4b. Widget agencies

To let `/admin` create real widget agencies with domain allowlists and agency tokens,
run this migration in Supabase SQL Editor:

```text
supabase/migrations/20260504_002_widget_agencies.sql
```

This creates:

- `public.widget_agencies`
- admin-only read/write policies
- per-agency token storage
- allowed host/domain control for the embeddable widget

## 5. Later billing

When billing is ready, switch non-paying users to:

- `plan = 'member'`

and let subscriptions update `public.subscriptions` plus `public.profiles.plan`.
