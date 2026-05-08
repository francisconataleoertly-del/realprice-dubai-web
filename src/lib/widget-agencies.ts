import { FONATPROP_CONTACT } from "@/lib/fonatprop-contact";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WidgetAgencyMarket = "dubai" | "france" | "multi";

export type WidgetAgencyConfig = {
  id: string;
  label: string;
  market: WidgetAgencyMarket;
  token: string;
  allowedHosts: string[];
  agentPhone: string;
  agentEmail: string;
  leadWebhook: string;
  isActive: boolean;
  notes: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type WidgetAgencyRow = {
  agency_id: string;
  label: string;
  market: WidgetAgencyMarket;
  token: string;
  allowed_hosts: string[] | null;
  agent_phone: string | null;
  agent_email: string | null;
  lead_webhook: string | null;
  is_active: boolean | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WidgetAgencyInput = {
  agencyId: string;
  label: string;
  market: WidgetAgencyMarket;
  token: string;
  allowedHosts: string[];
  agentPhone: string;
  agentEmail: string;
  leadWebhook: string;
  isActive: boolean;
  notes?: string | null;
};

export const DEFAULT_WIDGET_TOKEN = "fp_demo_widget_2026";
export const DEFAULT_WIDGET_AGENCY_ID = "broker-demo-001";
export const DEFAULT_ALLOWED_HOSTS = [
  "fonatprop.com",
  "www.fonatprop.com",
  "localhost",
  "127.0.0.1",
];

export function normalizeWidgetHost(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

export function parseHostList(raw?: string | string[] | null) {
  if (Array.isArray(raw)) {
    const normalized = raw.map((item) => normalizeWidgetHost(String(item))).filter(Boolean);
    return normalized.length ? normalized : DEFAULT_ALLOWED_HOSTS;
  }

  if (!raw) return DEFAULT_ALLOWED_HOSTS;

  return raw
    .split(",")
    .map((item) => normalizeWidgetHost(item))
    .filter(Boolean);
}

function supabaseUnavailable(error: { message?: string } | null | undefined) {
  return /fetch failed|network|timeout|failed to fetch/i.test(error?.message || "");
}

export function widgetAgencyTableMissing(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === "42P01" || /widget_agencies/i.test(error?.message || "");
}

function fallbackAgency(): WidgetAgencyConfig {
  const token =
    process.env.BROKER_DEMO_WIDGET_TOKEN ||
    process.env.NEXT_PUBLIC_BROKER_DEMO_WIDGET_TOKEN ||
    DEFAULT_WIDGET_TOKEN;

  return {
    id: DEFAULT_WIDGET_AGENCY_ID,
    label: "Broker demo / FonatProp",
    market: "dubai",
    token,
    allowedHosts: parseHostList(process.env.BROKER_DEMO_ALLOWED_HOSTS),
    agentPhone: FONATPROP_CONTACT.whatsappRaw,
    agentEmail: FONATPROP_CONTACT.email,
    leadWebhook: "/api/leads",
    isActive: true,
    notes: "Fallback demo agency used before the widget_agencies table is configured.",
  };
}

function rowToConfig(row: WidgetAgencyRow): WidgetAgencyConfig {
  return {
    id: row.agency_id,
    label: row.label,
    market: row.market,
    token: row.token,
    allowedHosts: parseHostList(row.allowed_hosts),
    agentPhone: row.agent_phone || FONATPROP_CONTACT.whatsappRaw,
    agentEmail: row.agent_email || FONATPROP_CONTACT.email,
    leadWebhook: row.lead_webhook || "/api/leads",
    isActive: row.is_active ?? true,
    notes: row.notes,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export async function listWidgetAgencies() {
  const fallback = [fallbackAgency()];
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false,
      table_ready: false,
      rows: fallback,
      detail: "Supabase is not configured; using fallback widget agency.",
    };
  }

  const { data, error } = await supabase
    .from("widget_agencies")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    if (widgetAgencyTableMissing(error) || supabaseUnavailable(error)) {
      return {
        configured: true,
        table_ready: false,
        rows: fallback,
        detail: "widget_agencies table is not created yet; using fallback agency.",
      };
    }

    throw new Error(error.message);
  }

  const rows = ((data || []) as WidgetAgencyRow[]).map(rowToConfig);
  return {
    configured: true,
    table_ready: true,
    rows: rows.length ? rows : fallback,
    detail: rows.length ? null : "No widget agencies stored yet; fallback agency remains available.",
  };
}

export async function getWidgetAgencyById(agencyId: string) {
  const normalized = String(agencyId || "").trim();
  if (!normalized) return null;

  const fallback = fallbackAgency();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return normalized === fallback.id ? fallback : null;
  }

  const { data, error } = await supabase
    .from("widget_agencies")
    .select("*")
    .eq("agency_id", normalized)
    .maybeSingle();

  if (error) {
    if (widgetAgencyTableMissing(error) || supabaseUnavailable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data) return normalized === fallback.id ? fallback : null;
  return rowToConfig(data as WidgetAgencyRow);
}

export async function upsertWidgetAgency(input: WidgetAgencyInput) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false as const,
      status: 503,
      detail: "Supabase is not configured.",
    };
  }

  const payload = {
    agency_id: input.agencyId.trim(),
    label: input.label.trim(),
    market: input.market,
    token: input.token.trim(),
    allowed_hosts: parseHostList(input.allowedHosts),
    agent_phone: input.agentPhone.trim() || null,
    agent_email: input.agentEmail.trim() || null,
    lead_webhook: input.leadWebhook.trim() || "/api/leads",
    is_active: input.isActive,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from("widget_agencies")
    .upsert(payload, { onConflict: "agency_id" })
    .select("*")
    .single();

  if (error) {
    if (widgetAgencyTableMissing(error)) {
      return {
        ok: false as const,
        status: 503,
        detail:
          "widget_agencies table is not created yet. Apply supabase/migrations/20260504_002_widget_agencies.sql.",
      };
    }

    return {
      ok: false as const,
      status: 500,
      detail: error.message,
    };
  }

  return {
    ok: true as const,
    row: rowToConfig(data as WidgetAgencyRow),
  };
}
