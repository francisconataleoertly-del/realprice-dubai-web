"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env.configured) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey);
  }

  return browserClient;
}
