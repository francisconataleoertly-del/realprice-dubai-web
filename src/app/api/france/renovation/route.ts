import { NextResponse } from "next/server";

import {
  getRenovationMaterialsForMarket,
  summarizeRenovationMaterials,
} from "@/data/renovation-materials";
import { estimateFranceRenovation, getFranceRenovationCatalog } from "@/lib/france-market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room");
  const tier = searchParams.get("tier");
  const allMaterials = getRenovationMaterialsForMarket("france");
  const materials = allMaterials.filter((item) => {
    const roomMatch = !room || item.room === room;
    const tierMatch = !tier || item.tier === tier;
    return roomMatch && tierMatch;
  });

  return NextResponse.json({
    market: "france",
    catalog: getFranceRenovationCatalog(),
    materials,
    materials_summary: summarizeRenovationMaterials(materials),
    materials_filters: {
      room: room || null,
      tier: tier || null,
      full_market_summary: summarizeRenovationMaterials(allMaterials),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(estimateFranceRenovation(body));
  } catch (error) {
    console.error("France renovation estimate failed", error);
    return NextResponse.json(
      { detail: "France renovation estimate failed. Please check area, tier and categories." },
      { status: 500 }
    );
  }
}
