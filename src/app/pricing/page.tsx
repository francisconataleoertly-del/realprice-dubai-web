"use client";

import Link from "next/link";
import SessionRail from "@/components/access/SessionRail";
import FonatPropLogo from "@/components/brand/FonatPropLogo";

const plans = [
  {
    code: "launch",
    name: "Launch Widget",
    price: "$700/mo",
    annual: "$7,000/year",
    badge: "First month free",
    description:
      "A premium private intake layer for agencies that want more qualified property conversations.",
    features: [
      "FonatProp software fee: USD 700/month",
      "Custom agency widget setup with FonatProp mark",
      "Private inquiry cards",
      "Broker-ready inquiry archive",
      "WhatsApp/email report draft",
      "Private performance dashboard",
      "FonatProp watermark visible",
    ],
  },
  {
    code: "private-label",
    name: "Private Label",
    price: "$1,000/mo",
    annual: "$10,000/year",
    badge: "First month free",
    description:
      "The same private acquisition experience, fully branded for the agency and cleaner for premium client journeys.",
    features: [
      "FonatProp software fee: USD 1,000/month",
      "Everything in Launch Widget",
      "No FonatProp watermark",
      "Agency-branded widget and report",
      "Custom copy, photos and placement",
      "Priority onboarding",
      "Private performance dashboard",
    ],
  },
  {
    code: "growth",
    name: "Growth OS",
    price: "$1,500/mo",
    annual: "$15,000/year",
    badge: "Managed growth",
    description:
      "Seller Acquisition Operating System: a managed monthly program for qualified demand, private intake and measurable broker follow-up.",
    features: [
      "FonatProp operating fee: USD 1,500/month",
      "Everything in Private Label",
      "Managed demand program",
      "Agency-approved growth budget stays separate",
      "Private conversion workspace",
      "Monthly commercial performance review",
      "Optimization handled privately with the agency",
    ],
  },
  {
    code: "premium",
    name: "Premium OS",
    price: "$3,000/mo",
    annual: "$30,000/year",
    badge: "Full operating layer",
    description:
      "Full private operating layer for agencies that want acquisition, routing, reporting and priority support around one measured system.",
    features: [
      "FonatProp premium operating fee: USD 3,000/month",
      "Everything in Growth OS",
      "Advanced acquisition modules",
      "Advanced private routing",
      "Monthly executive report",
      "Priority product support",
      "Agency-approved growth budget stays separate",
    ],
  },
];

const proofPoints = [
  {
    label: "Pilot terms",
    value: "1 month free",
    body: "The agency tests the system before the paid subscription starts.",
  },
  {
    label: "Annual discount",
    value: "2 months included",
    body: "Small discount only. The product stays premium.",
  },
  {
    label: "Budget clarity",
    value: "Fee + agency budget",
    body: "Growth plans separate FonatProp's fee from any external budget the agency approves.",
  },
  {
    label: "Partner friendly",
    value: "We do not build websites",
    body: "Web studios keep their role. FonatProp adds a private acquisition layer.",
  },
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2ecdf] px-6 py-16 text-[#08111d]">
      <SessionRail surface="public" />
      <div className="absolute inset-0 bg-[url('/dubai-slides/09-palm-aerial.jpg')] bg-cover bg-center opacity-12" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(242,236,223,0.94),rgba(231,241,239,0.9)_54%,rgba(245,229,198,0.82))]" />
      <div className="relative mx-auto max-w-6xl pt-16">
        <FonatPropLogo
          variant="lockup"
          className="mb-10 h-auto w-full max-w-[390px] rounded-2xl opacity-90"
          priority
        />
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-700">
          FonatProp subscriptions
        </p>
        <h1 className="max-w-4xl font-[var(--font-display)] text-[clamp(2.8rem,6vw,5rem)] font-light leading-[0.92] tracking-normal text-[#08111d]">
          Seller acquisition,
          <br />
          <span className="font-extralight italic text-[#08758d]">
            not another widget.
          </span>
        </h1>
        <p className="mt-6 max-w-3xl text-[15px] leading-8 text-[#08111d]/62">
          FonatProp helps Dubai agencies turn existing attention into qualified
          property conversations. Every paid plan starts with a free personalized
          pilot month and private performance reporting.
        </p>
        <p className="mt-4 max-w-3xl rounded-2xl border border-cyan-700/15 bg-white/58 px-5 py-4 text-[14px] leading-7 text-[#08111d]/64">
          FonatProp does not create websites. We work beside web studios and agency teams,
          adding a confidential acquisition layer around the agency&apos;s existing digital presence.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative overflow-hidden rounded-[24px] border border-white/70 bg-[#08111d] p-7 text-white shadow-[0_28px_90px_rgba(30,26,18,0.16)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" />
              <div className="mb-7 flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/34">
                  {plan.name}
                </p>
                <span className="rounded-full border border-emerald-200/20 bg-emerald-200/[0.08] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-100/80">
                  {plan.badge}
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <p className="text-[46px] font-light tracking-normal text-white">
                  {plan.price}
                </p>
                <p className="pb-3 text-sm text-white/44">
                  or {plan.annual}
                </p>
              </div>
              <p className="mt-5 text-[14px] leading-7 text-white/58">
                {plan.description}
              </p>
              <div className="mt-7 space-y-2">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="border-b border-white/[0.055] pb-2 text-[13px] text-white/72"
                  >
                    {feature}
                  </p>
                ))}
              </div>
              <Link
                href={`/checkout?plan=${plan.code}&billing=monthly`}
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[#0a0a0f] transition hover:bg-cyan-50"
              >
                Start monthly checkout
              </Link>
              <Link
                href={`/checkout?plan=${plan.code}&billing=annual`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/12 px-5 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-white/64 transition hover:border-amber-100/30 hover:text-white"
              >
                Start annual checkout
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-[24px] border border-[#d8c9b0] bg-[#d8c9b0] md:grid-cols-2 xl:grid-cols-4">
          {proofPoints.map((item) => (
            <div key={item.label} className="bg-white/72 p-6 backdrop-blur">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-700">
                {item.label}
              </p>
              <p className="text-[26px] font-light tracking-normal text-[#08111d]">
                {item.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#08111d]/56">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] border border-cyan-700/15 bg-white/60 px-6 py-6 shadow-[0_18px_60px_rgba(30,26,18,0.1)] backdrop-blur">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-700">
            Payment flow
          </p>
          <p className="text-[14px] leading-7 text-[#08111d]/62">
            Agencies accept terms before checkout. After payment, their account,
            workspace and agency setup are activated.
          </p>
          <p className="mt-3 text-[14px] leading-7 text-[#08111d]/62">
            For Growth OS and Premium OS, the subscription is FonatProp&apos;s operating fee.
            Any external growth budget is agreed separately and remains controlled by the agency.
          </p>
          <p className="mt-3 text-[14px] leading-7 text-[#08111d]/62">
            For Zoom sales, send the same checkout link after the call. It keeps payment,
            terms and onboarding professional instead of using informal transfers.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login?next=/app"
              className="inline-flex items-center justify-center rounded-xl bg-[#08111d] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.28em] text-white"
            >
              Log in
            </Link>
            <a
              href="mailto:contact@fonatprop.com?subject=FonatProp%20Pro%20Agency"
              className="inline-flex items-center justify-center rounded-xl border border-[#08111d]/12 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-[#08111d]/65 transition-colors hover:text-[#08111d]"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
