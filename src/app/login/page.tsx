"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import SessionRail from "@/components/access/SessionRail";
import { useAccess } from "@/components/access/AccessProvider";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAccess();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = searchParams.get("next") || "/app";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn({ name, email, password });
      router.push(nextPath);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not create the session."
      );
    } finally {
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
            Map and Radar. Pro agencies unlock Valuation, Investment and
            Renovation. The admin command center stays separate.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Member",
                description: "Map and Radar",
              },
              {
                label: "Pro",
                description: "Valuation, Investment and Renovation",
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
            Session Setup
          </p>
          <p className="text-[28px] font-light tracking-[-0.02em] text-white mb-6">
            Open your workspace
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white text-[#0a0a0f] px-5 py-4 text-[11px] uppercase tracking-[0.28em] font-medium disabled:opacity-45"
            >
              {loading ? "Opening session..." : "Log in"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#3b82f6]/15 bg-[#3b82f6]/[0.05] px-4 py-4">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7fb3ff] mb-2">
              Temporary Preview Logic
            </p>
            <p className="text-[13px] leading-7 text-white/60">
              Until secure auth goes live, any email opens a member session.
              Emails containing <span className="text-white">+pro</span> preview
              paid access. Emails containing <span className="text-white">+admin</span>{" "}
              open the command center.
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
