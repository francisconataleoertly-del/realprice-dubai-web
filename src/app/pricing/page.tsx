"use client";

import Link from "next/link";
import SessionRail from "@/components/access/SessionRail";

const plans = [
  {
    name: "Guest",
    price: "Free",
    description: "Public landing only.",
    features: ["Brand story", "Market positioning", "Read-only experience"],
  },
  {
    name: "Member",
    price: "Current",
    description: "Temporary open access for any logged-in account.",
    features: ["Full private app", "Valuation", "Radar", "Investment"],
  },
  {
    name: "Pro Agency",
    price: "$200/mo+",
    description: "Planned paid tier once billing and entitlements go live.",
    features: [
      "Valuation",
      "Investment",
      "Renovation",
      "Embeddable widget",
      "Agency-grade workflows",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-6 py-16">
      <SessionRail surface="public" />
      <div className="max-w-6xl mx-auto pt-16">
        <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/28 mb-4">
          FonatProp Plans
        </p>
        <h1 className="font-['Fraunces'] text-[clamp(2.8rem,6vw,5rem)] font-light leading-[0.92] tracking-[-0.03em] text-white max-w-4xl">
          Public brand outside.
          <br />
          <span className="italic text-white/40 font-extralight">
            Controlled intelligence inside.
          </span>
        </h1>
        <p className="mt-6 max-w-3xl text-[15px] leading-8 text-white/52">
          We are structuring the product so the landing stays open, logged-in
          users unlock discovery and paid agencies unlock the real valuation and
          underwriting surfaces.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7"
            >
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/28 mb-3">
                {plan.name}
              </p>
              <p className="text-[34px] font-light tracking-[-0.03em] text-white">
                {plan.price}
              </p>
              <p className="mt-3 text-[14px] leading-7 text-white/55">
                {plan.description}
              </p>
              <div className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="text-[13px] text-white/70 border-b border-white/[0.04] pb-2"
                  >
                    {feature}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] border border-[#3b82f6]/15 bg-[#3b82f6]/[0.05] px-6 py-6">
          <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#7fb3ff] mb-2">
            Auth Is Now Ready
          </p>
          <p className="text-[14px] leading-7 text-white/60">
            Supabase-backed authentication is in place. Billing and automatic
            entitlements come next, so today every signed-in account can enter
            the full private app while we finish the paid plan wiring.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login?next=/app"
              className="inline-flex items-center justify-center rounded-xl bg-white text-[#0a0a0f] px-5 py-3 text-[11px] uppercase tracking-[0.28em] font-medium"
            >
              Log in
            </Link>
            <a
              href="mailto:hello@fonatprop.com?subject=FonatProp%20Pro%20Agency"
              className="inline-flex items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-white/65 hover:text-white transition-colors"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
