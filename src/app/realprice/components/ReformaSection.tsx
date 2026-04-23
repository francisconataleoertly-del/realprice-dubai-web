"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Info, Loader2 } from "lucide-react";

const API = "/api/fonatprop";

type Level = "basic" | "mid" | "premium" | "luxury";
const LEVELS: Level[] = ["basic", "mid", "premium", "luxury"];
const LEVEL_LABELS: Record<Level, string> = { basic: "Basic", mid: "Mid", premium: "Premium", luxury: "Luxury" };

const CATEGORY_META: Record<string, { label: string; unit: "per_unit" | "per_m2" | "fixed"; image: string; caption: string }> = {
  kitchen: { label: "Kitchen", unit: "fixed", image: "/renovation/kitchen.jpg", caption: "Cabinets, counters, appliances & finishes" },
  bathroom: { label: "Bathroom (per unit)", unit: "per_unit", image: "/renovation/bathroom.jpg", caption: "Tiles, fixtures, sanitaryware & showers" },
  flooring_m2: { label: "Flooring", unit: "per_m2", image: "/renovation/flooring.jpg", caption: "Wood, porcelain, marble & parquet" },
  painting_m2: { label: "Paint & Walls", unit: "per_m2", image: "/renovation/painting.jpg", caption: "Paint, wallpaper, plaster & panels" },
  ac: { label: "AC System", unit: "fixed", image: "/renovation/ac.jpg", caption: "Split units, ducted systems & VRF" },
  electrical: { label: "Electrical", unit: "fixed", image: "/renovation/electrical.jpg", caption: "Panels, switches, lighting & smart systems" },
  plumbing: { label: "Plumbing", unit: "fixed", image: "/renovation/plumbing.jpg", caption: "Pipes, taps, water heaters & filters" },
  windows: { label: "Windows & Doors", unit: "fixed", image: "/renovation/windows.jpg", caption: "Glass, frames, doors & hardware" },
  wardrobes: { label: "Wardrobes", unit: "fixed", image: "/renovation/wardrobes.jpg", caption: "Closets, walk-ins, built-ins & storage" },
  balcony: { label: "Balcony / Terrace", unit: "fixed", image: "/renovation/balcony.jpg", caption: "Decking, furniture & outdoor finishes" },
};

interface RenovationData {
  types: Record<string, { min: number; max: number; val: number }>;
  categories: Record<string, Record<Level, [number, number]>>;
  permits: { municipality: [number, number]; noc: [number, number]; consultant_pct: number; contingency_pct: number };
  timelines: Record<string, string>;
}

interface EstimateResponse {
  area_m2: number;
  tier: string;
  breakdown: Array<{ category: string; cost_min: number; cost_max: number }>;
  subtotal_min: number;
  subtotal_max: number;
  permits: number;
  consultant: number;
  contingency: number;
  grand_total_min: number;
  grand_total_max: number;
  value_increase_pct: number;
  timelines?: Record<string, string>;
}

const fmt = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

