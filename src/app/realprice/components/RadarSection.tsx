"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface Opportunity {
  id: number;
  zone: string;
  type: string;
  rooms: string;
  area_m2: number;
  listed_price: number;
  estimated_price: number;
  diff_pct: number;
  signal: "green" | "yellow" | "red";
  // Radar position (angle in degrees, distance from center 0-1)
  angle: number;
  distance: number;
}

const DEMO_DATA: Opportunity[] = [
  { id: 1, zone: "Dubai Marina", type: "Apartment", rooms: "1 BR", area_m2: 65, listed_price: 1100000, estimated_price: 1350000, diff_pct: -18.5, signal: "green", angle: 45, distance: 0.6 },
  { id: 2, zone: "Business Bay", type: "Apartment", rooms: "Studio", area_m2: 42, listed_price: 780000, estimated_price: 820000, diff_pct: -4.9, signal: "yellow", angle: 120, distance: 0.4 },
  { id: 3, zone: "JVC", type: "Apartment", rooms: "2 BR", area_m2: 110, listed_price: 1250000, estimated_price: 1180000, diff_pct: 5.9, signal: "red", angle: 200, distance: 0.7 },
  { id: 4, zone: "Palm Jumeirah", type: "Apartment", rooms: "2 BR", area_m2: 145, listed_price: 3200000, estimated_price: 4100000, diff_pct: -22.0, signal: "green", angle: 330, distance: 0.85 },
  { id: 5, zone: "Downtown Dubai", type: "Apartment", rooms: "1 BR", area_m2: 72, listed_price: 1900000, estimated_price: 1950000, diff_pct: -2.6, signal: "yellow", angle: 80, distance: 0.5 },
  { id: 6, zone: "Dubai Hills", type: "Villa", rooms: "4 BR", area_m2: 350, listed_price: 5800000, estimated_price: 5200000, diff_pct: 11.5, signal: "red", angle: 260, distance: 0.9 },
  { id: 7, zone: "Arabian Ranches", type: "Villa", rooms: "3 BR", area_m2: 280, listed_price: 2900000, estimated_price: 3400000, diff_pct: -14.7, signal: "green", angle: 15, distance: 0.75 },
  { id: 8, zone: "DIFC", type: "Apartment", rooms: "1 BR", area_m2: 80, listed_price: 2100000, estimated_price: 2350000, diff_pct: -10.6, signal: "green", angle: 170, distance: 0.35 },
  { id: 9, zone: "Motor City", type: "Apartment", rooms: "2 BR", area_m2: 120, listed_price: 1050000, estimated_price: 980000, diff_pct: 7.1, signal: "red", angle: 300, distance: 0.55 },
  { id: 10, zone: "Al Barsha", type: "Apartment", rooms: "Studio", area_m2: 38, listed_price: 520000, estimated_price: 550000, diff_pct: -5.5, signal: "yellow", angle: 240, distance: 0.45 },
  { id: 11, zone: "JLT", type: "Apartment", rooms: "1 BR", area_m2: 70, listed_price: 850000, estimated_price: 1020000, diff_pct: -16.7, signal: "green", angle: 95, distance: 0.65 },
  { id: 12, zone: "Silicon Oasis", type: "Apartment", rooms: "2 BR", area_m2: 95, listed_price: 720000, estimated_price: 680000, diff_pct: 5.9, signal: "red", angle: 150, distance: 0.8 },
];

const SIGNAL_CONFIG = {
  green: { color: "#10b981", glow: "rgba(16,185,129,0.6)", label: "Underpriced", icon: ArrowDown },
  yellow: { color: "#f59e0b", glow: "rgba(245,158,11,0.6)", label: "Fair Value", icon: Minus },
  red: { color: "#ef4444", glow: "rgba(239,68,68,0.6)", label: "Overpriced", icon: ArrowUp },
};

const fmt = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

