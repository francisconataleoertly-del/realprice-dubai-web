"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

import GoogleMapsLoader from "@/app/realprice/components/GoogleMapsLoader";
import ValorarSection from "@/app/realprice/components/ValorarSection";

const API = "https://web-production-9051f.up.railway.app";
const ROOMS = ["Studio", "1 B/R", "2 B/R", "3 B/R", "4 B/R", "5 B/R"];
const TYPES = [
  { value: "Flat", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "TownHouse", label: "Townhouse" },
];

function formatAed(value: number) {
  return new Intl.NumberFormat("en-AE", {
    maximumFractionDigits: 0,
  }).format(value);
}

function WidgetPreview() {
  const [zones, setZones] = useState<string[]>([]);
  const [lead, setLead] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [property, setProperty] = useState({
    zone: "Dubai Marina",
    rooms: "1 B/R",
    area_m2: "75",
    property_type: "Flat",
  });
  const [step, setStep] = useState<"lead" | "estimate">("lead");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    low: number;
    high: number;
    value: number;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/zones`)
      .then((response) => response.json())
      .then((payload) => {
        const rawZones = Array.isArray(payload?.zones) ? payload.zones : [];
        const nextZones = Array.from(
          new Set([
            "Dubai Marina",
            "Business Bay",
            "Downtown Dubai",
            "Palm Jumeirah",
            "JVC",
            ...rawZones,
          ])
        ).sort((a, b) => a.localeCompare(b));
        setZones(nextZones);
      })
      .catch(() => {
        setZones(["Dubai Marina", "Business Bay", "Downtown Dubai", "Palm Jumeirah", "JVC"]);
      });
  }, []);

  const canCaptureLead = useMemo(() => {
    return Boolean(lead.name.trim() && lead.email.trim() && lead.phone.trim());
  }, [lead]);

  const estimate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zona: property.zone,
          rooms: property.rooms,
          area_m2: Number(property.area_m2),
          property_type: property.property_type,
          is_freehold: true,
          is_offplan: false,
          has_parking: true,
          year: new Date().getFullYear(),
          quarter: Math.floor(new Date().getMonth() / 3) + 1,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.detail || "Widget estimate failed.");
      }

      const data = await response.json();
      const value = Number(data.predicted_aed || 0);
      setResult({
        value,
        low: Math.round(value * 0.82),
        high: Math.round(value * 1.18),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Widget estimate failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="widget" className="bg-[#0a0a0f] px-6 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
            Product 02 / Broker Widget
          </p>
          <h2 className="max-w-2xl font-['Fraunces'] text-[clamp(2.4rem,5vw,5rem)] font-light leading-[0.94] tracking-[-0.04em]">
            Capture seller leads
            <br />
            <span className="italic text-white/38">inside any agency website.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-8 text-white/55">
            The agency embeds one script. Visitors leave their contact details,
            receive a broad valuation range, and the agent gets a qualified lead
            ready for WhatsApp or email follow-up.
          </p>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-white/35">
              One-line install
            </p>
            <pre className="overflow-x-auto rounded-2xl bg-black/40 p-4 text-[11px] leading-6 text-white/70">
{`<div id="fonatprop-widget"
  data-agency-id="dubana-001"
  data-agent-phone="+971501234567"
  data-agent-email="info@agency.ae">
</div>
<script src="https://fonatprop.com/widget/embed.js" async></script>`}
            </pre>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.26em] text-white/35">
              Live embed from the real script
            </p>
            <Script src="/widget/embed.js" strategy="afterInteractive" />
            <div
              id="fonatprop-widget"
              data-agency-id="demo-agency-001"
              data-agent-phone="+971501234567"
              data-agent-email="info@agency.ae"
              data-brand-color="#3b82f6"
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
          <div className="rounded-[24px] bg-white p-6 text-[#111827]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  FonatProp Widget
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Estimate your property value
                </h3>
              </div>
              <span className="rounded-full bg-[#3b82f6]/10 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                Live API
              </span>
            </div>

            {step === "lead" ? (
              <div className="space-y-4">
                {[
                  { key: "name", label: "Name", type: "text", placeholder: "Your name" },
                  { key: "email", label: "Email", type: "email", placeholder: "you@email.com" },
                  { key: "phone", label: "Phone", type: "tel", placeholder: "+971 50 123 4567" },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {field.label}
                    </span>
                    <input
                      type={field.type}
                      value={lead[field.key as keyof typeof lead]}
                      onChange={(event) =>
                        setLead((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#3b82f6]"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={!canCaptureLead}
                  onClick={() => setStep("estimate")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-white transition hover:scale-[1.01] disabled:opacity-45"
                >
                  Get valuation <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Zone
                  </span>
                  <select
                    value={property.zone}
                    onChange={(event) =>
                      setProperty((current) => ({ ...current, zone: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#3b82f6]"
                  >
                    {(zones.length ? zones : ["Dubai Marina"]).map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Rooms
                    </span>
                    <select
                      value={property.rooms}
                      onChange={(event) =>
                        setProperty((current) => ({ ...current, rooms: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#3b82f6]"
                    >
                      {ROOMS.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Area m2
                    </span>
                    <input
                      type="number"
                      min={20}
                      value={property.area_m2}
                      onChange={(event) =>
                        setProperty((current) => ({ ...current, area_m2: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#3b82f6]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200">
                  {TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setProperty((current) => ({
                          ...current,
                          property_type: type.value,
                        }))
                      }
                      className={`px-3 py-3 text-xs font-semibold transition ${
                        property.property_type === type.value
                          ? "bg-[#111827] text-white"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void estimate()}
                  className="w-full rounded-xl bg-[#111827] px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-white transition hover:scale-[1.01] disabled:opacity-45"
                >
                  {loading ? "Estimating..." : "Estimate"}
                </button>

                {error ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                {result ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Client-facing range
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                      AED {formatAed(result.low)} - {formatAed(result.high)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Internal AVM value: AED {formatAed(result.value)}. The widget
                      intentionally shows a wider range so agents keep the follow-up.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <a
                        href="https://wa.me/971501234567"
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                      >
                        <MessageCircle size={16} /> WhatsApp
                      </a>
                      <a
                        href="mailto:info@agency.ae"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        <Mail size={16} /> Email
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BrokerDemoClient() {
  return (
    <div className="bg-[#0a0a0f] text-white">
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/dubai-slides/05-downtown-night.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-[#0a0a0f]/82 to-[#0a0a0f]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.36em] text-white/38">
            FonatProp / Broker Sales Demo
          </p>
          <h1 className="max-w-5xl font-['Fraunces'] text-[clamp(3rem,7vw,7rem)] font-light leading-[0.9] tracking-[-0.05em]">
            Sell the valuation engine.
            <br />
            <span className="italic text-white/40">Then install the widget.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[16px] leading-8 text-white/58">
            A focused presentation surface for agencies: precise AVM for the
            agent, lead-capture widget for their website, no unfinished platform
            modules in the way.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#valuation"
              className="bg-white px-7 py-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[#0a0a0f]"
            >
              Open valuation
            </a>
            <a
              href="#widget"
              className="border border-white/15 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.28em] text-white/70"
            >
              Show widget
            </a>
          </div>
          <div className="mt-12 grid max-w-4xl gap-3 md:grid-cols-3">
            {[
              "234K+ Dubai transaction evidence",
              "R2 0.889 / MAPE 12.7%",
              "Broker widget with lead capture",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="valuation">
        <GoogleMapsLoader>
          <ValorarSection publicDemo />
        </GoogleMapsLoader>
      </div>

      <WidgetPreview />
    </div>
  );
}
