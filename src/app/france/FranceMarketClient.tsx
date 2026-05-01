"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
  Database,
  Euro,
  Home,
  Map,
  MessageCircle,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

import GoogleMapsLoader, { useGoogleMaps } from "@/app/realprice/components/GoogleMapsLoader";
import FonatPropLogo from "@/components/brand/FonatPropLogo";
import RenovationMaterialSearch from "@/components/renovation/RenovationMaterialSearch";
import marketData from "@/data/france-dvf-market.json";

import FranceRadarSection from "./components/FranceRadarSection";
import FranceMapSection from "./components/FranceMapSection";
import FranceInvestmentSection from "./components/FranceInvestmentSection";

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

const franceDataLayers = [
  {
    icon: Database,
    label: "DVF",
    title: "Official transaction backbone",
    body: "DGFiP/Etalab sale history gives France a national transaction layer that can be cleaned, segmented and backtested.",
  },
  {
    icon: Home,
    label: "DPE",
    title: "Energy performance as price signal",
    body: "DPE changes buyer appetite, rentability and renovation risk. It should become a first-class model feature, not a footnote.",
  },
  {
    icon: ShieldCheck,
    label: "Georisques",
    title: "Risk and due diligence",
    body: "Flood, soil, radon, industrial and natural risk layers turn valuation into investment-grade property intelligence.",
  },
  {
    icon: Map,
    label: "BAN + Geo",
    title: "Address and commune precision",
    body: "Geocoding quality controls confidence. Bad coordinates can break risk, transport and comparable selection.",
  },
  {
    icon: TrendingUp,
    label: "Rental law",
    title: "Investment reality check",
    body: "Zones tendues and rent-control data keep yield estimates grounded in what can legally be charged.",
  },
  {
    icon: BarChart3,
    label: "Notaires",
    title: "Premium validation path",
    body: "Perval and BIEN can later become paid validation benchmarks for high-confidence professional reports.",
  },
];

const navItems = [
  { id: "valorar", label: "Valuation", icon: Home },
  { id: "mapa", label: "Map", icon: Map },
  { id: "radar", label: "Radar", icon: Sparkles },
  { id: "inversion", label: "Investment", icon: TrendingUp },
  { id: "reforma", label: "Renovation", icon: Paintbrush },
];

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

function CountUp({
  target,
  format = "int",
  duration = 2.4,
  delay = 0,
}: {
  target: number;
  format?: "int" | "decimal" | "compact";
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, target, duration, delay]);

  const formatted =
    format === "compact"
      ? value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1_000
          ? `${(value / 1_000).toFixed(0)}K`
          : Math.round(value).toLocaleString("fr-FR")
      : format === "decimal"
        ? value.toFixed(1)
        : Math.round(value).toLocaleString("fr-FR");

  return <span ref={ref}>{formatted}</span>;
}

