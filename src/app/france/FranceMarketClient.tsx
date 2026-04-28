"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
  Database,
  Euro,
  Home,
  Map,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import GoogleMapsLoader, { useGoogleMaps } from "@/app/realprice/components/GoogleMapsLoader";
import FonatPropLogo from "@/components/brand/FonatPropLogo";
import marketData from "@/data/france-dvf-market.json";

type PropertyType = "Appartement" | "Maison";

type CommuneRecord = {
  commune: string;
  commune_code?: string;
  department_code: string;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
  volume_rank?: number;
};

type YearRecord = {
  year: number;
  property_type: PropertyType;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
};

type FranceMarketData = {
  generated_at: string;
  coverage: {
    clean_rows: number;
    communes: number;
    departments: number;
    min_year: number;
    max_year: number;
    median_price_per_m2: number;
    median_value_eur: number;
  };
  by_year: YearRecord[];
  by_commune: CommuneRecord[];
  featured: CommuneRecord[];
};

const data = marketData as FranceMarketData;
const communeRows = data.by_commune;
const yearRows = data.by_year;

const franceSlides = [
  {
    label: "Paris",
    kicker: "Capital market",
    image: "/france/eiffel-tower-night.jpg",
  },
  {
    label: "Riviera",
    kicker: "Coastal demand",
    image: "/france/nice-riviera.jpg",
  },
  {
    label: "Alps",
    kicker: "Lifestyle assets",
    image: "/france/french-alps-village.jpg",
  },
  {
    label: "Bordeaux",
    kicker: "Regional liquidity",
    image: "/france/bordeaux-night.jpg",
  },
  {
    label: "Lyon",
    kicker: "Urban depth",
    image: "/france/lyon-skyline.jpg",
  },
];

const sectionBackdrops = {
  valuation: "/france/paris-eiffel-city.jpg",
  map: "/france/lyon-skyline.jpg",
  radar: "/france/nice-riviera.jpg",
  investment: "/france/bordeaux-night.jpg",
  renovation: "/france/french-alps-village.jpg",
};

const renovationCategories = [
  {
    scope: "Kitchen refresh",
    range: "EUR 900-1,800 / m2",
    impact: "Strongest visual upgrade for city apartments",
    note: "cabinetry, worktop, appliances, plumbing touch points",
  },
  {
    scope: "Bathroom",
    range: "EUR 1,200-2,500 / m2",
    impact: "High buyer-confidence signal",
    note: "tiles, sanitaryware, shower system, waterproofing",
  },
  {
    scope: "Flooring",
    range: "EUR 80-220 / m2",
    impact: "Fast repositioning lever",
    note: "engineered wood, laminate, porcelain or stone",
  },
  {
    scope: "Painting and walls",
    range: "EUR 25-60 / m2",
    impact: "Low-cost presentation lift",
    note: "surface prep, premium paint, minor repairs",
  },
  {
    scope: "Windows and glazing",
    range: "EUR 650-1,400 / unit",
    impact: "Comfort and energy-rating improvement",
    note: "double glazing, seals, acoustic/thermal performance",
  },
  {
    scope: "Energy upgrade",
    range: "EUR 150-450 / m2",
    impact: "DPE-driven investment layer",
    note: "insulation, heating controls, ventilation and efficiency",
  },
];

const navItems = [
  { id: "valorar", label: "Valuation", icon: Home },
  { id: "mapa", label: "Map", icon: Map },
  { id: "radar", label: "Radar", icon: Sparkles },
  { id: "inversion", label: "Investment", icon: TrendingUp },
  { id: "reforma", label: "Renovation", icon: Paintbrush },
];

