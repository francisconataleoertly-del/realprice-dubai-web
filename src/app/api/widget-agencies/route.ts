import { NextResponse } from "next/server";

import { canAccessFeature, DEFAULT_FEATURE_FLAGS } from "@/lib/access-control";
import {
  listWidgetAgencies,
  upsertWidgetAgency,
  type WidgetAgencyInput,
  type WidgetAgencyMarket,
} from "@/lib/widget-agencies";
import { getServerAccessSession } from "@/lib/supabase/access";

function normalizeMarket(value: unknown): WidgetAgencyMarket {
  return value === "france" || value === "multi" ? value : "dubai";
}

function normalizeHosts(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") return value.split(",");
  return [];
}

export async function GET() {
  const { configured, session } = await getServerAccessSession();
  if (!configured) {
    return NextResponse.json({ configured: false, rows: [], detail: "Supabase auth is not configured." });
  }

  if (!canAccessFeature(session, "admin", DEFAULT_FEATURE_FLAGS)) {
    return NextResponse.json({ detail: "Admin access required." }, { status: 403 });
  }

  try {
    const result = await listWidgetAgencies();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Could not load widget agencies." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { configured, session } = await getServerAccessSession();
  if (!configured) {
    return NextResponse.json({ detail: "Supabase auth is not configured." }, { status: 503 });
  }

  if (!canAccessFeature(session, "admin", DEFAULT_FEATURE_FLAGS)) {
    return NextResponse.json({ detail: "Admin access required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const payload: WidgetAgencyInput = {
    agencyId: String(body.agencyId || "").trim(),
    label: String(body.label || "").trim(),
    market: normalizeMarket(body.market),
    token: String(body.token || "").trim(),
    allowedHosts: normalizeHosts(body.allowedHosts),
    agentPhone: String(body.agentPhone || "").trim(),
    agentEmail: String(body.agentEmail || "").trim(),
    leadWebhook: String(body.leadWebhook || "/api/leads").trim(),
    isActive: body.isActive !== false,
    notes: typeof body.notes === "string" ? body.notes : null,
  };

  if (!payload.agencyId || !payload.label || !payload.token) {
    return NextResponse.json(
      { detail: "agencyId, label and token are required." },
      { status: 400 },
    );
  }

  const result = await upsertWidgetAgency(payload);
  if (!result.ok) {
    return NextResponse.json({ detail: result.detail }, { status: result.status });
  }

  return NextResponse.json({ row: result.row });
}
