"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Check } from "lucide-react";
import CountUp from "react-countup";
import { useGoogleMaps } from "./GoogleMapsLoader";

const API =
  process.env.NEXT_PUBLIC_FONATPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_NEXOPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_REALPRICE_API_BASE_URL ||
  "https://web-production-9051f.up.railway.app";

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

interface Comparable {
  date: string; building: string; rooms: string;
  area_m2: number; price_aed: number; type: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

// ── Animated switch toggle ────────────────────────────────────
function AnimatedToggle({
  on, onChange, labelOn, labelOff,
}: { on: boolean; onChange: () => void; labelOn: string; labelOff: string }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-3 group"
    >
      <div className={`relative w-10 h-5 rounded-full border transition-colors duration-300 ${
        on ? "border-white/40 bg-white/[0.08]" : "border-white/10 bg-white/[0.02]"
      }`}>
        <motion.div
          animate={{ x: on ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-colors duration-300 ${
            on ? "bg-white" : "bg-white/30"
          }`}
        />
      </div>
      <span className={`font-mono text-[11px] tracking-[0.2em] uppercase transition-colors ${on ? "text-white/90" : "text-white/30"}`}>
        {on ? labelOn : labelOff}
      </span>
    </button>
  );
}

// ── Price gauge ───────────────────────────────────────────────
function PriceGauge({ value, low, high }: { value: number; low: number; high: number }) {
  const range = high - low;
  const position = Math.max(0, Math.min(100, ((value - low) / range) * 100));
  return (
    <div className="relative pt-4">
      <div className="relative h-[3px] rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: position / 100 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ transformOrigin: "left" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400/80 via-white/80 to-amber-400/80 rounded-full"
        />
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `${position}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#0a0a0f]"
          style={{ marginLeft: -6, boxShadow: "0 0 12px rgba(255,255,255,0.6)" }}
        />
      </div>
      <div className="flex justify-between mt-3 text-[9px] font-mono tracking-widest uppercase">
        <span className="text-green-400/70">Low AED {fmt(low)}</span>
        <span className="text-amber-400/70">High AED {fmt(high)}</span>
      </div>
    </div>
  );
}

export default function ValorarSection() {
  const googleLoaded = useGoogleMaps();
  const acRef = useRef<HTMLInputElement>(null);
  const [zones, setZones] = useState<string[]>([]);
  const [addressSelected, setAddressSelected] = useState(false);
  const [addressText, setAddressText] = useState("");
  const [focused, setFocused] = useState(false);
  const [form, setForm] = useState({
    zona: "Dubai Marina", rooms: "1 B/R", area_m2: 75, is_freehold: true,
    is_offplan: false, has_parking: true, property_type: "Flat",
    building_name: null as string | null, year: 2025, quarter: 2,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      if (p.formatted_address) {
        setAddressText(p.formatted_address);
        setAddressSelected(true);
      }
    });
  }, [googleLoaded, zones]);

  useEffect(() => {
    fetch(`${API}/zones`).then((r) => r.json()).then((d) => { if (d.zones) setZones(d.zones.sort()); }).catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true); setError(""); setResult(null); setComparables([]);
    try {
      const r = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `Error ${r.status}`); }
      const data = await r.json();
      setResult(data);

