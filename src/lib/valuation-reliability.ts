export type ReliabilityLevel = "high" | "medium" | "low";

export type ReliabilityEvidence = {
  label: string;
  value: string;
  detail?: string;
};

export type ValuationReliability = {
  level: ReliabilityLevel;
  score: number;
  label: string;
  warnings: string[];
  evidence: ReliabilityEvidence[];
  methodology: string[];
};

type DubaiReliabilityInput = {
  confidence_pct?: number | string | null;
  confidence_low_aed?: number | string | null;
  confidence_high_aed?: number | string | null;
  inference_source?: string | null;
  valuation_mode?: string | null;
  resolved_zone?: string | null;
  zona?: string | null;
  resolved_building?: string | null;
  building_name?: string | null;
  source_support_count?: number | string | null;
  source_recent_count?: number | string | null;
  source_dominance_pct?: number | string | null;
  unit_distribution_source?: string | null;
  unit_distribution_count?: number | string | null;
  unit_distribution_low_aed?: number | string | null;
  unit_distribution_high_aed?: number | string | null;
  calibration_method?: string | null;
};

type FranceReliabilityInput = {
  valuation_mode?: string;
  confidence_pct?: number;
  record?: {
    commune: string;
    department_code: string;
    property_type: string;
    transactions: number;
    median_price_per_m2: number;
    median_value_eur: number;
    avg_area_m2: number;
  } | null;
  match_context?: {
    strategy?: string;
    postal_code?: string | null;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatInt(value: unknown) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(asNumber(value));
}

function scoreLabel(score: number): { level: ReliabilityLevel; label: string } {
  if (score >= 82) return { level: "high", label: "High confidence" };
  if (score >= 62) return { level: "medium", label: "Review recommended" };
  return { level: "low", label: "Broker review required" };
}

export function buildDubaiReliability(input: DubaiReliabilityInput): ValuationReliability {
  const confidencePct = asNumber(input.confidence_pct, 20);
  const supportCount = asNumber(input.source_support_count || input.unit_distribution_count);
  const recentCount = asNumber(input.source_recent_count);
  const dominancePct = asNumber(input.source_dominance_pct);
  const source = String(input.inference_source || input.valuation_mode || "").toLowerCase();
  const unitCount = asNumber(input.unit_distribution_count);
  const hasBuilding = Boolean(input.resolved_building || input.building_name);
  const hasUnitBand = Boolean(input.unit_distribution_low_aed && input.unit_distribution_high_aed);

  let score = 68;
  if (source.includes("building")) score += 10;
  else if (source.includes("project")) score += 6;
  else if (source.includes("zone")) score -= 4;
  else if (source.includes("fallback")) score -= 8;

  if (supportCount >= 50) score += 10;
  else if (supportCount >= 15) score += 7;
  else if (supportCount >= 5) score += 3;
  else if (supportCount > 0) score -= 4;
  else score -= 10;

  if (unitCount >= 20) score += 7;
  else if (unitCount >= 5) score += 4;
  if (hasUnitBand) score += 3;

  if (confidencePct <= 13) score += 9;
  else if (confidencePct <= 18) score += 5;
  else if (confidencePct >= 24) score -= 9;

  if (recentCount >= 5) score += 5;
  else if (recentCount === 0) score -= 4;

  if (dominancePct >= 60) score += 4;
  else if (dominancePct > 0 && dominancePct < 40) score -= 4;

  if (!hasBuilding) score -= 5;

  score = clamp(Math.round(score), 32, 96);
  const { level, label } = scoreLabel(score);
  const warnings: string[] = [];

  if (!hasBuilding) {
    warnings.push("Building-level match is not confirmed, so the result should be checked by a broker.");
  }
  if (source.includes("zone") || source.includes("fallback")) {
    warnings.push("The valuation is using zone-level evidence because a stronger building profile was not available.");
  }
  if (supportCount > 0 && supportCount < 10) {
    warnings.push("Comparable depth is limited for this address profile.");
  }
  if (confidencePct >= 20) {
    warnings.push("The confidence band is wide, which usually means property details need verification.");
  }

  const evidence: ReliabilityEvidence[] = [
    {
      label: "Location match",
      value: input.resolved_building || input.resolved_zone || input.zona || "Dubai profile",
      detail: source || "DLD model evidence",
    },
    {
      label: "Comparable depth",
      value: supportCount ? `${formatInt(supportCount)} DLD transactions` : "DLD AVM response",
      detail: recentCount ? `${formatInt(recentCount)} recent records` : "Recent count unavailable",
    },
    {
      label: "Confidence band",
      value: `+/- ${confidencePct.toFixed(1)}%`,
      detail:
        input.confidence_low_aed && input.confidence_high_aed
          ? `AED ${formatInt(input.confidence_low_aed)} to AED ${formatInt(input.confidence_high_aed)}`
          : "Range supplied by model",
    },
  ];

  if (input.unit_distribution_source) {
    evidence.push({
      label: "Unit evidence",
      value: `${input.unit_distribution_source} segment`,
      detail: unitCount ? `${formatInt(unitCount)} comparable unit records` : "Distribution source active",
    });
  }

  return {
    level,
    score,
    label,
    warnings,
    evidence,
    methodology: [
      "Dubai valuation uses verified DLD transaction-trained AVM output.",
      "When address details are incomplete, FonatProp anchors the result to building, project or zone profiles.",
      "Broker confirmation is still required for floor, view, condition, payment terms and live listing intent.",
    ],
  };
}

export function buildFranceReliability(input: FranceReliabilityInput): ValuationReliability {
  const record = input.record || null;
  const transactions = record?.transactions || 0;
  const confidencePct = asNumber(input.confidence_pct, transactions >= 500 ? 18 : 24);
  const strategy = input.match_context?.strategy || "national_fallback";

  let score = record ? 64 : 42;
  if (transactions >= 20_000) score += 18;
  else if (transactions >= 8_000) score += 14;
  else if (transactions >= 2_000) score += 10;
  else if (transactions >= 500) score += 5;
  else score -= 8;

  if (strategy.includes("postal_code") || strategy.includes("arrondissement")) score += 6;
  else if (strategy.includes("commune")) score += 3;
  else if (strategy.includes("fallback")) score -= 12;

  if (confidencePct <= 12) score += 8;
  else if (confidencePct <= 18) score += 4;
  else if (confidencePct >= 24) score -= 8;

  score = clamp(Math.round(score), 30, 94);
  const { level, label } = scoreLabel(score);
  const warnings: string[] = [];

  if (!record) {
    warnings.push("No commune-level DVF match was found, so the result falls back to national market statistics.");
  }
  if (record && transactions < 500) {
    warnings.push("Transaction volume is thin for this commune and property type.");
  }
  if (!strategy.includes("postal_code") && !strategy.includes("arrondissement")) {
    warnings.push("Address-level parcel, DPE and cadastre matching are not yet attached to this estimate.");
  }

  return {
    level,
    score,
    label,
    warnings,
    evidence: [
      {
        label: "Official source",
        value: "DVF open data",
        detail: "French notarial transaction filings published by DGFiP/data.gouv.fr.",
      },
      {
        label: "Market match",
        value: record ? `${record.commune}, Dept. ${record.department_code}` : "France national median",
        detail: strategy.replace(/_/g, " "),
      },
      {
        label: "Comparable depth",
        value: record ? `${formatInt(record.transactions)} DVF transactions` : "National DVF coverage",
        detail: record ? `${record.property_type} median ${formatInt(record.median_price_per_m2)} EUR/m2` : undefined,
      },
      {
        label: "Confidence band",
        value: `+/- ${confidencePct.toFixed(1)}%`,
        detail: "Statistical range from commune liquidity and sample size.",
      },
    ],
    methodology: [
      "France valuation uses cleaned DVF residential transactions by commune and property type.",
      "The next precision layer is BAN address geocoding, cadastre parcel matching, DPE energy class and Georisques.",
      "For a professional mandate, the broker should confirm condition, floor, exact address and renovation scope.",
    ],
  };
}
