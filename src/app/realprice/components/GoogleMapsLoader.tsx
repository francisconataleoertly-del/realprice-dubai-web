"use client";

import { useEffect, useState, createContext, useContext } from "react";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_CALLBACK = "__fonatpropGoogleMapsReady";

const GoogleMapsContext = createContext(false);

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export default function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as typeof window & {
      google?: typeof google;
      [GOOGLE_MAPS_CALLBACK]?: () => void;
      gm_authFailure?: () => void;
    };

    if (w.google?.maps) {
      setLoaded(true);
      return;
    }

    if (!GOOGLE_MAPS_KEY) {
      console.error(
        "[FonatProp] Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Google Maps features are disabled.",
      );
      return;
    }

    w[GOOGLE_MAPS_CALLBACK] = () => setLoaded(true);
    w.gm_authFailure = () => {
      console.error(
        "[FonatProp] Google Maps authentication failed. Check API key restrictions, billing, Maps JavaScript API, Places API and Map ID.",
      );
      setLoaded(false);
    };

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (w.google?.maps) setLoaded(true);
      });
      existing.addEventListener("error", () => {
        console.error("[FonatProp] Existing Google Maps script failed to load.");
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "fonatprop-google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_KEY,
    )}&libraries=places,marker&v=weekly&callback=${GOOGLE_MAPS_CALLBACK}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error("[FonatProp] Google Maps script failed to load.");
    };
    document.head.appendChild(script);
  }, []);

  return (
    <GoogleMapsContext.Provider value={loaded}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
