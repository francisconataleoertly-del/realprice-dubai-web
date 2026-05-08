import { NextResponse } from "next/server";

import { canAccessFeature, DEFAULT_FEATURE_FLAGS } from "@/lib/access-control";
import {
  isValidLead,
  leadTableMissing,
  normalizeLeadPayload,
  type LeadPriority,
  type LeadStatus,
} from "@/lib/leads";
import { getServerAccessSession } from "@/lib/supabase/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildWidgetCorsHeaders,
  readWidgetCredentials,
  validateWidgetRequest,
} from "@/lib/widget-security";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-FonatProp-Agency, X-FonatProp-Token",
};

const validStatuses = new Set<LeadStatus>([
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
  "archived",
]);

const validPriorities = new Set<LeadPriority>(["low", "normal", "high"]);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON body." },
      { status: 400, headers: corsHeaders },
    );
  }

  const lead = normalizeLeadPayload(body, request.headers);
  if (!isValidLead(lead)) {
    return NextResponse.json(
      { detail: "Email or phone is required." },
      { status: 400, headers: corsHeaders },
    );
  }

  if (lead.source === "public-widget") {
    const credentials = readWidgetCredentials(request);
    const validation = await validateWidgetRequest(request, credentials);
    if (!validation.ok) {
      return validation.response;
    }

    const widgetHeaders = buildWidgetCorsHeaders(validation.origin);
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          stored: false,
          detail: "Supabase is not configured; lead was not stored.",
        },
        { status: 503, headers: widgetHeaders },
      );
    }

    const { error } = await supabase.from("leads").insert(lead);

    if (error) {
      if (leadTableMissing(error)) {
        return NextResponse.json(
          {
            ok: false,
            configured: true,
            table_ready: false,
            stored: false,
            detail: "leads table is not created yet; apply the Supabase migration.",
          },
          { status: 503, headers: widgetHeaders },
        );
      }

      return NextResponse.json(
        { ok: false, stored: false, detail: error.message },
        { status: 500, headers: widgetHeaders },
      );
    }

    return NextResponse.json(
      { ok: true, stored: true, received_at: new Date().toISOString() },
      { headers: widgetHeaders },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        stored: false,
        detail: "Supabase is not configured; lead was not stored.",
      },
      { status: 503, headers: corsHeaders },
    );
  }

  const { error } = await supabase.from("leads").insert(lead);

  if (error) {
    if (leadTableMissing(error)) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          table_ready: false,
          stored: false,
          detail: "leads table is not created yet; apply the Supabase migration.",
        },
        { status: 503, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { ok: false, stored: false, detail: error.message },
      { status: 500, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    { ok: true, stored: true, received_at: new Date().toISOString() },
    { headers: corsHeaders },
  );
}

export async function GET(request: Request) {
  const { configured, session } = await getServerAccessSession();
  if (!configured) {
    return NextResponse.json({ configured: false, rows: [], detail: "Supabase auth is not configured." });
  }

  if (!canAccessFeature(session, "admin", DEFAULT_FEATURE_FLAGS)) {
    return NextResponse.json({ detail: "Admin access required." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ configured: false, rows: [] });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const market = searchParams.get("market");

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(150);

  if (status && validStatuses.has(status as LeadStatus)) query = query.eq("status", status);
  if (market === "dubai" || market === "france") query = query.eq("market", market);

  const { data, error } = await query;

  if (error) {
    if (leadTableMissing(error)) {
      return NextResponse.json({
        configured: true,
        table_ready: false,
        rows: [],
        detail: "leads table is not created yet; apply the Supabase migration.",
      });
    }

    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, table_ready: true, rows: data || [] });
}

export async function PATCH(request: Request) {
  const { configured, session } = await getServerAccessSession();
  if (!configured) {
    return NextResponse.json({ detail: "Supabase auth is not configured." }, { status: 503 });
  }

  if (!canAccessFeature(session, "admin", DEFAULT_FEATURE_FLAGS)) {
    return NextResponse.json({ detail: "Admin access required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: unknown;
    status?: unknown;
    priority?: unknown;
  };
  const id = typeof body.id === "string" ? body.id : "";
  const updates: Record<string, string> = {};

  if (!id) return NextResponse.json({ detail: "Lead id is required." }, { status: 400 });
  if (typeof body.status === "string" && validStatuses.has(body.status as LeadStatus)) {
    updates.status = body.status;
  }
  if (typeof body.priority === "string" && validPriorities.has(body.priority as LeadPriority)) {
    updates.priority = body.priority;
  }
  if (!Object.keys(updates).length) {
    return NextResponse.json({ detail: "Nothing to update." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ detail: "Supabase is not configured." }, { status: 503 });

  const { data, error } = await supabase.from("leads").update(updates).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });

  return NextResponse.json({ row: data });
}
