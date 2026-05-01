// France rental yield + acquisition cost data
//
// Yield data source: Lokimo "Étude rendement locatif 2025" via Meilleurtaux (Feb 2026 publication),
// SeLoger and Bien'ici listings cross-referenced with DVF transaction prices.
// Coverage: 11 largest French metros + national average.
// Computation: gross_yield_pct = (median_rent_per_m2 * 12) / median_sale_price_per_m2 * 100
//
// Acquisition costs source: Notaires de France official tariff (Décret n°78-262, updated 2024)
// Mortgage rate source: Banque de France monthly housing credit observatory (Q1 2026)
//
// LAST UPDATED: 2026-04 (refresh quarterly; rebuild from Lokimo dataset when Q3 2026 lands)

export type CityYield = {
  city: string;
  department_code: string;
  lat: number;
  lon: number;
  sale_price_per_m2_eur: number;
  rent_per_m2_eur_month: number;
  gross_yield_pct: number;
  rank: number;
  tier: "high" | "mid" | "low";
};

export const FRANCE_NATIONAL_GROSS_YIELD_PCT = 4.78;

export const FRANCE_CITY_YIELDS: CityYield[] = [
  {
    city: "Grenoble",
    department_code: "38",
    lat: 45.1885,
    lon: 5.7245,
    sale_price_per_m2_eur: 2595,
    rent_per_m2_eur_month: 12.36,
    gross_yield_pct: 5.72,
    rank: 1,
    tier: "high",
  },
  {
    city: "Marseille",
    department_code: "13",
    lat: 43.2965,
    lon: 5.3698,
    sale_price_per_m2_eur: 3234,
    rent_per_m2_eur_month: 14.46,
    gross_yield_pct: 5.38,
    rank: 2,
    tier: "high",
  },
  {
    city: "Montpellier",
    department_code: "34",
    lat: 43.6119,
    lon: 3.8772,
    sale_price_per_m2_eur: 3496,
    rent_per_m2_eur_month: 15.0,
    gross_yield_pct: 5.23,
    rank: 3,
    tier: "high",
  },
  {
    city: "Nice",
    department_code: "06",
    lat: 43.7102,
    lon: 7.262,
    sale_price_per_m2_eur: 4651,
    rent_per_m2_eur_month: 19.03,
    gross_yield_pct: 4.91,
    rank: 4,
    tier: "mid",
  },
  {
    city: "Nantes",
    department_code: "44",
    lat: 47.2184,
    lon: -1.5536,
    sale_price_per_m2_eur: 3593,
    rent_per_m2_eur_month: 14.0,
    gross_yield_pct: 4.9,
    rank: 5,
    tier: "mid",
  },
  {
    city: "Toulouse",
    department_code: "31",
    lat: 43.6047,
    lon: 1.4442,
    sale_price_per_m2_eur: 3378,
    rent_per_m2_eur_month: 13.2,
    gross_yield_pct: 4.69,
    rank: 6,
    tier: "mid",
  },
  {
    city: "Lille",
    department_code: "59",
    lat: 50.6292,
    lon: 3.0573,
    sale_price_per_m2_eur: 3593,
    rent_per_m2_eur_month: 13.62,
    gross_yield_pct: 4.55,
    rank: 7,
    tier: "mid",
  },
  {
    city: "Rennes",
    department_code: "35",
    lat: 48.1173,
    lon: -1.6778,
    sale_price_per_m2_eur: 3842,
    rent_per_m2_eur_month: 13.68,
    gross_yield_pct: 4.3,
    rank: 8,
    tier: "mid",
  },
  {
    city: "Strasbourg",
    department_code: "67",
    lat: 48.5734,
    lon: 7.7521,
    sale_price_per_m2_eur: 3865,
    rent_per_m2_eur_month: 13.2,
    gross_yield_pct: 4.1,
    rank: 9,
    tier: "low",
  },
  {
    city: "Bordeaux",
    department_code: "33",
    lat: 44.8378,
    lon: -0.5792,
    sale_price_per_m2_eur: 4642,
    rent_per_m2_eur_month: 15.59,
    gross_yield_pct: 4.03,
    rank: 10,
    tier: "low",
  },
  {
    city: "Paris",
    department_code: "75",
    lat: 48.8566,
    lon: 2.3522,
    sale_price_per_m2_eur: 10221,
    rent_per_m2_eur_month: 33.3,
    gross_yield_pct: 3.91,
    rank: 11,
    tier: "low",
  },
  {
    city: "Lyon",
    department_code: "69",
    lat: 45.764,
    lon: 4.8357,
    sale_price_per_m2_eur: 4807,
    rent_per_m2_eur_month: 15.22,
    gross_yield_pct: 3.8,
    rank: 12,
    tier: "low",
  },
];

// Acquisition costs for "ancien" (existing) residential property in metropolitan France.
// Source: Notaires de France official tariff + ANIL (Agence Nationale Information Logement)
// https://www.notaires.fr/fr/immobilier/frais-de-notaire
export const FRANCE_ACQUISITION_COSTS = {
  // Frais de notaire: emoluments (regulated) + droits de mutation (DMTO 5.81% in most depts) + débours
  notary_fees_pct_existing: 7.5, // typical for ancien — average across metropolitan departments
  notary_fees_pct_new: 2.5, // for "neuf" / VEFA, lower because TVA already paid by promoter
  // Frais d'agence — varies; in France often paid by seller, but when buyer pays:
  agency_fees_pct: 5.0, // typical buyer-side commission when not already in seller mandate
  // Annual recurring (operational)
  property_tax_pct_of_sale: 0.7, // taxe foncière as % of sale price (rough; varies by commune)
  property_management_pct: 7.0, // gérance fees when using a manager
  insurance_pct_of_rent: 2.5, // PNO (propriétaire non occupant) + GLI
  vacancy_pct: 4.0, // typical vacancy assumption (varies by city)
  maintenance_pct_of_rent: 5.0, // running maintenance reserve
};

// Mortgage parameters (France, Q1 2026)
// Source: Banque de France housing credit observatory + Crédit Logement / CSA monthly bulletin
export const FRANCE_MORTGAGE = {
  // Average advertised rate for 20-year fixed (Q1 2026 print)
  rate_20y_pct: 3.45,
  rate_25y_pct: 3.65,
  // HCSF macroprudential caps (binding since 2022 reinforcement)
  max_dti_pct: 35, // taux d'endettement maximum
  max_term_years: 25,
  // Typical apport personnel (down payment) range
  typical_down_payment_pct: 15,
};
