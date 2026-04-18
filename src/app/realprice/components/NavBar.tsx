"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "valorar", label: "Tasación", num: "01" },
  { id: "mapa", label: "Mapa", num: "02" },
  { id: "radar", label: "Radar", num: "03" },
  { id: "inversion", label: "Inversión", num: "04" },
  { id: "reforma", label: "Reformas", num: "05" },
];

export default function NavBar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.5);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { threshold: [0.2, 0.5], rootMargin: "-80px 0px -40% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo editorial */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 group"
        >
          <span className="font-['Fraunces'] text-[20px] font-light italic text-white leading-none">
            RP
          </span>
          <div className="w-px h-6 bg-white/15" />
          <span className="hidden sm:block font-mono text-[9px] tracking-[0.35em] uppercase text-white/50 group-hover:text-white/70 transition-colors">
            Real<span className="text-white">Price</span>
          </span>
        </button>

        {/* Desktop nav — editorial style */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center border border-white/[0.06] overflow-hidden">
            {NAV_ITEMS.map(({ id, label, num }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`relative px-5 py-2.5 transition-all duration-300 border-r last:border-r-0 border-white/[0.04] group ${
                    isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-mono text-[9px] transition-colors ${
                        isActive ? "text-white/60" : "text-white/25"
                      }`}
                    >
                      {num}
                    </span>
                    <span
                      className={`text-[11px] tracking-[0.15em] uppercase transition-colors ${
                        isActive ? "text-white" : "text-white/40 group-hover:text-white/70"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      className="absolute bottom-0 left-0 right-0 h-px bg-white"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile nav — horizontal scroll */}
        <div className="md:hidden flex border border-white/[0.06] overflow-hidden">
          {NAV_ITEMS.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-3 py-2 text-[9px] tracking-[0.15em] uppercase transition-all border-r last:border-r-0 border-white/[0.04] ${
                  isActive ? "bg-white/[0.08] text-white" : "text-white/30"
                }`}
              >
                {label.slice(0, 4)}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
