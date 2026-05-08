import { NextResponse } from "next/server";

import { canAccessFeature, DEFAULT_FEATURE_FLAGS } from "@/lib/access-control";
import {
  publishedPropertyToRadarListing,
  scorePublishedProperty,
  type PublishedPropertyInput,
  type PublishedPropertyMarket,
  type PublishedPropertyRow,
} from "@/lib/published-properties";
import { getServerAccessSession } from "@/lib/supabase/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function tableMissing(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === "42P01" || /published_properties/i.test(error?.message || "");
}

function supabaseUnavailable(error: { message?: string } | null | undefined) {
  return /fetch failed|network|timeout|failed to fetch/i.test(error?.message || "");
}

function parseMarket(value: string | null): PublishedPropertyMarket | null {
  if (value === "dubai" || value === "france") return value;
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = parseMarket(searchParams.get("market"));
    const includeDrafts = searchParams.get("includeDrafts") === "1";
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({
        configured: false,
        listings: [],
        rows: [],
        detail: "Supabase is not configured; using benchmark radar fallback.",
      });
    }

    let query = supabase
      .from("published_properties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (market) query = query.eq("market", market);
    if (!includeDrafts) query = query.eq("status", "published");

    const { data, error } = await query;

    if (error) {
      if (tableMissing(error) || supabaseUnavailable(error)) {
        return NextResponse.json({
          configured: true,
          table_ready: false,
          listings: [],
          rows: [],
          detail: "published_properties table is not created yet; apply the Supabase migration.",
        });
      }

      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    const rows = (data || []) as PublishedPropertyRow[];
    const listings = rows.map((row, index) => ({
      ...publishedPropertyToRadarListing(row),
      angle: 24 + index * 31,
    }));

    return NextResponse.json({
      configured: true,
      table_ready: true,
      count: rows.length,
      listings,
      rows,
    });
  } catch (error) {
    return NextResponse.json({
      configured: false,
      table_ready: false,
      listings: [],
      rows: [],
      detail:
        error instanceof Error
          ? `Radar inventory fallback active: ${error.message}`
          : "Radar inventory fallback active.",
    });
  }
}

export async function POST(request: Request) {
  const { configured, session } = await getServerAccessSession();
  if (!configured) {
    return NextResponse.json(
      { detail: "Supabase auth is not configured yet." },
      { status: 503 }
    );
  }

  if (!canAccessFeature(session, "admin", DEFAULT_FEATURE_FLAGS)) {
    return NextResponse.json(
      { detail: "Admin access required to publish radar properties." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as Partial<PublishedPropertyInput>;
  const market = parseMarket(String(body.market || ""));
  const title = String(body.title || "").trim();
  const areaM2 = Number(body.area_m2);
  const askingPrice = Number(body.asking_price);

  if (!market || !title || !Number.isFinite(areaM2) || areaM2 <= 0 || !Number.isFinite(askingPrice) || askingPrice <= 0) {
    return NextResponse.json(
      { detail: "Market, title, area_m2 and asking_price are required." },
      { status: 400 }
    );
  }

  const scored = scorePublishedProperty({
    market,
    title,
    address: body.address,
    zone: body.zone,
    property_type: body.property_type,
    rooms: body.rooms,
    area_m2: areaM2,
    asking_price: askingPrice,
    image_url: body.image_url,
    status: body.status,
  });

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { detail: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("published_properties")
    .insert({
      ...scored,
      created_by: user?.id || null,
    })
    .select("*")
    .single();

  if (error) {
    if (tableMissing(error)) {
      return NextResponse.json(
        {
          detail:
            "published_properties table is not created yet. Apply supabase/migrations/20260501_001_published_properties.sql.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  const row = data as PublishedPropertyRow;

  return NextResponse.json({
    row,
    listing: publishedPropertyToRadarListing(row),
  });
}
