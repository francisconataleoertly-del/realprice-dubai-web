"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, TrendingUp as TrendUpIcon, TrendingDown } from "lucide-react";
import CountUp from "react-countup";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const API = "/api/fonatprop";

// Verdict calculator
function getVerdict(gy: number, cashFlow: number, appreciation: number) {
  const score = gy * 2 + (cashFlow > 0 ? 3 : -2) + appreciation * 0.5;
  if (score >= 15) return { label: "STRONG BUY", color: "#10b981", glow: "rgba(16,185,129,0.4)", desc: "Excellent investment fundamentals." };
  if (score >= 10) return { label: "BUY", color: "#3b82f6", glow: "rgba(59,130,246,0.4)", desc: "Solid opportunity — worth consideration." };
  if (score >= 6) return { label: "HOLD", color: "#f59e0b", glow: "rgba(245,158,11,0.4)", desc: "Average returns — evaluate alternatives." };
  return { label: "RISKY", color: "#ef4444", glow: "rgba(239,68,68,0.4)", desc: "Poor risk/reward — reconsider." };
}

const ROOMS = ["Studio", "1 B/R", "2 B/R", "3 B/R", "4 B/R", "5 B/R"];

interface InvestmentResult {
  property: { zona: string; estimated_value_aed: number };
  acquisition_costs: { purchase_price_aed: number; dld_fee_4pct_aed: number; agency_fee_2pct_aed: number; total_acquisition_aed: number };
  financing: { down_payment_aed: number; mortgage_amount_aed: number; monthly_payment_aed: number };
  rental_income: { annual_rent_aed: number; gross_yield_pct: number };
  cash_flow: { net_operating_income_aed: number; annual_cash_flow_aed: number; monthly_cash_flow_aed: number };
  projections: Array<{ year: number; property_value_aed: number; total_return_pct: number }>;
}

interface TrendZone { zone: string; cagr: number; }
interface TrendsData { total_zones: number; top_10: TrendZone[]; bottom_10: TrendZone[]; }
interface ZoneTrend { zone: string; resolved: string; cagr: number; yearly: Record<string, number>; }

