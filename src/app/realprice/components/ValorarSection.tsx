"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Check } from "lucide-react";
import CountUp from "react-countup";
import { useGoogleMaps } from "./GoogleMapsLoader";

const AUTH_API = "/api/fonatprop";
const PUBLIC_API = "https://web-production-9051f.up.railway.app";

const TYPES = [
  { value: "Flat", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "TownHouse", label: "Townhouse" },
];

const ROOMS = ["Studio", "1 B/R", "2 B/R", "3 B/R", "4 B/R", "5 B/R"];

const MANUAL_ZONE_ALIASES: Record<string, string> = {
  "dubai marina": "Dubai Marina",
  "marsa dubai": "Dubai Marina",
  "business bay": "Business Bay",
  "downtown dubai": "Downtown Dubai",
  "burj khalifa": "Downtown Dubai",
  "difc": "DIFC",
  "dubai international financial centre": "DIFC",
  "jumeirah village circle": "JVC",
  "jvc": "JVC",
  "jumeirah lake towers": "JLT",
  "jlt": "JLT",
  "dubai hills": "Dubai Hills",
  "dubai hills estate": "Dubai Hills",
  "mbr city": "MBR City",
  "meydan": "MBR City",
  "palm jumeirah": "Palm Jumeirah",
  "jumeirah beach residence": "Dubai Marina",
  "jbr": "Dubai Marina",
  "dubai silicon oasis": "Dubai Silicon Oasis",
  "silicon oasis": "Dubai Silicon Oasis",
  "jumeirah village triangle": "JVT",
  "jvt": "JVT",
};

interface Result {
  zona: string;
  rooms: string;
  area_m2: number;
  predicted_aed: number;
  predicted_usd: number;
  predicted_per_sqft_aed: number;
  confidence_low_aed: number;
  confidence_high_aed: number;
  property_type: string;
  model_version: string;
  inference_source?: string;
  inferred_details_used?: boolean;
  source_support_count?: number;
  source_recent_count?: number;
  source_dominance_pct?: number;
  inferred_is_freehold?: boolean;
  inferred_is_offplan?: boolean;
  inferred_has_parking?: boolean;
  resolved_zone?: string;
  resolved_building?: string;
  valuation_mode?: string;
  unit_distribution_source?: string;
  unit_distribution_count?: number;
  unit_area_segment?: string;
  unit_distribution_anchor_aed?: number;
  unit_distribution_low_aed?: number;
  unit_distribution_high_aed?: number;
}

interface Comparable {
  date: string;
  building: string;
  rooms: string;
  area_m2: number;
  price_aed: number;
  type: string;
}

interface ZonesPayload {
  count?: number;
  zones?: string[];
  aliases?: Record<string, string>;
}

interface FormState {
  zona: string;
  rooms: string | null;
  area_m2: string;
  is_freehold: boolean | null;
  is_offplan: boolean | null;
  has_parking: boolean | null;
  property_type: string | null;
  building_name: string | null;
  year: string;
  quarter: number;
}

type GoogleAddressComponent =
  | google.maps.GeocoderAddressComponent
  | google.maps.places.AddressComponent;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

function safeJsonParse<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

function parseZonesPayload(raw: unknown): ZonesPayload {
  if (typeof raw === "string") {
    return safeJsonParse<ZonesPayload>(raw) || {};
  }
  if (raw && typeof raw === "object") {
    return raw as ZonesPayload;
  }
  return {};
}

function getComponentLongName(component: GoogleAddressComponent) {
  return ("long_name" in component ? component.long_name : component.longText) || "";
}

