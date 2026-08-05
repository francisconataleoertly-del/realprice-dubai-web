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
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -9999, y: -9999 });
  const current = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      const fine = window.matchMedia("(pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setEnabled(fine && !reduced);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      target.current.x = -9999;
      target.current.y = -9999;
      if (!raf.current) raf.current = requestAnimationFrame(tick);
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
      if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) {
        raf.current = null;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      stop();
    };
  }, [enabled, size]);

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
