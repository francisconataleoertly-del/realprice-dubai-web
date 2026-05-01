"use client";

import MarketRadarSection, {
  type RadarListing,
} from "@/components/radar/MarketRadarSection";
import marketData from "@/data/france-dvf-market.json";

type PropertyType = "Appartement" | "Maison";

type FeaturedRecord = {
  commune: string;
  department_code: string;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
  cagr_pct?: number;
};

type DepartmentRecord = {
  department_code: string;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
};

type FranceMarketShape = {
  featured: FeaturedRecord[];
  by_department: DepartmentRecord[];
  by_commune: FeaturedRecord[];
};

const data = marketData as unknown as FranceMarketShape;

function buildFranceListings(): RadarListing[] {
  const departmentBenchmarks = new Map<string, DepartmentRecord>();

  data.by_department.forEach((row) => {
    departmentBenchmarks.set(`${row.department_code}-${row.property_type}`, row);
  });

  const pool = (data.featured.length ? data.featured : data.by_commune).slice(0, 10);

  return pool.map((row, index) => {
    const benchmark =
      departmentBenchmarks.get(`${row.department_code}-${row.property_type}`) ?? row;
    const benchmarkValue = Math.round(
      benchmark.median_price_per_m2 * (row.avg_area_m2 || 62),
    );
    const listedValue = Math.round(
      row.median_value_eur || row.median_price_per_m2 * (row.avg_area_m2 || 62),
    );
    const diffPct = ((listedValue - benchmarkValue) / benchmarkValue) * 100;

    let signal: RadarListing["signal"] = "yellow";
    if (diffPct <= -8) signal = "green";
    if (diffPct >= 6) signal = "red";

    return {
      id: `${row.commune}-${row.department_code}-${row.property_type}`,
      title: row.commune,
      subtitle: `${row.property_type} | Dept. ${row.department_code}`,
      listedValue,
      benchmarkValue,
      diffPct,
      signal,
      angle: 24 + index * 34,
      distance: Math.max(0.36, Math.min(0.92, 0.34 + row.transactions / 110000)),
      areaLabel: `${Math.round(row.avg_area_m2 || 62)} m2`,
      note:
        signal === "green"
          ? "Commune-level pricing sits below the departmental benchmark, so this zone would surface as a green-light publication."
          : signal === "red"
            ? "Published price context is above the benchmark. Useful for owners who need a market reality check before going live."
            : "Balanced against the departmental benchmark. Good for neutral market positioning.",
    };
  });
}

const FRANCE_RADAR_LISTINGS = buildFranceListings();

export default function FranceRadarSection() {
  return (
    <MarketRadarSection
      chapterLabel="Chapter V"
      sectionLabel="Radar"
      title="Track every"
      accentTitle="published French asset."
      description="The France radar mirrors the Dubai experience, but feeds on French pricing intelligence. As you publish inventory, FonatProp can mark each asset green, amber or red against its local benchmark instead of leaving the pricing story ambiguous."
      backgroundImage="/france/nice-riviera.jpg"
      scanningLabel="France feed live"
      feedLabel="dvf + local benchmark"
      publishedLabel="Published semaforo"
      tableTitle="Traffic lights for published France listings"
      listTitle="Published radar feed"
      currencyPrefix="EUR"
      locale="fr-FR"
      listings={FRANCE_RADAR_LISTINGS}
    />
  );
}
