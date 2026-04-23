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
