"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import GoogleMap, { type MapLayer } from "./GoogleMap";
import { LAYER_DEFS as POI_LAYERS } from "./dubaiPOIs";

const API = "/api/fonatprop";

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
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Chapter II</span>
            <div className="w-12 h-px bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Cartography</span>
          </div>

          <h2 className="font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white max-w-4xl">
            Explore Dubai
            <br />
            <span className="italic font-extralight text-white/40">by the numbers.</span>
          </h2>

          <div className="mt-8 flex items-center gap-8 text-[13px]">
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-[28px] font-extralight text-white">{zones.length}</span>
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30">zones</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-[28px] font-extralight text-white">
                {POI_LAYERS.reduce((a, l) => a + l.items.length, 0)}
              </span>
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30">points of interest</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-[28px] font-extralight text-white">{POI_LAYERS.length}</span>
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30">layers</span>
            </div>
          </div>
        </motion.div>

        {/* Map in editorial frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="relative"
        >
          {/* Corner frame marks */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t border-l border-white/25 z-10" />
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t border-r border-white/25 z-10" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b border-l border-white/25 z-10" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b border-r border-white/25 z-10" />

          <div className="relative overflow-hidden">
            <GoogleMap zones={zones} layers={layers} onSelect={setSelectedZone} />

            {/* Corner map label */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0f]/80 backdrop-blur-sm border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/50">Live</span>
            </div>
            <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 bg-[#0a0a0f]/80 backdrop-blur-sm border border-white/10">
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/40">
                25.15 N / 55.25 E
              </span>
            </div>
          </div>
        </motion.div>

        {/* Layer toggles — editorial grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <p className="font-['Fraunces'] italic text-[13px] font-light text-white/40">Layers</p>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30">
              {activeLayers.size} / {POI_LAYERS.length} Active
            </p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 border border-white/[0.06] overflow-hidden">
            {POI_LAYERS.map((def) => {
              const active = activeLayers.has(def.key);
              return (
                <button
                  key={def.key}
                  onClick={() => toggleLayer(def.key)}
                  className={`relative flex items-center justify-center gap-2 px-2 py-3 text-center transition-all duration-300 border-r border-b border-white/[0.04] group ${
                    active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                      active ? "opacity-100 scale-110" : "opacity-15 scale-100"
                    }`}
                    style={{ backgroundColor: def.color, boxShadow: active ? `0 0 8px ${def.color}80` : "none" }}
                  />
                  <span className={`text-[10px] tracking-wide transition-colors duration-300 ${active ? "text-white" : "text-white/25"}`}>
                    {def.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="layer-underline"
                      className="absolute bottom-0 left-0 right-0 h-px"
                      style={{ backgroundColor: def.color }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Zone details + price legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price legend */}
          <div className="relative p-4 bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08]">
            <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/20" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/20" />
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">Price &mdash; AED/sqft</p>
            <div className="space-y-1.5">
              {[
                { color: "#ef4444", label: "Over 2,500", range: ">2.5K" },
                { color: "#f59e0b", label: "1,500 - 2,500", range: "1.5-2.5K" },
                { color: "#3b82f6", label: "800 - 1,500", range: "0.8-1.5K" },
                { color: "#10b981", label: "Under 800", range: "<800" },
              ].map((l) => (
                <div key={l.color} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-white/50">{l.label}</span>
                  </div>
                  <span className="font-mono text-white/30">{l.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected zone — editorial */}
          {selectedZone ? (
            <motion.div
              key={selectedZone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="md:col-span-2 relative p-5 bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08]"
            >
              <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/20" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/20" />

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-['Fraunces'] italic text-[12px] font-light text-white/40 mb-1">Selected Zone</p>
                  <p className="font-['Fraunces'] text-[22px] font-light text-white tracking-tight leading-none">{selectedZone.name}</p>
                </div>
                {selectedZone.psf ? (
                  <div className="text-right">
                    <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30 mb-0.5">Median PSF</p>
                    <p className="font-['Fraunces'] text-[20px] font-extralight text-white">
                      <span className="text-white/30 text-[0.6em] mr-1">AED</span>{fmt(selectedZone.psf)}
                    </p>
                  </div>
                ) : null}
              </div>

              {loadingStats && (
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
                </div>
              )}

              {zoneStats?.data && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30 mb-1">Transactions</p>
                    <p className="font-['Fraunces'] text-[22px] font-extralight text-white">
                      {zoneStats.data.total_transactions}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30 mb-1">Median</p>
                    <p className="font-['Fraunces'] text-[22px] font-extralight text-white">
                      <span className="text-white/30 text-[0.55em] mr-1">AED</span>
                      {zoneStats.data.median_price >= 1000000 ? (zoneStats.data.median_price / 1000000).toFixed(1) + "M" : fmt(zoneStats.data.median_price)}
                    </p>
                  </div>
                  {zoneStats.data.recent_transactions?.slice(0, 2).map((tx, i) => (
                    <div key={i}>
                      <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30 mb-1 truncate">{tx.building}</p>
                      <p className="font-['Fraunces'] text-[16px] font-extralight text-white leading-tight">
                        <span className="text-white/30 text-[0.65em] mr-1">AED</span>{fmt(tx.price_aed)}
                      </p>
                      <p className="font-mono text-[9px] text-white/20 mt-0.5">{tx.rooms} &middot; {tx.area_m2}m&sup2;</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="md:col-span-2 relative p-8 border-t border-b border-white/[0.04] flex items-center justify-center">
              <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/10" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/10" />
              <p className="font-['Fraunces'] italic text-white/20 text-[15px] font-light">
                Click a zone on the map to reveal details.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
