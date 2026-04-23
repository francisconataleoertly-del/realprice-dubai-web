"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ACCESS_COOKIE_KEYS,
  ACCESS_STORAGE_KEYS,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_SESSION,
  derivePreviewAccess,
  canAccessFeature,
  getFeatureRequiredPlan,
  type FonatPropFeature,
  type FonatPropFeatureFlags,
  type FonatPropPlan,
  type FonatPropRole,
  type FonatPropSession,
} from "@/lib/access-control";

type SignInInput = {
  email: string;
  name: string;
  password: string;
};

type AccessContextValue = {
  hydrated: boolean;
  session: FonatPropSession;
  flags: FonatPropFeatureFlags;
  signIn: (input: SignInInput) => Promise<FonatPropSession>;
  signOut: () => void;
  canAccess: (feature: FonatPropFeature) => boolean;
  requiredPlan: (feature: FonatPropFeature) => FonatPropPlan;
  setFlag: <K extends keyof FonatPropFeatureFlags>(
    key: K,
    value: FonatPropFeatureFlags[K]
  ) => void;
  resetFlags: () => void;
  updateSession: (patch: Partial<FonatPropSession>) => void;
};

const AccessContext = createContext<AccessContextValue | null>(null);

function writeCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function persistSession(session: FonatPropSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_STORAGE_KEYS.session, JSON.stringify(session));

  if (!session.authenticated) {
    Object.values(ACCESS_COOKIE_KEYS).forEach(clearCookie);
    return;
  }

  writeCookie(ACCESS_COOKIE_KEYS.authenticated, "1");
  writeCookie(ACCESS_COOKIE_KEYS.plan, session.plan);
  writeCookie(ACCESS_COOKIE_KEYS.role, session.role);
  writeCookie(ACCESS_COOKIE_KEYS.email, session.email);
  writeCookie(ACCESS_COOKIE_KEYS.name, session.name);
}

function persistFlags(flags: FonatPropFeatureFlags) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_STORAGE_KEYS.flags, JSON.stringify(flags));
}

function parseCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function loadSessionFromBrowser() {
  if (typeof window === "undefined") return DEFAULT_SESSION;

  const fromStorage = localStorage.getItem(ACCESS_STORAGE_KEYS.session);
  if (fromStorage) {
    try {
      const parsed = JSON.parse(fromStorage) as FonatPropSession;
      if (parsed.authenticated) return parsed;
    } catch {}
  }

  const authenticated = parseCookieValue(ACCESS_COOKIE_KEYS.authenticated) === "1";
  if (!authenticated) return DEFAULT_SESSION;

  return {
    authenticated: true,
    plan: (parseCookieValue(ACCESS_COOKIE_KEYS.plan) as FonatPropPlan) || "member",
    role: (parseCookieValue(ACCESS_COOKIE_KEYS.role) as FonatPropRole) || "user",
    email: parseCookieValue(ACCESS_COOKIE_KEYS.email),
    name: parseCookieValue(ACCESS_COOKIE_KEYS.name),
    loginAt: null,
  };
}

function loadFlagsFromBrowser() {
  if (typeof window === "undefined") return DEFAULT_FEATURE_FLAGS;
  const raw = localStorage.getItem(ACCESS_STORAGE_KEYS.flags);
  if (!raw) return DEFAULT_FEATURE_FLAGS;

  try {
    return {
      ...DEFAULT_FEATURE_FLAGS,
      ...(JSON.parse(raw) as Partial<FonatPropFeatureFlags>),
    };
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<FonatPropSession>(DEFAULT_SESSION);
  const [flags, setFlags] = useState<FonatPropFeatureFlags>(DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    setSession(loadSessionFromBrowser());
    setFlags(loadFlagsFromBrowser());
    setHydrated(true);
  }, []);

  const signIn = async ({ email, name, password }: SignInInput) => {
    if (!email.trim()) throw new Error("Email is required.");
    if (!name.trim()) throw new Error("Name is required.");
    if (password.trim().length < 6) {
      throw new Error("Use at least 6 characters for now.");
    }

    const previewAccess = derivePreviewAccess(email);
    const nextSession: FonatPropSession = {
      authenticated: true,
      plan: previewAccess.plan,
      role: previewAccess.role,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      loginAt: new Date().toISOString(),
    };

    setSession(nextSession);
    persistSession(nextSession);
    return nextSession;
  };

  const signOut = () => {
    setSession(DEFAULT_SESSION);
    persistSession(DEFAULT_SESSION);
  };

  const updateSession = (patch: Partial<FonatPropSession>) => {
    setSession((current) => {
      const next = { ...current, ...patch };
      persistSession(next);
      return next;
    });
  };

  const setFlag = <K extends keyof FonatPropFeatureFlags>(
    key: K,
    value: FonatPropFeatureFlags[K]
  ) => {
    setFlags((current) => {
      const next = { ...current, [key]: value };
      persistFlags(next);
      return next;
    });
  };

  const resetFlags = () => {
    setFlags(DEFAULT_FEATURE_FLAGS);
    persistFlags(DEFAULT_FEATURE_FLAGS);
  };

  const value = useMemo<AccessContextValue>(
    () => ({
      hydrated,
      session,
      flags,
      signIn,
      signOut,
      canAccess: (feature) => canAccessFeature(session, feature, flags),
      requiredPlan: (feature) => getFeatureRequiredPlan(feature, flags),
      setFlag,
      resetFlags,
      updateSession,
    }),
    [hydrated, session, flags]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccess must be used inside AccessProvider");
  }
  return context;
}
