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

- all signed-in users are treated as `pro` for now
- master users are `admin`
- `/admin` remains reserved for `admin`

## 4. Later billing

When billing is ready, switch non-paying users to:

- `plan = 'member'`

and let subscriptions update `public.subscriptions` plus `public.profiles.plan`.
