"use client";

import { useEffect, useRef, useState } from "react";

// Cursor-following glow. Renders a fixed-position blurred radial gradient that
// follows the user's mouse on pointer-fine devices (so it stays out of the way
// on touch screens). Uses requestAnimationFrame + lerp so it trails smoothly
// rather than snapping.
//
// Mount once near the root of a page. It is purely decorative (pointer-events:
// none, aria-hidden) and never blocks interactions.

type Props = {
  size?: number;
  color?: string;
  blur?: number;
  intensity?: number; // 0–1
  className?: string;
};

export default function CursorGlow({
  size = 540,
  color = "rgba(99, 154, 255, 0.18)",
  blur = 110,
  intensity = 0.85,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -9999, y: -9999 });
  const current = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    const onLeave = () => {
      target.current.x = -9999;
      target.current.y = -9999;
    };

    const tick = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * 0.18;
      current.current.y += dy * 0.18;
      const el = ref.current;
      if (el) {
        el.style.transform = `translate3d(${current.current.x - size / 2}px, ${current.current.y - size / 2}px, 0)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [size]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none fixed left-0 top-0 z-[5] mix-blend-screen ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at center, ${color}, transparent 65%)`,
        filter: `blur(${blur}px)`,
        opacity: intensity,
        willChange: "transform",
      }}
    />
  );
}
