"use client";

import { useEffect, useRef } from "react";

// Top-of-viewport scroll progress bar. A thin sticky line whose width fills
// from 0% to 100% as the user scrolls through the document. Vanilla scroll
// listener throttled via requestAnimationFrame, no library, no layout reads
// per frame beyond a single document.scrollTop / scrollHeight calculation.
//
// Reduced-motion: still fills (the user wants to know progress) but without
// the smooth easing transition.

type Props = {
  height?: number;
  gradient?: string;
  className?: string;
};

const DEFAULT_GRADIENT =
  "linear-gradient(90deg, #60a5fa 0%, #a78bfa 45%, #f5d6a3 100%)";

export default function ScrollProgress({
  height = 2,
  gradient = DEFAULT_GRADIENT,
  className = "",
}: Props) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf: number | null = null;
    let ticking = false;

    const update = () => {
      ticking = false;
      const el = fillRef.current;
      if (!el) return;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / docH));
      el.style.transform = `scaleX(${pct.toFixed(4)})`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[80] print:hidden ${className}`}
      style={{ height }}
    >
      <div
        ref={fillRef}
        className="will-change-transform"
        style={{
          height: "100%",
          width: "100%",
          background: gradient,
          transformOrigin: "left",
          transform: "scaleX(0)",
          boxShadow: "0 0 18px rgba(99, 154, 255, 0.45)",
        }}
      />
    </div>
  );
}
