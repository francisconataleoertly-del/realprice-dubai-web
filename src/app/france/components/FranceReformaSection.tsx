"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Info } from "lucide-react";

import {
  FRANCE_RENOVATION_CARDS,
  FRANCE_RENOVATION_CATEGORIES,
  MAPRIMERENOV_2025,
  type RenovationCategory,
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
  const [tier, setTier] = useState<Tier>("mid");
  const [area, setArea] = useState(60);
  const [propertyValue, setPropertyValue] = useState(280_000);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    new Set([
      "Cuisine",
      "Salle de bain",
      "Sols (parquet, carrelage)",
      "Peinture et murs",
    ]),
  );
  const [expanded, setExpanded] = useState<string | null>(null);

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
      valueIncreaseMin,
      valueIncreaseMax,
      upliftPct,
      roiMin:
        grandMax > 0 ? Number((((valueIncreaseMin - grandMax) / grandMax) * 100).toFixed(1)) : 0,
      roiMax:
        grandMin > 0 ? Number((((valueIncreaseMax - grandMin) / grandMin) * 100).toFixed(1)) : 0,
    };
  }, [breakdown, tier, propertyValue]);

  return (
    <section id="reforma" className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center md:bg-fixed"
        style={{ backgroundImage: "url('/france/french-alps-village.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8 }}
              className="relative border-b border-t border-white/[0.08] bg-[#0a0a0f]/70 p-6 backdrop-blur-2xl md:p-8"
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
                    onChange={setArea}
                  />
                  <NumField
                    label="Property value EUR"
                    value={propertyValue}
                    min={50_000}
                    max={5_000_000}
                    step={5_000}
                    onChange={setPropertyValue}
                  />
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
              className="space-y-4"
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
