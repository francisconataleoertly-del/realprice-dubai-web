"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import MandatePackReport from "@/components/mandate-pack/MandatePackReport";
import { demoDubaiMandatePack } from "@/data/mandate-pack-demo";
import {
  applyBrandProfileToReport,
  buildBrandProfileFromReport,
  clearMandatePackBrandProfile,
  loadMandatePackBrandProfile,
  saveMandatePackBrandProfile,
  type MandatePackBrandProfile,
} from "@/lib/mandate-pack-branding";
import {
  buildMandatePackFromDubaiSession,
  loadDubaiMandatePackHistory,
  loadLatestDubaiMandatePackSession,
  type DubaiMandatePackSession,
} from "@/lib/mandate-pack";

type Props = {
  sellerDefault?: boolean;
};

export default function MandatePackPageClient({ sellerDefault = false }: Props) {
  const [mode, setMode] = useState<"broker" | "seller">(sellerDefault ? "seller" : "broker");
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [baseReport, setBaseReport] = useState(demoDubaiMandatePack);
  const [isLiveReport, setIsLiveReport] = useState(false);
  const [history, setHistory] = useState<DubaiMandatePackSession[]>([]);
  const [brandProfile, setBrandProfile] = useState<MandatePackBrandProfile>(
    buildBrandProfileFromReport(demoDubaiMandatePack),
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const report = useMemo(
    () => applyBrandProfileToReport(baseReport, brandProfile),
    [baseReport, brandProfile],
  );

  useEffect(() => {
    const latest = loadLatestDubaiMandatePackSession();
    const savedHistory = loadDubaiMandatePackHistory();
    const savedBrand = loadMandatePackBrandProfile();
    setHistory(savedHistory);
    setBrandProfile(savedBrand || buildBrandProfileFromReport(latest?.result ? buildMandatePackFromDubaiSession(latest) : demoDubaiMandatePack));
    if (latest?.result) {
      setBaseReport(buildMandatePackFromDubaiSession(latest));
      setIsLiveReport(true);
    }
  }, []);

  useEffect(() => {
    saveMandatePackBrandProfile(brandProfile);
  }, [brandProfile]);

  const loadSession = (session: DubaiMandatePackSession) => {
    setBaseReport(buildMandatePackFromDubaiSession(session));
    setIsLiveReport(true);
  };

  const updateBrandField = <K extends keyof MandatePackBrandProfile>(key: K, value: MandatePackBrandProfile[K]) => {
    setBrandProfile((current) => ({ ...current, [key]: value }));
  };

  const onLogoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read logo"));
      reader.readAsDataURL(file);
    });

    updateBrandField("logoDataUrl", dataUrl);
    event.target.value = "";
  };

  const resetBranding = () => {
    const fallback = buildBrandProfileFromReport(baseReport);
    clearMandatePackBrandProfile();
    setBrandProfile(fallback);
  };

  const copySellerLink = async () => {
    try {
      const url = `${window.location.origin}/broker-demo/mandate-pack?seller=1`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const response = await fetch("/api/mandate-pack/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, mode }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.id || "mandate-pack"}-${mode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b11] px-5 py-12 text-white print:bg-white print:px-0 print:py-0 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:hidden md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-blue-200/60">
              Broker demo / Mandate Pack MVP
            </p>
            <h1 className="mt-3 font-['Fraunces'] text-[clamp(2rem,4vw,3.8rem)] font-light tracking-[-0.05em]">
              Seller-ready valuation report.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/56">
              This is the deliverable the broker can share after the private AI valuation:
              recommended price, confidence, comparable evidence and next steps.
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">
              {isLiveReport ? "Live from latest Dubai valuation" : "Using demo report data"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("broker")}
              className={`rounded-full px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] transition ${
                mode === "broker"
                  ? "bg-white text-[#0a0a0f]"
                  : "border border-white/12 text-white/68 hover:border-white/22 hover:text-white"
              }`}
            >
              Broker view
            </button>
            <button
              type="button"
              onClick={() => setMode("seller")}
              className={`rounded-full px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] transition ${
                mode === "seller"
                  ? "bg-white text-[#0a0a0f]"
                  : "border border-white/12 text-white/68 hover:border-white/22 hover:text-white"
              }`}
            >
              Seller view
            </button>
            <button
              type="button"
              onClick={copySellerLink}
              className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/68 transition hover:border-white/22 hover:text-white"
            >
              {copied ? "Seller link copied" : "Copy seller link"}
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/68 transition hover:border-white/22 hover:text-white"
            >
              {downloadingPdf ? "Preparing PDF" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/68 transition hover:border-white/22 hover:text-white"
            >
              Print view
            </button>
            <Link
              href="/broker-demo"
              className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/68 transition hover:border-white/22 hover:text-white"
            >
              Back to demo
            </Link>
          </div>
        </div>

        <div className="mb-8 rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34">
                Agency branding
              </p>
              <p className="mt-2 text-sm text-white/56">
                Set the agency, broker and logo once. The live preview and the PDF will use this branding.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/68 transition hover:border-white/22 hover:text-white"
              >
                Upload logo
              </button>
              <button
                type="button"
                onClick={() => updateBrandField("logoDataUrl", null)}
                className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/68 transition hover:border-white/22 hover:text-white"
              >
                Remove logo
              </button>
              <button
                type="button"
                onClick={resetBranding}
                className="rounded-full border border-white/12 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/68 transition hover:border-white/22 hover:text-white"
              >
                Reset default
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={onLogoSelected}
          />

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.26fr_0.74fr]">
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">
                Live mark
              </p>
              <div className="mt-5 flex items-center gap-4">
                <img
                  src={brandProfile.logoDataUrl || "/brand/fonatprop-final-icon-circle.png"}
                  alt={brandProfile.agencyName || "Agency logo"}
                  className="h-20 w-20 rounded-full border border-white/10 bg-white/5 object-cover p-1"
                />
                <div>
                  <p className="text-white">{brandProfile.agencyName}</p>
                  <p className="mt-1 text-sm text-white/48">{brandProfile.agentName}</p>
                  <p className="mt-1 text-xs text-white/36">{brandProfile.agentTitle}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                ["agencyName", "Agency", brandProfile.agencyName],
                ["office", "Office", brandProfile.office],
                ["phone", "Phone", brandProfile.phone],
                ["email", "Email", brandProfile.email],
                ["website", "Website", brandProfile.website],
                ["agentName", "Agent", brandProfile.agentName],
                ["agentTitle", "Title", brandProfile.agentTitle],
                ["whatsapp", "WhatsApp", brandProfile.whatsapp],
              ].map(([key, label, value]) => (
                <label
                  key={String(key)}
                  className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34">
                    {label}
                  </span>
                  <input
                    value={String(value)}
                    onChange={(event) =>
                      updateBrandField(key as keyof MandatePackBrandProfile, event.target.value as never)
                    }
                    className="mt-3 w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                  />
                </label>
              ))}
              <label className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34">
                  Accent
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="color"
                    value={brandProfile.accentHex}
                    onChange={(event) => updateBrandField("accentHex", event.target.value)}
                    className="h-10 w-12 rounded border border-white/10 bg-transparent"
                  />
                  <input
                    value={brandProfile.accentHex}
                    onChange={(event) => updateBrandField("accentHex", event.target.value)}
                    className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mb-8 rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:hidden">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34">
                  Recent live reports
                </p>
                <p className="mt-2 text-sm text-white/56">
                  Switch between the latest Dubai valuation cases saved from the broker demo.
                </p>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
                {history.length} saved sessions
              </p>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {history.map((item) => (
                <button
                  key={`${item.savedAt}-${item.addressText}`}
                  type="button"
                  onClick={() => loadSession(item)}
                  className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/22 hover:bg-white/[0.05]"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-blue-200/60">
                    {new Date(item.savedAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white">
                    {item.addressText || item.result.resolved_building || item.result.resolved_zone || item.result.zona}
                  </p>
                  <p className="mt-2 text-xs text-white/42">
                    AED {new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(item.result.predicted_aed)} / {item.result.rooms} / {item.result.area_m2} sqm
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <MandatePackReport report={report} viewMode={mode} />
      </div>
    </div>
  );
}
