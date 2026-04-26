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

const ZONE_ALIASES = [
  {
    zone: "Dubai Marina",
    aliases: ["dubai marina", "dubai marine", "marsa dubai", "marina"],
  },
  {
    zone: "Business Bay",
    aliases: ["business bay", "businessbay", "bay square"],
  },
  {
    zone: "Downtown Dubai",
    aliases: ["downtown dubai", "downtown", "burj khalifa", "burjkhalifa"],
  },
  {
    zone: "Palm Jumeirah",
    aliases: ["palm jumeirah", "the palm", "palm"],
  },
  {
    zone: "JVC",
    aliases: ["jvc", "jumeirah village circle"],
  },
  {
    zone: "JLT",
    aliases: ["jlt", "jumeirah lake towers"],
  },
  {
    zone: "Dubai Hills",
    aliases: ["dubai hills", "dubai hills estate"],
  },
  {
    zone: "Dubai Silicon Oasis",
    aliases: ["dubai silicon oasis", "silicon oasis"],
  },
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactText(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "");
}

function resolveZoneFallback(value: unknown) {
  const normalized = normalizeText(value);
  const compact = compactText(value);
  if (!normalized) return "";

  for (const entry of ZONE_ALIASES) {
    for (const alias of entry.aliases) {
      const aliasNormalized = normalizeText(alias);
      const aliasCompact = compactText(alias);
      if (
        normalized.includes(aliasNormalized) ||
        compact.includes(aliasCompact) ||
        aliasCompact.includes(compact)
      ) {
        return entry.zone;
      }
    }
  }

  return "";
}

function normalizeRooms(value: unknown) {
  const text = String(value || "1 B/R").trim();
  if (/studio/i.test(text)) return "Studio";
  const match = text.match(/([1-5])\s*B\s*\/?\s*R?/i);
  if (match) return `${match[1]} B/R`;
  const brMatch = text.match(/([1-5])\s*BR/i);
  if (brMatch) return `${brMatch[1]} B/R`;
  return text || "1 B/R";
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lookupText = [body.address, body.zona, body.building_name].filter(Boolean).join(" ");
    const fallbackZone = resolveZoneFallback(lookupText);
    const normalizedBody = {
      ...body,
      rooms: normalizeRooms(body.rooms),
      zona: fallbackZone || body.zona || body.address,
    };

    const upstreamResponse = await fetch(`${UPSTREAM_API}/predict-address`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(normalizedBody),
      cache: "no-store",
    });

    const data = await upstreamResponse.json().catch(() => ({}));
    if (upstreamResponse.ok) {
      return NextResponse.json(
        { ...data, widget_normalized_zone: fallbackZone || data.resolved_zone || null },
        {
          status: upstreamResponse.status,
          headers: CORS_HEADERS,
        }
      );
    }

    const areaM2 = Number(body.area_m2);
    if (fallbackZone && Number.isFinite(areaM2) && areaM2 >= 20) {
      const fallbackResponse = await fetch(`${UPSTREAM_API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          zona: fallbackZone,
          rooms: normalizeRooms(body.rooms),
          area_m2: areaM2,
          property_type: body.property_type || "Flat",
          is_freehold: body.is_freehold ?? true,
          is_offplan: body.is_offplan ?? false,
          has_parking: body.has_parking ?? true,
          year: body.year || new Date().getFullYear(),
          quarter: body.quarter || Math.floor(new Date().getMonth() / 3) + 1,
        }),
        cache: "no-store",
      });

      const fallbackData = await fallbackResponse.json().catch(() => ({}));
      if (fallbackResponse.ok) {
        return NextResponse.json(
          {
            ...fallbackData,
            resolved_zone: fallbackData.resolved_zone || fallbackZone,
            inferred_from_address: body.address || null,
            inference_source: "widget_zone_fallback",
            inferred_details_used: true,
            widget_normalized_zone: fallbackZone,
            widget_fallback_reason: data?.detail || "Address profile not found; used zone fallback.",
          },
          {
            status: 200,
            headers: CORS_HEADERS,
          }
        );
      }
    }

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
