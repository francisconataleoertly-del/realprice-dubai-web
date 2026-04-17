"use client";

import { useEffect, useState, useCallback } from "react";
import { Map as MapIcon } from "lucide-react";
import GoogleMap, { type MapLayer } from "./GoogleMap";
import { LAYER_DEFS as POI_LAYERS } from "./dubaiPOIs";

const API = "https://web-production-9051f.up.railway.app";

interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  median_price?: number;
  transactions?: number;
  psf?: number;
}

interface ZoneStats {
  zone: string;
  data: {
    total_transactions: number;
    median_price: number;
    recent_transactions: Array<{
      date: string;
      building: string;
      rooms: string;
      area_m2: number;
      price_aed: number;
      type: string;
    }>;
  };
}

// Zone coordinates
const ZONE_COORDS: Record<string, [number, number]> = {
  "Marsa Dubai": [25.0805, 55.1403], "Dubai Marina": [25.0805, 55.1403],
  "Burj Khalifa": [25.1972, 55.2744], "Downtown Dubai": [25.1972, 55.2744],
  "Palm Jumeirah": [25.1124, 55.1390], "Business Bay": [25.1851, 55.2719],
  "Al Merkadh": [25.0800, 55.1325], "JBR": [25.0800, 55.1325],
  "Jumeirah Village Circle": [25.0657, 55.2094], "JVC": [25.0657, 55.2094],
  "Dubai Hills Estate": [25.1276, 55.2453],
  "Arabian Ranches": [25.0590, 55.2693], "Arabian Ranches 2": [25.0500, 55.2800],
  "DIFC": [25.2100, 55.2789],
  "Al Barsha First": [25.1136, 55.1986], "Motor City": [25.0469, 55.2367],
  "Dubai Sports City": [25.0381, 55.2241], "Dubai Silicon Oasis": [25.1177, 55.3785],
  "International City": [25.1571, 55.4046], "Discovery Gardens": [25.0434, 55.1348],
  "Jumeirah Lake Towers": [25.0762, 55.1516], "JLT": [25.0762, 55.1516],
  "Dubai Creek Harbour": [25.1960, 55.3398], "Mirdif": [25.2162, 55.4210],
  "Al Nahda First": [25.2935, 55.3740], "Deira": [25.2710, 55.3320],
  "Dubai Land": [25.0500, 55.3000], "Al Furjan": [25.0290, 55.1490],
  "Dubai Investment Park": [25.0000, 55.1500], "Jumeirah": [25.2100, 55.2500],
  "Al Quoz": [25.1500, 55.2200], "Damac Hills": [25.0330, 55.2400],
  "Town Square": [25.0250, 55.2600], "Meydan": [25.1700, 55.3000],
  "Sobha Hartland": [25.1800, 55.3200], "Emaar Beachfront": [25.0900, 55.1350],
  "Bluewaters": [25.0820, 55.1250], "Al Wasl": [25.2000, 55.2600],
  "Zabeel": [25.2200, 55.2900], "Umm Suqeim": [25.1600, 55.2100],
};

// POI_LAYERS imported from dubaiPOIs.ts — 921 POIs across 24 categories

const fmt = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

