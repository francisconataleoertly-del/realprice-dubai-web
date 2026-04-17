"use client";

import { useState, useMemo } from "react";
import { Check, ChevronDown, Info } from "lucide-react";

// ── Renovation types ────────────────────────────────────────────
const RENO_TYPES = [
  { key: "refresh", label: "Refresh", desc: "Paint, clean, minor fixes", range: [200, 750], value_pct: 5, color: "#10b981" },
  { key: "standard", label: "Standard", desc: "Mid-range materials, partial upgrade", range: [750, 1500], value_pct: 12, color: "#3b82f6" },
  { key: "complete", label: "Complete", desc: "Full remodel, quality materials", range: [1500, 2500], value_pct: 20, color: "#f59e0b" },
  { key: "luxury", label: "Luxury", desc: "Premium everything, designer finishes", range: [2500, 5000], value_pct: 30, color: "#ef4444" },
] as const;

type Level = "basic" | "mid" | "premium" | "luxury";
const LEVELS: Level[] = ["basic", "mid", "premium", "luxury"];
const LEVEL_LABELS: Record<Level, string> = { basic: "Basic", mid: "Mid-Range", premium: "Premium", luxury: "Luxury" };

// ── Categories with 4 levels each ───────────────────────────────
interface CatLevel {
  materials: string;
  cost_low: number;
  cost_high: number;
  unit: string; // "fixed" | "per_m2" | "per_unit"
}

interface Category {
  key: string;
  label: string;
  emoji: string;
  levels: Record<Level, CatLevel>;
}