function ProgressRing({ percentage, size = 320 }: { percentage: number; size?: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const radius = (size - 56) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!inView || !ref.current) return;
    const circle = ref.current;
    circle.style.transition = "stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1)";
    circle.style.strokeDashoffset = String(circumference * (1 - percentage / 100));
  }, [inView, percentage, circumference]);

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 m-auto"
      style={{ overflow: "visible" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius + 18}
        stroke="rgba(255,255,255,0.03)"
        strokeWidth={0.5}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={1}
        fill="none"
      />
      <circle
        ref={ref}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180) {
            const alpha = (1 - d / 180) * 0.08;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
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
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="fixed top-5 md:top-7 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className={`absolute -inset-3 rounded-full blur-xl transition-opacity duration-700 pointer-events-none ${
          scrolled ? "opacity-40" : "opacity-20"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className={`relative flex items-center rounded-full border backdrop-blur-2xl transition-all duration-700 ${
          scrolled
            ? "bg-[#0a0a0f]/75 border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "bg-[#0a0a0f]/35 border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        }`}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="pl-3 pr-3 py-1.5 flex items-center gap-2"
          aria-label="Back to top"
        >
          <FonatPropLogo
            variant="mark"
            className="h-8 w-8 rounded-full border border-white/10 shadow-[0_0_18px_rgba(59,130,246,0.18)]"
            imageClassName="scale-125"
            priority
          />
        </button>
        <div className="w-px h-5 bg-white/[0.08]" />
        <div className="flex items-center px-1">
          {navItems.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="relative px-4 md:px-5 py-2.5 group"
              >
                <span
                  className={`relative text-[12px] tracking-[0.01em] transition-colors duration-300 ${
                    isActive
                      ? "text-white font-medium"
                      : "text-white/45 group-hover:text-white/85 font-normal"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="france-nav-active-dot"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                  />
                )}
                <span
                  className={`absolute inset-1 rounded-full transition-opacity duration-300 pointer-events-none ${
                    isActive ? "opacity-0" : "opacity-0 group-hover:opacity-100 bg-white/[0.04]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
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
    <section className="relative min-h-[100svh] w-full overflow-hidden md:min-h-screen">
      {franceSlides.map((item, index) => (
        <div
          key={item.label}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: index === slide ? 1 : 0, zIndex: index === slide ? 1 : 0 }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${item.image}')`,
              animation:
                index === slide ? "kenburns 12s ease-in-out infinite alternate" : "none",
            }}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#0a0a0f] z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-10" />
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, transparent 0%, rgba(10,10,15,0.35) 80%)",
        }}
      />

      <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-start justify-center px-6 py-28 md:min-h-screen md:px-12 lg:px-24">
        <FonatPropLogo
          variant="lockup"
          className="mb-10 h-auto w-full max-w-[390px] opacity-95 drop-shadow-[0_18px_38px_rgba(0,0,0,0.55)]"
          priority
        />
        <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/28 mb-4">
          France / official DVF engine / separate market
        </p>
        <h1 className="font-['Fraunces'] font-light tracking-[-0.02em] leading-[0.95] text-white mb-10">
          <span className="block text-[clamp(3.2rem,9vw,8rem)]">Know the</span>
          <span className="block text-[clamp(3.2rem,9vw,8rem)] italic font-extralight text-white/40">
            French value.
          </span>
        </h1>
        <p className="font-['Inter'] text-[clamp(1rem,1.25vw,1.2rem)] text-white/55 font-light leading-[1.7] max-w-xl mb-12">
          A France market intelligence surface built on official DVF transactions.
          Same premium product language as Dubai, but with its own data stack,
          valuation logic and compliance story.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => document.getElementById("valorar")?.scrollIntoView({ behavior: "smooth" })}
            className="group relative inline-flex items-center gap-4 px-10 py-4 bg-white text-[#0a0a0f] text-[11px] tracking-[0.3em] uppercase font-medium rounded-none hover:bg-white/90 transition-all duration-500"
          >
            <span>Open France Engine</span>
            <span className="transition-transform duration-500 group-hover:translate-x-1.5">
              &rarr;
            </span>
          </button>
          <Link
            href="/fonatprop"
            className="inline-flex items-center gap-3 px-10 py-4 text-white/80 text-[11px] tracking-[0.3em] uppercase font-medium hover:text-white transition-all duration-500 border-b border-white/20 hover:border-white/60"
          >
            <span>Open Dubai</span>
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

      </div>

      <div className="absolute bottom-10 left-6 md:left-12 lg:left-24 right-6 md:right-12 lg:right-24 z-20 flex items-end justify-between">
        <div className="flex-1">
          <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
            {current.kicker}
          </span>
        </div>
        <div className="hidden md:flex gap-1.5">
          {franceSlides.map((item, index) => (
            <button
              key={item.label}
              onClick={() => setSlide(index)}
              className={`h-[2px] rounded-full transition-all duration-500 ${
                index === slide
                  ? "w-10 bg-white"
                  : "w-4 bg-white/15 hover:bg-white/40"
              }`}
              aria-label={`Open ${item.label} slide`}
            />
          ))}
        </div>
        <div className="flex-1 flex items-center justify-end gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            Scroll
          </span>
          <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1.5%, -1%); }
        }
      `}</style>
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

        <RenovationMaterialSearch
          market="france"
          title="Search French materials and installed ranges."
          description="Initial France catalog for renovation scenarios: tile, laminate, shower mixers, shower screens, bathroom installed ranges and pool benchmarks from Leroy Merlin, Castorama, Brico Depot and published cost guides."
        />
      </div>
    </section>
  );
}

function FranceDataMoatSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.05] bg-[#05060a] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.map} opacity={0.13} position="center" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            <SectionLabel>France intelligence stack</SectionLabel>
            <h2 className="mt-5 max-w-4xl font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
              More than DVF.
              <br />
              <span className="italic text-white/38">A compound data moat.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-white/56 lg:justify-self-end">
            France is the market where FonatProp can become unusually defensible: valuation,
            energy, risk, rent regulation, transport and renovation can sit in one workflow
            instead of scattered across public portals.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.06] md:grid-cols-2 xl:grid-cols-3">
          {franceDataLayers.map(({ icon: Icon, label, title, body }) => (
            <article
              key={title}
              className="min-h-[250px] bg-[#0a0a0f]/94 p-7 transition-colors duration-500 hover:bg-[#0e111a]"
            >
              <div className="mb-7 flex items-center justify-between gap-4">
                <div className="rounded-full border border-blue-300/16 bg-blue-400/10 p-3 text-blue-200">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/34">
                  {label}
                </p>
              </div>
              <h3 className="text-2xl font-medium tracking-[-0.045em] text-white">
                {title}
              </h3>
              <p className="mt-5 text-sm leading-7 text-white/52">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FranceChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 ${
          open
            ? "rotate-90 border border-white/10 bg-white/[0.06] backdrop-blur-xl"
            : "bg-[#3b82f6] hover:scale-105 hover:bg-[#2563eb]"
        }`}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X size={20} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>

      <div
        className={`fixed bottom-24 right-6 z-[55] h-[220px] w-[380px] max-w-[calc(100vw-3rem)] transition-all duration-500 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <FonatPropLogo variant="nav" className="mb-5 h-10 w-[176px] opacity-90" />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3b82f6]/70">
            AI Assistant
          </p>
          <p className="mt-2 text-[14px] font-light text-white">FonatProp France</p>
          <p className="mt-4 text-sm text-white/60">Chat coming soon.</p>
        </div>
      </div>
    </>
  );
}

function FranceStatsSection() {
  const yearSpan = data.coverage.max_year - data.coverage.min_year + 1;
  const coverageScore = Math.min(95, 65 + yearSpan * 4);

  return (
    <section className="relative overflow-hidden border-y border-white/[0.04] bg-[#080810] px-6 py-32 md:px-12 lg:px-24">
      <Constellation />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="mb-6 flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
              Chapter II
            </span>
            <div className="h-px w-12 bg-white/20" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
              Couverture
            </span>
          </div>
          <h2 className="max-w-3xl font-['Fraunces'] text-[clamp(2rem,4.5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.02em] text-white">
            Built on official
            <span className="font-extralight italic text-white/40"> France </span>
            DVF transactions.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-px bg-white/[0.04] lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex min-h-[500px] flex-col justify-between overflow-hidden bg-[#0a0a0f] p-10 md:p-12 lg:col-span-5 lg:row-span-2"
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 50% 60%, rgba(255,255,255,0.04) 0%, transparent 60%)",
              }}
            />

            <div className="relative z-10">
              <p className="mb-1 font-['Fraunces'] text-[14px] font-light italic text-white/40">
                No. 01
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">
                DVF Coverage Score
              </p>
            </div>

            <div className="relative my-8 flex items-center justify-center" style={{ height: 340 }}>
              <ProgressRing percentage={coverageScore} size={340} />
              <div className="relative z-10 text-center">
                <p className="font-['Fraunces'] text-[clamp(5rem,9vw,8rem)] font-extralight leading-[0.9] tracking-[-0.04em] text-white">
                  <CountUp target={coverageScore} format="int" />
                  <span className="text-white/40">%</span>
                </p>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.4em] text-white/35">
                  Etalab DVF &middot; Confidence
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/[0.04] pt-6">
              {[
                { label: "Year Start", value: String(data.coverage.min_year) },
                { label: "Year End", value: String(data.coverage.max_year) },
                { label: "Source", value: "Etalab" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                    {m.label}
                  </p>
                  <p className="font-['Fraunces'] text-[20px] font-light text-white/80">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {[
            {
              value: data.coverage.clean_rows,
              label: "Clean DVF Rows",
              format: "compact" as const,
              num: "02",
            },
            {
              value: data.coverage.communes,
              label: "Commune Markets",
              format: "int" as const,
              num: "03",
            },
            {
              value: data.coverage.departments,
              label: "Departments",
              format: "int" as const,
              num: "04",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.num}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex items-center justify-between overflow-hidden bg-[#0a0a0f] p-10 transition-colors duration-700 hover:bg-[#0d0d14] md:p-12 lg:col-span-7"
            >
              <div className="flex items-baseline gap-6 md:gap-10">
                <p className="font-['Fraunces'] text-[14px] font-light italic text-white/25">
                  No. {stat.num}
                </p>
                <p className="font-['Fraunces'] text-[clamp(2.5rem,5vw,4.5rem)] font-extralight leading-none tracking-[-0.03em] text-white">
                  <CountUp target={stat.value} format={stat.format} delay={0.1 + i * 0.1} />
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/40">
                  {stat.label}
                </p>
                <div className="relative ml-auto mt-3 h-px w-16 overflow-hidden bg-white/10">
                  <div className="absolute inset-0 -translate-x-full bg-white/50 transition-transform duration-700 ease-out group-hover:translate-x-0" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 flex items-center justify-between"
        >
          <p className="max-w-md font-['Fraunces'] text-[15px] font-light italic leading-relaxed text-white/30">
            &ldquo;Signal over noise. Every figure is sourced from official DVF
            transactions published by etalab.gouv.fr.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/25">
              Refreshed
            </span>
            <div className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
              Quarterly
            </span>
          </div>
        </motion.div>
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

  return (
    <main className="min-h-screen bg-[#05060a] text-white">
      <FranceNavBar />
      <HeroSection />
      <FranceStatsSection />
      <FranceDataMoatSection />
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
      <FranceMapSection />
      <FranceRadarSection />
      <FranceInvestmentSection />
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
      <FranceChatWidget />
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
