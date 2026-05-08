"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import {
  searchFrenchAddress,
  type AddressSuggestion,
} from "./franceBANService";

type Props = {
  value: string;
  onSelect: (addr: AddressSuggestion) => void;
  onChange?: (text: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 220;

export default function FranceAddressAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = "Type a French address — street, city, or postcode",
  ariaLabel = "French address search",
}: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep external value in sync (when parent updates via another control).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    debounceRef.current = window.setTimeout(async () => {
      const results = await searchFrenchAddress(query, 6, controller.signal);
      setSuggestions(results);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (addr: AddressSuggestion) => {
    setQuery(addr.label);
    setOpen(false);
    setHighlight(0);
    onChange?.(addr.label);
    onSelect(addr);
  };

  const showEmptyHint =
    open &&
    !loading &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    suggestions.length === 0;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin
          size={14}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
            onChange?.(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!suggestions.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
              setOpen(true);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const choice = suggestions[highlight];
              if (choice) handleSelect(choice);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          className="h-14 w-full rounded-2xl border border-white/10 bg-[#0b0d14] pl-10 pr-10 text-white outline-none transition focus:border-blue-300/50"
        />
        {loading ? (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/40"
          />
        ) : null}
      </div>

      {open && suggestions.length > 0 ? (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-[0_28px_60px_rgba(0,0,0,0.6)]"
          role="listbox"
        >
          {suggestions.map((s, i) => {
            const isActive = i === highlight;
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => handleSelect(s)}
                className={`block w-full border-b border-white/[0.04] px-4 py-3 text-left transition-colors last:border-b-0 ${
                  isActive
                    ? "bg-blue-500/15 text-white"
                    : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <p className="text-[13px] font-medium leading-tight">{s.label}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {s.postcode || "—"} &middot; {s.city || "—"} &middot; INSEE {s.citycode || "—"}
                </p>
              </button>
            );
          })}
          <p className="border-t border-white/[0.06] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
            Géoplateforme IGN &middot; BAN
          </p>
        </div>
      ) : null}

      {showEmptyHint ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
          No matches — try city + postcode
        </p>
      ) : null}
    </div>
  );
}
