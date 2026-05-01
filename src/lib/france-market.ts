import marketData from "@/data/france-dvf-market.json";

export type FrancePropertyType = "Appartement" | "Maison";

export type FranceCommuneRecord = {
  commune: string;
  commune_code?: string;
  department_code: string;
  property_type: FrancePropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
  cagr_pct?: number;
  liquidity_score?: number;
  volume_rank?: number;
  lat?: number | null;
  lon?: number | null;
};

export type FranceMarketData = {
  generated_at: string;
  source: {
    name: string;
    publisher: string;
    raw_path: string;
    method: string;
  };
  coverage: {
    clean_rows: number;
    communes: number;
    departments: number;
    min_year: number;
    max_year: number;
    median_price_per_m2: number;
    median_value_eur: number;
  };
  by_year: Array<{
    year: number;
    property_type: FrancePropertyType;
    transactions: number;
    median_price_per_m2: number;
    median_value_eur: number;
    avg_area_m2: number;
  }>;
  by_department: Array<Record<string, unknown>>;
  by_commune: FranceCommuneRecord[];
  top_markets: Array<Record<string, unknown>>;
  top_trends: Array<Record<string, unknown>>;
  featured: FranceCommuneRecord[];
  pipeline?: {
    next_sources?: string[];
  };
};

export type FranceValuationInput = {
  address?: string;
  commune?: string;
  property_type?: FrancePropertyType;
  area_m2?: number;
  rooms?: number;
};

const data = marketData as FranceMarketData;

const RENOVATION_CATALOG = [
  { id: "kitchen", label: "Kitchen", min_eur_m2: 900, max_eur_m2: 1800, value_signal: "high visual impact" },
  { id: "bathroom", label: "Bathroom", min_eur_m2: 1200, max_eur_m2: 2500, value_signal: "buyer confidence" },
  { id: "flooring", label: "Flooring", min_eur_m2: 80, max_eur_m2: 220, value_signal: "fast repositioning" },
  { id: "painting", label: "Painting and walls", min_eur_m2: 25, max_eur_m2: 60, value_signal: "low-cost presentation lift" },
  { id: "windows", label: "Windows and glazing", min_eur_unit: 650, max_eur_unit: 1400, default_units: 6, value_signal: "comfort and DPE upside" },
  { id: "energy", label: "Energy upgrade", min_eur_m2: 150, max_eur_m2: 450, value_signal: "DPE-driven investment layer" },
];

export function getFranceMarketData() {
  return data;
}

export function normalizeFranceText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractPostalCode(value: string) {
  const match = value.match(/\b(\d{5})\b/);
  return match?.[1];
}

function formatParisArrondissement(number: number) {
  return `Paris ${String(number).padStart(2, "0")}`;
}

function formatLyonArrondissement(number: number) {
  return number === 1 ? "Lyon 1Er" : `Lyon ${number}Eme`;
}

function formatMarseilleArrondissement(number: number) {
  return number === 1 ? "Marseille 1Er" : `Marseille ${number}Eme`;
}

function inferSpecialCommuneFromPostalCode(postalCode: string) {
  if (/^750(0[1-9]|1\d|20)$/.test(postalCode)) {
    return formatParisArrondissement(Number(postalCode.slice(3)));
  }

  if (/^6900[1-9]$/.test(postalCode)) {
    return formatLyonArrondissement(Number(postalCode.slice(4)));
  }

  if (/^130(0[1-9]|1[0-6])$/.test(postalCode)) {
    return formatMarseilleArrondissement(Number(postalCode.slice(3)));
  }

  return undefined;
}

function inferSpecialCommuneFromText(value: string) {
  const normalized = normalizeFranceText(value);
  const patterns = [
    {
      city: "paris",
      regex: /\bparis\s+(0?[1-9]|1\d|20)\s*(?:er|e|eme)?\b/,
      formatter: formatParisArrondissement,
    },
    {
      city: "lyon",
      regex: /\blyon\s+(0?[1-9])\s*(?:er|e|eme)?\b/,
      formatter: formatLyonArrondissement,
    },
    {
      city: "marseille",
      regex: /\bmarseille\s+(0?[1-9]|1[0-6])\s*(?:er|e|eme)?\b/,
      formatter: formatMarseilleArrondissement,
    },
  ] as const;

  for (const pattern of patterns) {
    if (!normalized.includes(pattern.city)) continue;
    const match = normalized.match(pattern.regex);
    if (!match) continue;
    return pattern.formatter(Number(match[1]));
  }

  return undefined;
}

function matchSpecialCommune(
  rows: FranceCommuneRecord[],
  input: { commune?: string; address?: string }
) {
  const raw = [input.commune, input.address].filter(Boolean).join(" ");
  if (!raw) return undefined;

  const postalCode = extractPostalCode(raw);
  const byPostal = postalCode ? inferSpecialCommuneFromPostalCode(postalCode) : undefined;
  if (byPostal) {
    const row = rows.find((candidate) => candidate.commune === byPostal);
    if (row) {
      return { row, strategy: "postal_code_arrondissement" as const };
    }
  }

  const byText = inferSpecialCommuneFromText(raw);
  if (byText) {
    const row = rows.find((candidate) => candidate.commune === byText);
    if (row) {
      return { row, strategy: "explicit_arrondissement_text" as const };
    }
  }

  return undefined;
}