      // Fetch comparables in parallel
      fetch(`${API}/comparables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zona: form.zona, rooms: form.rooms, property_type: form.property_type, limit: 5 }),
      }).then((r) => r.json()).then((d) => {
        if (d.comparables) setComparables(d.comparables.slice(0, 5));
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="valorar" className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed transition-all duration-700"
        style={{
          backgroundImage: "url('/dubai-valuation-bg.jpg')",
          filter: focused ? "blur(4px) scale(1.03)" : "blur(0px) scale(1)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-28 max-w-6xl mx-auto">
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Chapter III</span>
            <div className="w-12 h-px bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Valuation</span>
          </div>
          <h2 className="font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white max-w-4xl">
            Know the real value
            <br />
            <span className="italic font-extralight text-white/40">of your property.</span>
          </h2>
        </motion.div>

        {/* ── SPOTLIGHT: the address input is the protagonist ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative mx-auto max-w-3xl mb-20"
        >
          {/* Glow ring when focused */}
          <motion.div
            animate={{
              opacity: focused ? 1 : 0.3,
              scale: focused ? 1.02 : 1,
            }}
            transition={{ duration: 0.5 }}
            className="absolute -inset-4 rounded-full bg-gradient-to-r from-white/[0.05] via-white/[0.1] to-white/[0.05] blur-2xl pointer-events-none"
          />

          <div className={`relative flex items-center gap-5 px-8 py-6 border rounded-full bg-[#0a0a0f]/60 backdrop-blur-2xl transition-all duration-500 ${
            focused ? "border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.08)]" : "border-white/10"
          }`}>
            {/* Pulsing location pin */}
            <div className="relative flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-white/40"
              />
              <MapPin size={20} className="relative text-white/60" strokeWidth={1.5} />
            </div>

            <input
              ref={acRef}
              type="text"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Type a Dubai address to begin..."
              className="flex-1 bg-transparent text-[18px] md:text-[22px] text-white placeholder-white/25 outline-none font-['Fraunces'] font-light tracking-tight"
            />

            <AnimatePresence>
              {addressSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <Check size={14} className="text-white/80" strokeWidth={2} />
                </motion.div>
              )}
            </AnimatePresence>

            <kbd className="hidden md:flex px-2 py-1 rounded border border-white/10 text-[10px] font-mono tracking-wider text-white/30">
              &#x238B; ESC
            </kbd>
          </div>

          {addressText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4 font-mono text-[11px] text-white/30 tracking-wide"
            >
              {addressText}
            </motion.p>
          )}
        </motion.div>

        {/* ── Staggered fields (appear only after address selected) ── */}
        <AnimatePresence>
          {addressSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                {/* LEFT: Form fields — stagger reveal */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
                  }}
                  className="relative bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08] p-10 md:p-12 space-y-8"
                >
                  <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20" />

                  {/* Zone + Building */}
                  <motion.div variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }} className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Zone</label>
                      <select
                        value={form.zona}
                        onChange={(e) => setForm({ ...form, zona: e.target.value })}
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white focus:border-white/40 outline-none transition-all duration-500 appearance-none cursor-pointer"
                      >
                        {zones.map((z) => <option key={z} value={z} className="bg-[#111]">{z}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Building</label>
                      <input
                        type="text"
                        value={form.building_name || ""}
                        onChange={(e) => setForm({ ...form, building_name: e.target.value || null })}
                        placeholder="Optional"
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white placeholder-white/15 focus:border-white/40 outline-none transition-all duration-500"
                      />
                    </div>
                  </motion.div>

                  {/* Type */}
                  <motion.div variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }}>
                    <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-3 block">Type</label>
                    <div className="grid grid-cols-3 border border-white/[0.08] rounded-lg overflow-hidden">
                      {TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setForm({ ...form, property_type: t.value })}
                          className={`py-3 text-[12px] tracking-wide transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
                            form.property_type === t.value ? "bg-white text-[#0a0a0f]" : "text-white/30 hover:bg-white/[0.04] hover:text-white/60"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Rooms + Area + Year */}
                  <motion.div variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }} className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Rooms</label>
                      <select value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white focus:border-white/40 outline-none appearance-none cursor-pointer">
                        {ROOMS.map((r) => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Area m&sup2;</label>
                      <input type="number" value={form.area_m2} onChange={(e) => setForm({ ...form, area_m2: Number(e.target.value) })}
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono focus:border-white/40 outline-none" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Year</label>
                      <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono focus:border-white/40 outline-none" />
                    </div>
                  </motion.div>

                  {/* Animated switches */}
                  <motion.div variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }} className="space-y-4 pt-2">
                    <AnimatedToggle on={form.is_freehold} onChange={() => setForm({ ...form, is_freehold: !form.is_freehold })} labelOn="Freehold" labelOff="Leasehold" />
                    <AnimatedToggle on={!form.is_offplan} onChange={() => setForm({ ...form, is_offplan: !form.is_offplan })} labelOn="Ready" labelOff="Off-Plan" />
                    <AnimatedToggle on={form.has_parking} onChange={() => setForm({ ...form, has_parking: !form.has_parking })} labelOn="Parking Included" labelOff="No Parking" />
                  </motion.div>

                  {/* Submit */}
                  <motion.button
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                    onClick={submit}
                    disabled={loading}
                    className="group relative w-full py-5 bg-white text-[#0a0a0f] text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-white/90 disabled:opacity-40 transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-4 h-4 border border-[#0a0a0f] border-t-transparent rounded-full" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          Request Valuation
                          <span className="transition-transform duration-500 group-hover:translate-x-1.5">&rarr;</span>
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.div>

                {/* RIGHT: Result */}
                <div className="relative">
                  {error && (
                    <div className="w-full border-l-2 border-red-500/50 pl-4 py-2">
                      <p className="font-mono text-[12px] text-red-400">{error}</p>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {result && (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-10"
                      >
                        {/* Big number with slot-machine effect */}
                        <div>
                          <div className="flex items-center gap-3 mb-5">
                            <p className="font-['Fraunces'] italic text-[13px] font-light text-white/40">Result</p>
                            <div className="flex-1 h-px bg-white/[0.08]" />
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30">Estimated Value</p>
                          </div>
                          <p className="font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-extralight leading-[0.9] tracking-[-0.03em] text-white tabular-nums">
                            <span className="font-mono font-light text-white/25 text-[0.3em] mr-3 align-top mt-6 inline-block">AED</span>
                            <CountUp
                              start={0}
                              end={result.predicted_aed}
                              duration={2.4}
                              separator=","
                              useEasing
                            />
                          </p>
                          <p className="font-mono text-[13px] text-white/20 mt-4 tracking-wider">
                            USD <CountUp start={0} end={result.predicted_usd} duration={2.2} separator="," />
                          </p>
                        </div>

                        {/* Price gauge */}
                        <div>
                          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2">
                            Confidence Range &plusmn;12.7%
                          </p>
                          <PriceGauge value={result.predicted_aed} low={result.confidence_low_aed} high={result.confidence_high_aed} />
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2">Per sqft</p>
                            <p className="font-['Fraunces'] text-[28px] font-extralight text-white">
                              <span className="text-white/25 text-[0.6em] mr-1">AED</span>
                              <CountUp start={0} end={result.predicted_per_sqft_aed} duration={2} separator="," />
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2">Per m&sup2;</p>
                            <p className="font-['Fraunces'] text-[28px] font-extralight text-white">
                              <span className="text-white/25 text-[0.6em] mr-1">AED</span>
                              <CountUp start={0} end={Math.round(result.predicted_aed / result.area_m2)} duration={2} separator="," />
                            </p>
                          </div>
                        </div>

                        {/* Comparables */}
                        {comparables.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1 }}
                            className="border-t border-white/[0.06] pt-6"
                          >
                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-4">
                              Recent Comparables
                            </p>
                            <div className="space-y-2">
                              {comparables.map((c, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 1.1 + i * 0.05 }}
                                  className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0 text-[12px]"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white/50 truncate">{c.building}</p>
                                    <p className="text-white/20 text-[10px] font-mono">{c.date} &middot; {c.rooms} &middot; {c.area_m2}m&sup2;</p>
                                  </div>
                                  <p className="font-mono text-white/70 ml-4 shrink-0">
                                    AED {fmt(c.price_aed)}
                                  </p>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!result && !error && !loading && (
                    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <p className="font-['Fraunces'] italic text-white/15 text-[20px] font-light max-w-[280px] mx-auto leading-[1.4]">
                          Complete the form to receive an estimated value.
                        </p>
                        <div className="w-8 h-px bg-white/10 mx-auto" />
                        <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/15">Awaiting input</p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="space-y-6">
                      <div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse" />
                      <div className="h-16 w-full bg-white/[0.05] rounded animate-pulse" />
                      <div className="h-3 w-full bg-white/[0.05] rounded animate-pulse" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-white/[0.05] rounded animate-pulse" />
                        <div className="h-20 bg-white/[0.05] rounded animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editorial footer strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-24 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-white/[0.04]"
        >
          <p className="font-['Fraunces'] italic font-light text-white/30 text-[13px]">
            Trained on 234,079 verified DLD transactions &mdash; updated daily.
          </p>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/25">
            R&sup2; 0.889 &middot; MAPE 12.7% &middot; 81.6% Within 20%
          </p>
        </motion.div>
      </div>
    </section>
  );
}
