"use client";

import { motion } from "framer-motion";
import type { DealIntelligence, DealTone } from "@/lib/deal-intelligence";

const TONE: Record<DealTone, { text: string; border: string; bg: string; glow: string }> = {
  emerald: {
    text: "text-emerald-300",
    border: "border-emerald-300/25",
    bg: "from-emerald-400/12 via-white/[0.03] to-transparent",
    glow: "bg-emerald-400/20",
  },
  blue: {
    text: "text-blue-300",
    border: "border-blue-300/25",
    bg: "from-blue-400/12 via-white/[0.03] to-transparent",
    glow: "bg-blue-400/20",
  },
  amber: {
    text: "text-amber-300",
    border: "border-amber-300/25",
    bg: "from-amber-400/12 via-white/[0.03] to-transparent",
    glow: "bg-amber-400/20",
  },
  red: {
    text: "text-red-300",
    border: "border-red-300/25",
    bg: "from-red-400/12 via-white/[0.03] to-transparent",
    glow: "bg-red-400/20",
  },
};

type Props = {
  intelligence: DealIntelligence;
  title?: string;
  className?: string;
};

export default function DealIntelligencePanel({
  intelligence,
  title = "AI deal intelligence",
  className = "",
}: Props) {
  const tone = TONE[intelligence.tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border ${tone.border} bg-gradient-to-br ${tone.bg} p-5 backdrop-blur-2xl ${className}`}
    >
      <div className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${tone.glow}`} />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">
              {title}
            </p>
            <h3 className={`font-['Fraunces'] text-[28px] font-light leading-none tracking-tight ${tone.text}`}>
              {intelligence.label}
            </h3>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/55">
              {intelligence.summary}
            </p>
          </div>
          <div className="min-w-[132px] rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
              Score
            </p>
            <p className={`mt-2 font-['Fraunces'] text-[34px] font-extralight leading-none ${tone.text}`}>
              {intelligence.score}
            </p>
            <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.22em] text-white/35">
              {intelligence.confidenceLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.05] lg:grid-cols-4">
          {intelligence.metrics.map((metric) => {
            const metricTone = metric.tone ? TONE[metric.tone].text : "text-white";
            return (
              <div key={metric.label} className="bg-[#07090f]/85 p-4">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.23em] text-white/30">
                  {metric.label}
                </p>
                <p className={`font-mono text-[15px] leading-tight ${metricTone}`}>
                  {metric.value}
                </p>
                {metric.detail ? (
                  <p className="mt-2 text-[11px] leading-4 text-white/35">{metric.detail}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-black/18 p-4">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
              Risk flags
            </p>
            <div className="space-y-2">
              {intelligence.risks.slice(0, 3).map((risk) => (
                <p key={risk} className="text-[12px] leading-5 text-white/55">
                  <span className={tone.text}>-</span> {risk}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/18 p-4">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
              Next actions
            </p>
            <div className="space-y-2">
              {intelligence.nextActions.slice(0, 3).map((action) => (
                <p key={action} className="text-[12px] leading-5 text-white/55">
                  <span className={tone.text}>-</span> {action}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
