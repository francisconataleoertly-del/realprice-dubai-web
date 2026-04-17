"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Map, BarChart3, Home } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/valuate", label: "Valuate", icon: Building2 },
  { href: "/map", label: "Map", icon: Map },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-card-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Building2 className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold gold-text">RealPrice</span>
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
