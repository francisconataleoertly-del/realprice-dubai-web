"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, TrendingDown, TrendingUp as TrendUpIcon } from "lucide-react";
import CountUp from "react-countup";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import DealIntelligencePanel from "@/components/intelligence/DealIntelligencePanel";
import { buildInvestmentIntelligence } from "@/lib/deal-intelligence";
import { getFranceRegulationProfile } from "@/lib/market-regulation";
import marketData from "@/data/france-dvf-market.json";
import ParallaxBackdrop from "@/components/design/ParallaxBackdrop";
import NoiseTexture from "@/components/design/NoiseTexture";
import FranceReportCTA from "./FranceReportCTA";
import { useFranceMarket } from "./FranceMarketContext";
import {
  FRANCE_ACQUISITION_COSTS,
  FRANCE_CITY_YIELDS,
  FRANCE_IFI_THRESHOLD_EUR,
  FRANCE_MORTGAGE,
  FRANCE_NATIONAL_GROSS_YIELD_PCT,
  FRANCE_PS_RATE_BIC_MEUBLE_PCT,
  FRANCE_PS_RATE_FONCIER_PCT,
  FRANCE_TAX_REGIMES,
  FRANCE_TMI_OPTIONS,
  type CityYield,
  type TaxRegime,
  type TaxRegimeKey,
} from "./franceYields";

type PropertyType = "Appartement" | "Maison";

type YearRow = {
  year: number;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
};

type TrendRow = {
  commune: string;
  department_code: string;
  property_type: PropertyType;
  cagr_pct: number;
  first_price_per_m2: number;
  latest_price_per_m2: number;
  support_transactions: number;
};

type FranceMarketShape = {
  by_year: YearRow[];
  top_trends: TrendRow[];
};

const data = marketData as unknown as FranceMarketShape;

const FRANCE_UNDERWRITING_LAYERS = [
  {
    label: "Rent cap",
    title: "Encadrement des loyers",
    metric: "Legal rent",
    body: "Paris, Lyon and other controlled markets need legal rent ceilings before yield is trusted.",
  },
  {
    label: "Energy risk",
    title: "DPE rental ban",
    metric: "G/F/E",
    body: "DPE G is already a rental red flag. F and E become medium-term capex risks.",
  },
  {
    label: "Future supply",
    title: "Permits + Sitadel",
    metric: "Pipeline",
    body: "Construction permits and Sitadel help detect supply pressure around the target city.",
  },
  {
    label: "Net capex",
    title: "MaPrimeRenov",
    metric: "Aid",
    body: "Aid simulation should convert renovation cost into net capex after subsidy eligibility.",
  },
];

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const eurCompact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
};

function getVerdict(grossYieldPct: number, annualCashFlow: number, cagrPct: number) {
  const score =
    grossYieldPct * 2 + (annualCashFlow > 0 ? 3 : -2) + cagrPct * 0.4;
  if (score >= 14)
    return {
      label: "STRONG BUY",
      color: "#10b981",
      glow: "rgba(16,185,129,0.4)",
      desc: "Excellent fundamentals: yield + cash-flow + appreciation align.",
    };
  if (score >= 9)
    return {
      label: "BUY",
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.4)",
      desc: "Solid opportunity with a clear path to positive returns.",
    };
  if (score >= 5)
    return {
      label: "HOLD",
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.4)",
      desc: "Average returns. Worth comparing to alternatives in the same band.",
    };
  return {
    label: "RISKY",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    desc: "Yield and cash-flow are stretched — reconsider unless appreciation is high.",
  };
}

