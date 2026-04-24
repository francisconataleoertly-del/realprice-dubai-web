import { DEFAULT_SESSION, resolveSessionFromUser } from "@/lib/access-control";
import { fetchOwnProfile } from "@/lib/supabase/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getServerAccessSession() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      configured: false,
      session: DEFAULT_SESSION,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await fetchOwnProfile(supabase, user);

  return {
    configured: true,
    session: resolveSessionFromUser(user, profile),
  };
}
