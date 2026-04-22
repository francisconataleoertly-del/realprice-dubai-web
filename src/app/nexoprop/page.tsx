"use client";

import HeroCarousel from "../realprice/components/HeroCarousel";
import NavBar from "../realprice/components/NavBar";
import GoogleMapsLoader from "../realprice/components/GoogleMapsLoader";
import StatsSection from "../realprice/components/StatsSection";
import ValorarSection from "../realprice/components/ValorarSection";
import MapSection from "../realprice/components/MapSection";
import RadarSection from "../realprice/components/RadarSection";
import InversionSection from "../realprice/components/InversionSection";
import ReformaSection from "../realprice/components/ReformaSection";
import Footer from "../realprice/components/Footer";
import ChatWidget from "../realprice/components/ChatWidget";

export default function NexoPropPage() {
  return (
    <GoogleMapsLoader>
      <div className="min-h-screen bg-[#0a0a0f] text-white font-[system-ui,sans-serif] antialiased">
        <NavBar />
        <HeroCarousel />
        <StatsSection />
        <ValorarSection />
        <MapSection />
        <RadarSection />
        <InversionSection />
        <ReformaSection />
        <Footer />
        <ChatWidget />
      </div>
    </GoogleMapsLoader>
  );
}