function getComponentShortName(component: GoogleAddressComponent) {
  return ("short_name" in component ? component.short_name : component.shortText) || "";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function TriStateToggle({
  value,
  onChange,
  label,
  yesLabel,
  noLabel,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  label: string;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 block">
        {label}
      </label>
      <div className="grid grid-cols-3 border border-white/[0.08] rounded-lg overflow-hidden">
        {[
          { label: "-", value: null },
          { label: yesLabel, value: true },
          { label: noLabel, value: false },
        ].map((option) => (
          <button
            key={`${label}-${option.label}`}
            type="button"
            onClick={() => onChange(option.value)}
            className={`py-3 text-[10px] md:text-[11px] tracking-[0.18em] uppercase transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
              value === option.value
                ? "bg-white text-[#0a0a0f]"
                : "text-white/30 hover:bg-white/[0.04] hover:text-white/60"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PriceGauge({
  value,
  low,
  high,
}: {
  value: number;
  low: number;
  high: number;
}) {
  const range = Math.max(high - low, 1);
  const position = Math.max(0, Math.min(100, ((value - low) / range) * 100));
  return (
    <div className="relative pt-4">
      <div className="relative h-[3px] rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: position / 100 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ transformOrigin: "left" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400/80 via-white/80 to-amber-400/80 rounded-full"
        />
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `${position}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#0a0a0f]"
          style={{ marginLeft: -6, boxShadow: "0 0 12px rgba(255,255,255,0.6)" }}
        />
      </div>
      <div className="flex justify-between mt-3 text-[9px] font-mono tracking-widest uppercase">
        <span className="text-green-400/70">Low AED {fmt(low)}</span>
        <span className="text-amber-400/70">High AED {fmt(high)}</span>
      </div>
    </div>
  );
}

export default function ValorarSection({
  publicDemo = false,
}: {
  publicDemo?: boolean;
}) {
  const apiBase = publicDemo ? PUBLIC_API : AUTH_API;
  const addressInferenceEndpoint = publicDemo
    ? "/api/predict-address"
    : "/api/predict-address";
  const googleLoaded = useGoogleMaps();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [zoneOptions, setZoneOptions] = useState<string[]>([]);
  const [zoneAliases, setZoneAliases] = useState<Record<string, string>>({});
  const [addressSelected, setAddressSelected] = useState(false);
  const [addressText, setAddressText] = useState("");
  const [focused, setFocused] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const [form, setForm] = useState<FormState>({
    zona: "",
    rooms: null,
    area_m2: "",
    is_freehold: null,
    is_offplan: null,
    has_parking: null,
    property_type: null,
    building_name: null,
    year: "",
    quarter: currentQuarter,
  });

  const [result, setResult] = useState<Result | null>(null);
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allZoneCandidates = useMemo(() => {
    return Array.from(
      new Set([
        ...zoneOptions,
        ...Object.keys(zoneAliases),
        ...Object.values(zoneAliases),
        ...Object.values(MANUAL_ZONE_ALIASES),
      ])
    );
  }, [zoneAliases, zoneOptions]);

  const canSubmit =
    Boolean(form.zona) &&
    Boolean(form.property_type) &&
    Boolean(form.rooms) &&
    Boolean(form.area_m2) &&
    Number(form.area_m2) >= 20;
  const canInferFromAddress = Boolean(
    addressSelected && (form.zona || form.building_name || addressText)
  );
  const canRequest = canSubmit || (!publicDemo && canInferFromAddress);

  const resolveZoneFromSignals = (signals: string[]) => {
    const directMap = new Map<string, string>();

    allZoneCandidates.forEach((zone) => {
      directMap.set(normalizeText(zone), zone);
    });

    Object.entries(MANUAL_ZONE_ALIASES).forEach(([alias, zone]) => {
      directMap.set(normalizeText(alias), zone);
    });

    const normalizedSignals = signals.map(normalizeText).filter(Boolean);

    for (const signal of normalizedSignals) {
      if (directMap.has(signal)) {
        return directMap.get(signal) || null;
      }
    }

    const sortedCandidates = Array.from(directMap.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const signal of normalizedSignals) {
      for (const [candidate, zone] of sortedCandidates) {
        if (signal.includes(candidate) || candidate.includes(signal)) {
          return zone;
        }
      }
    }

    return null;
  };

  const applyResolvedAddress = ({
    formattedAddress,
    name,
    components,
  }: {
    formattedAddress: string;
    name?: string | null;
    components: GoogleAddressComponent[];
  }) => {
    const signals: string[] = [formattedAddress];
    let buildingName: string | null = name || null;

    for (const component of components || []) {
      signals.push(getComponentLongName(component), getComponentShortName(component));
      if (
        !buildingName &&
        (component.types.includes("premise") ||
          component.types.includes("subpremise") ||
          component.types.includes("establishment") ||
          component.types.includes("point_of_interest"))
      ) {
        buildingName = getComponentLongName(component);
      }
    }

    const matchedZone = resolveZoneFromSignals(signals);

    setAddressText(formattedAddress);
    setAddressSelected(true);
    setError("");
    setResult(null);
    setComparables([]);
    setForm((prev) => ({
      ...prev,
      zona: matchedZone || prev.zona || "",
      building_name: buildingName || prev.building_name,
    }));
  };

  const resolveTypedAddress = async () => {
    if (!googleLoaded || !addressInputRef.current) return;
    const rawValue = addressInputRef.current.value.trim();
    if (!rawValue) return;

    const googleApi = (window as any).google;
    if (!googleApi?.maps?.Geocoder) return;

    setResolvingAddress(true);
    setError("");

    try {
      const geocoder = new googleApi.maps.Geocoder();
      const response = await geocoder.geocode({
        address: rawValue,
        componentRestrictions: { country: "AE" },
      });

      const first = response?.results?.[0];
      if (!first) {
        throw new Error("We could not resolve that Dubai address.");
      }

      applyResolvedAddress({
        formattedAddress: first.formatted_address,
        name: rawValue,
        components: first.address_components || [],
      });
    } catch (addressError) {
      setAddressSelected(false);
      setError(
        addressError instanceof Error
          ? addressError.message
          : "We could not resolve that Dubai address."
      );
    } finally {
      setResolvingAddress(false);
    }
  };

  useEffect(() => {
    fetch(`${apiBase}/zones`)
      .then((response) => response.text())
      .then((raw) => {
        const parsed = parseZonesPayload(raw);
        const aliases =
          parsed.aliases && typeof parsed.aliases === "object" ? parsed.aliases : {};
        const merged = Array.from(
          new Set([
            ...(Array.isArray(parsed.zones) ? parsed.zones : []),
            ...Object.keys(aliases),
            ...Object.values(aliases),
            ...Object.values(MANUAL_ZONE_ALIASES),
          ])
        ).sort((a, b) => a.localeCompare(b));

        setZoneAliases(aliases);
        setZoneOptions(merged);
      })
      .catch(() => {
        setZoneOptions([
          "Business Bay",
          "Dubai Marina",
          "Downtown Dubai",
          "Palm Jumeirah",
          "JVC",
          "JLT",
          "Dubai Hills",
          "DIFC",
        ]);
      });
  }, [apiBase]);

  useEffect(() => {
    if (!googleLoaded || !addressInputRef.current) return;
    const googleApi = (window as any).google;
    if (!googleApi?.maps?.places) return;

    const autocomplete = new googleApi.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "ae" },
        fields: ["address_components", "name", "formatted_address"],
      }
    );

    autocompleteRef.current = autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place?.formatted_address || !place?.address_components) return;

      applyResolvedAddress({
        formattedAddress: place.formatted_address,
        name: place.name,
        components: place.address_components,
      });
    });

    return () => {
      autocompleteRef.current = null;
    };
  }, [googleLoaded, allZoneCandidates]);

  const submit = async () => {
    if (!canRequest) {
      setError("Start with a Dubai address to request a valuation.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setComparables([]);

    try {
      const useAddressInference = !canSubmit;
      const payload: Record<string, unknown> = {
        zona: form.zona || undefined,
        building_name: form.building_name || undefined,
        quarter: currentQuarter,
      };

      if (form.rooms) payload.rooms = form.rooms;
      if (form.area_m2) payload.area_m2 = Number(form.area_m2);
      if (form.property_type) payload.property_type = form.property_type;
      if (form.is_freehold !== null) payload.is_freehold = form.is_freehold;
      if (form.is_offplan !== null) payload.is_offplan = form.is_offplan;
      if (form.has_parking !== null) payload.has_parking = form.has_parking;
      payload.year = form.year ? Number(form.year) : currentYear;
      if (useAddressInference) payload.address = addressText;

      if (publicDemo && useAddressInference) {
        throw new Error(
          "For the broker demo, add rooms, area and property type to show a precise valuation."
        );
      }

      const response = await fetch(useAddressInference ? addressInferenceEndpoint : `${apiBase}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const apiError = await response.json().catch(() => ({}));
        throw new Error(apiError.detail || `Error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setForm((prev) => ({
        ...prev,
        zona: data.resolved_zone || data.zona || prev.zona,
        building_name: data.resolved_building || prev.building_name,
        property_type: prev.property_type || data.property_type || null,
        rooms: prev.rooms || data.rooms || null,
        area_m2: prev.area_m2 || String(data.area_m2 ?? ""),
        year: prev.year || String(payload.year || currentYear),
        is_freehold:
          prev.is_freehold !== null
            ? prev.is_freehold
            : data.inferred_is_freehold ?? prev.is_freehold,
        is_offplan:
          prev.is_offplan !== null
            ? prev.is_offplan
            : data.inferred_is_offplan ?? prev.is_offplan,
        has_parking:
          prev.has_parking !== null
            ? prev.has_parking
            : data.inferred_has_parking ?? prev.has_parking,
      }));

      fetch(`${apiBase}/comparables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zona: data.resolved_zone || data.zona,
          rooms: data.rooms,
          property_type: data.property_type,
          limit: 5,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.comparables) setComparables(d.comparables.slice(0, 5));
        })
        .catch(() => {});
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="valorar" className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 md:bg-fixed"
        style={{
          backgroundImage: "url('/dubai-valuation-bg.jpg')",
          filter: focused ? "blur(4px) scale(1.03)" : "blur(0px) scale(1)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/75 to-[#0a0a0f]" />

      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-28 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">
              Chapter III
            </span>
            <div className="w-12 h-px bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-white/35">
              Valuation
            </span>
          </div>
          <h2 className="font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em] text-white max-w-4xl">
            Know the real value
            <br />
            <span className="italic font-extralight text-white/40">
              of your property.
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative mx-auto max-w-3xl mb-20"
        >
          <motion.div
            animate={{ opacity: focused ? 1 : 0.3, scale: focused ? 1.02 : 1 }}
            transition={{ duration: 0.5 }}
            className="absolute -inset-4 rounded-full bg-gradient-to-r from-white/[0.05] via-white/[0.1] to-white/[0.05] blur-2xl pointer-events-none"
          />

          <div
            className={`relative flex items-center gap-5 px-8 py-6 border rounded-full bg-[#0a0a0f]/60 backdrop-blur-2xl transition-all duration-500 ${
              focused
                ? "border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.08)]"
                : "border-white/10"
            }`}
          >
            <div className="relative flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-white/40"
              />
              <MapPin size={20} className="relative text-white/60" strokeWidth={1.5} />
            </div>

            <input
              ref={addressInputRef}
              type="text"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(event) => {
                setAddressSelected(false);
                setAddressText(event.target.value);
                setResult(null);
                setComparables([]);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void resolveTypedAddress();
                }
                if (event.key === "Escape") {
                  setAddressSelected(false);
                }
              }}
              placeholder="Type a Dubai address to begin..."
              className="flex-1 bg-transparent text-[18px] md:text-[22px] text-white placeholder-white/25 outline-none font-['Fraunces'] font-light tracking-tight"
            />

            <AnimatePresence>
              {addressSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <Check size={14} className="text-white/80" strokeWidth={2} />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void resolveTypedAddress()}
              className="hidden md:flex px-3 py-2 rounded border border-white/10 text-[10px] font-mono tracking-wider text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              {resolvingAddress ? "..." : "ENTER"}
            </button>
          </div>

          {addressText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4 font-mono text-[11px] text-white/30 tracking-wide"
            >
              {addressText}
            </motion.p>
          )}

          {!addressSelected && (
            <p className="text-center mt-3 font-mono text-[10px] text-white/25 tracking-[0.25em] uppercase">
              Select a Google suggestion or press Enter
            </p>
          )}
        </motion.div>

        <AnimatePresence>
          {addressSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
                  }}
                  className="relative bg-[#0a0a0f]/70 backdrop-blur-2xl border-t border-b border-white/[0.08] p-10 md:p-12 space-y-8"
                >
                  <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20" />

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                    className="grid grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">
                        Zone
                      </label>
                      <select
                        value={form.zona}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, zona: e.target.value }))
                        }
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white focus:border-white/40 outline-none transition-all duration-500 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#111]">
                          -
                        </option>
                        {zoneOptions.map((zone) => (
                          <option key={zone} value={zone} className="bg-[#111]">
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">
                        Building
                      </label>
                      <input
                        type="text"
                        value={form.building_name || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            building_name: e.target.value || null,
                          }))
                        }
                        placeholder="Optional"
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white placeholder-white/15 focus:border-white/40 outline-none transition-all duration-500"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                  >
                    <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-3 block">
                      Type
                    </label>
                    <div className="grid grid-cols-4 border border-white/[0.08] rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            property_type: null,
                          }))
                        }
                        className={`py-3 text-[12px] tracking-wide transition-all duration-300 border-r border-white/[0.04] ${
                          !form.property_type
                            ? "bg-white text-[#0a0a0f]"
                            : "text-white/30 hover:bg-white/[0.04] hover:text-white/60"
                        }`}
                      >
                        -
                      </button>
                      {TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              property_type: type.value,
                            }))
                          }
                          className={`py-3 text-[12px] tracking-wide transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
                            form.property_type === type.value
                              ? "bg-white text-[#0a0a0f]"
                              : "text-white/30 hover:bg-white/[0.04] hover:text-white/60"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                    className="grid grid-cols-3 gap-6"
                  >
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">
                        Rooms
                      </label>
                      <select
                        value={form.rooms || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            rooms: e.target.value || null,
                          }))
                        }
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white focus:border-white/40 outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#111]">
                          -
                        </option>
                        {ROOMS.map((room) => (
                          <option key={room} value={room} className="bg-[#111]">
                            {room}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">
                        Area m&sup2;
                      </label>
                      <input
                        type="number"
                        min={20}
                        max={1000}
                        value={form.area_m2}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            area_m2: e.target.value,
                          }))
                        }
                        placeholder="-"
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono placeholder-white/20 focus:border-white/40 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2 block">
                        Year
                      </label>
                      <input
                        type="number"
                        value={form.year}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            year: e.target.value,
                          }))
                        }
                        placeholder="-"
                        className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-[15px] text-white font-mono placeholder-white/20 focus:border-white/40 outline-none"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                    className="space-y-4 pt-2"
                  >
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/20">
                      Optional details stay neutral until you choose them.
                    </p>
                    <TriStateToggle
                      value={form.is_freehold}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          is_freehold: value,
                        }))
                      }
                      label="Ownership"
                      yesLabel="Freehold"
                      noLabel="Leasehold"
                    />
                    <TriStateToggle
                      value={
                        form.is_offplan === null ? null : !form.is_offplan
                      }
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          is_offplan: value === null ? null : !value,
                        }))
                      }
                      label="Status"
                      yesLabel="Ready"
                      noLabel="Off-Plan"
                    />
                    <TriStateToggle
                      value={form.has_parking}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          has_parking: value,
                        }))
                      }
                      label="Parking"
                      yesLabel="Included"
                      noLabel="No Parking"
                    />
                  </motion.div>

                  <motion.button
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                    onClick={submit}
                    disabled={loading || !canRequest}
                    type="button"
                    className="group relative w-full py-5 bg-white text-[#0a0a0f] text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-white/90 disabled:opacity-40 transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="inline-block w-4 h-4 border border-[#0a0a0f] border-t-transparent rounded-full"
                          />
                          Calculating...
                        </>
                      ) : (
                        <>
                          {canSubmit ? "Request Valuation" : "Value from Address"}
                          <span className="transition-transform duration-500 group-hover:translate-x-1.5">
                            &rarr;
                          </span>
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.div>

                <div className="relative">
                  {error && (
                    <div className="w-full border-l-2 border-red-500/50 pl-4 py-2">
                      <p className="font-mono text-[12px] text-red-400">{error}</p>
                    </div>
                  )}

                  {!error && !result && (
                    <div className="w-full border-l-2 border-white/[0.08] pl-4 py-2">
                      <p className="font-mono text-[11px] text-white/35 tracking-[0.2em] uppercase">
                        {canSubmit
                          ? "Manual details are ready. Request the valuation when you want."
                          : publicDemo
                            ? "Add rooms, area and property type so the broker demo shows a precise AVM result."
                          : "We can infer property details from the address, building and recent market evidence."}
                      </p>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {result && (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-10"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-5">
                            <p className="font-['Fraunces'] italic text-[13px] font-light text-white/40">
                              Result
                            </p>
                            <div className="flex-1 h-px bg-white/[0.08]" />
                            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30">
                              Estimated Value
                            </p>
                          </div>
                          <p className="font-['Fraunces'] text-[clamp(2.5rem,6vw,5rem)] font-extralight leading-[0.9] tracking-[-0.03em] text-white tabular-nums">
                            <span className="font-mono font-light text-white/25 text-[0.3em] mr-3 align-top mt-6 inline-block">
                              AED
                            </span>
                            <CountUp
                              start={0}
                              end={result.predicted_aed}
                              duration={2.0}
                              separator=","
                              useEasing
                            />
                          </p>
                          <p className="font-mono text-[13px] text-white/20 mt-4 tracking-wider">
                            USD{" "}
                            <CountUp
                              start={0}
                              end={result.predicted_usd}
                              duration={1.8}
                              separator=","
                            />
                          </p>
                          {result.inference_source && (
                            <p className="mt-4 font-mono text-[10px] tracking-[0.24em] uppercase text-white/35">
                              Inferred from {result.inference_source} evidence · {result.property_type} · {result.rooms} · {fmt(result.area_m2)} m²
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2">
                            Confidence Range &plusmn;12.7%
                          </p>
                          <PriceGauge
                            value={result.predicted_aed}
                            low={result.confidence_low_aed}
                            high={result.confidence_high_aed}
                          />
                        </div>

                        {result.unit_distribution_source && (
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35">
                              Unit position
                            </p>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-white/30">Scope</p>
                                <p className="mt-1 font-mono uppercase text-white/70">
                                  {result.unit_distribution_source}
                                </p>
                              </div>
                              <div>
                                <p className="text-white/30">Segment</p>
                                <p className="mt-1 font-mono uppercase text-white/70">
                                  {result.unit_area_segment || "typical"}
                                </p>
                              </div>
                              <div>
                                <p className="text-white/30">Evidence</p>
                                <p className="mt-1 font-mono uppercase text-white/70">
                                  {result.unit_distribution_count || 0} txns
                                </p>
                              </div>
                            </div>
                            {result.unit_distribution_low_aed && result.unit_distribution_high_aed && (
                              <p className="mt-4 font-mono text-[11px] tracking-[0.18em] uppercase text-white/35">
                                Comparable band AED {fmt(result.unit_distribution_low_aed)} - AED {fmt(result.unit_distribution_high_aed)}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2">
                              Per sqft
                            </p>
                            <p className="font-['Fraunces'] text-[28px] font-extralight text-white">
                              <span className="text-white/25 text-[0.6em] mr-1">AED</span>
                              <CountUp
                                start={0}
                                end={result.predicted_per_sqft_aed}
                                duration={1.6}
                                separator=","
                              />
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2">
                              Per m&sup2;
                            </p>
                            <p className="font-['Fraunces'] text-[28px] font-extralight text-white">
                              <span className="text-white/25 text-[0.6em] mr-1">AED</span>
                              <CountUp
                                start={0}
                                end={Math.round(result.predicted_aed / result.area_m2)}
                                duration={1.6}
                                separator=","
                              />
                            </p>
                          </div>
                        </div>

                        {comparables.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="border-t border-white/[0.06] pt-6"
                          >
                            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35 mb-4">
                              Recent Comparables
                            </p>
                            <div className="space-y-2">
                              {comparables.map((comparable, index) => (
                                <motion.div
                                  key={`${comparable.building}-${index}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
                                  className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0 text-[12px]"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white/50 truncate">
                                      {comparable.building}
                                    </p>
                                    <p className="text-white/20 text-[10px] font-mono">
                                      {comparable.date} &middot; {comparable.rooms} &middot;{" "}
                                      {comparable.area_m2}m&sup2;
                                    </p>
                                  </div>
                                  <p className="font-mono text-white/70 ml-4 shrink-0">
                                    AED {fmt(comparable.price_aed)}
                                  </p>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!result && !error && !loading && (
                    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <p className="font-['Fraunces'] italic text-white/15 text-[20px] font-light max-w-[280px] mx-auto leading-[1.4]">
                          Complete the form to receive an estimated value.
                        </p>
                        <div className="w-8 h-px bg-white/10 mx-auto" />
                        <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/15">
                          Awaiting input
                        </p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="space-y-6">
                      <div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse" />
                      <div className="h-16 w-full bg-white/[0.05] rounded animate-pulse" />
                      <div className="h-3 w-full bg-white/[0.05] rounded animate-pulse" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-white/[0.05] rounded animate-pulse" />
                        <div className="h-20 bg-white/[0.05] rounded animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-24 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-white/[0.04]"
        >
          <p className="font-['Fraunces'] italic font-light text-white/30 text-[13px]">
            Trained on 234,079 verified DLD transactions &mdash; updated daily.
          </p>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/25">
            R&sup2; 0.889 &middot; MAPE 12.7% &middot; 81.6% Within 20%
          </p>
        </motion.div>
      </div>
    </section>
  );
}
