"use client";

import Link from "next/link";
import SessionRail from "@/components/access/SessionRail";
import { useAccess } from "@/components/access/AccessProvider";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/access-control";

const featureFlagLabels: Record<keyof typeof DEFAULT_FEATURE_FLAGS, string> = {
  mapRequiresLogin: "Map requires login",
  radarRequiresLogin: "Radar requires login",
  valuationRequiresPro: "Valuation requires Pro",
  investmentRequiresPro: "Investment requires Pro",
  renovationRequiresPro: "Renovation requires Pro",
};

export default function AdminPage() {
  const { session, flags, setFlag, resetFlags } = useAccess();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-6 py-16">
      <SessionRail surface="admin" />
      <div className="max-w-6xl mx-auto pt-16">
        <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/28 mb-4">
          FonatProp Command Center
        </p>
        <h1 className="font-['Fraunces'] text-[clamp(2.8rem,6vw,5rem)] font-light leading-[0.92] tracking-[-0.03em] text-white max-w-4xl">
          Keep the public site clean.
          <br />
          <span className="italic text-white/40 font-extralight">
            Control the private layers from here.
          </span>
        </h1>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              label: "Operator",
              value: session.name || session.email || "Admin session",
            },
            {
              label: "Plan",
              value: session.plan.toUpperCase(),
            },
            {
              label: "Role",
              value: session.role.toUpperCase(),
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-6"
            >
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/28 mb-3">
                {card.label}
              </p>
              <p className="text-[26px] font-light tracking-[-0.02em] text-white">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/28 mb-2">
                  Feature Flags
                </p>
                <p className="text-[24px] font-light tracking-[-0.02em] text-white">
                  Access rules before Supabase
                </p>
              </div>
              <button
                type="button"
                onClick={resetFlags}
                className="rounded-xl border border-white/12 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
              >
                Reset defaults
              </button>
            </div>

            <div className="space-y-4">
              {(
                Object.keys(flags) as Array<keyof typeof DEFAULT_FEATURE_FLAGS>
              ).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0b0c12]/72 px-5 py-4"
                >
                  <div>
                    <p className="text-[15px] text-white">
                      {featureFlagLabels[key]}
                    </p>
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/24 mt-1">
                      {flags[key] ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlag(key, !flags[key])}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      flags[key] ? "bg-[#3b82f6]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`block w-6 h-6 rounded-full bg-white transition-transform ${
                        flags[key] ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/28 mb-2">
                Architecture
              </p>
              <p className="text-[24px] font-light tracking-[-0.02em] text-white">
                Public / App / Admin
              </p>
              <div className="mt-5 space-y-3 text-[14px] leading-7 text-white/58">
                <p>
                  <span className="text-white">/fonatprop</span> stays public and
                  visible to everyone.
                </p>
                <p>
                  <span className="text-white">/app</span> is the signed-in
                  workspace. Map and Radar open there for members.
                </p>
                <p>
                  <span className="text-white">/admin</span> stays separate so
                  only operators control the rules.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#3b82f6]/15 bg-[#3b82f6]/[0.05] p-7">
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#7fb3ff] mb-2">
                Next Up
              </p>
              <p className="text-[14px] leading-7 text-white/65">
                Tomorrow we can replace the preview session with Supabase auth,
                real user tables, role-based entitlements and payment-backed plan
                checks without changing this surface structure again.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/fonatprop"
                  className="inline-flex items-center justify-center rounded-xl bg-white text-[#0a0a0f] px-5 py-3 text-[11px] uppercase tracking-[0.28em] font-medium"
                >
                  Open landing
                </Link>
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-white/65 hover:text-white transition-colors"
                >
                  Open app
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
