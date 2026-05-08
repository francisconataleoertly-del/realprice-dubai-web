"use client";

import { useEffect, useState } from "react";

// Rolling marquee of real DVF transactions from the comparables API. Bottom-of-page
// "live ticker" feel — Bloomberg/Robinhood — without making a real-time stream.
// Pulls a small recent slice from /api/france/comparables and infinitely scrolls it.
//
// Pause on hover. Reduced-motion freezes the marquee.

type Record = {
  d: string;
  v: number;
  s: number;
  p: number;
  t: string;
  a: string;
  c: string;
  cp: string;
};

type ComparablesResponse = {
  postcode: string;
  records: Record[];
};

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

// Postcodes covering a spread of the French market — Paris, Lyon, Marseille,
// Bordeaux, Nice, Lille, Toulouse, Nantes — so the ticker reads as national.
const SAMPLE_POSTCODES = [
  "75015",
  "69003",
  "13008",
  "33000",
  "06000",
  "59000",
  "31000",
  "44000",
];

function dateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function priceColour(p: number) {
  if (p >= 8000) return "#fb7185"; // rose
  if (p >= 5000) return "#fbbf24"; // amber
  if (p >= 3000) return "#7dd3fc"; // sky
  return "#34d399"; // emerald
}

export default function DvfLiveTicker() {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    // Fetch a few postcodes in parallel and merge a representative sample.
    const controllers = SAMPLE_POSTCODES.map(() => new AbortController());
    Promise.allSettled(
      SAMPLE_POSTCODES.map((cp, i) =>
        fetch(`/api/france/comparables?postcode=${cp}&limit=5`, {
          signal: controllers[i].signal,
        })
          .then((r) => (r.ok ? (r.json() as Promise<ComparablesResponse>) : null))
          .catch(() => null),
      ),
    ).then((results) => {
      const merged: Record[] = [];
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value?.records) {
          merged.push(...res.value.records);
        }
      });
      // Shuffle + cap so the marquee isn't grouped by postcode.
      const shuffled = merged
        .map((r) => ({ r, k: Math.random() }))
        .sort((a, b) => a.k - b.k)
        .map((x) => x.r)
        .slice(0, 30);
      setRecords(shuffled);
    });
    return () => controllers.forEach((c) => c.abort());
  }, []);

  if (records.length === 0) return null;

  // Duplicate the array so the CSS marquee keyframe can wrap seamlessly.
  const reel = [...records, ...records];

  return (
    <div
      aria-hidden
      className="dvf-ticker print:hidden relative overflow-hidden border-y border-white/[0.06] bg-[#06070d]/85 backdrop-blur-2xl"
    >
      <div className="dvf-ticker-fade absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#06070d] to-transparent" />
      <div className="dvf-ticker-fade absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#06070d] to-transparent" />

      <div className="flex items-center gap-3 px-4 py-3">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-emerald-200/80">
          DVF Live
        </span>
        <span className="h-3 w-px bg-white/15" />
        <div className="dvf-ticker-track flex flex-1 gap-7 whitespace-nowrap">
          {reel.map((r, i) => {
            const colour = priceColour(r.p);
            return (
              <span
                key={`${r.d}-${r.cp}-${i}`}
                className="flex shrink-0 items-baseline gap-2 text-[12px] text-white/65"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                  {dateLabel(r.d)}
                </span>
                <span className="text-white/55">·</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">
                  {r.cp}
                </span>
                <span className="text-white/55">·</span>
                <span className="text-white/80">
                  {r.t === "Maison" ? "Maison" : "Appt"}{" "}
                  <span className="font-mono text-white/40">{r.s.toFixed(0)}m²</span>
                </span>
                <span className="text-white/55">·</span>
                <span className="font-mono text-[12px]" style={{ color: colour }}>
                  {eur(r.p)} €/m²
                </span>
                <span className="text-white/35">·</span>
                <span className="font-mono text-[11px] text-white/65">
                  {eur(r.v)} €
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
