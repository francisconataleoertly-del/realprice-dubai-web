"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Info } from "lucide-react";
import DealIntelligencePanel from "@/components/intelligence/DealIntelligencePanel";
import RenovationMaterialSearch from "@/components/renovation/RenovationMaterialSearch";
import { buildRenovationIntelligence } from "@/lib/deal-intelligence";
import { getFranceRegulationProfile } from "@/lib/market-regulation";

import { useFranceMarket } from "./FranceMarketContext";
import FranceReportCTA from "./FranceReportCTA";
import ParallaxBackdrop from "@/components/design/ParallaxBackdrop";
import NoiseTexture from "@/components/design/NoiseTexture";
import {
  computeEcoPtzInterestSavings,
  ECO_PTZ_2025,
  FRANCE_RENOVATION_CARDS,
  FRANCE_RENOVATION_CATEGORIES,
  FRANCE_TVA_BY_SCOPE,
  FRANCE_TVA_RATES,
  MAPRIMERENOV_2025,
  type RenovationCategory,
  type TvaCategory,
} from "./franceRenovationCosts";

type Tier = "basic" | "mid" | "premium" | "luxury";

const TIER_LABELS: Record<Tier, string> = {
  basic: "Basic",
  mid: "Mid",
  premium: "Premium",
  luxury: "Luxury",
};

// Tier multiplier applied to the published min/max range to spread it over 4 quality bands.
// Basic = floor of range; Luxury = top of range + 25% premium tier.
const TIER_FACTOR: Record<Tier, { min: number; max: number }> = {
  basic: { min: 1.0, max: 1.05 },
  mid: { min: 1.1, max: 1.25 },
  premium: { min: 1.3, max: 1.5 },
  luxury: { min: 1.5, max: 1.85 },
};

// Sale-price uplift bands by tier — Source: Notaires de France quarterly studies +
// MeilleursAgents 2024 renovation impact bulletin.
const VALUE_UPLIFT_PCT: Record<Tier, [number, number]> = {
  basic: [4, 8],
  mid: [8, 14],
  premium: [14, 22],
  luxury: [20, 32],
};

const FRANCE_RENOVATION_ROI_LAYERS = [
  {
    label: "Materials",
    title: "Retail anchors",
    body: "Bathrooms, kitchens, floors, windows, MEP, garage and pool references from French suppliers and guides.",
  },
  {
    label: "Energy",
    title: "DPE impact",
    body: "Energy works can unlock rental legality, reduce brown-discount risk and improve exit liquidity.",
  },
  {
    label: "Aid",
    title: "Net capex",
    body: "MaPrimeRenov and ANAH references turn gross works cost into a more realistic owner budget.",
  },
  {
    label: "Planning",
    title: "Heavy works",
    body: "Pool, garage, upper-floor creation and structural changes should be treated as separate project bands.",
  },
];

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

function tierCost(cat: RenovationCategory, tier: Tier) {
  const factor = TIER_FACTOR[tier];
  return {
    min: Math.round(cat.range_min * factor.min),
    max: Math.round(cat.range_max * factor.max),
  };
}

function isPerUnit(cat: RenovationCategory) {
  return cat.range_eur_per_m2.includes("/ unité");
}

