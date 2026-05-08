"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, Mail, X } from "lucide-react";

import RevealOnScroll from "@/components/design/RevealOnScroll";
import TiltCard from "@/components/design/TiltCard";

type Section = "valuation" | "investment" | "reforma";

const SECTION_COPY: Record<Section, { title: string; promise: string }> = {
  valuation: {
    title: "Get the full FonatProp valuation report",
    promise:
      "Address-anchored estimate, DPE source breakdown, DVF reliability, and printable summary.",
  },
  investment: {
    title: "Get the full FonatProp investment report",
    promise:
      "Tax-regime cash flow, IFI flag, mortgage schedule, 10-year projection and yield benchmark.",
  },
  reforma: {
    title: "Get the full FonatProp renovation report",
    promise:
      "Scope-by-scope cost ranges, MaPrimeRénov subsidies, reduced TVA breakdown, Éco-PTZ savings, ROI band.",
  },
};

const STORAGE_KEY = "fonatprop_lead_email_v1";

type Props = {
  section: Section;
  snapshot?: Record<string, unknown>;
  printTargetId?: string;
};

export default function FranceReportCTA({ section, snapshot, printTargetId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Restore email + submitted flag from localStorage so users don't re-key on every section.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { email?: string; submittedAt?: string };
        if (parsed.email) setEmail(parsed.email);
        if (parsed.submittedAt) setSubmitted(true);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open]);

  const triggerPrint = () => {
    if (printTargetId && typeof document !== "undefined") {
      document.body.setAttribute("data-print-section", printTargetId);
    }
    if (typeof window !== "undefined") {
      window.print();
    }
    if (printTargetId && typeof document !== "undefined") {
      // Clear the attribute on the next tick so subsequent prints work.
      setTimeout(() => document.body.removeAttribute("data-print-section"), 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/france/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phone, section, snapshot }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ email, submittedAt: new Date().toISOString() }),
      );
      setSubmitted(true);
      setOpen(false);
      // Give the user a moment to register the close animation, then trigger print.
      setTimeout(triggerPrint, 250);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // If the user already submitted email earlier, skip the gate and print directly.
  const handlePrimaryClick = () => {
    if (submitted) {
      triggerPrint();
    } else {
      setOpen(true);
    }
  };

  const copy = SECTION_COPY[section];

  return (
    <>
      <RevealOnScroll className="print:hidden">
      <TiltCard maxTilt={4} lift={6} innerClassName="rounded-2xl">
      <div className="fonatprop-lift fp-gradient-border flex flex-col items-stretch gap-3 rounded-2xl border border-blue-300/15 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-5 hover:border-blue-300/35 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-blue-200/70">
            FonatProp full report
          </p>
          <p className="mt-2 font-['Fraunces'] text-[18px] font-light leading-tight tracking-tight text-white">
            {copy.title}
          </p>
          <p className="mt-1 max-w-md text-[12px] leading-relaxed text-white/55">
            {copy.promise}
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="fonatprop-focus fonatprop-pulse group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-[#0a0a0f] transition hover:bg-white/90"
        >
          {submitted ? (
            <>
              <Download size={14} className="transition-transform group-hover:translate-y-0.5" />
              Save PDF
            </>
          ) : (
            <>
              <Mail size={14} />
              Unlock report
            </>
          )}
        </button>
      </div>
      </TiltCard>
      </RevealOnScroll>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm print:hidden"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="france-lead-modal-title"
        >
          <div
            ref={dialogRef}
            className="relative w-[min(92vw,460px)] rounded-2xl border border-white/10 bg-[#0a0a0f] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full border border-white/10 p-1.5 text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              <X size={14} />
            </button>

            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-blue-200/70">
              {section} report
            </p>
            <h3
              id="france-lead-modal-title"
              className="mt-2 font-['Fraunces'] text-[26px] font-light leading-tight tracking-tight text-white"
            >
              {copy.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">{copy.promise}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0d14] px-3 text-sm text-white outline-none transition focus:border-blue-300/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (optional)"
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0d14] px-3 text-sm text-white outline-none transition focus:border-blue-300/40"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0d14] px-3 text-sm text-white outline-none transition focus:border-blue-300/40"
                />
              </div>

              {error ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-[#0a0a0f] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {submitting ? "Sending…" : "Unlock & save PDF"}
              </button>

              <p className="text-center font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
                We email you the report. No spam, GDPR-aligned.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
