"use client";

import HeroCarousel from "./components/HeroCarousel";
import NavBar from "./components/NavBar";
import GoogleMapsLoader from "./components/GoogleMapsLoader";
import ValorarSection from "./components/ValorarSection";
import MapSection from "./components/MapSection";
import RadarSection from "./components/RadarSection";
import InversionSection from "./components/InversionSection";
import ReformaSection from "./components/ReformaSection";

export default function RealPricePage() {
  return (
    <GoogleMapsLoader>
    <div className="min-h-screen bg-[#0a0a0f] text-white font-[system-ui,sans-serif] antialiased">
      <NavBar />
      <HeroCarousel />

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <ValorarSection />

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <MapSection />

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <RadarSection />

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <InversionSection />

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <ReformaSection />

      {/* Footer */}
      <footer className="px-4 md:px-8 py-16 border-t border-white/5 text-center">
        <p className="text-xs text-white/15 tracking-widest uppercase">
          FonatProp &mdash; AI-Powered Property Valuation
        </p>
        <p className="text-[10px] text-white/8 mt-2">
          &copy; 2026 FonatProp. All rights reserved.
        </p>
      </footer>
    </div>
    </GoogleMapsLoader>
  );
}
