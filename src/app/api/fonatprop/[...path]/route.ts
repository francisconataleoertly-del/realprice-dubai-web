import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_FEATURE_FLAGS,
  canAccessFeature,
  parseSessionFromCookieStore,
  type FonatPropFeature,
} from "@/lib/access-control";

const UPSTREAM_API =
  process.env.NEXT_PUBLIC_FONATPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_NEXOPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_REALPRICE_API_BASE_URL ||
  "https://web-production-9051f.up.railway.app";

function getFeatureForPath(pathname: string): FonatPropFeature {
  if (
    pathname === "predict" ||
    pathname === "comparables"
  ) {
    return "valuation";
  }

  if (
    pathname === "investment" ||
    pathname === "renovation" ||
    pathname === "renovation/estimate"
  ) {
    return pathname.startsWith("renovation") ? "renovation" : "investment";
  }

  if (
    pathname === "zone-stats" ||
    pathname.startsWith("zone-stats/") ||
    pathname === "zones"
  ) {
    return "map";
  }

  if (pathname === "trends" || pathname.startsWith("trends/")) {
    return "radar";
  }

  return "app";
}

async function forward(request: NextRequest, method: "GET" | "POST") {
  const segments = request.nextUrl.pathname.split("/api/fonatprop/")[1] || "";
  const path = segments.replace(/^\/+/, "");
  const feature = getFeatureForPath(path);

  const cookieStore = await cookies();
  const session = parseSessionFromCookieStore(cookieStore);

  if (!canAccessFeature(session, feature, DEFAULT_FEATURE_FLAGS)) {
    const status = session.authenticated ? 402 : 401;
    return NextResponse.json(
      {
        detail:
          status === 401
            ? "Login required for this FonatProp surface."
            : "Upgrade required for this FonatProp surface.",
      },
      { status }
    );
  }

  const upstreamUrl = new URL(`${UPSTREAM_API}/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  const response = await fetch(upstreamUrl.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body:
      method === "POST"
        ? JSON.stringify(await request.json())
        : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "application/json";

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": contentType,
    },
  });
}

export async function GET(request: NextRequest) {
  return forward(request, "GET");
}

export async function POST(request: NextRequest) {
  return forward(request, "POST");
}
