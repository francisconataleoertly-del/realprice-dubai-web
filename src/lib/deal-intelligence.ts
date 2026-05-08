export type DealTone = "emerald" | "blue" | "amber" | "red";

export type DealMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: DealTone;
};

export type DealIntelligence = {
  score: number;
  label: string;
  tone: DealTone;
  summary: string;
  confidenceLabel: string;
  metrics: DealMetric[];
  risks: string[];
  nextActions: string[];
};

type Market = "dubai" | "france";

type InvestmentInput = {
  market: Market;
  grossYieldPct: number;
  netYieldPct?: number;
  annualCashFlow?: number;
  monthlyCashFlow?: number;
  cagrPct?: number;
  confidenceScore?: number;
  currency: "AED" | "EUR";
};

type RenovationInput = {
  market: Market;
  roiPct?: number;
  roiMinPct?: number;
  roiMaxPct?: number;
  costMin?: number;
  costMax?: number;
  valueIncreaseMin?: number;
  valueIncreaseMax?: number;
  subsidyMin?: number;
  subsidyMax?: number;
  selectedScopes?: string[];
  energyEligible?: boolean;
  confidenceScore?: number;
  currency: "AED" | "EUR";
};

type ValuationInput = {
  market: Market;
  estimate: number;
  low: number;
  high: number;
  supportCount?: number;
  recentCount?: number;
  confidencePct?: number;
  valuationMode?: string;
  dpeClass?: string;
  currency: "AED" | "EUR";
};

