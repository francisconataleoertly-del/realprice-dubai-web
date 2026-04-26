"use client";

import Script from "next/script";

import GoogleMapsLoader from "@/app/realprice/components/GoogleMapsLoader";
import ValorarSection from "@/app/realprice/components/ValorarSection";

const installSnippet = `<div
  data-realprice-widget
  data-mode="banner"
  data-agency-id="dubana-001"
  data-agent-phone="+971501234567"
  data-agent-email="info@dubana.ae"
  data-lead-webhook="https://hooks.zapier.com/hooks/catch/123/abc/"
  data-address-api="https://fonatprop.com/api/widget">
</div>
<script src="https://fonatprop.com/widget/embed.js" async></script>`;

const handoffCards = [
  {
    label: "1 / Capture",
    title: "Visitor leaves name, email and phone",
    body: "The first step is pure lead capture. It sends a lightweight event immediately, even before the estimate.",
  },
  {
    label: "2 / Estimate",
    title: "Address + bedrooms + area create a wide range",
    body: "The widget uses FonatProp's live address valuation endpoint, then shows a broad public range so the agent keeps the exact valuation conversation.",
  },
  {
    label: "3 / Agent handoff",
    title: "Webhook, WhatsApp and email all fire together",
    body: "Small agencies can use Zapier or Make. Bigger teams can send the same payload into HubSpot, Pipedrive or a private backend.",
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
  {
    en: "234K+ verified Dubai transactions",
    ar: "أكثر من 234 ألف معاملة موثقة في دبي",
  },
  {
    en: "Building-level comparable anchors",
    ar: "مقارنات على مستوى المبنى",
  },
  {
    en: "English + Arabic ready for UAE clients",
    ar: "جاهز بالإنجليزية والعربية لعملاء الإمارات",
  },
];

function mountWidget() {
  const maybeWindow = window as unknown as {
    FonatPropWidget?: { mountAll?: () => void };
  };
  maybeWindow.FonatPropWidget?.mountAll?.();
}

function WidgetShowcase() {
  return (
    <section id="widget" className="bg-[#f4f1ea] px-5 py-24 text-[#15120f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-[#15120f]/45">
              Product 02 / Website Widget
            </p>
            <h2 className="max-w-4xl font-['Fraunces'] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-[-0.055em]">
              Turn every agency website
              <br />
              <span className="italic text-[#15120f]/42">into a seller lead machine.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-8 text-[#15120f]/58">
            This is the exact embeddable widget brokers can install with one script. It is isolated
            with Shadow DOM, works on mobile, and posts leads to the agency in real time.
          </p>
        </div>

        <div className="rounded-[34px] border border-black/10 bg-white p-5 shadow-[0_32px_90px_rgba(21,18,15,0.14)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-black/35">
                Live script preview
              </p>
              <p className="mt-1 text-sm text-black/55">
                Banner mode: hero, contact capture, address estimate and agent handoff.
              </p>
            </div>
            <a
              href="/widget/embed.js"
              target="_blank"
              rel="noopener"
              className="rounded-full border border-black/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-black/55 transition hover:border-black/25 hover:text-black"
            >
              Open embed.js
            </a>
          </div>

          <Script src="/widget/embed.js" strategy="afterInteractive" onLoad={mountWidget} />
          <div
            data-realprice-widget
            data-mode="banner"
            data-agency-id="broker-demo-001"
            data-agent-phone="+971501234567"
            data-agent-email="demo@fonatprop.com"
            data-brand-color="#3b82f6"
            data-address-api="/api/widget"
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
              Agency install code
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-5 text-[11px] leading-6 text-white/70">
              {installSnippet}
            </pre>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white/70 p-6">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-black/35">
              How you deliver it
            </p>
            <p className="text-[15px] leading-8 text-black/60">
              For a broker, you only need their agency ID, agent WhatsApp, agent email and webhook
              destination. If they do not have a CRM, use a Zapier or Make webhook that sends the
              lead to Gmail and Google Sheets. Later, FonatProp can centralize this through a
              private leads API and dashboard.
            </p>
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
              className="broker-demo-hero-slide absolute inset-0 bg-cover opacity-0"
              style={{
                animationDelay: `${index * 5.6}s`,
                backgroundImage: `url('${slide.image}')`,
                backgroundPosition: slide.position,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(59,130,246,0.18),transparent_32%),linear-gradient(90deg,rgba(10,10,15,0.92),rgba(10,10,15,0.58)_48%,rgba(10,10,15,0.84))]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/35 via-[#0a0a0f]/76 to-[#0a0a0f]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.36em] text-white/38">
            FonatProp / Agency Revenue Demo
          </p>
          <h1 className="max-w-5xl font-['Fraunces'] text-[clamp(3.2rem,7vw,7.5rem)] font-light leading-[0.88] tracking-[-0.06em]">
            Sell the valuation.
            <br />
            <span className="italic text-white/42">Install the widget.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[16px] leading-8 text-white/58">
            A focused presentation for Dubai brokerages: a precise internal valuation tool for
            agents, plus an embeddable website widget that captures seller leads.
          </p>
          <div className="mt-6 max-w-3xl rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/34">
              English + Arabic sales-ready
            </p>
            <p className="mt-3 text-[15px] leading-7 text-white/64">
              Instant property valuation and seller lead capture for Dubai brokerages.
            </p>
            <p className="mt-2 text-right text-[18px] leading-8 text-white/78" dir="rtl" lang="ar">
              تقييم عقاري فوري وتحويل طلبات الملاك إلى فرص بيع مؤهلة للوساطة العقارية في دبي.
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
                key={item.en}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65"
              >
                <p>{item.en}</p>
                <p className="mt-2 text-right text-xs leading-5 text-white/42" dir="rtl" lang="ar">
                  {item.ar}
                </p>
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

      <div id="valuation">
        <GoogleMapsLoader>
          <ValorarSection publicDemo />
        </GoogleMapsLoader>
      </div>

      <WidgetShowcase />
    </div>
  );
}
