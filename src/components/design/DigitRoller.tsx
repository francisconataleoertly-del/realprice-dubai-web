"use client";

import { useEffect, useRef, useState } from "react";

// Slot-machine number animation. When the value changes, each digit rolls
// vertically through 0-9 to land on the new digit. Used for live numbers that
// change in response to user input (estimate, cash flow, sensitivity cells).
//
// Pure CSS transforms, no JS animation loop — uses transition: transform.
// Reduced-motion replaces the roll with an instant snap.

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: "int" | "decimal" | "compact";
  duration?: number; // ms per digit roll
  className?: string;
};

function formatValue(v: number, format: "int" | "decimal" | "compact", decimals: number): string {
  if (format === "compact") {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(decimals || 1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(0);
  }
  if (format === "decimal") return v.toFixed(decimals);
  return Math.round(v).toLocaleString("fr-FR");
}

const DIGITS = "0123456789".split("");

export default function DigitRoller({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  format = "int",
  duration = 600,
  className = "",
}: Props) {
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);
  const renderedRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  const formatted = formatValue(value, format, decimals);
  // Server + initial client render: just emit the formatted text. Once mounted,
  // we can switch to the rolling tape. Avoids hydration mismatch.
  if (!mounted || reduced) {
    renderedRef.current = formatted;
    return (
      <span className={className}>
        {prefix}
        {formatted}
        {suffix}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {prefix}
      <span className="inline-flex">
        {formatted.split("").map((char, i) => {
          if (!/^\d$/.test(char)) {
            // Separator: no roll
            return (
              <span key={`s-${i}-${char}`} className="inline-block">
                {char}
              </span>
            );
          }
          const target = Number(char);
          return (
            <span
              key={`d-${i}`}
              className="relative inline-block overflow-hidden align-baseline"
              style={{ width: "0.62em", height: "1em", lineHeight: 1 }}
            >
              <span
                className="absolute left-0 top-0 flex flex-col"
                style={{
                  transform: `translateY(-${target * 100}%)`,
                  transition: `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
              >
                {DIGITS.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center justify-center"
                    style={{ height: "1em", lineHeight: 1 }}
                  >
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      {suffix}
    </span>
  );
}
