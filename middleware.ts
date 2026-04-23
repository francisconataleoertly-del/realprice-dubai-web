import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSupabaseSession } from "./src/lib/supabase/middleware";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export async function middleware(request: NextRequest) {
  const { response, session } = await updateSupabaseSession(request);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/app") && !session.authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (pathname === "/login" && session.authenticated) {
    return copyCookies(response, NextResponse.redirect(new URL("/app", request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/login"],
};
