import { NextResponse } from "next/server";

import {
  buildWidgetCorsHeaders,
  readWidgetCredentials,
  validateWidgetRequest,
} from "@/lib/widget-security";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: buildWidgetCorsHeaders(origin),
  });
}

export async function GET(request: Request) {
  const credentials = readWidgetCredentials(request, { allowQueryFallback: true });
  const validation = await validateWidgetRequest(request, credentials);
  if (!validation.ok) {
    return validation.response;
  }

  const baseUrl = new URL(request.url).origin;

  return NextResponse.json(
    {
      ok: true,
      agencyId: validation.agency.id,
      widgetApiBase: `${baseUrl}/api/widget`,
      apiBase: `${baseUrl}/api/widget`,
      agentPhone: validation.agency.agentPhone,
      agentEmail: validation.agency.agentEmail,
      leadWebhook: `${baseUrl}${validation.agency.leadWebhook}`,
    },
    {
      headers: {
        ...buildWidgetCorsHeaders(validation.origin),
        "Cache-Control": "no-store",
      },
    },
  );
}
