"use client";

import { type CSSProperties } from "react";

// Shimmer loading skeleton primitive.
// Uses the keyframe `fonatprop-shimmer` defined in globals.css.
// Intended for: comparables tables, ADEME lookups, matrix recompute, anywhere
// the user is waiting on async data.

type Variant = "text" | "bar" | "card" | "row" | "circle";

type Props = {
  variant?: Variant;
  width?: number | string;
  height?: number | string;
  rows?: number;
  className?: string;
  style?: CSSProperties;
};

const baseClass =
  "fonatprop-shimmer relative overflow-hidden rounded-md bg-white/[0.04]";

export default function ShimmerSkeleton({
  variant = "bar",
  width,
  height,
  rows = 1,
  className = "",
  style = {},
}: Props) {
  const dims: CSSProperties = { width, height, ...style };

  if (variant === "circle") {
    return (
      <div
        className={`${baseClass} rounded-full ${className}`}
        style={{
          width: dims.width ?? 32,
          height: dims.height ?? 32,
          ...style,
        }}
      />
    );
  }

  if (variant === "card") {
    return (
      <div className={`${baseClass} ${className}`} style={dims}>
        <div className="space-y-3 p-4">
          <div className={`${baseClass} h-3 w-2/3`} />
          <div className={`${baseClass} h-2 w-full`} />
          <div className={`${baseClass} h-2 w-5/6`} />
          <div className={`${baseClass} h-2 w-4/6`} />
        </div>
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} h-3`}
            style={{ width: `${100 - i * 9}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <span
        className={`${baseClass} inline-block align-middle ${className}`}
        style={{ width: width ?? "8ch", height: height ?? "0.85em" }}
      />
    );
  }

  return <div className={`${baseClass} ${className}`} style={dims} />;
}
