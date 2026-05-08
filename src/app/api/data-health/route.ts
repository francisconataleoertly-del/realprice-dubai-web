import { NextResponse } from "next/server";

import dubaiProfiles from "@/app/realprice/data/realprice-address-profiles-v4-slim.json";
import franceMarket from "@/data/france-dvf-market.json";

type DubaiProfileRow = {
  latest_date?: string;
  count?: number;
  recent_count?: number;
};

type DubaiProfiles = {
  generated_at?: string;
  summary?: {
    rows_cleaned?: number;
    recent_cutoff?: string;
    building_profiles?: number;
    project_profiles?: number;
    zone_profiles?: number;
  };
  building_profiles?: DubaiProfileRow[];
  project_profiles?: DubaiProfileRow[];
  zone_profiles?: DubaiProfileRow[];
};

type FranceMarket = {
  generated_at?: string;
  source?: {
    name?: string;
    publisher?: string;
    method?: string;
  };
  coverage?: {
    clean_rows?: number;
    communes?: number;
    departments?: number;
    min_year?: number;
    max_year?: number;
    median_price_per_m2?: number;
    median_value_eur?: number;
  };
};

function latestDate(rows: DubaiProfileRow[] = []) {
  return rows.reduce<string | null>((latest, row) => {
    if (!row.latest_date) return latest;
    return !latest || row.latest_date > latest ? row.latest_date : latest;
  }, null);
}

function sumRows(rows: DubaiProfileRow[] = [], key: "count" | "recent_count") {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

export async function GET() {
  const dubai = dubaiProfiles as DubaiProfiles;
  const france = franceMarket as FranceMarket;
  const dubaiRows = [
    ...(dubai.building_profiles || []),
    ...(dubai.project_profiles || []),
    ...(dubai.zone_profiles || []),
  ];

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    markets: {
      dubai: {
        source: "Dubai Land Department transaction-trained address profiles",
        generated_at: dubai.generated_at || null,
        rows_cleaned: dubai.summary?.rows_cleaned || null,
        latest_transaction_date: latestDate(dubaiRows),
        recent_cutoff: dubai.summary?.recent_cutoff || null,
        profiles: {
          buildings: dubai.summary?.building_profiles || dubai.building_profiles?.length || 0,
          projects: dubai.summary?.project_profiles || dubai.project_profiles?.length || 0,
          zones: dubai.summary?.zone_profiles || dubai.zone_profiles?.length || 0,
        },
        evidence_rows_in_profiles: sumRows(dubaiRows, "count"),
        recent_evidence_rows_in_profiles: sumRows(dubaiRows, "recent_count"),
      },
      france: {
        source: france.source?.name || "DVF / Demandes de valeurs foncieres",
        publisher: france.source?.publisher || "DGFiP / Etalab, data.gouv.fr",
        generated_at: france.generated_at || null,
        method: france.source?.method || null,
        rows_cleaned: france.coverage?.clean_rows || null,
        communes: france.coverage?.communes || null,
        departments: france.coverage?.departments || null,
        year_range:
          france.coverage?.min_year && france.coverage?.max_year
            ? `${france.coverage.min_year}-${france.coverage.max_year}`
            : null,
        national_median_price_per_m2_eur: france.coverage?.median_price_per_m2 || null,
        national_median_value_eur: france.coverage?.median_value_eur || null,
      },
    },
    checks: [
      "Valuation responses include confidence score, warnings and comparable evidence.",
      "Dubai public valuation is separated from broker-demo workflow.",
      "France valuation is separated from Dubai and uses DVF market layers.",
    ],
  });
}
