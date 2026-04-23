import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseSessionFromCookieStore } from "./src/lib/access-control";

export function middleware(request: NextRequest) {
  const session = parseSessionFromCookieStore(request.cookies);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/app") && !session.authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session.authenticated) {
    const appUrl = new URL("/app", request.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/login"],
};
