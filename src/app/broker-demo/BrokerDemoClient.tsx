"use client";

import { useState } from "react";
import Script from "next/script";

import GoogleMapsLoader from "@/app/realprice/components/GoogleMapsLoader";
import ValorarSection from "@/app/realprice/components/ValorarSection";
import MandatePackPreviewSection from "@/components/mandate-pack/MandatePackPreviewSection";
import { FONATPROP_CONTACT } from "@/lib/fonatprop-contact";

const BROKER_DEMO_WIDGET_TOKEN =
  process.env.NEXT_PUBLIC_BROKER_DEMO_WIDGET_TOKEN || "fp_demo_widget_2026";

const handoffCards = [
  {
    label: "1 / Capture",
    title: "Capture the visitor before the estimate",
    body: "The widget collects name, email and phone first, so the agency gets a qualified inquiry even before the visitor sees a range.",
  },
  {
    label: "2 / Estimate",
    title: "Give a broad AI market range",
    body: "The public widget shows a non-final range. The precise valuation stays inside the brokerage, where the agent controls the conversation.",
  },
  {
    label: "3 / Agent handoff",
    title: "Send the inquiry to the agent instantly",
    body: "Every inquiry can go to WhatsApp, email, Google Sheets, Zapier, Make, HubSpot, Pipedrive or the brokerage's private CRM.",
  },
];

const heroSlides = [
  {
    image: "/dubai-slides/05-downtown-night.jpg",
    position: "center",
  },
  {
    image: "/dubai-slides/01-marina-skyline.jpg",
    position: "center",
  },
  {
    image: "/dubai-slides/09-palm-aerial.jpg",
    position: "center",
  },
  {
    image: "/dubai-slides/03-burj-al-arab.jpg",
    position: "center",
  },
  {
    image: "/dubai-slides/business-bay.jpg",
    position: "center",
  },
];

const proofPoints = [
  "234K+ verified Dubai transactions",
  "Private AI valuation for agents",
  "Public AI widget for qualified inquiries",
];

const benefits = [
  {
    title: "More qualified conversations",
    body: "The website stops being only a brochure and becomes a reason for owners, buyers and investors to start a conversation.",
  },
  {
    title: "Faster pricing conversations",
    body: "Agents can use the private valuation surface as the first answer before preparing a final professional recommendation.",
  },
  {
    title: "A modern AI edge",
    body: "Brokerages look more digital, more data-driven and more responsive without rebuilding their website.",
  },
];

const cycleSteps = [
  {
    label: "01",
    title: "Visitor becomes a lead",
    body: "The public widget captures name, email and phone before showing the broad AI range.",
  },
  {
    label: "02",
    title: "Lead lands in Command Center",
    body: "The inquiry is stored in the FonatProp lead inbox with address, range and source context.",
  },
  {
    label: "03",
    title: "Agent controls the valuation",
    body: "The broker opens the private AI workflow, reviews evidence and prepares a professional response.",
  },
  {
    label: "04",
    title: "Report closes the loop",
    body: "The agent sends WhatsApp, email or a mandate pack instead of losing the conversation.",
  },
];

const widgetPlan = {
  label: "Widget",
  title: "Lead capture",
  priceAed: "AED 1,099",
  priceUsd: "$299 / month",
  body: "One website. One widget. One monthly fee.",
  foot: "Single-site license / Live",
};

const pricingSummaryCards = [
  {
    name: "Widget",
    eyebrow: "Fixed website layer",
    price: "AED 1,099",
    detail: "$299 / month",
    foot: "One site. One live widget license.",
    body: "Public lead capture for one brokerage website. No tokens needed.",
    accent: "#ebc469",
    skyline: [24, 52, 36, 68, 40, 58, 34],
  },
  {
    name: "Valuation",
    eyebrow: "Entry AI tier",
    price: "AED 1,465",
    detail: "10 tokens / month",
    foot: "1 private valuation = 1 token.",
    body: "This price is only for the 10-token entry tier. Higher tiers scale up to 200 tokens.",
    accent: "#63c7ff",
    skyline: [18, 44, 72, 92, 64, 40, 56],
  },
  {
    name: "Top-up",
    eyebrow: "Flexible expansion",
    price: "Extra credits",
    detail: "10, 20 or custom packs",
    foot: "Mid-cycle top-up or plan upgrade.",
    body: "For agencies that need more valuation volume without waiting for the next billing cycle.",
    accent: "#8f5cff",
    skyline: [30, 48, 28, 76, 32, 60, 42],
  },
];

