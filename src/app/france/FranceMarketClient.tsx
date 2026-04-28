"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Database,
  Euro,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import marketData from "@/data/france-dvf-market.json";

type PropertyType = "Appartement" | "Maison";

type CommuneRecord = {
  commune: string;
  commune_code: string;
  department_code: string;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
  volume_rank: number;
};

type YearRecord = {
  year: number;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
};

const communeRows = marketData.by_commune as CommuneRecord[];
const yearRows = marketData.by_year as YearRecord[];

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("fr-FR");

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function confidencePct(transactions: number) {
  if (transactions >= 10_000) return 0.1;
  if (transactions >= 3_000) return 0.12;
  if (transactions >= 800) return 0.15;
  return 0.2;
}

function latestTypeMedian(type: PropertyType) {
  const rows = yearRows
    .filter((row) => row.property_type === type)
    .sort((a, b) => b.year - a.year);
  return rows[0]?.median_price_per_m2 ?? marketData.coverage.median_price_per_m2;
}

function estimateValue(record: CommuneRecord | undefined, type: PropertyType, area: number, rooms: number) {
  const psm = record?.median_price_per_m2 ?? latestTypeMedian(type);
  const base = psm * area;
  const roomSignal = rooms > 0 && area > 0 ? area / Math.max(rooms, 1) : 24;
  const layoutAdjustment =
    type === "Appartement"
      ? roomSignal < 16
        ? -0.04
        : roomSignal > 34
          ? 0.04
          : 0
      : roomSignal < 22
        ? -0.03
        : roomSignal > 48
          ? 0.04
          : 0;
  return Math.round(base * (1 + layoutAdjustment));
}

