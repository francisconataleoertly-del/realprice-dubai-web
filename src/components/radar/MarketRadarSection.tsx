"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, Radar } from "lucide-react";

export type RadarSignal = "green" | "yellow" | "red";

export type RadarListing = {
  id: string | number;
  title: string;
  subtitle: string;
  listedValue: number;
  benchmarkValue: number;
  diffPct: number;
  signal: RadarSignal;
  angle: number;
  distance: number;
  areaLabel?: string;
  note?: string;
};

type MarketRadarSectionProps = {
  id?: string;
  chapterLabel: string;
  sectionLabel: string;
  title: string;
  accentTitle: string;
  description: string;
  backgroundImage: string;
  scanningLabel: string;
  feedLabel: string;
  publishedLabel: string;
  tableTitle: string;
  listTitle: string;
  currencyPrefix: string;
  locale: string;
  listings: RadarListing[];
};

const SIGNAL_CONFIG: Record<
  RadarSignal,
  {
    color: string;
    glow: string;
    label: string;
    detail: string;
    Icon: typeof ArrowUp;
  }
> = {
  green: {
    color: "#3bf0b2",
    glow: "rgba(59, 240, 178, 0.58)",
    label: "Green Light",
    detail: "Published below model range",
    Icon: ArrowDown,
  },
  yellow: {
    color: "#f5c96d",
    glow: "rgba(245, 201, 109, 0.48)",
    label: "In Range",
    detail: "Reasonable asking level",
    Icon: Minus,
  },
  red: {
    color: "#ff7b88",
    glow: "rgba(255, 123, 136, 0.48)",
    label: "Too High",
    detail: "Published above model range",
    Icon: ArrowUp,
  },
};

function formatMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

