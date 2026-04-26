"use client";

import { useEffect, useState, useCallback } from "react";

import FonatPropLogo from "@/components/brand/FonatPropLogo";

// ── EDIT THIS ARRAY to change hero images ──────────────────────────
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

const INTERVAL = 5000;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(idx);
      setTimeout(() => setIsTransitioning(false), 800);
    },
    [isTransitioning]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % SLIDES.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [current, goTo]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Slides */}
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out bg-cover bg-center"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
        <FonatPropLogo
          variant="lockup"
          className="mb-8 h-auto w-full max-w-[380px] rounded-2xl opacity-90 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
          priority
        />
        <h1 className="text-[clamp(2rem,5vw,4.2rem)] leading-[1.08] font-light tracking-tight text-white max-w-3xl mb-4">
          Want to know how much your property is worth?
        </h1>
        <p className="text-white/60 text-base md:text-lg mb-10 max-w-xl">
          AI-powered property valuation for Dubai real estate
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/register"
            className="px-10 py-3.5 bg-white text-[#0a0a0f] text-sm tracking-[0.18em] uppercase font-medium rounded-sm hover:bg-neutral-200 transition-colors duration-300"
          >
            Sign Up
          </a>
          <a
            href="/login"
            className="px-10 py-3.5 border border-white/60 text-white text-sm tracking-[0.18em] uppercase font-medium rounded-sm hover:bg-white hover:text-[#0a0a0f] transition-colors duration-300"
          >
            Log In
          </a>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-white w-6"
                : "bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
