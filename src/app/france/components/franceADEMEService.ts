// ADEME DPE (energy label) auto-lookup by address.
//
// Source: ADEME open-data DPE Logements existants (depuis juillet 2021)
//   Dataset: data.ademe.fr/datasets/dpe03existant — 6+ million records
//   API: data-fair lines endpoint with full ElasticSearch query string syntax
//
// Strategy:
//   1. If BAN gave us an `identifiant_ban` (building-level ID), try an exact match.
//      ADEME stores the BAN ID in `identifiant_ban` so a hit means we have the actual
//      energy label of the building.
//   2. Else, fall back to all DPEs in the same postcode and return the distribution
//      so the UI can suggest the local-mode DPE class.

const ENDPOINT =
  "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines";

const SELECT_FIELDS = [
  "etiquette_dpe",
  "etiquette_ges",
  "adresse_brut",
  "code_postal_brut",
  "identifiant_ban",
  "surface_habitable_logement",
  "date_etablissement_dpe",
  "type_batiment",
  "_geopoint",
].join(",");

export type DpeRecord = {
  etiquette_dpe?: string;
  etiquette_ges?: string;
  adresse_brut?: string;
  code_postal_brut?: number | string;
  identifiant_ban?: string;
  surface_habitable_logement?: number;
  date_etablissement_dpe?: string;
  type_batiment?: string;
  _geopoint?: string;
};

export type DpeLookupResult = {
  exact_match?: DpeRecord;
  nearby_records: DpeRecord[];
  total: number;
  distribution: Record<string, number>;
  most_common_class?: string;
  postcode?: string;
};

const ALL_CLASSES = ["A", "B", "C", "D", "E", "F", "G"];

function tally(records: DpeRecord[]): {
  distribution: Record<string, number>;
  most_common_class?: string;
} {
  const dist: Record<string, number> = {};
  ALL_CLASSES.forEach((c) => {
    dist[c] = 0;
  });
  records.forEach((r) => {
    const c = (r.etiquette_dpe ?? "").toUpperCase();
    if (ALL_CLASSES.includes(c)) {
      dist[c] = (dist[c] ?? 0) + 1;
    }
  });
  let mostCommon: string | undefined;
  let topCount = 0;
  for (const [c, n] of Object.entries(dist)) {
    if (n > topCount) {
      topCount = n;
      mostCommon = c;
    }
  }
  return { distribution: dist, most_common_class: topCount > 0 ? mostCommon : undefined };
}

async function fetchLines(
  qs: string,
  size: number,
  signal?: AbortSignal,
): Promise<DpeRecord[]> {
  const url = `${ENDPOINT}?qs=${encodeURIComponent(qs)}&size=${size}&select=${encodeURIComponent(SELECT_FIELDS)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`ADEME ${res.status}`);
  const data = (await res.json()) as { results?: DpeRecord[] };
  return data.results ?? [];
}

export async function lookupDpeByAddress(
  postcode: string | undefined,
  banId: string | undefined,
  signal?: AbortSignal,
): Promise<DpeLookupResult> {
  const empty: DpeLookupResult = {
    nearby_records: [],
    total: 0,
    distribution: Object.fromEntries(ALL_CLASSES.map((c) => [c, 0])),
    postcode,
  };

  // 1. Exact match by identifiant_ban — only when we have a building-level BAN id.
  if (banId) {
    try {
      const records = await fetchLines(`identifiant_ban:"${banId}"`, 1, signal);
      if (records.length > 0) {
        const tallied = tally(records);
        return {
          ...empty,
          exact_match: records[0],
          nearby_records: records,
          total: 1,
          ...tallied,
        };
      }
    } catch {
      // fall through to postcode lookup
    }
  }

  // 2. Postcode-level lookup for distribution (returns up to 50 records).
  if (!postcode) return empty;
  try {
    const records = await fetchLines(`code_postal_brut:${postcode}`, 50, signal);
    const tallied = tally(records);
    return {
      ...empty,
      nearby_records: records.slice(0, 20),
      total: records.length,
      ...tallied,
    };
  } catch {
    return empty;
  }
}

export function pickPrimaryDpeClass(result: DpeLookupResult): string | undefined {
  if (result.exact_match?.etiquette_dpe) return result.exact_match.etiquette_dpe.toUpperCase();
  return result.most_common_class;
}