function RadarCanvas({
  items,
  selected,
  onSelect,
  filter,
}: {
  items: RadarListing[];
  selected: RadarListing | null;
  onSelect: (item: RadarListing) => void;
  filter: RadarSignal | "all";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngle = useRef(18);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const drawFrame = () => {
      const parentSize = Math.min(canvas.parentElement?.clientWidth ?? 520, 592);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parentSize * dpr;
      canvas.height = parentSize * dpr;
      canvas.style.width = `${parentSize}px`;
      canvas.style.height = `${parentSize}px`;

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      const size = parentSize;
      const cx = size / 2;
      const cy = size / 2;
      const maxRadius = size / 2 - 20;
      const visible = filter === "all" ? items : items.filter((item) => item.signal === filter);

      context.clearRect(0, 0, size, size);

      const bg = context.createRadialGradient(cx, cy, maxRadius * 0.08, cx, cy, maxRadius);
      bg.addColorStop(0, "rgba(9, 55, 69, 0.99)");
      bg.addColorStop(0.38, "rgba(6, 34, 46, 0.99)");
      bg.addColorStop(0.74, "rgba(4, 20, 30, 0.99)");
      bg.addColorStop(1, "rgba(1, 8, 16, 0.99)");
      context.fillStyle = bg;
      context.beginPath();
      context.arc(cx, cy, maxRadius + 9, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(105, 248, 255, 0.44)";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(cx, cy, maxRadius + 4, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = "rgba(26, 151, 174, 0.88)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(cx, cy, maxRadius - 2, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = "rgba(97, 233, 255, 0.14)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(cx, cy, maxRadius + 10, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = "rgba(70, 243, 188, 0.22)";
      context.lineWidth = 1;
      for (let i = 1; i <= 5; i += 1) {
        context.beginPath();
        context.arc(cx, cy, (maxRadius / 5) * i, 0, Math.PI * 2);
        context.stroke();
      }

      for (let i = 0; i < 360; i += 15) {
        const radians = (i * Math.PI) / 180;
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(cx + Math.cos(radians) * maxRadius, cy + Math.sin(radians) * maxRadius);
        context.strokeStyle =
          i % 45 === 0 ? "rgba(70, 243, 188, 0.22)" : "rgba(97, 233, 255, 0.06)";
        context.stroke();
      }

      context.strokeStyle = "rgba(87, 231, 255, 0.08)";
      for (let x = cx - maxRadius; x <= cx + maxRadius; x += 16) {
        context.beginPath();
        context.moveTo(x, cy - maxRadius);
        context.lineTo(x, cy + maxRadius);
        context.stroke();
      }
      for (let y = cy - maxRadius; y <= cy + maxRadius; y += 16) {
        context.beginPath();
        context.moveTo(cx - maxRadius, y);
        context.lineTo(cx + maxRadius, y);
        context.stroke();
      }

      for (let i = 0; i < 360; i += 6) {
        const radians = (i * Math.PI) / 180;
        const tickLength = i % 30 === 0 ? 16 : i % 12 === 0 ? 10 : 6;
        const outer = maxRadius + 1;
        const inner = outer - tickLength;
        context.beginPath();
        context.moveTo(cx + Math.cos(radians) * inner, cy + Math.sin(radians) * inner);
        context.lineTo(cx + Math.cos(radians) * outer, cy + Math.sin(radians) * outer);
        context.strokeStyle =
          i % 30 === 0 ? "rgba(123, 255, 239, 0.84)" : "rgba(111, 237, 255, 0.42)";
        context.lineWidth = i % 30 === 0 ? 2.2 : 1.3;
        context.stroke();
      }

      context.font = "10px ui-monospace, SFMono-Regular, monospace";
      context.fillStyle = "rgba(160, 255, 236, 0.46)";
      context.textAlign = "center";
      [
        { label: "0", angle: -90 },
        { label: "90", angle: 0 },
        { label: "180", angle: 90 },
        { label: "270", angle: 180 },
      ].forEach((mark) => {
        const radians = (mark.angle * Math.PI) / 180;
        const tx = cx + Math.cos(radians) * (maxRadius - 26);
        const ty = cy + Math.sin(radians) * (maxRadius - 26);
        context.fillText(mark.label, tx, ty + 4);
      });

      const beamAngle = (sweepAngle.current * Math.PI) / 180;
      const beamWidth = 0.54;
      const beamGradient = context.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      beamGradient.addColorStop(0, "rgba(188, 255, 239, 0.82)");
      beamGradient.addColorStop(0.16, "rgba(111, 255, 220, 0.38)");
      beamGradient.addColorStop(0.54, "rgba(52, 248, 173, 0.22)");
      beamGradient.addColorStop(1, "rgba(52, 248, 173, 0)");

      context.save();
      context.beginPath();
      context.moveTo(cx, cy);
      context.arc(cx, cy, maxRadius, beamAngle - beamWidth / 2, beamAngle + beamWidth / 2);
      context.closePath();
      context.fillStyle = beamGradient;
      context.fill();
      context.restore();

      for (let i = 0; i < 26; i += 1) {
        const trailingAngle = ((sweepAngle.current - i * 1.26) * Math.PI) / 180;
        const alpha = 0.28 * (1 - i / 26);
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(cx + Math.cos(trailingAngle) * maxRadius, cy + Math.sin(trailingAngle) * maxRadius);
        context.strokeStyle = `rgba(155, 255, 237, ${alpha})`;
        context.lineWidth = i === 0 ? 5 : 2;
        context.stroke();
      }

      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(cx + Math.cos(beamAngle) * maxRadius, cy + Math.sin(beamAngle) * maxRadius);
      context.strokeStyle = "rgba(255,255,255,0.92)";
      context.lineWidth = 2.6;
      context.stroke();

      context.beginPath();
      context.arc(cx, cy, maxRadius * 0.2, 0, Math.PI * 2);
      context.strokeStyle = "rgba(109, 238, 255, 0.74)";
      context.lineWidth = 5;
      context.stroke();

      context.beginPath();
      context.arc(cx, cy, 5, 0, Math.PI * 2);
      context.fillStyle = "#c9fff6";
      context.shadowColor = "rgba(176,255,239,0.7)";
      context.shadowBlur = 24;
      context.fill();
      context.shadowBlur = 0;

      context.beginPath();
      context.arc(cx, cy, 18, 0, Math.PI * 2);
      context.strokeStyle = "rgba(153, 255, 235, 0.25)";
      context.lineWidth = 1.6;
      context.stroke();

      const waveBaseY = cy + maxRadius * 0.54;
      context.beginPath();
      visible.forEach((item, index) => {
        const px = cx - maxRadius * 0.82 + (index / Math.max(1, visible.length - 1)) * maxRadius * 1.64;
        const amplitude = (1 - item.distance) * 30 + (item.signal === "green" ? 10 : item.signal === "red" ? -6 : 2);
        const py = waveBaseY + Math.sin((item.angle / 180) * Math.PI) * 18 - amplitude;
        if (index === 0) {
          context.moveTo(px, py);
        } else {
          context.lineTo(px, py);
        }
      });
      context.strokeStyle = "rgba(216, 255, 248, 0.72)";
      context.lineWidth = 2;
      context.stroke();

      visible.forEach((item) => {
        const radians = ((item.angle - 90) * Math.PI) / 180;
        const distance = item.distance * maxRadius;
        const x = cx + Math.cos(radians) * distance;
        const y = cy + Math.sin(radians) * distance;
        const config = SIGNAL_CONFIG[item.signal];
        const isSelected = selected?.id === item.id;

        const diffToSweep = Math.abs(((sweepAngle.current - item.angle + 540) % 360) - 180);
        if (diffToSweep < 18) {
          context.beginPath();
          context.arc(x, y, 18 + (18 - diffToSweep) * 0.72, 0, Math.PI * 2);
          context.fillStyle = config.glow.replace("0.48", "0.16").replace("0.58", "0.16");
          context.fill();
        }

        if (isSelected) {
          context.beginPath();
          context.arc(x, y, 24, 0, Math.PI * 2);
          context.fillStyle = config.glow.replace("0.48", "0.14").replace("0.58", "0.14");
          context.fill();
        }

        context.beginPath();
        context.arc(x, y, isSelected ? 13 : 9, 0, Math.PI * 2);
        context.strokeStyle = config.color;
        context.lineWidth = isSelected ? 2 : 1.4;
        context.globalAlpha = isSelected ? 0.62 : 0.28;
        context.stroke();
        context.globalAlpha = 1;

        context.beginPath();
        context.arc(x, y, isSelected ? 7.5 : 5.5, 0, Math.PI * 2);
        context.fillStyle = config.color;
        context.shadowColor = config.glow;
        context.shadowBlur = isSelected ? 22 : 14;
        context.fill();
        context.shadowBlur = 0;

        if (isSelected || item.signal === "green") {
          context.font = isSelected ? "600 11px Inter, sans-serif" : "10px Inter, sans-serif";
          context.fillStyle = isSelected ? "rgba(255,255,255,0.96)" : "rgba(207, 255, 247, 0.52)";
          context.textAlign = "left";
          context.fillText(item.title, x + 12, y - 2);
          context.font = "10px ui-monospace, SFMono-Regular, monospace";
          context.fillStyle = config.color;
          context.fillText(`${item.diffPct > 0 ? "+" : ""}${item.diffPct.toFixed(1)}%`, x + 12, y + 12);
        }
      });

      sweepAngle.current = (sweepAngle.current + 0.48) % 360;
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawFrame);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [filter, items, selected]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const maxRadius = rect.width / 2 - 20;
    const visible = filter === "all" ? items : items.filter((item) => item.signal === filter);

    let nearest: RadarListing | null = null;
    let nearestDistance = 24;

    visible.forEach((item) => {
      const radians = ((item.angle - 90) * Math.PI) / 180;
      const distance = item.distance * maxRadius;
      const px = cx + Math.cos(radians) * distance;
      const py = cy + Math.sin(radians) * distance;
      const delta = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

      if (delta < nearestDistance) {
        nearestDistance = delta;
        nearest = item;
      }
    });

    if (nearest) {
      onSelect(nearest);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="mx-auto block cursor-crosshair"
      style={{ maxWidth: 592, maxHeight: 592 }}
    />
  );
}

export default function MarketRadarSection({
  id = "radar",
  chapterLabel,
  sectionLabel,
  title,
  accentTitle,
  description,
  backgroundImage,
  scanningLabel,
  feedLabel,
  publishedLabel,
  tableTitle,
  listTitle,
  currencyPrefix,
  locale,
  listings,
}: MarketRadarSectionProps) {
  const [filter, setFilter] = useState<RadarSignal | "all">("all");
  const [selected, setSelected] = useState<RadarListing | null>(listings[0] ?? null);

  const visible = filter === "all" ? listings : listings.filter((item) => item.signal === filter);

  useEffect(() => {
    if (!visible.length) {
      setSelected(null);
      return;
    }

    if (!selected || !visible.some((item) => item.id === selected.id)) {
      const preferred = visible.find((item) => item.signal === "green") ?? visible[0];
      setSelected(preferred);
    }
  }, [selected, visible]);

  return (
    <section id={id} className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center md:bg-fixed"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,185,197,0.14),transparent_36%),linear-gradient(180deg,rgba(4,12,16,0.46),rgba(5,10,18,0.88)_50%,rgba(5,7,12,0.98))]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,12,20,0.88)_10%,rgba(8,12,20,0.58)_42%,rgba(8,12,20,0.86)_100%)]" />

      <div className="relative z-10 px-4 py-28 md:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8 }}
            className="mb-14 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]"
          >
            <div>
              <div className="mb-6 flex items-center gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
                  {chapterLabel}
                </span>
                <div className="h-px w-12 bg-white/20" />
                <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
                  {sectionLabel}
                </span>
              </div>

              <h2 className="max-w-5xl font-['Fraunces'] text-[clamp(2.65rem,6vw,5.25rem)] font-light leading-[0.94] tracking-[-0.03em] text-white">
                {title}
                <br />
                <span className="font-extralight italic text-white/46">{accentTitle}</span>
              </h2>
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/58">{description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              {(["green", "yellow", "red"] as const).map((signal) => {
                const config = SIGNAL_CONFIG[signal];
                const total = listings.filter((item) => item.signal === signal).length;

                return (
                  <div
                    key={signal}
                    className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,28,0.92),rgba(10,16,26,0.74))] p-5 backdrop-blur-2xl"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }}
                    />
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: config.color, boxShadow: `0 0 16px ${config.glow}` }}
                      />
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                        {config.label}
                      </p>
                    </div>
                    <p className="font-['Fraunces'] text-[38px] font-extralight leading-none text-white">
                      {total}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/46">{config.detail}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-8 flex flex-wrap items-center gap-4"
          >
            <p className="font-['Fraunces'] text-[13px] font-light italic text-white/42">Filter</p>
            <div className="h-px min-w-[80px] flex-1 bg-white/[0.06]" />
            <div className="inline-grid overflow-hidden rounded-full border border-white/[0.08] bg-black/20 sm:grid-cols-4">
              {[
                { key: "all", label: "All published" },
                { key: "green", label: "Green lights" },
                { key: "yellow", label: "In range" },
                { key: "red", label: "Too high" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setFilter(option.key as RadarSignal | "all")}
                  className={`relative px-5 py-3 text-[11px] uppercase tracking-[0.22em] transition-all duration-300 ${
                    filter === option.key
                      ? "bg-white/[0.07] text-white"
                      : "text-white/34 hover:bg-white/[0.03] hover:text-white/62"
                  }`}
                >
                  {option.label}
                  {filter === option.key ? (
                    <motion.span
                      layoutId={`${id}-filter`}
                      className="absolute inset-x-4 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]"
                      transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[40px] border border-[rgba(92,240,255,0.24)] bg-[linear-gradient(180deg,rgba(5,12,17,0.95),rgba(4,9,15,0.9))] px-5 py-6 shadow-[0_24px_80px_rgba(1,10,16,0.42)] backdrop-blur-xl md:px-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(83,255,228,0.12),transparent_34%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,255,196,0.03),transparent_22%,transparent_78%,rgba(91,233,255,0.04))]" />
                <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-[#081019]/72 px-3 py-1.5 backdrop-blur-md">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#80fff0]" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/58">
                    {scanningLabel}
                  </span>
                </div>
                <div className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-[#081019]/72 px-3 py-1.5 backdrop-blur-md">
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/38">
                    scanner lock
                  </span>
                </div>
                <div className="absolute bottom-5 left-5 z-10 max-w-[280px] rounded-[22px] border border-white/10 bg-[#081019]/74 px-4 py-3 backdrop-blur-md">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.28em] text-white/34">
                    {publishedLabel}
                  </p>
                  <p className="text-sm leading-6 text-white/54">
                    Green, amber and red turn on automatically when a property is published against your valuation model.
                  </p>
                </div>
                <div className="relative py-6">
                  <RadarCanvas
                    items={listings}
                    selected={selected}
                    onSelect={setSelected}
                    filter={filter}
                  />
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.7, delay: 0.08 }}
                className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(11,17,26,0.88),rgba(8,12,20,0.78))] backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Radar className="h-4 w-4 text-[#77fff0]" />
                    <p className="font-['Fraunces'] text-[14px] font-light italic text-white/64">
                      {tableTitle}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                    {visible.length} live rows
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 px-5 py-4 text-sm">
                  {(["green", "yellow", "red"] as const).map((signal) => {
                    const config = SIGNAL_CONFIG[signal];
                    const Icon = config.Icon;
                    return (
                      <div
                        key={signal}
                        className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${config.color}1a`, color: config.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
                            {config.label}
                          </p>
                        </div>
                        <p className="text-[13px] leading-6 text-white/48">{config.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(11,17,26,0.9),rgba(8,12,20,0.8))] backdrop-blur-2xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-5">
                    <div>
                      <p className="mb-1 font-['Fraunces'] text-[12px] font-light italic text-white/38">
                        Selected listing
                      </p>
                      <p className="font-['Fraunces'] text-[28px] font-light leading-none tracking-tight text-white">
                        {selected.title}
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.26em] text-white/28">
                        {selected.subtitle}
                        {selected.areaLabel ? ` · ${selected.areaLabel}` : ""}
                      </p>
                    </div>

                    <div
                      className="rounded-full border px-3 py-1.5"
                      style={{
                        borderColor: `${SIGNAL_CONFIG[selected.signal].color}55`,
                        color: SIGNAL_CONFIG[selected.signal].color,
                        boxShadow: `0 0 28px ${SIGNAL_CONFIG[selected.signal].glow.replace("0.48", "0.12").replace("0.58", "0.12")}`,
                      }}
                    >
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em]">
                        {SIGNAL_CONFIG[selected.signal].label}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.26em] text-white/26">
                        Published value
                      </p>
                      <p className="font-['Fraunces'] text-[28px] font-extralight leading-none text-white">
                        <span className="mr-1 text-[0.55em] text-white/34">{currencyPrefix}</span>
                        {formatMoney(selected.listedValue, locale)}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.26em] text-white/26">
                        Model benchmark
                      </p>
                      <p
                        className="font-['Fraunces'] text-[28px] font-extralight leading-none"
                        style={{ color: SIGNAL_CONFIG[selected.signal].color }}
                      >
                        <span className="mr-1 text-[0.55em] text-white/34">{currencyPrefix}</span>
                        {formatMoney(selected.benchmarkValue, locale)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/26">
                        Publishing signal
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/52">
                        {selected.note ??
                          "The radar keeps a live semaforo based on how far the asking value sits from the model range."}
                      </p>
                    </div>
                    <p
                      className="font-mono text-[18px] tracking-[0.08em]"
                      style={{ color: SIGNAL_CONFIG[selected.signal].color }}
                    >
                      {selected.diffPct > 0 ? "+" : ""}
                      {selected.diffPct.toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              ) : null}

              <div className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(11,17,26,0.88),rgba(8,12,20,0.78))] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <p className="font-['Fraunces'] text-[14px] font-light italic text-white/64">
                    {listTitle}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                    {feedLabel}
                  </p>
                </div>

                <div className="grid grid-cols-[1.15fr_1fr_0.8fr_0.8fr_0.65fr] gap-3 border-b border-white/[0.05] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.24em] text-white/22">
                  <span>Asset</span>
                  <span>Context</span>
                  <span className="text-right">Publish</span>
                  <span className="text-right">Model</span>
                  <span className="text-right">Light</span>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {visible.map((item) => {
                    const config = SIGNAL_CONFIG[item.signal];
                    const isActive = selected?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className={`grid w-full grid-cols-[1.15fr_1fr_0.8fr_0.8fr_0.65fr] gap-3 border-b border-white/[0.03] px-5 py-3 text-[11px] transition-all hover:bg-white/[0.03] ${
                          isActive ? "bg-white/[0.05]" : ""
                        }`}
                      >
                        <span className="truncate text-left text-white/70">{item.title}</span>
                        <span className="truncate text-left text-white/34">{item.subtitle}</span>
                        <span className="text-right font-mono text-white/46">
                          {formatMoney(item.listedValue, locale)}
                        </span>
                        <span className="text-right font-mono" style={{ color: config.color }}>
                          {formatMoney(item.benchmarkValue, locale)}
                        </span>
                        <span className="text-right font-mono" style={{ color: config.color }}>
                          {item.signal.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