export default function ReformaSection() {
  const [data, setData] = useState<RenovationData | null>(null);
  const [tier, setTier] = useState<string>("mid");
  const [area, setArea] = useState(85);
  const [bedrooms, setBedrooms] = useState(1);
  const [propertyValue, setPropertyValue] = useState(1500000);
  const [selected, setSelected] = useState<string[]>(["kitchen", "bathroom", "flooring_m2", "painting_m2"]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load /renovation catalog
  useEffect(() => {
    fetch(`${API}/renovation`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.types && d?.categories && d?.permits && d?.timelines) {
          setData(d);
        } else {
          setData(null);
        }
      })
      .catch(() => {});
  }, []);

  const tierData = data?.types[tier];

  const toggleCategory = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  // Auto-recalc (debounced)
  useEffect(() => {
    if (!data || selected.length === 0) { setEstimate(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          area_m2: String(area),
          tier,
          categories: selected.join(","),
        });
        const r = await fetch(`${API}/renovation/estimate?${params}`, { method: "POST" });
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `Error ${r.status}`); }
        setEstimate(await r.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [tier, area, selected, data]);

  const roi = useMemo(() => {
    if (!estimate) return null;
    const cost = (estimate.grand_total_min + estimate.grand_total_max) / 2;
    const valAfter = propertyValue * (1 + estimate.value_increase_pct / 100);
    const netGain = valAfter - propertyValue - cost;
    const roiPct = cost > 0 ? (netGain / cost) * 100 : 0;
    return { cost, valAfter, netGain, roiPct };
  }, [estimate, propertyValue]);

  const timeline = useMemo(() => {
    if (!data) return "-";
    const size = bedrooms === 0 ? "studio" : bedrooms >= 4 ? "villa" : `${bedrooms}br`;
    return data.timelines[`${size}_${tier}`] || "TBD";
  }, [data, tier, bedrooms]);

  return (
    <section id="reforma" className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dubai-construction-bg.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

      <div className="relative z-10 px-4 md:px-8 lg:px-16 py-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <span className="font-mono text-[11px] tracking-[0.3em] text-[#3b82f6]/70">05</span>
          <div className="w-12 h-px bg-[#3b82f6]/30" />
          <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/20">Renovation</span>
        </div>

        <h2 className="text-[clamp(2.2rem,5vw,4.5rem)] font-extralight leading-[0.95] tracking-[-0.03em] text-white mb-4 max-w-3xl">
          Estimate your
          <br />
          <span className="bg-gradient-to-r from-white/40 to-white/15 bg-clip-text text-transparent">renovation costs</span>
        </h2>
        <p className="text-white/30 text-[15px] mb-12 max-w-xl">Live rates via FonatProp API. Select categories &mdash; estimate updates instantly.</p>

        {!data ? (
          <div className="flex items-center gap-3 text-white/30">
            <Loader2 size={16} className="animate-spin" />
            <span className="font-mono text-[11px]">Loading catalog...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* ── LEFT: Inputs ── */}
            <div className="space-y-6">
              {/* Tier bento grid */}
              <div>
                <label className="block text-xs font-mono tracking-[0.25em] uppercase text-white/30 mb-3">Renovation Tier</label>
                <div className="grid grid-cols-4 border border-white/[0.06] rounded-lg overflow-hidden">
                  {Object.entries(data.types).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setTier(key)}
                      className={`py-3 text-center transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
                        tier === key ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <p className={`text-[12px] uppercase tracking-wider ${tier === key ? "text-white" : "text-white/30"}`}>
                        {key}
                      </p>
                      <p className="text-[9px] font-mono text-white/20 mt-0.5">{fmt(t.min)}-{fmt(t.max)}</p>
                      <p className={`text-[10px] font-mono mt-0.5 ${tier === key ? "text-[#3b82f6]" : "text-white/20"}`}>+{t.val}%</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono tracking-[0.25em] uppercase text-white/30 mb-2">Area m&sup2;</label>
                  <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/10 pb-2.5 text-[15px] text-white font-mono focus:border-[#3b82f6] focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-mono tracking-[0.25em] uppercase text-white/30 mb-2">Bedrooms</label>
                  <input type="number" min={0} max={8} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/10 pb-2.5 text-[15px] text-white font-mono focus:border-[#3b82f6] focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-mono tracking-[0.25em] uppercase text-white/30 mb-2">Value AED</label>
                  <input type="number" value={propertyValue} onChange={(e) => setPropertyValue(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/10 pb-2.5 text-[15px] text-white font-mono focus:border-[#3b82f6] focus:outline-none transition" />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-mono tracking-[0.25em] uppercase text-white/30 mb-3">
                  Scope &mdash; {selected.length} selected
                </label>
                <div className="space-y-1.5">
                  {Object.entries(data.categories).map(([key, levels]) => {
                    const meta = CATEGORY_META[key] || { label: key, unit: "fixed" as const };
                    const isSelected = selected.includes(key);
                    const isExpanded = expanded === key;
                    const range = levels[tier as Level] || levels.mid;
                    return (
                      <div key={key} className={`rounded-lg border transition-all ${isSelected ? "border-[#3b82f6]/30 bg-[#3b82f6]/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <button onClick={() => toggleCategory(key)}
                            className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/15 hover:border-white/30"}`}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </button>
                          <button onClick={() => toggleCategory(key)} className={`text-[13px] flex-1 text-left ${isSelected ? "text-white" : "text-white/40"}`}>
                            {meta.label}
                          </button>
                          <span className="font-mono text-[10px] text-white/25">
                            {fmt(range[0])}-{fmt(range[1])}
                            {meta.unit === "per_m2" ? "/m\u00B2" : meta.unit === "per_unit" ? "/unit" : ""}
                          </span>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : key)}
                            className="p-1 hover:bg-white/5 rounded"
                          >
                            <ChevronDown size={14} className={`text-white/20 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="px-4 pb-4 space-y-3"
                          >
                            {/* Material preview image */}
                            <div className="relative overflow-hidden rounded border border-white/[0.08] h-32 group/img">
                              <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/img:scale-105"
                                style={{ backgroundImage: `url(${meta.image})` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />
                              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                                <div>
                                  <p className="font-['Fraunces'] italic text-[11px] font-light text-white/60">Material reference</p>
                                  <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/40 mt-0.5">
                                    {meta.caption}
                                  </p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                              </div>
                            </div>

                            {/* Level cards */}
                            <div className="grid grid-cols-4 gap-1.5">
                              {LEVELS.map((lvl) => {
                                const [lo, hi] = levels[lvl];
                                return (
                                  <div key={lvl} className={`p-2 rounded text-center ${tier === lvl ? "bg-[#3b82f6]/10 border border-[#3b82f6]/30" : "bg-white/[0.02]"}`}>
                                    <p className={`text-[10px] uppercase tracking-wider ${tier === lvl ? "text-[#3b82f6]" : "text-white/30"}`}>{LEVEL_LABELS[lvl]}</p>
                                    <p className="font-mono text-[9px] text-white/40 mt-1">{fmt(lo)}-{fmt(hi)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Results ── */}
            <div className="space-y-4">
              {error && (
                <div className="border-l-2 border-red-500/50 pl-4 py-2 text-red-400 text-sm font-mono">{error}</div>
              )}

              {/* Total cost */}
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2">Total Cost Range</p>
                    {loading ? (
                      <Loader2 size={28} className="animate-spin text-[#3b82f6]/50" />
                    ) : estimate ? (
                      <>
                        <p className="text-[clamp(1.8rem,3vw,2.5rem)] font-extralight leading-none text-white font-mono">
                          AED {fmt(estimate.grand_total_min)}
                        </p>
                        <p className="text-[13px] text-white/40 mt-2 font-mono">to AED {fmt(estimate.grand_total_max)}</p>
                      </>
                    ) : (
                      <p className="text-white/20 text-sm">Select categories to estimate</p>
                    )}
                  </div>
                  {tierData && (
                    <div className="text-right">
                      <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-1">+value</p>
                      <p className="text-2xl font-mono text-green-400">+{tierData.val}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Breakdown */}
              {estimate && estimate.breakdown.length > 0 && (
                <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5">
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-3">Breakdown</p>
                  <div className="space-y-1.5">
                    {estimate.breakdown.map((b) => {
                      const meta = CATEGORY_META[b.category] || { label: b.category };
                      return (
                        <div key={b.category} className="flex justify-between items-center text-[12px]">
                          <span className="text-white/50">{meta.label}</span>
                          <span className="font-mono text-white/70">AED {fmt(b.cost_min)} &ndash; {fmt(b.cost_max)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-white/[0.06] pt-2 mt-2 flex justify-between items-center text-[12px]">
                      <span className="text-white/60">Subtotal</span>
                      <span className="font-mono text-white">AED {fmt(estimate.subtotal_min)} &ndash; {fmt(estimate.subtotal_max)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Permits & fees */}
              {estimate && (
                <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5">
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-3">Permits & Fees</p>
                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-white/40">Municipality + NOC</span>
                      <span className="font-mono text-white">AED {fmt(estimate.permits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Consultant (10%)</span>
                      <span className="font-mono text-white">AED {fmt(estimate.consultant)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Contingency (15%)</span>
                      <span className="font-mono text-amber-400">AED {fmt(estimate.contingency)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ROI */}
              {roi && estimate && (
                <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5">
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-3">Investment Return</p>
                  <div className="space-y-1.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-white/40">Before</span>
                      <span className="font-mono text-white">AED {fmt(propertyValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">After (+{estimate.value_increase_pct}%)</span>
                      <span className="font-mono text-green-400">AED {fmt(roi.valAfter)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Avg renovation cost</span>
                      <span className="font-mono text-amber-400">- AED {fmt(roi.cost)}</span>
                    </div>
                    <div className="border-t border-white/[0.06] pt-2 mt-1 flex justify-between font-medium">
                      <span className="text-white/60">Net Gain</span>
                      <span className={`font-mono ${roi.netGain >= 0 ? "text-green-400" : "text-red-400"}`}>AED {fmt(roi.netGain)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">ROI</span>
                      <span className={`font-mono text-lg ${roi.roiPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {roi.roiPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline + per m2 */}
              {estimate && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-4">
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-1">Timeline</p>
                    <p className="text-[14px] text-white font-mono">{timeline}</p>
                  </div>
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-4">
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-1">Avg / m&sup2;</p>
                    <p className="text-[14px] text-white font-mono">
                      AED {fmt((estimate.grand_total_min + estimate.grand_total_max) / 2 / area)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded border border-white/[0.04]">
                <Info size={12} className="text-white/20 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/20 leading-relaxed">
                  Live estimates from FonatProp API. Permits required for structural changes. Get 3+ licensed contractor quotes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
