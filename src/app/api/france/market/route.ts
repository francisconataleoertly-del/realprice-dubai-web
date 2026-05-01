import { NextResponse } from "next/server";

import { getFranceMarketData } from "@/lib/france-market";

export async function GET() {
  const data = getFranceMarketData();

  return NextResponse.json({
    market: "france",
    generated_at: data.generated_at,
    source: data.source,
    coverage: data.coverage,
    by_year: data.by_year,
    top_markets: data.top_markets,
    top_trends: data.top_trends,
    featured: data.featured,
    pipeline: data.pipeline,
  });
}
