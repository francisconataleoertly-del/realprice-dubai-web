"use client";

import { useEffect, useMemo, useState } from "react";

import type { LeadRow, LeadStatus } from "@/lib/leads";

const statusOptions: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost", "archived"];

const statusStyle: Record<LeadStatus, string> = {
  new: "border-blue-300/25 bg-blue-400/10 text-blue-100",
  contacted: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
  qualified: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  won: "border-lime-300/25 bg-lime-400/10 text-lime-100",
  lost: "border-red-300/25 bg-red-400/10 text-red-100",
  archived: "border-white/10 bg-white/[0.04] text-white/42",
};

const currencyFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatMoney(lead: LeadRow) {
  if (lead.valuation_range_label) return lead.valuation_range_label;
  if (lead.valuation_low && lead.valuation_high) {
    return `${lead.currency} ${currencyFormatter.format(lead.valuation_low)} - ${currencyFormatter.format(lead.valuation_high)}`;
  }
  if (lead.estimated_value) {
    return `${lead.currency} ${currencyFormatter.format(lead.estimated_value)}`;
  }
  return "No estimate yet";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LeadInboxAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not load leads.");
      setRows(Array.isArray(payload.rows) ? payload.rows : []);
      if (payload.detail && !payload.table_ready) setMessage(payload.detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const stats = useMemo(() => {
    const active = rows.filter((row) => !["won", "lost", "archived"].includes(row.status)).length;
    return {
      total: rows.length,
      new: rows.filter((row) => row.status === "new").length,
      qualified: rows.filter((row) => row.status === "qualified").length,
      won: rows.filter((row) => row.status === "won").length,
      active,
    };
  }, [rows]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    setMessage("");
    setError("");
    const optimistic = rows.map((row) => (row.id === id ? { ...row, status } : row));
    setRows(optimistic);

    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Could not update lead.");
      setRows((current) => current.map((row) => (row.id === id ? payload.row : row)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update lead.");
      await loadRows();
    }
  };

  return (
    <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
            Lead inbox
          </p>
          <p className="text-[28px] font-light tracking-[-0.03em] text-white">
            Real inquiries from widget, France and broker demo
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
            This is the commercial bridge: website visitor, captured contact, valuation context,
            agent follow-up and pipeline status in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRows()}
          className="rounded-2xl border border-white/12 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55 transition hover:border-white/24 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {!isAdmin && (
        <div className="mb-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-50/70">
          Log in as an admin to read and manage leads.
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {[
          ["Total", stats.total],
          ["Active", stats.active],
          ["New", stats.new],
          ["Qualified", stats.qualified],
          ["Won", stats.won],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[22px] border border-white/[0.08] bg-[#0b0c12]/72 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
              {label}
            </p>
            <p className="mt-2 font-['Fraunces'] text-[28px] font-light text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      {message && (
        <p className="mb-4 rounded-2xl border border-blue-300/15 bg-blue-400/[0.07] p-4 text-sm text-blue-100/70">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-2xl border border-red-300/15 bg-red-400/[0.07] p-4 text-sm text-red-100/75">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-[24px] border border-white/[0.08]">
        <div className="grid grid-cols-[1.15fr_0.72fr_0.85fr_0.8fr_0.62fr] gap-3 border-b border-white/[0.06] bg-white/[0.03] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/28">
          <span>Lead</span>
          <span>Market</span>
          <span>Property signal</span>
          <span>Created</span>
          <span>Status</span>
        </div>
        {rows.slice(0, 20).map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[1.15fr_0.72fr_0.85fr_0.8fr_0.62fr] gap-3 border-b border-white/[0.04] px-4 py-4 text-xs last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-white/78">{row.name || row.email || row.phone || "Unknown lead"}</p>
              <p className="mt-1 truncate font-mono text-[9px] tracking-[0.16em] text-white/30">
                {row.email || "no email"} {row.phone ? ` / ${row.phone}` : ""}
              </p>
              <p className="mt-1 truncate text-white/28">{row.address || row.zone || row.section || row.source}</p>
            </div>
            <div>
              <span className="font-mono uppercase text-white/42">{row.market}</span>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/24">
                {row.source}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-white/58">{formatMoney(row)}</p>
              <p className="mt-1 truncate text-white/26">
                {[row.property_type, row.rooms, row.area_m2 ? `${row.area_m2} m2` : null]
                  .filter(Boolean)
                  .join(" / ") || "Context pending"}
              </p>
            </div>
            <span className="font-mono text-white/38">{formatDate(row.created_at)}</span>
            <select
              value={row.status}
              disabled={!isAdmin}
              onChange={(event) => void updateStatus(row.id, event.target.value as LeadStatus)}
              className={`h-10 rounded-xl border px-2 font-mono text-[9px] uppercase tracking-[0.16em] outline-none ${statusStyle[row.status]}`}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status} className="bg-[#0b0c12] text-white">
                  {status}
                </option>
              ))}
            </select>
          </div>
        ))}
        {!rows.length && !loading && (
          <div className="px-4 py-8 text-sm text-white/42">
            No leads yet. Submit the broker demo widget or a France report form and this inbox will populate.
          </div>
        )}
        {loading && (
          <div className="px-4 py-8 text-sm text-white/42">Loading lead inbox...</div>
        )}
      </div>
    </div>
  );
}
