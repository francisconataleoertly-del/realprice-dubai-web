// French address autocomplete via the Géoplateforme geocoding service (IGN)
//
// Source: https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage
// - Free, unlimited, no auth required
// - Rate limit: 50 req/s per IP
// - Backed by BAN + BD TOPO + Parcellaire Express
// - Replaces the legacy api-adresse.data.gouv.fr (decommissioned April 14, 2026)

const PRIMARY_ENDPOINT = "https://data.geopf.fr/geocodage/search/";
const LEGACY_ENDPOINT = "https://api-adresse.data.gouv.fr/search/";

export type AddressType = "housenumber" | "street" | "locality" | "municipality";

export type AddressSuggestion = {
  id: string;
  label: string;
  city: string;
  citycode: string; // full 5-digit INSEE code, e.g. "06088" for Nice
  postcode: string;
  lat: number;
  lon: number;
  type: AddressType;
  context: string; // "06, Alpes-Maritimes, Provence-Alpes-Côte d'Azur"
  score: number;
};

type GeoCodeFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    id?: string;
    label?: string;
    city?: string;
    citycode?: string;
    postcode?: string;
    type?: string;
    context?: string;
    score?: number;
  };
};

function mapFeature(f: GeoCodeFeature, idx: number): AddressSuggestion {
  return {
    id: f.properties.id ?? `${idx}-${f.properties.citycode ?? "unknown"}`,
    label: f.properties.label ?? "",
    city: f.properties.city ?? "",
    citycode: f.properties.citycode ?? "",
    postcode: f.properties.postcode ?? "",
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    type: (f.properties.type as AddressType) ?? "municipality",
    context: f.properties.context ?? "",
    score: f.properties.score ?? 0,
  };
}

async function fetchFrom(
  endpoint: string,
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const url = `${endpoint}?q=${encodeURIComponent(query)}&limit=${limit}&autocomplete=1`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geocode ${res.status}`);
  const data = (await res.json()) as { features?: GeoCodeFeature[] };
  return (data.features ?? []).map(mapFeature);
}

export async function searchFrenchAddress(
  query: string,
  limit = 6,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    return await fetchFrom(PRIMARY_ENDPOINT, query, limit, signal);
  } catch {
    // Fall back to the legacy URL while the redirect is still active
    try {
      return await fetchFrom(LEGACY_ENDPOINT, query, limit, signal);
    } catch {
      return [];
    }
  }
}

// Helper: turn a DVF entry into the full INSEE code that BAN/Géoplateforme returns.
// DVF stores `department_code` separately from `commune_code` (the suffix part).
export function dvfFullInseeCode(department_code: string, commune_code: string | undefined): string {
  if (!commune_code) return "";
  // Pad commune_code to 3 digits when needed (DVF sometimes drops leading zeros)
  const padded = commune_code.padStart(3, "0");
  return `${department_code}${padded}`;
}
