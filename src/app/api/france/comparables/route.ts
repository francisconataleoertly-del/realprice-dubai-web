import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

// Comparable DVF transactions endpoint.
//
// Reads the postcode-indexed comparables JSON (built offline by
// 02_france/scripts/build_dvf_comparables.py) and returns the most relevant
// recent sales for the requested postcode + property type, sorted by similarity
// to the user's surface (when provided) and by recency.
//
// Query parameters:
//   postcode (required) — 5-digit French postcode, e.g. "75015"
//   type     (optional) — "Appartement" | "Maison" (filters when present)
//   surface  (optional) — target m² to rank similar comparables higher
//   limit    (optional) — how many records to return, default 8, max 25

type ComparableRecord = {
  d: string;        // date YYYY-MM-DD
  v: number;        // sale price (EUR)
  s: number;        // built surface (m²)
  p: number;        // price per m² (EUR)
  r: number | null; // rooms
  t: string;        // type_local
  a: string;        // street address (no city)
  c: string;        // commune
  cp: string;       // postcode
  cd: string;       // department code
  la: number;       // latitude
  lo: number;       // longitude
};

type LoadedDataset = {
  generated_at: string;
  source: string;
  per_postcode_limit: number;
  postcode_count: number;
  record_count: number;
  by_postcode: { [postcode: string]: ComparableRecord[] };
};

let cached: LoadedDataset | null = null;

function loadDataset(): LoadedDataset {
  if (cached) return cached;
  const filePath = path.join(
    process.cwd(),
    "data",
    "france-dvf-comparables.json",
  );
  const raw = fs.readFileSync(filePath, "utf8");
  cached = JSON.parse(raw) as LoadedDataset;
  return cached;
}

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const postcode = url.searchParams.get("postcode")?.trim();
  if (!postcode || !/^\d{5}$/.test(postcode)) {
    return NextResponse.json(
      { error: "postcode (5 digits) is required" },
      { status: 400 },
    );
  }

  const propertyType = url.searchParams.get("type")?.trim();
  const surfaceRaw = url.searchParams.get("surface");
  const surface = surfaceRaw ? Number(surfaceRaw) : null;
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, limitRaw ? Number(limitRaw) || DEFAULT_LIMIT : DEFAULT_LIMIT),
  );

  let dataset: LoadedDataset;
  try {
    dataset = loadDataset();
  } catch (err) {
    console.error("[france/comparables] dataset load failed", err);
    return NextResponse.json(
      { error: "Comparables dataset not available" },
      { status: 503 },
    );
  }

  const all = dataset.by_postcode[postcode] ?? [];
  let filtered = all;

  if (propertyType && (propertyType === "Appartement" || propertyType === "Maison")) {
    filtered = filtered.filter((r) => r.t === propertyType);
  }

  // Rank by surface similarity (when provided) then by date desc.
  if (surface && Number.isFinite(surface) && surface > 0) {
    filtered = [...filtered].sort((a, b) => {
      const aDiff = Math.abs(a.s - surface);
      const bDiff = Math.abs(b.s - surface);
      if (aDiff !== bDiff) return aDiff - bDiff;
      return b.d.localeCompare(a.d);
    });
  } else {
    filtered = [...filtered].sort((a, b) => b.d.localeCompare(a.d));
  }

  const records = filtered.slice(0, limit);

  // Postcode-level summary so the UI can show distribution context.
  const all_count = all.length;
  const filtered_count = filtered.length;
  const median_price_per_m2 = computeMedian(filtered.map((r) => r.p));
  const median_value_eur = computeMedian(filtered.map((r) => r.v));

  return NextResponse.json(
    {
      postcode,
      type: propertyType || null,
      surface: surface || null,
      generated_at: dataset.generated_at,
      total_in_postcode: all_count,
      filtered_count,
      median_price_per_m2,
      median_value_eur,
      records,
    },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
  );
}

function computeMedian(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : Math.round(sorted[mid]);
}
