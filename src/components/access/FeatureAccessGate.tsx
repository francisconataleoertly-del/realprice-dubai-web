"use client";

import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { useAccess } from "@/components/access/AccessProvider";
import {
  FEATURE_LABELS,
  getGateMessaging,
  type FonatPropFeature,
} from "@/lib/access-control";

export default function FeatureAccessGate({
  feature,
  children,
}: {
  feature: FonatPropFeature;
  children: React.ReactNode;
}) {
  const { session, flags, canAccess } = useAccess();
  const allowed = canAccess(feature);

  if (allowed) {
    return <>{children}</>;
  }

  const messaging = getGateMessaging(session, feature, flags);
  const nextPath = feature === "admin" ? "/admin" : "/app";

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[1px] saturate-75">
        {children}
      </div>
      <div className="absolute inset-0 z-30 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0b0c12]/84 backdrop-blur-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
              {messaging.tone === "upgrade" ? (
                <ShieldCheck size={18} className="text-[#3b82f6]" />
              ) : (
                <LockKeyhole size={18} className="text-white/70" />
              )}
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/30">
                {FEATURE_LABELS[feature]}
              </p>
              <p className="text-white text-[24px] font-light tracking-[-0.02em] leading-none">
                {messaging.title}
              </p>
            </div>
          </div>

          <p className="text-[14px] leading-7 text-white/55 max-w-lg">
            {messaging.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {!session.authenticated ? (
              <>
                <Link
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                  className="inline-flex items-center justify-center rounded-xl bg-white text-[#0a0a0f] px-5 py-3 text-[11px] uppercase tracking-[0.28em] font-medium"
                >
                  {messaging.primaryLabel}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-white/65 hover:text-white transition-colors"
                >
                  {messaging.secondaryLabel}
                </Link>
              </>
            ) : messaging.tone === "upgrade" ? (
              <>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl bg-white text-[#0a0a0f] px-5 py-3 text-[11px] uppercase tracking-[0.28em] font-medium"
                >
                  {messaging.primaryLabel}
                </Link>
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-white/65 hover:text-white transition-colors"
                >
                  {messaging.secondaryLabel}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                  className="inline-flex items-center justify-center rounded-xl bg-white text-[#0a0a0f] px-5 py-3 text-[11px] uppercase tracking-[0.28em] font-medium"
                >
                  {messaging.primaryLabel}
                </Link>
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-white/65 hover:text-white transition-colors"
                >
                  {messaging.secondaryLabel}
                </Link>
              </>
            )}
          </div>

          <p className="mt-5 font-mono text-[10px] tracking-[0.24em] uppercase text-white/22">
            Public landing stays visible. Access unlocks by session and plan.
          </p>
        </div>
      </div>
    </div>
  );
}