export default function FranceMarketClient() {
  const [propertyType, setPropertyType] = useState<PropertyType>("Appartement");
  const [commune, setCommune] = useState("Paris 15");
  const [area, setArea] = useState(62);
  const [rooms, setRooms] = useState(3);

  const communeOptions = communeRows
    .filter((row) => row.property_type === propertyType)
    .slice(0, 900);

  const selectedRecord =
    communeRows.find(
      (row) => row.commune === commune && row.property_type === propertyType,
    ) ?? communeOptions[0];

  const estimate = estimateValue(selectedRecord, propertyType, area, rooms);
  const pct = confidencePct(selectedRecord?.transactions ?? 0);
  const low = Math.round(estimate * (1 - pct));
  const high = Math.round(estimate * (1 + pct));
  const latestYear = marketData.coverage.max_year;
  const yearTrend = yearRows.filter((row) => row.property_type === propertyType);
  const maxPsm = Math.max(...yearTrend.map((row) => row.median_price_per_m2));

  const featured = (marketData.featured as CommuneRecord[])
    .filter((row) => row.property_type === propertyType)
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-[#06070b] text-white">
      <section className="relative isolate min-h-[100svh] overflow-hidden px-5 py-6 md:px-10 lg:px-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/france/eiffel-tower-night.jpg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,7,11,0.94),rgba(6,7,11,0.64)_46%,rgba(6,7,11,0.22))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(59,130,246,0.22),transparent_34%)]" />

        <nav className="relative z-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/fonatprop-final-icon.webp"
              alt="FonatProp"
              width={48}
              height={48}
              className="h-11 w-11 rounded-full border border-white/12 object-cover shadow-[0_0_28px_rgba(59,130,246,0.16)]"
              priority
            />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-white/38">
                Market I / Europe
              </p>
              <p className="text-sm font-medium tracking-[-0.02em] text-white">
                FonatProp France
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/24 p-1 backdrop-blur-xl md:flex">
            {["Valuation", "Market", "Data"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/58 transition hover:bg-white/10 hover:text-white"
              >
                {item}
              </a>
            ))}
            <Link
              href="/fonatprop"
              className="rounded-full bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#06070b]"
            >
              Dubai
            </Link>
          </div>
        </nav>

        <div className="relative z-10 grid min-h-[calc(100svh-88px)] items-center gap-10 pt-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.38em] text-white/42">
              DVF intelligence / separate France engine
            </p>
            <h1 className="max-w-4xl font-['Fraunces'] text-[clamp(4rem,9vw,9.5rem)] font-light leading-[0.84] tracking-[-0.08em]">
              Know the French value.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-9 text-white/68">
              A dedicated France surface powered by official DVF transactions.
              Same FonatProp standard, separate data model, separate market logic.
            </p>
            <div className="mt-10 grid max-w-3xl grid-cols-3 gap-3">
              {[
                [formatCompact(marketData.coverage.clean_rows), "clean residential rows"],
                [String(marketData.coverage.departments), "departments"],
                [`${marketData.coverage.min_year}-${marketData.coverage.max_year}`, "DVF window"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl"
                >
                  <p className="font-['Fraunces'] text-3xl text-white">{value}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/38">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <section
            id="valuation"
            className="rounded-[34px] border border-white/12 bg-[#090a10]/82 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-7"
          >
            <div className="mb-7 flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-blue-300/70">
                  France beta valuation
                </p>
                <h2 className="mt-3 text-2xl font-light tracking-[-0.03em] text-white">
                  Official DVF anchor, live in-browser.
                </h2>
              </div>
              <div className="rounded-full border border-blue-300/20 bg-blue-400/10 p-3 text-blue-200">
                <Euro className="h-5 w-5" />
              </div>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/38">
                  Commune
                </span>
                <select
                  value={commune}
                  onChange={(event) => setCommune(event.target.value)}
                  className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-blue-300/50"
                >
                  {communeOptions.map((row) => (
                    <option
                      key={`${row.commune}-${row.department_code}-${row.property_type}`}
                      value={row.commune}
                      className="bg-[#090a10]"
                    >
                      {row.commune} ({row.department_code}) - {number.format(row.transactions)} tx
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/38">
                    Type
                  </span>
                  <select
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value as PropertyType)}
                    className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-blue-300/50"
                  >
                    <option className="bg-[#090a10]" value="Appartement">
                      Appartement
                    </option>
                    <option className="bg-[#090a10]" value="Maison">
                      Maison
                    </option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/38">
                    Surface m2
                  </span>
                  <input
                    value={area}
                    min={9}
                    max={1000}
                    type="number"
                    onChange={(event) => setArea(Number(event.target.value))}
                    className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-blue-300/50"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/38">
                    Pieces
                  </span>
                  <input
                    value={rooms}
                    min={1}
                    max={12}
                    type="number"
                    onChange={(event) => setRooms(Number(event.target.value))}
                    className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-blue-300/50"
                  />
                </label>
              </div>
            </div>

            <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/36">
                Estimated private value
              </p>
              <p className="mt-3 font-['Fraunces'] text-5xl font-light tracking-[-0.06em] text-white">
                {eur.format(estimate)}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/52">
                Confidence range: {eur.format(low)} - {eur.format(high)} based on{" "}
                {number.format(selectedRecord?.transactions ?? 0)} comparable DVF rows in{" "}
                {selectedRecord?.commune}.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MiniMetric
                  label="Median / m2"
                  value={`${number.format(selectedRecord?.median_price_per_m2 ?? latestTypeMedian(propertyType))} €`}
                />
                <MiniMetric
                  label="Median sale"
                  value={eur.format(selectedRecord?.median_value_eur ?? estimate)}
                />
                <MiniMetric
                  label="Avg area"
                  value={`${selectedRecord?.avg_area_m2 ?? area} m2`}
                />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="market" className="px-5 py-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-blue-300/65">
                Market intelligence
              </p>
              <h2 className="mt-4 max-w-3xl font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
                Real French transaction signal, not portal noise.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-white/54">
              This is the first layer: official transaction anchors by commune,
              type and year. Next layers are rent, renovation, geodata and notaire benchmarks.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/36">
                National trend / {propertyType}
              </p>
              <div className="mt-8 grid gap-4">
                {yearTrend.map((row) => (
                  <div key={`${row.year}-${row.property_type}`}>
                    <div className="mb-2 flex items-center justify-between text-sm text-white/62">
                      <span>{row.year}</span>
                      <span>{number.format(row.median_price_per_m2)} €/m2</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-white"
                        style={{
                          width: `${Math.max(14, (row.median_price_per_m2 / maxPsm) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featured.map((row) => (
                <article
                  key={`${row.commune}-${row.property_type}`}
                  className="rounded-[26px] border border-white/10 bg-[#0a0b12] p-5 transition hover:border-blue-300/35 hover:bg-white/[0.045]"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/35">
                        Dept. {row.department_code}
                      </p>
                      <h3 className="mt-2 text-xl font-medium tracking-[-0.03em] text-white">
                        {row.commune}
                      </h3>
                    </div>
                    <MapPin className="h-5 w-5 text-blue-300/70" />
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-['Fraunces'] text-3xl font-light text-white">
                        {number.format(row.median_price_per_m2)} €
                      </p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/32">
                        median / m2
                      </p>
                    </div>
                    <p className="text-right text-sm text-white/48">
                      {number.format(row.transactions)} tx
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="data" className="px-5 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          <DataCard
            icon={<Database className="h-5 w-5" />}
            title="DVF warehouse"
            text="Raw annual DVF ZIPs were converted into a local residential Parquet warehouse, keeping heavy files out of Vercel."
          />
          <DataCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Separate model"
            text="France remains isolated from Dubai: different regulatory data, property taxonomy, geography and confidence logic."
          />
          <DataCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Next upgrades"
            text="Add geocoding, rent proxies, renovation costs, notaire indices and city-level forecasting before public launch."
          />
        </div>

        <div className="mx-auto mt-8 max-w-7xl rounded-[30px] border border-blue-300/16 bg-blue-400/[0.055] p-6 text-sm leading-7 text-blue-50/72">
          <strong className="text-white">Build note:</strong> this is a beta France
          valuation surface using DVF transaction aggregates. It is already useful for
          directionality, demos and product architecture, but final client-facing
          precision still needs deduplication at mutation/lot level, geospatial
          enrichment and validation against notaire benchmarks.
        </div>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
      <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/32">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function DataCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
      <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-full border border-blue-300/20 bg-blue-400/10 text-blue-200">
        {icon}
      </div>
      <h3 className="text-xl font-medium tracking-[-0.03em] text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-white/52">{text}</p>
    </article>
  );
}
