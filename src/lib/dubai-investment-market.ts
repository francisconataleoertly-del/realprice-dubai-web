import investmentData from "@/data/dubai-investment-market.json";

export type DubaiInvestmentMarketData = {
  generated_at: string;
  market: string;
  purpose: string;
  source: {
    historical: Record<string, unknown>;
    live: Record<string, unknown>;
  };
  pipeline: {
    latest_full_historical_year: number;
    latest_live_year: number;
    comparison_base_year: number;
    historical_cagr_base_year: number;
    table_paths: Record<string, { path: string; bytes: number }>;
  };
  coverage: Record<string, unknown>;
  source_layers: Array<Record<string, unknown>>;
  by_year: Array<Record<string, unknown>>;
  top_area_signals: Array<Record<string, unknown>>;
  top_project_signals: Array<Record<string, unknown>>;
  live_area_pulse: Array<Record<string, unknown>>;
  caveats: string[];
};

const data = investmentData as DubaiInvestmentMarketData;

export function getDubaiInvestmentMarketData() {
  return data;
}
