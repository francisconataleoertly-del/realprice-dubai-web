"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { User } from "@supabase/supabase-js";

import {
  ACCESS_STORAGE_KEYS,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_SESSION,
  canAccessFeature,
  getFeatureRequiredPlan,
  resolveSessionFromUser,
  type FonatPropFeature,
  type FonatPropFeatureFlags,
  type FonatPropPlan,
  type FonatPropSession,
} from "@/lib/access-control";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type AuthInput = {
  email: string;
  name?: string;
  password: string;
};

type AuthResult = {
  session: FonatPropSession;
  pendingConfirmation?: boolean;
  message?: string;
};

type AccessContextValue = {
  hydrated: boolean;
  authConfigured: boolean;
  session: FonatPropSession;
  flags: FonatPropFeatureFlags;
  signIn: (input: AuthInput) => Promise<AuthResult>;
  signUp: (input: AuthInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  canAccess: (feature: FonatPropFeature) => boolean;
  requiredPlan: (feature: FonatPropFeature) => FonatPropPlan;
  setFlag: <K extends keyof FonatPropFeatureFlags>(
    key: K,
    value: FonatPropFeatureFlags[K]
  ) => void;
  resetFlags: () => void;
  refreshSession: () => Promise<FonatPropSession>;
};

const AccessContext = createContext<AccessContextValue | null>(null);

function persistFlags(flags: FonatPropFeatureFlags) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_STORAGE_KEYS.flags, JSON.stringify(flags));
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

function sessionFromUser(user: User | null | undefined) {
  return resolveSessionFromUser(user);
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<FonatPropSession>(DEFAULT_SESSION);
  const [flags, setFlags] = useState<FonatPropFeatureFlags>(DEFAULT_FEATURE_FLAGS);

  const authConfigured = getSupabasePublicEnv().configured;

  useEffect(() => {
    setFlags(loadFlagsFromBrowser());
  }, []);

  useEffect(() => {
    if (!authConfigured) {
      setSession(DEFAULT_SESSION);
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSession(DEFAULT_SESSION);
      setHydrated(true);
      return;
    }

    let active = true;

    const syncFromSupabase = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setSession(sessionFromUser(user));
      setHydrated(true);
    };

    void syncFromSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!active) return;
      setSession(sessionFromUser(authSession?.user));
      setHydrated(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authConfigured]);

  const signIn = async ({ email, password }: AuthInput): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error(
        "Supabase auth is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first."
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;

    const nextSession = sessionFromUser(data.user);
    setSession(nextSession);

    return {
      session: nextSession,
      pendingConfirmation: false,
    };
  };

  const signUp = async ({ email, password, name }: AuthInput): Promise<AuthResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error(
        "Supabase auth is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first."
      );
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          name: name?.trim() || "",
        },
      },
    });

    if (error) throw error;

    const nextSession = sessionFromUser(data.user);
    const pendingConfirmation = !data.session;

    if (!pendingConfirmation) {
      setSession(nextSession);
    }

    return {
      session: pendingConfirmation ? DEFAULT_SESSION : nextSession,
      pendingConfirmation,
      message: pendingConfirmation
        ? "Check your email to confirm the account, then come back and log in."
        : undefined,
    };
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(DEFAULT_SESSION);
  };

  const refreshSession = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSession(DEFAULT_SESSION);
      return DEFAULT_SESSION;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nextSession = sessionFromUser(user);
    setSession(nextSession);
    return nextSession;
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
      authConfigured,
      session,
      flags,
      signIn,
      signUp,
      signOut,
      canAccess: (feature) => canAccessFeature(session, feature, flags),
      requiredPlan: (feature) => getFeatureRequiredPlan(feature, flags),
      setFlag,
      resetFlags,
      refreshSession,
    }),
    [hydrated, authConfigured, session, flags]
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
