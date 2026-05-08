import { NextResponse } from "next/server";

import { estimateFranceValueV2 } from "@/lib/server/france-valuation-v2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = estimateFranceValueV2(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("France valuation failed", error);
    return NextResponse.json(
      { detail: "France valuation failed. Please check the address, commune and area." },
      { status: 500 }
    );
  }
}
