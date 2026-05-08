import dubaiProfilesData from "@/app/realprice/data/realprice-address-profiles-v4-slim.json";
import type { RadarListing, RadarSignal } from "@/components/radar/MarketRadarSection";
import type { FrancePropertyType } from "@/lib/france-market";
import { estimateFranceValueV2 } from "@/lib/server/france-valuation-v2";
import { buildDubaiReliability } from "@/lib/valuation-reliability";

export type PublishedPropertyMarket = "dubai" | "france";

export type PublishedPropertyInput = {
  market: PublishedPropertyMarket;
  title: string;
  address?: string;
  zone?: string;
  property_type?: string;
  rooms?: string | number;
  area_m2: number;
  asking_price: number;
  image_url?: string;
  status?: "draft" | "published" | "archived";
};

export type PublishedPropertyRow = {
  id: string;
  market: PublishedPropertyMarket;
  title: string;
  address: string | null;
  zone: string | null;
  property_type: string;
  rooms: string | null;
  area_m2: number;
  asking_price: number;
  estimated_value: number;
  low_value: number | null;
  high_value: number | null;
  diff_pct: number;
  signal: RadarSignal;
  confidence_score: number;
  source_label: string | null;
  source_transactions: number | null;
  image_url: string | null;
  status: "draft" | "published" | "archived";
  valuation_payload?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

type DubaiProfileRow = {
  name: string;
  normalized: string;
  zone?: string;
  project?: string;
  count: number;
  recent_count: number;
  dominance_pct: number;
  property_type: string;
  rooms: string;
  area_m2: number;
  median_price_aed?: number;
  latest_date?: string;
};

type DubaiProfilePayload = {
  building_profiles: DubaiProfileRow[];
  project_profiles: DubaiProfileRow[];
  zone_profiles: DubaiProfileRow[];
};

const dubaiProfiles = dubaiProfilesData as DubaiProfilePayload;

function normalize(value: unknown) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function classifySignal(diffPct: number, low?: number | null, high?: number | null, asking?: number) {
  if (asking && low && asking <= low) return "green";
  if (asking && high && asking >= high) return "red";
  if (diffPct <= -8) return "green";
  if (diffPct >= 8) return "red";
  return "yellow";
}

function roomLabel(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/studio/i.test(raw)) return "Studio";
  const number = raw.match(/\d+/)?.[0];
  return number ? `${number} BR` : raw;
}

