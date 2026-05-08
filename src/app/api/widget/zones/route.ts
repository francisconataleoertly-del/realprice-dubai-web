import { NextResponse } from "next/server";

import {
  buildWidgetCorsHeaders,
  readWidgetCredentials,
  validateWidgetRequest,
} from "@/lib/widget-security";

const UPSTREAM_API =
  process.env.NEXT_PUBLIC_FONATPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_NEXOPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_REALPRICE_API_BASE_URL ||
  "https://web-production-9051f.up.railway.app";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: buildWidgetCorsHeaders(origin),
  });
}

export async function GET(request: Request) {
  const credentials = readWidgetCredentials(request);
  const validation = await validateWidgetRequest(request, credentials);
  if (!validation.ok) {
    return validation.response;
  }

  const upstreamResponse = await fetch(`${UPSTREAM_API}/zones`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await upstreamResponse.text();
  return new NextResponse(text, {
    status: upstreamResponse.status,
    headers: {
      ...buildWidgetCorsHeaders(validation.origin),
      "content-type": upstreamResponse.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
