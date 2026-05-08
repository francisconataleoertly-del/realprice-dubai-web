"use client";

import { useEffect, useRef, type ReactNode } from "react";

// 3D tilt card. Tracks mouse within the wrapper bounds and tilts the inner
// surface up to ±maxTilt degrees on the X/Y axes, plus a small "lift" via
// translateZ. Releases smoothly on mouse-out.
//
// Pure transform — no layout shift, no JS layout calc per frame, no library.
// Disabled on touch + reduced-motion.

type Props = {
  children: ReactNode;
  maxTilt?: number;
  perspective?: number;
  lift?: number;
  className?: string;
  innerClassName?: string;
};

export default function TiltCard({
  children,
  maxTilt = 6,
  perspective = 900,
  lift = 8,
  className = "",
  innerClassName = "",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const enabled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    enabled.current = true;

    const wrap = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 2 * maxTilt;
      const ry = (px - 0.5) * 2 * maxTilt;
      inner.style.transform = `perspective(${perspective}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(${lift}px)`;
    };
    const onLeave = () => {
      inner.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [maxTilt, perspective, lift]);

  return (
    <div ref={wrapperRef} className={className} style={{ perspective: `${perspective}px` }}>
      <div
        ref={innerRef}
        className={`will-change-transform transition-transform duration-300 ease-out ${innerClassName}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </div>
  );
}