function findDubaiProfile(input: PublishedPropertyInput) {
  const search = normalize([input.title, input.address, input.zone].filter(Boolean).join(" "));
  const zone = normalize(input.zone);
  const buckets = [
    { source: "building", rows: dubaiProfiles.building_profiles },
    { source: "project", rows: dubaiProfiles.project_profiles },
    { source: "zone", rows: dubaiProfiles.zone_profiles },
  ] as const;

  for (const bucket of buckets) {
    const exact = bucket.rows.find((row) => normalize(row.name) && search.includes(normalize(row.name)));
    if (exact?.median_price_aed) return { source: bucket.source, profile: exact };
  }

  if (zone) {
    const zoneMatch = dubaiProfiles.zone_profiles.find((row) => normalize(row.name) === zone);
    if (zoneMatch?.median_price_aed) return { source: "zone" as const, profile: zoneMatch };
  }

  const tokenMatch = dubaiProfiles.building_profiles
    .filter((row) => row.median_price_aed)
    .map((row) => {
      const name = normalize(row.name);
      const score = name && (search.includes(name) || name.includes(search)) ? name.length : 0;
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (tokenMatch?.score > 4) return { source: "building" as const, profile: tokenMatch.row };
  return null;
}

function estimateDubaiPublishedProperty(input: PublishedPropertyInput) {
  const match = findDubaiProfile(input);
  const areaM2 = asNumber(input.area_m2, 55);
  const asking = asNumber(input.asking_price);
  const profile = match?.profile;
  const pricePerM2 = profile?.median_price_aed && profile.area_m2
    ? profile.median_price_aed / profile.area_m2
    : 18_500;
  const estimated = Math.round(pricePerM2 * areaM2);
  const reliability = buildDubaiReliability({
    confidence_pct: profile && profile.count >= 25 ? 14 : profile && profile.count >= 8 ? 18 : 24,
    confidence_low_aed: Math.round(estimated * 0.84),
    confidence_high_aed: Math.round(estimated * 1.16),
    inference_source: match?.source || "admin_zone_fallback",
    resolved_zone: profile?.zone || input.zone || null,
    resolved_building: match?.source === "building" ? profile?.name : input.title,
    source_support_count: profile?.count || 0,
    source_recent_count: profile?.recent_count || 0,
    source_dominance_pct: profile?.dominance_pct || 0,
  });
  const spread = reliability.score >= 82 ? 0.12 : reliability.score >= 62 ? 0.17 : 0.24;
  const low = Math.round(estimated * (1 - spread));
  const high = Math.round(estimated * (1 + spread));
  const diffPct = ((asking - estimated) / estimated) * 100;

  return {
    estimated,
    low,
    high,
    diffPct,
    signal: classifySignal(diffPct, low, high, asking),
    confidenceScore: reliability.score,
    sourceLabel: match
      ? `DLD ${match.source} profile`
      : "DLD market fallback",
    sourceTransactions: profile?.count || 0,
    payload: {
      match_source: match?.source || "fallback",
      matched_profile: profile?.name || null,
      reliability,
      latest_date: profile?.latest_date || null,
    },
  };
}

function estimateFrancePublishedProperty(input: PublishedPropertyInput) {
  const propertyType: FrancePropertyType =
    input.property_type === "Maison" ? "Maison" : "Appartement";
  const estimate = estimateFranceValueV2({
    address: input.address,
    commune: input.zone,
    property_type: propertyType,
    area_m2: input.area_m2,
    rooms: Number(input.rooms || 2),
  });
  const estimated = estimate.estimated_value_eur;
  const low = estimate.estimated_low_eur;
  const high = estimate.estimated_high_eur;
  const asking = asNumber(input.asking_price);
  const diffPct = ((asking - estimated) / estimated) * 100;

  return {
    estimated,
    low,
    high,
    diffPct,
    signal: classifySignal(diffPct, low, high, asking),
    confidenceScore: estimate.reliability.score,
    sourceLabel: "DVF commune benchmark",
    sourceTransactions: estimate.record?.transactions || 0,
    payload: estimate as unknown as Record<string, unknown>,
  };
}

export function scorePublishedProperty(input: PublishedPropertyInput) {
  const market = input.market;
  const scored =
    market === "france"
      ? estimateFrancePublishedProperty(input)
      : estimateDubaiPublishedProperty(input);

  return {
    market,
    title: input.title.trim(),
    address: input.address?.trim() || null,
    zone: input.zone?.trim() || null,
    property_type:
      input.property_type?.trim() || (market === "france" ? "Appartement" : "Flat"),
    rooms: input.rooms ? String(input.rooms).trim() : null,
    area_m2: asNumber(input.area_m2),
    asking_price: asNumber(input.asking_price),
    estimated_value: scored.estimated,
    low_value: scored.low,
    high_value: scored.high,
    diff_pct: Math.round(scored.diffPct * 10) / 10,
    signal: scored.signal,
    confidence_score: clamp(Math.round(scored.confidenceScore), 0, 100),
    source_label: scored.sourceLabel,
    source_transactions: scored.sourceTransactions,
    image_url: input.image_url?.trim() || null,
    status: input.status || "published",
    valuation_payload: scored.payload,
  };
}

export function publishedPropertyToRadarListing(row: PublishedPropertyRow): RadarListing {
  const marketLabel = row.market === "france" ? "France" : "Dubai";
  const context = [
    row.zone || row.address || marketLabel,
    row.property_type,
    roomLabel(row.rooms),
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    id: row.id,
    title: row.title,
    subtitle: context,
    listedValue: Number(row.asking_price),
    benchmarkValue: Number(row.estimated_value),
    diffPct: Number(row.diff_pct),
    signal: row.signal,
    angle: 0,
    distance: Math.max(0.38, Math.min(0.92, 0.42 + row.confidence_score / 180)),
    areaLabel: `${Math.round(Number(row.area_m2))} m2`,
    confidenceScore: row.confidence_score,
    sourceLabel: row.source_label || "Published property valuation",
    transactions: row.source_transactions || undefined,
    lastUpdated: row.updated_at || row.created_at,
    note:
      row.signal === "green"
        ? "Asking price sits below the valuation range. This is a green opportunity signal for the radar."
        : row.signal === "red"
          ? "Asking price sits above the valuation range. The radar flags it before public traffic is pushed."
          : "Asking price sits near the valuation benchmark. Keep it visible, but not as a discount alert.",
  };
}
