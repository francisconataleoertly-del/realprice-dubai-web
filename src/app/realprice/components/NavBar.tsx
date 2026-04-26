"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import FonatPropLogo from "@/components/brand/FonatPropLogo";

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
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="fixed top-5 md:top-7 left-1/2 -translate-x-1/2 z-50"
    >
      {/* Glow halo (subtle) */}
      <div
        className={`absolute -inset-3 rounded-full blur-xl transition-opacity duration-700 pointer-events-none ${
          scrolled ? "opacity-40" : "opacity-20"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)",
        }}
      />

      {/* The pill */}
      <div
        className={`relative flex items-center rounded-full border backdrop-blur-2xl transition-all duration-700 ${
          scrolled
            ? "bg-[#0a0a0f]/75 border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "bg-[#0a0a0f]/35 border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        }`}
      >
        {/* Left brand mark */}
        <div className="pl-3 pr-3 py-1.5 flex items-center gap-2">
          <FonatPropLogo
            variant="mark"
            className="h-8 w-8 rounded-full border border-white/10 shadow-[0_0_18px_rgba(59,130,246,0.18)]"
            imageClassName="scale-125"
            priority
          />
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Nav items */}
        <div className="flex items-center px-1">
          {NAV_ITEMS.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="relative px-4 md:px-5 py-2.5 group"
              >
                <span
                  className={`relative text-[12px] tracking-[0.01em] transition-colors duration-300 ${
                    isActive
                      ? "text-white font-medium"
                      : "text-white/45 group-hover:text-white/85 font-normal"
                  }`}
                >
                  {label}
                </span>

                {/* Active dot indicator — tiny below */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-dot"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                  />
                )}

                {/* Hover background — very subtle */}
                <span
                  className={`absolute inset-1 rounded-full transition-opacity duration-300 pointer-events-none ${
                    isActive
                      ? "opacity-0"
                      : "opacity-0 group-hover:opacity-100 bg-white/[0.04]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
