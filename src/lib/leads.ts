export type LeadMarket = "dubai" | "france";
export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost" | "archived";
export type LeadPriority = "low" | "normal" | "high";

export type LeadRow = {
  id: string;
  market: LeadMarket;
  source: string;
  event: string | null;
  agency_id: string | null;
  section: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  zone: string | null;
  property_type: string | null;
  rooms: string | null;
  area_m2: number | null;
  estimated_value: number | null;
  valuation_low: number | null;
  valuation_high: number | null;
  valuation_range_label: string | null;
  currency: string;
  agent_email: string | null;
  agent_phone: string | null;
  snapshot: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
  user_agent: string | null;
  referer: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadInsert = Omit<LeadRow, "id" | "created_at" | "updated_at" | "status"> & {
  status?: LeadStatus;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, max = 240) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function marketFromPayload(payload: Record<string, unknown>, fallback?: LeadMarket): LeadMarket {
  if (payload.market === "france" || payload.market === "dubai") return payload.market;
  if (fallback) return fallback;
  const section = asString(payload.section)?.toLowerCase() || "";
  const event = asString(payload.event)?.toLowerCase() || "";
  if (section.includes("france") || event.includes("france")) return "france";
  return "dubai";
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const str = asString(value);
    if (str) return str;
  }
  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = asNumber(value);
    if (number !== null) return number;
  }
  return null;
}

export function normalizeLeadPayload(
  payload: unknown,
  headers?: Headers,
  fallbackMarket?: LeadMarket,
): LeadInsert {
  const body = asObject(payload);
  const snapshot = asObject(body.snapshot);
  const property = asObject(body.property);
  const rawPrediction = asObject(body.raw_prediction);
  const market = marketFromPayload(body, fallbackMarket);
  const section = firstString(body.section, snapshot.section);
  const event = firstString(body.event, section ? `${market}_${section}_lead` : null);
  const estimatedValue = firstNumber(
    body.estimated_value,
    rawPrediction.predicted_aed,
    rawPrediction.predicted_eur,
    snapshot.estimate_eur,
    snapshot.estimate,
  );

  const valuationLow = firstNumber(
    body.estimated_low_aed,
    body.estimated_low_eur,
    body.valuation_low,
    snapshot.estimate_low,
    snapshot.low,
  );
  const valuationHigh = firstNumber(
    body.estimated_high_aed,
    body.estimated_high_eur,
    body.valuation_high,
    snapshot.estimate_high,
    snapshot.high,
  );

  const address = firstString(
    body.address,
    body.building_name,
    property.address,
    snapshot.address,
    snapshot.commune,
    snapshot.city,
  );
  const zone = firstString(body.zone, body.zona, property.zone, property.zona, snapshot.zone, snapshot.city);
  const email = firstString(body.email);
  const phone = firstString(body.phone);

  return {
    market,
    source: firstString(body.source, body.mode, section, "website") || "website",
    event,
    agency_id: firstString(body.agency_id, body.agencyId),
    section,
    status: "new",
    priority: phone || address || estimatedValue ? "high" : "normal",
    name: firstString(body.name),
    email,
    phone,
    address,
    zone,
    property_type: firstString(body.property_type, property.type, property.property_type, snapshot.property_type),
    rooms: firstString(body.rooms, property.rooms, snapshot.rooms),
    area_m2: firstNumber(body.area_m2, property.area_m2, snapshot.area_m2),
    estimated_value: estimatedValue,
    valuation_low: valuationLow,
    valuation_high: valuationHigh,
    valuation_range_label: firstString(body.estimated_range, body.valuation_range_label, body.estimated_value),
    currency: market === "france" ? "EUR" : "AED",
    agent_email: firstString(body.agent_email),
    agent_phone: firstString(body.agent_phone),
    snapshot,
    raw_payload: body,
    user_agent: headers?.get("user-agent") || null,
    referer: headers?.get("referer") || null,
  };
}

export function isValidLead(lead: LeadInsert) {
  return Boolean(lead.email || lead.phone);
}

export function leadTableMissing(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === "42P01" || /relation .*leads|leads/i.test(error?.message || "");
}