const TARGET_GROSS_YIELD: Record<Market, number> = {
  dubai: 6.5,
  france: 5.0,
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const fmtPct = (value: number, decimals = 1) => `${value.toFixed(decimals)}%`;

const fmtMoney = (value: number | undefined, currency: "AED" | "EUR") => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${currency} ${new Intl.NumberFormat(currency === "EUR" ? "fr-FR" : "en-AE", {
    maximumFractionDigits: 0,
  }).format(value)}`;
};

function labelFromScore(score: number, kind: "investment" | "renovation") {
  if (score >= 78) {
    return {
      label: kind === "investment" ? "AI investment-grade" : "High-ROI renovation",
      tone: "emerald" as const,
      confidenceLabel: "High confidence",
    };
  }
  if (score >= 62) {
    return {
      label: kind === "investment" ? "Qualified opportunity" : "Qualified upgrade",
      tone: "blue" as const,
      confidenceLabel: "Good confidence",
    };
  }
  if (score >= 45) {
    return {
      label: kind === "investment" ? "Needs underwriting" : "Review scope",
      tone: "amber" as const,
      confidenceLabel: "Medium confidence",
    };
  }
  return {
    label: kind === "investment" ? "High-risk deal" : "Low-return works",
    tone: "red" as const,
    confidenceLabel: "Low confidence",
  };
}

export function buildInvestmentIntelligence(input: InvestmentInput): DealIntelligence {
  const target = TARGET_GROSS_YIELD[input.market];
  const cashFlow = input.annualCashFlow ?? (input.monthlyCashFlow ?? 0) * 12;
  const cagr = input.cagrPct ?? 0;
  const confidence = input.confidenceScore ?? 72;
  const netYield = input.netYieldPct ?? input.grossYieldPct;

  const yieldScore = clamp(50 + (input.grossYieldPct - target) * 9);
  const netYieldScore = clamp(50 + (netYield - target + 0.8) * 8);
  const cashFlowScore = cashFlow >= 0 ? 76 : clamp(45 + cashFlow / 2500);
  const growthScore = clamp(50 + cagr * 8);
  const score = Math.round(
    yieldScore * 0.34 +
      netYieldScore * 0.16 +
      cashFlowScore * 0.22 +
      growthScore * 0.14 +
      clamp(confidence) * 0.14,
  );

  const label = labelFromScore(score, "investment");
  const risks: string[] = [];
  const nextActions: string[] = [];

  if (input.grossYieldPct < target) {
    risks.push(`Yield is below the ${input.market === "dubai" ? "Dubai" : "France"} target benchmark.`);
  }
  if (cashFlow < 0) risks.push("Cash flow is negative after financing assumptions.");
  if (confidence < 65) risks.push("Market confidence is not high enough for automatic approval.");
  if (input.market === "france" && input.grossYieldPct - netYield > 1.4) {
    risks.push("French tax and operating costs materially reduce the gross yield.");
  }
  if (input.market === "dubai" && input.grossYieldPct >= target && cashFlow >= 0) {
    nextActions.push("Verify building service charges and recent DLD/Ejari comparables.");
  } else if (input.market === "france") {
    nextActions.push("Check DPE class, rent-cap rules and local notary comparables.");
  }
  nextActions.push("Stress-test mortgage rate, vacancy and exit price before offer.");
  nextActions.push("Save this as an investor memo with evidence links and assumptions.");

  return {
    score,
    label: label.label,
    tone: label.tone,
    confidenceLabel: label.confidenceLabel,
    summary:
      score >= 62
        ? "The AI underwriting stack sees a viable deal, but it still needs source-level verification before money moves."
        : "The model is flagging weak economics or missing evidence. Treat this as a lead, not an approved purchase.",
    metrics: [
      { label: "AI score", value: `${score}/100`, tone: label.tone },
      { label: "Gross yield", value: fmtPct(input.grossYieldPct), detail: `Target ${fmtPct(target)}` },
      { label: "Net yield", value: fmtPct(netYield), detail: "After local cost logic" },
      {
        label: "Cash flow",
        value: fmtMoney(cashFlow, input.currency),
        detail: "Annual estimate",
        tone: cashFlow >= 0 ? "emerald" : "red",
      },
    ],
    risks: risks.length ? risks : ["No major red flags from the current assumptions."],
    nextActions,
  };
}

export function buildRenovationIntelligence(input: RenovationInput): DealIntelligence {
  const roi =
    typeof input.roiPct === "number"
      ? input.roiPct
      : ((input.roiMinPct ?? 0) + (input.roiMaxPct ?? 0)) / 2;
  const scopeCount = input.selectedScopes?.length ?? 0;
  const confidence = input.confidenceScore ?? (scopeCount > 0 ? 72 : 45);
  const subsidy = ((input.subsidyMin ?? 0) + (input.subsidyMax ?? 0)) / 2;
  const cost = ((input.costMin ?? 0) + (input.costMax ?? 0)) / 2;
  const uplift = ((input.valueIncreaseMin ?? 0) + (input.valueIncreaseMax ?? 0)) / 2;

  const roiScore = clamp(48 + roi * 1.8);
  const evidenceScore = clamp(confidence + Math.min(scopeCount, 6) * 3);
  const subsidyScore = subsidy > 0 ? 78 : input.market === "france" && input.energyEligible ? 70 : 55;
  const costDisciplineScore = cost > 0 && uplift > 0 ? clamp(55 + ((uplift - cost) / cost) * 35) : 42;
  const score = Math.round(
    roiScore * 0.38 + evidenceScore * 0.22 + subsidyScore * 0.16 + costDisciplineScore * 0.24,
  );

  const label = labelFromScore(score, "renovation");
  const risks: string[] = [];
  const nextActions: string[] = [];

  if (scopeCount === 0) risks.push("No renovation scope selected yet.");
  if (roi < 0) risks.push("Estimated uplift does not cover the works budget.");
  if (cost > 0 && input.costMax && input.costMin && input.costMax / Math.max(input.costMin, 1) > 1.8) {
    risks.push("Cost band is wide, so contractor quotes can change the result.");
  }
  if (input.market === "france" && !input.energyEligible) {
    risks.push("Energy-aid eligibility is limited unless DPE works are included.");
  }
  if (input.market === "dubai") {
    nextActions.push("Confirm NOC, fit-out permits and service-charge impact before works.");
  } else {
    nextActions.push("Validate MaPrimeRenov, VAT rate and DPE impact before final budget.");
  }
  nextActions.push("Request 3 contractor quotes and lock the scope by room/material tier.");
  nextActions.push("Compare post-renovation value against real nearby transactions.");

  return {
    score,
    label: label.label,
    tone: label.tone,
    confidenceLabel: label.confidenceLabel,
    summary:
      score >= 62
        ? "The renovation case can create measurable value if scope, permits and contractor pricing stay controlled."
        : "The works need tighter scope or better evidence before presenting them as an investment thesis.",
    metrics: [
      { label: "AI score", value: `${score}/100`, tone: label.tone },
      { label: "ROI window", value: typeof input.roiPct === "number" ? fmtPct(input.roiPct) : `${fmtPct(input.roiMinPct ?? 0)} - ${fmtPct(input.roiMaxPct ?? 0)}` },
      { label: "Works budget", value: input.costMax ? `${fmtMoney(input.costMin, input.currency)} - ${fmtMoney(input.costMax, input.currency)}` : fmtMoney(cost, input.currency) },
      {
        label: input.market === "france" ? "Subsidy" : "Value uplift",
        value:
          input.market === "france"
            ? fmtMoney(subsidy, input.currency)
            : input.valueIncreaseMax
              ? `${fmtMoney(input.valueIncreaseMin, input.currency)} - ${fmtMoney(input.valueIncreaseMax, input.currency)}`
              : fmtMoney(uplift, input.currency),
        tone: "emerald",
      },
    ],
    risks: risks.length ? risks : ["No major renovation red flags from the current scope."],
    nextActions,
  };
}

export function buildValuationIntelligence(input: ValuationInput): DealIntelligence {
  const rangePct =
    input.estimate > 0 ? ((input.high - input.low) / 2 / input.estimate) * 100 : input.confidencePct ?? 30;
  const support = input.supportCount ?? 0;
  const recent = input.recentCount ?? 0;
  const declaredConfidence = input.confidencePct ?? rangePct;

  const rangeScore = clamp(92 - rangePct * 2.2);
  const supportScore = clamp(42 + Math.log10(Math.max(support, 1)) * 18);
  const recentScore = recent > 0 ? clamp(48 + Math.log10(Math.max(recent, 1)) * 18) : supportScore - 8;
  const modeScore = input.valuationMode?.includes("fallback") ? 48 : 76;
  const score = Math.round(rangeScore * 0.34 + supportScore * 0.24 + recentScore * 0.18 + modeScore * 0.14 + clamp(100 - declaredConfidence) * 0.1);
  const label = labelFromScore(score, "investment");

  const risks: string[] = [];
  const nextActions: string[] = [];

  if (rangePct > 18) risks.push("The confidence range is wide, so the value should be presented as a band.");
  if (support > 0 && support < 25) risks.push("Comparable support is thin for a high-confidence automated valuation.");
  if (input.valuationMode?.includes("fallback")) risks.push("Fallback logic was used because the exact address/profile was not fully matched.");
  if (input.market === "france" && input.dpeClass && ["E", "F", "G"].includes(input.dpeClass)) {
    risks.push("DPE class can create rental, financing or resale friction.");
  }

  if (input.market === "dubai") {
    nextActions.push("Attach recent DLD comparables before sending a broker-facing report.");
    nextActions.push("Validate building, unit size and parking/freehold assumptions.");
  } else {
    nextActions.push("Check DVF comparables, DPE class and commune-level liquidity.");
    nextActions.push("Add BAN geocoding and Georisques layers for address-grade confidence.");
  }
  nextActions.push("Show the range to clients; keep the exact AVM logic internal.");

  return {
    score,
    label:
      score >= 78
        ? "High-confidence AVM"
        : score >= 62
          ? "Usable valuation"
          : score >= 45
            ? "Needs comparables"
            : "Low-confidence AVM",
    tone: label.tone,
    confidenceLabel: label.confidenceLabel,
    summary:
      score >= 62
        ? "The AI valuation is strong enough for a client experience, with the range and evidence kept visible."
        : "The model can guide the conversation, but it needs better address matching or comparable support before relying on it.",
    metrics: [
      { label: "AI score", value: `${score}/100`, tone: label.tone },
      { label: "Estimate", value: fmtMoney(input.estimate, input.currency) },
      { label: "Value band", value: `${fmtMoney(input.low, input.currency)} - ${fmtMoney(input.high, input.currency)}` },
      {
        label: "Evidence",
        value: support > 0 ? `${support} tx` : "Market layer",
        detail: recent > 0 ? `${recent} recent` : "Current support",
      },
    ],
    risks: risks.length ? risks : ["No major valuation reliability red flags from the current evidence."],
    nextActions,
  };
}
