import { buildDubaiReliability, type ValuationReliability } from "@/lib/valuation-reliability";
import { FONATPROP_CONTACT } from "@/lib/fonatprop-contact";

export type MandatePackComparable = {
  building: string;
  date: string;
  rooms: string;
  area_m2: number;
  area_sqft: number;
  price_aed: number;
  price_per_sqft_aed: number;
  similarity_label: string;
};

export type MandatePackSignal = {
  label: string;
  value: string;
  detail: string;
};

export type MandatePackBranding = {
  accent_hex: string;
  logo_data_url?: string | null;
};

export type MandatePackReport = {
  id: string;
  generated_at: string;
  market: "Dubai";
  title: string;
  subtitle: string;
  seller_summary: string;
  disclaimer: string;
  agency: {
    name: string;
    office: string;
    phone: string;
    email: string;
    website: string;
  };
  agent: {
    name: string;
    title: string;
    whatsapp: string;
    email: string;
  };
  owner: {
    name: string;
    intent: string;
    timeline: string;
  };
  property: {
    address: string;
    building: string;
    community: string;
    type: string;
    rooms: string;
    area_m2: number;
    area_sqft: number;
    status: string;
    parking: string;
    view: string;
  };
  valuation: {
    predicted_aed: number;
    predicted_usd: number;
    confidence_low_aed: number;
    confidence_high_aed: number;
    confidence_pct: number;
    price_per_sqft_aed: number;
    price_per_m2_aed: number;
    evidence_scope: string;
  };
  listing_strategy: {
    fast_sale_aed: number;
    target_aed: number;
    ambitious_aed: number;
    recommended_label: string;
    expected_days_live: string;
    negotiation_floor_aed: number;
  };
  market_signals: MandatePackSignal[];
  next_actions: string[];
  broker_notes: string[];
  comparables: MandatePackComparable[];
  reliability: ValuationReliability;
  branding: MandatePackBranding;
};

export const demoDubaiMandatePack: MandatePackReport = {
  id: "dubai-marina-jgt2-owner-pack",
  generated_at: "2026-05-01T15:20:00Z",
  market: "Dubai",
  title: "Mandate Pack",
  subtitle: "AI-backed pricing recommendation for the owner conversation.",
  seller_summary:
    "This property sits inside a highly liquid Dubai Marina waterfront segment. FonatProp's AI range places it in the premium building band, with enough evidence to recommend a target listing above the fast-sale threshold but below the stretch ceiling.",
  disclaimer:
    "Market estimate for brokerage use. Not a formal RERA or RICS valuation. Final listing advice should confirm floor, view, upgrades and title details.",
  agency: {
    name: "FonatProp x Dubai Broker Demo",
    office: "Dubai Marina Office",
    phone: FONATPROP_CONTACT.whatsappDisplay,
    email: FONATPROP_CONTACT.email,
    website: "fonatprop.com/broker-demo",
  },
  agent: {
    name: "Francisco Natal",
    title: "Founder / Broker Workflow Demo",
    whatsapp: FONATPROP_CONTACT.whatsappDisplay,
    email: FONATPROP_CONTACT.email,
  },
  owner: {
    name: "Private owner",
    intent: "Potential sale mandate",
    timeline: "30 to 60 days",
  },
  property: {
    address: "Jumeirah Gate Tower 2, Dubai Marina, Dubai",
    building: "Jumeirah Gate Tower 2",
    community: "Dubai Marina",
    type: "Apartment",
    rooms: "2 B/R",
    area_m2: 145,
    area_sqft: 1561,
    status: "Ready",
    parking: "1 space",
    view: "Sea-facing premium line",
  },
  valuation: {
    predicted_aed: 4080000,
    predicted_usd: 1111000,
    confidence_low_aed: 3600000,
    confidence_high_aed: 4560000,
    confidence_pct: 11.8,
    price_per_sqft_aed: 2614,
    price_per_m2_aed: 28138,
    evidence_scope: "Building-level comparable evidence",
  },
  listing_strategy: {
    fast_sale_aed: 3950000,
    target_aed: 4080000,
    ambitious_aed: 4220000,
    recommended_label: "Target price",
    expected_days_live: "28 to 45 days",
    negotiation_floor_aed: 3890000,
  },
  market_signals: [
    {
      label: "Liquidity",
      value: "High",
      detail: "Waterfront premium stock in Dubai Marina remains one of the easiest owner narratives to defend.",
    },
    {
      label: "Buyer profile",
      value: "End-user + investor",
      detail: "This line can appeal to both cash-flow buyers and lifestyle buyers, which supports mandate confidence.",
    },
    {
      label: "Listing posture",
      value: "Do not overreach",
      detail: "Above AED 4.22M the listing starts looking like a stretch unless finish quality is superior.",
    },
  ],
  next_actions: [
    "Confirm exact floor, view line and renovation level before publishing.",
    "List close to the target price and review lead quality after the first 10 days.",
    "Prepare 5 comparable sales for the owner call and keep the negotiation floor private.",
  ],
  broker_notes: [
    "Use the fast-sale price only if the owner wants speed and minimal negotiation.",
    "Keep the ambitious price for owners who accept a longer live period and stronger marketing package.",
    "If photography and media are weak, the asking price may look high even when the AI range is correct.",
  ],
  comparables: [
    {
      building: "Jumeirah Gate Tower 2",
      date: "2026-04-18",
      rooms: "2 B/R",
      area_m2: 143,
      area_sqft: 1539,
      price_aed: 4015000,
      price_per_sqft_aed: 2609,
      similarity_label: "Very close",
    },
    {
      building: "Jumeirah Gate Tower 2",
      date: "2026-03-29",
      rooms: "2 B/R",
      area_m2: 147,
      area_sqft: 1582,
      price_aed: 4120000,
      price_per_sqft_aed: 2604,
      similarity_label: "Very close",
    },
    {
      building: "Address Beach Resort",
      date: "2026-02-11",
      rooms: "2 B/R",
      area_m2: 149,
      area_sqft: 1604,
      price_aed: 4290000,
      price_per_sqft_aed: 2675,
      similarity_label: "Premium comp",
    },
    {
      building: "Jumeirah Gate Tower 1",
      date: "2026-01-26",
      rooms: "2 B/R",
      area_m2: 141,
      area_sqft: 1517,
      price_aed: 3945000,
      price_per_sqft_aed: 2601,
      similarity_label: "Very close",
    },
    {
      building: "Beach Isle",
      date: "2025-12-14",
      rooms: "2 B/R",
      area_m2: 146,
      area_sqft: 1571,
      price_aed: 3860000,
      price_per_sqft_aed: 2457,
      similarity_label: "Competitive edge",
    },
  ],
  reliability: buildDubaiReliability({
    confidence_pct: 11.8,
    confidence_low_aed: 3600000,
    confidence_high_aed: 4560000,
    inference_source: "building_profile",
    valuation_mode: "building_avm",
    resolved_zone: "Dubai Marina",
    resolved_building: "Jumeirah Gate Tower 2",
    source_support_count: 48,
    source_recent_count: 11,
    source_dominance_pct: 67,
    unit_distribution_source: "building units",
    unit_distribution_count: 28,
    unit_distribution_low_aed: 3890000,
    unit_distribution_high_aed: 4235000,
  }),
  branding: {
    accent_hex: "#3b82f6",
    logo_data_url: null,
  },
};
