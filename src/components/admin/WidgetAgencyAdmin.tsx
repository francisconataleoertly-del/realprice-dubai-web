"use client";

import { useEffect, useMemo, useState } from "react";

type WidgetAgencyMarket = "dubai" | "france" | "multi";
type WidgetMode = "valuation" | "carousel";
type WidgetLeadOverageMode = "soft_gate" | "hard_gate" | "unlimited";
type WidgetLeadRoutingMode = "email" | "webhook" | "email_webhook" | "manual";
type WidgetBillingStatus = "trial" | "active" | "paused" | "cancelled";
type WidgetFrameShape = "soft" | "rounded" | "square" | "pill";
type WidgetSurfaceTone = "dark" | "light" | "glass";

type WidgetAgencyTheme = {
  accentColor: string;
  backgroundImage: string;
  frameShape: WidgetFrameShape;
  surfaceTone: WidgetSurfaceTone;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  logoUrl: string;
};

const defaultTheme: WidgetAgencyTheme = {
  accentColor: "#3b82f6",
  backgroundImage: "https://fonatprop.com/dubai-slides/03-burj-al-arab.jpg",
  frameShape: "rounded",
  surfaceTone: "dark",
  headline: "Want to know how much a property is worth?",
  subheadline: "Capture the lead first, then give a useful market range before the broker takes over.",
  ctaLabel: "Get your free valuation",
  logoUrl: "",
};

type WidgetAgencyRow = {
  id: string;
  label: string;
  market: WidgetAgencyMarket;
  token: string;
  allowedHosts: string[];
  agentPhone: string;
  agentEmail: string;
  leadWebhook: string;
  widgetMode?: WidgetMode;
  carouselCards?: string[];
  notificationEmail?: string;
  notificationPhone?: string;
  crmWebhookUrl?: string;
  leadRoutingMode?: WidgetLeadRoutingMode;
  monthlyReportEmail?: string;
  handoffEnabled?: boolean;
  isActive: boolean;
  planCode: string;
  monthlyLeadLimit: number | null;
  monthlyPriceUsd: number | null;
  watermarkEnabled: boolean;
  leadOverageMode: WidgetLeadOverageMode;
  billingStatus: WidgetBillingStatus;
  trialEndsAt: string | null;
  theme: WidgetAgencyTheme;
  notes: string | null;
};

const initialForm = {
  agencyId: "",
  label: "",
  market: "dubai" as WidgetAgencyMarket,
  token: "",
  allowedHosts: "fonatprop.com, www.fonatprop.com",
  agentPhone: "",
  agentEmail: "",
  leadWebhook: "/api/leads",
  widgetMode: "carousel" as WidgetMode,
  carouselCards: "valuation,golden_visa,net_yield,offplan_payment",
  notificationEmail: "",
  notificationPhone: "",
  crmWebhookUrl: "",
  leadRoutingMode: "email" as WidgetLeadRoutingMode,
  monthlyReportEmail: "",
  handoffEnabled: true,
  isActive: true,
  planCode: "launch_watermark_unlimited",
  monthlyLeadLimit: "",
  monthlyPriceUsd: "600",
  watermarkEnabled: true,
  leadOverageMode: "unlimited" as WidgetLeadOverageMode,
  billingStatus: "trial" as WidgetBillingStatus,
  trialEndsAt: "",
  themeAccentColor: defaultTheme.accentColor,
  themeBackgroundImage: defaultTheme.backgroundImage,
  themeFrameShape: defaultTheme.frameShape,
  themeSurfaceTone: defaultTheme.surfaceTone,
  themeHeadline: defaultTheme.headline,
  themeSubheadline: defaultTheme.subheadline,
  themeCtaLabel: defaultTheme.ctaLabel,
  themeLogoUrl: defaultTheme.logoUrl,
  notes: "",
};

function makeToken() {
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `fp_${body}`;
}

