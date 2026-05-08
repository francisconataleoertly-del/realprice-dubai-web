"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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
import DealIntelligencePanel from "@/components/intelligence/DealIntelligencePanel";
import RenovationMaterialSearch from "@/components/renovation/RenovationMaterialSearch";
import ValuationReliabilityPanel from "@/components/valuation/ValuationReliabilityPanel";
import marketData from "@/data/france-dvf-market.json";
import { FONATPROP_CONTACT } from "@/lib/fonatprop-contact";
import { buildValuationIntelligence } from "@/lib/deal-intelligence";
import { buildFranceReliability } from "@/lib/valuation-reliability";

import FranceRadarSection from "./components/FranceRadarSection";
import FranceMapSection from "./components/FranceMapSection";
import FranceInvestmentSection from "./components/FranceInvestmentSection";
import FranceReformaSection from "./components/FranceReformaSection";
import {
  dpeAdjustmentPct,
  FRANCE_DPE_IMPACT,
  type DpeClass,
} from "./components/franceDPE";
import FranceAddressAutocomplete from "./components/FranceAddressAutocomplete";
import FranceReportCTA from "./components/FranceReportCTA";
import FranceComparablesPanel from "./components/FranceComparablesPanel";
import DvfLiveTicker from "./components/DvfLiveTicker";
import SectionDivider from "@/components/design/SectionDivider";
import CursorGlow from "@/components/design/CursorGlow";
import MeshBackground from "@/components/design/MeshBackground";
import MeshGradient3D from "@/components/design/MeshGradient3D";
import {
  dvfFullInseeCode,
  type AddressSuggestion,
} from "./components/franceBANService";
import {
  lookupDpeByAddress,
  pickPrimaryDpeClass,
  type DpeLookupResult,
} from "./components/franceADEMEService";
import { FranceMarketProvider, useFranceMarket } from "./components/FranceMarketContext";

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

