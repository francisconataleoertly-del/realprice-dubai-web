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
      {/* Slides with Ken Burns */}
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              animation: i === current ? "kenburns 12s ease-in-out infinite alternate" : "none",
            }}
          />
        </div>
      ))}

      {/* Cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#0a0a0f] z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-10" />
      <div className="absolute inset-0 z-10" style={{ background: "radial-gradient(ellipse at 30% 50%, transparent 0%, rgba(10,10,15,0.35) 80%)" }} />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-start justify-center px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="max-w-4xl">

          {/* Serif editorial headline */}
          <h1 className="font-['Fraunces'] font-light tracking-[-0.02em] leading-[0.95] text-white mb-10">
            <span className="block text-[clamp(3.2rem,9vw,8rem)]">Know the</span>
            <span className="block text-[clamp(3.2rem,9vw,8rem)] italic font-extralight text-white/40">
              true value.
            </span>
          </h1>

          {/* Refined tagline — no blue highlights, elegant prose */}
          <p className="font-['Inter'] text-[clamp(1rem,1.25vw,1.2rem)] text-white/55 font-light leading-[1.7] max-w-xl mb-12">
            A market intelligence platform trained on a decade of Dubai real estate.
            Instant valuations, live opportunities, and cost analytics
            &mdash; designed for serious investors.
          </p>

          {/* Premium buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/login?mode=signup&next=/app"
              className="group relative inline-flex items-center gap-4 px-10 py-4 bg-white text-[#0a0a0f] text-[11px] tracking-[0.3em] uppercase font-medium rounded-none hover:bg-white/90 transition-all duration-500"
            >
              <span>Create Account</span>
              <span className="transition-transform duration-500 group-hover:translate-x-1.5">
                &rarr;
              </span>
            </a>
            <a
              href="/login?next=/app"
              className="inline-flex items-center gap-3 px-10 py-4 text-white/80 text-[11px] tracking-[0.3em] uppercase font-medium hover:text-white transition-all duration-500 border-b border-white/20 hover:border-white/60"
            >
              <span>Log In</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom frame — centered dots + scroll indicator */}
      <div className="absolute bottom-10 left-6 md:left-12 lg:left-24 right-6 md:right-12 lg:right-24 z-20 flex items-end justify-between">
        <div className="flex-1" />
        {/* Center dots */}
        <div className="hidden md:flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-[2px] rounded-full transition-all duration-500 ${
                i === current ? "bg-white w-10" : "bg-white/15 w-4 hover:bg-white/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">
            Scroll
          </span>
          <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1.5%, -1%); }
        }
      `}</style>
    </section>
  );
}