export function findFranceCommune(input: {
  commune?: string;
  address?: string;
  property_type?: FrancePropertyType;
}) {
  const type = input.property_type || "Appartement";
  const query = normalizeFranceText(input.commune || input.address || "");
  const rows = data.by_commune.filter((row) => row.property_type === type);

  const special = matchSpecialCommune(rows, input);
  if (special) return special.row;

  if (!query) {
    return rows.find((row) => row.commune === "Paris 15") || rows[0];
  }

  const exact = rows.find((row) => normalizeFranceText(row.commune) === query);
  if (exact) return exact;

  const contained = rows.find((row) => {
    const commune = normalizeFranceText(row.commune);
    return query.includes(commune) || commune.includes(query);
  });
  if (contained) return contained;

  const queryTokens = new Set(query.split(" ").filter((token) => token.length >= 3));
  let best: FranceCommuneRecord | undefined;
  let bestScore = 0;

  for (const row of rows) {
    const communeTokens = normalizeFranceText(row.commune).split(" ");
    const overlap = communeTokens.filter((token) => queryTokens.has(token)).length;
    const score = overlap / Math.max(communeTokens.length, 1);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }

  return bestScore >= 0.5 ? best : undefined;
}

export function franceConfidencePct(transactions: number) {
  if (transactions >= 20_000) return 0.1;
  if (transactions >= 8_000) return 0.12;
  if (transactions >= 2_000) return 0.15;
  if (transactions >= 500) return 0.18;
  return 0.24;
}

export function estimateFranceValue(input: FranceValuationInput) {
  const propertyType = input.property_type || "Appartement";
  const areaM2 = Number(input.area_m2 || 55);
  const rooms = Number(input.rooms || Math.max(1, Math.round(areaM2 / 24)));
  const candidateRows = data.by_commune.filter((row) => row.property_type === propertyType);
  const special = matchSpecialCommune(candidateRows, {
    commune: input.commune,
    address: input.address,
  });
  const record =
    special?.row ||
    findFranceCommune({
      commune: input.commune,
      address: input.address,
      property_type: propertyType,
    });

  const psm = record?.median_price_per_m2 || data.coverage.median_price_per_m2;
  const roomSignal = areaM2 / Math.max(rooms, 1);
  const layoutAdjustment =
    propertyType === "Appartement"
      ? roomSignal < 16
        ? -0.04
        : roomSignal > 34
          ? 0.04
          : 0
      : roomSignal < 22
        ? -0.03
        : roomSignal > 48
          ? 0.04
          : 0;
  const estimated = Math.round(psm * areaM2 * (1 + layoutAdjustment));
  const confidence = franceConfidencePct(record?.transactions || 0);

  return {
    market: "france",
    valuation_mode: record ? "dvf_commune_statistical_v1" : "national_dvf_fallback_v1",
    input: {
      address: input.address || null,
      commune: input.commune || record?.commune || null,
      property_type: propertyType,
      area_m2: areaM2,
      rooms,
    },
    record: record || null,
    estimated_value_eur: estimated,
    estimated_low_eur: Math.round(estimated * (1 - confidence)),
    estimated_high_eur: Math.round(estimated * (1 + confidence)),
    median_price_per_m2_eur: Math.round(psm),
    confidence_pct: Math.round(confidence * 1000) / 10,
    match_context: {
      strategy: special?.strategy || (record ? "commune_lookup" : "national_fallback"),
      postal_code: input.address ? extractPostalCode(input.address) || null : null,
    },
    assumptions: [
      "V1 uses cleaned DVF residential transactions by commune and property type.",
      "Address/parcelle, DPE, risks, transport and INSEE enrichment are prepared as the next model layer.",
      "Exact unit-level valuation requires robust address/parcelle matching.",
    ],
  };
}

export function getFranceRenovationCatalog() {
  return RENOVATION_CATALOG;
}

export function estimateFranceRenovation(input: {
  area_m2?: number;
  categories?: string[];
  tier?: "standard" | "mid" | "premium";
}) {
  const areaM2 = Number(input.area_m2 || 55);
  const tier = input.tier || "mid";
  const tierMultiplier = tier === "premium" ? 1.35 : tier === "standard" ? 0.78 : 1;
  const wanted = new Set(input.categories?.length ? input.categories : ["kitchen", "bathroom", "flooring", "painting"]);

  const breakdown = RENOVATION_CATALOG.filter((item) => wanted.has(item.id)).map((item) => {
    const min =
      "min_eur_unit" in item
        ? (item.min_eur_unit || 0) * (item.default_units || 1)
        : (item.min_eur_m2 || 0) * areaM2;
    const max =
      "max_eur_unit" in item
        ? (item.max_eur_unit || 0) * (item.default_units || 1)
        : (item.max_eur_m2 || 0) * areaM2;

    return {
      category: item.id,
      label: item.label,
      cost_min_eur: Math.round(min * tierMultiplier),
      cost_max_eur: Math.round(max * tierMultiplier),
      value_signal: item.value_signal,
    };
  });

  const subtotalMin = breakdown.reduce((sum, item) => sum + item.cost_min_eur, 0);
  const subtotalMax = breakdown.reduce((sum, item) => sum + item.cost_max_eur, 0);
  const contingencyMin = Math.round(subtotalMin * 0.1);
  const contingencyMax = Math.round(subtotalMax * 0.12);

  return {
    area_m2: areaM2,
    tier,
    breakdown,
    subtotal_min_eur: subtotalMin,
    subtotal_max_eur: subtotalMax,
    contingency_min_eur: contingencyMin,
    contingency_max_eur: contingencyMax,
    grand_total_min_eur: subtotalMin + contingencyMin,
    grand_total_max_eur: subtotalMax + contingencyMax,
    notes: [
      "France ranges are planning ranges for broker/investor conversation, not contractor quotes.",
      "Energy and window upgrades should be refined with DPE and MaPrimeRenov eligibility.",
    ],
  };
}
