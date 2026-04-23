import { DEFAULT_SESSION, resolveSessionFromUser } from "@/lib/access-control";
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

  return {
    configured: true,
    session: resolveSessionFromUser(user),
  };
}
