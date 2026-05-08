"use client";

import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import MeshBackground from "@/components/design/MeshBackground";
import NoiseTexture from "@/components/design/NoiseTexture";

const dubaiStats = {
  archiveRows: 799_883,
  areas: 327,
  projects: 2_915,
  liveHoldoutMapePct: 12.7,
  liveHoldoutWithin10Pct: 58.1,
  liveHoldoutWithin20Pct: 81.6,
  liveHoldoutRows: 19_755,
  liveR2Pct: 88.9,
  coverageStartYear: 1997,
  coverageEndYear: 2026,
};

function CountUp({
  target,
  format = "int",
  delay = 0,
  duration = 2.4,
}: {
  target: number;
  format?: "int" | "decimal" | "compact";
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (nextValue) => setValue(nextValue),
    });

    return () => controls.stop();
  }, [delay, duration, inView, target]);

  const display =
    format === "compact"
      ? new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value)
      : format === "decimal"
        ? value.toFixed(1)
        : Math.round(value).toLocaleString("en-US");

  return <span ref={ref}>{display}</span>;
}

function ProgressRing({ percentage, size = 340 }: { percentage: number; size?: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const strokeWidth = 3.2;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!inView || !ref.current) return;
    const circle = ref.current;
    circle.style.transition = "stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1)";
    circle.style.strokeDashoffset = String(circumference * (1 - percentage / 100));
  }, [circumference, inView, percentage]);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          ref={ref}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#dubai-stats-ring)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          fill="none"
          className="drop-shadow-[0_0_18px_rgba(115,202,255,0.34)]"
        />
        <defs>
          <linearGradient id="dubai-stats-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#79d6ff" />
            <stop offset="55%" stopColor="#f3efcf" />
            <stop offset="100%" stopColor="#9f8bff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.12)_0%,rgba(125,211,252,0)_62%)]" />
    </div>
  );
}

