"use client";

import { useEffect, useState, createContext, useContext } from "react";

const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyDNuJqXzs2JLuecLiC8KMevBdmYVKZ8CQ4";

const GoogleMapsContext = createContext(false);

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export default function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener("load", () => setLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  return (
    <GoogleMapsContext.Provider value={loaded}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
