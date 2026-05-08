import { NextResponse } from "next/server";

import { getDubaiInvestmentMarketData } from "@/lib/dubai-investment-market";

export async function GET() {
  const data = getDubaiInvestmentMarketData();

  return NextResponse.json({
    market: data.market,
    generated_at: data.generated_at,
    purpose: data.purpose,
    source: {
      historical: {
        name: data.source.historical.name,
        publisher: data.source.historical.publisher,
        coverage_note: data.source.historical.coverage_note,
      },
      live: {
        name: data.source.live.name,
        publisher: data.source.live.publisher,
        source_page: data.source.live.source_page,
        coverage_note: data.source.live.coverage_note,
      },
    },
    coverage: data.coverage,
    pipeline: {
      latest_full_historical_year: data.pipeline.latest_full_historical_year,
      latest_live_year: data.pipeline.latest_live_year,
      comparison_base_year: data.pipeline.comparison_base_year,
      historical_cagr_base_year: data.pipeline.historical_cagr_base_year,
      tables: Object.keys(data.pipeline.table_paths),
    },
    source_layers: data.source_layers,
    by_year: data.by_year,
    top_area_signals: data.top_area_signals,
    top_project_signals: data.top_project_signals,
    live_area_pulse: data.live_area_pulse,
    caveats: data.caveats,
  });
}
