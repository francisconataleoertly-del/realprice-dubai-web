import type { MandatePackReport } from "@/data/mandate-pack-demo";

export type MandatePackBrandProfile = {
  agencyName: string;
  office: string;
  phone: string;
  email: string;
  website: string;
  agentName: string;
  agentTitle: string;
  whatsapp: string;
  accentHex: string;
  logoDataUrl: string | null;
};

const STORAGE_KEY = "fonatprop.mandatePackBrandProfile";

function clean(value: string | null | undefined) {
  return value?.trim() || "";
}

export function buildBrandProfileFromReport(report: MandatePackReport): MandatePackBrandProfile {
  return {
    agencyName: report.agency.name,
    office: report.agency.office,
    phone: report.agency.phone,
    email: report.agency.email,
    website: report.agency.website,
    agentName: report.agent.name,
    agentTitle: report.agent.title,
    whatsapp: report.agent.whatsapp,
    accentHex: report.branding.accent_hex || "#3b82f6",
    logoDataUrl: report.branding.logo_data_url || null,
  };
}

export function applyBrandProfileToReport(
  report: MandatePackReport,
  profile: MandatePackBrandProfile | null,
): MandatePackReport {
  if (!profile) return report;

  return {
    ...report,
    agency: {
      ...report.agency,
      name: clean(profile.agencyName) || report.agency.name,
      office: clean(profile.office) || report.agency.office,
      phone: clean(profile.phone) || report.agency.phone,
      email: clean(profile.email) || report.agency.email,
      website: clean(profile.website) || report.agency.website,
    },
    agent: {
      ...report.agent,
      name: clean(profile.agentName) || report.agent.name,
      title: clean(profile.agentTitle) || report.agent.title,
      whatsapp: clean(profile.whatsapp) || report.agent.whatsapp,
      email: clean(profile.email) || report.agent.email,
    },
    branding: {
      accent_hex: clean(profile.accentHex) || report.branding.accent_hex || "#3b82f6",
      logo_data_url: profile.logoDataUrl || report.branding.logo_data_url || null,
    },
  };
}

export function loadMandatePackBrandProfile(): MandatePackBrandProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MandatePackBrandProfile;
  } catch {
    return null;
  }
}

export function saveMandatePackBrandProfile(profile: MandatePackBrandProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore localStorage failures
  }
}

export function clearMandatePackBrandProfile() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore localStorage failures
  }
}
