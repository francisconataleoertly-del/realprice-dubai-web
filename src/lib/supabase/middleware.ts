import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { DEFAULT_SESSION, resolveSessionFromUser } from "@/lib/access-control";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function updateSupabaseSession(request: NextRequest) {
  const env = getSupabasePublicEnv();
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!env.configured) {
    return {
      response,
      session: DEFAULT_SESSION,
      configured: false,
    };
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    response,
    session: resolveSessionFromUser(user),
    configured: true,
  };
}