const CATEGORIES: Category[] = [
  {
    key: "kitchen", label: "Kitchen", emoji: "\uD83C\uDF73",
    levels: {
      basic: { materials: "Laminate cabinets, basic appliances", cost_low: 15000, cost_high: 35000, unit: "fixed" },
      mid: { materials: "Wood veneer, mid-range appliances, quartz counters", cost_low: 35000, cost_high: 80000, unit: "fixed" },
      premium: { materials: "Solid wood, premium appliances, natural stone", cost_low: 80000, cost_high: 150000, unit: "fixed" },
      luxury: { materials: "Custom Italian, Gaggenau/Miele, marble island", cost_low: 150000, cost_high: 250000, unit: "fixed" },
    },
  },
  {
    key: "bathroom", label: "Bathroom (per unit)", emoji: "\uD83D\uDEBF",
    levels: {
      basic: { materials: "Standard tiles, basic fixtures", cost_low: 8000, cost_high: 18000, unit: "per_unit" },
      mid: { materials: "Porcelain tiles, Grohe fixtures, glass shower", cost_low: 18000, cost_high: 45000, unit: "per_unit" },
      premium: { materials: "Large format tiles, rain shower, freestanding tub", cost_low: 45000, cost_high: 90000, unit: "per_unit" },
      luxury: { materials: "Natural stone, Hansgrohe Axor, heated floors", cost_low: 90000, cost_high: 150000, unit: "per_unit" },
    },
  },
  {
    key: "flooring", label: "Flooring", emoji: "\uD83E\uDDF1",
    levels: {
      basic: { materials: "Vinyl planks, laminate", cost_low: 45, cost_high: 120, unit: "per_m2" },
      mid: { materials: "Engineered wood, quality porcelain", cost_low: 120, cost_high: 300, unit: "per_m2" },
      premium: { materials: "Hardwood, large format marble-look", cost_low: 300, cost_high: 550, unit: "per_m2" },
      luxury: { materials: "Italian marble, custom parquet, terrazzo", cost_low: 550, cost_high: 800, unit: "per_m2" },
    },
  },
  {
    key: "painting", label: "Paint & Walls", emoji: "\uD83C\uDFA8",
    levels: {
      basic: { materials: "Standard emulsion, basic prep", cost_low: 15, cost_high: 35, unit: "per_m2" },
      mid: { materials: "Premium paint, accent walls, wallpaper", cost_low: 35, cost_high: 80, unit: "per_m2" },
      premium: { materials: "Specialty finishes, feature walls, paneling", cost_low: 80, cost_high: 140, unit: "per_m2" },
      luxury: { materials: "Venetian plaster, bespoke wallcoverings, 3D panels", cost_low: 140, cost_high: 200, unit: "per_m2" },
    },
  },
  {
    key: "ac", label: "AC System", emoji: "\u2744\uFE0F",
    levels: {
      basic: { materials: "Service & clean existing units", cost_low: 3000, cost_high: 8000, unit: "fixed" },
      mid: { materials: "Replace split units, smart thermostat", cost_low: 8000, cost_high: 25000, unit: "fixed" },
      premium: { materials: "Ducted system upgrade, zone control", cost_low: 25000, cost_high: 50000, unit: "fixed" },
      luxury: { materials: "Full VRF system, smart home integration", cost_low: 50000, cost_high: 80000, unit: "fixed" },
    },
  },
  {
    key: "electrical", label: "Electrical", emoji: "\u26A1",
    levels: {
      basic: { materials: "Replace switches, add outlets", cost_low: 3000, cost_high: 10000, unit: "fixed" },
      mid: { materials: "LED throughout, new panel, USB outlets", cost_low: 10000, cost_high: 30000, unit: "fixed" },
      premium: { materials: "Smart lighting system, automation", cost_low: 30000, cost_high: 60000, unit: "fixed" },
      luxury: { materials: "Full Lutron/Crestron, home cinema wiring", cost_low: 60000, cost_high: 100000, unit: "fixed" },
    },
  },
  {
    key: "plumbing", label: "Plumbing", emoji: "\uD83D\uDEB0",
    levels: {
      basic: { materials: "Fix leaks, replace taps", cost_low: 2000, cost_high: 8000, unit: "fixed" },
      mid: { materials: "New fixtures, water heater, filtration", cost_low: 8000, cost_high: 25000, unit: "fixed" },
      premium: { materials: "Reroute pipes, premium fixtures", cost_low: 25000, cost_high: 45000, unit: "fixed" },
      luxury: { materials: "Complete replumb, instant hot water, whole-home filter", cost_low: 45000, cost_high: 70000, unit: "fixed" },
    },
  },
  {
    key: "windows", label: "Windows & Doors", emoji: "\uD83E\uDE9F",
    levels: {
      basic: { materials: "Re-seal, new handles, minor repairs", cost_low: 3000, cost_high: 12000, unit: "fixed" },
      mid: { materials: "Replace internal doors, blinds", cost_low: 12000, cost_high: 40000, unit: "fixed" },
      premium: { materials: "Double glazing upgrade, custom doors", cost_low: 40000, cost_high: 75000, unit: "fixed" },
      luxury: { materials: "Floor-to-ceiling glass, motorized blinds, pivot doors", cost_low: 75000, cost_high: 120000, unit: "fixed" },
    },
  },
  {
    key: "wardrobes", label: "Wardrobes", emoji: "\uD83D\uDC54",
    levels: {
      basic: { materials: "Laminate closets, basic hardware", cost_low: 4000, cost_high: 15000, unit: "fixed" },
      mid: { materials: "Walk-in closet, soft close, LED interior", cost_low: 15000, cost_high: 40000, unit: "fixed" },
      premium: { materials: "Custom built-in, glass doors, lighting", cost_low: 40000, cost_high: 70000, unit: "fixed" },
      luxury: { materials: "Italian design, leather inserts, automated", cost_low: 70000, cost_high: 100000, unit: "fixed" },
    },
  },
  {
    key: "balcony", label: "Balcony / Terrace", emoji: "\uD83C\uDF05",
    levels: {
      basic: { materials: "Clean, repaint railing, basic plants", cost_low: 2000, cost_high: 8000, unit: "fixed" },
      mid: { materials: "Decking, outdoor furniture, planters", cost_low: 8000, cost_high: 25000, unit: "fixed" },
      premium: { materials: "Premium decking, pergola, built-in seating", cost_low: 25000, cost_high: 50000, unit: "fixed" },
      luxury: { materials: "Outdoor kitchen, infinity edge, landscaping", cost_low: 50000, cost_high: 80000, unit: "fixed" },
    },
  },
];