function Constellation() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-45">
      <div className="absolute left-[7%] top-[18%] h-1 w-1 rounded-full bg-white/40" />
      <div className="absolute left-[16%] top-[68%] h-1 w-1 rounded-full bg-[#7dd3fc]/45" />
      <div className="absolute right-[12%] top-[22%] h-1 w-1 rounded-full bg-[#f3efcf]/45" />
      <div className="absolute right-[18%] top-[78%] h-1 w-1 rounded-full bg-white/35" />
      <div className="absolute left-[31%] top-[8%] h-px w-28 rotate-[22deg] bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="absolute right-[20%] top-[10%] h-px w-36 -rotate-[16deg] bg-gradient-to-r from-transparent via-[#7dd3fc]/18 to-transparent" />
      <div className="absolute left-[8%] bottom-[12%] h-px w-40 rotate-[8deg] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.05] bg-[#05060d] px-6 py-28 md:px-12 lg:px-24">
      <Constellation />
      <MeshBackground tone="blue" intensity={0.5} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_24%,rgba(120,164,255,0.12),transparent_36%),radial-gradient(circle_at_88%_20%,rgba(77,210,255,0.10),transparent_28%),radial-gradient(circle_at_78%_82%,rgba(244,201,124,0.08),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:160px_160px]" />
      <NoiseTexture intensity={0.05} blend="overlay" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
        >
          <div>
            <div className="mb-6 flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#adc4ff]/64">
                Chapter II
              </span>
              <div className="h-px w-12 bg-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#adc4ff]/64">
                Dubai valuation observatory
              </span>
            </div>
            <h2 className="max-w-4xl font-[family:var(--font-display)] text-[clamp(2.6rem,5vw,4.5rem)] font-light leading-[0.94] tracking-[-0.045em] text-white">
              Not a brochure AVM.
              <span className="block font-extralight italic text-white/44">
                A Dubai engine built on DLD evidence and address-backed checks.
              </span>
            </h2>
          </div>
          <div className="rounded-[30px] border border-[#8bc5ff]/14 bg-[linear-gradient(145deg,rgba(13,16,28,0.88),rgba(18,22,36,0.68))] px-6 py-6 shadow-[0_22px_55px_-34px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#a9cfff]/72">
              Why this matters
            </p>
            <p className="mt-4 text-[17px] leading-8 text-white/72">
              The strong numbers below come from <span className="text-white">real DLD-backed validation</span>,
              not decorative counters. We separate the full-market holdout from the address-supported broker workflow so
              agencies can see where the engine is already strong and where it still needs tightening.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[38px] border border-[#7aa9ff]/16 bg-[linear-gradient(160deg,rgba(8,10,18,0.98),rgba(10,13,24,0.96))] p-10 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.02)_inset] md:p-12 lg:col-span-5"
          >
            <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-[#7dd3fc]/60 to-transparent opacity-70" />
            <div
              className="absolute inset-0 opacity-65"
              style={{
                background:
                  "radial-gradient(circle at 35% 42%, rgba(111,173,255,0.14) 0%, transparent 42%), radial-gradient(circle at 75% 84%, rgba(243,197,125,0.10) 0%, transparent 28%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  `DLD ${dubaiStats.coverageStartYear}-${dubaiStats.coverageEndYear}`,
                  `R² ${(dubaiStats.liveR2Pct / 100).toFixed(3)}`,
                  `${dubaiStats.liveHoldoutRows.toLocaleString("en-US")} holdout rows`,
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/58"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#b0c7ff]/74">
                Broker-ready accuracy
              </p>
              <p className="mt-5 max-w-sm text-[16px] leading-7 text-white/64">
                This ring tracks the real Dubai holdout R² score, so the broker can defend the valuation with validation
                evidence instead of opinion-only pricing.
              </p>
            </div>

            <div className="relative my-6 flex items-center justify-center">
              <div className="relative h-[300px] w-[300px] sm:h-[320px] sm:w-[320px]">
                <div className="absolute inset-0 rounded-full border border-white/[0.04] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_62%)]" />
                <ProgressRing percentage={dubaiStats.liveR2Pct} size={300} />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
                  <p className="font-[family:var(--font-display)] text-[clamp(4.25rem,7vw,6.8rem)] font-extralight leading-[0.9] tracking-[-0.06em] text-white">
                    <CountUp target={dubaiStats.liveR2Pct} format="decimal" />
                    <span className="text-white/40">%</span>
                  </p>
                  <p className="mt-3 max-w-[220px] font-mono text-[9px] uppercase tracking-[0.36em] text-[#bfd8ff]/58">
                    R-Squared confidence
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-6">
              {[
                {
                  label: "Mean error",
                  value: (
                    <>
                      <CountUp target={dubaiStats.liveHoldoutMapePct} format="decimal" duration={1.8} />
                      %
                    </>
                  ),
                },
                {
                  label: "Within 10%",
                  value: (
                    <>
                      <CountUp target={dubaiStats.liveHoldoutWithin10Pct} format="decimal" duration={1.8} delay={0.08} />
                      %
                    </>
                  ),
                },
                {
                  label: "Within 20%",
                  value: (
                    <>
                      <CountUp target={dubaiStats.liveHoldoutWithin20Pct} format="decimal" duration={1.8} delay={0.16} />
                      %
                    </>
                  ),
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                  <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.32em] text-white/36">
                    {m.label}
                  </p>
                  <p className="font-[family:var(--font-display)] text-[20px] font-light text-white/92">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-6 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-[40px] border border-[#88b2ff]/16 bg-[linear-gradient(140deg,rgba(10,13,24,0.98),rgba(12,17,32,0.96))] p-10 md:p-12"
            >
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 85% 18%, rgba(99, 167, 255, 0.18), transparent 26%), radial-gradient(circle at 82% 82%, rgba(243,197,125,0.10), transparent 24%), linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 100%)",
                }}
              />
              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-[#b8cdff]/72">
                    Combined DLD archive
                  </p>
                  <p className="mt-4 font-[family:var(--font-display)] text-[clamp(4rem,9vw,7.4rem)] font-light leading-[0.88] tracking-[-0.06em] text-white">
                    <CountUp target={dubaiStats.archiveRows} format="compact" delay={0.1} />
                  </p>
                  <p className="mt-3 max-w-xl text-[16px] leading-7 text-white/64">
                    The Dubai valuation surface is not built from portal asking prices. It sits on a much larger DLD
                    transaction archive that supports market shaping, comparables and broker-facing valuation context.
                  </p>
                </div>
                <div className="grid w-full max-w-[360px] grid-cols-2 gap-3 self-start lg:self-end">
                  {[
                    {
                      label: "Live holdout MAPE",
                      value: (
                        <>
                          <CountUp target={dubaiStats.liveHoldoutMapePct} format="decimal" duration={1.8} />
                          %
                        </>
                      ),
                    },
                    {
                      label: "Holdout rows",
                      value: <CountUp target={dubaiStats.liveHoldoutRows} duration={1.8} />,
                    },
                  ].map((meta) => (
                    <div
                      key={meta.label}
                      className="relative flex min-h-[138px] min-w-0 flex-col justify-between overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,10,20,0.82),rgba(10,15,28,0.68))] px-5 py-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
                    >
                      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#9fd6ff]/30 to-transparent" />
                      <div className="absolute -right-10 top-10 h-24 w-24 rounded-full bg-[#7ab7ff]/8 blur-2xl" />
                      <p className="font-mono text-[8px] uppercase tracking-[0.32em] text-white/36">
                        {meta.label}
                      </p>
                      <p className="mt-3 text-balance font-[family:var(--font-display)] text-[22px] leading-[0.92] text-white/96 sm:text-[26px]">
                        {meta.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  value: dubaiStats.areas,
                  label: "Market areas",
                  note: "Distinct submarkets indexed across the combined archive and market intelligence layer.",
                  accent: "rgba(106,179,255,0.18)",
                  num: "03",
                },
                {
                  value: dubaiStats.projects,
                  label: "Projects",
                  note: "Project-level fingerprints that help the engine move beyond broad zone medians.",
                  accent: "rgba(247,196,124,0.14)",
                  num: "04",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: 0.8, delay: 0.18 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-[36px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(9,11,18,0.98),rgba(10,12,20,0.95))] p-9 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      background: `radial-gradient(circle at 85% 18%, ${stat.accent}, transparent 28%)`,
                    }}
                  />
                  <div className="relative z-10">
                    <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-white/46">
                      No. {stat.num}
                    </p>
                    <p className="mt-4 font-[family:var(--font-display)] text-[clamp(3rem,6vw,4.8rem)] font-light leading-none tracking-[-0.05em] text-white">
                      <CountUp target={stat.value} format={stat.value > 999 ? "compact" : "int"} delay={0.18 + index * 0.1} />
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.34em] text-[#bfd0f0]/64">
                      {stat.label}
                    </p>
                    <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/62">{stat.note}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-6 py-5 backdrop-blur-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#8eb0ff]/55">
            Accuracy note
          </p>
          <p className="mt-3 text-[15px] leading-7 text-white/64">
            The <span className="text-white">Dubai validation layer</span> currently benchmarks at{" "}
            <span className="text-white">R² {(dubaiStats.liveR2Pct / 100).toFixed(3)}</span>,{" "}
            <span className="text-white">{dubaiStats.liveHoldoutMapePct.toFixed(1)}% MAPE</span> and{" "}
            <span className="text-white">{dubaiStats.liveHoldoutWithin20Pct.toFixed(1)}% within 20%</span> across{" "}
            {dubaiStats.liveHoldoutRows.toLocaleString("en-US")} test rows, so we are being explicit about which layer
            is already strong and which one still needs tightening.
          </p>
        </div>
      </div>
    </section>
  );
}