const cityCoords: Record<string, { lat: number; lng: number }> = {
  Paris: { lat: 48.8566, lng: 2.3522 },
  "Paris 01": { lat: 48.864, lng: 2.336 },
  "Paris 02": { lat: 48.868, lng: 2.343 },
  "Paris 03": { lat: 48.864, lng: 2.361 },
  "Paris 04": { lat: 48.854, lng: 2.357 },
  "Paris 05": { lat: 48.844, lng: 2.35 },
  "Paris 06": { lat: 48.849, lng: 2.333 },
  "Paris 07": { lat: 48.856, lng: 2.312 },
  "Paris 08": { lat: 48.872, lng: 2.312 },
  "Paris 09": { lat: 48.878, lng: 2.337 },
  "Paris 10": { lat: 48.876, lng: 2.36 },
  "Paris 11": { lat: 48.858, lng: 2.38 },
  "Paris 12": { lat: 48.84, lng: 2.39 },
  "Paris 13": { lat: 48.832, lng: 2.355 },
  "Paris 14": { lat: 48.833, lng: 2.326 },
  "Paris 15": { lat: 48.841, lng: 2.3 },
  "Paris 16": { lat: 48.863, lng: 2.276 },
  "Paris 17": { lat: 48.887, lng: 2.307 },
  "Paris 18": { lat: 48.892, lng: 2.344 },
  "Paris 19": { lat: 48.883, lng: 2.383 },
  "Paris 20": { lat: 48.864, lng: 2.398 },
  Lyon: { lat: 45.764, lng: 4.8357 },
  Marseille: { lat: 43.2965, lng: 5.3698 },
  Toulouse: { lat: 43.6047, lng: 1.4442 },
  Nice: { lat: 43.7102, lng: 7.262 },
  Nantes: { lat: 47.2184, lng: -1.5536 },
  Montpellier: { lat: 43.6119, lng: 3.8772 },
  Bordeaux: { lat: 44.8378, lng: -0.5792 },
  Lille: { lat: 50.6292, lng: 3.0573 },
  Rennes: { lat: 48.1173, lng: -1.6778 },
  Strasbourg: { lat: 48.5734, lng: 7.7521 },
  Grenoble: { lat: 45.1885, lng: 5.7245 },
  Cannes: { lat: 43.5528, lng: 7.0174 },
  Antibes: { lat: 43.5804, lng: 7.1251 },
  "Aix-en-Provence": { lat: 43.5297, lng: 5.4474 },
  "Boulogne-Billancourt": { lat: 48.8397, lng: 2.2399 },
  "Neuilly-sur-Seine": { lat: 48.8846, lng: 2.2697 },
  "Levallois-Perret": { lat: 48.8932, lng: 2.2879 },
  "Saint-Tropez": { lat: 43.2677, lng: 6.6407 },
  "La Rochelle": { lat: 46.1603, lng: -1.1511 },
};

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function compact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function latestTypeMedian(type: PropertyType) {
  const rows = yearRows
    .filter((row) => row.property_type === type)
    .sort((a, b) => b.year - a.year);

  return rows[0]?.median_price_per_m2 ?? data.coverage.median_price_per_m2;
}

function confidencePct(transactions: number) {
  if (transactions >= 20_000) return 0.09;
  if (transactions >= 8_000) return 0.11;
  if (transactions >= 2_000) return 0.14;
  if (transactions >= 500) return 0.17;
  return 0.22;
}

function estimateValue(record: CommuneRecord | undefined, type: PropertyType, area: number, rooms: number) {
  const psm = record?.median_price_per_m2 ?? latestTypeMedian(type);
  const base = psm * area;
  const roomSignal = area / Math.max(rooms, 1);
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

function getPriceColor(price: number) {
  if (price >= 9_000) return "#f8fafc";
  if (price >= 6_000) return "#60a5fa";
  if (price >= 4_000) return "#38bdf8";
  if (price >= 2_500) return "#22c55e";
  return "#94a3b8";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-blue-200/55">
      {children}
    </p>
  );
}

