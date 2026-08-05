"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fonatprop_cookie_consent_v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(!localStorage.getItem(STORAGE_KEY));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const accept = (level: "essential" | "analytics") => {
    localStorage.setItem(STORAGE_KEY, level);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[9998] mx-auto max-w-4xl rounded-[24px] border border-white/12 bg-[#070b12]/94 p-4 text-white shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/62">
            Cookies
          </p>
          <p className="mt-2 text-sm leading-6 text-white/68">
            FonatProp uses essential cookies for login and security. Analytics cookies help measure page,
            widget and funnel performance; marketing cookies are only used when campaigns are enabled.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => accept("essential")}
            className="rounded-full border border-white/12 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/62 transition hover:border-white/24 hover:text-white"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => accept("analytics")}
            className="rounded-full bg-white px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#07101a] transition hover:bg-cyan-50"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
