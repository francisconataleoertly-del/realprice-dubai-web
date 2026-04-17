"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface POI {
  cat: string;
  name: string;
  lat: number;
  lng: number;
}

interface POIData {
  total: number;
  pois: Record<string, POI[]>;
}

const DUBAI_CENTER: [number, number] = [25.2048, 55.2708];

const CAT_COLORS: Record<string, string> = {
  metro_stations: "#ef4444",
  tram_stops: "#f97316",
  schools: "#3b82f6",
  hospitals: "#10b981",
  malls: "#c9a84c",
  parks: "#22c55e",
  restaurants: "#8b5cf6",
  hotels: "#ec4899",
  mosques: "#14b8a6",
  beaches: "#06b6d4",
  attractions: "#f59e0b",
  universities: "#6366f1",
};

const CAT_LABELS: Record<string, string> = {
  metro_stations: "Metro Stations",
  tram_stops: "Tram Stops",
  schools: "Schools",
  hospitals: "Hospitals",
  malls: "Malls",
  parks: "Parks",
  restaurants: "Restaurants",
  hotels: "Hotels",
  mosques: "Mosques",
  beaches: "Beaches",
  attractions: "Attractions",
  universities: "Universities",
};

export default function DubaiMap() {
  const [poiData, setPOIData] = useState<POIData | null>(null);
  const [activeCats, setActiveCats] = useState<Set<string>>(
    new Set(["metro_stations", "malls", "hospitals", "schools", "parks"])
  );

  useEffect(() => {
    fetch("/dubai_pois.json")
      .then((r) => r.json())
      .then((data) => setPOIData(data))
      .catch(() => {});
  }, []);

  const toggleCat = (cat: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const visiblePOIs: POI[] = [];
  if (poiData) {
    for (const cat of activeCats) {
      const pois = poiData.pois[cat] || [];
      visiblePOIs.push(...pois);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 p-4 bg-card border-b border-card-border">
        {Object.entries(CAT_LABELS).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => toggleCat(cat)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCats.has(cat)
                ? "text-background"
                : "bg-background border border-card-border text-muted hover:border-primary/30"
            }`}
            style={
              activeCats.has(cat)
                ? { backgroundColor: CAT_COLORS[cat] || "#64748b" }
                : {}
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: CAT_COLORS[cat] || "#64748b" }}
            />
            {label}
            {poiData && (
              <span className="opacity-70">
                ({(poiData.pois[cat] || []).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: "500px" }}>
        <MapContainer
          center={DUBAI_CENTER}
          zoom={12}
          className="h-full w-full"
          style={{ height: "100%", minHeight: "500px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {visiblePOIs.map((poi, i) => (
            <CircleMarker
              key={`${poi.cat}-${i}`}
              center={[poi.lat, poi.lng]}
              radius={5}
              pathOptions={{
                color: CAT_COLORS[poi.cat] || "#64748b",
                fillColor: CAT_COLORS[poi.cat] || "#64748b",
                fillOpacity: 0.8,
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{poi.name || "Unnamed"}</div>
                  <div className="text-xs opacity-70 capitalize">
                    {poi.cat.replace(/_/g, " ")}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Stats overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur border border-card-border rounded-lg px-4 py-2">
          <span className="text-sm text-muted">
            Showing{" "}
            <span className="text-primary font-semibold">
              {visiblePOIs.length.toLocaleString()}
            </span>{" "}
            POIs
            {poiData && (
              <>
                {" "}
                of{" "}
                <span className="font-semibold">
                  {poiData.total.toLocaleString()}
                </span>{" "}
                total
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
