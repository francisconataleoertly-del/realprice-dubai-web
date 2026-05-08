import { demoDubaiMandatePack, type MandatePackComparable, type MandatePackReport } from "@/data/mandate-pack-demo";
import { buildDubaiReliability, type ValuationReliability } from "@/lib/valuation-reliability";

export type DubaiMandatePackResult = {
  zona: string;
  rooms: string;
  area_m2: number;
  predicted_aed: number;
  predicted_usd: number;
  predicted_per_sqft_aed: number;
  confidence_low_aed: number;
  confidence_high_aed: number;
  property_type: string;
  inference_source?: string;
  source_support_count?: number;
  source_recent_count?: number;
  source_dominance_pct?: number;
  inferred_is_freehold?: boolean;
  inferred_is_offplan?: boolean;
  inferred_has_parking?: boolean;
  resolved_zone?: string;
  resolved_building?: string;
  valuation_mode?: string;
  unit_distribution_source?: string;
  unit_distribution_count?: number;
  unit_area_segment?: string;
  unit_distribution_low_aed?: number;
  unit_distribution_high_aed?: number;
  confidence_pct?: number;
  reliability?: ValuationReliability;
};

export type DubaiMandatePackComparable = {
  date: string;
  building: string;
  rooms: string;
  area_m2: number;
  price_aed: number;
  type: string;
};

export type DubaiMandatePackSession = {
  savedAt: string;
  addressText: string;
  result: DubaiMandatePackResult;
  comparables: DubaiMandatePackComparable[];
};

const STORAGE_KEY = "fonatprop.latestDubaiMandatePack";
const HISTORY_KEY = "fonatprop.dubaiMandatePackHistory";
const MAX_HISTORY = 6;

function asAreaSqft(areaM2: number) {
  return Math.round(areaM2 * 10.7639);
}

