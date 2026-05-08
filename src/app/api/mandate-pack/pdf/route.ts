import { NextRequest, NextResponse } from "next/server";

import type { MandatePackReport } from "@/data/mandate-pack-demo";
import { buildMandatePackFilename, buildMandatePackPdf } from "@/lib/pdf/mandate-pack-pdf";

export const runtime = "nodejs";

type RequestBody = {
  report?: MandatePackReport;
  mode?: "broker" | "seller";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    if (!body?.report) {
      return NextResponse.json({ detail: "Mandate Pack report payload is required." }, { status: 400 });
    }

    const mode = body.mode === "seller" ? "seller" : "broker";
    const pdfBytes = await buildMandatePackPdf(body.report, mode);
    const filename = buildMandatePackFilename(body.report, mode);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename=\"${filename}\"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[mandate-pack/pdf] Failed to generate PDF", error);
    return NextResponse.json({ detail: "Failed to generate mandate pack PDF." }, { status: 500 });
  }
}
