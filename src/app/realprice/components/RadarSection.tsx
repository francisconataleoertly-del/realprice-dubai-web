"use client";

import MarketRadarSection, {
  type RadarListing,
} from "@/components/radar/MarketRadarSection";

const DUBAI_RADAR_LISTINGS: RadarListing[] = [
  {
    id: 1,
    title: "Jumeirah Gate Tower 2",
    subtitle: "JBR | 2 BR",
    listedValue: 3_200_000,
    benchmarkValue: 3_960_000,
    diffPct: -19.2,
    signal: "green",
    angle: 42,
    distance: 0.86,
    areaLabel: "145 m2",
    note: "Tower inventory published below the model range, strong green-light candidate for investor outreach.",
  },
  {
    id: 2,
    title: "Burj Royale",
    subtitle: "Downtown Dubai | 1 BR",
    listedValue: 1_920_000,
    benchmarkValue: 1_975_000,
    diffPct: -2.8,
    signal: "yellow",
    angle: 88,
    distance: 0.58,
    areaLabel: "73 m2",
    note: "Very close to market. Good brochure listing, but not a discount alert.",
  },
  {
    id: 3,
    title: "Vida Residences",
    subtitle: "Dubai Marina | 1 BR",
    listedValue: 1_340_000,
    benchmarkValue: 1_575_000,
    diffPct: -14.9,
    signal: "green",
    angle: 128,
    distance: 0.61,
    areaLabel: "69 m2",
    note: "Published under the AVM benchmark. Push this into the radar feed when the owner wants fast traction.",
  },
  {
    id: 4,
    title: "The Sterling East",
    subtitle: "Business Bay | Studio",
    listedValue: 855_000,
    benchmarkValue: 828_000,
    diffPct: 3.3,
    signal: "yellow",
    angle: 164,
    distance: 0.44,
    areaLabel: "44 m2",
  },
  {
    id: 5,
    title: "Belgravia Heights",
    subtitle: "JVC | 2 BR",
    listedValue: 1_380_000,
    benchmarkValue: 1_245_000,
    diffPct: 10.8,
    signal: "red",
    angle: 208,
    distance: 0.69,
    areaLabel: "112 m2",
    note: "Listing is published above the model. The radar marks it red so agents can re-price before pushing traffic.",
  },
  {
    id: 6,
    title: "Sidra Villas III",
    subtitle: "Dubai Hills | 4 BR",
    listedValue: 6_050_000,
    benchmarkValue: 5_480_000,
    diffPct: 10.4,
    signal: "red",
    angle: 248,
    distance: 0.88,
    areaLabel: "355 m2",
  },
  {
    id: 7,
    title: "Marina Gate 1",
    subtitle: "Dubai Marina | 2 BR",
    listedValue: 2_280_000,
    benchmarkValue: 2_570_000,
    diffPct: -11.3,
    signal: "green",
    angle: 292,
    distance: 0.72,
    areaLabel: "121 m2",
  },
  {
    id: 8,
    title: "Index Tower",
    subtitle: "DIFC | 1 BR",
    listedValue: 2_180_000,
    benchmarkValue: 2_120_000,
    diffPct: 2.8,
    signal: "yellow",
    angle: 332,
    distance: 0.53,
    areaLabel: "81 m2",
  },
];

export default function RadarSection() {
  return (
    <MarketRadarSection
      chapterLabel="Chapter V"
      sectionLabel="Radar"
      title="Watch every"
      accentTitle="published opportunity."
      description="A live radar layer for the public FonatProp Dubai page. Every property you publish can light up green, amber or red against your valuation model, so owners and investors immediately see where the opportunity sits."
      backgroundImage="/dubai-tower-bg.jpg"
      scanningLabel="Dubai feed live"
      feedLabel="developer + tower inventory"
      publishedLabel="Published semaforo"
      tableTitle="Traffic lights for published Dubai listings"
      listTitle="Published radar feed"
      currencyPrefix="AED"
      locale="en-AE"
      listings={DUBAI_RADAR_LISTINGS}
    />
  );
}
