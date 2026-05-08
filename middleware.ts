import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  BROKER_DEMO_ACCESS_PATH,
  BROKER_DEMO_COOKIE,
  hasBrokerDemoAccess,
} from "./src/lib/broker-demo-access";
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

  const isBrokerDemoSurface =
    pathname.startsWith("/broker-demo") || pathname.startsWith("/api/mandate-pack");
  const isBrokerDemoAccessPage = pathname === BROKER_DEMO_ACCESS_PATH;

  if (isBrokerDemoSurface && !isBrokerDemoAccessPage) {
    const brokerDemoCookie = request.cookies.get(BROKER_DEMO_COOKIE)?.value;
    if (!hasBrokerDemoAccess(brokerDemoCookie)) {
      const accessUrl = new URL(BROKER_DEMO_ACCESS_PATH, request.url);
      accessUrl.searchParams.set("next", `${pathname}${search}`);
      return copyCookies(response, NextResponse.redirect(accessUrl));
    }
  }

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
  matcher: [
    "/app/:path*",
    "/admin/:path*",
    "/login",
    "/broker-demo",
    "/broker-demo/:path*",
    "/api/mandate-pack",
    "/api/mandate-pack/:path*",
  ],
};
