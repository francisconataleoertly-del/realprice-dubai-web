# FonatProp Web

FonatProp is the production Next.js frontend that powers `fonatprop.com`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

Copy `.env.example` to `.env.local` and fill the values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
NEXT_PUBLIC_FONATPROP_API_BASE_URL=https://web-production-9051f.up.railway.app
```

## Supabase auth

The app now uses Supabase auth for:

- `/login`
- `/app`
- `/admin`
- protected proxy routes under `/api/fonatprop/*`
- protected address-first valuation under `/api/predict-address`

### Access rules

- Public landing: everyone
- Signed-in member: Map + Radar + private app
- Pro: Valuation + Investment + Renovation
- Admin: `/admin`

Today, plan and role are derived from Supabase metadata when present:

- `app_metadata.plan` or `user_metadata.plan` -> `member | pro`
- `app_metadata.role` or `user_metadata.role` -> `user | admin`

Fallbacks:

- authenticated users default to `member`
- emails ending in `@fonatprop.com` or `@fonatprop.ae` are treated as `admin`

## Vercel setup

Add these env vars in Vercel before expecting auth to work live:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
- `NEXT_PUBLIC_FONATPROP_API_BASE_URL`

## Notes

- Billing and paid entitlements can be added later without changing the route split.
- The live data proxy now runs server-side instead of exposing Railway directly from every browser request.