function monthlyMortgagePayment(principal: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

type Form = {
  cityIndex: number;
  property_type: PropertyType;
  area_m2: number;
  hold_years: number;
  down_payment_pct: number;
  mortgage_rate_pct: number;
  mortgage_years: number;
  annual_appreciation_pct: number;
  tax_regime: TaxRegimeKey;
  tmi_pct: number;
};

type Result = {
  city: CityYield;
  property: { sale_price_eur: number; price_per_m2: number };
  acquisition: {
    purchase_price: number;
    notary_fees: number;
    agency_fees: number;
    total: number;
  };
  financing: {
    down_payment: number;
    mortgage_amount: number;
    monthly_payment: number;
    annual_payment: number;
  };
  rental: {
    monthly_gross_rent: number;
    annual_gross_rent: number;
    annual_net_rent: number;
    gross_yield_pct: number;
    net_yield_pct: number;
  };
  tax: {
    regime: TaxRegime;
    taxable_base: number;
    abattement: number;
    deductions: number;
    amortissement: number;
    annual_tax_eur: number;
    effective_rate_pct: number;
    social_rate_pct: number;
    above_revenue_cap: boolean;
  };
  cash_flow: {
    annual_pre_tax: number;
    monthly_pre_tax: number;
    annual_after_tax: number;
    monthly_after_tax: number;
  };
  ifi: {
    above_threshold: boolean;
    threshold_eur: number;
  };
  projections: Array<{
    year: number;
    property_value: number;
    cumulative_rent: number;
    total_return_pct: number;
  }>;
};

function computeTax(
  regimeKey: TaxRegimeKey,
  tmiPct: number,
  annualGrossRent: number,
  annualPayment: number,
  operatingCosts: number,
  propertyTax: number,
  purchasePrice: number,
): {
  regime: TaxRegime;
  taxable_base: number;
  abattement: number;
  deductions: number;
  amortissement: number;
  annual_tax_eur: number;
  effective_rate_pct: number;
  social_rate_pct: number;
  above_revenue_cap: boolean;
} {
  const regime =
    FRANCE_TAX_REGIMES.find((r) => r.key === regimeKey) ?? FRANCE_TAX_REGIMES[0];

  // 1. Abattement forfaitaire (micro regimes)
  const abattement =
    regime.flat_abattement_pct > 0
      ? annualGrossRent * (regime.flat_abattement_pct / 100)
      : 0;

  // 2. Real expenses deductible (régime réel)
  // Mortgage interest portion (rough: ~70% of payment in early years)
  const mortgageInterest = annualPayment * 0.7;
  const deductions = regime.expenses_deductible
    ? operatingCosts + propertyTax + mortgageInterest
    : 0;

  // 3. Amortissement (LMNP réel + SCI IS)
  // Rule of thumb: 2-3% of property value annually for the building (excluding land);
  // we use 2.5% of purchase price - a conservative midpoint of practitioners' guidance.
  const amortissement = regime.amortissement_deductible ? purchasePrice * 0.025 : 0;

  // 4. Taxable base (cannot be negative)
  const taxableBase = Math.max(
    0,
    annualGrossRent - abattement - deductions - amortissement,
  );

  // 5. Statutory rate
  // - For IS regimes (SCI IS): corporate tax 25% (15% on first €42,500 of profit if eligible).
  // - For IR-based regimes: TMI + prélèvements sociaux 17.2%.
  let effectiveRate: number;
  if (regime.uses_corporate_rate) {
    // Reduced 15% on first 42,500€ of profit, then 25%
    const reducedSlice = Math.min(taxableBase, 42_500);
    const fullSlice = Math.max(0, taxableBase - 42_500);
    const tax = reducedSlice * 0.15 + fullSlice * 0.25;
    effectiveRate = taxableBase > 0 ? (tax / taxableBase) * 100 : 0;
  } else {
    const socialRate = regime.furnished
      ? FRANCE_PS_RATE_BIC_MEUBLE_PCT
      : FRANCE_PS_RATE_FONCIER_PCT;
    effectiveRate = tmiPct + socialRate;
  }

  const socialRate = regime.uses_corporate_rate
    ? 0
    : regime.furnished
      ? FRANCE_PS_RATE_BIC_MEUBLE_PCT
      : FRANCE_PS_RATE_FONCIER_PCT;

  const annualTax = (taxableBase * effectiveRate) / 100;
  const aboveCap =
    regime.revenue_cap_eur !== undefined && annualGrossRent > regime.revenue_cap_eur;

  return {
    regime,
    taxable_base: Math.round(taxableBase),
    abattement: Math.round(abattement),
    deductions: Math.round(deductions),
    amortissement: Math.round(amortissement),
    annual_tax_eur: Math.round(annualTax),
    effective_rate_pct: Number(effectiveRate.toFixed(2)),
    social_rate_pct: socialRate,
    above_revenue_cap: aboveCap,
  };
}

function calculate(form: Form): Result {
  const city = FRANCE_CITY_YIELDS[form.cityIndex];
  const pricePerM2 = city.sale_price_per_m2_eur;
  const purchasePrice = pricePerM2 * form.area_m2;

  const notaryFees =
    purchasePrice * (FRANCE_ACQUISITION_COSTS.notary_fees_pct_existing / 100);
  const agencyFees = purchasePrice * (FRANCE_ACQUISITION_COSTS.agency_fees_pct / 100);
  const totalAcquisition = purchasePrice + notaryFees + agencyFees;

  const downPayment = totalAcquisition * (form.down_payment_pct / 100);
  const mortgageAmount = totalAcquisition - downPayment;
  const monthlyPayment = monthlyMortgagePayment(
    mortgageAmount,
    form.mortgage_rate_pct,
    form.mortgage_years,
  );
  const annualPayment = monthlyPayment * 12;

  const monthlyRent = city.rent_per_m2_eur_month * form.area_m2;
  const annualGrossRent = monthlyRent * 12;

  const operatingCostsPct =
    (FRANCE_ACQUISITION_COSTS.property_management_pct +
      FRANCE_ACQUISITION_COSTS.insurance_pct_of_rent +
      FRANCE_ACQUISITION_COSTS.vacancy_pct +
      FRANCE_ACQUISITION_COSTS.maintenance_pct_of_rent) /
    100;
  const operatingCosts = annualGrossRent * operatingCostsPct;
  const propertyTax =
    purchasePrice * (FRANCE_ACQUISITION_COSTS.property_tax_pct_of_sale / 100);
  const annualNetRent = annualGrossRent - operatingCosts - propertyTax;

  const grossYieldPct = (annualGrossRent / purchasePrice) * 100;
  const netYieldPct = (annualNetRent / totalAcquisition) * 100;

  const annualCashFlowPreTax = annualNetRent - annualPayment;
  const monthlyCashFlowPreTax = annualCashFlowPreTax / 12;

  const tax = computeTax(
    form.tax_regime,
    form.tmi_pct,
    annualGrossRent,
    annualPayment,
    operatingCosts,
    propertyTax,
    purchasePrice,
  );

  const annualCashFlowAfterTax = annualCashFlowPreTax - tax.annual_tax_eur;
  const monthlyCashFlowAfterTax = annualCashFlowAfterTax / 12;

  const projections: Result["projections"] = [];
  let cumulativeRent = 0;
  for (let y = 1; y <= form.hold_years; y++) {
    const propertyValue =
      purchasePrice * Math.pow(1 + form.annual_appreciation_pct / 100, y);
    cumulativeRent += annualNetRent;
    const totalReturnPct =
      ((propertyValue - purchasePrice + cumulativeRent - annualPayment * y) /
        downPayment) *
      100;
    projections.push({
      year: y,
      property_value: Math.round(propertyValue),
      cumulative_rent: Math.round(cumulativeRent),
      total_return_pct: Number(totalReturnPct.toFixed(1)),
    });
  }

  return {
    city,
    property: { sale_price_eur: Math.round(purchasePrice), price_per_m2: pricePerM2 },
    acquisition: {
      purchase_price: Math.round(purchasePrice),
      notary_fees: Math.round(notaryFees),
      agency_fees: Math.round(agencyFees),
      total: Math.round(totalAcquisition),
    },
    financing: {
      down_payment: Math.round(downPayment),
      mortgage_amount: Math.round(mortgageAmount),
      monthly_payment: Math.round(monthlyPayment),
      annual_payment: Math.round(annualPayment),
    },
    rental: {
      monthly_gross_rent: Math.round(monthlyRent),
      annual_gross_rent: Math.round(annualGrossRent),
      annual_net_rent: Math.round(annualNetRent),
      gross_yield_pct: Number(grossYieldPct.toFixed(2)),
      net_yield_pct: Number(netYieldPct.toFixed(2)),
    },
    tax,
    cash_flow: {
      annual_pre_tax: Math.round(annualCashFlowPreTax),
      monthly_pre_tax: Math.round(monthlyCashFlowPreTax),
      annual_after_tax: Math.round(annualCashFlowAfterTax),
      monthly_after_tax: Math.round(monthlyCashFlowAfterTax),
    },
    ifi: {
      above_threshold: purchasePrice >= FRANCE_IFI_THRESHOLD_EUR,
      threshold_eur: FRANCE_IFI_THRESHOLD_EUR,
    },
    projections,
  };
}

// Stress test grid — mutate (rate, appreciation) around the base case and re-run
// the full calculator. Returns a matrix the UI renders as a colour-coded heatmap.
type StressCell = {
  rateDelta: number;
  apprDelta: number;
  ratePct: number;
  apprPct: number;
  totalReturnPct: number;
  annualAfterTax: number;
};

const STRESS_RATE_DELTAS = [-1, -0.5, 0, 0.5, 1];
const STRESS_APPR_DELTAS = [3, 1.5, 0, -1]; // top row = best case

function computeStressMatrix(baseForm: Form): StressCell[][] {
  return STRESS_APPR_DELTAS.map((apprD) =>
    STRESS_RATE_DELTAS.map((rateD) => {
      const stressedForm: Form = {
        ...baseForm,
        mortgage_rate_pct: Math.max(0.5, baseForm.mortgage_rate_pct + rateD),
        annual_appreciation_pct: baseForm.annual_appreciation_pct + apprD,
      };
      const r = calculate(stressedForm);
      const last = r.projections[r.projections.length - 1];
      return {
        rateDelta: rateD,
        apprDelta: apprD,
        ratePct: stressedForm.mortgage_rate_pct,
        apprPct: stressedForm.annual_appreciation_pct,
        totalReturnPct: last?.total_return_pct ?? 0,
        annualAfterTax: r.cash_flow.annual_after_tax,
      };
    }),
  );
}

function stressColor(totalReturnPct: number): { bg: string; text: string; tier: string } {
  if (totalReturnPct >= 80) return { bg: "rgba(16,185,129,0.32)", text: "#10b981", tier: "Strong" };
  if (totalReturnPct >= 30) return { bg: "rgba(59,130,246,0.30)", text: "#60a5fa", tier: "Solid" };
  if (totalReturnPct >= 0) return { bg: "rgba(245,158,11,0.30)", text: "#f59e0b", tier: "Marginal" };
  return { bg: "rgba(239,68,68,0.30)", text: "#ef4444", tier: "Loss" };
}

export default function FranceInvestmentSection() {
  const market = useFranceMarket();
  const [chartsReady, setChartsReady] = useState(false);
  const [userPickedCity, setUserPickedCity] = useState(false);
  const [form, setForm] = useState<Form>({
    cityIndex: 1, // Marseille — high-yield default
    property_type: "Appartement",
    area_m2: 60,
    hold_years: 10,
    down_payment_pct: FRANCE_MORTGAGE.typical_down_payment_pct,
    mortgage_rate_pct: FRANCE_MORTGAGE.rate_20y_pct,
    mortgage_years: 20,
    annual_appreciation_pct: 2.5,
    tax_regime: "lmnp_reel", // most efficient default for furnished rental
    tmi_pct: 30, // typical middle/upper bracket
  });

  // When a new address is selected upstream (postcode arrives from BAN), try to map it
  // to the matching FRANCE_CITY_YIELDS entry so the calculator follows the user without
  // them having to re-enter the city. The user can still override via the dropdown.
  useEffect(() => {
    if (!market?.postcode || userPickedCity) return;
    const departmentCode = market.postcode.substring(0, 2);
    // For Paris (postcodes 75001-75020), match department "75"
    const idx = FRANCE_CITY_YIELDS.findIndex(
      (c) => c.department_code === departmentCode,
    );
    if (idx !== -1 && idx !== form.cityIndex) {
      setForm((prev) => ({ ...prev, cityIndex: idx }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market?.postcode, userPickedCity]);

  // Reset the auto-pick flag when address changes (so a new address can re-fill).
  useEffect(() => {
    setUserPickedCity(false);
  }, [market?.postcode]);

  const result = useMemo(() => calculate(form), [form]);
  const regulation = useMemo(
    () => getFranceRegulationProfile(result.city.city, market?.dpeClass ?? "D"),
    [market?.dpeClass, result.city.city],
  );
  const stressMatrix = useMemo(() => computeStressMatrix(form), [form]);
  const stressFlat = useMemo(
    () => stressMatrix.flat(),
    [stressMatrix],
  );
  const stressSummary = useMemo(() => {
    const total = stressFlat.length;
    const strong = stressFlat.filter((c) => c.totalReturnPct >= 80).length;
    const solid = stressFlat.filter(
      (c) => c.totalReturnPct >= 30 && c.totalReturnPct < 80,
    ).length;
    const marginal = stressFlat.filter(
      (c) => c.totalReturnPct >= 0 && c.totalReturnPct < 30,
    ).length;
    const loss = stressFlat.filter((c) => c.totalReturnPct < 0).length;
    return { total, strong, solid, marginal, loss };
  }, [stressFlat]);

  useEffect(() => {
    setChartsReady(true);
  }, []);

  const yearTrend = useMemo(
    () =>
      data.by_year
        .filter((row) => row.property_type === form.property_type)
        .sort((a, b) => a.year - b.year),
    [form.property_type],
  );

  const cagrTopRising = useMemo(
    () =>
      [...data.top_trends]
        .filter((t) => t.property_type === form.property_type && t.cagr_pct > 0)
        .sort((a, b) => b.cagr_pct - a.cagr_pct)
        .slice(0, 5),
    [form.property_type],
  );

  const cagrTopFalling = useMemo(
    () =>
      [...data.top_trends]
        .filter((t) => t.property_type === form.property_type && t.cagr_pct < 0)
        .sort((a, b) => a.cagr_pct - b.cagr_pct)
        .slice(0, 5),
    [form.property_type],
  );

  const verdict = getVerdict(
    result.rental.gross_yield_pct,
    result.cash_flow.annual_after_tax,
    form.annual_appreciation_pct,
  );

  return (
    <section id="inversion" className="relative min-h-screen overflow-hidden">
      <ParallaxBackdrop image="/france/bordeaux-night.jpg" speed={0.4} opacity={0.4} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />
      <NoiseTexture intensity={0.05} blend="overlay" />

      <div className="relative z-10 px-4 py-28 md:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="mb-6 flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
                Chapter IV
              </span>
              <div className="h-px w-12 bg-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
                Investment Intelligence
              </span>
            </div>

            <h2 className="max-w-4xl font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white">
              Build returns from
              <br />
              <span className="font-extralight italic text-white/40">
                official French transactions.
              </span>
            </h2>

            <p className="mt-6 max-w-2xl font-['Fraunces'] text-[14px] italic text-white/30">
              Real DVF prices &middot; published rental yields (Lokimo / Meilleurtaux 2025) &middot;
              French notary fees and Banque de France mortgage rates &middot; computed live, never approximated.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8 }}
              className="relative self-start border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl md:p-8"
            >
              <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
              <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />

              <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                Configure
              </p>
              <h3 className="mb-8 font-['Fraunces'] text-[28px] font-light leading-none tracking-tight text-white">
                Your investment
              </h3>

              <div className="space-y-5">
                <Field label="City">
                  <div className="relative">
                    <select
                      value={form.cityIndex}
                      onChange={(e) => {
                        setUserPickedCity(true);
                        setForm({ ...form, cityIndex: Number(e.target.value) });
                      }}
                      className="h-12 w-full appearance-none rounded-none border border-white/[0.08] bg-[#0a0a0f] px-3 pr-10 text-sm text-white outline-none transition focus:border-blue-300/40"
                    >
                      {FRANCE_CITY_YIELDS.map((c, i) => (
                        <option key={c.city} value={i} className="bg-[#0a0a0f]">
                          {c.city} (Dept. {c.department_code}) — {c.gross_yield_pct.toFixed(2)}% yield
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Type">
                    <div className="relative">
                      <select
                        value={form.property_type}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            property_type: e.target.value as PropertyType,
                          })
                        }
                        className="h-12 w-full appearance-none rounded-none border border-white/[0.08] bg-[#0a0a0f] px-3 pr-10 text-sm text-white outline-none focus:border-blue-300/40"
                      >
                        <option className="bg-[#0a0a0f]" value="Appartement">
                          Appartement
                        </option>
                        <option className="bg-[#0a0a0f]" value="Maison">
                          Maison
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                    </div>
                  </Field>
                  <Field label="Area m²">
                    <input
                      type="number"
                      value={form.area_m2}
                      min={15}
                      max={500}
                      onChange={(e) =>
                        setForm({ ...form, area_m2: Number(e.target.value) || 0 })
                      }
                      className="h-12 w-full rounded-none border border-white/[0.08] bg-[#0a0a0f] px-3 text-sm text-white outline-none focus:border-blue-300/40"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Slider
                    label="Down payment"
                    suffix="%"
                    value={form.down_payment_pct}
                    min={5}
                    max={50}
                    step={1}
                    onChange={(v) => setForm({ ...form, down_payment_pct: v })}
                  />
                  <Slider
                    label="Hold years"
                    suffix=" yr"
                    value={form.hold_years}
                    min={3}
                    max={25}
                    step={1}
                    onChange={(v) => setForm({ ...form, hold_years: v })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Slider
                    label="Mortgage rate"
                    suffix="%"
                    value={form.mortgage_rate_pct}
                    min={1}
                    max={7}
                    step={0.05}
                    onChange={(v) => setForm({ ...form, mortgage_rate_pct: v })}
                  />
                  <Slider
                    label="Mortgage term"
                    suffix=" yr"
                    value={form.mortgage_years}
                    min={10}
                    max={FRANCE_MORTGAGE.max_term_years}
                    step={1}
                    onChange={(v) => setForm({ ...form, mortgage_years: v })}
                  />
                </div>

                <Slider
                  label="Annual appreciation"
                  suffix="%"
                  value={form.annual_appreciation_pct}
                  min={-2}
                  max={8}
                  step={0.1}
                  onChange={(v) => setForm({ ...form, annual_appreciation_pct: v })}
                />

                {market?.addressLabel && market.addressLabel.length > 3 ? (
                  <div className="rounded-2xl border border-blue-300/15 bg-blue-500/5 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-blue-100/70">
                    City auto-picked from{" "}
                    <span className="text-white/85">
                      {market.addressLabel.slice(0, 55)}
                      {market.addressLabel.length > 55 ? "…" : ""}
                    </span>
                    {market.dpeLookup?.exact_match?.etiquette_dpe ? (
                      <>
                        {" · DPE "}
                        <span className="text-white/85">
                          {market.dpeLookup.exact_match.etiquette_dpe}
                        </span>
                      </>
                    ) : null}
                    {userPickedCity ? (
                      <span className="ml-2 text-amber-300">
                        (user override)
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-2 border-t border-white/[0.06] pt-5">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-blue-200/70">
                    French tax regime
                  </p>
                  <Field label="Régime fiscal">
                    <div className="relative">
                      <select
                        value={form.tax_regime}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tax_regime: e.target.value as TaxRegimeKey,
                          })
                        }
                        className="h-12 w-full appearance-none rounded-none border border-white/[0.08] bg-[#0a0a0f] px-3 pr-10 text-sm text-white outline-none focus:border-blue-300/40"
                      >
                        {FRANCE_TAX_REGIMES.map((r) => (
                          <option key={r.key} value={r.key} className="bg-[#0a0a0f]">
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                    </div>
                  </Field>
                  <div className="mt-3">
                    <Field label="TMI (Tranche Marginale d'Imposition)">
                      <div className="relative">
                        <select
                          value={form.tmi_pct}
                          onChange={(e) =>
                            setForm({ ...form, tmi_pct: Number(e.target.value) })
                          }
                          className="h-12 w-full appearance-none rounded-none border border-white/[0.08] bg-[#0a0a0f] px-3 pr-10 text-sm text-white outline-none focus:border-blue-300/40"
                        >
                          {FRANCE_TMI_OPTIONS.map((opt) => (
                            <option
                              key={opt.tmi_pct}
                              value={opt.tmi_pct}
                              className="bg-[#0a0a0f]"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/[0.06] pt-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                  Sources
                </p>
                <p className="mt-2 font-['Fraunces'] text-[11px] italic leading-relaxed text-white/40">
                  Yields: Lokimo &middot; Frais de notaire: Notaires de France &middot;
                  Mortgage rate: Banque de France Q1 2026 &middot; Tax regimes:
                  service-public.gouv.fr / impots.gouv.fr 2026
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="self-start space-y-4"
            >
              <div
                className="relative overflow-hidden border-b border-t bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl"
                style={{
                  borderTopColor: verdict.color + "40",
                  borderBottomColor: verdict.color + "40",
                  boxShadow: `inset 0 0 60px ${verdict.glow}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                      Verdict
                    </p>
                    <p
                      className="font-['Fraunces'] text-[40px] font-extralight leading-none tracking-tight"
                      style={{ color: verdict.color }}
                    >
                      {verdict.label}
                    </p>
                    <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/50">
                      {verdict.desc}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Gross yield
                    </p>
                    <p
                      className="font-['Fraunces'] text-[32px] font-extralight leading-none"
                      style={{ color: verdict.color }}
                    >
                      <CountUp
                        end={result.rental.gross_yield_pct}
                        decimals={2}
                        duration={1.2}
                        preserveValue
                      />
                      <span className="text-[0.5em] text-white/30">%</span>
                    </p>
                    <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/25">
                      vs FR avg {FRANCE_NATIONAL_GROSS_YIELD_PCT}%
                    </p>
                  </div>
                </div>
              </div>

              <DealIntelligencePanel
                intelligence={buildInvestmentIntelligence({
                  market: "france",
                  grossYieldPct: result.rental.gross_yield_pct,
                  netYieldPct: result.rental.net_yield_pct,
                  annualCashFlow: result.cash_flow.annual_after_tax,
                  monthlyCashFlow: result.cash_flow.monthly_after_tax,
                  cagrPct: form.annual_appreciation_pct,
                  confidenceScore: result.tax.above_revenue_cap || result.ifi.above_threshold ? 66 : 78,
                  currency: "EUR",
                })}
                title="AI investment memo"
              />

              <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
                <Stat
                  label="Purchase price"
                  value={eur(result.acquisition.purchase_price)}
                  unit="EUR"
                />
                <Stat
                  label="Total acquisition"
                  value={eur(result.acquisition.total)}
                  unit="EUR"
                  detail={`+ ${eur(
                    result.acquisition.notary_fees + result.acquisition.agency_fees,
                  )} fees`}
                />
                <Stat
                  label="Down payment"
                  value={eur(result.financing.down_payment)}
                  unit="EUR"
                  detail={`${form.down_payment_pct}% of total`}
                />
                <Stat
                  label="Monthly mortgage"
                  value={eur(result.financing.monthly_payment)}
                  unit="EUR"
                  detail={`${form.mortgage_rate_pct.toFixed(2)}% / ${form.mortgage_years}y`}
                />
                <Stat
                  label="Annual gross rent"
                  value={eur(result.rental.annual_gross_rent)}
                  unit="EUR"
                  detail={`${eur(result.rental.monthly_gross_rent)}/mo`}
                />
                <Stat
                  label="Annual net rent"
                  value={eur(result.rental.annual_net_rent)}
                  unit="EUR"
                  detail={`net yield ${result.rental.net_yield_pct.toFixed(2)}%`}
                />
                <Stat
                  label="Cash flow pre-tax"
                  value={eur(result.cash_flow.annual_pre_tax)}
                  unit="EUR/yr"
                  detail={`${eur(result.cash_flow.monthly_pre_tax)}/mo`}
                  positive={result.cash_flow.annual_pre_tax > 0}
                  negative={result.cash_flow.annual_pre_tax < 0}
                />
                <Stat
                  label="Cash flow after tax"
                  value={eur(result.cash_flow.annual_after_tax)}
                  unit="EUR/yr"
                  detail={`${result.tax.regime.short} · ${eur(result.cash_flow.monthly_after_tax)}/mo`}
                  positive={result.cash_flow.annual_after_tax > 0}
                  negative={result.cash_flow.annual_after_tax < 0}
                />
              </div>

              <div className="relative overflow-hidden border-b border-t border-blue-300/15 bg-blue-500/[0.055] p-6 backdrop-blur-2xl">
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-blue-200/30" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-blue-200/30" />
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                    <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-blue-100/55">
                      Commercial checks
                    </p>
                    <h3 className="font-['Fraunces'] text-[24px] font-light leading-none tracking-tight text-white">
                      Rent, DPE, vacancy and tax reality
                    </h3>
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/32">
                    {result.city.city} / DPE {market?.dpeClass ?? "D"}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    {
                      label: "Rent cap",
                      value: regulation.rentCapActive ? "Active" : "Watch",
                      body: regulation.rentCapActive
                        ? "Use the local reference rent before underwriting legal rent."
                        : "No local rent-control flag in the commercial model.",
                      color: regulation.rentCapActive ? "text-amber-200" : "text-emerald-200",
                    },
                    {
                      label: "Zone tendue",
                      value: regulation.zoneTendue ? "Yes" : "No",
                      body: regulation.zoneTendue
                        ? "Vacancy, rent review and rental rules need zone-tendue caution."
                        : "Standard vacancy assumption unless local demand data says otherwise.",
                      color: regulation.zoneTendue ? "text-blue-200" : "text-white/70",
                    },
                    {
                      label: "Vacancy",
                      value: `${regulation.vacancyPct.toFixed(1)}%`,
                      body: "Used as a city-level operating drag before net yield.",
                      color: "text-white",
                    },
                    {
                      label: regulation.dpeRisk.label,
                      value: regulation.dpeRisk.level,
                      body: regulation.dpeRisk.body,
                      color:
                        regulation.dpeRisk.level === "critical"
                          ? "text-red-200"
                          : regulation.dpeRisk.level === "high"
                            ? "text-amber-200"
                            : regulation.dpeRisk.level === "medium"
                              ? "text-yellow-100"
                              : "text-emerald-200",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f]/72 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                          {item.label}
                        </p>
                        <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${item.color}`}>
                          {item.value}
                        </p>
                      </div>
                      <p className="text-[12px] leading-6 text-white/52">{item.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    `Social tax layer: ${result.tax.social_rate_pct.toFixed(1)}%`,
                    regulation.aids[0],
                    regulation.charges[2],
                  ].map((item) => (
                    <p key={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3 text-[12px] leading-6 text-white/50">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                      Tax regime &middot; {result.tax.regime.short}
                    </p>
                    <h3 className="font-['Fraunces'] text-[22px] font-light leading-none tracking-tight text-white">
                      {result.tax.regime.label}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Tax owed
                    </p>
                    <p className="font-['Fraunces'] text-[24px] font-extralight leading-none text-white">
                      <span className="mr-1 text-[0.5em] text-white/30">EUR</span>
                      {eur(result.tax.annual_tax_eur)}
                    </p>
                    <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-white/30">
                      {result.tax.effective_rate_pct.toFixed(1)}% effective rate
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-3 sm:grid-cols-4">
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Abattement
                    </p>
                    <p className="font-['Fraunces'] text-[16px] font-extralight text-white">
                      −{eur(result.tax.abattement)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Deductions
                    </p>
                    <p className="font-['Fraunces'] text-[16px] font-extralight text-white">
                      −{eur(result.tax.deductions)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Amortissement
                    </p>
                    <p className="font-['Fraunces'] text-[16px] font-extralight text-white">
                      −{eur(result.tax.amortissement)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Taxable base
                    </p>
                    <p className="font-['Fraunces'] text-[16px] font-extralight text-white">
                      {eur(result.tax.taxable_base)}
                    </p>
                  </div>
                </div>

                {result.tax.above_revenue_cap ? (
                  <p className="mt-4 border-t border-amber-300/20 pt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300">
                    ⚠ Annual rent above {eur(result.tax.regime.revenue_cap_eur ?? 0)} EUR cap — régime réel applies
                  </p>
                ) : null}

                {result.ifi.above_threshold ? (
                  <p className="mt-3 border-t border-amber-300/20 pt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300">
                    ⚠ Property over {eur(result.ifi.threshold_eur)} EUR — IFI (wealth tax) may apply
                  </p>
                ) : null}

                <p className="mt-4 font-['Fraunces'] text-[11px] italic leading-relaxed text-white/40">
                  {result.tax.regime.notes}
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="mt-8 grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.06] md:grid-cols-2 xl:grid-cols-4"
          >
            {FRANCE_UNDERWRITING_LAYERS.map((layer) => (
              <article key={layer.title} className="bg-[#0a0a0f]/90 p-5 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-blue-200/48">
                    {layer.label}
                  </p>
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/26">
                    {layer.metric}
                  </span>
                </div>
                <h3 className="text-xl font-medium tracking-[-0.03em] text-white">
                  {layer.title}
                </h3>
                <p className="mt-4 text-[12px] leading-6 text-white/48">{layer.body}</p>
              </article>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-2"
          >
            <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
              <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
              <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
              <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                {form.hold_years}-year projection
              </p>
              <h3 className="mb-6 font-['Fraunces'] text-[24px] font-light leading-none tracking-tight text-white">
                Property value &amp; cash returns
              </h3>
              <div className="h-[260px] min-h-[260px] w-full">
                {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.projections}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />
                    <XAxis
                      dataKey="year"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                      tickFormatter={(v) => eurCompact(v as number)}
                    />
                    <ReTooltip
                      contentStyle={{
                        background: "#0a0a0f",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 0,
                        fontSize: 11,
                      }}
                      formatter={(value) => `EUR ${eur(Number(value ?? 0))}`}
                      labelFormatter={(v) => `Year ${v}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="property_value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Property value"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative_rent"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      dot={false}
                      name="Cumulative net rent"
                    />
                  </LineChart>
                </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full border border-white/[0.04] bg-white/[0.02]" />
                )}
              </div>
              <div className="mt-4 flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.25em]">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-4 bg-blue-500" />
                  <span className="text-white/40">Property value</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-4 bg-emerald-500" />
                  <span className="text-white/40">Cumul. net rent</span>
                </div>
              </div>
            </div>

            <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
              <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
              <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
              <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                DVF history (FR national, {form.property_type})
              </p>
              <h3 className="mb-6 font-['Fraunces'] text-[24px] font-light leading-none tracking-tight text-white">
                Median EUR/m² over time
              </h3>
              <div className="h-[260px] min-h-[260px] w-full">
                {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearTrend}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />
                    <XAxis
                      dataKey="year"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                      tickFormatter={(v) => eurCompact(v as number)}
                    />
                    <ReTooltip
                      contentStyle={{
                        background: "#0a0a0f",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 0,
                        fontSize: 11,
                      }}
                      formatter={(value) => `EUR ${eur(Number(value ?? 0))} / m²`}
                    />
                    <Line
                      type="monotone"
                      dataKey="median_price_per_m2"
                      stroke="#fff"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#fff" }}
                      name="Median EUR/m²"
                    />
                  </LineChart>
                </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full border border-white/[0.04] bg-white/[0.02]" />
                )}
              </div>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                Source: DVF DGFiP via etalab.gouv.fr ({yearTrend[0]?.year}-{yearTrend[yearTrend.length - 1]?.year})
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="relative mt-8 border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl md:p-8"
          >
            <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
            <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />

            <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                  Stress test &middot; sensitivity to rate &amp; appreciation
                </p>
                <h3 className="font-['Fraunces'] text-[24px] font-light leading-none tracking-tight text-white">
                  10-year total return on down payment
                </h3>
                <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-white/55">
                  Each cell re-runs the full calculator with a different combination of
                  mortgage rate and annual appreciation. Centre cell ({result.city.city},
                  rate {form.mortgage_rate_pct.toFixed(2)}%, appreciation {form.annual_appreciation_pct}%) is your base case.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">
                  {stressSummary.strong} strong
                </span>
                <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-blue-200">
                  {stressSummary.solid} solid
                </span>
                <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">
                  {stressSummary.marginal} marginal
                </span>
                <span className="rounded-full border border-red-300/20 bg-red-400/10 px-2.5 py-1 text-red-200">
                  {stressSummary.loss} loss
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
                      Appreciation \ Rate
                    </th>
                    {STRESS_RATE_DELTAS.map((d) => (
                      <th
                        key={`rate-${d}`}
                        className="px-2 py-2 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-white/45"
                      >
                        <div>
                          {(form.mortgage_rate_pct + d).toFixed(2)}%
                        </div>
                        <div className="text-white/25">
                          {d > 0 ? "+" : ""}
                          {d.toFixed(1)}%
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stressMatrix.map((row, rIdx) => (
                    <tr key={`row-${STRESS_APPR_DELTAS[rIdx]}`}>
                      <td className="px-2 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                        <div className="text-white/70">
                          {(form.annual_appreciation_pct + STRESS_APPR_DELTAS[rIdx]).toFixed(1)}%
                        </div>
                        <div className="text-white/25">
                          {STRESS_APPR_DELTAS[rIdx] > 0 ? "+" : ""}
                          {STRESS_APPR_DELTAS[rIdx].toFixed(1)}%
                        </div>
                      </td>
                      {row.map((cell) => {
                        const c = stressColor(cell.totalReturnPct);
                        const isBase = cell.rateDelta === 0 && cell.apprDelta === 0;
                        return (
                          <td
                            key={`cell-${cell.rateDelta}-${cell.apprDelta}`}
                            className={`relative border border-white/[0.04] px-2 py-3 text-center font-['Fraunces'] tracking-tight transition-colors ${
                              isBase ? "ring-2 ring-white/30 ring-offset-1 ring-offset-[#0a0a0f]" : ""
                            }`}
                            style={{ backgroundColor: c.bg }}
                          >
                            <div className="text-[18px] font-light" style={{ color: c.text }}>
                              {cell.totalReturnPct > 0 ? "+" : ""}
                              {cell.totalReturnPct.toFixed(0)}%
                            </div>
                            <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                              {cell.annualAfterTax > 0 ? "+" : ""}
                              {eur(cell.annualAfterTax)}/yr
                            </div>
                            {isBase ? (
                              <div className="absolute right-1 top-1 font-mono text-[7px] uppercase tracking-[0.2em] text-white/60">
                                base
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-4 text-[11px] md:flex-row md:items-center">
              <p className="font-['Fraunces'] italic leading-relaxed text-white/45">
                Robust in{" "}
                <span className="text-white/80">
                  {stressSummary.strong + stressSummary.solid}/{stressSummary.total}
                </span>{" "}
                stress scenarios &middot; loss in{" "}
                <span className={stressSummary.loss > 0 ? "text-red-300" : "text-white/80"}>
                  {stressSummary.loss}/{stressSummary.total}
                </span>
              </p>
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-3 rounded-sm"
                    style={{ backgroundColor: "rgba(16,185,129,0.5)" }}
                  />
                  ≥80%
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-3 rounded-sm"
                    style={{ backgroundColor: "rgba(59,130,246,0.5)" }}
                  />
                  30–80%
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-3 rounded-sm"
                    style={{ backgroundColor: "rgba(245,158,11,0.5)" }}
                  />
                  0–30%
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-3 rounded-sm"
                    style={{ backgroundColor: "rgba(239,68,68,0.5)" }}
                  />
                  loss
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-2"
          >
            <TrendList
              title="Top rising communes (CAGR)"
              icon={<TrendUpIcon size={14} className="text-emerald-400" />}
              rows={cagrTopRising}
              accent="#10b981"
            />
            <TrendList
              title="Top declining communes (CAGR)"
              icon={<TrendingDown size={14} className="text-red-400" />}
              rows={cagrTopFalling}
              accent="#ef4444"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="relative mt-8 overflow-hidden border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 backdrop-blur-2xl"
          >
            <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
            <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <p className="font-['Fraunces'] text-[14px] font-light italic text-white/50">
                Yield benchmark &mdash; 12 French metros (Lokimo 2025)
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                {FRANCE_CITY_YIELDS.length} cities
              </p>
            </div>
            <div className="grid grid-cols-7 border-b border-white/[0.04] px-5 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
              <span>City</span>
              <span>Dept.</span>
              <span className="text-right">Sale EUR/m²</span>
              <span className="text-right">Rent EUR/m²/mo</span>
              <span className="text-right">Yield</span>
              <span className="text-right">vs FR</span>
              <span className="text-right">Tier</span>
            </div>
            {FRANCE_CITY_YIELDS.map((c) => {
              const isSelected = c.rank - 1 === form.cityIndex;
              const tierColor =
                c.tier === "high"
                  ? "#10b981"
                  : c.tier === "mid"
                    ? "#f59e0b"
                    : "#ef4444";
              return (
                <button
                  key={c.city}
                  onClick={() => {
                    setUserPickedCity(true);
                    setForm({ ...form, cityIndex: c.rank - 1 });
                  }}
                  className={`grid w-full grid-cols-7 border-b border-white/[0.02] px-5 py-2.5 text-[12px] transition-all hover:bg-white/[0.03] ${
                    isSelected ? "bg-white/[0.05]" : ""
                  }`}
                >
                  <span className="text-left text-white/70">{c.city}</span>
                  <span className="text-left text-white/30">{c.department_code}</span>
                  <span className="text-right font-mono text-white/50">
                    {eur(c.sale_price_per_m2_eur)}
                  </span>
                  <span className="text-right font-mono text-white/50">
                    {c.rent_per_m2_eur_month.toFixed(2)}
                  </span>
                  <span className="text-right font-mono" style={{ color: tierColor }}>
                    {c.gross_yield_pct.toFixed(2)}%
                  </span>
                  <span
                    className="text-right font-mono"
                    style={{
                      color:
                        c.gross_yield_pct > FRANCE_NATIONAL_GROSS_YIELD_PCT
                          ? "#10b981"
                          : "#94a3b8",
                    }}
                  >
                    {c.gross_yield_pct > FRANCE_NATIONAL_GROSS_YIELD_PCT ? "+" : ""}
                    {(c.gross_yield_pct - FRANCE_NATIONAL_GROSS_YIELD_PCT).toFixed(2)}%
                  </span>
                  <span
                    className="text-right font-mono uppercase"
                    style={{ color: tierColor }}
                  >
                    {c.tier}
                  </span>
                </button>
              );
            })}
          </motion.div>

          <div className="mt-8">
            <FranceReportCTA
              section="investment"
              printTargetId="inversion"
              snapshot={{
                city: result.city.city,
                property_type: form.property_type,
                area_m2: form.area_m2,
                purchase_price_eur: result.acquisition.purchase_price,
                total_acquisition_eur: result.acquisition.total,
                gross_yield_pct: result.rental.gross_yield_pct,
                net_yield_pct: result.rental.net_yield_pct,
                annual_after_tax_eur: result.cash_flow.annual_after_tax,
                tax_regime: result.tax.regime.short,
                tmi_pct: form.tmi_pct,
                hold_years: form.hold_years,
                ifi_alert: result.ifi.above_threshold,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function Slider({
  label,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
          {label}
        </span>
        <span className="font-mono text-[12px] text-white/80">
          {step < 1 ? value.toFixed(2) : value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-400 outline-none"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  detail,
  positive,
  negative,
}: {
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const valueColor = positive ? "#10b981" : negative ? "#ef4444" : "#fff";
  return (
    <div className="bg-[#0a0a0f]/85 p-5">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">
        {label}
      </p>
      <p
        className="font-['Fraunces'] text-[24px] font-extralight leading-none tracking-tight"
        style={{ color: valueColor }}
      >
        {unit ? <span className="mr-1 text-[0.5em] text-white/30">{unit}</span> : null}
        {value}
      </p>
      {detail ? (
        <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-white/30">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function TrendList({
  title,
  icon,
  rows,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  rows: TrendRow[];
  accent: string;
}) {
  return (
    <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
      <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
      <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <p className="font-['Fraunces'] text-[14px] font-light italic text-white/50">
          {title}
        </p>
      </div>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
            No data
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={`${row.commune}-${row.department_code}`}
              className="flex items-center justify-between border-b border-white/[0.04] py-2 text-[12px]"
            >
              <div className="min-w-0">
                <p className="truncate text-white/70">{row.commune}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
                  Dept. {row.department_code} &middot; {row.support_transactions} tx
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[15px]" style={{ color: accent }}>
                  {row.cagr_pct > 0 ? "+" : ""}
                  {row.cagr_pct.toFixed(1)}%
                </p>
                <p className="font-mono text-[9px] tracking-[0.2em] text-white/25">
                  {eur(row.first_price_per_m2)} → {eur(row.latest_price_per_m2)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
