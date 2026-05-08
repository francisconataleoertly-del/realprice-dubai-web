"use client";

import { useEffect, useState } from "react";

import ShimmerSkeleton from "@/components/design/ShimmerSkeleton";
import DigitRoller from "@/components/design/DigitRoller";

type ComparableRecord = {
  d: string;
  v: number;
  s: number;
  p: number;
  r: number | null;
  t: string;
  a: string;
  c: string;
  cp: string;
  cd: string;
  la: number;
  lo: number;
};

type ComparablesResponse = {
  postcode: string;
  type: string | null;
  surface: number | null;
  generated_at: string;
  total_in_postcode: number;
  filtered_count: number;
  median_price_per_m2: number | null;
  median_value_eur: number | null;
  records: ComparableRecord[];
};

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const dateFr = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

type Props = {
  postcode: string | null;
  propertyType: string;
  surface: number;
  estimatePerM2?: number;
};

export default function FranceComparablesPanel({
  postcode,
  propertyType,
  surface,
  estimatePerM2,
}: Props) {
  const [data, setData] = useState<ComparablesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postcode || !/^\d{5}$/.test(postcode)) {
      setData(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(
      `/api/france/comparables?postcode=${postcode}&type=${encodeURIComponent(
        propertyType,
      )}&surface=${Math.round(surface)}&limit=8`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json() as Promise<ComparablesResponse>;
      })
      .then((json) => setData(json))
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setData(null);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [postcode, propertyType, surface]);

  if (!postcode) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0b0d14] p-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
        Pick an address to load DVF comparables in the same postcode.
      </div>
    );
  }

  const refPerM2 = data?.median_price_per_m2 ?? null;
  const estimateDelta =
    estimatePerM2 && refPerM2
      ? ((estimatePerM2 - refPerM2) / refPerM2) * 100
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0f] backdrop-blur-2xl">
      <div className="flex flex-col items-start justify-between gap-2 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-blue-200/70">
            Comparables DVF · postcode {postcode}
          </p>
          <p className="mt-1 font-['Fraunces'] text-[15px] font-light italic text-white/60">
            Recent sales near this address (DGFiP DVF, 2024+)
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
          {loading ? (
            <>
              <ShimmerSkeleton variant="circle" width={10} height={10} />
              <ShimmerSkeleton variant="text" width={120} />
            </>
          ) : data ? (
            <span>
              {data.filtered_count} matches · median{" "}
              <span className="text-white/80">
                {data.median_price_per_m2 ? (
                  <DigitRoller
                    value={data.median_price_per_m2}
                    suffix=" EUR/m²"
                    duration={550}
                  />
                ) : (
                  <>— EUR/m²</>
                )}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      {estimateDelta !== null && data && data.records.length > 0 ? (
        <div className="border-b border-white/[0.06] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
          Your estimate vs DVF median:{" "}
          <span
            className={
              estimateDelta > 5
                ? "text-amber-300"
                : estimateDelta < -5
                  ? "text-emerald-300"
                  : "text-white/80"
            }
          >
            {estimateDelta > 0 ? "+" : ""}
            {estimateDelta.toFixed(1)}%
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="px-5 py-6 font-mono text-[10px] uppercase tracking-[0.22em] text-red-300">
          {error}
        </div>
      ) : loading ? (
        <div className="space-y-2 px-5 py-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="grid grid-cols-7 items-center gap-3 border-b border-white/[0.02] py-2"
            >
              <ShimmerSkeleton width="80%" height={10} />
              <div className="col-span-2">
                <ShimmerSkeleton variant="row" rows={2} />
              </div>
              <ShimmerSkeleton width="60%" height={10} />
              <ShimmerSkeleton width="50%" height={10} />
              <ShimmerSkeleton width="70%" height={10} />
              <ShimmerSkeleton width="80%" height={10} />
            </div>
          ))}
        </div>
      ) : data && data.records.length === 0 ? (
        <div className="px-5 py-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
          No DVF comparables found for postcode {postcode} ({propertyType}).
        </div>
      ) : data && data.records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.04] text-left font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Surface</th>
                <th className="px-4 py-2 text-right">Rooms</th>
                <th className="px-4 py-2 text-right">EUR/m²</th>
                <th className="px-4 py-2 text-right">Sale</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((rec, i) => {
                const isClose =
                  surface > 0 && Math.abs(rec.s - surface) / surface < 0.15;
                return (
                  <tr
                    key={`${rec.d}-${rec.a}-${i}`}
                    className={`border-b border-white/[0.02] transition-colors ${
                      isClose ? "bg-blue-500/[0.04]" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                      {dateFr(rec.d)}
                    </td>
                    <td className="px-4 py-2.5 text-white/65">
                      <div className="truncate text-[12px]">{rec.a || "—"}</div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                        {rec.c}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {rec.t}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-white/55">
                      {rec.s.toFixed(0)} m²
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-white/45">
                      {rec.r ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-white/85">
                      {eur(rec.p)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-white/85">
                      {eur(rec.v)} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="border-t border-white/[0.06] px-5 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/25">
        Source: DGFiP DVF via Etalab · postcode-level join, 2024 transactions
      </div>
    </div>
  );
}
