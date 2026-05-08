export type DpeClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export const DUBAI_FEE_STACK = [
  {
    label: "DLD transfer",
    value: "4%",
    body: "Core Dubai transfer fee used in acquisition underwriting.",
  },
  {
    label: "Broker fee",
    value: "2% + VAT",
    body: "Standard buyer-side assumption; final mandate can differ.",
  },
  {
    label: "Mortgage registration",
    value: "0.25%",
    body: "Applied on mortgage amount when financing is used.",
  },
  {
    label: "Service charge",
    value: "Building-level",
    body: "Mollak/DLD service-charge index should be checked before trusting net yield.",
  },
];

const dubaiServiceChargeBands: Array<{
  match: RegExp;
  label: string;
  lowAedPerSqft: number;
  highAedPerSqft: number;
}> = [
  { match: /palm|jumeirah/i, label: "Prime waterfront", lowAedPerSqft: 25, highAedPerSqft: 45 },
  { match: /downtown|burj|opera/i, label: "Downtown core", lowAedPerSqft: 22, highAedPerSqft: 35 },
  { match: /marina|jbr/i, label: "Marina high-rise", lowAedPerSqft: 17, highAedPerSqft: 26 },
  { match: /business bay/i, label: "Business Bay", lowAedPerSqft: 18, highAedPerSqft: 30 },
  { match: /jvc|circle/i, label: "JVC / mid-market", lowAedPerSqft: 12, highAedPerSqft: 18 },
  { match: /hills|ranches|meadows|springs/i, label: "Villa community", lowAedPerSqft: 8, highAedPerSqft: 16 },
];

export function estimateDubaiServiceCharge(zone: string, propertyType: string, areaM2: number) {
  const matched =
    dubaiServiceChargeBands.find((band) => band.match.test(`${zone} ${propertyType}`)) || {
      label: "Dubai benchmark",
      lowAedPerSqft: /villa|town/i.test(propertyType) ? 7 : 14,
      highAedPerSqft: /villa|town/i.test(propertyType) ? 15 : 24,
    };
  const sqft = Math.max(0, areaM2 * 10.7639);
  return {
    ...matched,
    areaSqft: Math.round(sqft),
    annualLowAed: Math.round(sqft * matched.lowAedPerSqft),
    annualHighAed: Math.round(sqft * matched.highAedPerSqft),
  };
}

export const DUBAI_DUE_DILIGENCE = [
  "Check DLD/Mollak service-charge index for the exact building.",
  "Check Ejari/rent contract evidence before accepting advertised rent.",
  "Confirm NOC and building fit-out rules before renovation assumptions.",
  "Separate DLD transfer, broker fee, mortgage registration and trustee/admin fees.",
];

const rentControlledCities = new Set([
  "paris",
  "lille",
  "hellemmes",
  "lomme",
  "lyon",
  "villeurbanne",
  "montpellier",
  "bordeaux",
  "grenoble",
]);

const zoneTendueCities = new Set([
  "paris",
  "lyon",
  "marseille",
  "bordeaux",
  "lille",
  "montpellier",
  "nice",
  "nantes",
  "toulouse",
  "rennes",
  "strasbourg",
  "grenoble",
  "cannes",
  "boulogne-billancourt",
  "neuilly-sur-seine",
]);

const vacancyByCity: Record<string, number> = {
  paris: 2.5,
  "boulogne-billancourt": 2.7,
  "neuilly-sur-seine": 2.4,
  lyon: 3.8,
  bordeaux: 4.5,
  lille: 4.8,
  nice: 3.4,
  cannes: 4.2,
  montpellier: 5.6,
  nantes: 4.6,
  marseille: 6.8,
  grenoble: 5.2,
};

function normalizeCity(city: string) {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export function getFranceRegulationProfile(city: string, dpeClass: DpeClass = "D") {
  const key = normalizeCity(city);
  const rentCapActive = rentControlledCities.has(key);
  const zoneTendue = zoneTendueCities.has(key) || rentCapActive;
  const vacancyPct = vacancyByCity[key] ?? (zoneTendue ? 4.4 : 6.5);
  const dpe = dpeClass.toUpperCase() as DpeClass;
  const dpeRisk =
    dpe === "G"
      ? {
          level: "critical",
          label: "DPE G rent ban",
          body: "G-rated dwellings are no longer valid for new rental contracts in France.",
        }
      : dpe === "F"
        ? {
            level: "high",
            label: "DPE F 2028 risk",
            body: "F-rated dwellings become non-rentable from 2028 unless upgraded.",
          }
        : dpe === "E"
          ? {
              level: "medium",
              label: "DPE E 2034 risk",
              body: "E-rated dwellings become a long-term renovation risk from 2034.",
            }
          : {
              level: "clear",
              label: "DPE rental clear",
              body: "No rent-ban trigger from the current DPE class.",
            };

  return {
    city,
    rentCapActive,
    rentCapLabel: rentCapActive ? "Reference rent needed" : "No local cap detected",
    zoneTendue,
    vacancyPct,
    dpeRisk,
    charges: [
      "Notary fees: 7-8% existing property benchmark",
      "Agency fees: modelled separately when buyer-paid",
      "Property tax, management, vacancy and maintenance reduce net yield",
    ],
    aids: [
      "MaPrimeRenov for eligible energy works",
      "Eco-PTZ for zero-interest renovation financing",
      "Reduced VAT: 5.5% energy works, 10% improvement works",
    ],
  };
}
