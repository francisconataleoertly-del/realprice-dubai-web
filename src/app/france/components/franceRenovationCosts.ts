// France renovation cost data
//
// Sources (2025-2026 published figures):
// - Manda "Prix d'une rénovation au m² en 2025" (manda.fr)
// - HelloWatt "Prix rénovation maison m² 2026" (hellowatt.fr)
// - ArchitectEO and MieuxRenover market guides
// - ANAH "MaPrimeRénov' Mode d'emploi" January 2025 (anah.gouv.fr)
// - economie.gouv.fr "MaPrimeRénov' parcours par geste"
//
// Cost ranges represent typical "all-in" prices (TTC, materials + labour) for residential
// renovation in metropolitan France, 2025 print. Variance comes from city, finishings,
// access and contractor profile (artisan vs entreprise générale).
//
// MaPrimeRénov' subsidies are capped at the published gov amounts; eligibility depends on
// household income (4 colour bands: bleu / jaune / violet / rose). The max amounts shown
// are for "ménages très modestes" (bleu, the highest support tier).

export type RenovationCategory = {
  scope: string;
  range_eur_per_m2: string;
  range_min: number;
  range_max: number;
  impact: string;
  note: string;
  subsidy_pct_pricing: number; // ratio of cost typically covered when MaPrimeRénov applies
  subsidy_max_eur?: number; // hard cap from ANAH grid
  source: string;
};

export const FRANCE_RENOVATION_CATEGORIES: RenovationCategory[] = [
  {
    scope: "Cuisine",
    range_eur_per_m2: "350 - 1,000 EUR / m²",
    range_min: 350,
    range_max: 1000,
    impact: "Highest staging signal for urban apartments",
    note: "cabinetry, worktop, appliances, plumbing touch-points",
    subsidy_pct_pricing: 0,
    source: "Manda 2025 / HelloWatt 2026",
  },
  {
    scope: "Salle de bain",
    range_eur_per_m2: "300 - 2,500 EUR / m²",
    range_min: 300,
    range_max: 2500,
    impact: "Buyer-confidence multiplier for tertiary cities",
    note: "tiling, sanitaryware, shower system, waterproofing",
    subsidy_pct_pricing: 0,
    source: "Manda 2025 / Mondevis 2025",
  },
  {
    scope: "Sols (parquet, carrelage)",
    range_eur_per_m2: "60 - 220 EUR / m²",
    range_min: 60,
    range_max: 220,
    impact: "Fastest repositioning lever before listing",
    note: "engineered wood, laminate, porcelain or natural stone",
    subsidy_pct_pricing: 0,
    source: "ArchitectEO / MieuxRenover 2025",
  },
  {
    scope: "Peinture et murs",
    range_eur_per_m2: "25 - 60 EUR / m²",
    range_min: 25,
    range_max: 60,
    impact: "Minimum-cost presentation lift",
    note: "surface preparation, premium paint, minor patching",
    subsidy_pct_pricing: 0,
    source: "Manda / HelloArtisan 2025",
  },
  {
    scope: "Menuiseries (fenêtres double vitrage)",
    range_eur_per_m2: "650 - 1,400 EUR / unité",
    range_min: 650,
    range_max: 1400,
    impact: "Comfort + DPE upgrade, eligible for MaPrimeRénov",
    note: "double or triple glazing, seals, acoustic and thermal performance",
    subsidy_pct_pricing: 0.3,
    subsidy_max_eur: 1000,
    source: "ANAH MPR 2025 grid (fenêtres)",
  },
  {
    scope: "Isolation murs / combles",
    range_eur_per_m2: "60 - 180 EUR / m²",
    range_min: 60,
    range_max: 180,
    impact: "Direct DPE jump (B/C/D unlock), highest ROI energy work",
    note: "ITE / ITI, soufflage de combles, isolants biosourcés",
    subsidy_pct_pricing: 0.4,
    subsidy_max_eur: 7000,
    source: "ANAH MPR 2025 grid (isolation)",
  },
  {
    scope: "Pompe à chaleur air/eau",
    range_eur_per_m2: "12,000 - 18,000 EUR / unité",
    range_min: 12000,
    range_max: 18000,
    impact: "Removes oil/gas, A-class DPE eligible",
    note: "complete heating system swap, includes installation + commissioning",
    subsidy_pct_pricing: 0.45,
    subsidy_max_eur: 5000,
    source: "ANAH MPR 2025 (PAC air/eau, foyer modeste)",
  },
  {
    scope: "Pompe à chaleur géothermique",
    range_eur_per_m2: "20,000 - 30,000 EUR / unité",
    range_min: 20000,
    range_max: 30000,
    impact: "Premium energy upgrade, top MaPrimeRénov tier",
    note: "ground-source heat pump, requires drilling and certified installer",
    subsidy_pct_pricing: 0.5,
    subsidy_max_eur: 11000,
    source: "ANAH MPR 2025 (PAC géothermique, foyer très modeste)",
  },
];

