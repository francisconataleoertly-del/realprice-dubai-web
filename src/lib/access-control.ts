export type FonatPropPlan = "guest" | "member" | "pro";
export type FonatPropRole = "guest" | "user" | "admin";
export type FonatPropFeature =
  | "valuation"
  | "map"
  | "radar"
  | "investment"
  | "renovation"
  | "app"
  | "admin";

export interface FonatPropSession {
  authenticated: boolean;
  plan: FonatPropPlan;
  role: FonatPropRole;
  email: string;
  name: string;
  loginAt: string | null;
}

export interface FonatPropFeatureFlags {
  mapRequiresLogin: boolean;
  radarRequiresLogin: boolean;
  valuationRequiresPro: boolean;
  investmentRequiresPro: boolean;
  renovationRequiresPro: boolean;
}

export const DEFAULT_SESSION: FonatPropSession = {
  authenticated: false,
  plan: "guest",
  role: "guest",
  email: "",
  name: "",
  loginAt: null,
};

export const DEFAULT_FEATURE_FLAGS: FonatPropFeatureFlags = {
  mapRequiresLogin: true,
  radarRequiresLogin: true,
  valuationRequiresPro: true,
  investmentRequiresPro: true,
  renovationRequiresPro: true,
};

export const ACCESS_STORAGE_KEYS = {
  session: "fonatprop.session",
  flags: "fonatprop.flags",
} as const;

export const ACCESS_COOKIE_KEYS = {
  authenticated: "fonatprop_auth",
  plan: "fonatprop_plan",
  role: "fonatprop_role",
  email: "fonatprop_email",
  name: "fonatprop_name",
} as const;

export const FEATURE_LABELS: Record<FonatPropFeature, string> = {
  valuation: "Valuation",
  map: "Map",
  radar: "Radar",
  investment: "Investment",
  renovation: "Renovation",
  app: "Private App",
  admin: "Admin Command Center",
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function derivePreviewAccess(email: string) {
  const normalized = normalizeEmail(email);

  if (
    normalized.includes("+admin") ||
    normalized.startsWith("admin@") ||
    normalized.endsWith("@fonatprop.com") ||
    normalized.endsWith("@fonatprop.ae")
  ) {
    return {
      plan: "pro" as FonatPropPlan,
      role: "admin" as FonatPropRole,
    };
  }

  if (
    normalized.includes("+pro") ||
    normalized.startsWith("pro@") ||
    normalized.includes("agency")
  ) {
    return {
      plan: "pro" as FonatPropPlan,
      role: "user" as FonatPropRole,
    };
  }

  return {
    plan: "member" as FonatPropPlan,
    role: "user" as FonatPropRole,
  };
}

export function planWeight(plan: FonatPropPlan) {
  if (plan === "pro") return 2;
  if (plan === "member") return 1;
  return 0;
}

export function hasMinimumPlan(
  currentPlan: FonatPropPlan,
  requiredPlan: FonatPropPlan
) {
  return planWeight(currentPlan) >= planWeight(requiredPlan);
}

export function getFeatureRequiredPlan(
  feature: FonatPropFeature,
  flags: FonatPropFeatureFlags = DEFAULT_FEATURE_FLAGS
): FonatPropPlan {
  switch (feature) {
    case "app":
      return "member";
    case "admin":
      return "pro";
    case "map":
      return flags.mapRequiresLogin ? "member" : "guest";
    case "radar":
      return flags.radarRequiresLogin ? "member" : "guest";
    case "valuation":
      return flags.valuationRequiresPro ? "pro" : "member";
    case "investment":
      return flags.investmentRequiresPro ? "pro" : "member";
    case "renovation":
      return flags.renovationRequiresPro ? "pro" : "member";
    default:
      return "guest";
  }
}

export function canAccessFeature(
  session: FonatPropSession,
  feature: FonatPropFeature,
  flags: FonatPropFeatureFlags = DEFAULT_FEATURE_FLAGS
) {
  if (feature === "admin") {
    return session.authenticated && session.role === "admin";
  }

  const requiredPlan = getFeatureRequiredPlan(feature, flags);
  if (requiredPlan === "guest") return true;
  return session.authenticated && hasMinimumPlan(session.plan, requiredPlan);
}

export function getGateMessaging(
  session: FonatPropSession,
  feature: FonatPropFeature,
  flags: FonatPropFeatureFlags = DEFAULT_FEATURE_FLAGS
) {
  const requiredPlan = getFeatureRequiredPlan(feature, flags);
  const featureLabel = FEATURE_LABELS[feature];

  if (!session.authenticated && requiredPlan !== "guest") {
    return {
      tone: "login" as const,
      title: `Log in to use ${featureLabel}`,
      description:
        feature === "map" || feature === "radar"
          ? `${featureLabel} is reserved for signed-in members so we can protect the live data layer and keep the experience clean.`
          : `${featureLabel} is part of the private FonatProp workflow. Sign in first and then unlock the right plan for your agency.`,
      primaryLabel: "Log in",
      secondaryLabel: "See plans",
    };
  }

  if (
    session.authenticated &&
    requiredPlan === "pro" &&
    !hasMinimumPlan(session.plan, "pro")
  ) {
    return {
      tone: "upgrade" as const,
      title: `${featureLabel} is a Pro surface`,
      description:
        "Your member session can explore the app and use Map and Radar, but valuation, investment and renovation stay behind the Pro plan until billing goes live.",
      primaryLabel: "Upgrade plan",
      secondaryLabel: "Open app",
    };
  }

  if (feature === "admin" && session.role !== "admin") {
    return {
      tone: "admin" as const,
      title: "Admin access required",
      description:
        "The command center is reserved for FonatProp operators so settings, plans and feature flags stay under your control.",
      primaryLabel: "Log in again",
      secondaryLabel: "Back to app",
    };
  }

  return {
    tone: "open" as const,
    title: `${featureLabel} is available`,
    description: "This surface is ready to use.",
    primaryLabel: "Open",
    secondaryLabel: "",
  };
}

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function parseSessionFromCookieStore(
  cookies: CookieReader
): FonatPropSession {
  const authenticated = cookies.get(ACCESS_COOKIE_KEYS.authenticated)?.value === "1";
  const planValue = cookies.get(ACCESS_COOKIE_KEYS.plan)?.value as FonatPropPlan | undefined;
  const roleValue = cookies.get(ACCESS_COOKIE_KEYS.role)?.value as FonatPropRole | undefined;
  const email = decodeURIComponent(cookies.get(ACCESS_COOKIE_KEYS.email)?.value || "");
  const name = decodeURIComponent(cookies.get(ACCESS_COOKIE_KEYS.name)?.value || "");

  if (!authenticated) {
    return DEFAULT_SESSION;
  }

  return {
    authenticated: true,
    plan: planValue || "member",
    role: roleValue || "user",
    email,
    name,
    loginAt: null,
  };
}
