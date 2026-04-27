"use client";

import { useState, useEffect } from "react";
import { TrendingUp, ChevronDown, Loader2 } from "lucide-react";

const API = "https://web-production-9051f.up.railway.app";

const ROOMS = ["Studio", "1 B/R", "2 B/R", "3 B/R", "4 B/R", "5 B/R"];

interface InvestmentResult {
  property: { zona: string; estimated_value_aed: number };
  acquisition_costs: { purchase_price_aed: number; dld_fee_4pct_aed: number; agency_fee_2pct_aed: number; total_acquisition_aed: number };
  financing: { down_payment_aed: number; mortgage_amount_aed: number; monthly_payment_aed: number };
  rental_income: { annual_rent_aed: number; gross_yield_pct: number };
  cash_flow: { net_operating_income_aed: number; annual_cash_flow_aed: number; monthly_cash_flow_aed: number };
  projections: Array<{ year: number; property_value_aed: number; total_return_pct: number }>;
}

export default function InversionSection() {
  const [zones, setZones] = useState<string[]>([]);
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
      .then((d) => { if (d.zones) setZones(d.zones.sort()); })
      .catch(() => {});
  }, []);

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
        {/* Section label */}
        <div className="flex items-center gap-4 mb-10">
          <span className="font-mono text-[11px] tracking-[0.3em] text-[#3b82f6]/70">04</span>
          <div className="w-12 h-px bg-[#3b82f6]/30" />
          <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/20">Investment</span>
        </div>

        <h2 className="text-[clamp(2.2rem,5vw,4.5rem)] font-extralight leading-[0.95] tracking-[-0.03em] text-white mb-4 max-w-3xl">
          Calculate your
          <br />
          <span className="bg-gradient-to-r from-white/40 to-white/15 bg-clip-text text-transparent">return on investment</span>
        </h2>
        <p className="text-white/30 text-[15px] mb-12 max-w-xl">
          Full ROI analysis with real Dubai acquisition costs, rental yields, and appreciation projections.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Zone</label>
              <div className="relative">
                <select value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })}
                  className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white appearance-none focus:border-[#3b82f6] focus:outline-none">
                  {zones.map((z) => <option key={z}>{z}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-white/30 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Rooms</label>
                <div className="relative">
                  <select value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                    className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white appearance-none focus:border-[#3b82f6] focus:outline-none">
                    {ROOMS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-white/30 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Area m&sup2;</label>
                <input type="number" value={form.area_m2} onChange={(e) => setForm({ ...form, area_m2: Number(e.target.value) })}
                  className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">
                Mortgage: {form.mortgage_pct}%
              </label>
              <input type="range" min={0} max={80} value={form.mortgage_pct}
                onChange={(e) => setForm({ ...form, mortgage_pct: Number(e.target.value) })}
                className="w-full accent-[#3b82f6]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Rate %</label>
                <input type="number" step={0.1} value={form.mortgage_rate_pct}
                  onChange={(e) => setForm({ ...form, mortgage_rate_pct: Number(e.target.value) })}
                  className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">Hold Years</label>
                <input type="number" value={form.hold_years}
                  onChange={(e) => setForm({ ...form, hold_years: Number(e.target.value) })}
                  className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 tracking-wider uppercase mb-1.5">
                Appreciation %/yr
              </label>
              <input type="number" step={0.5} value={form.annual_appreciation_pct}
                onChange={(e) => setForm({ ...form, annual_appreciation_pct: Number(e.target.value) })}
                className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:border-[#3b82f6] focus:outline-none" />
            </div>
            <button onClick={calculate} disabled={loading}
              className="w-full py-3.5 bg-[#3b82f6] text-white text-sm tracking-[0.15em] uppercase font-medium rounded hover:bg-[#2563eb] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Calculating..." : "Calculate ROI"}
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {error && <div className="p-4 rounded border border-red-500/20 bg-red-500/5 text-red-400 text-sm">{error}</div>}

            {result && (
              <>
                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                </div>

                {/* Acquisition costs */}
                <div className="p-5 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                  <p className="text-xs text-white/30 tracking-wider uppercase mb-3">Acquisition & Financing</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">DLD Fee (4%)</span>
                      <span className="text-white font-mono">AED {fmt(result.acquisition_costs.dld_fee_4pct_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Agency (2%)</span>
                      <span className="text-white font-mono">AED {fmt(result.acquisition_costs.agency_fee_2pct_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Total Acquisition</span>
                      <span className="text-amber-400 font-mono">AED {fmt(result.acquisition_costs.total_acquisition_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Down Payment</span>
                      <span className="text-white font-mono">AED {fmt(result.financing.down_payment_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Mortgage Amount</span>
                      <span className="text-white font-mono">AED {fmt(result.financing.mortgage_amount_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Monthly Payment</span>
                      <span className="text-white font-mono">AED {fmt(result.financing.monthly_payment_aed)}</span>
                    </div>
                  </div>
                </div>

                {/* Projection chart */}
                {result.projections && result.projections.length > 0 && (
                  <div className="p-5 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                    <p className="text-xs text-white/30 tracking-wider uppercase mb-4">
                      {result.projections.length}-Year Projection
                    </p>
                    <div className="flex items-end gap-1 h-36">
                      {result.projections.map((p) => {
                        const maxVal = result.projections[result.projections.length - 1].property_value_aed;
                        const height = (p.property_value_aed / maxVal) * 100;
                        const positive = p.total_return_pct >= 0;
                        return (
                          <div key={p.year} className="flex-1 group relative">
                            <div
                              className={`w-full rounded-t transition-colors cursor-pointer ${
                                positive ? "bg-[#3b82f6]/30 hover:bg-[#3b82f6]/60" : "bg-red-500/30 hover:bg-red-500/60"
                              }`}
                              style={{ height: `${height}%` }}
                            />
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a24] border border-white/10 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10 pointer-events-none">
                              Y{p.year}: AED {fmt(p.property_value_aed)}
                              <br />
                              Return: {p.total_return_pct.toFixed(1)}%
                            </div>
                            {p.year % 2 === 0 && (
                              <p className="text-[9px] text-white/20 text-center mt-1">{p.year}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
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
      </div>
      </div>
    </section>
  );
}
