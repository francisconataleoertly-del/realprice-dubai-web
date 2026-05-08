import MarketRadarSection, {
  type RadarListing,
} from "@/components/radar/MarketRadarSection";
import profilesData from "@/app/realprice/data/realprice-address-profiles-v4-slim.json";

type ProfileRow = {
  name: string;
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

type ProfilesPayload = {
  generated_at?: string;
  building_profiles: ProfileRow[];
  zone_profiles: ProfileRow[];
};

const profiles = profilesData as ProfilesPayload;

function signalFromDiff(diffPct: number): RadarListing["signal"] {
  if (diffPct <= -8) return "green";
  if (diffPct >= 8) return "red";
  return "yellow";
}

function confidenceFromProfile(row: ProfileRow) {
  const countScore = row.count >= 100 ? 28 : row.count >= 25 ? 22 : row.count >= 8 ? 16 : 9;
  const recentScore = row.recent_count >= 4 ? 18 : row.recent_count >= 2 ? 13 : row.recent_count >= 1 ? 8 : 2;
  const dominanceScore = row.dominance_pct >= 65 ? 18 : row.dominance_pct >= 45 ? 12 : 6;
  return Math.max(45, Math.min(94, 34 + countScore + recentScore + dominanceScore));
}

function buildDubaiListings(): RadarListing[] {
  const zoneBenchmarks = new Map<string, ProfileRow>();

  profiles.zone_profiles.forEach((row) => {
    if (!row.name || !row.median_price_aed) return;
    zoneBenchmarks.set(`${row.name}-${row.property_type}-${row.rooms}`, row);
    zoneBenchmarks.set(`${row.name}-${row.property_type}`, row);
    zoneBenchmarks.set(row.name, row);
  });

  return profiles.building_profiles
    .filter((row) => row.name && row.zone && row.median_price_aed && row.count >= 3)
    .map((row) => {
      const benchmark =
        zoneBenchmarks.get(`${row.zone}-${row.property_type}-${row.rooms}`) ||
        zoneBenchmarks.get(`${row.zone}-${row.property_type}`) ||
        zoneBenchmarks.get(row.zone || "");

      if (!benchmark?.median_price_aed) return null;

      const observed = Math.round(row.median_price_aed || 0);
      const benchmarkValue = Math.round(benchmark.median_price_aed);
      const diffPct = ((observed - benchmarkValue) / benchmarkValue) * 100;

      return {
        row,
        listing: {
          id: `${row.name}-${row.zone}-${row.rooms}`,
          title: row.name,
          subtitle: `${row.zone} | ${row.rooms}`,
          listedValue: observed,
          benchmarkValue,
          diffPct,
          signal: signalFromDiff(diffPct),
          angle: 0,
          distance: Math.max(0.38, Math.min(0.9, 0.34 + row.count / 900)),
          areaLabel: `${Math.round(row.area_m2)} m2`,
          sourceLabel: "DLD profile vs zone benchmark",
          transactions: row.count,
          confidenceScore: confidenceFromProfile(row),
          lastUpdated: row.latest_date || profiles.generated_at,
          note:
            diffPct <= -8
              ? "Building median sits below its zone benchmark in the DLD profile layer, so the radar marks it as a green opportunity signal."
              : diffPct >= 8
                ? "Building median is above the zone benchmark. Useful for pricing discipline before pushing a public listing."
                : "Building median is close to the zone benchmark, so the radar keeps it in range.",
        } satisfies RadarListing,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (!a || !b) return 0;
      const signalRank = { green: 0, yellow: 1, red: 2 };
      return (
        signalRank[a.listing.signal] - signalRank[b.listing.signal] ||
        b.listing.confidenceScore! - a.listing.confidenceScore! ||
        b.row.count - a.row.count
      );
    })
    .slice(0, 12)
    .map((entry, index) => ({
      ...entry!.listing,
      angle: 22 + index * 29,
    }));
}

const DUBAI_RADAR_LISTINGS = buildDubaiListings();

export default function RadarSection() {
  return (
    <MarketRadarSection
      market="dubai"
      chapterLabel="Chapter V"
      sectionLabel="Radar"
      title="Watch every"
      accentTitle="market signal."
      description="A visual radar for FonatProp Dubai built from real DLD-derived building profiles. Green, amber and red show how each building median sits against its local benchmark before you publish live inventory."
      backgroundImage="/dubai-tower-bg.jpg"
      scanningLabel="DLD benchmark scan"
      feedLabel="building + zone evidence"
      publishedLabel="Market semaforo"
      tableTitle="Traffic lights from Dubai DLD profiles"
      listTitle="Dubai benchmark radar"
      currencyPrefix="AED"
      locale="en-AE"
      listings={DUBAI_RADAR_LISTINGS}
    />
  );
}
