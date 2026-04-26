import Link from "next/link";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

function redactKey(value: string) {
  if (!value) return "missing";
  return `${value.slice(0, 14)}...len=${value.length}`;
}

function safeHost(value: string) {
  try {
    const url = new URL(value);
    return url.host;
  } catch {
    return "invalid URL";
  }
}

export default function AuthDebugPage() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawAnon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  const env = getSupabasePublicEnv();
  const warnings = [
    rawUrl.includes("/rest/v1")
      ? "NEXT_PUBLIC_SUPABASE_URL includes /rest/v1. FonatProp normalizes it, but Vercel should be corrected."
      : "",
    !env.configured ? "Supabase public env is not fully configured." : "",
    env.url && !env.url.startsWith("https://")
      ? "Supabase URL must start with https://."
      : "",
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
          FonatProp Auth Diagnostic
        </p>
        <h1 className="mb-6 text-4xl font-light tracking-[-0.04em]">
          Supabase connection status
        </h1>

        <div className="grid gap-3 text-sm text-white/70">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
              Configured
            </p>
            <p className="mt-2 text-lg text-white">
              {env.configured ? "Yes" : "No"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
              Supabase host
            </p>
            <p className="mt-2 text-lg text-white">{safeHost(env.url)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
              Public key
            </p>
            <p className="mt-2 font-mono text-sm text-white/80">
              {redactKey(rawAnon)}
            </p>
          </div>
        </div>

        {warnings.length ? (
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-7 text-amber-100">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-100">
            Environment looks ready. If login still fails, check Supabase Auth
            URL Configuration and Email provider settings.
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login?mode=signup&next=/app"
            className="rounded-2xl bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[#0a0a0f]"
          >
            Test signup
          </Link>
          <Link
            href="/login?next=/app"
            className="rounded-2xl border border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-white/70"
          >
            Test login
          </Link>
        </div>
      </div>
    </main>
  );
}