const valuationPlans = [
  { tokens: 10, priceAed: "AED 1,465", priceUsd: "$399 / mo", featured: false },
  { tokens: 20, priceAed: "AED 2,199", priceUsd: "$599 / mo", featured: true },
  { tokens: 50, priceAed: "AED 4,400", priceUsd: "$1,199 / mo", featured: false },
  { tokens: 100, priceAed: "AED 7,345", priceUsd: "$2,000 / mo", featured: false },
  { tokens: 200, priceAed: "AED 12,855", priceUsd: "$3,500 / mo", featured: false },
];

const topUpPacks = [
  {
    name: "Extra 10 tokens",
    price: "AED 1,465",
    copy: "Fast top-up for a team that needs more valuations before the next billing cycle.",
  },
  {
    name: "Extra 20 tokens",
    price: "AED 2,199",
    copy: "Best fit when usage grows but the agency is not ready to move to a higher monthly tier yet.",
  },
  {
    name: "Custom pack",
    price: "Quote",
    copy: "For larger broker teams, branch structures and dedicated CRM routing or API access.",
  },
];

const upgradeRules = [
  "1 private valuation search = 1 AI valuation token.",
  "The public lead-capture widget is a separate fixed monthly license.",
  "Agencies can start with a token plan, buy extra packs mid-cycle or move to a higher tier.",
  "Custom enterprise setups can combine widget licenses, token bundles and dedicated integrations.",
];

function PricingSkyline({
  bars,
  color,
}: {
  bars: number[];
  color: string;
}) {
  return (
    <div className="pointer-events-none flex h-20 items-end gap-[6px] opacity-95">
      {bars.map((height, index) => (
        <span
          key={`${color}-${height}-${index}`}
          className="w-[18px] rounded-t-[8px] border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
          style={{
            height: `${height}px`,
            background: `linear-gradient(180deg, ${color}33 0%, rgba(10,10,15,0.2) 100%)`,
            boxShadow: `0 0 24px ${color}22`,
          }}
        />
      ))}
    </div>
  );
}

function PricingSignalCard({
  card,
  onOpenModal,
}: {
  card: (typeof pricingSummaryCards)[number];
  onOpenModal?: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.22)]">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 82% 10%, ${card.accent}20 0%, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[120px] bg-[linear-gradient(180deg,rgba(10,10,15,0),rgba(10,10,15,0.78))]" />

      <div className="relative flex min-h-[335px] flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.28em]"
              style={{ color: card.accent }}
            >
              {card.name}
            </p>
            <p className="mt-3 text-[12px] uppercase tracking-[0.22em] text-white/42">
              {card.eyebrow}
            </p>
          </div>
          {card.name === "Top-up" ? (
            <button
              type="button"
              onClick={onOpenModal}
              className="rounded-full border border-white/12 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-white/68 transition hover:border-white/24 hover:text-white"
            >
              Open logic
            </button>
          ) : null}
        </div>

        <div className="mt-8">
          <p className="font-['Fraunces'] text-[clamp(2.2rem,3.2vw,3.25rem)] font-light tracking-[-0.05em] text-white">
            {card.price}
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/78">
            {card.detail}
          </div>
          <p className="mt-5 text-[15px] leading-8 text-white/56">{card.body}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <PricingSkyline bars={card.skyline} color={card.accent} />
          <p className="max-w-[180px] text-right text-[12px] leading-6 text-white/46">
            {card.foot}
          </p>
        </div>
      </div>
    </article>
  );
}

function mountWidget() {
  const maybeWindow = window as unknown as {
    RealPriceWidget?: { mountAll?: () => void };
  };
  maybeWindow.RealPriceWidget?.mountAll?.();
}

