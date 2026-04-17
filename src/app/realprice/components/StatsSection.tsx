"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, animate } from "framer-motion";

// ── Animated number ────────────────────────────────────────────
function CountUp({
  target,
  format = "int",
  duration = 2.2,
  delay = 0,
}: {
  target: number;
  format?: "int" | "decimal" | "compact";
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
      onComplete: () => setDone(true),
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

  return (
    <span
      ref={ref}
      className={`inline-block transition-all duration-500 ${
        done ? "drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]" : ""
      }`}
    >
      {formatted}
    </span>
  );
}

// ── Circular progress ring ─────────────────────────────────────
function ProgressRing({ percentage, size = 280 }: { percentage: number; size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const progress = useMotionValue(0);
  const dashOffset = useSpring(progress, { stiffness: 40, damping: 20 });
  const [dashArray, setDashArray] = useState(0);

  const radius = (size - 40) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    setDashArray(circumference);
    if (inView) {
      progress.set((percentage / 100) * circumference);
    }
  }, [inView, percentage, circumference, progress]);

  useEffect(() => {
    return dashOffset.on("change", (v) => {
      if (ref.current) {
        const circle = ref.current.querySelector(".progress-circle") as SVGCircleElement;
        if (circle) circle.style.strokeDashoffset = String(circumference - v);
      }
    });
  }, [circumference, dashOffset]);

  return (
    <svg ref={ref} width={size} height={size} className="absolute inset-0 m-auto">
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={1.5}
        fill="none"
      />
      {/* Progress */}
      <circle
        className="progress-circle"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#ringGradient)"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        strokeDashoffset={dashArray}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: "drop-shadow(0 0 12px rgba(59,130,246,0.5))" }}
      />
      {/* Tick marks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 5 === 0;
        const r1 = radius + 8;
        const r2 = radius + (isMajor ? 14 : 11);
        const x1 = size / 2 + Math.cos(angle) * r1;
        const y1 = size / 2 + Math.sin(angle) * r1;
        const x2 = size / 2 + Math.cos(angle) * r2;
        const y2 = size / 2 + Math.sin(angle) * r2;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isMajor ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}
            strokeWidth={isMajor ? 1.2 : 0.8}
          />
        );
      })}
    </svg>
  );
}

// ── Constellation particle background ───────────────────────────
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

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      // Update
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w()) p.vx *= -1;
        if (p.y < 0 || p.y > h()) p.vy *= -1;
      });

      // Connect near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            const alpha = (1 - d / 140) * 0.15;
            ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.fillStyle = "rgba(59,130,246,0.4)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
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

// ── Stats section ──────────────────────────────────────────────
export default function StatsSection() {
  return (
    <section className="relative px-6 md:px-12 lg:px-24 py-28 border-y border-white/[0.04] overflow-hidden">
      {/* Constellation background */}
      <Constellation />

      <div className="relative max-w-7xl mx-auto">
        {/* Section tag */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-16"
        >
          <div className="w-8 h-px bg-[#3b82f6]/50" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">
            Platform Coverage
          </span>
        </motion.div>

        {/* Bento grid — asymmetric */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* HERO: R² accuracy with ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:row-span-2 relative bg-gradient-to-br from-[#3b82f6]/[0.06] to-transparent border border-white/[0.06] rounded-3xl p-10 flex flex-col justify-between min-h-[440px] overflow-hidden group hover:border-[#3b82f6]/20 transition-colors duration-500"
          >
            {/* Header */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#3b82f6]/70 mb-2">
                  Primary KPI
                </p>
                <p className="font-mono text-[11px] text-white/40">Model Accuracy &bull; R&sup2;</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-mono text-[9px] tracking-wider text-green-400">LIVE</span>
              </div>
            </div>

            {/* Ring + number */}
            <div className="relative flex items-center justify-center my-8" style={{ height: 280 }}>
              <ProgressRing percentage={88.9} size={280} />
              <div className="relative z-10 text-center">
                <p className="font-['Epilogue'] text-[clamp(4rem,8vw,7rem)] font-extralight tracking-[-0.04em] text-white leading-none">
                  <CountUp target={88.9} format="decimal" />
                  <span className="text-[#3b82f6]/70 text-[0.5em] ml-1">%</span>
                </p>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30 mt-3">
                  Confidence Index
                </p>
              </div>
            </div>

            {/* Footer metrics */}
            <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/[0.04]">
              <div>
                <p className="font-mono text-[9px] tracking-widest uppercase text-white/25">MAPE</p>
                <p className="font-mono text-[13px] text-white/70 mt-0.5">12.7%</p>
              </div>
              <div>
                <p className="font-mono text-[9px] tracking-widest uppercase text-white/25">W/ 10%</p>
                <p className="font-mono text-[13px] text-white/70 mt-0.5">58.1%</p>
              </div>
              <div>
                <p className="font-mono text-[9px] tracking-widest uppercase text-white/25">W/ 20%</p>
                <p className="font-mono text-[13px] text-white/70 mt-0.5">81.6%</p>
              </div>
            </div>
          </motion.div>

          {/* SIDE STATS */}
          {[
            { value: 234079, label: "Transactions Analyzed", format: "compact" as const, delay: 0.1 },
            { value: 110, label: "Zones Covered", format: "int" as const, delay: 0.2 },
            { value: 921, label: "Points of Interest", format: "int" as const, delay: 0.3 },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.7, delay: stat.delay, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 flex items-center justify-between group hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500"
            >
              <div>
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30 mb-3">
                  {stat.label}
                </p>
                <p className="font-['Epilogue'] text-[clamp(2.5rem,5vw,4rem)] font-extralight tracking-[-0.03em] text-white leading-none">
                  <CountUp target={stat.value} format={stat.format} delay={stat.delay} />
                </p>
              </div>
              {/* Animated bar indicator */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1.2, delay: stat.delay + 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:block w-24 h-px bg-gradient-to-r from-[#3b82f6]/60 to-transparent origin-left"
              />
            </motion.div>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 text-center text-white/25 text-[13px] font-light max-w-2xl mx-auto leading-relaxed"
        >
          A real-time market intelligence platform trained on a decade of Dubai real estate data
          &mdash; updated daily.
        </motion.p>
      </div>
    </section>
  );
}
