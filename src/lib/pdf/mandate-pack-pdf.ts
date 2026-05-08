import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";

import type { MandatePackReport } from "@/data/mandate-pack-demo";

type PdfMode = "broker" | "seller";

const PAGE = {
  width: 595,
  height: 842,
  marginX: 42,
  marginTop: 44,
  marginBottom: 42,
};

const COLORS = {
  ink: rgb(0.07, 0.1, 0.16),
  slate: rgb(0.37, 0.42, 0.5),
  line: rgb(0.86, 0.88, 0.92),
  soft: rgb(0.96, 0.97, 0.985),
  brand: rgb(0.23, 0.51, 0.96),
  brandSoft: rgb(0.93, 0.96, 1),
  goldSoft: rgb(1, 0.97, 0.9),
  goldLine: rgb(0.91, 0.81, 0.55),
};

function aed(value: number) {
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(value);
}

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function fitText(
  text: string,
  width: number,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  size: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawParagraph(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  lineHeight: number,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  color = COLORS.slate,
) {
  const lines = fitText(text, width, font, size);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font: font as never,
      color,
    });
  });
  return y - lines.length * lineHeight;
}

function drawLabel(page: PDFPage, text: string, x: number, y: number, font: never) {
  page.drawText(text.toUpperCase(), {
    x,
    y,
    size: 9,
    font,
    color: COLORS.slate,
  });
}

function drawBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  background = COLORS.soft,
  border = COLORS.line,
) {
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: background,
    borderColor: border,
    borderWidth: 1,
  });
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hexToRgbColor(hex: string | undefined, fallback = COLORS.brand) {
  const normalized = (hex || "").trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;
  const value = Number.parseInt(normalized, 16);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function tint(color: ReturnType<typeof rgb>, amount: number) {
  return rgb(
    color.red + (1 - color.red) * amount,
    color.green + (1 - color.green) * amount,
    color.blue + (1 - color.blue) * amount,
  );
}

async function resolveLogo(
  pdf: PDFDocument,
  logoDataUrl: string | null | undefined,
) {
  if (logoDataUrl?.startsWith("data:image/png;base64,")) {
    const bytes = Buffer.from(logoDataUrl.split(",", 2)[1], "base64");
    return pdf.embedPng(bytes);
  }
  if (logoDataUrl?.startsWith("data:image/jpeg;base64,") || logoDataUrl?.startsWith("data:image/jpg;base64,")) {
    const bytes = Buffer.from(logoDataUrl.split(",", 2)[1], "base64");
    return pdf.embedJpg(bytes);
  }

  const logoBytes = await readFile(
    path.join(process.cwd(), "public", "brand", "fonatprop-final-icon-circle.png"),
  );
  return pdf.embedPng(logoBytes);
}

export async function buildMandatePackPdf(report: MandatePackReport, mode: PdfMode) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const brand = hexToRgbColor(report.branding?.accent_hex);
  const brandSoft = tint(brand, 0.88);
  const logo = await resolveLogo(pdf, report.branding?.logo_data_url);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let cursorY = PAGE.height - PAGE.marginTop;

  page.drawImage(logo, {
    x: PAGE.marginX,
    y: cursorY - 46,
    width: 38,
    height: 38,
  });
  page.drawText(`${report.agency.name.toUpperCase()} / MANDATE PACK`, {
    x: PAGE.marginX + 52,
    y: cursorY - 12,
    size: 10,
    font: fontBold,
    color: brand,
  });
  page.drawText(mode === "seller" ? "Seller pricing report." : "Broker mandate pack.", {
    x: PAGE.marginX,
    y: cursorY - 78,
    size: 28,
    font: fontBold,
    color: COLORS.ink,
  });
  page.drawText(report.market, {
    x: PAGE.marginX,
    y: cursorY - 100,
    size: 12,
    font: fontItalic,
    color: COLORS.slate,
  });
  page.drawText(report.agency.name, {
    x: PAGE.width - PAGE.marginX - fontBold.widthOfTextAtSize(report.agency.name, 11),
    y: cursorY - 14,
    size: 11,
    font: fontBold,
    color: COLORS.ink,
  });
  page.drawText(report.agent.name, {
    x: PAGE.width - PAGE.marginX - fontRegular.widthOfTextAtSize(report.agent.name, 10),
    y: cursorY - 30,
    size: 10,
    font: fontRegular,
    color: COLORS.slate,
  });
  page.drawText(report.generated_at.slice(0, 10), {
    x: PAGE.width - PAGE.marginX - fontRegular.widthOfTextAtSize(report.generated_at.slice(0, 10), 10),
    y: cursorY - 46,
    size: 10,
    font: fontRegular,
    color: COLORS.slate,
  });

  cursorY = drawParagraph(
    page,
    mode === "seller" ? report.seller_summary : report.subtitle,
    PAGE.marginX,
    cursorY - 126,
    PAGE.width - PAGE.marginX * 2,
    11,
    16,
    fontRegular,
    COLORS.slate,
  );

  const summaryY = cursorY - 18;
  const metricWidth = (PAGE.width - PAGE.marginX * 2 - 24) / 4;
  const summaryMetrics = [
    {
      label: "Property",
      value: `${report.property.type} / ${report.property.rooms}`,
      detail: `${report.property.area_sqft} sqft / ${report.property.community}`,
    },
    {
      label: "Recommended value",
      value: `AED ${aed(report.valuation.predicted_aed)}`,
      detail: `USD ${usd(report.valuation.predicted_usd)}`,
    },
    {
      label: "AI range",
      value: `AED ${aed(report.valuation.confidence_low_aed)} to AED ${aed(report.valuation.confidence_high_aed)}`,
      detail: `+/- ${report.valuation.confidence_pct.toFixed(1)}%`,
    },
    {
      label: "Recommended action",
      value: report.listing_strategy.recommended_label,
      detail: report.listing_strategy.expected_days_live,
    },
  ];

  summaryMetrics.forEach((metric, index) => {
    const x = PAGE.marginX + index * (metricWidth + 8);
    drawBox(page, x, summaryY, metricWidth, 84);
    drawLabel(page, metric.label, x + 12, summaryY - 16, fontBold as never);
    page.drawText(metric.value, {
      x: x + 12,
      y: summaryY - 38,
      size: 11,
      font: fontBold,
      color: COLORS.ink,
    });
    drawParagraph(page, metric.detail, x + 12, summaryY - 54, metricWidth - 24, 9, 12, fontRegular, COLORS.slate);
  });

  const strategyY = summaryY - 108;
  page.drawText("Pricing strategy", {
    x: PAGE.marginX,
    y: strategyY,
    size: 15,
    font: fontBold,
    color: COLORS.ink,
  });
  const cardWidth = (PAGE.width - PAGE.marginX * 2 - 16) / 3;
  [
    ["Fast sale", report.listing_strategy.fast_sale_aed, COLORS.soft, COLORS.line],
    [report.listing_strategy.recommended_label, report.listing_strategy.target_aed, brandSoft, brand],
    ["Ambitious", report.listing_strategy.ambitious_aed, COLORS.goldSoft, COLORS.goldLine],
  ].forEach(([label, value, bg, line], index) => {
    const x = PAGE.marginX + index * (cardWidth + 8);
    drawBox(page, x, strategyY - 16, cardWidth, 90, bg as typeof COLORS.soft, line as typeof COLORS.line);
    drawLabel(page, String(label), x + 14, strategyY - 34, fontBold as never);
    page.drawText(`AED ${aed(Number(value))}`, {
      x: x + 14,
      y: strategyY - 60,
      size: 18,
      font: fontBold,
      color: COLORS.ink,
    });
  });

  const stripY = strategyY - 124;
  [
    ["Negotiation floor", `AED ${aed(report.listing_strategy.negotiation_floor_aed)}`],
    ["Price per sqft", `AED ${aed(report.valuation.price_per_sqft_aed)}`],
    ["Expected live period", report.listing_strategy.expected_days_live],
  ].forEach(([label, value], index) => {
    const x = PAGE.marginX + index * (cardWidth + 8);
    drawBox(page, x, stripY, cardWidth, 64);
    drawLabel(page, String(label), x + 12, stripY - 16, fontBold as never);
    page.drawText(String(value), {
      x: x + 12,
      y: stripY - 40,
      size: 11,
      font: fontBold,
      color: COLORS.ink,
    });
  });

  const notesY = stripY - 92;
  page.drawText(mode === "seller" ? "Next steps" : "Broker notes", {
    x: PAGE.marginX,
    y: notesY,
    size: 15,
    font: fontBold,
    color: COLORS.ink,
  });
  const notes = mode === "seller" ? report.next_actions : report.broker_notes;
  notes.forEach((note, index) => {
    const x = PAGE.marginX + (index % 2) * ((PAGE.width - PAGE.marginX * 2 - 12) / 2 + 12);
    const row = Math.floor(index / 2);
    const y = notesY - 18 - row * 82;
    drawBox(page, x, y, (PAGE.width - PAGE.marginX * 2 - 12) / 2, 70);
    drawParagraph(page, note, x + 12, y - 16, (PAGE.width - PAGE.marginX * 2 - 36) / 2, 10, 13, fontRegular, COLORS.ink);
  });

  page = pdf.addPage([PAGE.width, PAGE.height]);
  cursorY = PAGE.height - PAGE.marginTop;
  page.drawText("Comparable evidence", {
    x: PAGE.marginX,
    y: cursorY,
    size: 22,
    font: fontBold,
    color: COLORS.ink,
  });
  page.drawText("Recent premium-market transactions supporting the pricing recommendation.", {
    x: PAGE.marginX,
    y: cursorY - 20,
    size: 10,
    font: fontRegular,
    color: COLORS.slate,
  });

  let tableY = cursorY - 52;
  const cols = [0, 185, 295, 395, 485];
  drawBox(page, PAGE.marginX, tableY + 8, PAGE.width - PAGE.marginX * 2, 34, brandSoft, brand);
  ["Building", "Date / type", "Sale price", "AED / sqft", "Match"].forEach((label, index) => {
    page.drawText(label, {
      x: PAGE.marginX + 12 + cols[index],
      y: tableY - 12,
      size: 9,
      font: fontBold,
      color: COLORS.ink,
    });
  });
  tableY -= 42;

  report.comparables.forEach((item, index) => {
    drawBox(page, PAGE.marginX, tableY + 4, PAGE.width - PAGE.marginX * 2, 48, index % 2 === 0 ? rgb(1, 1, 1) : COLORS.soft);
    page.drawText(item.building, {
      x: PAGE.marginX + 12,
      y: tableY - 10,
      size: 10,
      font: fontBold,
      color: COLORS.ink,
    });
    page.drawText(`${item.date} / ${item.rooms}`, {
      x: PAGE.marginX + 12 + cols[1],
      y: tableY - 10,
      size: 9,
      font: fontRegular,
      color: COLORS.slate,
    });
    page.drawText(`AED ${aed(item.price_aed)}`, {
      x: PAGE.marginX + 12 + cols[2],
      y: tableY - 10,
      size: 9,
      font: fontBold,
      color: COLORS.ink,
    });
    page.drawText(aed(item.price_per_sqft_aed), {
      x: PAGE.marginX + 12 + cols[3],
      y: tableY - 10,
      size: 9,
      font: fontBold,
      color: COLORS.ink,
    });
    page.drawText(item.similarity_label, {
      x: PAGE.marginX + 12 + cols[4],
      y: tableY - 10,
      size: 9,
      font: fontRegular,
      color: COLORS.ink,
    });
    page.drawText(`${item.area_sqft} sqft`, {
      x: PAGE.marginX + 12,
      y: tableY - 24,
      size: 8,
      font: fontRegular,
      color: COLORS.slate,
    });
    tableY -= 56;
  });

  const sideTop = tableY - 10;
  page.drawText("Property summary", {
    x: PAGE.marginX,
    y: sideTop,
    size: 16,
    font: fontBold,
    color: COLORS.ink,
  });
  const summaryRows = [
    ["Address", report.property.address],
    ["Building", report.property.building],
    ["Community", report.property.community],
    ["Status", report.property.status],
    ["Parking", report.property.parking],
    ["View", report.property.view],
    ["Area", `${report.property.area_m2} sqm / ${report.property.area_sqft} sqft`],
  ];
  let infoY = sideTop - 20;
  summaryRows.forEach(([label, value]) => {
    drawBox(page, PAGE.marginX, infoY, PAGE.width - PAGE.marginX * 2, 38);
    drawLabel(page, label, PAGE.marginX + 12, infoY - 14, fontBold as never);
    page.drawText(value, {
      x: PAGE.marginX + 140,
      y: infoY - 14,
      size: 10,
      font: fontRegular,
      color: COLORS.ink,
    });
    infoY -= 46;
  });

  page = pdf.addPage([PAGE.width, PAGE.height]);
  cursorY = PAGE.height - PAGE.marginTop;
  page.drawText(mode === "seller" ? "What happens next" : "Confidence and market notes", {
    x: PAGE.marginX,
    y: cursorY,
    size: 22,
    font: fontBold,
    color: COLORS.ink,
  });

  const confidenceBoxY = cursorY - 28;
  drawBox(page, PAGE.marginX, confidenceBoxY, PAGE.width - PAGE.marginX * 2, 92, brandSoft, brand);
  page.drawText("Confidence summary", {
    x: PAGE.marginX + 14,
    y: confidenceBoxY - 18,
    size: 11,
    font: fontBold,
    color: COLORS.ink,
  });
  page.drawText(`${report.reliability.label} / ${report.reliability.score} of 100`, {
    x: PAGE.marginX + 14,
    y: confidenceBoxY - 40,
    size: 16,
    font: fontBold,
    color: COLORS.ink,
  });
  drawParagraph(
    page,
    report.reliability.methodology[0] || "AI valuation uses real transaction evidence plus broker review.",
    PAGE.marginX + 14,
    confidenceBoxY - 58,
    PAGE.width - PAGE.marginX * 2 - 28,
    10,
    13,
    fontRegular,
    COLORS.slate,
  );

  const signalsY = confidenceBoxY - 116;
  page.drawText("Market signals", {
    x: PAGE.marginX,
    y: signalsY,
    size: 16,
    font: fontBold,
    color: COLORS.ink,
  });
  let signalCursor = signalsY - 20;
  report.market_signals.forEach((signal) => {
    drawBox(page, PAGE.marginX, signalCursor, PAGE.width - PAGE.marginX * 2, 62);
    page.drawText(signal.label, {
      x: PAGE.marginX + 12,
      y: signalCursor - 16,
      size: 10,
      font: fontBold,
      color: COLORS.ink,
    });
    page.drawText(signal.value, {
      x: PAGE.width - PAGE.marginX - fontBold.widthOfTextAtSize(signal.value, 10) - 12,
      y: signalCursor - 16,
      size: 10,
      font: fontBold,
      color: COLORS.ink,
    });
    drawParagraph(page, signal.detail, PAGE.marginX + 12, signalCursor - 32, PAGE.width - PAGE.marginX * 2 - 24, 9, 12, fontRegular, COLORS.slate);
    signalCursor -= 72;
  });

  const finalNotesY = signalCursor - 8;
  page.drawText(mode === "seller" ? "Recommended next steps" : "Broker notes", {
    x: PAGE.marginX,
    y: finalNotesY,
    size: 16,
    font: fontBold,
    color: COLORS.ink,
  });
  let finalCursor = finalNotesY - 18;
  const finalItems = mode === "seller" ? report.next_actions : report.broker_notes;
  finalItems.forEach((item) => {
    drawBox(page, PAGE.marginX, finalCursor, PAGE.width - PAGE.marginX * 2, 54);
    drawParagraph(page, item, PAGE.marginX + 12, finalCursor - 16, PAGE.width - PAGE.marginX * 2 - 24, 10, 13, fontRegular, COLORS.ink);
    finalCursor -= 64;
  });

  const footerY = 64;
  page.drawLine({
    start: { x: PAGE.marginX, y: footerY + 20 },
    end: { x: PAGE.width - PAGE.marginX, y: footerY + 20 },
    thickness: 1,
    color: COLORS.line,
  });
  drawParagraph(page, report.disclaimer, PAGE.marginX, footerY + 6, 330, 8, 11, fontRegular, COLORS.slate);
  page.drawText(report.agency.name, {
    x: PAGE.width - PAGE.marginX - fontBold.widthOfTextAtSize(report.agency.name, 9),
    y: footerY + 10,
    size: 9,
    font: fontBold,
    color: COLORS.ink,
  });
  page.drawText(`${report.agent.email} / ${report.agent.whatsapp}`, {
    x: PAGE.width - PAGE.marginX - fontRegular.widthOfTextAtSize(`${report.agent.email} / ${report.agent.whatsapp}`, 8),
    y: footerY - 2,
    size: 8,
    font: fontRegular,
    color: COLORS.slate,
  });
  page.drawText(`${report.agency.phone} / ${report.agency.website}`, {
    x: PAGE.width - PAGE.marginX - fontRegular.widthOfTextAtSize(`${report.agency.phone} / ${report.agency.website}`, 8),
    y: footerY - 14,
    size: 8,
    font: fontRegular,
    color: COLORS.slate,
  });

  return pdf.save();
}

export function buildMandatePackFilename(report: MandatePackReport, mode: PdfMode) {
  const base = safeFilename(`${report.property.building || report.property.community || "mandate-pack"}-${mode}`);
  return `${base || "mandate-pack"}.pdf`;
}
