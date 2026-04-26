"use client";

import FonatPropLogo from "@/components/brand/FonatPropLogo";

const LINKS = {
  Platform: [
    { label: "Valuate", href: "#valorar" },
    { label: "Map", href: "#mapa" },
    { label: "Radar", href: "#radar" },
    { label: "Invest", href: "#inversion" },
    { label: "Renovate", href: "#reforma" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Methodology", href: "#" },
    { label: "API Access", href: "#" },
    { label: "Contact", href: "mailto:hello@fonatprop.com" },
  ],
  Legal: [
    { label: "Terms", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04] px-6 md:px-12 lg:px-24 pt-20 pb-10">
      {/* Large wordmark */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <FonatPropLogo
            variant="lockup"
            className="h-auto w-full max-w-5xl opacity-[0.18] mix-blend-screen"
          />
        </div>

        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <FonatPropLogo variant="nav" className="mb-5 h-12 w-[210px]" />
            <p className="text-white/40 text-[14px] font-light leading-relaxed max-w-xs mb-6">
              FonatProp is an AI-powered automated valuation platform for Dubai real estate.
              Instant estimates, live market intelligence.
            </p>
            <a
              href="mailto:hello@fonatprop.com"
              className="font-mono text-[12px] text-white/50 hover:text-white transition-colors border-b border-white/10 hover:border-white/30 pb-0.5"
            >
              hello@fonatprop.com
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/25 mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/50 text-[13px] font-light hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
          <div className="flex items-center gap-6 text-white/25 font-mono text-[10px] tracking-wider">
            <span>&copy; 2026 FONATPROP</span>
            <span className="hidden md:inline">&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>API STATUS: OPERATIONAL</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/25 font-mono text-[10px] tracking-wider">
            <span>MODEL V4 &bull; R&sup2; 0.889</span>
            <span>&bull;</span>
            <span>UPDATED DAILY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
