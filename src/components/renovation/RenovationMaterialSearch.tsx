"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import {
  formatMaterialPrice,
  RENOVATION_MATERIALS,
  type RenovationMarket,
} from "@/data/renovation-materials";

const marketLabels: Record<RenovationMarket, string> = {
  dubai: "Dubai",
  france: "France",
};

const roomLabels: Record<string, string> = {
  all: "All rooms",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  flooring: "Floors",
  walls: "Walls",
  doors: "Doors",
  windows: "Windows",
  pool: "Pool",
  mep: "MEP",
  whole_home: "Whole home",
};

export default function RenovationMaterialSearch({
  market,
  title = "Search real renovation materials.",
  description = "Seed catalog with real supplier names, prices, units and source links. This is the structure we can grow into a live procurement database.",
}: {
  market: RenovationMarket;
  title?: string;
  description?: string;
}) {
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("all");
  const [tier, setTier] = useState("all");

  const marketItems = useMemo(
    () => RENOVATION_MATERIALS.filter((item) => item.market === market),
    [market],
  );

  const rooms = useMemo(
    () => ["all", ...Array.from(new Set(marketItems.map((item) => item.room))).sort()],
    [marketItems],
  );

  const tiers = useMemo(
    () => ["all", ...Array.from(new Set(marketItems.map((item) => item.tier))).sort()],
    [marketItems],
  );

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return marketItems.filter((item) => {
      const matchesRoom = room === "all" || item.room === room;
      const matchesTier = tier === "all" || item.tier === tier;
      const haystack = [
        item.name,
        item.category,
        item.supplier,
        item.notes,
        ...item.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return matchesRoom && matchesTier && (!normalized || haystack.includes(normalized));
    });
  }, [marketItems, query, room, tier]);

  const cheapest = results.reduce<number | null>(
    (min, item) => (min === null ? item.priceLow : Math.min(min, item.priceLow)),
    null,
  );

  return (
    <section className="mt-14 border-y border-white/[0.06] bg-[#05060a]/88 px-0 py-10">
      <div className="mb-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-blue-200/55">
            Material database / {marketLabels[market]}
          </p>
          <h3 className="mt-4 max-w-3xl font-['Fraunces'] text-[clamp(2rem,4vw,3.4rem)] font-light leading-[0.98] tracking-[-0.055em] text-white">
            {title}
          </h3>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-white/52 lg:justify-self-end">
          {description}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tile, shower, pool, paint, mixer..."
            className="h-12 w-full border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition focus:border-blue-200/45"
          />
        </label>
        <select
          value={room}
          onChange={(event) => setRoom(event.target.value)}
          className="h-12 border border-white/10 bg-[#0b0d14] px-4 text-sm text-white outline-none transition focus:border-blue-200/45"
        >
          {rooms.map((value) => (
            <option key={value} value={value} className="bg-[#0b0d14]">
              {roomLabels[value] ?? value}
            </option>
          ))}
        </select>
        <select
          value={tier}
          onChange={(event) => setTier(event.target.value)}
          className="h-12 border border-white/10 bg-[#0b0d14] px-4 text-sm capitalize text-white outline-none transition focus:border-blue-200/45"
        >
          {tiers.map((value) => (
            <option key={value} value={value} className="bg-[#0b0d14]">
              {value === "all" ? "All tiers" : value}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/32">
        <span>{results.length} materials</span>
        <span className="h-1 w-1 rounded-full bg-white/24" />
        <span>{marketItems.length} seed records</span>
        {cheapest !== null ? (
          <>
            <span className="h-1 w-1 rounded-full bg-white/24" />
            <span>Starts at {market === "france" ? "EUR" : "AED"} {cheapest.toLocaleString()}</span>
          </>
        ) : null}
      </div>

      <div className="mt-8 grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.07] md:grid-cols-2 xl:grid-cols-3">
        {results.slice(0, 18).map((item) => (
          <article key={item.id} className="min-h-[250px] bg-[#0a0a0f] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-blue-200/55">
                  {roomLabels[item.room] ?? item.room} / {item.category}
                </p>
                <h4 className="mt-3 text-[18px] font-medium leading-6 tracking-[-0.035em] text-white">
                  {item.name}
                </h4>
              </div>
              <span className="border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/44">
                {item.tier}
              </span>
            </div>
            <p className="font-mono text-[20px] text-white">
              {formatMaterialPrice(item)}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/48">{item.notes}</p>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/26">
                  Supplier
                </p>
                <p className="mt-1 text-xs text-white/54">{item.supplier}</p>
              </div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/48 transition hover:border-white/28 hover:text-white"
              >
                Source
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {results.length > 18 ? (
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">
          Showing first 18 results. Narrow the search to inspect the rest.
        </p>
      ) : null}
    </section>
  );
}
