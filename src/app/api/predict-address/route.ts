import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const UPSTREAM_API =
  process.env.NEXT_PUBLIC_FONATPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_NEXOPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_REALPRICE_API_BASE_URL ||
  "https://web-production-9051f.up.railway.app";

const ZONE_ALIAS_OVERRIDES: Record<string, string> = {
  "Dubai Marina": "Marsa Dubai",
  "Downtown Dubai": "Burj Khalifa",
  JVC: "Al Thanayah Fourth",
  "Jumeirah Village Circle": "Al Thanayah Fourth",
  JLT: "Al Thanyah Fifth",
  "Jumeirah Lake Towers": "Al Thanyah Fifth",
  DIFC: "Trade Center Second",
  "Trade Centre Second": "Trade Center Second",
  "Trade Centre First": "Trade Center First",
  "MBR City": "Hadaeq Sheikh Mohammed Bin Rashid",
  "District One": "Hadaeq Sheikh Mohammed Bin Rashid",
  "Dubai Hills": "Hadaeq Sheikh Mohammed Bin Rashid",
  "Dubai Hills Estate": "Hadaeq Sheikh Mohammed Bin Rashid",
  "Sports City": "Al Hebiah First",
  "Dubai Sports City": "Al Hebiah First",
  "Motor City": "Al Hebiah First",
  "Dubai Silicon Oasis": "Nadd Hessa",
  "Silicon Oasis": "Nadd Hessa",
  "International City": "Al Warsan First",
  "Discovery Gardens": "Jabal Ali First",
};

const GENERIC_ADDRESS_TOKENS = new Set([
  "AL",
  "ST",
  "STREET",
  "ROAD",
  "RD",
  "AVENUE",
  "AVE",
  "BOULEVARD",
  "BLVD",
  "DUBAI",
  "UNITED",
  "ARAB",
  "EMIRATES",
  "UAE",
  "TOWER",
  "TOWERS",
  "BUILDING",
  "RESIDENCE",
  "RESIDENCES",
]);

type ProfileRow = {
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
  latest_date?: string;
  is_freehold?: boolean;
  is_offplan?: boolean;
  has_parking?: boolean;
};

type ProfilePayload = {
  building_profiles: ProfileRow[];
  project_profiles: ProfileRow[];
  zone_profiles: ProfileRow[];
  _building_profiles_by_name?: Record<string, ProfileRow>;
  _project_profiles_by_name?: Record<string, ProfileRow>;
  _zone_profiles_by_name?: Record<string, ProfileRow>;
  _building_profiles_by_norm?: Record<string, ProfileRow>;
  _project_profiles_by_norm?: Record<string, ProfileRow>;
  _zone_profiles_by_norm?: Record<string, ProfileRow>;
  _building_profiles_candidates?: Array<[string, ProfileRow]>;
  _project_profiles_candidates?: Array<[string, ProfileRow]>;
  _zone_profiles_candidates?: Array<[string, ProfileRow]>;
};

let profilesCache: ProfilePayload | null = null;

function normalizeLookupKey(value: unknown) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function tokenizeLookup(value: unknown) {
  const rawTokens = String(value ?? "")
    .toUpperCase()
    .match(/[A-Z0-9]+/g) || [];
  const tokens = new Set<string>();

  rawTokens.forEach((token, index) => {
    const nextToken = rawTokens[index + 1];
    if ((token === "TOWER" || token === "TOWERS") && nextToken && /^\d+$/.test(nextToken)) {
      tokens.add(`T${nextToken}`);
      return;
    }
    if (/^\d+$/.test(token)) return;
    if (GENERIC_ADDRESS_TOKENS.has(token)) return;
    tokens.add(token);
  });

  return tokens;
}

