function normalizeSupabaseUrl(value: string) {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  const restIndex = trimmed.indexOf("/rest/v1");
  const baseUrl = restIndex >= 0 ? trimmed.slice(0, restIndex) : trimmed;
  return baseUrl.replace(/\/+$/, "");
}

function normalizePublicKey(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

export function getSupabasePublicEnv() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const anonKey = normalizePublicKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      ""
  );

  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey && url.startsWith("https://")),
  };
}
