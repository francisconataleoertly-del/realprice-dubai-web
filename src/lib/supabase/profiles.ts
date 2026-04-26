import type { SupabaseClient, User } from "@supabase/supabase-js";

export type FonatPropProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "user" | "admin";
  plan: "member" | "pro";
  billing_status: string | null;
  is_master: boolean;
};

export async function fetchOwnProfile(
  supabase: SupabaseClient,
  user: User | null | undefined
) {
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,role,plan,billing_status,is_master")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    if (error.code !== "PGRST116" && error.code !== "42P01") {
      console.warn("FonatProp profile lookup failed", error.message);
    }
    return null;
  }

  return data as FonatPropProfile | null;
}
