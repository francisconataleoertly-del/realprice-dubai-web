import { NextResponse } from "next/server";

import {
  getWidgetAgencyById,
  type WidgetAgencyConfig,
} from "@/lib/widget-agencies";

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

export async function getWidgetAgencyConfig(agencyId: string): Promise<WidgetAgencyConfig | null> {
  return getWidgetAgencyById(agencyId);
}

function extractHostFromUrl(value: string | null) {
  if (!value) return "";
  try {
    return normalizeHost(new URL(value).hostname);
  } catch {
    return "";
  }
}

export function getWidgetOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    const url = new URL(referer);
    return url.origin;
  } catch {
    return null;
  }
}

export function readWidgetCredentials(
  request: Request,
  options?: { allowQueryFallback?: boolean },
) {
  const url = new URL(request.url);
  const headers = request.headers;

  return {
    agencyId:
      headers.get("x-fonatprop-agency") ||
      (options?.allowQueryFallback ? url.searchParams.get("agencyId") : null) ||
      "",
    token:
      headers.get("x-fonatprop-token") ||
      (options?.allowQueryFallback ? url.searchParams.get("token") : null) ||
      "",
  };
}

export function buildWidgetCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, X-FonatProp-Agency, X-FonatProp-Token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export async function validateWidgetRequest(
  request: Request,
  credentials: { agencyId: string; token: string },
) {
  const agency = await getWidgetAgencyConfig(credentials.agencyId);
  const origin = getWidgetOrigin(request);

  if (!credentials.agencyId || !credentials.token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { detail: "Widget credentials are required." },
        { status: 401, headers: buildWidgetCorsHeaders(origin) },
      ),
    };
  }

  if (!agency || credentials.token !== agency.token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { detail: "Widget credentials are invalid." },
        { status: 403, headers: buildWidgetCorsHeaders(origin) },
      ),
    };
  }

  const requestHost =
    extractHostFromUrl(request.headers.get("origin")) ||
    extractHostFromUrl(request.headers.get("referer"));

  const allowed = requestHost && agency.isActive && agency.allowedHosts.includes(requestHost);
  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          detail: agency?.isActive
            ? "This domain is not allowed to use the widget."
            : "This widget token is not active.",
        },
        { status: 403, headers: buildWidgetCorsHeaders(origin) },
      ),
    };
  }

  return {
    ok: true as const,
    agency,
    origin,
  };
}
