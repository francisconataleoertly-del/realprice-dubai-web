"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { useGoogleMaps } from "@/app/realprice/components/GoogleMapsLoader";
import marketData from "@/data/france-dvf-market.json";
import ParallaxBackdrop from "@/components/design/ParallaxBackdrop";
import NoiseTexture from "@/components/design/NoiseTexture";
import { LAYER_DEFS, type LayerDef, type POIItem } from "./francePOIs";

type PropertyType = "Appartement" | "Maison";

type CommuneRecord = {
  commune: string;
  commune_code?: string;
  department_code: string;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
  cagr_pct?: number;
  liquidity_score?: number;
  lat?: number;
  lon?: number;
};

type FranceMarketShape = {
  featured: CommuneRecord[];
  by_commune: CommuneRecord[];
};

const data = marketData as unknown as FranceMarketShape;

interface ZoneMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  property_type: PropertyType;
  department_code: string;
  median_price_per_m2: number;
  median_value_eur: number;
  transactions: number;
  avg_area_m2: number;
  cagr_pct?: number;
  liquidity_score?: number;
}

const FRANCE_CENTER = { lat: 46.7, lng: 2.5 };
const FRANCE_ZOOM = 6;

const MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "2258c8a7-7ee7-4bbe-9891-b6121da134c7";

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

function getPriceColor(psm: number) {
  if (psm >= 8000) return "#ef4444";
  if (psm >= 5000) return "#f59e0b";
  if (psm >= 3000) return "#3b82f6";
  return "#10b981";
}

function getPriceColorLabel(psm: number) {
  if (psm >= 8000) return "Premium";
  if (psm >= 5000) return "High";
  if (psm >= 3000) return "Mid";
  return "Affordable";
}