// ── Radar Canvas Component ──────────────────────────────────────
function RadarDisplay({
  items,
  selected,
  onSelect,
  filter,
}: {
  items: Opportunity[];
  selected: Opportunity | null;
  onSelect: (item: Opportunity) => void;
  filter: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngle = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const context = ctx;

    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(canvas.parentElement!.clientWidth, 500);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 20;

    const filtered = filter === "all" ? items : items.filter((i) => i.signal === filter);

    function draw() {
      context.clearRect(0, 0, size, size);

      // Background
      context.fillStyle = "rgba(10, 10, 15, 0.95)";
      context.fillRect(0, 0, size, size);

      // Grid circles
      for (let i = 1; i <= 4; i++) {
        const r = (maxR / 4) * i;
        context.beginPath();
        context.arc(cx, cy, r, 0, Math.PI * 2);
        context.strokeStyle = `rgba(59, 130, 246, ${i === 4 ? 0.15 : 0.06})`;
        context.lineWidth = 1;
        context.stroke();
      }

      // Grid lines (crosshairs)
      for (let a = 0; a < 360; a += 30) {
        const rad = (a * Math.PI) / 180;
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(cx + Math.cos(rad) * maxR, cy + Math.sin(rad) * maxR);
        context.strokeStyle = "rgba(59, 130, 246, 0.04)";
        context.lineWidth = 1;
        context.stroke();
      }

      // Degree labels
      context.font = "9px monospace";
      context.fillStyle = "rgba(255,255,255,0.1)";
      context.textAlign = "center";
      for (let a = 0; a < 360; a += 90) {
        const rad = (a * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * (maxR + 12);
        const ly = cy + Math.sin(rad) * (maxR + 12);
        context.fillText(`${a}\u00B0`, lx, ly + 3);
      }

      // Sweep line
      const sweepRad = (sweepAngle.current * Math.PI) / 180;
      // Sweep glow (trailing fade)
      for (let i = 0; i < 30; i++) {
        const a = sweepAngle.current - i * 1.5;
        const rad2 = (a * Math.PI) / 180;
        const alpha = 0.15 * (1 - i / 30);
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(cx + Math.cos(rad2) * maxR, cy + Math.sin(rad2) * maxR);
        context.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        context.lineWidth = 2;
        context.stroke();
      }

      // Main sweep line
      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(cx + Math.cos(sweepRad) * maxR, cy + Math.sin(sweepRad) * maxR);
      context.strokeStyle = "rgba(59, 130, 246, 0.5)";
      context.lineWidth = 2;
      context.stroke();

      // Center dot
      context.beginPath();
      context.arc(cx, cy, 3, 0, Math.PI * 2);
      context.fillStyle = "#3b82f6";
      context.fill();

      // Plot items as blips
      filtered.forEach((item) => {
        const rad = ((item.angle - 90) * Math.PI) / 180;
        const r = item.distance * maxR;
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;

        const cfg = SIGNAL_CONFIG[item.signal];
        const isSelected = selected?.id === item.id;

        // Blip glow
        if (isSelected) {
          context.beginPath();
          context.arc(x, y, 14, 0, Math.PI * 2);
          context.fillStyle = cfg.glow.replace("0.6", "0.15");
          context.fill();
        }

        // Ping effect (when sweep passes)
        const angleDiff = Math.abs(((sweepAngle.current - item.angle + 360) % 360));
        if (angleDiff < 30) {
          const pingAlpha = 0.4 * (1 - angleDiff / 30);
          context.beginPath();
          context.arc(x, y, 8 + (30 - angleDiff) * 0.3, 0, Math.PI * 2);
          context.fillStyle = cfg.color + Math.round(pingAlpha * 255).toString(16).padStart(2, "0");
          context.fill();
        }

        // Blip dot
        context.beginPath();
        context.arc(x, y, isSelected ? 6 : 4, 0, Math.PI * 2);
        context.fillStyle = cfg.color;
        context.fill();

        // Label (only for selected or green opportunities)
        if (isSelected || item.signal === "green") {
          context.font = isSelected ? "bold 10px monospace" : "9px monospace";
          context.fillStyle = isSelected ? "#ffffff" : "rgba(255,255,255,0.4)";
          context.textAlign = "left";
          context.fillText(item.zone, x + 10, y + 3);
          if (isSelected) {
            context.font = "9px monospace";
            context.fillStyle = cfg.color;
            context.fillText(`${item.diff_pct > 0 ? "+" : ""}${item.diff_pct.toFixed(1)}%`, x + 10, y + 15);
          }
        }
      });

      // Update sweep
      sweepAngle.current = (sweepAngle.current + 0.8) % 360;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [items, selected, filter]);

  // Handle click on canvas to select blip
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const maxR = rect.width / 2 - 20;

    const filtered = filter === "all" ? items : items.filter((i) => i.signal === filter);

    let closest: Opportunity | null = null;
    let closestDist = 20; // 20px click radius

    filtered.forEach((item) => {
      const rad = ((item.angle - 90) * Math.PI) / 180;
      const r = item.distance * maxR;
      const bx = cx + Math.cos(rad) * r;
      const by = cy + Math.sin(rad) * r;
      const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    });

    if (closest) onSelect(closest);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="cursor-crosshair mx-auto block"
      style={{ maxWidth: 500, maxHeight: 500 }}
    />
  );
}

// ── Main Section ────────────────────────────────────────────────
export default function RadarSection() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const filtered = filter === "all" ? DEMO_DATA : DEMO_DATA.filter((d) => d.signal === filter);

  return (
    <section id="radar" className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dubai-tower-bg.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

      <div className="relative z-10 px-4 md:px-8 lg:px-16 py-28">
        <div className="max-w-7xl mx-auto">
          {/* Editorial header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Chapter V</span>
              <div className="w-12 h-px bg-white/20" />
              <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">Opportunity Radar</span>
            </div>

            <h2 className="font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white max-w-4xl">
              Find underpriced
              <br />
              <span className="italic font-extralight text-white/40">opportunities.</span>
            </h2>
            <p className="font-['Fraunces'] italic text-white/30 text-[14px] mt-6 max-w-xl">
              Live scanning every listing &mdash; green blips signal price below AI estimate.
            </p>
          </motion.div>

          {/* Filters — editorial style */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-10 flex items-center gap-4"
          >
            <p className="font-['Fraunces'] italic text-[13px] font-light text-white/40 shrink-0">Filter</p>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <div className="inline-grid grid-cols-4 border border-white/[0.06] overflow-hidden">
              {[
                { key: "all", label: "All" },
                { key: "green", label: "Opportunities" },
                { key: "yellow", label: "Fair" },
                { key: "red", label: "Overpriced" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`relative px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
                    filter === f.key ? "bg-white/[0.06] text-white" : "text-white/30 hover:text-white/50 hover:bg-white/[0.02]"
                  }`}
                >
                  {f.label}
                  {filter === f.key && (
                    <motion.span
                      layoutId="radar-filter"
                      className="absolute bottom-0 left-0 right-0 h-px bg-white"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Radar display — editorial framed */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t border-l border-white/25 z-10" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t border-r border-white/25 z-10" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b border-l border-white/25 z-10" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b border-r border-white/25 z-10" />

              <div className="relative bg-[#0a0a0f]/80 backdrop-blur-sm border border-white/[0.04] p-6 flex items-center justify-center">
                <RadarDisplay items={DEMO_DATA} selected={selected} onSelect={setSelected} filter={filter} />

                {/* Corner labels */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-[#0a0a0f]/70 border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                  <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/50">Scanning</span>
                </div>
                <div className="absolute bottom-4 right-4 px-2 py-1 bg-[#0a0a0f]/70 border border-white/10">
                  <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30">360&deg;</span>
                </div>
              </div>
            </motion.div>

            {/* Details panel */}
            <div className="space-y-4">
              {/* Legend — editorial */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="relative bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08] p-5"
              >
                <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/20" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/20" />
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30 mb-4">Signal Distribution</p>
                <div className="grid grid-cols-3 gap-6">
                  {(["green", "yellow", "red"] as const).map((sig) => {
                    const cfg = SIGNAL_CONFIG[sig];
                    const count = DEMO_DATA.filter((d) => d.signal === sig).length;
                    return (
                      <div key={sig} className="text-center">
                        <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: cfg.color, boxShadow: `0 0 12px ${cfg.glow}` }} />
                        <p className="font-['Fraunces'] text-[32px] font-extralight text-white leading-none">{count}</p>
                        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30 mt-1.5">{cfg.label}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Selected detail */}
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08] p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-['Fraunces'] italic text-[12px] font-light text-white/40 mb-1">Selected</p>
                      <p className="font-['Fraunces'] text-[22px] font-light text-white tracking-tight leading-none">{selected.zone}</p>
                      <p className="font-mono text-[10px] text-white/30 mt-1.5 tracking-wider">
                        {selected.type} &middot; {selected.rooms} &middot; {selected.area_m2}m&sup2;
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border"
                      style={{ borderColor: SIGNAL_CONFIG[selected.signal].color + "40", color: SIGNAL_CONFIG[selected.signal].color }}>
                      {selected.diff_pct > 0 ? <ArrowUp size={12} /> : selected.diff_pct < -5 ? <ArrowDown size={12} /> : <Minus size={12} />}
                      {Math.abs(selected.diff_pct).toFixed(1)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-3 border-t border-white/[0.06]">
                    <div>
                      <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30 mb-1">Listed</p>
                      <p className="font-['Fraunces'] text-[20px] font-extralight text-white">
                        <span className="text-white/30 text-[0.6em] mr-1">AED</span>{fmt(selected.listed_price)}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/30 mb-1">AI Estimate</p>
                      <p className="font-['Fraunces'] text-[20px] font-extralight" style={{ color: SIGNAL_CONFIG[selected.signal].color }}>
                        <span className="text-white/30 text-[0.6em] mr-1">AED</span>{fmt(selected.estimated_price)}
                      </p>
                    </div>
                  </div>
                  {selected.signal === "green" && (
                    <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                      <p className="font-['Fraunces'] italic text-[12px] text-green-400/60">Potential saving</p>
                      <p className="font-mono text-[14px] text-green-400">AED {fmt(selected.estimated_price - selected.listed_price)}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Property list — editorial table */}
              <div className="relative bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08] overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/20" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/20" />
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <p className="font-['Fraunces'] italic text-[12px] font-light text-white/40">All Properties</p>
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/25">{filtered.length} results</p>
                </div>
                <div className="grid grid-cols-5 px-4 py-2 border-b border-white/[0.04] text-[9px] font-mono text-white/20 tracking-[0.2em] uppercase">
                  <span>Zone</span><span>Type</span><span className="text-right">Listed</span><span className="text-right">AI Est.</span><span className="text-right">Diff</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {filtered.map((item) => {
                    const cfg = SIGNAL_CONFIG[item.signal];
                    const isActive = selected?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className={`w-full grid grid-cols-5 px-4 py-2.5 text-[11px] border-b border-white/[0.02] transition-all hover:bg-white/[0.03] ${
                          isActive ? "bg-white/[0.05]" : ""
                        }`}
                      >
                        <span className="text-white/60 text-left truncate">{item.zone}</span>
                        <span className="text-white/30 text-left">{item.rooms}</span>
                        <span className="text-white/40 font-mono text-right">{fmt(item.listed_price)}</span>
                        <span className="font-mono text-right" style={{ color: cfg.color }}>{fmt(item.estimated_price)}</span>
                        <span className="font-mono text-right" style={{ color: cfg.color }}>
                          {item.diff_pct > 0 ? "+" : ""}{item.diff_pct.toFixed(1)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <p className="font-['Fraunces'] italic text-[11px] text-white/20">
                  Live feed &middot; scanning {DEMO_DATA.length} properties
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/25">Demo Data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