async function getProfiles() {
  if (profilesCache) return profilesCache;

  const filePath = path.join(
    process.cwd(),
    "src",
    "app",
    "realprice",
    "data",
    "realprice-address-profiles-v4-slim.json"
  );
  const raw = await fs.readFile(filePath, "utf-8");
  const profiles = JSON.parse(raw) as ProfilePayload;

  for (const bucket of ["building_profiles", "project_profiles", "zone_profiles"] as const) {
    const rows = profiles[bucket] || [];
    (profiles as any)[`_${bucket}_by_name`] = Object.fromEntries(
      rows.filter((row) => row.name).map((row) => [row.name, row])
    );
    (profiles as any)[`_${bucket}_by_norm`] = Object.fromEntries(
      rows.filter((row) => row.name).map((row) => [normalizeLookupKey(row.name), row])
    );
    (profiles as any)[`_${bucket}_candidates`] = rows
      .filter((row) => row.name)
      .map((row) => [normalizeLookupKey(row.name), row] as [string, ProfileRow])
      .sort((a, b) => b[0].length - a[0].length || b[1].count - a[1].count);
  }

  profilesCache = profiles;
  return profilesCache;
}

function resolveZone(zona?: string | null) {
  if (!zona) return "";
  return ZONE_ALIAS_OVERRIDES[zona] || zona;
}

function lookupProfile(
  profiles: ProfilePayload,
  bucket: "building_profiles" | "project_profiles" | "zone_profiles",
  value?: string | null
) {
  if (!value) return null;
  const byName = (profiles as any)[`_${bucket}_by_name`] as Record<string, ProfileRow>;
  const byNorm = (profiles as any)[`_${bucket}_by_norm`] as Record<string, ProfileRow>;
  const candidates = (profiles as any)[`_${bucket}_candidates`] as Array<[string, ProfileRow]>;

  if (byName[value]) return byName[value];

  const normalized = normalizeLookupKey(value);
  if (byNorm[normalized]) return byNorm[normalized];

  for (const [candidateNorm, row] of candidates) {
    if (candidateNorm.includes(normalized) || normalized.includes(candidateNorm)) {
      return row;
    }
  }

  const queryTokens = tokenizeLookup(value);
  let bestMatch: ProfileRow | null = null;
  let bestScore = 0;

  for (const [, row] of candidates) {
    const candidateTokens = tokenizeLookup(row.name);
    if (!candidateTokens.size || !queryTokens.size) continue;
    const overlap = [...candidateTokens].filter((token) => queryTokens.has(token)).length;
    if (overlap < 1) continue;
    const score = overlap / candidateTokens.size;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = row;
    }
  }

  if (bestMatch && bestScore >= 0.6) return bestMatch;
  return null;
}

function resolveInferenceSource(
  profiles: ProfilePayload,
  zona?: string | null,
  buildingName?: string | null
) {
  const resolvedZone = resolveZone(zona);
  const buildingProfile = lookupProfile(profiles, "building_profiles", buildingName);
  const projectProfile = lookupProfile(profiles, "project_profiles", buildingName);
  const zoneProfile = lookupProfile(profiles, "zone_profiles", resolvedZone || zona);

  if (buildingProfile && (buildingProfile.recent_count >= 1 || buildingProfile.count >= 3)) {
    return {
      source: "building",
      profile: buildingProfile,
      resolvedZone: buildingProfile.zone || resolvedZone || zona || "",
      resolvedBuilding: buildingProfile.name || buildingName || "",
    };
  }

  if (projectProfile && (projectProfile.recent_count >= 1 || projectProfile.count >= 5)) {
    return {
      source: "project",
      profile: projectProfile,
      resolvedZone: projectProfile.zone || resolvedZone || zona || "",
      resolvedBuilding: buildingName || "",
    };
  }

  if (zoneProfile) {
    return {
      source: "zone",
      profile: zoneProfile,
      resolvedZone: zoneProfile.name || resolvedZone || zona || "",
      resolvedBuilding: buildingName || "",
    };
  }

  return null;
}