export default function InversionSection() {
  const [zones, setZones] = useState<string[]>([]);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [zoneTrend, setZoneTrend] = useState<ZoneTrend | null>(null);
  const [form, setForm] = useState({
    zona: "Dubai Marina",
    rooms: "1 B/R",
    area_m2: 75,
    property_type: "Flat",
    is_freehold: true,
    is_offplan: false,
    has_parking: true,
    annual_appreciation_pct: 5,
    hold_years: 10,
    mortgage_pct: 75,
    mortgage_rate_pct: 4.5,
    mortgage_years: 25,
  });
  const [result, setResult] = useState<InvestmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/zones`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.zones)) setZones(d.zones.sort());
      })
      .catch(() => {});
    fetch(`${API}/trends`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.top_10) && Array.isArray(d?.bottom_10)) {
          setTrends(d);
        } else {
          setTrends(null);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch zone-specific trend when zone changes
  useEffect(() => {
    if (!form.zona) return;
    fetch(`${API}/trends/${encodeURIComponent(form.zona)}`)
      .then((r) => r.json())
      .then((d) => { if (d.yearly) setZoneTrend(d); })
      .catch(() => setZoneTrend(null));
  }, [form.zona]);

  const calculate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/investment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

  return (
    <section id="inversion" className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center md:bg-fixed" style={{ backgroundImage: "url('/dubai-beach-bg.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

      <div className="relative z-10 px-4 md:px-8 lg:px-16 py-28">
      <div className="max-w-6xl mx-auto">
        {/* Editorial section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Chapter IV</span>
            <div className="w-12 h-px bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Investment</span>
          </div>
          <h2 className="font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white max-w-4xl">
            Calculate your
            <br />
            <span className="italic font-extralight text-white/40">return on investment.</span>
          </h2>
          <p className="font-['Fraunces'] italic text-white/30 text-[14px] mt-6 max-w-xl">
            Acquisition costs, yields, and decade-long projections &mdash; ranked and scored by the model.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── INPUTS PANEL — editorial framed ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8 }}
            className="relative bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08] p-8 space-y-7"
          >
            {/* Corner frame marks */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20" />

            {/* Form header */}
            <div className="pb-2 border-b border-white/[0.04] mb-2">
              <p className="font-['Fraunces'] italic text-[13px] font-light text-white/40 mb-1">Calculator No. 001</p>
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/30">ROI Simulation</p>
            </div>

            {/* Zone */}
            <div>
              <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Zone</label>
              <div className="relative">
                <select value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })}
                  className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white focus:border-white/40 outline-none transition-all duration-500 appearance-none cursor-pointer pr-8">
                  {zones.map((z) => <option key={z} value={z} className="bg-[#111]">{z}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Rooms + Area */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Rooms</label>
                <div className="relative">
                  <select value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                    className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white focus:border-white/40 outline-none appearance-none cursor-pointer pr-6">
                    {ROOMS.map((r) => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1 text-white/30 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Area m&sup2;</label>
                <input type="number" value={form.area_m2} onChange={(e) => setForm({ ...form, area_m2: Number(e.target.value) })}
                  className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono focus:border-white/40 outline-none" />
              </div>
            </div>

            {/* ── VISUAL MORTGAGE SLIDER ── */}
            <div className="pt-2">
              <div className="flex items-baseline justify-between mb-3">
                <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35">Mortgage Financing</label>
                <motion.p
                  key={form.mortgage_pct}
                  initial={{ scale: 0.85, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-['Fraunces'] text-[28px] font-extralight text-white leading-none"
                >
                  {form.mortgage_pct}
                  <span className="text-[14px] text-white/40 ml-1">%</span>
                </motion.p>
              </div>

              {/* Custom track */}
              <div className="relative h-10 flex items-center">
                {/* Visual track */}
                <div className="absolute inset-x-0 h-[2px] bg-white/[0.06] rounded-full" />
                <motion.div
                  animate={{ width: `${(form.mortgage_pct / 80) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute left-0 h-[2px] rounded-full bg-gradient-to-r from-white/60 to-white/90"
                />
                {/* Tick marks */}
                <div className="absolute inset-x-0 flex justify-between">
                  {[0, 25, 50, 75].map((t) => (
                    <div
                      key={t}
                      className={`w-px h-2 transition-colors duration-300 ${form.mortgage_pct >= t ? "bg-white/40" : "bg-white/10"}`}
                    />
                  ))}
                </div>
                {/* Thumb */}
                <motion.div
                  animate={{ left: `${(form.mortgage_pct / 80) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute w-4 h-4 -translate-x-1/2 rounded-full bg-white border-2 border-[#0a0a0f] pointer-events-none"
                  style={{ boxShadow: "0 0 16px rgba(255,255,255,0.5)" }}
                />
                {/* Range input (transparent overlay) */}
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={form.mortgage_pct}
                  onChange={(e) => setForm({ ...form, mortgage_pct: Number(e.target.value) })}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between mt-1 font-mono text-[9px] text-white/20">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span className="text-white/40">MAX 80%</span>
              </div>
            </div>

            {/* Rate + Hold years */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Rate</label>
                <div className="flex items-baseline gap-1">
                  <input type="number" step={0.1} value={form.mortgage_rate_pct}
                    onChange={(e) => setForm({ ...form, mortgage_rate_pct: Number(e.target.value) })}
                    className="flex-1 bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono focus:border-white/40 outline-none" />
                  <span className="text-white/30 text-sm">%</span>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Hold</label>
                <div className="flex items-baseline gap-1">
                  <input type="number" value={form.hold_years}
                    onChange={(e) => setForm({ ...form, hold_years: Number(e.target.value) })}
                    className="flex-1 bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono focus:border-white/40 outline-none" />
                  <span className="text-white/30 text-sm">yrs</span>
                </div>
              </div>
            </div>

            {/* Appreciation */}
            <div>
              <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">Annual Appreciation</label>
              <div className="flex items-baseline gap-1">
                <input type="number" step={0.5} value={form.annual_appreciation_pct}
                  onChange={(e) => setForm({ ...form, annual_appreciation_pct: Number(e.target.value) })}
                  className="flex-1 bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono focus:border-white/40 outline-none" />
                <span className="text-white/30 text-sm">%/yr</span>
              </div>
            </div>

            {/* Submit — white premium */}
            <button
              onClick={calculate}
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
                    Run Simulation
                    <span className="transition-transform duration-500 group-hover:translate-x-1.5">&rarr;</span>
                  </>
                )}
              </span>
            </button>
          </motion.div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {error && <div className="p-4 rounded border border-red-500/20 bg-red-500/5 text-red-400 text-sm">{error}</div>}

            {result && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
                className="space-y-4"
              >
                {/* VERDICT BADGE — animated, glowing */}
                {(() => {
                  const verdict = getVerdict(
                    result.rental_income.gross_yield_pct,
                    result.cash_flow.monthly_cash_flow_aed,
                    form.annual_appreciation_pct
                  );
                  return (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, scale: 0.85 },
                        visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                      }}
                      className="relative overflow-hidden rounded-2xl border p-6 flex items-center justify-between gap-6"
                      style={{
                        borderColor: verdict.color + "30",
                        background: `linear-gradient(135deg, ${verdict.color}08 0%, transparent 60%)`,
                      }}
                    >
                      {/* Pulsing glow */}
                      <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -inset-12 rounded-full blur-3xl pointer-events-none"
                        style={{ background: verdict.glow }}
                      />
                      <div className="relative flex items-center gap-5">
                        <div className="flex flex-col items-center">
                          <motion.div
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                            className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                            style={{ borderColor: verdict.color, boxShadow: `0 0 30px ${verdict.glow}` }}
                          >
                            <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: verdict.color }} />
                          </motion.div>
                        </div>
                        <div>
                          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/40 mb-1">AI Verdict</p>
                          <p className="font-['Fraunces'] text-[28px] font-light tracking-tight" style={{ color: verdict.color }}>
                            {verdict.label}
                          </p>
                          <p className="text-[12px] text-white/50 mt-0.5">{verdict.desc}</p>
                        </div>
                      </div>
                      <div className="relative text-right hidden md:block">
                        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30 mb-1">Gross Yield</p>
                        <p className="font-['Fraunces'] text-[36px] font-extralight" style={{ color: verdict.color }}>
                          <CountUp end={result.rental_income.gross_yield_pct} decimals={1} duration={1.5} suffix="%" />
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Key metrics — stagger */}
                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  {[
                    { label: "Property Value", value: result.property.estimated_value_aed, color: "text-white", mono: true },
                    { label: "Gross Yield", value: result.rental_income.gross_yield_pct, color: "text-green-400", suffix: "%", decimals: 1 },
                    { label: "Annual Rent", value: result.rental_income.annual_rent_aed, color: "text-white", mono: true },
                    { label: "Cash Flow / mo", value: result.cash_flow.monthly_cash_flow_aed, color: result.cash_flow.monthly_cash_flow_aed >= 0 ? "text-green-400" : "text-red-400", mono: true },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                      }}
                      className="p-4 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm"
                    >
                      <p className="text-xs text-white/30 mb-1">{m.label}</p>
                      <p className={`text-lg font-mono ${m.color}`}>
                        <CountUp end={m.value} duration={1.6} separator="," decimals={m.decimals || 0} suffix={m.suffix || ""} />
                      </p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* --- hidden marker for original content below --- */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
                  className="hidden"
                >
                  <div className="p-4 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                    <p className="text-xs text-white/30 mb-1">Property Value</p>
                    <p className="text-lg font-mono text-white">{fmt(result.property.estimated_value_aed)}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                    <p className="text-xs text-white/30 mb-1">Gross Yield</p>
                    <p className="text-lg font-mono text-green-400">{result.rental_income.gross_yield_pct.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                    <p className="text-xs text-white/30 mb-1">Annual Rent</p>
                    <p className="text-lg font-mono text-white">{fmt(result.rental_income.annual_rent_aed)}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                    <p className="text-xs text-white/30 mb-1">Cash Flow/mo</p>
                    <p className={`text-lg font-mono ${result.cash_flow.monthly_cash_flow_aed >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {fmt(result.cash_flow.monthly_cash_flow_aed)}
                    </p>
                  </div>
                </motion.div>

                {/* Donut chart + costs side by side */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } } }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {/* Donut chart — cost breakdown */}
                  <div className="p-5 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                    <p className="text-xs text-white/30 tracking-wider uppercase mb-4">Cost Breakdown</p>
                    <div className="flex items-center">
                      <div className="w-[140px] h-[140px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Purchase", value: result.property.estimated_value_aed },
                                { name: "DLD 4%", value: result.acquisition_costs.dld_fee_4pct_aed },
                                { name: "Agency 2%", value: result.acquisition_costs.agency_fee_2pct_aed },
                                { name: "Other Fees", value: Math.max(0, result.acquisition_costs.total_acquisition_aed - result.property.estimated_value_aed - result.acquisition_costs.dld_fee_4pct_aed - result.acquisition_costs.agency_fee_2pct_aed) },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={38}
                              outerRadius={58}
                              paddingAngle={2}
                              dataKey="value"
                              animationDuration={1200}
                              animationBegin={200}
                            >
                              {["#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"].map((c, i) => (
                                <Cell key={i} fill={c} stroke="none" />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 ml-4 space-y-1.5 text-[11px]">
                        {[
                          { label: "Purchase", value: result.property.estimated_value_aed, color: "#3b82f6" },
                          { label: "DLD 4%", value: result.acquisition_costs.dld_fee_4pct_aed, color: "#f59e0b" },
                          { label: "Agency 2%", value: result.acquisition_costs.agency_fee_2pct_aed, color: "#8b5cf6" },
                        ].map((x, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: x.color }} />
                            <span className="text-white/40 flex-1">{x.label}</span>
                            <span className="font-mono text-white/70">{fmt(x.value)}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                          <span className="text-white/40 flex-1">Total</span>
                          <span className="font-mono text-amber-400">{fmt(result.acquisition_costs.total_acquisition_aed)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financing details */}
                  <div className="p-5 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                    <p className="text-xs text-white/30 tracking-wider uppercase mb-4">Financing</p>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/40">Down Payment</span>
                        <span className="text-white font-mono"><CountUp end={result.financing.down_payment_aed} duration={1.6} separator="," /></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Mortgage Amount</span>
                        <span className="text-white font-mono"><CountUp end={result.financing.mortgage_amount_aed} duration={1.6} separator="," /></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Monthly Payment</span>
                        <span className="text-white font-mono"><CountUp end={result.financing.monthly_payment_aed} duration={1.6} separator="," /></span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                        <span className="text-white/40">Cash on Cash</span>
                        <span className="text-green-400 font-mono">
                          {((result.cash_flow.annual_cash_flow_aed / result.financing.down_payment_aed) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Interactive projection chart — Recharts */}
                {result.projections && result.projections.length > 0 && (
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.3 } } }}
                    className="p-6 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-white/30 tracking-wider uppercase mb-1">
                          {result.projections.length}-Year Value Projection
                        </p>
                        <p className="font-['Fraunces'] italic text-[12px] text-white/20">Hover to inspect each year</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                        <span className="font-mono text-[10px] tracking-wider text-white/30">Property Value</span>
                      </div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.projections} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                          <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="year"
                            stroke="rgba(255,255,255,0.1)"
                            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}
                            tickFormatter={(v) => `Y${v}`}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.1)"
                            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}
                            tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ReTooltip
                            contentStyle={{
                              background: "#1a1a24",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontFamily: "monospace",
                            }}
                            labelFormatter={(v) => `Year ${String(v)}`}
                            formatter={(value, _name, item) => {
                              const amount = typeof value === "number" ? value : Number(value ?? 0);
                              const payload =
                                item && typeof item === "object" && "payload" in item
                                  ? (item as { payload?: { total_return_pct?: number } }).payload
                                  : undefined;
                              const totalReturnPct =
                                typeof payload?.total_return_pct === "number" ? payload.total_return_pct : 0;

                              return [`AED ${fmt(amount)} (${totalReturnPct.toFixed(1)}%)`, "Value"];
                            }}
                            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="property_value_aed"
                            stroke="url(#lineGradient)"
                            strokeWidth={2.5}
                            dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
                            activeDot={{ fill: "#fff", r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] text-xs">
                      <span className="text-white/30">Total return after {result.projections.length}y</span>
                      <span className="font-mono text-green-400">
                        +{result.projections[result.projections.length - 1].total_return_pct.toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {!result && !error && (
              <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-lg p-12">
                <p className="text-white/15 text-sm text-center">
                  Configure your investment and click &ldquo;Calculate ROI&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Zone Price Chart ── */}
        {zoneTrend && zoneTrend.yearly && (
          <div className="mt-12 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-1">Price Evolution (AED/sqft)</p>
                <p className="text-xl text-white font-light">{zoneTrend.zone}</p>
                {zoneTrend.resolved !== zoneTrend.zone && (
                  <p className="text-[11px] text-white/20 font-mono">resolved: {zoneTrend.resolved}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-1">CAGR</p>
                <p className={`text-2xl font-mono ${zoneTrend.cagr >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {zoneTrend.cagr >= 0 ? "+" : ""}{zoneTrend.cagr.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-40">
              {Object.entries(zoneTrend.yearly).map(([year, price]) => {
                const values = Object.values(zoneTrend.yearly);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min || 1;
                const height = ((price - min) / range) * 85 + 10;
                return (
                  <div key={year} className="flex-1 group relative">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-[#3b82f6]/20 to-[#3b82f6]/60 hover:from-[#3b82f6]/40 hover:to-[#3b82f6] transition-all cursor-pointer"
                      style={{ height: `${height}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a24] border border-white/10 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10 pointer-events-none">
                      {year}: AED {fmt(price)}
                    </div>
                    <p className="text-[9px] text-white/20 text-center mt-1 font-mono">{year.slice(-2)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Trends: Top 10 / Bottom 10 ── */}
        {trends && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 10 */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendUpIcon size={16} className="text-green-400" />
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/40">Top 10 Appreciation</p>
                <span className="ml-auto font-mono text-[10px] text-white/20">{trends.total_zones} zones</span>
              </div>
              <div className="space-y-1.5">
                {trends.top_10.map((z, i) => (
                  <button
                    key={z.zone}
                    onClick={() => setForm({ ...form, zona: z.zone })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <span className="font-mono text-[10px] text-white/20 w-5">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[13px] text-white/70 flex-1 truncate">{z.zone}</span>
                    <span className="font-mono text-[12px] text-green-400">+{z.cagr.toFixed(1)}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom 10 */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingDown size={16} className="text-red-400" />
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/40">Bottom 10 Depreciation</p>
              </div>
              <div className="space-y-1.5">
                {trends.bottom_10.map((z, i) => (
                  <button
                    key={z.zone}
                    onClick={() => setForm({ ...form, zona: z.zone })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <span className="font-mono text-[10px] text-white/20 w-5">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[13px] text-white/70 flex-1 truncate">{z.zone}</span>
                    <span className="font-mono text-[12px] text-red-400">{z.cagr.toFixed(1)}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
