"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 234079, suffix: "", label: "Transactions Analyzed", format: "compact" },
  { value: 110, suffix: "", label: "Zones Covered", format: "int" },
  { value: 88.9, suffix: "%", label: "Model Accuracy (R²)", format: "decimal" },
  { value: 921, suffix: "", label: "Points of Interest", format: "int" },
];

function CountUp({ target, format, duration = 2000 }: { target: number; format: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  const formatted =
    format === "compact"
      ? value >= 1000
        ? `${(value / 1000).toFixed(0)}K`
        : Math.round(value).toLocaleString()
      : format === "decimal"
      ? value.toFixed(1)
      : Math.round(value).toLocaleString();

  return <span ref={ref}>{formatted}</span>;
}

export default function StatsSection() {
  return (
    <section className="relative px-6 md:px-12 lg:px-24 py-24 border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        {/* Section tag */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-8 h-px bg-[#3b82f6]/50" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">
            Platform Coverage
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04]">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="bg-[#0a0a0f] px-6 md:px-8 py-10 md:py-12 group hover:bg-white/[0.01] transition-colors duration-500"
            >
              <p className="font-['Epilogue'] text-[clamp(2rem,4vw,3.5rem)] font-extralight tracking-[-0.03em] text-white leading-none mb-3">
                <CountUp target={stat.value} format={stat.format} />
                <span className="text-[#3b82f6]/60">{stat.suffix}</span>
              </p>
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30">
                {stat.label}
              </p>
              {/* Underline on hover */}
              <div className="h-px w-8 bg-[#3b82f6]/0 group-hover:bg-[#3b82f6]/60 mt-4 transition-all duration-700 group-hover:w-16" />
            </div>
          ))}
        </div>

        {/* Tagline */}
        <p className="mt-10 text-center text-white/25 text-[13px] font-light max-w-2xl mx-auto leading-relaxed">
          A real-time market intelligence platform trained on a decade of Dubai real estate data &mdash; updated daily.
        </p>
      </div>
    </section>
  );
}
