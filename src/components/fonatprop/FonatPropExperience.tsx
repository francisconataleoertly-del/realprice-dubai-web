"use client";

import GoogleMapsLoader from "@/app/realprice/components/GoogleMapsLoader";
import HeroCarousel from "@/app/realprice/components/HeroCarousel";
import NavBar from "@/app/realprice/components/NavBar";
import StatsSection from "@/app/realprice/components/StatsSection";
import ValorarSection from "@/app/realprice/components/ValorarSection";
import MapSection from "@/app/realprice/components/MapSection";
import RadarSection from "@/app/realprice/components/RadarSection";
import InversionSection from "@/app/realprice/components/InversionSection";
import ReformaSection from "@/app/realprice/components/ReformaSection";
import Footer from "@/app/realprice/components/Footer";
import ChatWidget from "@/app/realprice/components/ChatWidget";
import SessionRail from "@/components/access/SessionRail";
import FeatureAccessGate from "@/components/access/FeatureAccessGate";
import { useAccess } from "@/components/access/AccessProvider";

const trustLayers = [
  {
    label: "Official data spine",
    title: "DLD transactions first",
    body: "The valuation story starts with verified Dubai Land Department transaction evidence, not portal asking prices or broker opinion.",
  },
  {
    label: "Broker workflow",
    title: "Private estimate, public lead",
    body: "The precise workspace stays inside the agency. The website widget captures property-intent leads with a broad range and agent handoff.",
  },
  {
    label: "Confidence logic",
    title: "Range over false precision",
    body: "Every serious AVM needs confidence, comparable support and data-quality warnings so brokers know when to trust the model and when to inspect.",
  },
  {
    label: "Global expansion",
    title: "One product, local data",
    body: "Dubai and France share the product language, but each market keeps separate sources, compliance wording and valuation logic.",
  },
];

function BrokerTrustSection() {
  return (
    <section className="relative z-20 border-y border-white/[0.05] bg-[#05060a] px-6 py-24 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-blue-200/55">
              Methodology layer
            </p>
            <h2 className="mt-5 max-w-3xl font-['Fraunces'] text-[clamp(2.7rem,5vw,5.2rem)] font-light leading-[0.92] tracking-[-0.06em] text-white">
              Built for broker trust,
              <br />
              <span className="italic text-white/38">not public guesswork.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-[15px] leading-8 text-white/55 lg:justify-self-end">
            The global version of FonatProp should be an intelligence layer that agencies can put in front of clients with confidence: source-backed, explainable, and honest about model limits.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.06] md:grid-cols-2 xl:grid-cols-4">
          {trustLayers.map((layer, index) => (
            <article
              key={layer.title}
              className="group min-h-[260px] bg-[#0a0a0f] p-7 transition-colors duration-500 hover:bg-[#0d0f17]"
            >
              <div className="mb-8 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34">
                  {layer.label}
                </p>
                <span className="font-['Fraunces'] text-2xl italic text-white/18">
                  0{index + 1}
                </span>
              </div>
              <h3 className="text-2xl font-medium tracking-[-0.045em] text-white">
                {layer.title}
              </h3>
              <p className="mt-5 text-sm leading-7 text-white/50">{layer.body}</p>
              <div className="mt-8 h-px w-12 bg-white/14 transition-all duration-500 group-hover:w-24 group-hover:bg-blue-200/55" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FonatPropExperience({
  surface,
}: {
  surface: "public" | "private";
}) {
  const { session } = useAccess();

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen bg-[#0a0a0f] text-white font-[system-ui,sans-serif] antialiased">
        <SessionRail surface={surface} />
        <NavBar />
        <HeroCarousel />
        {surface === "private" ? (
          <section className="relative z-20 -mt-4 px-6 md:px-10 lg:px-16">
            <div className="max-w-6xl mx-auto rounded-[26px] border border-white/10 bg-[#0b0c12]/78 backdrop-blur-2xl px-6 py-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
              <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/28 mb-2">
                Private Workspace
              </p>
              <p className="text-[24px] font-light tracking-[-0.02em] text-white">
                {session.plan === "pro"
                  ? "Your Pro workspace is open."
                  : "Map and Radar are open. Pro surfaces stay gated until you upgrade."}
              </p>
              <p className="text-[14px] leading-7 text-white/48 mt-2 max-w-3xl">
                We are keeping the marketing surface public, the application private and the command center separate so the platform can grow cleanly once auth, billing and agencies go live.
              </p>
            </div>
          </section>
        ) : null}
        <StatsSection />
        <BrokerTrustSection />
        <FeatureAccessGate feature="valuation">
          <ValorarSection />
        </FeatureAccessGate>
        <FeatureAccessGate feature="map">
          <MapSection />
        </FeatureAccessGate>
        <FeatureAccessGate feature="radar">
          <RadarSection />
        </FeatureAccessGate>
        <FeatureAccessGate feature="investment">
          <InversionSection />
        </FeatureAccessGate>
        <FeatureAccessGate feature="renovation">
          <ReformaSection />
        </FeatureAccessGate>
        <Footer />
        <ChatWidget />
      </div>
    </GoogleMapsLoader>
  );
}
