"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import SessionRail from "@/components/access/SessionRail";
import { useAccess } from "@/components/access/AccessProvider";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authConfigured, signIn, signInWithGoogle, signUp } = useAccess();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const nextPath = searchParams.get("next") || "/app";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signin") {
        await signIn({ email, password });
        router.push(nextPath);
        return;
      }

      const result = await signUp({ name, email, password });
      if (result.pendingConfirmation) {
        setNotice(
          result.message ||
            "Check your email, confirm the account, and then come back to log in."
        );
        setMode("signin");
      } else {
        router.push(nextPath);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not open the session."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      await signInWithGoogle(nextPath);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Google sign in could not start."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-6 py-16">
      <SessionRail surface="public" />
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
        <div className="pt-16">
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/28 mb-4">
            FonatProp Access
          </p>
          <h1 className="font-['Fraunces'] text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] font-light tracking-[-0.03em] text-white max-w-3xl">
            Sign in to unlock
            <br />
            <span className="italic text-white/40 font-extralight">
              the private surfaces.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-8 text-white/52">
            The public landing stays open to everyone. Signed-in members can use
            the private product today while billing is still being wired. The
            admin command center stays separate.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Member",
                description: "Signed-in product access for now",
              },
              {
                label: "Pro",
                description: "Will later gate paid agency workflows",
              },
              {
                label: "Admin",
                description: "Feature flags and control center",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5"
              >
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/26 mb-2">
                  {item.label}
                </p>
                <p className="text-[15px] leading-7 text-white/70">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[32px] border border-white/10 bg-[#0b0c12]/86 backdrop-blur-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/28 mb-2">
            Secure Account
          </p>
          <p className="text-[28px] font-light tracking-[-0.02em] text-white mb-6">
            Open your workspace
          </p>

          {!authConfigured ? (
            <div className="rounded-[24px] border border-amber-400/15 bg-amber-400/[0.06] px-5 py-5">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-amber-200 mb-2">
                Supabase Setup Required
              </p>
              <p className="text-[14px] leading-7 text-white/70">
                Add <span className="text-white">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
                <span className="text-white">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{" "}
                in Vercel and local envs, then this login will become fully
                live.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                {[
                  { key: "signin", label: "Log in" },
                  { key: "signup", label: "Create account" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMode(item.key as "signin" | "signup")}
                    className={`rounded-[14px] px-4 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors ${
                      mode === item.key
                        ? "bg-white text-[#0a0a0f]"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mb-5 w-full rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4 text-[11px] uppercase tracking-[0.24em] text-white hover:bg-white/[0.07] disabled:opacity-45"
              >
                Continue with Google
              </button>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "signup" ? (
                  <div>
                    <label className="block font-mono text-[10px] tracking-[0.28em] uppercase text-white/28 mb-2">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Francisco"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-white placeholder:text-white/18 outline-none focus:border-white/24 transition-colors"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="block font-mono text-[10px] tracking-[0.28em] uppercase text-white/28 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@agency.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-white placeholder:text-white/18 outline-none focus:border-white/24 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] tracking-[0.28em] uppercase text-white/28 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-white placeholder:text-white/18 outline-none focus:border-white/24 transition-colors"
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[13px] text-red-300">
                    {error}
                  </div>
                ) : null}

                {notice ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-[13px] text-emerald-200">
                    {notice}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-white text-[#0a0a0f] px-5 py-4 text-[11px] uppercase tracking-[0.28em] font-medium disabled:opacity-45"
                >
                  {loading
                    ? mode === "signin"
                      ? "Opening session..."
                      : "Creating account..."
                    : mode === "signin"
                      ? "Log in"
                      : "Create account"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 rounded-2xl border border-[#3b82f6]/15 bg-[#3b82f6]/[0.05] px-4 py-4">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7fb3ff] mb-2">
              Live Auth Structure
            </p>
            <p className="text-[13px] leading-7 text-white/60">
              Authentication now runs through Supabase. Until billing goes live,
              every signed-in account is treated as{" "}
              <span className="text-white">pro</span> so you can use the full
              product. Later we can wire paid plans and admin roles through
              metadata or billing sync.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between text-[12px] text-white/38">
            <Link href="/pricing" className="hover:text-white transition-colors">
              View plans
            </Link>
            <Link href="/fonatprop" className="hover:text-white transition-colors">
              Back to landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] text-white px-6 py-16">
          <SessionRail surface="public" />
          <div className="max-w-6xl mx-auto pt-16">
            <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/28 mb-4">
              FonatProp Access
            </p>
            <p className="text-[28px] font-light tracking-[-0.02em] text-white">
              Loading secure entry...
            </p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
