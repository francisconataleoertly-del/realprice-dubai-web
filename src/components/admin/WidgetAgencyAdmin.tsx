"use client";

import { useEffect, useMemo, useState } from "react";

type WidgetAgencyMarket = "dubai" | "france" | "multi";

type WidgetAgencyRow = {
  id: string;
  label: string;
  market: WidgetAgencyMarket;
  token: string;
  allowedHosts: string[];
  agentPhone: string;
  agentEmail: string;
  leadWebhook: string;
  isActive: boolean;
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
  isActive: true,
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
    setForm({
      agencyId: row.id,
      label: row.label,
      market: row.market,
      token: row.token,
      allowedHosts: row.allowedHosts.join(", "),
      agentPhone: row.agentPhone,
      agentEmail: row.agentEmail,
      leadWebhook: row.leadWebhook,
      isActive: row.isActive,
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
          <p className="text-[28px] font-light tracking-[-0.03em] text-white">
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
              <p className="mt-2 text-[24px] font-light tracking-[-0.02em] text-white">
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