const franceCommercialCards = [
  {
    label: "Valuation",
    title: "Official price range",
    body: "DVF-backed commune pricing, DPE context and confidence bands for a client-ready estimate.",
    href: "#valorar",
  },
  {
    label: "Investment",
    title: "Net yield underwriter",
    body: "Rent cap, zone tendue, vacancy, tax regime, financing and acquisition fees in one flow.",
    href: "#inversion",
  },
  {
    label: "Renovation",
    title: "DPE and capex studio",
    body: "Works budget, MaPrimeRenov, Eco-PTZ, VAT logic and resale-uplift estimates.",
    href: "#reforma",
  },
  {
    label: "Report",
    title: "Broker-ready summary",
    body: "Every section can generate a lead and package the result into a professional follow-up.",
    href: "#valorar",
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
      <img
        src={image}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover will-change-transform [transform:translateZ(0)]"
        style={{ objectPosition: position, opacity }}
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
  const gradientId = useId().replace(/:/g, "");
  const glowId = `${gradientId}-glow`;
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
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(241,247,255,0.98)" />
          <stop offset="50%" stopColor="rgba(122,209,255,0.96)" />
          <stop offset="100%" stopColor="rgba(247,196,124,0.94)" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: 24 }).map((_, index) => {
        const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
        const outer = radius + 14;
        const inner = index % 3 === 0 ? radius + 1 : radius + 8;
        const x1 = size / 2 + Math.cos(angle) * inner;
        const y1 = size / 2 + Math.sin(angle) * inner;
        const x2 = size / 2 + Math.cos(angle) * outer;
        const y2 = size / 2 + Math.sin(angle) * outer;
        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={index % 3 === 0 ? "rgba(255,255,255,0.22)" : "rgba(125,145,190,0.16)"}
            strokeWidth={index % 3 === 0 ? 1.4 : 0.8}
          />
        );
      })}
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
        stroke={`url(#${gradientId})`}
        strokeWidth={2.2}
        fill="none"
        filter={`url(#${glowId})`}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle cx={size / 2} cy={size / 2} r={2.8} fill="rgba(255,255,255,0.92)" />
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
      <MeshBackground tone="violet" intensity={0.55} className="z-[11]" />
      <div className="absolute inset-0 z-[12] mix-blend-screen" style={{ opacity: 0.42 }}>
        <MeshGradient3D
          colors={["#06070d", "#1e3a8a", "#7c3aed", "#f5d6a3"]}
          speed={0.7}
          intensity={0.85}
          resolutionScale={0.55}
        />
      </div>

      <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-start justify-center px-6 py-28 md:min-h-screen md:px-12 lg:px-24">
        <FonatPropLogo
          variant="lockup"
          className="fp-shared-logo mb-10 h-auto w-full max-w-[390px] opacity-95 drop-shadow-[0_18px_38px_rgba(0,0,0,0.55)]"
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
        <p className="fonatprop-dropcap font-['Inter'] text-[clamp(1rem,1.25vw,1.2rem)] text-white/55 font-light leading-[1.7] max-w-xl mb-12">
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
  dpeClass,
  setDpeClass,
  selectedRecord,
  addressMatch,
  onSelectAddress,
  dpeLookup,
  dpeLookupLoading,
  dpeUserOverride,
  postcode,
}: {
  propertyType: PropertyType;
  setPropertyType: (value: PropertyType) => void;
  commune: string;
  setCommune: (value: string) => void;
  area: number;
  setArea: (value: number) => void;
  rooms: number;
  setRooms: (value: number) => void;
  dpeClass: DpeClass;
  setDpeClass: (value: DpeClass) => void;
  selectedRecord: CommuneRecord | undefined;
  addressMatch: CommuneRecord | undefined;
  onSelectAddress: (addr: AddressSuggestion) => void;
  dpeLookup: DpeLookupResult | null;
  dpeLookupLoading: boolean;
  dpeUserOverride: boolean;
  postcode: string | null;
}) {
  const [valuationData, setValuationData] = useState<{
    valuation_mode?: string;
    estimated_value_eur: number;
    median_price_per_m2_eur: number;
    confidence_pct: number;
    record?: CommuneRecord | null;
    reliability?: ReturnType<typeof buildFranceReliability>;
    match_context?: { strategy?: string; postal_code?: string | null };
    comparable_context?: {
      source?: string;
      used_count?: number;
      exact_room_count?: number;
      postcode?: string | null;
    };
  } | null>(null);
  const [valuationLoading, setValuationLoading] = useState(false);

  useEffect(() => {
    if (!area || area <= 0) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setValuationLoading(true);
        const response = await fetch("/api/france/valuation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: commune,
            commune,
            property_type: propertyType,
            area_m2: area,
            rooms,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("France valuation request failed");
        const payload = await response.json();
        if (!controller.signal.aborted) {
          setValuationData(payload);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("[france] valuation refresh failed", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setValuationLoading(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [area, commune, propertyType, rooms]);

  const dpeSource: "ademe-exact" | "ademe-postcode" | "manual" = dpeLookup?.exact_match
    ? "ademe-exact"
    : dpeUserOverride
      ? "manual"
      : dpeLookup?.most_common_class
        ? "ademe-postcode"
        : "manual";
  const dpeDistTotal =
    dpeLookup?.nearby_records.length ?? dpeLookup?.total ?? 0;
  const valuationRecord =
    (valuationData?.record as CommuneRecord | undefined) ?? selectedRecord;
  const valuationMode =
    valuationData?.valuation_mode ??
    (selectedRecord ? "dvf_commune_statistical_v1" : "national_dvf_fallback_v1");
  const valuationMedianPsm =
    valuationData?.median_price_per_m2_eur ??
    valuationRecord?.median_price_per_m2 ??
    latestTypeMedian(propertyType);
  const valuationSupportCount = valuationRecord?.transactions ?? 0;
  const postcodeComparableSource =
    valuationData?.comparable_context?.source === "postcode_weighted_comparables";
  const baseEstimate =
    valuationData?.estimated_value_eur ??
    estimateValue(selectedRecord, propertyType, area, rooms);
  const dpeAdjustment = dpeAdjustmentPct(dpeClass, propertyType);
  const estimate = Math.round(baseEstimate * (1 + dpeAdjustment / 100));
  const dpeDelta = estimate - baseEstimate;
  const pct =
    valuationData?.confidence_pct != null
      ? valuationData.confidence_pct / 100
      : confidencePct(valuationSupportCount);
  const low = Math.round(estimate * (1 - pct));
  const high = Math.round(estimate * (1 + pct));
  const confidence = Math.max(58, Math.min(94, 100 - pct * 100));
  const dpeImpact = FRANCE_DPE_IMPACT.find((i) => i.class === dpeClass);
  const reliability =
    valuationData?.reliability ??
    buildFranceReliability({
      valuation_mode: valuationMode,
      confidence_pct: Math.round(pct * 1000) / 10,
      record: valuationRecord || null,
      match_context: valuationData?.match_context ?? {
        strategy: selectedRecord ? "commune_lookup" : "national_fallback",
        postal_code: postcode,
      },
    });

  return (
    <section id="valorar" className="relative scroll-mt-28 overflow-hidden bg-[#05060a] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.valuation} opacity={0.16} position="center 42%" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="self-start rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-8">
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
                Address (Géoplateforme IGN — BAN)
              </span>
              <FranceAddressAutocomplete
                value={commune}
                onSelect={onSelectAddress}
                onChange={(text) => setCommune(text)}
              />
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/28">
                {addressMatch ? (
                  <>
                    Matched DVF commune <span className="text-white/55">{addressMatch.commune}</span>{" "}
                    (Dept. {addressMatch.department_code}) ·{" "}
                    {number.format(addressMatch.transactions)} transactions
                    {postcodeComparableSource ? <> · postcode comparables active</> : null}
                  </>
                ) : commune ? (
                  <>No DVF match for "{commune}" - using national medians</>
                ) : (
                  <>Type a French address to anchor the valuation</>
                )}
              </p>
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

            <div>
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/38">
                DPE — classe énergétique
              </span>
              <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-white/10">
                {FRANCE_DPE_IMPACT.map((impact) => {
                  const active = impact.class === dpeClass;
                  const adjPct =
                    propertyType === "Maison" ? impact.house_pct : impact.apartment_pct;
                  return (
                    <button
                      key={impact.class}
                      type="button"
                      onClick={() => setDpeClass(impact.class)}
                      className={`group flex flex-col items-center justify-center gap-0.5 border-r border-white/[0.06] py-2.5 text-[11px] font-semibold transition-all duration-300 last:border-r-0 ${
                        active ? "scale-[1.04] text-white" : "text-white/85 hover:text-white"
                      }`}
                      style={{
                        background: active ? impact.color : `${impact.color}55`,
                        boxShadow: active ? `inset 0 -3px 0 #fff` : "none",
                      }}
                      aria-label={`Classe DPE ${impact.class}`}
                    >
                      <span>{impact.class}</span>
                      <span className="font-mono text-[8px] tracking-wider text-black/55 group-hover:text-black/80">
                        {adjPct > 0 ? "+" : ""}
                        {adjPct}%
                      </span>
                    </button>
                  );
                })}
              </div>
              {dpeImpact ? (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/38">
                  Class {dpeImpact.class}
                  {dpeImpact.rental_ban_year ? (
                    <span className="ml-2 text-amber-300">
                      ⚠ Rental ban from {dpeImpact.rental_ban_year}
                    </span>
                  ) : null}
                </p>
              ) : null}

              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#0b0d14] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                    DPE source
                  </p>
                  {dpeLookupLoading ? (
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-blue-200/70">
                      <span className="relative inline-flex h-2 w-2 overflow-hidden rounded-full bg-blue-300/30">
                        <span className="absolute inset-0 animate-ping rounded-full bg-blue-300/60" />
                      </span>
                      Querying ADEME 6M+ records…
                    </span>
                  ) : dpeSource === "ademe-exact" ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-300">
                      ✓ Exact match — ADEME observatoire
                    </p>
                  ) : dpeSource === "ademe-postcode" ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-blue-200/70">
                      Suggested from {dpeDistTotal} postcode DPEs
                    </p>
                  ) : (
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
                      Manual override
                    </p>
                  )}
                </div>

                {dpeLookup?.exact_match ? (
                  <div className="mt-3 grid gap-1 border-t border-white/[0.06] pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                    <p>Address: {dpeLookup.exact_match.adresse_brut}</p>
                    <p>
                      DPE {dpeLookup.exact_match.etiquette_dpe} &middot; GES{" "}
                      {dpeLookup.exact_match.etiquette_ges ?? "—"} &middot;{" "}
                      {dpeLookup.exact_match.surface_habitable_logement ?? "—"} m²
                      {dpeLookup.exact_match.date_etablissement_dpe ? (
                        <span> &middot; {dpeLookup.exact_match.date_etablissement_dpe}</span>
                      ) : null}
                    </p>
                  </div>
                ) : null}

                {!dpeLookup?.exact_match && dpeLookup && dpeDistTotal > 0 ? (
                  <div className="mt-3 border-t border-white/[0.06] pt-3">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                      DPE distribution in this postcode (n={dpeDistTotal})
                    </p>
                    <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
                      {FRANCE_DPE_IMPACT.map((impact) => {
                        const count = dpeLookup.distribution[impact.class] ?? 0;
                        const pct = dpeDistTotal > 0 ? (count / dpeDistTotal) * 100 : 0;
                        if (pct === 0) return null;
                        return (
                          <div
                            key={impact.class}
                            style={{
                              width: `${pct}%`,
                              background: impact.color,
                            }}
                            title={`${impact.class}: ${count} (${pct.toFixed(0)}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-1 text-center font-mono text-[8px] uppercase tracking-[0.15em] text-white/35">
                      {FRANCE_DPE_IMPACT.map((impact) => {
                        const count = dpeLookup.distribution[impact.class] ?? 0;
                        return (
                          <span key={impact.class}>
                            {impact.class} · {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
                  Source: ADEME data.ademe.fr/datasets/dpe03existant — 6M+ DPEs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative self-start overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0b11] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.45)] md:p-8">
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
                {dpeAdjustment !== 0 ? (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/38">
                    DPE {dpeClass}: {dpeAdjustment > 0 ? "+" : ""}
                    {dpeAdjustment}% ={" "}
                    <span style={{ color: dpeImpact?.color }}>
                      {dpeDelta > 0 ? "+" : ""}
                      {eur.format(dpeDelta)}
                    </span>{" "}
                    vs class D baseline
                  </p>
                ) : (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/38">
                    DPE D - market baseline
                  </p>
                )}
              </div>
              <div
                className="rounded-full border p-4 text-white"
                style={{
                  borderColor: `${dpeImpact?.color ?? "#3b82f6"}50`,
                  background: `${dpeImpact?.color ?? "#3b82f6"}1a`,
                }}
              >
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
                Confidence range based on {number.format(valuationSupportCount)} official transactions
                {postcodeComparableSource ? " plus postcode-weighted comparables." : "."}
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                [eur.format(valuationMedianPsm), "median / m2"],
                [eur.format(valuationRecord?.median_value_eur ?? data.coverage.median_value_eur), "median sale"],
                [`${valuationRecord?.avg_area_m2 ?? area} m2`, "avg area"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="font-['Fraunces'] text-3xl">{value}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/34">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <ValuationReliabilityPanel reliability={reliability} compact />
            </div>

            <div className="mt-6">
              <DealIntelligencePanel
                intelligence={buildValuationIntelligence({
                  market: "france",
                  estimate,
                  low,
                  high,
                  supportCount: valuationSupportCount,
                  confidencePct: Math.round(pct * 1000) / 10,
                  valuationMode,
                  dpeClass,
                  currency: "EUR",
                })}
                title="AI valuation memo"
              />
            </div>

            <div className="mt-10 rounded-2xl border border-blue-300/16 bg-blue-500/8 p-5 text-sm leading-7 text-white/62">
              France is not mixed with Dubai. This surface now prioritizes postcode-weighted DVF
              comparables when address support exists, then falls back to commune-level pricing
              when the address signal is still too broad.
            </div>

            <div className="mt-6">
              <FranceComparablesPanel
                postcode={postcode}
                propertyType={propertyType}
                surface={area}
                estimatePerM2={
                  valuationMedianPsm ??
                  Math.round(estimate / Math.max(area, 1))
                }
              />
            </div>

            <div className="mt-6">
              <FranceReportCTA
                section="valuation"
                printTargetId="valorar"
                snapshot={{
                  address: commune,
                  property_type: propertyType,
                  area_m2: area,
                  rooms,
                  dpe_class: dpeClass,
                  estimate_eur: estimate,
                  estimate_low: low,
                  estimate_high: high,
                  dpe_source: dpeSource,
                  dpe_total_records: dpeDistTotal,
                }}
              />
            </div>
          </div>
        </div>
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

function FranceCommercialProductSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.05] bg-[#07080e] px-6 py-28 md:px-10">
      <SectionBackdrop image={sectionBackdrops.investment} opacity={0.16} position="center" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            <SectionLabel>Commercial France product</SectionLabel>
            <h2 className="mt-5 max-w-4xl font-['Fraunces'] text-5xl font-light leading-[0.95] tracking-[-0.06em] md:text-7xl">
              France is not a demo.
              <br />
              <span className="italic text-white/38">It is an underwriting tool.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-white/56 lg:justify-self-end">
            The commercial promise is simple: price, rental legality, net yield and renovation
            cost in one premium workflow. That is what a broker or investor needs before a deal.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {franceCommercialCards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="group rounded-[30px] border border-white/[0.08] bg-[#0a0a0f]/82 p-6 transition duration-500 hover:border-blue-200/30 hover:bg-[#0d111c]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-200/55">
                {card.label}
              </p>
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.045em] text-white">
                {card.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/52">{card.body}</p>
              <span className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 transition group-hover:text-white/75">
                Open layer <ArrowRight className="h-3 w-3" />
              </span>
            </a>
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
    <section className="relative overflow-hidden border-y border-white/[0.05] bg-[#06070d] px-6 py-28 md:px-12 lg:px-24">
      <Constellation />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(120,164,255,0.16),transparent_36%),radial-gradient(circle_at_88%_18%,rgba(77,210,255,0.12),transparent_28%),radial-gradient(circle_at_78%_78%,rgba(246,193,120,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:160px_160px]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
        >
          <div>
            <div className="mb-6 flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#96a8d8]/55">
                Chapter II
              </span>
              <div className="h-px w-12 bg-white/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#96a8d8]/55">
                French data observatory
              </span>
            </div>
            <h2 className="max-w-4xl font-[family:var(--font-display)] text-[clamp(2.6rem,5vw,4.5rem)] font-light leading-[0.94] tracking-[-0.045em] text-white">
              Not a generic dashboard.
              <span className="block font-extralight italic text-white/38">
                A valuation engine built on national evidence.
              </span>
            </h2>
          </div>
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] px-6 py-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#8eb0ff]/60">
              Why this matters
            </p>
            <p className="mt-4 text-[17px] leading-8 text-white/62">
              Every signal below comes from cleaned DVF history, not decorative placeholder metrics.
              The goal is to make France feel like an <span className="text-white">investment-grade market surface</span>,
              not another luxury landing with random counters.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[38px] border border-[#7aa9ff]/16 bg-[linear-gradient(160deg,rgba(8,10,18,0.98),rgba(10,13,24,0.96))] p-10 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.02)_inset] md:p-12 lg:col-span-5"
          >
            <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-[#7dd3fc]/60 to-transparent opacity-70" />
            <div
              className="absolute inset-0 opacity-65"
              style={{
                background:
                  "radial-gradient(circle at 35% 42%, rgba(111,173,255,0.14) 0%, transparent 42%), radial-gradient(circle at 75% 84%, rgba(243,197,125,0.10) 0%, transparent 28%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  `DVF ${data.coverage.min_year}-${data.coverage.max_year}`,
                  `${data.coverage.departments} departments`,
                  "Official Etalab backbone",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/56"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#b8cbff]/72">
                Coverage integrity
              </p>
              <p className="mt-5 max-w-sm text-[16px] leading-7 text-white/62">
                A fast read on how much of France&apos;s residential market has been normalized into a usable
                valuation layer.
              </p>
            </div>

            <div className="relative my-6 flex items-center justify-center" style={{ height: 340 }}>
              <div className="absolute inset-0 m-auto h-[340px] w-[340px] rounded-full border border-white/[0.04] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_62%)]" />
              <ProgressRing percentage={coverageScore} size={340} />
              <div className="relative z-10 text-center">
                <p className="font-[family:var(--font-display)] text-[clamp(5rem,9vw,8rem)] font-extralight leading-[0.9] tracking-[-0.06em] text-white">
                  <CountUp target={coverageScore} format="int" />
                  <span className="text-white/40">%</span>
                </p>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.42em] text-[#bfd8ff]/58">
                  National valuation confidence
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-6">
              {[
                { label: "Year Start", value: String(data.coverage.min_year) },
                { label: "Year End", value: String(data.coverage.max_year) },
                { label: "Source", value: "Etalab" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                  <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.32em] text-white/36">
                    {m.label}
                  </p>
                  <p className="font-[family:var(--font-display)] text-[20px] font-light text-white/92">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-6 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-[38px] border border-[#88b2ff]/16 bg-[linear-gradient(140deg,rgba(10,13,24,0.98),rgba(12,17,32,0.96))] p-10 md:p-12"
            >
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 85% 18%, rgba(99, 167, 255, 0.18), transparent 26%), radial-gradient(circle at 82% 80%, rgba(237,241,198,0.08), transparent 22%), linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 100%)",
                }}
              />
              <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-end">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-[#b8cbff]/72">
                    Cleaned transaction inventory
                  </p>
                  <p className="mt-4 font-[family:var(--font-display)] text-[clamp(4rem,9vw,7.4rem)] font-light leading-[0.88] tracking-[-0.06em] text-white">
                    <CountUp target={data.coverage.clean_rows} format="compact" delay={0.1} />
                  </p>
                  <p className="mt-3 max-w-xl text-[16px] leading-7 text-white/62">
                    Raw DVF becomes valuable only after cleaning, address normalization and commune-level
                    market shaping. This is the usable layer behind the France valuation experience.
                  </p>
                </div>
                <div className="grid w-full grid-cols-[1.12fr_0.88fr] gap-3 self-start xl:self-end">
                  {[
                    {
                      label: "Refresh cadence",
                      value: "Quarterly",
                      valueClassName:
                        "text-[15px] leading-[1.02] sm:text-[16px] lg:text-[17px] xl:text-[18px]",
                    },
                    {
                      label: "Coverage span",
                      value: `${data.coverage.min_year}-${data.coverage.max_year}`,
                      valueClassName:
                        "text-[15px] leading-[1.02] sm:text-[16px] lg:text-[17px] xl:text-[18px]",
                    },
                  ].map((meta) => (
                    <div
                      key={meta.label}
                      className="relative flex min-h-[148px] min-w-0 flex-col justify-between overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,10,20,0.82),rgba(10,15,28,0.68))] px-5 py-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
                    >
                      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#9fd6ff]/30 to-transparent" />
                      <div className="absolute -right-10 top-10 h-24 w-24 rounded-full bg-[#7ab7ff]/8 blur-2xl" />
                      <p className="font-mono text-[8px] uppercase tracking-[0.32em] text-white/36">
                        {meta.label}
                      </p>
                      <p
                        className={`mt-5 break-keep font-[family:var(--font-display)] text-white/96 ${meta.valueClassName}`}
                      >
                        {meta.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  value: data.coverage.communes,
                  label: "Commune markets",
                  note: "Where valuation ranges can be localized and defended.",
                  accent: "rgba(106,179,255,0.18)",
                  num: "03",
                },
                {
                  value: data.coverage.departments,
                  label: "Departments",
                  note: "Breadth across France before deeper building-level enrichment.",
                  accent: "rgba(247,196,124,0.14)",
                  num: "04",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: 0.8, delay: 0.18 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-[36px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(9,11,18,0.98),rgba(10,12,20,0.95))] p-9 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      background: `radial-gradient(circle at 85% 18%, ${stat.accent}, transparent 28%)`,
                    }}
                  />
                  <div className="relative z-10">
                    <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-white/46">
                      No. {stat.num}
                    </p>
                    <p className="mt-4 font-[family:var(--font-display)] text-[clamp(3rem,6vw,4.8rem)] font-light leading-none tracking-[-0.05em] text-white">
                      <CountUp target={stat.value} format="int" delay={0.18 + i * 0.1} />
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.34em] text-[#bfd0f0]/64">
                      {stat.label}
                    </p>
                    <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/62">{stat.note}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 flex flex-col gap-5 border-t border-white/[0.05] pt-8 md:flex-row md:items-center md:justify-between"
        >
          <p className="max-w-2xl font-[family:var(--font-display)] text-[18px] font-light italic leading-relaxed text-white/44">
            &ldquo;Signal over noise. France should feel like a market you can underwrite, not just admire.&rdquo;
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {["Quarterly refresh", "Etalab backbone", "France-first underwriting"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.26em] text-white/46"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FranceExperience() {
  const market = useFranceMarket();
  const [propertyType, setPropertyType] = useState<PropertyType>("Appartement");
  const [area, setArea] = useState(62);
  const [rooms, setRooms] = useState(3);

  const commune = market?.addressLabel ?? "";
  const setCommune = (val: string) => market?.setAddressLabel(val);
  const inseeCode = market?.inseeCode ?? null;
  const dpeClass = market?.dpeClass ?? ("D" as DpeClass);
  const dpeLookup = market?.dpeLookup ?? null;
  const dpeLookupLoading = market?.dpeLookupLoading ?? false;
  const dpeUserOverride = market?.dpeUserOverride ?? false;

  // Compute the DVF record using the address fields from context + this section's
  // current propertyType (the provider's matchedRecord uses Appartement only).
  const normalize = (s: string) => {
    let n = s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    n = n
      .replace(/(\d+)(?:er|e|eme|ème)?\s*arrondissement/g, "$1")
      .replace(/(\d+)(?:er|e|eme|ème)\b/g, "$1");
    return n;
  };

  const addressMatch = (() => {
    if (inseeCode) {
      const found = communeRows.find(
        (row) =>
          row.property_type === propertyType &&
          dvfFullInseeCode(row.department_code, row.commune_code) === inseeCode,
      );
      if (found) return found;
    }
    const target = normalize(commune);
    return communeRows.find(
      (row) => row.property_type === propertyType && normalize(row.commune) === target,
    );
  })();

  const selectedRecord = addressMatch;

  const handleAddressPick = (addr: AddressSuggestion) => {
    market?.selectAddress(addr);
  };

  const handleDpeChange = (cls: DpeClass) => {
    market?.setDpeClass(cls);
  };

  return (
    <main className="min-h-screen bg-[#05060a] text-white">
      <CursorGlow />
      <FranceNavBar />
      <HeroSection />
      <FranceStatsSection />
      <FranceDataMoatSection />
      <FranceCommercialProductSection />
      <ValuationSection
        propertyType={propertyType}
        setPropertyType={setPropertyType}
        commune={commune}
        setCommune={setCommune}
        area={area}
        setArea={setArea}
        rooms={rooms}
        setRooms={setRooms}
        dpeClass={dpeClass}
        setDpeClass={handleDpeChange}
        selectedRecord={selectedRecord}
        addressMatch={addressMatch}
        onSelectAddress={handleAddressPick}
        dpeLookup={dpeLookup}
        dpeLookupLoading={dpeLookupLoading}
        dpeUserOverride={dpeUserOverride}
        postcode={market?.postcode ?? null}
      />
      <SectionDivider variant="ornament" />
      <FranceMapSection />
      <SectionDivider variant="chapter" chapter="Chapter V" label="Opportunity radar" />
      <FranceRadarSection />
      <SectionDivider variant="chapter" chapter="Chapter VI" label="Investment intelligence" />
      <FranceInvestmentSection />
      <SectionDivider variant="chapter" chapter="Chapter VII" label="Renovation studio" />
      <FranceReformaSection />
      <DvfLiveTicker />
      <footer className="border-t border-white/10 bg-[#05060a] px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <FonatPropLogo variant="nav" className="mb-5 h-12 w-[190px] opacity-80" />
            <p className="max-w-xl text-sm leading-7 text-white/42">
              France is a commercial beta powered by official DVF transaction processing,
              DPE context, rent regulation checks and renovation economics. Dubai remains live;
              France is a separate market surface with its own compliance logic.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex font-mono text-[10px] uppercase tracking-[0.3em] text-blue-200/70 transition hover:text-white"
            >
              Back to markets
            </Link>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 md:min-w-[360px]">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/30">
              Contact
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={FONATPROP_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[12px] text-white/62 transition hover:text-white"
              >
                WhatsApp {FONATPROP_CONTACT.whatsappDisplay}
              </a>
              <a
                href={FONATPROP_CONTACT.emailHref}
                className="font-mono text-[12px] text-white/62 transition hover:text-white"
              >
                {FONATPROP_CONTACT.email}
              </a>
            </div>
          </div>
        </div>
      </footer>
      <FranceChatWidget />
    </main>
  );
}

export default function FranceMarketClient() {
  return (
    <GoogleMapsLoader>
      <FranceMarketProvider communeRows={communeRows} propertyType="Appartement">
        <FranceExperience />
      </FranceMarketProvider>
    </GoogleMapsLoader>
  );
}
