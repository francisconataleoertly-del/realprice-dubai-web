import { NextResponse } from "next/server";

import { getDubaiMarketData } from "@/lib/dubai-market";

export async function GET() {
  const data = getDubaiMarketData();

  return NextResponse.json({
    market: "dubai",
    generated_at: data.generated_at,
    source: {
      name: data.source.name,
      publisher: data.source.publisher,
      archive_size_bytes: data.source.archive_size_bytes,
      legal_note: data.source.legal_note,
    },
    coverage: data.coverage,
    pipeline: {
      parquet_file_count: data.pipeline.parquet_file_count,
      parquet_size_bytes: data.pipeline.parquet_size_bytes,
      latest_full_year: data.pipeline.latest_full_year,
      tables: Object.keys(data.pipeline.table_paths),
    },
    by_year: data.by_year,
    top_areas: data.top_areas,
    top_projects: data.top_projects,
    caveats: data.caveats,
  });
}
