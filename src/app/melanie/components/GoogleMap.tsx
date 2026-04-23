"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGoogleMaps } from "./GoogleMapsLoader";

interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  median_price?: number;
  transactions?: number;
  psf?: number;
}

export interface POIItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
}

export interface MapLayer {
  key: string;
  label: string;
  emoji: string;
  color: string;
  items: POIItem[];
  visible: boolean;
}

function getZoneColor(psf: number) {
  if (psf > 2500) return "#ef4444";
  if (psf > 1500) return "#f59e0b";
  if (psf > 800) return "#3b82f6";
  return "#10b981";
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);

const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ||
  "2258c8a7-7ee7-4bbe-9891-b6121da134c7";

export default function GoogleMap({
  zones,
  layers,
  onSelect,
}: {
  zones: Zone[];
  layers: MapLayer[];
  onSelect: (z: Zone) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const zoneMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const layerMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement[]>>(new Map());
  const loaded = useGoogleMaps();

  const initMap = useCallback(() => {
    if (!mapRef.current || !loaded) return;
    if (mapInstance.current) return;

    const google = (window as any).google;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: { lat: 25.15, lng: 55.25 },
      zoom: 11,
      mapId: GOOGLE_MAPS_MAP_ID,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0d0d14" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616679" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d14" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#080812" }] },
        { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
      ],
    });
  }, [loaded]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // Zone markers
  useEffect(() => {
    if (!mapInstance.current || !loaded || zones.length === 0) return;
    const google = (window as any).google;

    zoneMarkersRef.current.forEach((m) => (m.map = null));
    zoneMarkersRef.current = [];

    const infoWindow = new google.maps.InfoWindow();

    zones.forEach((zone) => {
      const psf = zone.psf || (zone.median_price ? zone.median_price / 800 : 1000);
      const color = getZoneColor(psf);
      const size = Math.max(20, Math.min(40, psf / 80));

      const el = document.createElement("div");
      el.style.cssText = `
        width:${size}px;height:${size}px;background:${color}40;border:2px solid ${color};
        border-radius:50%;cursor:pointer;transition:transform 0.2s;
      `;
      el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
      el.onmouseleave = () => { el.style.transform = "scale(1)"; };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: { lat: zone.lat, lng: zone.lng },
        content: el,
        title: zone.name,
      });

      marker.addListener("click", () => {
        onSelect(zone);
        infoWindow.setContent(`
          <div style="font-family:system-ui;font-size:13px;padding:4px;min-width:150px;color:#333">
            <strong>${zone.name}</strong><br/>
            <span style="color:${color};font-weight:600">AED ${fmt(psf)}/sqft</span>
          </div>
        `);
        infoWindow.open({ anchor: marker, map: mapInstance.current });
      });

      zoneMarkersRef.current.push(marker);
    });
  }, [zones, loaded, onSelect]);

  // POI layer markers — toggle on/off per layer
  useEffect(() => {
    if (!mapInstance.current || !loaded) return;
    const google = (window as any).google;

    layers.forEach((layer) => {
      const existing = layerMarkersRef.current.get(layer.key) || [];

      if (!layer.visible) {
        // Hide all markers for this layer
        existing.forEach((m) => (m.map = null));
        return;
      }

      // If already created and visible, just show them
      if (existing.length > 0 && existing[0].map) return;

      // If created but hidden, show them
      if (existing.length > 0) {
        existing.forEach((m) => (m.map = mapInstance.current));
        return;
      }

      // Create markers for this layer
      const markers: google.maps.marker.AdvancedMarkerElement[] = [];
      const infoWindow = new google.maps.InfoWindow();

      layer.items.forEach((poi) => {
        const el = document.createElement("div");
        el.style.cssText = `
          width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:14px;cursor:pointer;transition:transform 0.15s;
          background:${layer.color}20;border:1.5px solid ${layer.color}90;
          box-shadow:0 0 6px ${layer.color}30;
        `;
        el.textContent = layer.emoji;
        el.onmouseenter = () => { el.style.transform = "scale(1.4)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance.current,
          position: { lat: poi.lat, lng: poi.lng },
          content: el,
          title: poi.name,
        });

        marker.addListener("click", () => {
          infoWindow.setContent(`
            <div style="font-family:system-ui;font-size:12px;padding:2px;color:#333">
              <strong>${layer.emoji} ${poi.name}</strong><br/>
              <span style="opacity:0.6;text-transform:capitalize">${poi.category}</span>
            </div>
          `);
          infoWindow.open({ anchor: marker, map: mapInstance.current });
        });

        markers.push(marker);
      });

      layerMarkersRef.current.set(layer.key, markers);
    });
  }, [layers, loaded]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[65vh] rounded-lg border border-white/5"
      style={{ background: "#0d0d14" }}
    />
  );
}