export default function MapSection() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zoneStats, setZoneStats] = useState<ZoneStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["metro"]));

  // Build layers with visibility
  const layers: MapLayer[] = POI_LAYERS.map((def) => ({
    ...def,
    visible: activeLayers.has(def.key),
  }));

  const toggleLayer = (key: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Fetch zones
  useEffect(() => {
    fetch(`${API}/zones`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.zones) return;
        const parsed: Zone[] = [];
        const medianPsf = data.median_psf || {};
        data.zones.forEach((name: string, i: number) => {
          const coords = ZONE_COORDS[name];
          if (!coords) return;
          parsed.push({
            id: String(i), name,
            lat: coords[0], lng: coords[1],
            median_price: (medianPsf[name] || 0) * 800,
            psf: medianPsf[name] || 0,
          });
        });
        if (parsed.length > 0) setZones(parsed);
      })
      .catch(() => {});
  }, []);

  // Fetch zone stats when selected
  useEffect(() => {
    if (!selectedZone) return;
    setLoadingStats(true);
    fetch(`${API}/zone-stats/${encodeURIComponent(selectedZone.name)}`)
      .then((r) => r.json())
      .then((data) => setZoneStats(data))
      .catch(() => setZoneStats(null))
      .finally(() => setLoadingStats(false));
  }, [selectedZone]);

  return (
    <section id="mapa" className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/dubai-palm-bg.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/70 to-[#0a0a0f]" />

      <div className="relative z-10 px-4 md:px-8 lg:px-16 py-28">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-10">
          <span className="font-mono text-[11px] tracking-[0.3em] text-[#3b82f6]/70">02</span>
          <div className="w-12 h-px bg-[#3b82f6]/30" />
          <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/20">Map</span>
        </div>

        <h2 className="text-[clamp(2.2rem,5vw,4.5rem)] font-extralight leading-[0.95] tracking-[-0.03em] text-white mb-4 max-w-3xl">
          Explore Dubai
          <br />
          <span className="bg-gradient-to-r from-white/40 to-white/15 bg-clip-text text-transparent">by the numbers</span>
        </h2>
        <p className="text-white/30 text-[15px] mb-10 max-w-xl">
          <span className="font-mono text-[13px] text-[#3b82f6]/60">{zones.length}</span> zones &bull;{" "}
          <span className="font-mono text-[13px] text-[#3b82f6]/60">{POI_LAYERS.reduce((a, l) => a + l.items.length, 0)}</span> points of interest
        </p>

        {/* Map in glass card */}
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
          <GoogleMap zones={zones} layers={layers} onSelect={setSelectedZone} />
        </div>

        {/* Layer toggles — clean grid below map */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 mt-4 mb-6 border border-white/5 rounded-lg overflow-hidden bg-[#0d0d14]">
          {POI_LAYERS.map((def, i) => {
            const active = activeLayers.has(def.key);
            return (
              <button
                key={def.key}
                onClick={() => toggleLayer(def.key)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-center transition-all duration-200 border-r border-b border-white/[0.04] ${
                  active
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-20"}`}
                  style={{ backgroundColor: def.color }}
                />
                <span className={`text-[11px] tracking-wide ${active ? "text-white" : "text-white/25"}`}>
                  {def.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Zone details + price legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price legend */}
          <div className="p-3 rounded-lg border border-white/5 bg-[#0d0d14]">
            <p className="text-[10px] text-white/30 tracking-wider uppercase mb-2">Zone Prices (AED/sqft)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { color: "#ef4444", label: ">2.5K" },
                { color: "#f59e0b", label: "1.5-2.5K" },
                { color: "#3b82f6", label: "0.8-1.5K" },
                { color: "#10b981", label: "<800" },
              ].map((l) => (
                <div key={l.color} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[10px] text-white/40">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected zone details */}
          {selectedZone ? (
            <div className="md:col-span-2 p-3 rounded-lg border border-[#3b82f6]/20 bg-[#3b82f6]/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">{selectedZone.name}</p>
                {selectedZone.psf ? (
                  <span className="text-xs text-white font-mono">AED {fmt(selectedZone.psf)}/sqft</span>
                ) : null}
              </div>
              {loadingStats && <p className="text-xs text-white/20 animate-pulse">Loading stats...</p>}
              {zoneStats?.data && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-white/30 mb-0.5">Transactions</p>
                    <p className="text-white font-mono">{zoneStats.data.total_transactions}</p>
                  </div>
                  <div>
                    <p className="text-white/30 mb-0.5">Median</p>
                    <p className="text-white font-mono">AED {fmt(zoneStats.data.median_price)}</p>
                  </div>
                  {zoneStats.data.recent_transactions?.slice(0, 2).map((tx, i) => (
                    <div key={i}>
                      <p className="text-white/30 mb-0.5 truncate">{tx.building}</p>
                      <p className="text-white font-mono text-[11px]">AED {fmt(tx.price_aed)}</p>
                      <p className="text-white/20 text-[10px]">{tx.rooms} &bull; {tx.area_m2}m&sup2;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="md:col-span-2 p-3 rounded-lg border border-dashed border-white/5 flex items-center justify-center">
              <p className="text-xs text-white/15">Click a zone on the map to see details</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