function adjustInferredConfidence(
  baseConfidencePct: number,
  source: string,
  supportCount: number,
  dominancePct: number
) {
  let pct = Number(baseConfidencePct || 0.2);
  if (source === "building") pct -= 0.02;
  else if (source === "project") pct += 0.01;
  else pct += 0.04;

  if (supportCount < 3) pct += 0.03;
  else if (supportCount > 20) pct -= 0.01;

  if (dominancePct < 40) pct += 0.04;
  else if (dominancePct < 50) pct += 0.02;
  else if (dominancePct >= 65) pct -= 0.01;

  return Math.max(0.1, Math.min(0.32, pct));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profiles = await getProfiles();
    const inference = resolveInferenceSource(profiles, body.zona, body.building_name);

    if (!inference) {
      return NextResponse.json(
        { detail: "We could not infer a property profile from that Dubai address yet." },
        { status: 404 }
      );
    }

    const { profile, source, resolvedZone, resolvedBuilding } = inference;
    const usedRooms = body.rooms || profile.rooms;
    const usedAreaM2 = body.area_m2 || profile.area_m2;
    const usedPropertyType = body.property_type || profile.property_type || "Flat";
    const usedIsFreehold =
      body.is_freehold === undefined || body.is_freehold === null
        ? profile.is_freehold ?? true
        : body.is_freehold;
    const usedIsOffplan =
      body.is_offplan === undefined || body.is_offplan === null
        ? profile.is_offplan ?? false
        : body.is_offplan;
    const usedHasParking =
      body.has_parking === undefined || body.has_parking === null
        ? profile.has_parking ?? true
        : body.has_parking;
    const usedYear = body.year || new Date().getFullYear();
    const usedQuarter = body.quarter || Math.floor(new Date().getMonth() / 3) + 1;

    const upstreamResponse = await fetch(`${UPSTREAM_API}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zona: resolvedZone,
        building_name: resolvedBuilding || body.building_name || undefined,
        rooms: usedRooms,
        area_m2: Number(usedAreaM2),
        property_type: usedPropertyType,
        is_freehold: usedIsFreehold,
        is_offplan: usedIsOffplan,
        has_parking: usedHasParking,
        year: usedYear,
        quarter: usedQuarter,
      }),
    });

    const upstreamData = await upstreamResponse.json();
    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { detail: upstreamData?.detail || `Error ${upstreamResponse.status}` },
        { status: upstreamResponse.status }
      );
    }

    const confidencePct = adjustInferredConfidence(
      Number(upstreamData.confidence_pct || 20) / 100,
      source,
      profile.count || 0,
      profile.dominance_pct || 0
    );

    const predictedAed = Number(upstreamData.predicted_aed || 0);
    const response = {
      ...upstreamData,
      zona: resolvedZone,
      rooms: usedRooms,
      area_m2: Number(usedAreaM2),
      property_type: usedPropertyType,
      confidence_pct: Math.round(confidencePct * 1000) / 10,
      confidence_low_aed: Math.round(predictedAed * (1 - confidencePct)),
      confidence_high_aed: Math.round(predictedAed * (1 + confidencePct)),
      resolved_zone: upstreamData.resolved_zone || resolvedZone,
      resolved_building: upstreamData.resolved_building || resolvedBuilding || body.building_name || null,
      valuation_mode: `address_inferred_${source}_profile`,
      inference_source: source,
      inferred_details_used: true,
      source_support_count: profile.count || 0,
      source_recent_count: profile.recent_count || 0,
      source_dominance_pct: profile.dominance_pct || 0,
      inferred_from_address: body.address || null,
      inferred_is_freehold: usedIsFreehold,
      inferred_is_offplan: usedIsOffplan,
      inferred_has_parking: usedHasParking,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("predict-address route failed", error);
    return NextResponse.json(
      { detail: "Address valuation failed. Please try again." },
      { status: 500 }
    );
  }
}
