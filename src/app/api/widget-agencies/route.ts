import { NextResponse } from "next/server";

import { canAccessFeature, DEFAULT_FEATURE_FLAGS } from "@/lib/access-control";
import {
  listWidgetAgencies,
  upsertWidgetAgency,
  type WidgetAgencyInput,
  type WidgetBillingStatus,
  type WidgetAgencyMarket,
  type WidgetAgencyTheme,
  type WidgetFrameShape,
  type WidgetLeadOverageMode,
  type WidgetLeadRoutingMode,
  type WidgetMode,
  type WidgetSurfaceTone,
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

function normalizeLeadLimit(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

function normalizePrice(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function normalizeOverageMode(value: unknown): WidgetLeadOverageMode {
  if (value === "hard_gate" || value === "unlimited") return value;
  return "soft_gate";
}

function normalizeBillingStatus(value: unknown): WidgetBillingStatus {
  if (value === "active" || value === "paused" || value === "cancelled") return value;
  return "trial";
}

function normalizeLeadRoutingMode(value: unknown): WidgetLeadRoutingMode {
  if (
    value === "webhook" ||
    value === "email_webhook" ||
    value === "whatsapp" ||
    value === "whatsapp_email" ||
    value === "whatsapp_webhook" ||
    value === "all" ||
    value === "manual"
  ) {
    return value;
  }
  return "email";
}

function normalizeWidgetMode(value: unknown): WidgetMode {
  return value === "carousel" ? "carousel" : "valuation";
}

function normalizeCarouselCards(value: unknown) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeFrameShape(value: unknown): WidgetFrameShape {
  if (value === "soft" || value === "square" || value === "pill") return value;
  return "rounded";
}

function normalizeSurfaceTone(value: unknown): WidgetSurfaceTone {
  if (value === "light" || value === "glass") return value;
  return "dark";
}

function normalizeTheme(body: Record<string, unknown>): Partial<WidgetAgencyTheme> {
  const raw = body.theme && typeof body.theme === "object" ? (body.theme as Record<string, unknown>) : {};

  return {
    accentColor: String(raw.accentColor ?? body.themeAccentColor ?? "").trim(),
    backgroundImage: String(raw.backgroundImage ?? body.themeBackgroundImage ?? "").trim(),
    frameShape: normalizeFrameShape(raw.frameShape ?? body.themeFrameShape),
    surfaceTone: normalizeSurfaceTone(raw.surfaceTone ?? body.themeSurfaceTone),
    headline: String(raw.headline ?? body.themeHeadline ?? "").trim(),
    subheadline: String(raw.subheadline ?? body.themeSubheadline ?? "").trim(),
    ctaLabel: String(raw.ctaLabel ?? body.themeCtaLabel ?? "").trim(),
    logoUrl: String(raw.logoUrl ?? body.themeLogoUrl ?? "").trim(),
  };
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
    widgetMode: normalizeWidgetMode(body.widgetMode),
    carouselCards: normalizeCarouselCards(body.carouselCards),
    isActive: body.isActive !== false,
    planCode: String(body.planCode || "pilot").trim(),
    monthlyLeadLimit: normalizeLeadLimit(body.monthlyLeadLimit),
    monthlyPriceUsd: normalizePrice(body.monthlyPriceUsd),
    watermarkEnabled: body.watermarkEnabled !== false,
    leadOverageMode: normalizeOverageMode(body.leadOverageMode),
    billingStatus: normalizeBillingStatus(body.billingStatus),
    trialEndsAt: typeof body.trialEndsAt === "string" && body.trialEndsAt.trim() ? body.trialEndsAt.trim() : null,
    notificationEmail: typeof body.notificationEmail === "string" ? body.notificationEmail.trim() : null,
    notificationPhone: typeof body.notificationPhone === "string" ? body.notificationPhone.trim() : null,
    crmWebhookUrl: typeof body.crmWebhookUrl === "string" ? body.crmWebhookUrl.trim() : null,
    leadRoutingMode: normalizeLeadRoutingMode(body.leadRoutingMode),
    monthlyReportEmail: typeof body.monthlyReportEmail === "string" ? body.monthlyReportEmail.trim() : null,
    handoffEnabled: body.handoffEnabled !== false,
    theme: normalizeTheme(body),
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
