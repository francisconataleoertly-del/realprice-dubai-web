"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Map, BarChart3, Home } from "lucide-react";

import FonatPropLogo from "@/components/brand/FonatPropLogo";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/valuate", label: "Valuate", icon: Building2 },
  { href: "/map", label: "Map", icon: Map },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === "/" || pathname?.startsWith("/france")) {
    return null;
  }

  if (pathname?.startsWith("/broker-demo")) {
    return (
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#05060a]/92 text-white backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/broker-demo" className="flex items-center gap-3">
            <FonatPropLogo
              variant="mark"
              className="h-10 w-10 rounded-2xl border border-white/12 bg-white/[0.04] shadow-[0_0_28px_rgba(59,130,246,0.16)]"
              imageClassName="scale-125"
              priority
            />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">
                Agency Sales Preview
              </p>
              <p className="text-sm font-medium tracking-[-0.02em] text-white">
                FonatProp for broker websites
              </p>
            </div>
          </Link>

          <div className="hidden items-center rounded-full border border-white/10 bg-white/[0.035] p-1 sm:flex">
            <a
              href="#valuation"
              className="rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-white/65 transition-colors hover:bg-white/8 hover:text-white"
            >
              Valuation
            </a>
            <a
              href="#widget"
              className="rounded-full bg-white px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#0a0a0f]"
            >
              Widget
            </a>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-card-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <FonatPropLogo
              variant="mark"
              className="h-9 w-9 rounded-xl border border-white/10 shadow-[0_0_22px_rgba(59,130,246,0.14)]"
              imageClassName="scale-125"
            />
            <FonatPropLogo variant="nav" className="h-9 w-[150px]" />
            <span className="text-xs text-muted font-medium px-2 py-0.5 rounded-full border border-card-border">
              DUBAI
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:text-foreground hover:bg-card"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
