"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "valorar", label: "Valuation" },
  { id: "mapa", label: "Map" },
  { id: "radar", label: "Radar" },
  { id: "inversion", label: "Investment" },
  { id: "reforma", label: "Renovation" },
];

export default function NavBar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
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
      className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        scrolled ? "opacity-100" : "opacity-100"
      }`}
    >
      {/* Floating pill — centered */}
      <div
        className={`relative flex items-center gap-1 px-2 py-1.5 rounded-full border transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : "bg-[#0a0a0f]/40 backdrop-blur-md border-white/[0.06]"
        }`}
      >
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="relative px-4 md:px-5 py-2 group"
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-white"
                />
              )}
              <span
                className={`relative text-[12px] md:text-[13px] tracking-wide font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-[#0a0a0f]"
                    : "text-white/60 group-hover:text-white"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
