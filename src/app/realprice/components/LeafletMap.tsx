"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  median_price?: number;
  transactions?: number;
  psf?: number;
}

function getColor(price: number, psf?: number) {
  const val = psf || price / 800;
  if (val > 2500) return "#ef4444";
  if (val > 1500) return "#f59e0b";
  if (val > 800) return "#3b82f6";
  return "#10b981";
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

function ZoneMarker({ zone, onSelect }: { zone: Zone; onSelect: (z: Zone) => void }) {
  const price = zone.median_price || 0;
  const color = getColor(price, zone.psf);
  const radius = Math.max(10, Math.min(18, (zone.psf || 1000) / 150));

  return (
    <CircleMarker
      center={[zone.lat, zone.lng]}
      radius={radius}
      pathOptions={{
        fillColor: color,
        color: color,
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.35,
      }}
      eventHandlers={{ click: () => onSelect(zone) }}
    >
      <Popup>
        <div style={{ fontFamily: "system-ui", fontSize: 13, minWidth: 140 }}>
          <strong>{zone.name}</strong>
          <br />
          <span style={{ color }}>AED {fmt(price)}</span> median
          <br />
          <span style={{ opacity: 0.6 }}>{zone.transactions || 0} transactions</span>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function LeafletMap({
  zones,
  onSelect,
}: {
  zones: Zone[];
  onSelect: (z: Zone) => void;
}) {
  return (
    <MapContainer
      center={[25.15, 55.25]}
      zoom={11}
      zoomControl={false}
      className="w-full h-[60vh] rounded-lg"
      style={{ background: "#0d0d14" }}
    >
      <TileLayer
        attribution=""
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {zones.map((zone) => (
        <ZoneMarker key={zone.id} zone={zone} onSelect={onSelect} />
      ))}
    </MapContainer>
  );
}
