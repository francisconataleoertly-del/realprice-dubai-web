"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Scroll-driven parallax backdrop. Wraps an absolute-positioned image layer
// inside a relative-positioned section so the image translates at a slower rate
// than the page scroll, creating a sense of depth.
//
// Reduced-motion aware: skips the parallax effect entirely when the OS prefers
// reduced motion.
//
// Usage:
//   <section className="relative isolate overflow-hidden">
//     <ParallaxBackdrop image="/france/lyon-skyline.jpg" speed={0.45} opacity={0.3} />
//     ... content ...
//   </section>

type Props = {
  image: string;
  speed?: number; // 0 = fixed, 1 = scrolls with page
  opacity?: number;
  position?: string;
  className?: string;
  style?: CSSProperties;
};

export default function ParallaxBackdrop({
  image,
  speed = 0.45,
  opacity = 0.32,
  position = "center",
  className = "",
  style = {},
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const ticking = useRef(false);
  const enabled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      enabled.current = false;
      return;
    }
    enabled.current = true;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      raf.current = requestAnimationFrame(update);
    };

    const update = () => {
      ticking.current = false;
      const wrapper = wrapperRef.current;
      const layer = layerRef.current;
      if (!wrapper || !layer) return;
      const rect = wrapper.getBoundingClientRect();
      const viewportH = window.innerHeight;
      // Distance from the section's centre to the viewport's centre.
      const sectionCentre = rect.top + rect.height / 2;
      const viewportCentre = viewportH / 2;
      const distance = sectionCentre - viewportCentre;
      // Translate the inverse so the image floats slower than the section.
      const offset = -distance * (1 - speed);
      layer.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.12)`;
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [speed]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={style}
    >
      <div
        ref={layerRef}
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url('${image}')`,
          backgroundPosition: position,
          opacity,
        }}
      />
    </div>
  );
}
