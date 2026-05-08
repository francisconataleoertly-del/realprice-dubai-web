import { NextResponse } from "next/server";

import {
  BROKER_DEMO_COOKIE,
  getBrokerDemoCookieValue,
  getBrokerDemoPassword,
} from "@/lib/broker-demo-access";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        password?: string;
      }
    | null;

  const password = body?.password?.trim() || "";

  if (password !== getBrokerDemoPassword()) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password. Please request the private broker access code." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(BROKER_DEMO_COOKIE, getBrokerDemoCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