// MaPrimeRénov' headline figures (ANAH, economie.gouv.fr — 2025 print)
export const MAPRIMERENOV_2025 = {
  max_single_action_eur: 11_000, // pompe à chaleur géothermique, ménages très modestes
  max_bouquet_eur: 32_000, // rénovation d'ampleur, gain énergétique 4+ classes
  pac_air_eau_modeste_eur: 4_000, // dans la limite de 12 000 € de dépense
  cave_fioul_depose_eur: 1_200,
  income_bands: 4, // bleu / jaune / violet / rose
};

// French VAT rates on renovation work (Article 279-0 bis CGI, BOI-TVA-LIQ-30-20-90)
// Source: bofip.impots.gouv.fr + service-public.gouv.fr
// - 5.5%: travaux d'amélioration énergétique (isolation, PAC, fenêtres, ventilation double flux)
// - 10%: travaux d'amélioration, transformation, aménagement, entretien sur logements >2 ans
// - 20%: construction neuve, agrandissement, gros œuvre structurel
export type TvaCategory = "energy" | "renovation" | "new_construction";
export const FRANCE_TVA_RATES: Record<TvaCategory, number> = {
  energy: 5.5,
  renovation: 10,
  new_construction: 20,
};

// Map each renovation scope to the TVA category that applies on labour + materials
// for an existing dwelling >2 years old.
export const FRANCE_TVA_BY_SCOPE: Record<string, TvaCategory> = {
  Cuisine: "renovation",
  "Salle de bain": "renovation",
  "Sols (parquet, carrelage)": "renovation",
  "Peinture et murs": "renovation",
  "Menuiseries (fenêtres double vitrage)": "energy",
  "Isolation murs / combles": "energy",
  "Pompe à chaleur air/eau": "energy",
  "Pompe à chaleur géothermique": "energy",
};

// Éco-PTZ — Prêt à Taux Zéro for energy renovation
// Source: service-public.gouv.fr/particuliers/vosdroits/F19905 (2025 update)
// Zero-interest loan up to €50,000 over 20 years for energy improvement work.
// Eligible scopes: same list as MaPrimeRénov "geste" + "rénovation d'ampleur".
export const ECO_PTZ_2025 = {
  max_loan_eur: 50_000,
  // For "rénovation d'ampleur" with 35%+ energy gain (new since 2024)
  max_loan_renovation_ampleur_eur: 50_000,
  max_term_years: 20,
  reference_rate_pct: 3.45, // Banque de France Q1 2026 — interest you'd pay on a regular loan
};

export function computeEcoPtzInterestSavings(loanAmount: number, years: number) {
  // Compare against a 3.45% reference loan (Banque de France average), simple sum of interest
  const principal = Math.min(loanAmount, ECO_PTZ_2025.max_loan_eur);
  const referenceRate = ECO_PTZ_2025.reference_rate_pct / 100 / 12;
  const months = years * 12;
  if (referenceRate === 0) return 0;
  const monthly =
    (principal * referenceRate * Math.pow(1 + referenceRate, months)) /
    (Math.pow(1 + referenceRate, months) - 1);
  const totalReference = monthly * months;
  return Math.round(totalReference - principal);
}

export const FRANCE_RENOVATION_CARDS = [
  {
    title: "DVF + DPE crossover",
    text: "5.9M cleaned DVF transactions cross-referenced with ADEME's DPE database (5.1M energy diagnostics) so renovation impact is anchored to the same property universe.",
    source: "DGFiP DVF + ADEME observatoire DPE",
  },
  {
    title: "MaPrimeRénov coverage",
    text: "Up to EUR 11,000 per action, EUR 32,000 for a bouquet of works. 4 income bands (bleu / jaune / violet / rose) determine the actual amount per household.",
    source: "ANAH 2025 mode d'emploi (anah.gouv.fr)",
  },
  {
    title: "BAN-anchored geocoding",
    text: "Each transaction gets a Base Adresse Nationale ID, so renovation rules (zone tendue, encadrement loyers, QPV) attach by parcel, not by guess.",
    source: "BAN api.gouv.fr",
  },
  {
    title: "Local ranges, not US averages",
    text: "Cost ranges are pulled from French market guides (Manda, HelloWatt, ArchitectEO, MieuxRenover) and ANAH cost references — not international averages.",
    source: "FR market aggregators 2025",
  },
];