// ── Timelines ───────────────────────────────────────────────────
const TIMELINES: Record<string, string> = {
  "refresh_studio": "1-2 weeks", "refresh_1br": "1-2 weeks", "refresh_2br": "2-3 weeks", "refresh_3br": "2-3 weeks",
  "standard_studio": "3-4 weeks", "standard_1br": "4-6 weeks", "standard_2br": "6-8 weeks", "standard_3br": "8-10 weeks",
  "complete_studio": "4-6 weeks", "complete_1br": "6-8 weeks", "complete_2br": "8-12 weeks", "complete_3br": "10-14 weeks",
  "luxury_studio": "6-8 weeks", "luxury_1br": "8-12 weeks", "luxury_2br": "12-16 weeks", "luxury_3br": "16-24 weeks",
};

const fmt = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

export default function ReformaSection() {
  const [renoType, setRenoType] = useState<string>("standard");
  const [area, setArea] = useState(85);
  const [bathrooms, setBathrooms] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [propertyValue, setPropertyValue] = useState(1500000);
  const [selected, setSelected] = useState<Record<string, Level>>({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const toggleCategory = (key: string, level: Level) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key] === level) delete next[key];
      else next[key] = level;
      return next;
    });
  };

  const calc = useMemo(() => {
    const type = RENO_TYPES.find((t) => t.key === renoType)!;

    // Base cost from renovation type
    const basePerM2 = (type.range[0] + type.range[1]) / 2;
    let baseCost = basePerM2 * area;

    // Add individual category costs
    let categoryTotal = 0;
    const breakdown: Array<{ label: string; cost: number }> = [];

    for (const [catKey, level] of Object.entries(selected)) {
      const cat = CATEGORIES.find((c) => c.key === catKey);
      if (!cat) continue;
      const lvl = cat.levels[level];
      let cost = 0;
      if (lvl.unit === "per_m2") {
        cost = ((lvl.cost_low + lvl.cost_high) / 2) * area;
      } else if (lvl.unit === "per_unit" && catKey === "bathroom") {
        cost = ((lvl.cost_low + lvl.cost_high) / 2) * bathrooms;
      } else {
        cost = (lvl.cost_low + lvl.cost_high) / 2;
      }
      categoryTotal += cost;
      breakdown.push({ label: `${cat.emoji} ${cat.label} (${LEVEL_LABELS[level]})`, cost });
    }

    // If no categories selected, use base cost; otherwise use category total
    const renovationCost = Object.keys(selected).length > 0 ? categoryTotal : baseCost;

    // Permits & fees
    const municipalityPermit = renovationCost > 100000 ? 5000 : renovationCost > 50000 ? 3000 : 1000;
    const nocDeveloper = 1500;
    const consultantFee = renovationCost * 0.10;
    const contingency = renovationCost * 0.15;
    const totalCost = renovationCost + municipalityPermit + nocDeveloper + consultantFee + contingency;

    // ROI
    const valueBefore = propertyValue;
    const valueAfter = valueBefore * (1 + type.value_pct / 100);
    const netGain = valueAfter - valueBefore - totalCost;
    const roi = totalCost > 0 ? (netGain / totalCost) * 100 : 0;

    // Timeline
    const sizeKey = bedrooms === 0 ? "studio" : bedrooms >= 3 ? "3br" : `${bedrooms}br`;
    const timeline = TIMELINES[`${renoType}_${sizeKey}`] || "TBD";

    return { type, renovationCost, breakdown, municipalityPermit, nocDeveloper, consultantFee, contingency, totalCost, valueBefore, valueAfter, netGain, roi, timeline, basePerM2 };
  }, [renoType, area, bathrooms, bedrooms, propertyValue, selected]);

  return (
    <section id="reforma" className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dubai-construction-bg.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

      <div className="relative z-10 px-4 md:px-8 lg:px-16 py-28">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
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
        <p className="text-white/30 text-[15px] mb-12 max-w-xl">Real Dubai contractor rates. Select categories and levels for a detailed breakdown.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── LEFT: Inputs ── */}
          <div className="space-y-6">
            {/* Renovation type */}
            <div>
              <label className="block text-xs text-white/40 tracking-wider uppercase mb-3">Renovation Type</label>
              <div className="grid grid-cols-2 gap-3">
                {RENO_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setRenoType(t.key)}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                      renoType === t.key ? `border-[${t.color}] bg-[${t.color}]/5` : "border-white/5 bg-white/[0.03] backdrop-blur-sm hover:border-white/10"
                    }`}
                    style={renoType === t.key ? { borderColor: t.color, backgroundColor: t.color + "10" } : {}}
                  >
                    <p className={`text-sm font-medium ${renoType === t.key ? "text-white" : "text-white/60"}`}>{t.label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{t.desc}</p>
                    <p className="text-[10px] text-white/20 mt-1 font-mono">{fmt(t.range[0])}-{fmt(t.range[1])} AED/m&sup2;</p>
                    <p className="text-[10px] mt-0.5 font-mono" style={{ color: t.color }}>+{t.value_pct}% value</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Area, bedrooms, bathrooms */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Area m&sup2;</label>
                <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Bedrooms</label>
                <input type="number" min={0} max={8} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Bathrooms</label>
                <input type="number" min={1} max={8} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
              </div>
            </div>

            {/* Property value */}
            <div>
              <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Current Property Value (AED)</label>
              <input type="number" value={propertyValue} onChange={(e) => setPropertyValue(Number(e.target.value))}
                className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-xs text-white/40 tracking-wider uppercase mb-3">Scope of Work — select categories & levels</label>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = cat.key in selected;
                  const isExpanded = expandedCat === cat.key;
                  return (
                    <div key={cat.key} className={`rounded-lg border transition-all ${isSelected ? "border-[#3b82f6]/30 bg-[#3b82f6]/5" : "border-white/5 bg-white/[0.03] backdrop-blur-sm"}`}>
                      {/* Category header */}
                      <button
                        onClick={() => setExpandedCat(isExpanded ? null : cat.key)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        <span className={`text-sm flex-1 ${isSelected ? "text-white" : "text-white/50"}`}>
                          {cat.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] font-mono">
                            {LEVEL_LABELS[selected[cat.key]]}
                          </span>
                        )}
                        <ChevronDown size={14} className={`text-white/20 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Expanded: show 4 levels */}
                      {isExpanded && (
                        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                          {LEVELS.map((level) => {
                            const lvl = cat.levels[level];
                            const active = selected[cat.key] === level;
                            return (
                              <button
                                key={level}
                                onClick={() => toggleCategory(cat.key, level)}
                                className={`p-3 rounded border text-left transition-all text-xs ${
                                  active
                                    ? "border-[#3b82f6] bg-[#3b82f6]/10"
                                    : "border-white/5 hover:border-white/10"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={active ? "text-[#3b82f6] font-medium" : "text-white/60"}>
                                    {LEVEL_LABELS[level]}
                                  </span>
                                  {active && <Check size={12} className="text-[#3b82f6]" />}
                                </div>
                                <p className="text-[10px] text-white/25 mb-1">{lvl.materials}</p>
                                <p className="text-white/40 font-mono">
                                  {lvl.unit === "per_m2"
                                    ? `${fmt(lvl.cost_low)}-${fmt(lvl.cost_high)} AED/m\u00B2`
                                    : `${fmt(lvl.cost_low)}-${fmt(lvl.cost_high)} AED`}
                                  {lvl.unit === "per_unit" ? " /unit" : ""}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4">
            {/* Total cost */}
            <div className="p-6 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <p className="text-xs text-white/30 tracking-wider uppercase mb-1">Total Renovation Cost</p>
              <p className="text-3xl font-light text-white font-mono">AED {fmt(calc.totalCost)}</p>
              <p className="text-xs text-white/20 mt-1">
                {Object.keys(selected).length > 0
                  ? `${Object.keys(selected).length} categories selected`
                  : `Base estimate: ${fmt(calc.basePerM2)} AED/m\u00B2 \u00D7 ${area}m\u00B2`}
              </p>
            </div>

            {/* Breakdown */}
            {calc.breakdown.length > 0 && (
              <div className="p-5 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                <p className="text-xs text-white/30 tracking-wider uppercase mb-3">Cost Breakdown</p>
                <div className="space-y-2 text-xs">
                  {calc.breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-white/50">{b.label}</span>
                      <span className="text-white font-mono">AED {fmt(b.cost)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/5 pt-2 mt-2 flex justify-between">
                    <span className="text-white/50">Subtotal</span>
                    <span className="text-white font-mono">AED {fmt(calc.renovationCost)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fees & permits */}
            <div className="p-5 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <p className="text-xs text-white/30 tracking-wider uppercase mb-3">Permits & Fees</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Municipality Permit</span>
                  <span className="text-white font-mono">AED {fmt(calc.municipalityPermit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">NOC Developer</span>
                  <span className="text-white font-mono">AED {fmt(calc.nocDeveloper)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Consultant Fee (10%)</span>
                  <span className="text-white font-mono">AED {fmt(calc.consultantFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Contingency (15%)</span>
                  <span className="text-amber-400 font-mono">AED {fmt(calc.contingency)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between font-medium">
                  <span className="text-white/60">Total All-In</span>
                  <span className="text-white font-mono">AED {fmt(calc.totalCost)}</span>
                </div>
              </div>
            </div>

            {/* ROI */}
            <div className="p-5 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <p className="text-xs text-white/30 tracking-wider uppercase mb-3">Investment Return</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Value Before</span>
                  <span className="text-white font-mono">AED {fmt(calc.valueBefore)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Value After (+{calc.type.value_pct}%)</span>
                  <span className="text-green-400 font-mono">AED {fmt(calc.valueAfter)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Renovation Cost</span>
                  <span className="text-amber-400 font-mono">- AED {fmt(calc.totalCost)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between font-medium">
                  <span className="text-white/60">Net Gain</span>
                  <span className={`font-mono ${calc.netGain >= 0 ? "text-green-400" : "text-red-400"}`}>
                    AED {fmt(calc.netGain)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">ROI</span>
                  <span className={`font-mono text-lg ${calc.roi >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {calc.roi.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm flex justify-between items-center">
              <span className="text-xs text-white/30">Estimated Timeline</span>
              <span className="text-sm text-white font-medium">{calc.timeline}</span>
            </div>

            {/* Cost per m2 */}
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm flex justify-between items-center">
              <span className="text-xs text-white/30">Cost per m&sup2;</span>
              <span className="text-sm text-white font-mono">AED {fmt(calc.totalCost / area)}</span>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 rounded border border-white/5 bg-white/[0.03] backdrop-blur-sm">
              <Info size={14} className="text-white/20 mt-0.5 shrink-0" />
              <p className="text-[10px] text-white/20 leading-relaxed">
                Estimates based on Dubai contractor rates (2024-2025). Actual costs vary by building, access, and material availability.
                Permits required for structural changes. Get 3+ quotes from licensed contractors.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
