"use client";

import { useState, useEffect, useRef } from "react";
import { useGoogleMaps } from "./GoogleMapsLoader";

const API = "https://web-production-9051f.up.railway.app";
const TYPES = [
  { value: "Flat", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "TownHouse", label: "Townhouse" },
];
const ROOMS = ["Studio", "1 B/R", "2 B/R", "3 B/R", "4 B/R", "5 B/R"];

interface Result {
  zona: string; rooms: string; area_m2: number;
  predicted_aed: number; predicted_usd: number; predicted_per_sqft_aed: number;
  confidence_low_aed: number; confidence_high_aed: number;
  property_type: string; model_version: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

export default function ValorarSection() {
  const googleLoaded = useGoogleMaps();
  const acRef = useRef<HTMLInputElement>(null);
  const [zones, setZones] = useState<string[]>([]);
  const [form, setForm] = useState({
    zona: "Dubai Marina", rooms: "1 B/R", area_m2: 75, is_freehold: true,
    is_offplan: false, has_parking: true, property_type: "Flat",
    building_name: null as string | null, year: 2025, quarter: 2,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection observer for entrance animation
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Google Places
  useEffect(() => {
    if (!googleLoaded || !acRef.current) return;
    const g = (window as any).google;
    if (!g?.maps?.places) return;
    const ac = new g.maps.places.Autocomplete(acRef.current, {
      types: ["address"], componentRestrictions: { country: "ae" },
      fields: ["address_components", "name", "formatted_address"],
    });
    ac.addListener("place_changed", () => {
      const p = ac.getPlace();
      if (!p?.address_components) return;
      for (const c of p.address_components) {
        if (c.types.includes("sublocality_level_1") || c.types.includes("neighborhood")) {
          const m = zones.find((z) => z.toLowerCase().includes(c.long_name.toLowerCase()));
          if (m) setForm((prev) => ({ ...prev, zona: m }));
        }
        if (c.types.includes("premise")) setForm((prev) => ({ ...prev, building_name: c.long_name }));
      }
    });
  }, [googleLoaded, zones]);

  useEffect(() => {
    fetch(`${API}/zones`).then((r) => r.json()).then((d) => { if (d.zones) setZones(d.zones.sort()); }).catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch(`${API}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `Error ${r.status}`); }
      setResult(await r.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <section
      id="valorar"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/dubai-valuation-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

      {/* Content */}
      <div className={`relative z-10 px-6 md:px-12 lg:px-24 py-32 transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

        {/* Section number */}
        <div className="flex items-center gap-4 mb-10">
          <span className="font-mono text-[11px] tracking-[0.3em] text-[#3b82f6]/70">01</span>
          <div className="w-12 h-px bg-[#3b82f6]/30" />
          <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/20">Valuation</span>
        </div>

        {/* Heading */}
        <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-extralight leading-[0.95] tracking-[-0.03em] text-white mb-16 max-w-4xl">
          Know the real value
          <br />
          <span className="bg-gradient-to-r from-white/40 to-white/15 bg-clip-text text-transparent">
            of your property
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* ── LEFT: Form ── */}
          <div>
            {/* Glass card */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 md:p-10 space-y-7">

              {/* Address */}
              <div>
                <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2 block">Address</label>
                <input
                  ref={acRef}
                  type="text"
                  placeholder="Type a Dubai address..."
                  className="w-full bg-transparent border-b border-white/[0.08] pb-3 text-[16px] text-white placeholder-white/15 focus:border-[#3b82f6]/50 outline-none transition-all duration-500"
                />
              </div>

              {/* Zone + Building */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2 block">Zone</label>
                  <select
                    value={form.zona}
                    onChange={(e) => setForm({ ...form, zona: e.target.value })}
                    className="w-full bg-transparent border-b border-white/[0.08] pb-3 text-[15px] text-white focus:border-[#3b82f6]/50 outline-none transition-all duration-500 appearance-none"
                  >
                    {zones.map((z) => <option key={z} value={z} className="bg-[#111]">{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2 block">Building</label>
                  <input
                    type="text"
                    value={form.building_name || ""}
                    onChange={(e) => setForm({ ...form, building_name: e.target.value || null })}
                    placeholder="Optional"
                    className="w-full bg-transparent border-b border-white/[0.08] pb-3 text-[15px] text-white placeholder-white/10 focus:border-[#3b82f6]/50 outline-none transition-all duration-500"
                  />
                </div>
              </div>

              {/* Type — bento grid */}
              <div>
                <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-3 block">Type</label>
                <div className="grid grid-cols-3 border border-white/[0.06] rounded-lg overflow-hidden">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm({ ...form, property_type: t.value })}
                      className={`py-2.5 text-[12px] tracking-wide transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
                        form.property_type === t.value
                          ? "bg-white/[0.08] text-white"
                          : "text-white/25 hover:bg-white/[0.03] hover:text-white/50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms, Area, Year */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2 block">Rooms</label>
                  <select
                    value={form.rooms}
                    onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                    className="w-full bg-transparent border-b border-white/[0.08] pb-3 text-[15px] text-white focus:border-[#3b82f6]/50 outline-none transition-all duration-500 appearance-none"
                  >
                    {ROOMS.map((r) => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2 block">Area m&sup2;</label>
                  <input type="number" value={form.area_m2} onChange={(e) => setForm({ ...form, area_m2: Number(e.target.value) })}
                    className="w-full bg-transparent border-b border-white/[0.08] pb-3 text-[15px] text-white font-mono focus:border-[#3b82f6]/50 outline-none transition-all duration-500" />
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2 block">Year</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full bg-transparent border-b border-white/[0.08] pb-3 text-[15px] text-white font-mono focus:border-[#3b82f6]/50 outline-none transition-all duration-500" />
                </div>
              </div>

              {/* Toggles — bento grid */}
              <div className="grid grid-cols-3 border border-white/[0.06] rounded-lg overflow-hidden">
                {([
                  { key: "is_freehold" as const, on: "Freehold", off: "Leasehold" },
                  { key: "is_offplan" as const, on: "Off-Plan", off: "Ready" },
                  { key: "has_parking" as const, on: "Parking", off: "No Parking" },
                ]).map(({ key, on, off }) => (
                  <button key={key} onClick={() => setForm({ ...form, [key]: !form[key] })}
                    className={`py-2.5 text-[11px] font-mono tracking-wider transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
                      form[key] ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-white/15 hover:text-white/30 hover:bg-white/[0.02]"
                    }`}>
                    {form[key] ? on : off}
                  </button>
                ))}
              </div>

              {/* Submit */}
              <button
                onClick={submit}
                disabled={loading}
                className="w-full py-4 bg-[#3b82f6] text-white text-[13px] tracking-[0.2em] uppercase rounded-xl
                  hover:bg-[#2563eb] hover:shadow-[0_0_40px_rgba(59,130,246,0.25)] disabled:opacity-40
                  transition-all duration-500 mt-2"
              >
                {loading ? "Calculating..." : "Get Valuation \u2192"}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Result ── */}
          <div className="flex items-start">
            {error && (
              <div className="w-full border-l-2 border-red-500/50 pl-4 py-2">
                <p className="font-mono text-[12px] text-red-400">{error}</p>
              </div>
            )}

            {result && (
              <div className={`w-full space-y-8 transition-all duration-700 ${result ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                {/* Big price */}
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/25 mb-4">Estimated Value</p>
                  <p className="text-[clamp(2.5rem,5vw,4.5rem)] font-extralight leading-none tracking-tight text-white">
                    <span className="text-white/30 text-[0.5em] mr-1">AED</span>
                    {fmt(result.predicted_aed)}
                  </p>
                  <p className="font-mono text-[14px] text-white/15 mt-3">
                    USD {fmt(result.predicted_usd)}
                  </p>
                </div>

                {/* Confidence bar */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/25 mb-4">Confidence &plusmn;12.7%</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[12px] text-green-400/60">{fmt(result.confidence_low_aed)}</span>
                    <div className="flex-1 relative h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/40 via-[#3b82f6]/40 to-amber-500/40 rounded-full" />
                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 -translate-x-1/2" />
                    </div>
                    <span className="font-mono text-[12px] text-amber-400/60">{fmt(result.confidence_high_aed)}</span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/25 mb-2">Per sqft</p>
                    <p className="text-[24px] font-extralight text-white">
                      <span className="text-white/25 text-[0.6em]">AED </span>{fmt(result.predicted_per_sqft_aed)}
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/25 mb-2">Per m&sup2;</p>
                    <p className="text-[24px] font-extralight text-white">
                      <span className="text-white/25 text-[0.6em]">AED </span>{fmt(Math.round(result.predicted_aed / result.area_m2))}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <p className="font-mono text-[11px] text-white/10 leading-relaxed">
                  {result.zona} &middot; {result.rooms} &middot; {result.property_type} &middot; {result.area_m2}m&sup2; &middot; {result.model_version}
                </p>
              </div>
            )}

            {!result && !error && (
              <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full border border-white/[0.06] flex items-center justify-center">
                    <span className="text-white/10 text-2xl">&rarr;</span>
                  </div>
                  <p className="text-white/10 text-[14px] max-w-[200px] mx-auto leading-relaxed">
                    Your valuation will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Model accuracy badge */}
        <div className="mt-20 flex items-center gap-6 text-white/10">
          <div className="w-20 h-px bg-white/[0.06]" />
          <span className="font-mono text-[10px] tracking-[0.2em]">
            MODEL ACCURACY: R&sup2; 0.889 &bull; MAPE 12.7% &bull; 81.6% WITHIN 20%
          </span>
        </div>
      </div>
    </section>
  );
}
