"use client";

import { type CSSProperties } from "react";

// Subtle film-grain noise layer. SVG-based fractal noise (no image asset, no
// external request) layered on top of dark surfaces to break up flat colour
// banding and add a premium editorial texture.
//
// Usage:
//   <section className="relative isolate">
//     <NoiseTexture intensity={0.06} />
//     ...
//   </section>

type Props = {
  intensity?: number; // 0 - 0.2 typical, higher = more visible grain
  blend?: "overlay" | "soft-light" | "screen" | "multiply";
  className?: string;
  style?: CSSProperties;
};

const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
  <filter id='n' x='0' y='0'>
    <feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' seed='3' stitchTiles='stitch'/>
    <feColorMatrix type='matrix' values='0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.5 0'/>
  </filter>
  <rect width='200' height='200' filter='url(%23n)' opacity='0.55'/>
</svg>`;

const NOISE_DATA_URI = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`;

export default function NoiseTexture({
  intensity = 0.06,
  blend = "overlay",
  className = "",
  style = {},
}: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: NOISE_DATA_URI,
        backgroundSize: "200px 200px",
        backgroundRepeat: "repeat",
        opacity: intensity,
        mixBlendMode: blend,
        ...style,
      }}
    />
  );
}
