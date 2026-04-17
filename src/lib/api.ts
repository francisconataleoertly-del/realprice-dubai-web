const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PredictRequest {
  zona: string;
  rooms: string;
  area_m2: number;
  is_freehold: boolean;
  is_offplan: boolean;
  has_parking: boolean;
  property_sub_type: string;
  building_name?: string;
  valuation_date?: string;
}

export interface PredictResponse {
  zona: string;
  rooms: string;
  area_m2: number;
  predicted_aed: number;
  predicted_usd: number;
  property_sub_type: string;
}

export interface MetricsResponse {
  metrics: {
    r2: number;
    mae_aed: number;
    mape_pct: number;
    median_absolute_error_aed: number;
  };
  training_summary: {
    rows_after_filtering: number;
    train_rows: number;
    test_rows: number;
    min_date: string;
    max_date: string;
    zones_seen: number;
    buildings_seen: number;
  };
  feature_importance: { feature: string; importance: number }[];
}

export interface ZonesResponse {
  count: number;
  zones_dld: string[];
  aliases_commercial_to_dld: Record<string, string>;
}

export async function predict(req: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Prediction failed");
  return res.json();
}

export async function getMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function getZones(): Promise<ZonesResponse> {
  const res = await fetch(`${API_BASE}/zones`);
  if (!res.ok) throw new Error("Failed to fetch zones");
  return res.json();
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export function formatAED(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