function ProductSplit() {
  return (
    <section className="bg-[#f4f1ea] px-5 py-20 text-[#15120f]">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[34px] border border-black/10 bg-white p-7 shadow-[0_26px_80px_rgba(21,18,15,0.10)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#3b82f6]">
            Product category
          </p>
          <h2 className="mt-4 font-['Fraunces'] text-[clamp(2.6rem,5vw,5.4rem)] font-light leading-[0.9] tracking-[-0.055em]">
            AI valuation &
            <br />
            <span className="italic text-[#15120f]/42">lead conversion engine.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[#15120f]/58">
            Not a generic website plugin. FonatProp is an AI-powered revenue tool for Dubai
            brokerages: private valuation for the team, public widget for the website.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[30px] border border-black/10 bg-[#15120f] p-6 text-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/38">
              Private tool
            </p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
              Exact valuation for the brokerage
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/58">
              Agents get the detailed AI estimate, comparables and confidence range. This is
              controlled access, not public.
            </p>
          </div>

          <div className="rounded-[30px] border border-black/10 bg-white p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/38">
              Public widget
            </p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
              Broad range for website visitors
            </h3>
            <p className="mt-4 text-sm leading-7 text-black/58">
              Visitors get a useful market signal. The agent receives the inquiry and closes the
              precise valuation conversation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WidgetShowcase() {
  return (
    <section id="widget" className="bg-[#f4f1ea] px-5 py-24 text-[#15120f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-[#15120f]/45">
              Product 02 / Website widget
            </p>
            <h2 className="max-w-4xl font-['Fraunces'] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-[-0.055em]">
              Turn the website
              <br />
              <span className="italic text-[#15120f]/42">into an inquiry engine.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-8 text-[#15120f]/58">
            This is the embeddable widget brokers install with one script. It works on mobile,
            keeps styles isolated with Shadow DOM and sends qualified inquiries to the agency in
            real time.
          </p>
        </div>

        <div className="rounded-[34px] border border-black/10 bg-white p-5 shadow-[0_32px_90px_rgba(21,18,15,0.14)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-black/35">
                Live script preview
              </p>
              <p className="mt-1 text-sm text-black/55">
                Banner mode: hero, contact capture, broad estimate and agent handoff.
              </p>
            </div>
            <div className="rounded-full border border-black/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
              Private implementation
            </div>
          </div>

          <Script src="/widget/embed.js" strategy="afterInteractive" onLoad={mountWidget} />
          <div
            data-realprice-widget
            data-mode="banner"
            data-agency-id="broker-demo-001"
            data-agency-token={BROKER_DEMO_WIDGET_TOKEN}
            data-brand-color="#3b82f6"
            data-banner-title="Want to know how much your Dubai property is worth?"
            data-banner-cta="Get your free valuation"
            data-banner-image="/dubai-slides/03-burj-al-arab.jpg"
          />
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {handoffCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[28px] border border-black/10 bg-white/70 p-6 shadow-[0_18px_55px_rgba(21,18,15,0.07)]"
            >
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#3b82f6]">
                {card.label}
              </p>
              <h3 className="text-xl font-semibold tracking-[-0.035em]">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-black/55">{card.body}</p>
            </div>
          ))}
        </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-black/10 bg-[#15120f] p-6 text-white">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
                Delivery model
              </p>
              <p className="text-[15px] leading-8 text-white/62">
                The live demo shows the public experience, but the implementation layer stays
                private. Embed code, routing setup and deployment details are shared only during
                the commercial onboarding flow.
              </p>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-white/70 p-6">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-black/35">
                What the buyer needs to know
              </p>
              <p className="text-[15px] leading-8 text-black/60">
                FonatProp handles the setup with the agency ID, lead routing and contact handoff.
                The brokerage gets the finished widget on its website without needing public access
                to the implementation code.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

function CycleClosureSection() {
  return (
    <section className="bg-[#0a0a0f] px-5 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
              Sales loop / closed
            </p>
            <h2 className="font-['Fraunces'] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-[-0.055em]">
              The demo now
              <br />
              <span className="italic text-white/42">becomes pipeline.</span>
            </h2>
          </div>
          <p className="max-w-xl text-[15px] leading-8 text-white/56">
            A broker demo should not stop at a pretty form. FonatProp captures the lead, stores
            the valuation context, and gives the agent a next action.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[34px] border border-white/[0.08] bg-white/[0.06] lg:grid-cols-4">
          {cycleSteps.map((step) => (
            <article key={step.label} className="min-h-[250px] bg-[#090a10]/94 p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue-200/55">
                {step.label}
              </p>
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.045em] text-white">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/50">{step.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-[28px] border border-blue-300/15 bg-blue-400/[0.06] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue-100/62">
              Public precision proof
            </p>
            <p className="mt-3 text-sm leading-7 text-white/58">
              Dubai backtest: 234K+ verified DLD transactions, R2 0.889, MAPE 12.7%,
              and 81.6% of estimates inside 20%. The public site shows ranges; the agent
              keeps the final professional recommendation.
            </p>
          </div>
          <a
            href="/methodology"
            className="inline-flex justify-center rounded-full border border-white/12 px-7 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/72 transition hover:border-white/28 hover:text-white"
          >
            Open proof
          </a>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="bg-[#0a0a0f] px-5 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
          Commercial model / valuation tokens
        </p>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-4xl font-['Fraunces'] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-[-0.055em]">
            Simple pricing.
            <br />
            <span className="italic text-white/42">Easy to buy.</span>
          </h2>
          <p className="max-w-md text-[15px] leading-8 text-white/55">
            The widget has one fixed monthly fee. Private AI valuation works with tokens:
            one private valuation search consumes one token.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {pricingSummaryCards.map((card) => (
            <PricingSignalCard
              key={card.name}
              card={card}
              onOpenModal={card.name === "Top-up" ? () => setModalOpen(true) : undefined}
            />
          ))}
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,32,0.78),rgba(7,10,18,0.96))] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.22)]">
          <div className="absolute right-6 top-6 h-[120px] w-[220px] opacity-70">
            <div className="flex h-full items-end justify-end gap-[7px]">
              {[26, 40, 56, 92, 74, 48, 60, 34].map((height, index) => (
                <span
                  key={`plan-sky-${height}-${index}`}
                  className="w-[18px] rounded-t-[10px] border border-white/8"
                  style={{
                    height: `${height}px`,
                    background:
                      "linear-gradient(180deg, rgba(99,199,255,0.32), rgba(18,24,40,0.12))",
                    boxShadow: "0 0 24px rgba(99,199,255,0.14)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-5 border-b border-white/8 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-200/62">
                Private AI valuation grid
              </p>
              <h3 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-white">
                Buy the exact volume you need.
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-white/56">
                Entry starts at 10 valuations. Every private valuation search consumes one token.
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/42">
                Entry tier
              </p>
              <p className="mt-2 text-xl font-semibold text-white">10 tokens / AED 1,465</p>
              <p className="mt-1 text-sm text-white/52">Scale up to 200 tokens / AED 12,855</p>
            </div>
          </div>

          <div className="relative mt-6 space-y-3">
            {valuationPlans.map((plan) => (
              <div
                key={plan.tokens}
                className={`grid gap-3 rounded-[24px] border px-5 py-5 transition md:grid-cols-[1fr_auto_auto] md:items-center ${
                  plan.featured
                    ? "border-[#ebc469] bg-[linear-gradient(90deg,rgba(235,196,105,0.08),rgba(18,24,40,0.92))]"
                    : "border-white/10 bg-white/[0.025]"
                }`}
              >
                <div className="flex items-center gap-4">
                  {plan.featured && (
                    <span className="rounded-full bg-[#ebc469] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#0a0a0f]">
                      Popular
                    </span>
                  )}
                  <div>
                    <p className="text-base text-white">{plan.tokens} valuations / month</p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-white/38">
                      {plan.tokens} tokens / month
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5 md:min-w-[240px] md:justify-end">
                  <p className="text-[1.7rem] font-semibold tracking-[-0.04em] text-white">
                    {plan.priceAed}
                  </p>
                </div>
                <div className="flex items-center md:justify-end">
                  <p className="min-w-[86px] text-right text-sm text-white/52">
                    {plan.priceUsd}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-7 text-white/52">
              Extra credits, custom bundles and enterprise setup on request.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-full border border-white/12 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/72 transition hover:border-white/24 hover:text-white"
            >
              Tokens, top-ups & upgrades
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-5 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-[34px] border border-white/10 bg-[#0b1020] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-300/70">
                  Token model
                </p>
                <h3 className="mt-3 font-['Fraunces'] text-[clamp(2rem,4vw,3.4rem)] font-light tracking-[-0.05em] text-white">
                  Extra credits & plan upgrades.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">
                  Keep the buying logic simple: one widget fee, one valuation token per private
                  AI search, and top-ups when a brokerage needs more volume.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/70 transition hover:border-white/24 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.45fr_0.55fr]">
              <div className="space-y-3">
                {upgradeRules.map((rule) => (
                  <div
                    key={rule}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white/68"
                  >
                    {rule}
                  </div>
                ))}
              </div>

              <div className="grid gap-4">
                {topUpPacks.map((pack) => (
                  <div
                    key={pack.name}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-white">
                          {pack.name}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-white/56">{pack.copy}</p>
                      </div>
                      <p className="text-xl font-semibold text-white">{pack.price}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-[24px] border border-[#ebc469]/30 bg-[#ebc469]/[0.06] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ebc469]">
                    Sales logic
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/68">
                    The easiest explanation for the buyer is: the widget is a fixed monthly
                    website product, while the private AI valuation tool scales by token volume
                    depending on how many owner or investor pricing conversations the agency runs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ContactSection() {
  return (
    <section className="bg-[#0a0a0f] px-5 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
            Contact / FonatProp
          </p>
          <h2 className="font-['Fraunces'] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-[-0.055em]">
            Book the demo.
            <br />
            <span className="italic text-white/42">Talk to us directly.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-8 text-white/55">
            For brokerages, pilots and commercial setup, contact FonatProp through WhatsApp
            or email.
          </p>
        </div>
        <div className="rounded-[34px] border border-white/10 bg-white/[0.045] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.25)]">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-blue-200/70">
            Direct contact
          </p>
          <div className="grid gap-4">
            <a
              href={FONATPROP_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[0.07] p-5 transition hover:border-emerald-200/40 hover:bg-emerald-300/[0.11]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-100/62">
                WhatsApp
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                {FONATPROP_CONTACT.whatsappDisplay}
              </p>
            </a>
            <a
              href={FONATPROP_CONTACT.emailHref}
              className="rounded-[24px] border border-blue-300/20 bg-blue-300/[0.07] p-5 transition hover:border-blue-200/40 hover:bg-blue-300/[0.11]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue-100/62">
                Email
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                {FONATPROP_CONTACT.email}
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BrokerDemoClient() {
  return (
    <div className="bg-[#0a0a0f] text-white">
      <section className="relative overflow-hidden px-5 py-24 md:py-32">
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.image}
              className="broker-demo-hero-slide absolute inset-0 bg-cover opacity-0 brightness-[1.42] contrast-[1.04] saturate-[1.16]"
              style={{
                animationDelay: `${index * 5.6}s`,
                backgroundImage: `url('${slide.image}')`,
                backgroundPosition: slide.position,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(59,130,246,0.035),transparent_34%),linear-gradient(90deg,rgba(10,10,15,0.24),rgba(10,10,15,0.02)_50%,rgba(10,10,15,0.10))]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/0 via-[#0a0a0f]/3 to-[#0a0a0f]/28" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-10 inline-flex items-center gap-5 text-white drop-shadow-[0_18px_38px_rgba(0,0,0,0.55)]">
            <span className="font-['Fraunces'] text-[3.2rem] font-light italic leading-none tracking-[-0.08em] text-white/92">
              fp
            </span>
            <span className="h-16 w-px bg-white/42" />
            <span>
              <span className="block font-['Fraunces'] text-[clamp(2.6rem,4.2vw,4.7rem)] font-light leading-none tracking-[-0.06em]">
                FonatProp
              </span>
              <span className="mt-3 block font-mono text-[9px] uppercase tracking-[0.48em] text-white/62">
                AI-powered real estate intelligence
              </span>
            </span>
          </div>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.36em] text-white/42">
            Dubai brokerage revenue demo
          </p>
          <h1 className="max-w-5xl font-['Fraunces'] text-[clamp(3.2rem,7vw,7.5rem)] font-light leading-[0.88] tracking-[-0.06em]">
            Turn property value
            <br />
            <span className="italic text-white/46">into qualified inquiries.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[16px] leading-8 text-white/64">
            FonatProp is an AI valuation and lead conversion engine for Dubai brokerages:
            exact valuations for the agency, broad website estimates for clients, and instant
            handoff to the agent.
          </p>
          <div className="mt-6 max-w-3xl rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/34">
              What it does in one sentence
            </p>
            <p className="mt-3 text-[15px] leading-7 text-white/68">
              It gives brokerages an AI-powered reason for property owners and investors to
              contact them.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#valuation"
              className="bg-white px-7 py-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[#0a0a0f] transition hover:bg-white/88"
            >
              Try valuation
            </a>
            <a
              href="#widget"
              className="border border-white/15 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.28em] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              See widget
            </a>
          </div>
          <div className="mt-12 grid max-w-4xl gap-3 md:grid-cols-3">
            {proofPoints.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/68"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-2">
            {heroSlides.map((slide, index) => (
              <span
                key={`${slide.image}-dot`}
                className="broker-demo-hero-dot h-[3px] w-8 rounded-full bg-white/20"
                style={{ animationDelay: `${index * 5.6}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      <ProductSplit />

      <section className="bg-[#0a0a0f] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
            Business value
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6"
              >
                <h3 className="text-2xl font-semibold tracking-[-0.045em]">{benefit.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/52">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="valuation">
        <GoogleMapsLoader>
          <ValorarSection publicDemo />
        </GoogleMapsLoader>
      </div>

      <MandatePackPreviewSection />
      <CycleClosureSection />
      <WidgetShowcase />
      <PricingSection />
      <ContactSection />
    </div>
  );
}
