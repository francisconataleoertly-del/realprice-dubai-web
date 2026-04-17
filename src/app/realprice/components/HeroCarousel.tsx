"use client";

import { useEffect, useState, useCallback } from "react";

const SLIDES = [
  "/dubai-slides/01-marina-skyline.jpg",
  "/dubai-slides/02-burj-khalifa.jpg",
  "/dubai-slides/03-burj-al-arab.jpg",
  "/dubai-slides/04-marina-night.jpg",
  "/dubai-slides/05-downtown-night.jpg",
  "/dubai-slides/06-sunset-silhouette.jpg",
  "/dubai-slides/07-marina-aerial.jpg",
  "/dubai-slides/08-camels-desert.jpg",
  "/dubai-slides/09-palm-aerial.jpg",
  "/dubai-slides/10-golf-skyline.jpg",
];

const INTERVAL = 6000;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((idx: number) => setCurrent(idx), []);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Slides with Ken Burns zoom */}
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              animation: i === current ? "kenburns 10s ease-in-out infinite alternate" : "none",
            }}
          />
        </div>
      ))}

      {/* Cinematic multi-layer overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-[#0a0a0f] z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/15 z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.45)_100%)] z-10" />

      {/* Top indicator bar */}
      <div className="absolute top-24 left-6 md:left-12 lg:left-24 right-6 md:right-12 lg:right-24 z-20 flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/40">REAL ESTATE INTELLIGENCE</span>
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/40 hidden md:block">DUBAI &bull; EST. 2026</span>
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-start justify-center px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/60">AI-Powered Valuation</span>
          </div>

          <h1 className="font-extralight tracking-[-0.04em] leading-[0.9] text-white mb-8">
            <span className="block text-[clamp(3rem,8vw,6.5rem)]">Know the</span>
            <span className="block text-[clamp(3rem,8vw,6.5rem)] bg-gradient-to-r from-white via-white/90 to-white/30 bg-clip-text text-transparent">
              real price.
            </span>
          </h1>

          <p className="text-[clamp(1rem,1.2vw,1.15rem)] text-white/60 font-light leading-relaxed max-w-xl mb-10">
            Instant property estimates backed by{" "}
            <span className="font-mono text-[#3b82f6]">234K transactions</span>,{" "}
            <span className="font-mono text-[#3b82f6]">110 zones</span>, and an AI model with{" "}
            <span className="font-mono text-[#3b82f6]">R&sup2; 0.889</span> accuracy.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/register"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0a0a0f] text-[12px] tracking-[0.2em] uppercase font-medium rounded-full hover:bg-white/90 transition-all duration-500"
            >
              <span>Get Started</span>
              <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </a>
            <a
              href="#valorar"
              className="inline-flex items-center gap-3 px-8 py-4 border border-white/20 text-white text-[12px] tracking-[0.2em] uppercase font-medium rounded-full hover:border-white/40 hover:bg-white/5 transition-all duration-500"
            >
              <span>Explore Platform</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-8 left-6 md:left-12 lg:left-24 right-6 md:right-12 lg:right-24 z-20 flex items-end justify-between">
        {/* Slide counter */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-white/40 tabular-nums">{String(current + 1).padStart(2, "0")}</span>
          <div className="w-24 h-px bg-white/10" />
          <span className="font-mono text-[11px] text-white/20 tabular-nums">{String(SLIDES.length).padStart(2, "0")}</span>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2 text-white/30 animate-pulse">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </div>

      {/* Dot navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === current ? "bg-white w-8" : "bg-white/20 w-1 hover:bg-white/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-2%, -1%); }
        }
      `}</style>
    </section>
  );
}
