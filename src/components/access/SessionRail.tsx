"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crown, LayoutDashboard, LockKeyhole, LogOut } from "lucide-react";

import { useAccess } from "@/components/access/AccessProvider";

export default function SessionRail({
  surface,
}: {
  surface: "public" | "private" | "admin";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, session, signOut } = useAccess();

  const handleSignOut = () => {
    signOut();
    router.push("/fonatprop");
  };

  return (
    <div className="fixed top-5 right-5 z-[70]">
      <div className="rounded-[22px] border border-white/10 bg-[#0a0a0f]/72 backdrop-blur-2xl px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/28">
              {surface === "admin"
                ? "Command Center"
                : surface === "private"
                  ? "Private App"
                  : "Public Landing"}
            </p>
            <p className="text-[14px] text-white/80">
              {!hydrated
                ? "Checking session..."
                : session.authenticated
                  ? `${session.name || session.email} · ${session.plan.toUpperCase()}`
                  : "Guest session"}
            </p>
          </div>

          {!hydrated ? null : !session.authenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/login?next=${encodeURIComponent(
                  pathname?.startsWith("/fonatprop") ? "/app" : pathname || "/app"
                )}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0a0a0f] px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-medium"
              >
                <LockKeyhole size={13} />
                Log in
              </Link>
              <Link
                href="/pricing"
                className="hidden sm:inline-flex items-center rounded-xl border border-white/12 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
              >
                Plans
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/app"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  pathname?.startsWith("/app")
                    ? "bg-white text-[#0a0a0f]"
                    : "border border-white/12 text-white/65 hover:text-white"
                }`}
              >
                Open app
              </Link>

              {session.plan !== "pro" ? (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#3b82f6]/25 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[#7fb3ff] hover:text-white transition-colors"
                >
                  <Crown size={13} />
                  Upgrade
                </Link>
              ) : null}

              {session.role === "admin" ? (
                <Link
                  href="/admin"
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                    pathname?.startsWith("/admin")
                      ? "bg-white text-[#0a0a0f]"
                      : "border border-white/12 text-white/65 hover:text-white"
                  }`}
                >
                  <LayoutDashboard size={13} />
                  Admin
                </Link>
              ) : null}

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/55 hover:text-white transition-colors"
              >
                <LogOut size={13} />
                Exit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
