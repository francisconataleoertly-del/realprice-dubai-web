"use client";

import { useState } from "react";

import FonatPropLogo from "@/components/brand/FonatPropLogo";

export default function BrokerDemoAccessPageClient({
  nextPath = "/broker-demo",
}: {
  nextPath?: string;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/broker-demo/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Private broker access could not be opened.");
      }

      window.location.assign(nextPath);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Private broker access could not be opened.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="pt-16">
          <FonatPropLogo
            variant="lockup"
            className="mb-10 h-auto w-full max-w-[390px] rounded-2xl opacity-90 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
            priority
          />
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-white/28">
            Private Broker Demo
          </p>
          <h1 className="max-w-3xl font-['Fraunces'] text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.92] tracking-[-0.03em] text-white">
            Protected access
            <br />
            <span className="font-extralight italic text-white/40">for selected brokerages.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-8 text-white/52">
            FonatProp keeps the public brand visible, but the live broker demo stays private.
            That way agencies can test the product without exposing the implementation recipe,
            workflow details or internal report logic to everyone on the web.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Valuation",
                description: "Private AI pricing workflow for brokers only.",
              },
              {
                label: "Widget",
                description: "Public-facing experience, private implementation details.",
              },
              {
                label: "Mandate Pack",
                description: "Seller-ready report, PDF and pricing strategy layer.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5"
              >
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/26">
                  {item.label}
                </p>
                <p className="text-[15px] leading-7 text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[32px] border border-white/10 bg-[#0b0c12]/86 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-white/28">
            Controlled preview
          </p>
          <p className="mb-6 text-[28px] font-light tracking-[-0.02em] text-white">
            Open the private demo
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                Broker access password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter the private demo password"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-white placeholder:text-white/18 outline-none transition-colors focus:border-white/24"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[13px] text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white px-5 py-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[#0a0a0f] disabled:opacity-45"
            >
              {loading ? "Opening demo..." : "Enter broker demo"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#3b82f6]/15 bg-[#3b82f6]/[0.05] px-4 py-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#7fb3ff]">
              Why this gate exists
            </p>
            <p className="text-[13px] leading-7 text-white/60">
              The goal is simple: let the buyer taste the product without giving away the full
              implementation to every random visitor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