function cleanText(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function mapPropertyType(type: string | undefined) {
  if (!type) return "Property";
  if (type === "Flat") return "Apartment";
  if (type === "TownHouse") return "Townhouse";
  return type;
}

function buildSignals(session: DubaiMandatePackSession) {
  const result = session.result;
  const supportCount = Number(result.source_support_count || 0);
  const recentCount = Number(result.source_recent_count || 0);
  const confidencePct = Number(result.confidence_pct || 12.7);
  const zone = cleanText(result.resolved_zone || result.zona, "Dubai");
  const building = cleanText(result.resolved_building, "the resolved building");

  return [
    {
      label: "Liquidity",
      value: supportCount >= 25 ? "High" : supportCount >= 10 ? "Medium" : "Thin",
      detail:
        supportCount >= 25
          ? `${supportCount} supporting transactions keep the pricing conversation easier to defend in ${zone}.`
          : `Comparable depth is lighter in ${zone}, so the broker should validate finish level and active competition.`,
    },
    {
      label: "Evidence mode",
      value: cleanText(result.inference_source, "Model evidence").replace(/_/g, " "),
      detail: `${building} is being priced from ${cleanText(result.inference_source, "market")} evidence plus AI model output.`,
    },
    {
      label: "Confidence",
      value: confidencePct <= 14 ? "Tight range" : "Needs review",
      detail:
        recentCount > 0
          ? `${recentCount} recent records support the current range.`
          : "Recent-transaction support is limited, so broker review matters more.",
    },
  ];
}

function buildNextActions(session: DubaiMandatePackSession) {
  const result = session.result;
  const building = cleanText(result.resolved_building, "the building");
  const parking = result.inferred_has_parking === false ? "parking status" : "parking and title details";

  return [
    `Confirm exact floor, view line and ${parking} before publishing ${building}.`,
    "Start with the target price and review lead quality within the first 7 to 10 days.",
    "Use the comparables and confidence band in the owner call before discussing negotiation range.",
  ];
}

function buildBrokerNotes(session: DubaiMandatePackSession) {
  const result = session.result;
  const confidencePct = Number(result.confidence_pct || 12.7);
  return [
    confidencePct > 15
      ? "The confidence band is wider than ideal, so anchor the owner conversation around the range, not one exact number."
      : "The confidence band is tight enough to position the target price as the primary recommendation.",
    "Keep the negotiation floor private and only use it after the first pricing objection from the owner.",
    "If media quality is weak, the listing may underperform even when the asking price is fair.",
  ];
}

function buildComparables(comparables: DubaiMandatePackComparable[], result: DubaiMandatePackResult): MandatePackComparable[] {
  if (!comparables.length) return [];
  return comparables.slice(0, 5).map((item, index) => {
    const areaSqft = asAreaSqft(Number(item.area_m2 || result.area_m2 || 0));
    const pricePerSqft = areaSqft > 0 ? Math.round(Number(item.price_aed || 0) / areaSqft) : 0;
    return {
      building: cleanText(item.building, result.resolved_building || result.resolved_zone || "Comparable"),
      date: cleanText(item.date, `2026-0${Math.min(index + 1, 9)}-15`),
      rooms: cleanText(item.rooms, result.rooms),
      area_m2: Number(item.area_m2 || result.area_m2 || 0),
      area_sqft: areaSqft,
      price_aed: Number(item.price_aed || 0),
      price_per_sqft_aed: pricePerSqft,
      similarity_label: index < 2 ? "Very close" : index < 4 ? "Close" : "Supporting comp",
    };
  });
}

export function buildMandatePackFromDubaiSession(session: DubaiMandatePackSession): MandatePackReport {
  const result = session.result;
  const predictedAed = Number(result.predicted_aed || 0);
  const areaM2 = Number(result.area_m2 || 0);
  const areaSqft = asAreaSqft(areaM2);
  const zone = cleanText(result.resolved_zone || result.zona, demoDubaiMandatePack.property.community);
  const building = cleanText(result.resolved_building, demoDubaiMandatePack.property.building);
  const supportCount = Number(result.source_support_count || result.unit_distribution_count || 0);
  const confidencePct = Number(result.confidence_pct || 12.7);
  const targetAed = Math.round(predictedAed);
  const fastSaleAed = Math.round(targetAed * 0.97);
  const ambitiousAed = Math.round(targetAed * 1.035);
  const negotiationFloor = Math.round(Math.max(Number(result.confidence_low_aed || fastSaleAed), targetAed * 0.955));
  const reliability = result.reliability || buildDubaiReliability(result);

  return {
    ...demoDubaiMandatePack,
    id: `${building.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-mandate-pack`,
    generated_at: session.savedAt,
    subtitle: "Seller-ready valuation report built from the latest Dubai AI valuation.",
    seller_summary:
      supportCount >= 20
        ? `This property sits inside a liquid ${zone} segment with enough comparable support to defend a clear target listing price without relying only on broker opinion.`
        : `This property sits inside ${zone}, but the broker should still confirm finish level, view and active competition before locking the final asking price.`,
    property: {
      address: cleanText(session.addressText, `${building}, ${zone}, Dubai`),
      building,
      community: zone,
      type: mapPropertyType(result.property_type),
      rooms: cleanText(result.rooms, demoDubaiMandatePack.property.rooms),
      area_m2: areaM2,
      area_sqft: areaSqft,
      status: result.inferred_is_offplan ? "Off-plan" : "Ready",
      parking: result.inferred_has_parking === false ? "Not confirmed" : "Included or to be confirmed",
      view: "View and finish to be confirmed by broker",
    },
    valuation: {
      predicted_aed: targetAed,
      predicted_usd: Number(result.predicted_usd || Math.round(targetAed / 3.67)),
      confidence_low_aed: Number(result.confidence_low_aed || fastSaleAed),
      confidence_high_aed: Number(result.confidence_high_aed || ambitiousAed),
      confidence_pct: confidencePct,
      price_per_sqft_aed: Number(result.predicted_per_sqft_aed || (areaSqft > 0 ? Math.round(targetAed / areaSqft) : 0)),
      price_per_m2_aed: areaM2 > 0 ? Math.round(targetAed / areaM2) : 0,
      evidence_scope: cleanText(result.inference_source, "AI valuation evidence").replace(/_/g, " "),
    },
    listing_strategy: {
      fast_sale_aed: fastSaleAed,
      target_aed: targetAed,
      ambitious_aed: ambitiousAed,
      recommended_label: "Target price",
      expected_days_live: confidencePct <= 14 ? "21 to 45 days" : "30 to 60 days",
      negotiation_floor_aed: negotiationFloor,
    },
    market_signals: buildSignals(session),
    next_actions: buildNextActions(session),
    broker_notes: buildBrokerNotes(session),
    comparables: buildComparables(session.comparables, result),
    reliability,
  };
}

export function saveLatestDubaiMandatePackSession(session: DubaiMandatePackSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    const history = loadDubaiMandatePackHistory().filter(
      (item) =>
        !(
          item.savedAt === session.savedAt &&
          item.addressText === session.addressText &&
          item.result.predicted_aed === session.result.predicted_aed
        ),
    );
    const nextHistory = [session, ...history].slice(0, MAX_HISTORY);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  } catch {
    // ignore localStorage failures
  }
}

export function loadLatestDubaiMandatePackSession(): DubaiMandatePackSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DubaiMandatePackSession;
  } catch {
    return null;
  }
}

export function loadDubaiMandatePackHistory(): DubaiMandatePackSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DubaiMandatePackSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