function SectionBackdrop({
  image,
  opacity = 0.2,
  position = "center",
}: {
  image: string;
  opacity?: number;
  position?: string;
}) {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')`, backgroundPosition: position, opacity }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,10,0.96),rgba(5,6,10,0.82)_48%,rgba(5,6,10,0.62))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(59,130,246,0.14),transparent_34%)]" />
    </>
  );
}

function FranceNavBar() {
  const [active, setActive] = useState("valorar");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      { threshold: [0.2, 0.45], rootMargin: "-80px 0px -45% 0px" },
    );

    navItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="fixed left-1/2 top-5 z-50 -translate-x-1/2 px-3">
      <div
        className={`flex items-center rounded-full border backdrop-blur-2xl transition-all duration-500 ${
          scrolled
            ? "border-white/12 bg-[#07080d]/82 shadow-[0_18px_60px_rgba(0,0,0,0.46)]"
            : "border-white/10 bg-[#07080d]/42"
        }`}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 py-1.5 pl-3 pr-3"
          aria-label="Back to top"
        >
          <FonatPropLogo
            variant="mark"
            className="h-8 w-8 rounded-full border border-white/10"
            imageClassName="scale-125"
            priority
          />
        </button>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center px-1">
          {navItems.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="group relative px-3 py-2.5 md:px-4"
              >
                <span
                  className={`text-xs transition ${
                    isActive ? "text-white" : "text-white/42 group-hover:text-white/80"
                  }`}
                >
                  {label}
                </span>
                {isActive ? (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const [slide, setSlide] = useState(0);
  const current = franceSlides[slide];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSlide((value) => (value + 1) % franceSlides.length);
    }, 5600);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative isolate min-h-screen overflow-hidden">
      {franceSlides.map((item, index) => (
        <div
          key={item.label}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-[1600ms] ${
            index === slide ? "scale-105 opacity-100" : "scale-100 opacity-0"
          }`}
          style={{ backgroundImage: `url('${item.image}')` }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,10,0.92),rgba(5,6,10,0.62)_42%,rgba(5,6,10,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(59,130,246,0.2),transparent_32%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#05060a] to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-28 md:px-10">
        <FonatPropLogo
          variant="lockup"
          className="mb-14 h-24 w-[360px] max-w-[78vw] opacity-90 md:h-32 md:w-[520px]"
          priority
        />
        <SectionLabel>
          France / official DVF transactions / separate market engine
        </SectionLabel>
        <h1 className="mt-7 max-w-5xl font-['Fraunces'] text-[clamp(4.5rem,11vw,11rem)] font-light leading-[0.78] tracking-[-0.085em] text-white">
          Know the
          <span className="block text-white/42 italic">French value.</span>
        </h1>
        <p className="mt-9 max-w-2xl text-lg leading-9 text-white/68 md:text-xl">
          A France product surface built from official DVF transactions, kept fully separate
          from Dubai so each country has its own data, model logic and compliance story.
        </p>

        <div className="mt-12 flex flex-wrap gap-3">
          <button
            onClick={() => document.getElementById("valorar")?.scrollIntoView({ behavior: "smooth" })}
            className="group flex min-w-[230px] items-center justify-between bg-white px-8 py-5 font-mono text-[11px] uppercase tracking-[0.28em] text-[#05060a] transition hover:scale-[1.015]"
          >
            Open France engine
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
          <Link
            href="/fonatprop"
            className="flex min-w-[190px] items-center justify-between border border-white/14 bg-white/[0.035] px-8 py-5 font-mono text-[11px] uppercase tracking-[0.28em] text-white transition hover:bg-white/10"
          >
            Open Dubai
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-14 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [compact(data.coverage.clean_rows), "clean DVF rows"],
            [number.format(data.coverage.communes), "commune/type markets"],
            [String(data.coverage.departments), "departments"],
            [`${data.coverage.min_year}-${data.coverage.max_year}`, "transaction window"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl"
            >
              <p className="font-['Fraunces'] text-3xl text-white">{value}</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/38">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 right-8 hidden items-center gap-3 lg:flex">
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/32">
            {current.kicker}
          </span>
          <div className="flex gap-2">
            {franceSlides.map((item, index) => (
              <button
                key={item.label}
                onClick={() => setSlide(index)}
                className={`h-1 rounded-full transition-all ${
                  index === slide ? "w-12 bg-white" : "w-5 bg-white/25"
                }`}
                aria-label={`Open ${item.label} slide`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuationSection({
  propertyType,
  setPropertyType,
  commune,
  setCommune,
  area,
  setArea,
  rooms,
  setRooms,
  selectedRecord,
  communeOptions,
}: {
  propertyType: PropertyType;
  setPropertyType: (value: PropertyType) => void;
  commune: string;
  setCommune: (value: string) => void;
  area: number;
  setArea: (value: number) => void;
  rooms: number;
  setRooms: (value: number) => void;
  selectedRecord: CommuneRecord | undefined;
  communeOptions: CommuneRecord[];
}) {
  const estimate = estimateValue(selectedRecord, propertyType, area, rooms);
  const pct = confidencePct(selectedRecord?.transactions ?? 0);
  const low = Math.round(estimate * (1 - pct));
  const high = Math.round(estimate * (1 + pct));
  const confidence = Math.max(58, Math.min(94, 100 - pct * 100));

  return (
    <section id="valorar" className="relative scroll-mt-28 overflow-hidden bg-[#05060a] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.valuation} opacity={0.16} position="center 42%" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-8">
          <SectionLabel>Valuation engine</SectionLabel>
          <h2 className="mt-5 max-w-2xl font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
            Estimate with official France data.
          </h2>
          <p className="mt-6 text-base leading-8 text-white/58">
            This is the France equivalent of the Dubai valuation surface: official transactions,
            location-aware benchmarks and a confidence range instead of a fake single truth.
          </p>

          <div className="mt-8 grid gap-4">
            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/38">
                Commune
              </span>
              <select
                value={commune}
                onChange={(event) => setCommune(event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-[#0b0d14] px-4 text-white outline-none transition focus:border-blue-300/50"
              >
                {communeOptions.map((row) => (
                  <option
                    key={`${row.commune}-${row.department_code}-${row.property_type}`}
                    value={row.commune}
                    className="bg-[#0b0d14]"
                  >
                    {row.commune} ({row.department_code}) - {number.format(row.transactions)} tx
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/38">
                  Type
                </span>
                <select
                  value={propertyType}
                  onChange={(event) => setPropertyType(event.target.value as PropertyType)}
                  className="h-14 rounded-2xl border border-white/10 bg-[#0b0d14] px-4 text-white outline-none transition focus:border-blue-300/50"
                >
                  <option className="bg-[#0b0d14]" value="Appartement">
                    Appartement
                  </option>
                  <option className="bg-[#0b0d14]" value="Maison">
                    Maison
                  </option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/38">
                  Area m2
                </span>
                <input
                  value={area}
                  onChange={(event) => setArea(Number(event.target.value) || 0)}
                  min={12}
                  max={600}
                  type="number"
                  className="h-14 rounded-2xl border border-white/10 bg-[#0b0d14] px-4 text-white outline-none transition focus:border-blue-300/50"
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/38">
                  Rooms
                </span>
                <input
                  value={rooms}
                  onChange={(event) => setRooms(Number(event.target.value) || 1)}
                  min={1}
                  max={12}
                  type="number"
                  className="h-14 rounded-2xl border border-white/10 bg-[#0b0d14] px-4 text-white outline-none transition focus:border-blue-300/50"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0b11] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.45)] md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_16%,rgba(59,130,246,0.24),transparent_30%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-6">
              <div>
                <SectionLabel>Estimated value</SectionLabel>
                <div className="mt-6 flex items-baseline gap-4">
                  <span className="font-mono text-sm uppercase tracking-[0.24em] text-white/32">EUR</span>
                  <p className="font-['Fraunces'] text-6xl font-light tracking-[-0.06em] md:text-8xl">
                    {number.format(estimate)}
                  </p>
                </div>
              </div>
              <div className="rounded-full border border-blue-300/20 bg-blue-400/10 p-4 text-blue-200">
                <Euro className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
                <span>Low {eur.format(low)}</span>
                <span>High {eur.format(high)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-sky-300 to-white"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
                Confidence range based on {number.format(selectedRecord?.transactions ?? 0)} official transactions.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                [eur.format(selectedRecord?.median_price_per_m2 ?? latestTypeMedian(propertyType)), "median / m2"],
                [eur.format(selectedRecord?.median_value_eur ?? data.coverage.median_value_eur), "median sale"],
                [`${selectedRecord?.avg_area_m2 ?? area} m2`, "avg area"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="font-['Fraunces'] text-3xl">{value}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/34">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-blue-300/16 bg-blue-500/8 p-5 text-sm leading-7 text-white/62">
              France is not mixed with Dubai. This page uses the France DVF layer and can later
              receive a separate ML model, separate address normalization and separate compliance wording.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FranceGoogleMap({
  records,
  onSelect,
}: {
  records: CommuneRecord[];
  onSelect: (record: CommuneRecord) => void;
}) {
  const loaded = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const initMap = useCallback(() => {
    if (!loaded || !mapRef.current || mapInstance.current) return;
    const google = window.google;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: { lat: 46.7, lng: 2.25 },
      zoom: 5,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "2258c8a7-7ee7-4bbe-9891-b6121da134c7",
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      styles: [
        { elementType: "geometry", stylers: [{ color: "#090a10" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#7c8193" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#090a10" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#171b2a" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#07111f" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [loaded]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  useEffect(() => {
    if (!loaded || !mapInstance.current) return;
    const google = window.google;

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    const infoWindow = new google.maps.InfoWindow();

    records.forEach((record) => {
      const coords = cityCoords[record.commune];
      if (!coords) return;

      const color = getPriceColor(record.median_price_per_m2);
      const size = Math.max(18, Math.min(44, record.median_price_per_m2 / 230));
      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.style.cssText = `
        width:${size}px;height:${size}px;border-radius:999px;
        border:2px solid ${color};background:${color}28;
        box-shadow:0 0 26px ${color}35;
        cursor:pointer;transition:transform .18s ease, background .18s ease;
      `;
      markerEl.onmouseenter = () => {
        markerEl.style.transform = "scale(1.24)";
        markerEl.style.background = `${color}52`;
      };
      markerEl.onmouseleave = () => {
        markerEl.style.transform = "scale(1)";
        markerEl.style.background = `${color}28`;
      };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: coords,
        content: markerEl,
        title: record.commune,
      });

      marker.addListener("click", () => {
        onSelect(record);
        infoWindow.setContent(`
          <div style="font-family:system-ui;min-width:180px;color:#111827;padding:4px">
            <strong>${record.commune}</strong>
            <div style="margin-top:6px;color:#2563eb;font-weight:700">${number.format(record.median_price_per_m2)} EUR/m2</div>
            <div style="margin-top:4px;color:#4b5563">${number.format(record.transactions)} official transactions</div>
          </div>
        `);
        infoWindow.open({ anchor: marker, map: mapInstance.current });
      });

      markersRef.current.push(marker);
    });
  }, [loaded, records, onSelect]);

  return (
    <div className="relative h-[560px] overflow-hidden rounded-[32px] border border-white/10 bg-[#07080d]">
      <div ref={mapRef} className="absolute inset-0" />
      {!loaded ? (
        <div className="absolute inset-0 grid place-items-center bg-[#07080d]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border border-white/10 border-t-blue-300" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/42">
              Loading France map
            </p>
          </div>
        </div>
      ) : null}
      <div className="absolute bottom-5 left-5 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/36">
          Google Maps layer
        </p>
        <p className="mt-1 text-sm text-white/70">Markers = high-volume DVF commune markets</p>
      </div>
    </div>
  );
}

function MapSection({
  mapRecords,
  selectedMapRecord,
  setSelectedMapRecord,
}: {
  mapRecords: CommuneRecord[];
  selectedMapRecord: CommuneRecord;
  setSelectedMapRecord: (record: CommuneRecord) => void;
}) {
  return (
    <section id="mapa" className="relative scroll-mt-28 overflow-hidden bg-[#05060a] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.map} opacity={0.18} position="center" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>Map intelligence</SectionLabel>
            <h2 className="mt-5 max-w-3xl font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
              France market geography, live on Google Maps.
            </h2>
          </div>
          <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-7 text-white/58">
            The Dubai map pattern is reused here, but the data layer is France-only:
            commune benchmarks, transaction volume and EUR/m2 signals.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <FranceGoogleMap records={mapRecords} onSelect={setSelectedMapRecord} />
          <aside className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <SectionLabel>Selected market</SectionLabel>
            <h3 className="mt-5 font-['Fraunces'] text-5xl font-light tracking-[-0.06em]">
              {selectedMapRecord.commune}
            </h3>
            <p className="mt-3 text-white/44">Department {selectedMapRecord.department_code}</p>

            <div className="mt-8 grid gap-3">
              {[
                [eur.format(selectedMapRecord.median_price_per_m2), "median price / m2"],
                [number.format(selectedMapRecord.transactions), "transactions"],
                [eur.format(selectedMapRecord.median_value_eur), "median sale"],
                [`${selectedMapRecord.avg_area_m2} m2`, "avg surface"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/22 p-4">
                  <p className="text-2xl text-white">{value}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/32">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function RadarSection({ featured }: { featured: CommuneRecord[] }) {
  return (
    <section id="radar" className="relative scroll-mt-28 overflow-hidden bg-[#05060a] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.radar} opacity={0.18} position="center" />
      <div className="relative mx-auto max-w-7xl">
        <SectionLabel>Radar</SectionLabel>
        <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <h2 className="max-w-3xl font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
            High-signal French markets.
          </h2>
          <p className="max-w-md text-base leading-8 text-white/56">
            For France, radar starts with market liquidity and official prices before we add
            listings, renovation and neighborhood-level scoring.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featured.slice(0, 8).map((record, index) => (
            <article
              key={`${record.commune}-${record.property_type}-${index}`}
              className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-blue-300/24 hover:bg-white/[0.055]"
            >
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-blue-200/48">
                    {record.property_type}
                  </p>
                  <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
                    {record.commune}
                  </h3>
                  <p className="mt-1 text-sm text-white/36">Dept. {record.department_code}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-white/44">
                  #{index + 1}
                </span>
              </div>
              <p className="font-['Fraunces'] text-4xl font-light tracking-[-0.05em]">
                {eur.format(record.median_price_per_m2)}
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/34">
                median price / m2
              </p>
              <div className="mt-6 h-px bg-white/10" />
              <div className="mt-5 flex justify-between text-sm text-white/48">
                <span>{number.format(record.transactions)} tx</span>
                <span>{eur.format(record.median_value_eur)}</span>
              </div>
              <div className="mt-5 rounded-2xl border border-blue-300/10 bg-blue-400/[0.06] p-3 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-100/54">
                Liquidity score: {Math.min(99, Math.round(record.transactions / 420))}/100
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InvestmentSection({ propertyType }: { propertyType: PropertyType }) {
  const trend = yearRows.filter((row) => row.property_type === propertyType);
  const maxPsm = Math.max(...trend.map((row) => row.median_price_per_m2));
  const first = trend[0];
  const last = trend[trend.length - 1];
  const movementNumber = first && last ? (last.median_price_per_m2 / first.median_price_per_m2 - 1) * 100 : 0;
  const movement = movementNumber.toFixed(1);
  const annualized =
    first && last && last.year > first.year
      ? (Math.pow(last.median_price_per_m2 / first.median_price_per_m2, 1 / (last.year - first.year)) - 1) * 100
      : 0;
  const basePsm = last?.median_price_per_m2 ?? latestTypeMedian(propertyType);
  const scenarioRows = [
    {
      label: "Conservative",
      growth: Math.max(-2, annualized - 1.8),
      note: "Uses a softer cycle and slower buyer absorption.",
    },
    {
      label: "Base case",
      growth: annualized,
      note: "Extends the cleaned DVF trend without assuming a boom.",
    },
    {
      label: "Upside",
      growth: annualized + 1.8,
      note: "Adds stronger demand and renovation-driven positioning.",
    },
  ];

  return (
    <section id="inversion" className="relative scroll-mt-28 overflow-hidden bg-[#05060a] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.investment} opacity={0.2} position="center" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionLabel>Investment</SectionLabel>
          <h2 className="mt-5 font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
            France investment layer.
          </h2>
          <p className="mt-6 text-base leading-8 text-white/58">
            Investment starts with official DVF price history, liquidity and scenario ranges.
            France stays separate from Dubai so returns, fees and renovation assumptions can
            evolve into their own model.
          </p>
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/38">
              2021 to {data.coverage.max_year} median movement
            </p>
            <p className="mt-4 font-['Fraunces'] text-6xl font-light tracking-[-0.06em]">
              {movement}%
            </p>
            <p className="mt-3 text-sm text-white/44">
              Based on clean residential DVF transactions for {propertyType.toLowerCase()}.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              [`${annualized.toFixed(1)}%`, "annualized trend"],
              [eur.format(basePsm), "latest median / m2"],
              [compact(last?.transactions ?? 0), "latest tx volume"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <p className="text-2xl text-white">{value}</p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/32">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex items-center justify-between">
            <SectionLabel>Price history</SectionLabel>
            <BarChart3 className="h-5 w-5 text-blue-200/70" />
          </div>
          <div className="mt-8 grid gap-5">
            {trend.map((row) => (
              <div key={`${row.year}-${row.property_type}`}>
                <div className="mb-2 flex items-center justify-between text-sm text-white/58">
                  <span>{row.year}</span>
                  <span>{eur.format(row.median_price_per_m2)} / m2</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-300 to-white"
                    style={{ width: `${Math.max(12, (row.median_price_per_m2 / maxPsm) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/28">
                  {number.format(row.transactions)} transactions
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {scenarioRows.map((scenario) => {
              const projected = Math.round(basePsm * Math.pow(1 + scenario.growth / 100, 3));
              return (
                <div key={scenario.label} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-blue-200/52">
                    {scenario.label}
                  </p>
                  <p className="mt-3 font-['Fraunces'] text-3xl font-light tracking-[-0.05em]">
                    {eur.format(projected)}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                    3-year EUR/m2
                  </p>
                  <p className="mt-4 text-xs leading-5 text-white/46">{scenario.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function RenovationSection() {
  const cards = [
    {
      icon: Database,
      title: "DVF core",
      text: "5.9M cleaned residential rows already processed locally from official transaction files.",
    },
    {
      icon: Building2,
      title: "RNC layer",
      text: "Co-ownership files are in the data lake and can become building/context features.",
    },
    {
      icon: ShieldCheck,
      title: "Separate compliance",
      text: "France keeps its own sources, language and disclaimers instead of reusing Dubai logic.",
    },
    {
      icon: Paintbrush,
      title: "Renovation next",
      text: "A France renovation module can add energy upgrades, DPE and local cost ranges.",
    },
  ];

  return (
    <section id="reforma" className="relative scroll-mt-28 overflow-hidden bg-[#05060a] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.renovation} opacity={0.19} position="center" />
      <div className="relative mx-auto max-w-7xl">
        <SectionLabel>Renovation and data roadmap</SectionLabel>
        <h2 className="mt-5 max-w-4xl font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
          Renovation intelligence for France.
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/58">
          The France renovation module starts with practical cost ranges and later connects
          them to DPE, co-ownership context and value uplift. It is not a contractor quote;
          it is an investment planning layer.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
              <div className="mb-6 inline-flex rounded-full border border-blue-300/16 bg-blue-400/10 p-3 text-blue-200">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-medium tracking-[-0.04em] text-white">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/52">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {renovationCategories.map((item) => (
            <article
              key={item.scope}
              className="rounded-[28px] border border-white/10 bg-black/28 p-6 backdrop-blur-xl"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-blue-200/50">
                France beta range
              </p>
              <h3 className="mt-4 text-2xl font-medium tracking-[-0.04em] text-white">
                {item.scope}
              </h3>
              <p className="mt-4 font-['Fraunces'] text-4xl font-light tracking-[-0.05em]">
                {item.range}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/54">{item.impact}</p>
              <p className="mt-5 border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                {item.note}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FranceExperience() {
  const [propertyType, setPropertyType] = useState<PropertyType>("Appartement");
  const [commune, setCommune] = useState("Paris 15");
  const [area, setArea] = useState(62);
  const [rooms, setRooms] = useState(3);

  const communeOptions = communeRows
    .filter((row) => row.property_type === propertyType)
    .slice(0, 900);

  const selectedRecord =
    communeRows.find((row) => row.commune === commune && row.property_type === propertyType) ??
    communeOptions[0];

  const featured = data.featured
    .filter((row) => row.property_type === propertyType)
    .slice(0, 12);

  const mapRecords =
    featured.filter((row) => cityCoords[row.commune]).length >= 4
      ? featured.filter((row) => cityCoords[row.commune])
      : communeRows
          .filter((row) => row.property_type === propertyType && cityCoords[row.commune])
          .slice(0, 18);

  const [selectedMapRecord, setSelectedMapRecord] = useState<CommuneRecord>(
    mapRecords[0] ?? selectedRecord ?? communeRows[0],
  );

  useEffect(() => {
    const next = mapRecords[0] ?? selectedRecord;
    if (next) setSelectedMapRecord(next);
  }, [propertyType]);

  useEffect(() => {
    if (!selectedRecord) return;
    const matchingMapRecord = mapRecords.find((row) => row.commune === selectedRecord.commune);
    if (matchingMapRecord) {
      setSelectedMapRecord(matchingMapRecord);
    }
  }, [commune, selectedRecord, mapRecords]);

  return (
    <main className="min-h-screen bg-[#05060a] text-white">
      <FranceNavBar />
      <HeroSection />
      <ValuationSection
        propertyType={propertyType}
        setPropertyType={setPropertyType}
        commune={commune}
        setCommune={setCommune}
        area={area}
        setArea={setArea}
        rooms={rooms}
        setRooms={setRooms}
        selectedRecord={selectedRecord}
        communeOptions={communeOptions}
      />
      <MapSection
        mapRecords={mapRecords}
        selectedMapRecord={selectedMapRecord}
        setSelectedMapRecord={setSelectedMapRecord}
      />
      <RadarSection featured={featured} />
      <InvestmentSection propertyType={propertyType} />
      <RenovationSection />
      <footer className="border-t border-white/10 bg-[#05060a] px-6 py-12 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <FonatPropLogo variant="nav" className="h-12 w-[190px] opacity-80" />
          <p className="max-w-xl text-sm leading-7 text-white/42">
            France beta is powered by official DVF transaction processing. Dubai remains the
            production market; France is prepared as a separate country surface.
          </p>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-200/70 transition hover:text-white"
          >
            Back to markets
          </Link>
        </div>
      </footer>
    </main>
  );
}

export default function FranceMarketClient() {
  return (
    <GoogleMapsLoader>
      <FranceExperience />
    </GoogleMapsLoader>
  );
}
