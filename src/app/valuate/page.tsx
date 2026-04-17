"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  BedDouble,
  Maximize2,
  Car,
  FileCheck,
  Loader2,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { predict, getZones, formatAED, formatUSD } from "@/lib/api";
import type { PredictResponse } from "@/lib/api";

const ROOM_OPTIONS = ["Studio", "1 B/R", "2 B/R", "3 B/R", "4 B/R", "5 B/R"];
const TYPE_OPTIONS = ["Flat", "Villa", "Town House"];

export default function ValuatePage() {
  const [zones, setZones] = useState<string[]>([]);
  const [zona, setZona] = useState("Marsa Dubai");
  const [rooms, setRooms] = useState("1 B/R");
  const [area, setArea] = useState(75);
  const [type, setType] = useState("Flat");
  const [freehold, setFreehold] = useState(true);
  const [offplan, setOffplan] = useState(false);
  const [parking, setParking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getZones()
      .then((data) => setZones(data.zones_dld))
      .catch(() => setZones([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await predict({
        zona,
        rooms,
        area_m2: area,
        is_freehold: freehold,
        is_offplan: offplan,
        has_parking: parking,
        property_sub_type: type,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  const pricePerSqft = result
    ? result.predicted_aed / (area * 10.764)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gold-text">Property Valuation</span>
        </h1>
        <p className="text-muted mt-2">
          Enter property details to get an AI-powered price estimate
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 space-y-5 p-6 bg-card rounded-xl border border-card-border"
        >
          {/* Zone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
              <MapPin className="w-4 h-4" /> Zone
            </label>
            <select
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              className="w-full bg-background border border-card-border rounded-lg px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Rooms */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
              <BedDouble className="w-4 h-4" /> Rooms
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRooms(r)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    rooms === r
                      ? "bg-primary text-background"
                      : "bg-background border border-card-border text-muted hover:border-primary/50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
              <Maximize2 className="w-4 h-4" /> Area (m2)
            </label>
            <input
              type="number"
              min={10}
              max={5000}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full bg-background border border-card-border rounded-lg px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted mt-1">
              {(area * 10.764).toFixed(0)} sqft
            </p>
          </div>

          {/* Property Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
              <Building2 className="w-4 h-4" /> Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === t
                      ? "bg-primary text-background"
                      : "bg-background border border-card-border text-muted hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-3">
            <ToggleButton
              icon={<FileCheck className="w-4 h-4" />}
              label="Freehold"
              active={freehold}
              onClick={() => setFreehold(!freehold)}
            />
            <ToggleButton
              icon={<TrendingUp className="w-4 h-4" />}
              label="Off-plan"
              active={offplan}
              onClick={() => setOffplan(!offplan)}
            />
            <ToggleButton
              icon={<Car className="w-4 h-4" />}
              label="Parking"
              active={parking}
              onClick={() => setParking(!parking)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-background font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <DollarSign className="w-5 h-5" />
            )}
            {loading ? "Calculating..." : "Get Valuation"}
          </button>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Result */}
        <div className="lg:col-span-3">
          {result ? (
            <div className="animate-count">
              {/* Main price card */}
              <div className="p-8 bg-card rounded-xl border border-primary/30 shadow-lg shadow-primary/5 mb-6">
                <p className="text-sm text-muted mb-2">Estimated Value</p>
                <div className="text-5xl font-bold gold-text mb-2">
                  {formatAED(result.predicted_aed)}
                </div>
                <div className="text-xl text-muted">
                  {formatUSD(result.predicted_usd)}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailCard
                  label="Zone"
                  value={result.zona}
                />
                <DetailCard
                  label="Type"
                  value={`${result.rooms} ${result.property_sub_type}`}
                />
                <DetailCard
                  label="Area"
                  value={`${result.area_m2} m2 / ${(result.area_m2 * 10.764).toFixed(0)} sqft`}
                />
                <DetailCard
                  label="Price/sqft"
                  value={`AED ${pricePerSqft.toFixed(0)}`}
                />
              </div>

              {/* Comparison hint */}
              <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                <p className="text-sm text-muted">
                  <span className="text-accent font-medium">Tip:</span> Compare
                  this valuation across zones in the{" "}
                  <a href="/analytics" className="text-accent underline">
                    Analytics
                  </a>{" "}
                  page, or explore nearby POIs on the{" "}
                  <a href="/map" className="text-accent underline">
                    Map
                  </a>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-16 bg-card rounded-xl border border-card-border">
              <div className="text-center">
                <Building2 className="w-16 h-16 text-card-border mx-auto mb-4" />
                <p className="text-muted text-lg">
                  Fill in the property details and click &quot;Get Valuation&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-all ${
        active
          ? "bg-primary/10 border border-primary/30 text-primary"
          : "bg-background border border-card-border text-muted hover:border-primary/30"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-card rounded-xl border border-card-border">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
