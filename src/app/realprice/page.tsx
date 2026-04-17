"use client";

import HeroCarousel from "./components/HeroCarousel";
import NavBar from "./components/NavBar";
import GoogleMapsLoader from "./components/GoogleMapsLoader";
import StatsSection from "./components/StatsSection";
import ValorarSection from "./components/ValorarSection";
import MapSection from "./components/MapSection";
import RadarSection from "./components/RadarSection";
import InversionSection from "./components/InversionSection";
import ReformaSection from "./components/ReformaSection";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";

export default function RealPricePage() {
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

      {/* Floating AI Chat */}
      <ChatWidget />
    </div>
    </GoogleMapsLoader>
  );
}
