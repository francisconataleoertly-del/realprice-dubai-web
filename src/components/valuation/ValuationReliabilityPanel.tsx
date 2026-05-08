"use client";

import { AlertTriangle, CheckCircle2, Database, ShieldCheck } from "lucide-react";

import type { ValuationReliability } from "@/lib/valuation-reliability";

type Props = {
  reliability?: ValuationReliability | null;
  compact?: boolean;
};

const levelStyles = {
  high: {
    badge: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
    bar: "from-emerald-400 via-cyan-300 to-white",
    dot: "bg-emerald-300",
  },
  medium: {
    badge: "border-amber-300/30 bg-amber-400/10 text-amber-100",
    bar: "from-amber-400 via-sky-300 to-white",
    dot: "bg-amber-300",
  },
  low: {
    badge: "border-red-300/30 bg-red-400/10 text-red-100",
    bar: "from-red-400 via-amber-300 to-white",
    dot: "bg-red-300",
  },
};

export default function ValuationReliabilityPanel({ reliability, compact = false }: Props) {
  if (!reliability) return null;

  const styles = levelStyles[reliability.level];

  return (
    <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
            Reliability
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.dot} shadow-[0_0_18px_currentColor]`} />
            <p className="font-['Fraunces'] text-2xl font-light text-white">
              {reliability.label}
            </p>
          </div>
        </div>
        <div className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] ${styles.badge}`}>
          {reliability.score}/100
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
          style={{ width: `${reliability.score}%` }}
        />
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        {reliability.evidence.slice(0, compact ? 3 : 4).map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-blue-200/70" />
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/32">
                {item.label}
              </p>
            </div>
            <p className="mt-2 text-sm font-medium text-white/82">{item.value}</p>
            {item.detail && <p className="mt-1 text-xs leading-5 text-white/42">{item.detail}</p>}
          </div>
        ))}
      </div>

      {reliability.warnings.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-300/12 bg-amber-300/[0.055] p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-200/80" />
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-100/70">
              Broker checks
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {reliability.warnings.slice(0, 3).map((warning) => (
              <p key={warning} className="text-sm leading-6 text-white/58">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <div className="mt-5 grid gap-2">
          {reliability.methodology.slice(0, 3).map((item) => (
            <div key={item} className="flex gap-2 text-xs leading-5 text-white/42">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-200/60" />
              <span>{item}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-3 font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
            <ShieldCheck className="h-3.5 w-3.5" />
            Real data first. Broker validation before client commitment.
          </div>
        </div>
      )}
    </div>
  );
}
