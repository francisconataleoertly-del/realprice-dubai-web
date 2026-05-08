import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  estimateFranceValue as estimateFranceValueV1,
  type FrancePropertyType,
  type FranceValuationInput,
} from "@/lib/france-market";
import { buildFranceReliability } from "@/lib/valuation-reliability";

type ComparableRecord = {
  d: string;
  v: number;
  s: number;
  p: number;
  r: number | null;
  t: FrancePropertyType;
  a: string;
  c: string;
  cp: string;
  cd: string;
  la: number;
  lo: number;
};

type ComparableDataset = {
  generated_at: string;
  source: string;
  per_postcode_limit: number;
  postcode_count: number;
  record_count: number;
  by_postcode: Record<string, ComparableRecord[]>;
};

type ComparableContext = {
  postcode: string | null;
  source: "postcode_weighted_comparables" | "commune_fallback";
  candidate_count: number;
  used_count: number;
  exact_room_count: number;
  blended_weight: number;
  anchor_price_per_m2_eur: number | null;
  anchor_low_per_m2_eur: number | null;
  anchor_high_per_m2_eur: number | null;
};

let cachedDataset: ComparableDataset | null = null;

function extractPostalCode(value?: string | null) {
  if (!value) return null;
  const match = String(value).match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}

function loadComparableDataset(): ComparableDataset {
  if (cachedDataset) return cachedDataset;
  const filePath = path.join(process.cwd(), "data", "france-dvf-comparables.json");
  cachedDataset = JSON.parse(fs.readFileSync(filePath, "utf8")) as ComparableDataset;
  return cachedDataset;
}

function weightedQuantile(values: number[], weights: number[], quantile: number) {
  if (!values.length || !weights.length) return null;
  const rows = values
    .map((value, index) => ({ value, weight: weights[index] ?? 0 }))
    .filter((row) => Number.isFinite(row.value) && row.weight > 0)
    .sort((a, b) => a.value - b.value);

  if (!rows.length) return null;
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0) return rows[Math.floor(rows.length / 2)]?.value ?? null;

  const threshold = totalWeight * quantile;
  let running = 0;
  for (const row of rows) {
    running += row.weight;
    if (running >= threshold) return row.value;
  }
  return rows.at(-1)?.value ?? null;
}

function monthsOld(dateText: string, latestDate: Date) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return 24;
  const months =
    (latestDate.getUTCFullYear() - date.getUTCFullYear()) * 12 +
    (latestDate.getUTCMonth() - date.getUTCMonth());
  return Math.max(0, months);
}

function scoreComparable(record: ComparableRecord, areaM2: number, rooms: number) {
  const areaGap = Math.abs(Math.log(Math.max(record.s, 1) / Math.max(areaM2, 1)));
  const roomGap =
    typeof record.r === "number" && Number.isFinite(record.r)
      ? Math.abs(record.r - rooms)
      : 2;
  return {
    areaWeight: Math.exp(-3.4 * areaGap),
    roomWeight: roomGap === 0 ? 1 : roomGap === 1 ? 0.8 : 0.58,
  };
}

function buildComparableAnchor(
  postcode: string | null,
  propertyType: FrancePropertyType,
  areaM2: number,
  rooms: number,
  communeMedianPsm: number,
): ComparableContext {
  if (!postcode) {
    return {
      postcode: null,
      source: "commune_fallback",
      candidate_count: 0,
      used_count: 0,
      exact_room_count: 0,
      blended_weight: 0,
      anchor_price_per_m2_eur: null,
      anchor_low_per_m2_eur: null,
      anchor_high_per_m2_eur: null,
    };
  }

  const dataset = loadComparableDataset();
  const allCandidates = (dataset.by_postcode[postcode] ?? []).filter(
    (row) => row.t === propertyType,
  );

  if (!allCandidates.length) {
    return {
      postcode,
      source: "commune_fallback",
      candidate_count: 0,
      used_count: 0,
      exact_room_count: 0,
      blended_weight: 0,
      anchor_price_per_m2_eur: null,
      anchor_low_per_m2_eur: null,
      anchor_high_per_m2_eur: null,
    };
  }

  const latestDate = new Date(
    allCandidates.reduce((max, row) => (row.d > max ? row.d : max), allCandidates[0]!.d),
  );

  const scored = allCandidates
    .map((row) => {
      const { areaWeight, roomWeight } = scoreComparable(row, areaM2, rooms);
      const recencyWeight = 0.45 + 0.55 * Math.exp(-monthsOld(row.d, latestDate) / 18);
      const weight = areaWeight * roomWeight * recencyWeight;
      return { row, weight, roomGap: typeof row.r === "number" ? Math.abs(row.r - rooms) : 99 };
    })
    .filter((entry) => entry.weight > 0.08)
    .sort((a, b) => b.weight - a.weight);

  const exactRoomCount = scored.filter((entry) => entry.roomGap === 0).length;
  const preferred = exactRoomCount >= 4 ? scored.filter((entry) => entry.roomGap === 0) : scored;
  const used = preferred.slice(0, 18);

  if (used.length < 3) {
    return {
      postcode,
      source: "commune_fallback",
      candidate_count: allCandidates.length,
      used_count: 0,
      exact_room_count: exactRoomCount,
      blended_weight: 0,
      anchor_price_per_m2_eur: null,
      anchor_low_per_m2_eur: null,
      anchor_high_per_m2_eur: null,
    };
  }

  const psmValues = used.map((entry) => entry.row.p);
  const weights = used.map((entry) => entry.weight);
  const anchorPsm = weightedQuantile(psmValues, weights, 0.5);
  const lowPsm = weightedQuantile(psmValues, weights, 0.25);
  const highPsm = weightedQuantile(psmValues, weights, 0.75);

  if (!anchorPsm) {
    return {
      postcode,
      source: "commune_fallback",
      candidate_count: allCandidates.length,
      used_count: 0,
      exact_room_count: exactRoomCount,
      blended_weight: 0,
      anchor_price_per_m2_eur: null,
      anchor_low_per_m2_eur: null,
      anchor_high_per_m2_eur: null,
    };
  }

  const dispersion =
    lowPsm && highPsm ? Math.max(0, (highPsm - lowPsm) / Math.max(anchorPsm, 1)) : 0;
  let blendedWeight =
    used.length >= 12 ? 0.82 : used.length >= 8 ? 0.72 : used.length >= 5 ? 0.6 : 0.46;

  if (dispersion > 0.55) blendedWeight *= 0.78;
  if (dispersion > 0.75) blendedWeight *= 0.72;

  const anchorGap = Math.abs(anchorPsm - communeMedianPsm) / Math.max(communeMedianPsm, 1);
  if (anchorGap > 0.45) blendedWeight *= 0.82;
  if (exactRoomCount < 2) blendedWeight *= 0.9;

  return {
    postcode,
    source: "postcode_weighted_comparables",
    candidate_count: allCandidates.length,
    used_count: used.length,
    exact_room_count: exactRoomCount,
    blended_weight: Math.max(0.24, Math.min(0.86, blendedWeight)),
    anchor_price_per_m2_eur: Math.round(anchorPsm),
    anchor_low_per_m2_eur: lowPsm ? Math.round(lowPsm) : null,
    anchor_high_per_m2_eur: highPsm ? Math.round(highPsm) : null,
  };
}

