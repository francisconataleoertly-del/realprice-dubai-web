import { NextResponse } from "next/server";

import { estimateFranceRenovation, getFranceRenovationCatalog } from "@/lib/france-market";

export async function GET() {
  return NextResponse.json({
    market: "france",
    catalog: getFranceRenovationCatalog(),
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