export default function WidgetAgencyAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<WidgetAgencyRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => rows.find((row) => row.id === form.agencyId) || null,
    [rows, form.agencyId],
  );

  const loadRows = async () => {
    const response = await fetch("/api/widget-agencies", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail || "Could not load widget agencies.");
      return;
    }
    setRows(Array.isArray(payload.rows) ? payload.rows : []);
    if (payload.detail) setMessage(payload.detail);
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const hydrate = (row: WidgetAgencyRow) => {
    const theme = { ...defaultTheme, ...(row.theme || {}) };

    setForm({
      agencyId: row.id,
      label: row.label,
      market: row.market,
      token: row.token,
      allowedHosts: row.allowedHosts.join(", "),
      agentPhone: row.agentPhone,
      agentEmail: row.agentEmail,
      leadWebhook: row.leadWebhook,
      widgetMode: row.widgetMode || "valuation",
      carouselCards: (row.carouselCards || ["valuation", "golden_visa", "net_yield", "offplan_payment"]).join(","),
      notificationEmail: row.notificationEmail || "",
      notificationPhone: row.notificationPhone || "",
      crmWebhookUrl: row.crmWebhookUrl || "",
      leadRoutingMode: row.leadRoutingMode || "email",
      monthlyReportEmail: row.monthlyReportEmail || row.notificationEmail || "",
      handoffEnabled: row.handoffEnabled !== false,
      isActive: row.isActive,
      planCode: row.planCode || "pilot",
      monthlyLeadLimit: row.monthlyLeadLimit === null ? "" : String(row.monthlyLeadLimit),
      monthlyPriceUsd: row.monthlyPriceUsd === null ? "" : String(row.monthlyPriceUsd),
      watermarkEnabled: row.watermarkEnabled !== false,
      leadOverageMode: row.leadOverageMode || "soft_gate",
      billingStatus: row.billingStatus || "trial",
      trialEndsAt: row.trialEndsAt ? row.trialEndsAt.slice(0, 10) : "",
      themeAccentColor: theme.accentColor,
      themeBackgroundImage: theme.backgroundImage,
      themeFrameShape: theme.frameShape,
      themeSurfaceTone: theme.surfaceTone,
      themeHeadline: theme.headline,
      themeSubheadline: theme.subheadline,
      themeCtaLabel: theme.ctaLabel,
      themeLogoUrl: theme.logoUrl,
      notes: row.notes || "",
    });
  };

  const reset = () => {
    setForm({ ...initialForm, token: makeToken() });
    setMessage("");
    setError("");
  };

  useEffect(() => {
    if (!form.token) {
      setForm((current) => ({ ...current, token: makeToken() }));
    }
  }, [form.token]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/widget-agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          allowedHosts: form.allowedHosts,
          carouselCards: form.carouselCards
            .split(",")
            .map((card) => card.trim())
            .filter(Boolean),
          monthlyLeadLimit: form.monthlyLeadLimit ? Number(form.monthlyLeadLimit) : null,
          monthlyPriceUsd: form.monthlyPriceUsd ? Number(form.monthlyPriceUsd) : null,
          trialEndsAt: form.trialEndsAt ? new Date(form.trialEndsAt).toISOString() : null,
          theme: {
            accentColor: form.themeAccentColor,
            backgroundImage: form.themeBackgroundImage,
            frameShape: form.themeFrameShape,
            surfaceTone: form.themeSurfaceTone,
            headline: form.themeHeadline,
            subheadline: form.themeSubheadline,
            ctaLabel: form.themeCtaLabel,
            logoUrl: form.themeLogoUrl,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not save widget agency.");

      setMessage(`Saved widget agency: ${payload.row.label}`);
      hydrate(payload.row);
      await loadRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save widget agency.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
            Widget agencies
          </p>
          <p className="text-[28px] font-light tracking-normal text-white">
            Tokens, domains and revocation
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
            Create an agency token, restrict it to approved domains and disable it without touching the
            rest of the widget system.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
            {rows.length} agencies
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/65 transition hover:text-white"
          >
            New agency
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-50/70">
          Log in as an admin to manage widget agencies.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[24px] border border-white/[0.08] bg-[#0b0c12]/72 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
              Stored agencies
            </p>
            {selected && (
              <span className="rounded-full border border-[#3b82f6]/20 bg-[#3b82f6]/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[#9fc2ff]">
                editing
              </span>
            )}
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => hydrate(row)}
                className="w-full rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/12 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[15px] text-white">{row.label}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/28">
                      {row.id}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] ${
                      row.isActive
                        ? "border border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                        : "border border-red-300/25 bg-red-400/10 text-red-100"
                    }`}
                  >
                    {row.isActive ? "Active" : "Revoked"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                    {row.market}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                    {row.allowedHosts.length} hosts
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                    {row.monthlyLeadLimit ? `${row.monthlyLeadLimit} lead credits` : "unlimited"}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                    {row.watermarkEnabled ? "watermark" : "white label"}
                  </span>
                  <span className="rounded-full border border-[#3b82f6]/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#9fc2ff]/70">
                    {row.theme?.frameShape || "rounded"} shape
                  </span>
                  <span className="rounded-full border border-[#3b82f6]/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#9fc2ff]/70">
                    {row.theme?.surfaceTone || "dark"} tone
                  </span>
                </div>
              </button>
            ))}

            {!rows.length && (
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-6 text-sm text-white/42">
                No stored widget agencies yet.
              </div>
            )}
          </div>
        </div>

        <form onSubmit={save} className="rounded-[24px] border border-white/[0.08] bg-[#0b0c12]/72 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
                Agency profile
              </p>
              <p className="mt-2 text-[24px] font-light tracking-normal text-white">
                {selected ? "Edit access profile" : "Create access profile"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setField("token", makeToken())}
              className="rounded-full border border-white/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60 transition hover:text-white"
            >
              New token
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Agency ID</span>
              <input
                value={form.agencyId}
                onChange={(event) => setField("agencyId", event.target.value)}
                placeholder="dubai-agency-001"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Label</span>
              <input
                value={form.label}
                onChange={(event) => setField("label", event.target.value)}
                placeholder="Dubai Marina Partners"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Market</span>
              <select
                value={form.market}
                onChange={(event) => setField("market", event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
              >
                <option value="dubai">Dubai</option>
                <option value="france">France</option>
                <option value="multi">Multi-market</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Token</span>
              <input
                value={form.token}
                onChange={(event) => setField("token", event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Allowed hosts</span>
              <input
                value={form.allowedHosts}
                onChange={(event) => setField("allowedHosts", event.target.value)}
                placeholder="agency.com, www.agency.com"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Lead phone</span>
              <input
                value={form.agentPhone}
                onChange={(event) => setField("agentPhone", event.target.value)}
                placeholder="+971..."
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Lead email</span>
              <input
                value={form.agentEmail}
                onChange={(event) => setField("agentEmail", event.target.value)}
                placeholder="broker@agency.com"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Lead webhook</span>
              <input
                value={form.leadWebhook}
                onChange={(event) => setField("leadWebhook", event.target.value)}
                placeholder="/api/leads"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Widget mode</span>
              <select
                value={form.widgetMode}
                onChange={(event) => setField("widgetMode", event.target.value as WidgetMode)}
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
              >
                <option value="carousel">Carousel acquisition system</option>
                <option value="valuation">Classic valuation only</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Cards enabled</span>
              <input
                value={form.carouselCards}
                onChange={(event) => setField("carouselCards", event.target.value)}
                placeholder="valuation,golden_visa,net_yield,offplan_payment"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <div className="rounded-[22px] border border-emerald-300/15 bg-emerald-300/[0.035] p-4 md:col-span-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-emerald-100/55">
                Broker handoff
              </p>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Send each captured lead to the broker by email or CRM webhook, with card, score, source and suggested next action.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Notification email</span>
                  <input
                    value={form.notificationEmail}
                    onChange={(event) => setField("notificationEmail", event.target.value)}
                    placeholder="leads@agency.com"
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Broker WhatsApp</span>
                  <input
                    value={form.notificationPhone}
                    onChange={(event) => setField("notificationPhone", event.target.value)}
                    placeholder="+971..."
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Routing mode</span>
                  <select
                    value={form.leadRoutingMode}
                    onChange={(event) => setField("leadRoutingMode", event.target.value as WidgetLeadRoutingMode)}
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="webhook">CRM webhook</option>
                    <option value="email_webhook">Email + CRM webhook</option>
                    <option value="manual">Manual only</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Monthly report email</span>
                  <input
                    value={form.monthlyReportEmail}
                    onChange={(event) => setField("monthlyReportEmail", event.target.value)}
                    placeholder="manager@agency.com"
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">CRM webhook URL</span>
                  <input
                    value={form.crmWebhookUrl}
                    onChange={(event) => setField("crmWebhookUrl", event.target.value)}
                    placeholder="https://agency-crm.com/webhooks/fonatprop"
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm text-white/65 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.handoffEnabled}
                    onChange={(event) => setField("handoffEnabled", event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-[#090a10]"
                  />
                  Enable automatic broker handoff for this agency.
                </label>
              </div>
            </div>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Plan code</span>
              <input
                value={form.planCode}
                onChange={(event) => setField("planCode", event.target.value)}
                placeholder="launch_watermark_unlimited / white_label_unlimited / credits_topup"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Included lead-credit cap</span>
              <input
                value={form.monthlyLeadLimit}
                onChange={(event) => setField("monthlyLeadLimit", event.target.value)}
                placeholder="Leave empty for unlimited"
                type="number"
                min="0"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Internal monthly price USD</span>
              <input
                value={form.monthlyPriceUsd}
                onChange={(event) => setField("monthlyPriceUsd", event.target.value)}
                placeholder="600"
                type="number"
                min="0"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Lead cap behavior</span>
              <select
                value={form.leadOverageMode}
                onChange={(event) => setField("leadOverageMode", event.target.value as WidgetLeadOverageMode)}
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
              >
                <option value="soft_gate">Soft gate</option>
                <option value="hard_gate">Hard gate</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Billing status</span>
              <select
                value={form.billingStatus}
                onChange={(event) => setField("billingStatus", event.target.value as WidgetBillingStatus)}
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
              >
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Trial ends</span>
              <input
                value={form.trialEndsAt}
                onChange={(event) => setField("trialEndsAt", event.target.value)}
                type="date"
                className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
              />
            </label>
            <div className="rounded-[22px] border border-[#3b82f6]/15 bg-[#3b82f6]/[0.04] p-4 md:col-span-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#9fc2ff]/70">
                Client visual profile
              </p>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Personalize this agency widget without changing the embed code.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Accent color
                  </span>
                  <div className="grid grid-cols-[52px_1fr] gap-2">
                    <input
                      value={form.themeAccentColor}
                      onChange={(event) => setField("themeAccentColor", event.target.value)}
                      type="color"
                      className="h-12 rounded-2xl border border-white/10 bg-[#090a10] p-1"
                    />
                    <input
                      value={form.themeAccentColor}
                      onChange={(event) => setField("themeAccentColor", event.target.value)}
                      placeholder="#3b82f6"
                      className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                    />
                  </div>
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Frame shape
                  </span>
                  <select
                    value={form.themeFrameShape}
                    onChange={(event) => setField("themeFrameShape", event.target.value as WidgetFrameShape)}
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
                  >
                    <option value="rounded">Rounded premium</option>
                    <option value="soft">Soft luxury</option>
                    <option value="square">Sharp editorial</option>
                    <option value="pill">Pill / capsule</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Surface tone
                  </span>
                  <select
                    value={form.themeSurfaceTone}
                    onChange={(event) => setField("themeSurfaceTone", event.target.value as WidgetSurfaceTone)}
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none"
                  >
                    <option value="dark">Dark premium</option>
                    <option value="light">Light clean</option>
                    <option value="glass">Glass overlay</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Logo URL
                  </span>
                  <input
                    value={form.themeLogoUrl}
                    onChange={(event) => setField("themeLogoUrl", event.target.value)}
                    placeholder="https://agency.com/logo.png"
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Background image URL
                  </span>
                  <input
                    value={form.themeBackgroundImage}
                    onChange={(event) => setField("themeBackgroundImage", event.target.value)}
                    placeholder="https://agency.com/dubai-hero.jpg"
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Headline
                  </span>
                  <input
                    value={form.themeHeadline}
                    onChange={(event) => setField("themeHeadline", event.target.value)}
                    placeholder="Know the real value of your Dubai property."
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    Subheadline
                  </span>
                  <textarea
                    value={form.themeSubheadline}
                    onChange={(event) => setField("themeSubheadline", event.target.value)}
                    rows={3}
                    placeholder="Capture the lead first, then show a useful market range."
                    className="rounded-2xl border border-white/10 bg-[#090a10] px-4 py-3 text-white outline-none placeholder:text-white/20"
                  />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                    CTA label
                  </span>
                  <input
                    value={form.themeCtaLabel}
                    onChange={(event) => setField("themeCtaLabel", event.target.value)}
                    placeholder="Get your free valuation"
                    className="h-12 rounded-2xl border border-white/10 bg-[#090a10] px-4 text-white outline-none placeholder:text-white/20"
                  />
                </label>
              </div>
            </div>
            <label className="grid gap-2 md:col-span-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setField("notes", event.target.value)}
                rows={4}
                placeholder="Internal note for this client or integration."
                className="rounded-2xl border border-white/10 bg-[#090a10] px-4 py-3 text-white outline-none placeholder:text-white/20"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setField("isActive", event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#090a10]"
            />
            Active token
          </label>

          <label className="mt-3 flex items-center gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={form.watermarkEnabled}
              onChange={(event) => setField("watermarkEnabled", event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#090a10]"
            />
            Show &quot;Powered by FonatProp&quot; watermark
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!isAdmin || loading}
              className="rounded-2xl bg-white px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[#080910] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading ? "Saving..." : "Save agency"}
            </button>
            {selected?.isActive && (
              <button
                type="button"
                disabled={!isAdmin || loading}
                onClick={() => setField("isActive", false)}
                className="rounded-2xl border border-red-300/20 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-red-100 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Revoke in form
              </button>
            )}
            {message && <p className="text-sm text-emerald-100/70">{message}</p>}
            {error && <p className="text-sm text-red-200/75">{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
