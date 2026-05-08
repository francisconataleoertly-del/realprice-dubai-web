import { NextRequest, NextResponse } from "next/server";

import { isValidLead, leadTableMissing, normalizeLeadPayload } from "@/lib/leads";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LeadPayload = {
  email?: unknown;
  name?: unknown;
  phone?: unknown;
  section?: unknown;
  snapshot?: unknown;
};

const ALLOWED_SECTIONS = new Set(["valuation", "investment", "reforma"]);

export async function POST(req: NextRequest) {
  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const section = typeof body.section === "string" ? body.section : "";
  if (!ALLOWED_SECTIONS.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const lead = {
    email,
    name: typeof body.name === "string" ? body.name.trim().slice(0, 120) : undefined,
    phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : undefined,
    section,
    snapshot: body.snapshot ?? null,
    received_at: new Date().toISOString(),
    user_agent: req.headers.get("user-agent") ?? undefined,
    referer: req.headers.get("referer") ?? undefined,
  };

  const normalizedLead = normalizeLeadPayload(
    {
      ...body,
      market: "france",
      source: "france-report",
      event: `france_${section}_lead`,
    },
    req.headers,
    "france",
  );
  if (!isValidLead(normalizedLead)) {
    return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
  }

  let stored = false;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase
      .from("leads")
      .insert(normalizedLead);

    if (error) {
      if (leadTableMissing(error)) {
        return NextResponse.json(
          {
            ok: false,
            stored: false,
            table_ready: false,
            detail: "leads table is not created yet; apply the Supabase migration.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: false, stored: false, detail: error.message }, { status: 500 });
    }

    stored = true;
  }

  // Optional: fan-out to a webhook if configured (no need to deploy a CRM yet).
  const webhook = process.env.FONATPROP_LEAD_WEBHOOK;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
    } catch (err) {
      console.error("[france/lead] webhook delivery failed", err);
    }
  }

  return NextResponse.json({
    ok: true,
    stored,
    received_at: lead.received_at,
  });
}
