// France DPE (Diagnostic de Performance Énergétique) price impact data
//
// Source: Notaires de France "Valeur verte 2024" study (notaires.fr/fr/actualites)
// + Office Notarial 1803 / Immonot 2025 transaction data analysis.
//
// Methodology: each class is compared against class D (the median/baseline) on
// otherwise-comparable transactions. Average decote per missing class is roughly
// −8% per house grade and −4% per apartment grade — but the spread is widening
// as the 2025/2028/2034 rental bans phase in.
//
// Regulatory backdrop (Loi Climat et Résilience):
//   - Class G: forbidden to rent since 1 Jan 2025 ("logement indécent")
//   - Class F: forbidden to rent from 1 Jan 2028
//   - Class E: forbidden to rent from 1 Jan 2034

export type DpeClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type DpeImpact = {
  class: DpeClass;
  // Percentage adjustment vs class D (the market median baseline).
  apartment_pct: number;
  house_pct: number;
  // Color used in DPE labels by ADEME
  color: string;
  // Rental ban year if any
  rental_ban_year?: number;
  description: string;
};

export const FRANCE_DPE_IMPACT: DpeImpact[] = [
  {
    class: "A",
    apartment_pct: 12,
    house_pct: 17,
    color: "#00a651",
    description: "Logement très performant — surcote forte, demande locative premium.",
  },
  {
    class: "B",
    apartment_pct: 7,
    house_pct: 11,
    color: "#50b848",
    description: "Logement performant — surcote, peu de risque réglementaire.",
  },
  {
    class: "C",
    apartment_pct: 3,
    house_pct: 5,
    color: "#aed136",
    description: "Logement standard supérieur — légère surcote, sans risque réglementaire.",
  },
  {
    class: "D",
    apartment_pct: 0,
    house_pct: 0,
    color: "#fff200",
    description: "Médiane du marché — référence DVF / Notaires.",
  },
  {
    class: "E",
    apartment_pct: -4,
    house_pct: -9,
    color: "#fdb913",
    rental_ban_year: 2034,
    description: "Décote modérée. Interdit à la location à partir du 1er janvier 2034.",
  },
  {
    class: "F",
    apartment_pct: -8,
    house_pct: -17,
    color: "#ee5226",
    rental_ban_year: 2028,
    description: "Passoire thermique. Interdit à la location à partir du 1er janvier 2028.",
  },
  {
    class: "G",
    apartment_pct: -12,
    house_pct: -25,
    color: "#ed1c24",
    rental_ban_year: 2025,
    description:
      "Logement indécent — interdit à la location depuis le 1er janvier 2025. Décote majeure à l'achat.",
  },
];

export function dpeAdjustmentPct(dpeClass: DpeClass, propertyType: string): number {
  const impact = FRANCE_DPE_IMPACT.find((i) => i.class === dpeClass);
  if (!impact) return 0;
  return propertyType === "Maison" ? impact.house_pct : impact.apartment_pct;
}
