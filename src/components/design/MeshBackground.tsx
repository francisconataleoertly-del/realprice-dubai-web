"use client";

import { type CSSProperties } from "react";

// Animated radial gradient mesh background. Three colour blobs drift slowly to
// create a Vercel/Linear/Stripe-style ambient depth layer. Pure CSS — no canvas,
// no JS animation loop — so it stays cheap on the GPU and the render thread.
//
// Mount as an absolute-positioned overlay inside any relative section.

type Tone = "blue" | "violet" | "warm" | "ember";

const PALETTES: Record<Tone, { a: string; b: string; c: string }> = {
  blue: {
    a: "rgba(59, 130, 246, 0.30)",
    b: "rgba(99, 102, 241, 0.22)",
    c: "rgba(14, 165, 233, 0.20)",
  },
  violet: {
    a: "rgba(139, 92, 246, 0.30)",
    b: "rgba(217, 70, 239, 0.18)",
    c: "rgba(59, 130, 246, 0.20)",
  },
  warm: {
    a: "rgba(244, 114, 182, 0.22)",
    b: "rgba(251, 191, 36, 0.18)",
    c: "rgba(244, 63, 94, 0.18)",
  },
  ember: {
    a: "rgba(251, 113, 133, 0.22)",
    b: "rgba(245, 158, 11, 0.18)",
    c: "rgba(239, 68, 68, 0.18)",
  },
};

type Props = {
  tone?: Tone;
  intensity?: number; // 0–1 — multiplies opacity
  className?: string;
  style?: CSSProperties;
};

export default function MeshBackground({
  tone = "blue",
  intensity = 1,
  className = "",
  style = {},
}: Props) {
  const palette = PALETTES[tone];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ ...style, opacity: intensity }}
    >
      <div
        className="fonatprop-mesh-blob fonatprop-mesh-blob-a"
        style={{ background: palette.a }}
      />
      <div
        className="fonatprop-mesh-blob fonatprop-mesh-blob-b"
        style={{ background: palette.b }}
      />
      <div
        className="fonatprop-mesh-blob fonatprop-mesh-blob-c"
        style={{ background: palette.c }}
      />
    </div>
  );
}