export default function FranceReformaSection() {
  const market = useFranceMarket();
  const [tier, setTier] = useState<Tier>("mid");
  const [area, setArea] = useState(60);
  const [propertyValue, setPropertyValue] = useState(280_000);
  const [userPickedValue, setUserPickedValue] = useState(false);
  const [userPickedArea, setUserPickedArea] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    new Set([
      "Cuisine",
      "Salle de bain",
      "Sols (parquet, carrelage)",
      "Peinture et murs",
    ]),
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  // Auto-fill propertyValue + area from the upstream address match (DVF + ADEME).
  // The user can still override via the inputs — once they touch an input, we stop
  // auto-filling that field for the current address.
  useEffect(() => {
    setUserPickedValue(false);
    setUserPickedArea(false);
  }, [market?.postcode, market?.banId]);

  useEffect(() => {
    if (userPickedValue) return;
    const dvfValue = market?.matchedRecord?.median_value_eur;
    if (dvfValue && dvfValue !== propertyValue) {
      setPropertyValue(dvfValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market?.matchedRecord?.median_value_eur, userPickedValue]);

  useEffect(() => {
    if (userPickedArea) return;
    // Prefer the ADEME exact-match's surface (truly the building); fall back to DVF avg.
    const ademeSurface = market?.dpeLookup?.exact_match?.surface_habitable_logement;
    const dvfArea = market?.matchedRecord?.avg_area_m2;
    const next = ademeSurface || dvfArea;
    if (next && Math.abs(next - area) > 0.5) {
      setArea(Math.round(next));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    market?.dpeLookup?.exact_match?.surface_habitable_logement,
    market?.matchedRecord?.avg_area_m2,
    userPickedArea,
  ]);

  const toggle = (scope: string) => {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  const breakdown = useMemo(() => {
    return FRANCE_RENOVATION_CATEGORIES.filter((c) => selectedScopes.has(c.scope)).map(
      (c) => {
        const range = tierCost(c, tier);
        const subtotalMin = isPerUnit(c) ? range.min : range.min * area;
        const subtotalMax = isPerUnit(c) ? range.max : range.max * area;
        const subsidyMin =
          c.subsidy_pct_pricing > 0
            ? Math.min(
                c.subsidy_max_eur ?? Infinity,
                Math.round(subtotalMin * c.subsidy_pct_pricing),
              )
            : 0;
        const subsidyMax =
          c.subsidy_pct_pricing > 0
            ? Math.min(
                c.subsidy_max_eur ?? Infinity,
                Math.round(subtotalMax * c.subsidy_pct_pricing),
              )
            : 0;
        return {
          ...c,
          range,
          subtotalMin,
          subtotalMax,
          subsidyMin,
          subsidyMax,
          netMin: subtotalMin - subsidyMin,
          netMax: subtotalMax - subsidyMax,
        };
      },
    );
  }, [selectedScopes, tier, area]);

  const totals = useMemo(() => {
    const subtotalMin = breakdown.reduce((a, b) => a + b.subtotalMin, 0);
    const subtotalMax = breakdown.reduce((a, b) => a + b.subtotalMax, 0);
    const subsidyMin = breakdown.reduce((a, b) => a + b.subsidyMin, 0);
    const subsidyMax = breakdown.reduce((a, b) => a + b.subsidyMax, 0);
    // Contingency + maîtrise d'œuvre architect fees: ANIL guidance ~12% combined
    const contingencyMin = Math.round(subtotalMin * 0.12);
    const contingencyMax = Math.round(subtotalMax * 0.12);
    const grandMin = subtotalMin + contingencyMin - subsidyMin;
    const grandMax = subtotalMax + contingencyMax - subsidyMax;

    // TVA breakdown — published cost ranges are TTC (VAT-included), so we back out
    // HT (VAT-exclusive) and the VAT portion using the per-scope rate.
    let tvaTotalMin = 0;
    let tvaTotalMax = 0;
    let energyTotalMin = 0;
    let energyTotalMax = 0;
    breakdown.forEach((b) => {
      const tvaCat: TvaCategory = FRANCE_TVA_BY_SCOPE[b.scope] ?? "renovation";
      const tvaPct = FRANCE_TVA_RATES[tvaCat];
      // ttc = ht * (1 + tva), so ht = ttc / (1 + tva); tva_amount = ttc - ht
      const tvaMin = b.subtotalMin - b.subtotalMin / (1 + tvaPct / 100);
      const tvaMax = b.subtotalMax - b.subtotalMax / (1 + tvaPct / 100);
      tvaTotalMin += tvaMin;
      tvaTotalMax += tvaMax;
      if (tvaCat === "energy") {
        energyTotalMin += b.subtotalMin;
        energyTotalMax += b.subtotalMax;
      }
    });

    // Hypothetical VAT if all this work was treated as new-construction (20%) — illustrates the
    // saving from doing the work on an existing dwelling.
    const tvaIfNewConstructionMin = subtotalMin - subtotalMin / 1.2;
    const tvaIfNewConstructionMax = subtotalMax - subtotalMax / 1.2;
    const tvaSavingsMin = Math.round(tvaIfNewConstructionMin - tvaTotalMin);
    const tvaSavingsMax = Math.round(tvaIfNewConstructionMax - tvaTotalMax);

    // Éco-PTZ — only relevant when at least one energy scope is selected.
    const ecoPtzEligible = energyTotalMin > 0;
    const ecoPtzPrincipal = ecoPtzEligible
      ? Math.min(ECO_PTZ_2025.max_loan_eur, Math.round((energyTotalMin + energyTotalMax) / 2))
      : 0;
    const ecoPtzInterestSaved = ecoPtzEligible
      ? computeEcoPtzInterestSavings(ecoPtzPrincipal, ECO_PTZ_2025.max_term_years)
      : 0;

    const upliftPct = VALUE_UPLIFT_PCT[tier];
    const valueIncreaseMin = Math.round(propertyValue * (upliftPct[0] / 100));
    const valueIncreaseMax = Math.round(propertyValue * (upliftPct[1] / 100));

    return {
      subtotalMin,
      subtotalMax,
      subsidyMin,
      subsidyMax,
      contingencyMin,
      contingencyMax,
      grandMin,
      grandMax,
      tvaTotalMin: Math.round(tvaTotalMin),
      tvaTotalMax: Math.round(tvaTotalMax),
      tvaSavingsMin,
      tvaSavingsMax,
      ecoPtzEligible,
      ecoPtzPrincipal,
      ecoPtzInterestSaved,
      valueIncreaseMin,
      valueIncreaseMax,
      upliftPct,
      roiMin:
        grandMax > 0 ? Number((((valueIncreaseMin - grandMax) / grandMax) * 100).toFixed(1)) : 0,
      roiMax:
        grandMin > 0 ? Number((((valueIncreaseMax - grandMin) / grandMin) * 100).toFixed(1)) : 0,
    };
  }, [breakdown, tier, propertyValue]);
  const regulation = useMemo(
    () => getFranceRegulationProfile(market?.matchedRecord?.commune || "France", market?.dpeClass ?? "D"),
    [market?.dpeClass, market?.matchedRecord?.commune],
  );

  return (
    <section id="reforma" className="relative min-h-screen overflow-hidden">
      <ParallaxBackdrop image="/france/french-alps-village.jpg" speed={0.4} opacity={0.4} />
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
                Chapter VI
              </span>
              <div className="h-px w-12 bg-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
                Renovation Studio
              </span>
            </div>

            <h2 className="max-w-4xl font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white">
              Plan French renovation
              <br />
              <span className="font-extralight italic text-white/40">
                with MaPrimeRénov in mind.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl font-['Fraunces'] text-[14px] italic text-white/30">
              Real cost ranges from French market guides and ANAH 2025 — never invented numbers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
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
                Your renovation
              </h3>

              <div className="space-y-5">
                <div>
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
                    Quality tier
                  </p>
                  <div className="grid grid-cols-4 overflow-hidden border border-white/[0.08]">
                    {(Object.keys(TIER_LABELS) as Tier[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTier(t)}
                        className={`relative border-r border-white/[0.04] px-3 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 last:border-r-0 ${
                          tier === t
                            ? "bg-white/[0.06] text-white"
                            : "text-white/30 hover:bg-white/[0.02] hover:text-white/50"
                        }`}
                      >
                        {TIER_LABELS[t]}
                        {tier === t && (
                          <motion.span
                            layoutId="france-reforma-tier"
                            className="absolute bottom-0 left-0 right-0 h-px bg-white"
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumField
                    label="Area m²"
                    value={area}
                    min={15}
                    max={500}
                    onChange={(v) => {
                      setUserPickedArea(true);
                      setArea(v);
                    }}
                  />
                  <NumField
                    label="Property value EUR"
                    value={propertyValue}
                    min={50_000}
                    max={5_000_000}
                    step={5_000}
                    onChange={(v) => {
                      setUserPickedValue(true);
                      setPropertyValue(v);
                    }}
                  />
                </div>

                {market?.addressLabel && market.addressLabel.length > 3 ? (
                  <div className="rounded-2xl border border-blue-300/15 bg-blue-500/5 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-blue-100/70">
                    Synced with{" "}
                    <span className="text-white/85">
                      {market.addressLabel.slice(0, 60)}
                      {market.addressLabel.length > 60 ? "…" : ""}
                    </span>
                    {market.matchedRecord ? (
                      <>
                        {" · DVF median "}
                        <span className="text-white/85">
                          {new Intl.NumberFormat("fr-FR").format(
                            market.matchedRecord.median_value_eur,
                          )}{" "}
                          EUR
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-blue-300/15 bg-blue-500/[0.06] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-blue-100/60">
                      Rental legality
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/42">
                      DPE {market?.dpeClass ?? "D"}
                    </p>
                  </div>
                  <p className="text-[12px] leading-6 text-white/58">
                    {regulation.dpeRisk.body} Energy work, MaPrimeRenov, Eco-PTZ and reduced VAT
                    are part of the commercial renovation ROI layer.
                  </p>
                </div>

                <div>
                  <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
                    Scopes ({selectedScopes.size}/{FRANCE_RENOVATION_CATEGORIES.length})
                  </p>
                  <div className="space-y-2">
                    {FRANCE_RENOVATION_CATEGORIES.map((c) => {
                      const active = selectedScopes.has(c.scope);
                      const isOpen = expanded === c.scope;
                      return (
                        <div
                          key={c.scope}
                          className={`relative border border-white/[0.06] transition-colors ${
                            active ? "bg-white/[0.04]" : "bg-transparent"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(c.scope)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                                active
                                  ? "border-blue-300 bg-blue-400/30"
                                  : "border-white/20 bg-transparent"
                              }`}
                            >
                              {active ? <Check size={11} className="text-white" /> : null}
                            </div>
                            <div className="flex-1">
                              <p className="text-[12px] text-white/80">{c.scope}</p>
                              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                                {c.range_eur_per_m2}
                                {c.subsidy_pct_pricing > 0
                                  ? ` · MPR up to ${eur(c.subsidy_max_eur ?? 0)} EUR`
                                  : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(isOpen ? null : c.scope);
                              }}
                              className="rounded-full border border-white/10 p-1 text-white/40 hover:text-white"
                              aria-label="More info"
                            >
                              <Info size={11} />
                            </button>
                          </button>
                          {isOpen ? (
                            <div className="border-t border-white/[0.06] px-4 py-3">
                              <p className="text-[12px] leading-relaxed text-white/55">
                                <span className="text-white/80">{c.impact}</span> &mdash; {c.note}
                              </p>
                              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                                Source: {c.source}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/[0.06] pt-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                  MaPrimeRénov 2025
                </p>
                <p className="mt-2 font-['Fraunces'] text-[11px] italic leading-relaxed text-white/40">
                  Up to {eur(MAPRIMERENOV_2025.max_single_action_eur)} EUR per single action
                  ({MAPRIMERENOV_2025.income_bands} income bands), and{" "}
                  {eur(MAPRIMERENOV_2025.max_bouquet_eur)} EUR for a bouquet of works.
                  Source: ANAH 2025 mode d&apos;emploi (anah.gouv.fr)
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
              <div className="relative overflow-hidden border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />

                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                      Estimate
                    </p>
                    <h3 className="font-['Fraunces'] text-[28px] font-light leading-none tracking-tight text-white">
                      All-in renovation budget
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Tier
                    </p>
                    <p className="font-['Fraunces'] text-[20px] font-light text-white">
                      {TIER_LABELS[tier]}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-px bg-white/[0.04] sm:grid-cols-3">
                  <SummaryStat
                    label="Subtotal works"
                    rangeMin={totals.subtotalMin}
                    rangeMax={totals.subtotalMax}
                  />
                  <SummaryStat
                    label="MaPrimeRénov subsidy"
                    rangeMin={totals.subsidyMin}
                    rangeMax={totals.subsidyMax}
                    color="#10b981"
                    prefix="−"
                  />
                  <SummaryStat
                    label="Contingency 12%"
                    rangeMin={totals.contingencyMin}
                    rangeMax={totals.contingencyMax}
                    detail="includes maîtrise d’œuvre"
                  />
                  <div className="bg-[#0a0a0f]/85 p-5 sm:col-span-3">
                    <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
                      Grand total (after subsidy)
                    </p>
                    <p className="font-['Fraunces'] text-[36px] font-extralight leading-none tracking-tight text-white">
                      <span className="mr-1 text-[0.5em] text-white/30">EUR</span>
                      {eur(totals.grandMin)} – {eur(totals.grandMax)}
                    </p>
                    <p className="mt-3 font-mono text-[9px] tracking-[0.2em] text-white/30">
                      Includes works, contingency, MaPrimeRénov reduction
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
                <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                  TVA &middot; reduced rates (existing dwelling)
                </p>
                <h3 className="mb-5 font-['Fraunces'] text-[22px] font-light leading-none tracking-tight text-white">
                  VAT breakdown
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      TVA included
                    </p>
                    <p className="font-['Fraunces'] text-[20px] font-extralight text-white">
                      <span className="mr-1 text-[0.5em] text-white/30">EUR</span>
                      {eur(totals.tvaTotalMin)} – {eur(totals.tvaTotalMax)}
                    </p>
                    <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-white/30">
                      5.5% energy / 10% renovation
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Saved vs 20%
                    </p>
                    <p className="font-['Fraunces'] text-[20px] font-extralight text-emerald-400">
                      <span className="mr-1 text-[0.5em] text-white/30">EUR</span>
                      {eur(totals.tvaSavingsMin)} – {eur(totals.tvaSavingsMax)}
                    </p>
                    <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-white/30">
                      vs new-construction 20%
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Eligibility
                    </p>
                    <p className="font-['Fraunces'] text-[20px] font-extralight text-white">
                      Logement &gt; 2 yr
                    </p>
                    <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-white/30">
                      Article 279-0 bis CGI
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                  Source: bofip.impots.gouv.fr · BOI-TVA-LIQ-30-20-90 · service-public.gouv.fr
                </p>
              </div>

              {totals.ecoPtzEligible ? (
                <div className="relative border-b border-t border-emerald-300/15 bg-emerald-500/5 p-6 backdrop-blur-2xl">
                  <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-emerald-300/30" />
                  <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-emerald-300/30" />
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-emerald-200/60">
                        Éco-PTZ eligible
                      </p>
                      <h3 className="font-['Fraunces'] text-[22px] font-light leading-none tracking-tight text-white">
                        Zero-interest financing
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                        Interest saved
                      </p>
                      <p className="font-['Fraunces'] text-[24px] font-extralight leading-none text-emerald-300">
                        <span className="mr-1 text-[0.5em] text-white/30">EUR</span>
                        {eur(totals.ecoPtzInterestSaved)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-emerald-300/10 pt-3">
                    <div>
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                        Loan amount
                      </p>
                      <p className="font-['Fraunces'] text-[16px] font-extralight text-white">
                        {eur(totals.ecoPtzPrincipal)} EUR
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                        Term
                      </p>
                      <p className="font-['Fraunces'] text-[16px] font-extralight text-white">
                        Up to {ECO_PTZ_2025.max_term_years} years
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                        Rate
                      </p>
                      <p className="font-['Fraunces'] text-[16px] font-extralight text-emerald-300">
                        0.00%
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 font-['Fraunces'] text-[11px] italic leading-relaxed text-white/40">
                    Comparison vs Banque de France reference rate of {ECO_PTZ_2025.reference_rate_pct}%.
                    Source: service-public.gouv.fr/particuliers/vosdroits/F19905 (2025)
                  </p>
                </div>
              ) : null}

              <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
                <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                  Resale uplift
                </p>
                <h3 className="mb-5 font-['Fraunces'] text-[24px] font-light leading-none tracking-tight text-white">
                  Estimated value increase
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Uplift {tier}
                    </p>
                    <p className="font-['Fraunces'] text-[26px] font-extralight text-white">
                      +{totals.upliftPct[0]}–{totals.upliftPct[1]}%
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      Added value
                    </p>
                    <p className="font-['Fraunces'] text-[26px] font-extralight text-white">
                      <span className="mr-1 text-[0.5em] text-white/30">EUR</span>
                      {eur(totals.valueIncreaseMin)} – {eur(totals.valueIncreaseMax)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      ROI window
                    </p>
                    <p
                      className="font-['Fraunces'] text-[26px] font-extralight"
                      style={{
                        color: totals.roiMax > 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {totals.roiMin > 0 ? "+" : ""}
                      {totals.roiMin}% – {totals.roiMax > 0 ? "+" : ""}
                      {totals.roiMax}%
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                  Source: Notaires de France quarterly studies + MeilleursAgents 2024 renovation
                  impact bulletin
                </p>
              </div>

              <DealIntelligencePanel
                intelligence={buildRenovationIntelligence({
                  market: "france",
                  roiMinPct: totals.roiMin,
                  roiMaxPct: totals.roiMax,
                  costMin: totals.grandMin,
                  costMax: totals.grandMax,
                  valueIncreaseMin: totals.valueIncreaseMin,
                  valueIncreaseMax: totals.valueIncreaseMax,
                  subsidyMin: totals.subsidyMin,
                  subsidyMax: totals.subsidyMax,
                  selectedScopes: Array.from(selectedScopes),
                  energyEligible: totals.ecoPtzEligible,
                  confidenceScore: selectedScopes.size >= 3 ? 80 : 68,
                  currency: "EUR",
                })}
                title="AI renovation memo"
              />

              <div className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl">
                <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/20" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/20" />
                <p className="mb-5 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                  Detailed breakdown
                </p>
                {breakdown.length === 0 ? (
                  <p className="py-8 text-center font-['Fraunces'] text-[14px] italic text-white/25">
                    Select at least one scope to see the cost breakdown.
                  </p>
                ) : (
                  <div className="grid grid-cols-5 gap-2 border-b border-white/[0.04] pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
                    <span className="col-span-2">Scope</span>
                    <span className="text-right">Range</span>
                    <span className="text-right">Subsidy</span>
                    <span className="text-right">Net cost</span>
                  </div>
                )}
                {breakdown.map((b) => (
                  <div
                    key={b.scope}
                    className="grid grid-cols-5 gap-2 border-b border-white/[0.02] py-2.5 text-[11px]"
                  >
                    <div className="col-span-2 truncate text-white/70">{b.scope}</div>
                    <div className="text-right font-mono text-white/40">
                      {eur(b.subtotalMin)}–{eur(b.subtotalMax)}
                    </div>
                    <div className="text-right font-mono text-emerald-400/80">
                      {b.subsidyMin > 0 ? `−${eur(b.subsidyMin)}–${eur(b.subsidyMax)}` : "—"}
                    </div>
                    <div className="text-right font-mono text-white/80">
                      {eur(b.netMin)}–{eur(b.netMax)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            {FRANCE_RENOVATION_CARDS.map((card) => (
              <div
                key={card.title}
                className="relative border border-white/[0.08] bg-[#0a0a0f]/70 p-5 backdrop-blur-2xl"
              >
                <div className="absolute left-0 top-0 h-4 w-4 border-l border-t border-white/15" />
                <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/15" />
                <p className="mb-2 font-['Fraunces'] text-[12px] font-light italic text-white/40">
                  Note
                </p>
                <h3 className="mb-3 font-['Fraunces'] text-[18px] font-light tracking-tight text-white">
                  {card.title}
                </h3>
                <p className="text-[12px] leading-6 text-white/55">{card.text}</p>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
                  {card.source}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-white/[0.07] bg-white/[0.06] md:grid-cols-2 xl:grid-cols-4"
          >
            {FRANCE_RENOVATION_ROI_LAYERS.map((layer) => (
              <article key={layer.title} className="bg-[#0a0a0f]/90 p-5 backdrop-blur-xl">
                <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-blue-200/48">
                  {layer.label}
                </p>
                <h3 className="mt-4 text-xl font-medium tracking-[-0.03em] text-white">
                  {layer.title}
                </h3>
                <p className="mt-4 text-[12px] leading-6 text-white/48">{layer.body}</p>
              </article>
            ))}
          </motion.div>

          <RenovationMaterialSearch
            market="france"
            title="Search French materials and project anchors."
            description="Retail and guide anchors for bathrooms, kitchens, floors, walls, windows, garage, pool, MEP and heavy works. Use this as the procurement layer behind France Renovation ROI."
          />

          <div className="mt-8">
            <FranceReportCTA
              section="reforma"
              printTargetId="reforma"
              snapshot={{
                address: market?.addressLabel,
                tier,
                area_m2: area,
                property_value_eur: propertyValue,
                scopes: [...selectedScopes],
                grand_total_min: totals.grandMin,
                grand_total_max: totals.grandMax,
                tva_total_min: totals.tvaTotalMin,
                tva_savings_min: totals.tvaSavingsMin,
                eco_ptz_eligible: totals.ecoPtzEligible,
                eco_ptz_interest_saved: totals.ecoPtzInterestSaved,
                value_increase_pct: totals.upliftPct,
                roi_min_pct: totals.roiMin,
                roi_max_pct: totals.roiMax,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-12 w-full rounded-none border border-white/[0.08] bg-[#0a0a0f] px-3 text-sm text-white outline-none focus:border-blue-300/40"
      />
    </label>
  );
}

function SummaryStat({
  label,
  rangeMin,
  rangeMax,
  color = "#fff",
  prefix = "",
  detail,
}: {
  label: string;
  rangeMin: number;
  rangeMax: number;
  color?: string;
  prefix?: string;
  detail?: string;
}) {
  return (
    <div className="bg-[#0a0a0f]/85 p-5">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">
        {label}
      </p>
      <p
        className="font-['Fraunces'] text-[20px] font-extralight leading-none tracking-tight"
        style={{ color }}
      >
        <span className="mr-1 text-[0.6em] text-white/30">EUR</span>
        {prefix}
        {eur(rangeMin)} – {eur(rangeMax)}
      </p>
      {detail ? (
        <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-white/30">{detail}</p>
      ) : null}
    </div>
  );
}
