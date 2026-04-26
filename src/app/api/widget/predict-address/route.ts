import { NextResponse } from "next/server";

const UPSTREAM_API =
  process.env.NEXT_PUBLIC_FONATPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_NEXOPROP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_REALPRICE_API_BASE_URL ||
  "https://web-production-9051f.up.railway.app";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const upstreamResponse = await fetch(`${UPSTREAM_API}/predict-address`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstreamResponse.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: upstreamResponse.status,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("widget predict-address failed", error);
    return NextResponse.json(
      { detail: "Widget valuation failed. Please try again." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
