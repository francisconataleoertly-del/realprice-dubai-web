"use client";

import { useEffect, useState } from "react";

import FonatPropLogo from "@/components/brand/FonatPropLogo";

const NAV_ITEMS = [
  { id: "valorar", label: "Valuate", num: "01" },
  { id: "mapa", label: "Map", num: "02" },
  { id: "radar", label: "Radar", num: "03" },
  { id: "inversion", label: "Invest", num: "04" },
  { id: "reforma", label: "Renovate", num: "05" },
];

export default function NavBar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { threshold: [0.2, 0.5], rootMargin: "-80px 0px -40% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const main = document.querySelector("main") || document.body;
    main.style.transition = "opacity 0.25s ease-out";
    main.style.opacity = "0.6";
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { main.style.opacity = "1"; main.style.transition = "opacity 0.5s ease-in"; }, 350);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/[0.04]" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="inline-flex items-center gap-2">
          <FonatPropLogo
            variant="mark"
            className="h-9 w-9 rounded-xl border border-white/10 shadow-[0_0_18px_rgba(59,130,246,0.16)]"
            imageClassName="scale-125"
          />
          <FonatPropLogo variant="nav" className="hidden h-9 w-[145px] sm:inline-flex" />
        </a>

        {/* Bento nav grid */}
        <div className="hidden md:grid grid-cols-5 border border-white/[0.06] rounded-lg overflow-hidden bg-white/[0.02]">
          {NAV_ITEMS.map(({ id, label, num }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`relative px-5 py-2 text-[12px] tracking-[0.1em] uppercase transition-all duration-300 border-r last:border-r-0 border-white/[0.04] ${
                active === id
                  ? "bg-[#3b82f6]/10 text-white"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
              }`}
            >
              <span className="font-mono text-[9px] text-[#3b82f6]/50 mr-1.5">{num}</span>
              {label}
              {active === id && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#3b82f6] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Mobile: compact */}
        <div className="md:hidden flex border border-white/[0.06] rounded-lg overflow-hidden bg-white/[0.02]">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`px-3 py-2 text-[10px] tracking-wider uppercase transition-all border-r last:border-r-0 border-white/[0.04] ${
                active === id ? "bg-[#3b82f6]/10 text-white" : "text-white/25"
              }`}
            >
              {label.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
