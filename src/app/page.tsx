"use client";

import Link from "next/link";
import { Building2, Map, BarChart3, TrendingUp, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Valuation",
    desc: "XGBoost model trained on 561K+ real DLD transactions from 2004 to 2023",
  },
  {
    icon: Map,
    title: "Interactive Map",
    desc: "Explore Dubai zones with price heatmaps and points of interest",
  },
  {
    icon: TrendingUp,
    title: "Market Analytics",
    desc: "Compare zones, track price trends, and analyze market dynamics",
  },
  {
    icon: Shield,
    title: "Real Data",
    desc: "Based on official Dubai Land Department transaction records",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="gold-text">Dubai Property</span>
              <br />
              <span className="text-foreground">Valuation Engine</span>
            </h1>
            <p className="text-lg text-muted mb-10 leading-relaxed">
              Get instant, AI-powered property valuations backed by 561,000+
              official DLD transactions. Built for investors, brokers, and
              developers.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/valuate"
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-background font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Start Valuation
              </Link>
              <Link
                href="/analytics"
                className="px-8 py-3 border border-card-border text-foreground font-semibold rounded-lg hover:border-primary/50 transition-all"
              >
                View Analytics
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              { value: "561K+", label: "Transactions" },
              { value: "75+", label: "Zones" },
              { value: "3,037", label: "Buildings" },
              { value: "2004-2023", label: "Date Range" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-card border border-card-border"
              >
                <div className="text-2xl font-bold gold-text">{stat.value}</div>
                <div className="text-sm text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl bg-card card-hover">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-card-border p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to valuate?</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            Enter a zone, property type, and area to get an instant AI-powered
            price estimate.
          </p>
          <Link
            href="/valuate"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-all"
          >
            <Building2 className="w-5 h-5" />
            Get Valuation
          </Link>
        </div>
      </section>
    </div>
  );
}
