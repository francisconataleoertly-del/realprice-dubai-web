"use client";

import { useState } from "react";
import Script from "next/script";

import GoogleMapsLoader from "@/app/realprice/components/GoogleMapsLoader";
import ValorarSection from "@/app/realprice/components/ValorarSection";
import { DUBAI_PUBLIC_BENCHMARKS } from "@/lib/dubai-benchmarks";
import MandatePackPreviewSection from "@/components/mandate-pack/MandatePackPreviewSection";
import { FONATPROP_CONTACT } from "@/lib/fonatprop-contact";
import SmartRenovationRequest from "@/components/fonatprop/SmartRenovationRequest";

const BROKER_DEMO_WIDGET_TOKEN =
  process.env.NEXT_PUBLIC_BROKER_DEMO_WIDGET_TOKEN || "fp_demo_widget_2026";

const widgetToolCards = [
  {
    label: "Widget 01 / AI valuation",
    title: "Open the seller conversation with an instant range",
    body: "This is the strongest lead hook: the owner gets a broad AI valuation signal, and the broker receives the property context to continue the real pricing conversation privately.",
  },
  {
    label: "Widget 02 / Golden Visa",
    title: "Capture investor demand around the Golden Visa threshold",
    body: "The visitor checks whether their budget or property value reaches the main UAE thresholds. The agency receives a qualified investor lead instead of a vague first message.",
  },
  {
    label: "Widget 03 / Yield Net",
    title: "Open the investment conversation with rental return",
    body: "The visitor gets a first net-yield angle before speaking to anyone. The broker starts with a concrete return discussion, not a generic investment inquiry.",
  },
  {
    label: "Widget 04 / Off-plan fit",
    title: "Qualify off-plan buyers before the first serious call",
    body: "The visitor checks whether a payment plan feels realistic. The broker sees stronger buyer intent and spends less time on weak off-plan inquiries.",
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
  "1.05M+ Dubai DLD transactions",
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

function mountWidget() {
  const maybeWindow = window as unknown as {
    FonatPropWidget?: { mountAll?: () => void };
    RealPriceWidget?: { mountAll?: () => void };
  };
  (maybeWindow.FonatPropWidget || maybeWindow.RealPriceWidget)?.mountAll?.();
}

function ProductSplit() {
  return (
    <section className="bg-[#f4f1ea] px-5 py-20 text-[#15120f]">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[34px] border border-black/10 bg-white p-7 shadow-[0_26px_80px_rgba(21,18,15,0.10)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#3b82f6]">
            Product category
          </p>
          <h2 className="mt-4 font-[var(--font-display)] text-[clamp(2.6rem,5vw,5.4rem)] font-light leading-[0.9] tracking-normal">
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
            <h3 className="mt-4 text-3xl font-semibold tracking-normal">
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
            <h3 className="mt-4 text-3xl font-semibold tracking-normal">
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
            <h2 className="max-w-4xl font-[var(--font-display)] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-normal">
              Turn the website
              <br />
              <span className="italic text-[#15120f]/42">into an inquiry engine.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-8 text-[#15120f]/58">
            This is one embeddable widget with four different reasons to start a conversation.
            The agency keeps one surface on the site, but captures seller, investor and off-plan
            intent from different entry points.
          </p>
        </div>

        <div className="mb-10 grid gap-4 lg:grid-cols-2">
          {widgetToolCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_18px_55px_rgba(21,18,15,0.07)]"
            >
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#3b82f6]">
                {card.label}
              </p>
              <h3 className="text-[1.6rem] font-semibold tracking-normal text-[#15120f]">
                {card.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-black/56">{card.body}</p>
            </article>
          ))}
        </div>

        <div className="overflow-hidden rounded-[44px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),linear-gradient(180deg,#06101b,#05070c)] p-6 shadow-[0_42px_120px_rgba(0,0,0,0.28)] md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/38">
                Live script preview
              </p>
              <p className="mt-1 text-sm text-white/56">
                One premium widget. Four different lead-capture conversations in the same frame.
              </p>
            </div>
            <div className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/46">
              Private implementation
            </div>
          </div>

          <Script src="/widget/embed.js" strategy="afterInteractive" onLoad={mountWidget} />
          <div className="rounded-[40px] border border-white/8 bg-black/20 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-3">
            <div
              data-fonatprop-widget
              data-mode="inline"
              data-widget-mode="carousel"
              data-carousel-cards="valuation,golden_visa,net_yield,offplan_payment"
              data-agency-id="broker-demo-001"
              data-agency-token={BROKER_DEMO_WIDGET_TOKEN}
              data-brand-color="#3b82f6"
              data-banner-title="Want to know how much your Dubai property is worth?"
              data-banner-cta="Get your free valuation"
              data-banner-image="/dubai-slides/03-burj-al-arab.jpg"
            />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-black/10 bg-[#15120f] p-6 text-white">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
                Delivery model
              </p>
              <p className="text-[15px] leading-8 text-white/62">
                The agency installs one script, chooses the cards it wants to show, and keeps the
                lead routing private behind its own token and contact setup.
              </p>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-white/70 p-6">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-black/35">
                Why this matters
              </p>
              <p className="text-[15px] leading-8 text-black/60">
                Not every visitor wants only a valuation. Some want yield, some want Golden Visa
                clarity, and some want to understand an off-plan payment plan before speaking to a broker.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SmartRenovationDemoSection() {
  return (
    <section id="smart-renovation" className="relative overflow-hidden bg-[#07101a] px-5 py-24 text-white">
      <div className="absolute inset-0 bg-[url('/dubai-slides/04-marina-night.jpg')] bg-cover bg-center opacity-18" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,16,26,0.96),rgba(7,10,18,0.98)_52%,rgba(18,34,48,0.92))]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-100/55">
              Smart renovation
            </p>
            <h2 className="mt-5 font-[var(--font-display)] text-[clamp(3rem,6vw,6.6rem)] font-light leading-[0.9] tracking-normal">
              Visualize the upgrade.
              <span className="block italic text-white/38">Capture the project.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-[15px] leading-7 text-white/58 lg:justify-self-end">
            A premium lead magnet for owners, investors and buyers: upload a room, mark what should change, estimate cost and hand the context to the broker or designer.
          </p>
        </div>
        <SmartRenovationRequest agencyId="broker-demo-001" />
      </div>
    </section>
  );
}

function TrafficGenerationDemoSection() {
  return (
    <section id="traffic-generation" className="relative overflow-hidden bg-[#061018] px-5 py-24 text-white">
      <div className="absolute inset-0 bg-[url('/dubai-slides/07-marina-aerial.jpg')] bg-cover bg-center opacity-22" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,16,24,0.97),rgba(6,16,24,0.88)_48%,rgba(6,50,60,0.7))]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-100/52">
              Demand operating layer
            </p>
            <h2 className="font-[var(--font-display)] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-normal">
              Bring demand.
              <br />
              <span className="italic text-white/42">Own the relationship.</span>
            </h2>
          </div>
          <p className="max-w-xl text-[15px] leading-8 text-white/58">
            FonatProp does not replace the agency website or the web studio. It adds a confidential acquisition layer around the agency brand.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-[34px] border border-white/[0.08] bg-white/[0.06] lg:grid-cols-3">
          {[
            ["Demand", "Increase qualified commercial attention."],
            ["Qualify", "Turn property intent into a private agency inquiry."],
            ["Proof", "Show enough commercial movement to scale with confidence."],
          ].map(([title, body], index) => (
            <article key={title} className="min-h-[240px] bg-[#090a10]/94 p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/52">
                0{index + 1}
              </p>
              <h3 className="mt-8 text-2xl font-semibold tracking-normal text-white">
                {title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/50">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CycleClosureSection() {
  const supportMape = DUBAI_PUBLIC_BENCHMARKS.support.meanErrorPct.toFixed(1);
  const supportWithin20 = DUBAI_PUBLIC_BENCHMARKS.support.within20Pct.toFixed(1);
  const broadMape = DUBAI_PUBLIC_BENCHMARKS.broad.mapePct.toFixed(1);

  return (
    <section id="handoff" className="bg-[#0a0a0f] px-5 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
              Sales loop / closed
            </p>
            <h2 className="font-[var(--font-display)] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-normal">
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
              <h3 className="mt-8 text-2xl font-semibold tracking-normal text-white">
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
              Dubai proof stays honest: the support-rich slice is around {supportMape}% MAPE with{" "}
              {supportWithin20}% of estimates inside 20%, while the broader strict temporal
              holdout is around {broadMape}% MAPE. The public site shows ranges; the agent keeps the final
              professional recommendation.
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const plans = [
    {
      name: "Launch Widget",
      price: billingCycle === "monthly" ? "$700" : "$7,000",
      detail: billingCycle === "monthly" ? "/ month" : "/ year",
      badge: "Watermark included",
      body: "For brokerages that want a private intake experience live fast, with FonatProp branding visible on the surface.",
      points: [
        "FonatProp software fee: USD 700/month",
        "30-day free pilot included",
        "Agency-branded widget with FonatProp mark",
        "Broker-ready inquiries",
        "Private performance dashboard",
        "FonatProp watermark visible",
      ],
    },
    {
      name: "Private Label",
      price: billingCycle === "monthly" ? "$1,000" : "$10,000",
      detail: billingCycle === "monthly" ? "/ month" : "/ year",
      badge: "No watermark",
      body: "For agencies that want the same product with a cleaner branded surface and no FonatProp mark visible to the visitor.",
      points: [
        "FonatProp software fee: USD 1,000/month",
        "30-day free pilot included",
        "Everything in Launch Widget",
        "Agency-branded widget setup",
        "Broker-ready inquiries",
        "No FonatProp watermark",
      ],
    },
    {
      name: "Growth OS",
      price: billingCycle === "monthly" ? "$1,500" : "$15,000",
      detail: billingCycle === "monthly" ? "/ month" : "/ year",
      badge: "Managed growth",
      body: "Seller Acquisition Operating System: a managed monthly program for qualified demand, private intake and commercial proof.",
      points: [
        "FonatProp operating fee: USD 1,500/month",
        "Everything in Private Label",
        "Managed demand program",
        "Agency-approved growth budget stays separate",
        "Private conversion workspace",
        "Monthly commercial optimization",
      ],
    },
    {
      name: "Premium OS",
      price: billingCycle === "monthly" ? "$3,000" : "$30,000",
      detail: billingCycle === "monthly" ? "/ month" : "/ year",
      badge: "Full operating layer",
      body: "For teams that want advanced acquisition modules, private routing, reporting and priority operating support.",
      points: [
        "FonatProp premium operating fee: USD 3,000/month",
        "Everything in Growth OS",
        "Advanced acquisition modules",
        "Advanced private routing",
        "Monthly executive report",
        "Agency-approved growth budget stays separate",
      ],
    },
  ];

  return (
    <section className="bg-[#0a0a0f] px-5 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
          Commercial model / memberships
        </p>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-4xl font-[var(--font-display)] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-normal">
            Four ways in.
            <br />
            <span className="italic text-white/42">One acquisition layer.</span>
          </h2>
          <p className="max-w-md text-[15px] leading-8 text-white/55">
            FonatProp does not build websites. Partners keep the site; FonatProp adds a private acquisition layer.
            Every plan starts with a 30-day pilot.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-white/12 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-5 py-3 text-[11px] uppercase tracking-[0.26em] transition ${
                billingCycle === "monthly"
                  ? "bg-white text-[#0a0a0f]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`rounded-full px-5 py-3 text-[11px] uppercase tracking-[0.26em] transition ${
                billingCycle === "annual"
                  ? "bg-white text-[#0a0a0f]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`overflow-hidden rounded-[34px] border p-7 shadow-[0_22px_80px_rgba(0,0,0,0.22)] ${
                index === 1
                  ? "border-[#ebc469]/40 bg-[radial-gradient(circle_at_top_right,rgba(235,196,105,0.18),transparent_32%),linear-gradient(180deg,rgba(18,20,28,0.96),rgba(7,10,18,0.98))]"
                  : index === 2
                    ? "border-cyan-200/30 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_32%),linear-gradient(180deg,rgba(13,31,42,0.96),rgba(7,10,18,0.98))]"
                    : index === 3
                      ? "border-emerald-200/30 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_32%),linear-gradient(180deg,rgba(13,34,28,0.96),rgba(7,10,18,0.98))]"
                  : "border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,rgba(14,18,30,0.94),rgba(7,10,18,0.98))]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/42">
                    {plan.badge}
                  </p>
                  <h3 className="mt-4 text-[2rem] font-semibold tracking-normal text-white">
                    {plan.name}
                  </h3>
                </div>
                {index === 1 ? (
                  <span className="rounded-full bg-[#ebc469] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#0a0a0f]">
                    Premium
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex items-end gap-3">
                <p className="font-[var(--font-display)] text-[clamp(3rem,5vw,4.8rem)] font-light leading-none tracking-normal text-white">
                  {plan.price}
                </p>
                <p className="pb-3 text-sm uppercase tracking-[0.2em] text-white/46">{plan.detail}</p>
              </div>

              <p className="mt-5 max-w-xl text-[15px] leading-8 text-white/58">{plan.body}</p>

              <div className="mt-8 space-y-3">
                {plan.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/68"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-5 text-sm leading-7 text-white/54">
          FonatProp is partner-friendly: it does not replace website builders or creative studios.
          It adds a confidential acquisition layer that turns their work into qualified inquiries
          and measurable monthly reports.
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const hasPublicDubaiWhatsApp = FONATPROP_CONTACT.whatsappDisplay.trim().startsWith("+971");
  const contactCards = hasPublicDubaiWhatsApp
    ? [
        {
          label: "WhatsApp",
          value: FONATPROP_CONTACT.whatsappDisplay,
          href: FONATPROP_CONTACT.whatsappHref,
          accent:
            "border-emerald-300/20 bg-emerald-300/[0.07] hover:border-emerald-200/40 hover:bg-emerald-300/[0.11]",
          textAccent: "text-emerald-100/62",
          external: true,
        },
        {
          label: "Email",
          value: FONATPROP_CONTACT.email,
          href: FONATPROP_CONTACT.emailHref,
          accent:
            "border-blue-300/20 bg-blue-300/[0.07] hover:border-blue-200/40 hover:bg-blue-300/[0.11]",
          textAccent: "text-blue-100/62",
          external: false,
        },
      ]
    : [
        {
          label: "Website",
          value: FONATPROP_CONTACT.website,
          href: FONATPROP_CONTACT.websiteHref,
          accent:
            "border-cyan-300/20 bg-cyan-300/[0.07] hover:border-cyan-200/40 hover:bg-cyan-300/[0.11]",
          textAccent: "text-cyan-100/62",
          external: true,
        },
        {
          label: "Email",
          value: FONATPROP_CONTACT.email,
          href: FONATPROP_CONTACT.emailHref,
          accent:
            "border-blue-300/20 bg-blue-300/[0.07] hover:border-blue-200/40 hover:bg-blue-300/[0.11]",
          textAccent: "text-blue-100/62",
          external: false,
        },
        {
          label: "Private demo",
          value: "Broker demo access",
          href: FONATPROP_CONTACT.brokerDemoHref,
          accent:
            "border-white/12 bg-white/[0.04] hover:border-white/24 hover:bg-white/[0.08]",
          textAccent: "text-white/62",
          external: true,
        },
      ];

  return (
    <section className="bg-[#0a0a0f] px-5 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
            Contact / FonatProp
          </p>
          <h2 className="font-[var(--font-display)] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-normal">
            Book the demo.
            <br />
            <span className="italic text-white/42">Talk to us directly.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-8 text-white/55">
            For brokerages, pilots and commercial setup, use the private demo route and the
            FonatProp commercial inbox.
          </p>
        </div>
        <div className="rounded-[34px] border border-white/10 bg-white/[0.045] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.25)]">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-blue-200/70">
            Direct contact
          </p>
          <div className="grid gap-4">
            {contactCards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.external ? "_blank" : undefined}
                rel={card.external ? "noopener noreferrer" : undefined}
                className={`rounded-[24px] border p-5 transition ${card.accent}`}
              >
                <p className={`font-mono text-[10px] uppercase tracking-[0.28em] ${card.textAccent}`}>
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-normal">{card.value}</p>
              </a>
            ))}
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
            <span className="font-[var(--font-display)] text-[3.2rem] font-light italic leading-none tracking-normal text-white/92">
              fp
            </span>
            <span className="h-16 w-px bg-white/42" />
            <span>
              <span className="block font-[var(--font-display)] text-[clamp(2.6rem,4.2vw,4.7rem)] font-light leading-none tracking-normal">
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
          <h1 className="max-w-5xl font-[var(--font-display)] text-[clamp(3.2rem,7vw,7.5rem)] font-light leading-[0.88] tracking-normal">
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

      <WidgetShowcase />
      <TrafficGenerationDemoSection />
      <CycleClosureSection />

      <div id="valuation">
        <GoogleMapsLoader>
          <ValorarSection publicDemo />
        </GoogleMapsLoader>
      </div>

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
                <h3 className="text-2xl font-semibold tracking-normal">{benefit.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/52">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MandatePackPreviewSection />
      <PricingSection />
      <ContactSection />
    </div>
  );
}
