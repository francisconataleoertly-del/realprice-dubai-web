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
  generated_at?: string;
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
      sourceLabel: "DVF commune vs department benchmark",
      transactions: row.transactions,
      confidenceScore: Math.max(48, Math.min(94, 54 + Math.round(Math.log10(row.transactions || 1) * 9))),
      lastUpdated: data.generated_at,
      note:
        signal === "green"
          ? "Commune-level pricing sits below the departmental benchmark, so this zone surfaces as a green opportunity signal."
          : signal === "red"
            ? "Commune pricing is above the benchmark. Useful for owners who need a market reality check before going live."
            : "Balanced against the departmental benchmark. Good for neutral market positioning.",
    };
  });
}

const FRANCE_RADAR_LISTINGS = buildFranceListings();

export default function FranceRadarSection() {
  return (
    <MarketRadarSection
      market="france"
      chapterLabel="Chapter V"
      sectionLabel="Radar"
      title="Track every"
      accentTitle="French market signal."
      description="The France radar mirrors the Dubai experience, but feeds on DVF pricing intelligence. Green, amber and red compare commune medians against department benchmarks before live inventory is connected."
      backgroundImage="/france/nice-riviera.jpg"
      scanningLabel="DVF benchmark scan"
      feedLabel="dvf + local benchmark"
      publishedLabel="Market semaforo"
      tableTitle="Traffic lights from France DVF profiles"
      listTitle="France benchmark radar"
      currencyPrefix="EUR"
      locale="fr-FR"
      listings={FRANCE_RADAR_LISTINGS}
    />
  );
}
