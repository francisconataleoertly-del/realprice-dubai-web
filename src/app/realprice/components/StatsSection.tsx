"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

// ── Client-only wrapper to prevent SSR hydration mismatch ─────
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

// ── Animated counter ───────────────────────────────────────────
function CountUp({
  target,
  format = "int",
  duration = 2.4,
  delay = 0,
}: {
  target: number;
  format?: "int" | "decimal" | "compact";
  duration?: number;
  delay?: number;
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
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, target, duration, delay]);

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

// ── Elegant progress ring ─────────────────────────────────────
function ProgressRing({ percentage, size = 320 }: { percentage: number; size?: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const radius = (size - 56) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!inView || !ref.current) return;
    const circle = ref.current;
    circle.style.transition = "stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1)";
    circle.style.strokeDashoffset = String(circumference * (1 - percentage / 100));
  }, [inView, percentage, circumference]);

  return (
    <svg width={size} height={size} className="absolute inset-0 m-auto" style={{ overflow: "visible" }}>
      {/* Outer decorative ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius + 18}
        stroke="rgba(255,255,255,0.03)"
        strokeWidth={0.5}
        fill="none"
      />
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={1}
        fill="none"
      />
      {/* Progress — refined */}
      <circle
        ref={ref}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ── Subtle constellation — client only ───────────────────────
function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180) {
            const alpha = (1 - d / 180) * 0.08;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ── Main component ─────────────────────────────────────────────
export default function StatsSection() {
  return (
    <section className="relative px-6 md:px-12 lg:px-24 py-32 border-y border-white/[0.04] overflow-hidden bg-[#080810]">
      <ClientOnly>
        <Constellation />
      </ClientOnly>

      <div className="relative max-w-7xl mx-auto">
        {/* Editorial section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">
              Chapter II
            </span>
            <div className="w-12 h-px bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">
              Coverage
            </span>
          </div>
          <h2 className="font-['Fraunces'] text-[clamp(2rem,4.5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.02em] text-white max-w-3xl">
            Built on a decade of
            <span className="italic font-extralight text-white/40"> Dubai </span>
            real estate data.
          </h2>
        </motion.div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/[0.04]">
          {/* HERO — R² card (spans 5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 lg:row-span-2 relative bg-[#0a0a0f] p-10 md:p-12 flex flex-col justify-between min-h-[500px] overflow-hidden group"
          >
            {/* Subtle radial gradient background */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: "radial-gradient(circle at 50% 60%, rgba(255,255,255,0.04) 0%, transparent 60%)",
              }}
            />

            {/* Top — editorial label */}
            <div className="relative z-10">
              <p className="font-['Fraunces'] text-[14px] italic font-light text-white/40 mb-1">
                No. 01
              </p>
              <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/50">
                Primary Accuracy Metric
              </p>
            </div>

            {/* Ring + number — center */}
            <div className="relative flex items-center justify-center my-8" style={{ height: 340 }}>
              <ClientOnly>
                <ProgressRing percentage={88.9} size={340} />
              </ClientOnly>
              <div className="relative z-10 text-center">
                <p className="font-['Fraunces'] text-[clamp(5rem,9vw,8rem)] font-extralight tracking-[-0.04em] text-white leading-[0.9]">
                  <CountUp target={88.9} format="decimal" />
                </p>
                <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/35 mt-4">
                  R-Squared &middot; Confidence
                </p>
              </div>
            </div>

            {/* Bottom — supporting metrics */}
            <div className="relative z-10 grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.04]">
              {[
                { label: "Mean Error", value: "12.7%" },
                { label: "Within 10%", value: "58.1%" },
                { label: "Within 20%", value: "81.6%" },
              ].map((m, i) => (
                <div key={i}>
                  <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-white/30 mb-1.5">
                    {m.label}
                  </p>
                  <p className="font-['Fraunces'] text-[20px] font-light text-white/80">{m.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* SIDE STATS — 7 cols split in 3 rows */}
          {[
            { value: 234079, label: "Transactions Analyzed", format: "compact" as const, num: "02" },
            { value: 110, label: "Zones Covered", format: "int" as const, num: "03" },
            { value: 921, label: "Points of Interest", format: "int" as const, num: "04" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 relative bg-[#0a0a0f] p-10 md:p-12 flex items-center justify-between overflow-hidden group hover:bg-[#0d0d14] transition-colors duration-700"
            >
              {/* Left — number */}
              <div className="flex items-baseline gap-6 md:gap-10">
                <p className="font-['Fraunces'] text-[14px] italic font-light text-white/25">
                  No. {stat.num}
                </p>
                <p className="font-['Fraunces'] text-[clamp(2.5rem,5vw,4.5rem)] font-extralight tracking-[-0.03em] text-white leading-none">
                  <CountUp target={stat.value} format={stat.format} delay={0.1 + i * 0.1} />
                </p>
              </div>

              {/* Right — label */}
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/40">
                  {stat.label}
                </p>
                {/* Hover: line reveal */}
                <div className="h-px w-16 ml-auto mt-3 bg-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/50 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer — editorial note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 flex items-center justify-between"
        >
          <p className="font-['Fraunces'] italic font-light text-white/30 text-[15px] leading-relaxed max-w-md">
            &ldquo;Signal over noise. Every figure is sourced from verified DLD
            transactions and updated daily.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/25">
              Updated
            </span>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/40">
              Daily
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
