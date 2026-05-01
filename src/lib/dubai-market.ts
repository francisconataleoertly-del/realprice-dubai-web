import marketData from "@/data/dubai-transactions-market.json";

export type DubaiMarketData = {
  generated_at: string;
  source: {
    name: string;
    publisher: string;
    local_archive_path: string;
    archive_size_bytes: number;
    legal_note: string;
  };
  pipeline: {
    parquet_path: string;
    parquet_file_count: number;
    parquet_size_bytes: number;
    tables_dir: string;
    latest_full_year: number;
    table_paths: Record<string, string>;
  };
  coverage: {
    clean_sales_rows: number;
    residential_sales_rows: number;
    min_date: string;
    max_date: string;
    min_year: number;
    max_year: number;
    areas: number;
    projects: number;
    property_types: number;
    median_price_per_m2_aed: number;
    median_actual_worth_aed: number;
    total_sales_value_aed: number;
  };
  by_year: Array<Record<string, unknown>>;
  top_areas: Array<Record<string, unknown>>;
  top_projects: Array<Record<string, unknown>>;
  caveats: string[];
};

const data = marketData as DubaiMarketData;

export function getDubaiMarketData() {
  return data;
}