function comparableConfidencePct(context: ComparableContext, communeConfidencePct: number) {
  if (context.source !== "postcode_weighted_comparables" || !context.used_count) {
    return communeConfidencePct;
  }

  let pct =
    context.used_count >= 12
      ? 0.11
      : context.used_count >= 8
        ? 0.125
        : context.used_count >= 5
          ? 0.145
          : 0.165;

  if (context.exact_room_count < 2) pct += 0.015;
  if (
    context.anchor_low_per_m2_eur &&
    context.anchor_high_per_m2_eur &&
    context.anchor_price_per_m2_eur
  ) {
    const dispersion =
      (context.anchor_high_per_m2_eur - context.anchor_low_per_m2_eur) /
      Math.max(context.anchor_price_per_m2_eur, 1);
    if (dispersion > 0.55) pct += 0.02;
    if (dispersion > 0.8) pct += 0.02;
  }

  return Math.max(0.1, Math.min(communeConfidencePct, pct));
}

export function estimateFranceValueV2(input: FranceValuationInput) {
  const v1 = estimateFranceValueV1(input);
  const propertyType = (input.property_type || "Appartement") as FrancePropertyType;
  const areaM2 = Number(input.area_m2 || 55);
  const rooms = Number(input.rooms || Math.max(1, Math.round(areaM2 / 24)));
  const postcode = extractPostalCode(input.address || input.commune || "");

  const comparableContext = buildComparableAnchor(
    postcode,
    propertyType,
    areaM2,
    rooms,
    v1.median_price_per_m2_eur,
  );

  if (comparableContext.source !== "postcode_weighted_comparables" || !comparableContext.anchor_price_per_m2_eur) {
    return {
      ...v1,
      comparable_context: comparableContext,
    };
  }

  const blendedPsm = Math.round(
    comparableContext.blended_weight * comparableContext.anchor_price_per_m2_eur +
      (1 - comparableContext.blended_weight) * v1.median_price_per_m2_eur,
  );

  let layoutAdjustment = 0;
  if (comparableContext.exact_room_count < 2) {
    const roomSignal = areaM2 / Math.max(rooms, 1);
    layoutAdjustment =
      propertyType === "Appartement"
        ? roomSignal < 16
          ? -0.03
          : roomSignal > 34
            ? 0.03
            : 0
        : roomSignal < 22
          ? -0.02
          : roomSignal > 48
            ? 0.03
            : 0;
  }

  const estimated = Math.round(blendedPsm * areaM2 * (1 + layoutAdjustment));
  const communeConfidence = (v1.confidence_pct || 18) / 100;
  const confidence = comparableConfidencePct(comparableContext, communeConfidence);
  const confidencePctRounded = Math.round(confidence * 1000) / 10;
  const valuationMode = "dvf_postcode_comparables_v2";
  const matchContext = {
    strategy: comparableContext.source,
    postal_code: postcode,
  };

  const response = {
    ...v1,
    valuation_mode: valuationMode,
    estimated_value_eur: estimated,
    estimated_low_eur: Math.round(estimated * (1 - confidence)),
    estimated_high_eur: Math.round(estimated * (1 + confidence)),
    median_price_per_m2_eur: blendedPsm,
    confidence_pct: confidencePctRounded,
    match_context: matchContext,
    assumptions: [
      "V2 blends postcode-level recent comparables with commune-level DVF baselines.",
      "Address precision matters: postcode support strengthens the range more than a broad commune-only fallback.",
      "DPE, building ID and parcel enrichment remain the next layer for tighter France unit pricing.",
    ],
    comparable_context: comparableContext,
  };

  return {
    ...response,
    reliability: buildFranceReliability({
      valuation_mode: valuationMode,
      confidence_pct: confidencePctRounded,
      record: response.record,
      match_context: matchContext,
    }),
  };
}
