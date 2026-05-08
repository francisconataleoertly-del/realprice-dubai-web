"use client";

import { useEffect, useState } from "react";

type Market = "dubai" | "france";

type PublishedRow = {
  id: string;
  market: Market;
  title: string;
  zone: string | null;
  property_type: string;
  area_m2: number;
  asking_price: number;
  estimated_value: number;
  diff_pct: number;
  signal: "green" | "yellow" | "red";
  confidence_score: number;
  source_label: string | null;
  source_transactions: number | null;
  status: "draft" | "published" | "archived";
};

const initialForm = {
  market: "dubai" as Market,
  title: "",
  address: "",
  zone: "",
  property_type: "Flat",
  rooms: "1 B/R",
  area_m2: "70",
  asking_price: "",
  image_url: "",
  status: "published",
};

const signalStyle = {
  green: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  yellow: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  red: "border-red-300/25 bg-red-400/10 text-red-100",
};

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function PublishedPropertiesAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [form, setForm] = useState(initialForm);
  const [rows, setRows] = useState<PublishedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRows = async () => {
    const response = await fetch("/api/published-properties?includeDrafts=1", {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    setRows(Array.isArray(payload.rows) ? payload.rows : []);
    if (payload.detail && !payload.table_ready) setMessage(payload.detail);
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "market") {
        next.property_type = value === "france" ? "Appartement" : "Flat";
        next.rooms = value === "france" ? "2" : "1 B/R";
      }
      return next;
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/published-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          area_m2: Number(form.area_m2),
          asking_price: Number(form.asking_price),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not publish property.");

      setMessage(
        `Published: ${payload.row.title} · ${payload.row.signal.toUpperCase()} · ${payload.row.confidence_score}/100`
      );
      setForm((current) => ({
        ...initialForm,
        market: current.market,
        property_type: current.market === "france" ? "Appartement" : "Flat",
        rooms: current.market === "france" ? "2" : "1 B/R",
      }));
      await loadRows();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not publish property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
            Radar inventory
          </p>
          <p className="text-[28px] font-light tracking-[-0.03em] text-white">
            Publish properties into the radar
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
            Add a property, FonatProp estimates the benchmark, computes the gap and turns it green,
            amber or red for Dubai and France.
          </p>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
          {rows.length} stored
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-50/70">
          Log in as an admin to publish. The public radar can still read published properties.
        </div>
      )}

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-12">
        <label className="grid gap-2 lg:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Market</span>
          <select
            value={form.market}
            onChange={(event) => setField("market", event.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none"
          >
            <option value="dubai">Dubai</option>
            <option value="france">France</option>
          </select>
        </label>
        <label className="grid gap-2 lg:col-span-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Property</span>
          <input
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder={form.market === "dubai" ? "Marina Gate 1" : "Paris 15 apartment"}
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none placeholder:text-white/20"
          />
        </label>
        <label className="grid gap-2 lg:col-span-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
            {form.market === "france" ? "Commune" : "Zone / Area"}
          </span>
          <input
            value={form.zone}
            onChange={(event) => setField("zone", event.target.value)}
            placeholder={form.market === "dubai" ? "Dubai Marina" : "Paris 15"}
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none placeholder:text-white/20"
          />
        </label>
        <label className="grid gap-2 lg:col-span-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Address</span>
          <input
            value={form.address}
            onChange={(event) => setField("address", event.target.value)}
            placeholder="Optional exact address"
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none placeholder:text-white/20"
          />
        </label>

        <label className="grid gap-2 lg:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Type</span>
          <select
            value={form.property_type}
            onChange={(event) => setField("property_type", event.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none"
          >
            {form.market === "france" ? (
              <>
                <option>Appartement</option>
                <option>Maison</option>
              </>
            ) : (
              <>
                <option>Flat</option>
                <option>Villa</option>
                <option>TownHouse</option>
              </>
            )}
          </select>
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Rooms</span>
          <input
            value={form.rooms}
            onChange={(event) => setField("rooms", event.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none"
          />
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Area m2</span>
          <input
            value={form.area_m2}
            onChange={(event) => setField("area_m2", event.target.value)}
            type="number"
            min="1"
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none"
          />
        </label>
        <label className="grid gap-2 lg:col-span-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
            Asking price
          </span>
          <input
            value={form.asking_price}
            onChange={(event) => setField("asking_price", event.target.value)}
            type="number"
            min="1"
            placeholder={form.market === "dubai" ? "2200000" : "450000"}
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none placeholder:text-white/20"
          />
        </label>
        <label className="grid gap-2 lg:col-span-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Status</span>
          <select
            value={form.status}
            onChange={(event) => setField("status", event.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-[#0b0c12] px-4 text-white outline-none"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>

        <div className="lg:col-span-12 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!isAdmin || loading}
            className="rounded-2xl bg-white px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[#080910] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {loading ? "Publishing..." : "Publish to radar"}
          </button>
          {message && <p className="text-sm text-emerald-100/70">{message}</p>}
          {error && <p className="text-sm text-red-200/75">{error}</p>}
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-[24px] border border-white/[0.08]">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.55fr] gap-3 border-b border-white/[0.06] bg-white/[0.03] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/28">
          <span>Property</span>
          <span>Market</span>
          <span className="text-right">Ask</span>
          <span className="text-right">Benchmark</span>
          <span className="text-right">Signal</span>
        </div>
        {rows.slice(0, 8).map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.55fr] gap-3 border-b border-white/[0.04] px-4 py-3 text-xs last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-white/72">{row.title}</p>
              <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-white/26">
                {row.zone || "No zone"} · {row.confidence_score}/100
              </p>
            </div>
            <span className="font-mono uppercase text-white/38">{row.market}</span>
            <span className="text-right font-mono text-white/50">{money.format(row.asking_price)}</span>
            <span className="text-right font-mono text-white/50">{money.format(row.estimated_value)}</span>
            <span className="text-right">
              <span className={`rounded-full border px-2 py-1 font-mono text-[9px] uppercase ${signalStyle[row.signal]}`}>
                {row.signal}
              </span>
            </span>
          </div>
        ))}
        {!rows.length && (
          <div className="px-4 py-8 text-sm text-white/42">
            No properties yet. Publish the first one and the radar will use it automatically.
          </div>
        )}
      </div>
    </div>
  );
}
