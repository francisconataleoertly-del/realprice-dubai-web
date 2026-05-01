import { NextResponse } from "next/server";

import { getFranceMarketData, normalizeFranceText, type FrancePropertyType } from "@/lib/france-market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = normalizeFranceText(searchParams.get("q") || "");
  const propertyType = (searchParams.get("property_type") || "Appartement") as FrancePropertyType;
  const limit = Math.min(Number(searchParams.get("limit") || 25), 100);
  const data = getFranceMarketData();

  const rows = data.by_commune
    .filter((row) => row.property_type === propertyType)
    .filter((row) => {
      if (!q) return true;
      return normalizeFranceText(row.commune).includes(q);
    })
    .slice(0, limit);

  return NextResponse.json({
    market: "france",
    total: rows.length,
    property_type: propertyType,
    communes: rows,
  });
}