function buildFranceZones(): ZoneMarker[] {
  const seen = new Set<string>();
  const collected: ZoneMarker[] = [];

  const pool: CommuneRecord[] = [
    ...((data.featured || []).filter((c) => c.lat && c.lon)),
    ...((data.by_commune || []).filter((c) => c.lat && c.lon)),
  ];

  for (const c of pool) {
    if (!c.lat || !c.lon) continue;
    const key = `${c.commune}-${c.department_code}-${c.property_type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    collected.push({
      id: key,
      name: c.commune,
      lat: c.lat,
      lng: c.lon,
      property_type: c.property_type,
      department_code: c.department_code,
      median_price_per_m2: c.median_price_per_m2,
      median_value_eur: c.median_value_eur,
      transactions: c.transactions,
      avg_area_m2: c.avg_area_m2,
      cagr_pct: c.cagr_pct,
      liquidity_score: c.liquidity_score,
    });

    if (collected.length >= 60) break;
  }

  return collected;
}

const FRANCE_ZONES = buildFranceZones();

function FranceMap({
  zones,
  visibleLayers,
  onSelect,
}: {
  zones: ZoneMarker[];
  visibleLayers: Set<string>;
  onSelect: (zone: ZoneMarker) => void;
}) {
  const loaded = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const zoneMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const layerMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement[]>>(
    new Map(),
  );

  const initMap = useCallback(() => {
    if (!loaded || !mapRef.current || mapInstance.current) return;
    const google = window.google;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: FRANCE_CENTER,
      zoom: FRANCE_ZOOM,
      mapId: MAP_ID,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0d0d14" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616679" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d14" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#07111f" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [loaded]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  useEffect(() => {
    if (!loaded || !mapInstance.current) return;
    const google = window.google;

    zoneMarkersRef.current.forEach((m) => {
      m.map = null;
    });
    zoneMarkersRef.current = [];

    const infoWindow = new google.maps.InfoWindow();

    zones.forEach((zone) => {
      const color = getPriceColor(zone.median_price_per_m2);
      const size = Math.max(16, Math.min(40, zone.median_price_per_m2 / 280));

      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.style.cssText = `
        width:${size}px;height:${size}px;border-radius:999px;
        border:2px solid ${color};background:${color}28;
        box-shadow:0 0 26px ${color}35;
        cursor:pointer;transition:transform .18s ease, background .18s ease;
      `;
      markerEl.onmouseenter = () => {
        markerEl.style.transform = "scale(1.24)";
        markerEl.style.background = `${color}52`;
      };
      markerEl.onmouseleave = () => {
        markerEl.style.transform = "scale(1)";
        markerEl.style.background = `${color}28`;
      };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: { lat: zone.lat, lng: zone.lng },
        content: markerEl,
        title: zone.name,
      });

      marker.addListener("click", () => {
        onSelect(zone);
        infoWindow.setContent(`
          <div style="font-family:system-ui;min-width:200px;color:#111827;padding:4px">
            <strong>${zone.name}</strong>
            <div style="margin-top:4px;color:#6b7280;font-size:11px">${zone.property_type} &middot; Dept. ${zone.department_code}</div>
            <div style="margin-top:6px;color:#2563eb;font-weight:700">${new Intl.NumberFormat("fr-FR").format(zone.median_price_per_m2)} EUR/m²</div>
            <div style="margin-top:4px;color:#4b5563;font-size:11px">${new Intl.NumberFormat("fr-FR").format(zone.transactions)} DVF transactions</div>
          </div>
        `);
        infoWindow.open({ anchor: marker, map: mapInstance.current });
      });

      zoneMarkersRef.current.push(marker);
    });
  }, [loaded, zones, onSelect]);

  useEffect(() => {
    if (!loaded || !mapInstance.current) return;
    const google = window.google;

    LAYER_DEFS.forEach((layer) => {
      const existing = layerMarkersRef.current.get(layer.key) || [];
      const isVisible = visibleLayers.has(layer.key);

      if (isVisible && existing.length === 0) {
        const created = layer.items.map((poi) => {
          const el = document.createElement("div");
          el.style.cssText = `
            width:18px;height:18px;border-radius:999px;
            background:${layer.color}90;border:1.5px solid ${layer.color};
            box-shadow:0 0 8px ${layer.color}55;
            display:flex;align-items:center;justify-content:center;
            font-size:9px;color:white;font-weight:600;
          `;
          el.textContent = layer.emoji;
          el.title = `${layer.label}: ${poi.name}`;
          return new google.maps.marker.AdvancedMarkerElement({
            map: mapInstance.current,
            position: { lat: poi.lat, lng: poi.lng },
            content: el,
            title: poi.name,
          });
        });
        layerMarkersRef.current.set(layer.key, created);
      } else if (!isVisible && existing.length > 0) {
        existing.forEach((m) => {
          m.map = null;
        });
        layerMarkersRef.current.set(layer.key, []);
      }
    });
  }, [loaded, visibleLayers]);

  return (
    <div className="relative h-[600px] overflow-hidden border border-white/10 bg-[#07080d]">
      <div ref={mapRef} className="absolute inset-0" />
      {!loaded ? (
        <div className="absolute inset-0 grid place-items-center bg-[#07080d]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border border-white/10 border-t-blue-300" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/42">
              Loading France map
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FranceMapSection() {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    new Set(["tgv", "metro"]),
  );
  const [selected, setSelected] = useState<ZoneMarker | null>(null);

  const totalPOIs = useMemo(
    () => LAYER_DEFS.reduce((acc, l) => acc + l.items.length, 0),
    [],
  );

  const toggleLayer = (key: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section id="mapa" className="relative min-h-screen overflow-hidden">
      <ParallaxBackdrop image="/france/lyon-skyline.jpg" speed={0.4} opacity={0.42} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />
      <NoiseTexture intensity={0.05} blend="overlay" />

      <div className="relative z-10 px-4 py-28 md:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="mb-6 flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
                Chapter II
              </span>
              <div className="h-px w-12 bg-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
                Cartography
              </span>
            </div>

            <h2 className="max-w-4xl font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white">
              Explore France
              <br />
              <span className="font-extralight italic text-white/40">by the numbers.</span>
            </h2>

            <div className="mt-8 flex flex-wrap items-center gap-8 text-[13px]">
              <div className="flex items-baseline gap-2">
                <span className="font-['Fraunces'] text-[28px] font-extralight text-white">
                  {FRANCE_ZONES.length}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                  communes
                </span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-baseline gap-2">
                <span className="font-['Fraunces'] text-[28px] font-extralight text-white">
                  {totalPOIs}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                  points of interest
                </span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-baseline gap-2">
                <span className="font-['Fraunces'] text-[28px] font-extralight text-white">
                  {LAYER_DEFS.length}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                  layers
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-2 -top-2 z-10 h-8 w-8 border-l border-t border-white/25" />
            <div className="absolute -right-2 -top-2 z-10 h-8 w-8 border-r border-t border-white/25" />
            <div className="absolute -bottom-2 -left-2 z-10 h-8 w-8 border-b border-l border-white/25" />
            <div className="absolute -bottom-2 -right-2 z-10 h-8 w-8 border-b border-r border-white/25" />

            <div className="relative overflow-hidden">
              <FranceMap
                zones={FRANCE_ZONES}
                visibleLayers={activeLayers}
                onSelect={setSelected}
              />

              <div className="absolute left-4 top-4 z-10 flex items-center gap-2 border border-white/10 bg-[#0a0a0f]/80 px-3 py-1.5 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">
                  Live
                </span>
              </div>
              <div className="absolute bottom-4 right-4 z-10 border border-white/10 bg-[#0a0a0f]/80 px-3 py-1.5 backdrop-blur-sm">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
                  46.70 N / 2.50 E
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-8 mt-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <p className="font-['Fraunces'] text-[13px] font-light italic text-white/40">
                Layers
              </p>
              <div className="h-px flex-1 bg-white/[0.06]" />
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                {activeLayers.size} / {LAYER_DEFS.length} Active
              </p>
            </div>
            <div className="grid grid-cols-2 overflow-hidden border border-white/[0.06] sm:grid-cols-3 md:grid-cols-6">
              {LAYER_DEFS.map((def: LayerDef) => {
                const active = activeLayers.has(def.key);
                return (
                  <button
                    key={def.key}
                    onClick={() => toggleLayer(def.key)}
                    className={`group relative flex items-center justify-center gap-2 border-b border-r border-white/[0.04] px-2 py-3 text-center transition-all duration-300 ${
                      active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
                        active ? "scale-110 opacity-100" : "scale-100 opacity-15"
                      }`}
                      style={{
                        backgroundColor: def.color,
                        boxShadow: active ? `0 0 8px ${def.color}80` : "none",
                      }}
                    />
                    <span
                      className={`text-[10px] tracking-wide transition-colors duration-300 ${
                        active ? "text-white" : "text-white/25"
                      }`}
                    >
                      {def.label}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="france-layer-underline"
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

          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
            <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-4 backdrop-blur-2xl">
              <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
              <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                Price &mdash; EUR/m²
              </p>
              <div className="space-y-1.5">
                {[
                  { color: "#ef4444", label: "Over 8,000", range: ">8K" },
                  { color: "#f59e0b", label: "5,000 - 8,000", range: "5-8K" },
                  { color: "#3b82f6", label: "3,000 - 5,000", range: "3-5K" },
                  { color: "#10b981", label: "Under 3,000", range: "<3K" },
                ].map((l) => (
                  <div key={l.color} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="text-white/50">{l.label}</span>
                    </div>
                    <span className="font-mono text-white/30">{l.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-5 backdrop-blur-2xl md:col-span-2"
              >
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />

                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                      Selected Commune
                    </p>
                    <p className="font-['Fraunces'] text-[22px] font-light leading-none tracking-tight text-white">
                      {selected.name}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] tracking-wider text-white/30">
                      {selected.property_type} &middot; Dept. {selected.department_code} &middot;{" "}
                      {getPriceColorLabel(selected.median_price_per_m2)} tier
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Median EUR / m²
                    </p>
                    <p className="font-['Fraunces'] text-[20px] font-extralight text-white">
                      <span className="mr-1 text-[0.6em] text-white/30">EUR</span>
                      {eur(selected.median_price_per_m2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Transactions
                    </p>
                    <p className="font-['Fraunces'] text-[22px] font-extralight text-white">
                      {new Intl.NumberFormat("fr-FR").format(selected.transactions)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Median sale
                    </p>
                    <p className="font-['Fraunces'] text-[22px] font-extralight text-white">
                      <span className="mr-1 text-[0.55em] text-white/30">EUR</span>
                      {selected.median_value_eur >= 1_000_000
                        ? (selected.median_value_eur / 1_000_000).toFixed(1) + "M"
                        : eur(selected.median_value_eur)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Avg surface
                    </p>
                    <p className="font-['Fraunces'] text-[22px] font-extralight text-white">
                      {selected.avg_area_m2}
                      <span className="ml-1 text-[0.55em] text-white/30">m²</span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      CAGR
                    </p>
                    <p
                      className="font-['Fraunces'] text-[22px] font-extralight"
                      style={{
                        color:
                          (selected.cagr_pct ?? 0) > 0
                            ? "#10b981"
                            : (selected.cagr_pct ?? 0) < 0
                              ? "#ef4444"
                              : "#fff",
                      }}
                    >
                      {selected.cagr_pct !== undefined
                        ? `${selected.cagr_pct > 0 ? "+" : ""}${selected.cagr_pct.toFixed(1)}%`
                        : "—"}
                    </p>
                  </div>
                </div>

                {selected.liquidity_score !== undefined && (
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <p className="font-['Fraunces'] text-[12px] italic text-white/40">
                      Liquidity score
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-300 to-white"
                          style={{ width: `${selected.liquidity_score}%` }}
                        />
                      </div>
                      <p className="font-mono text-[12px] text-white/70">
                        {selected.liquidity_score}/100
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="relative flex items-center justify-center border-b border-t border-white/[0.04] p-8 md:col-span-2">
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/10" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/10" />
                <p className="font-['Fraunces'] text-[15px] font-light italic text-white/20">
                  Click a commune marker on the map to reveal details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
