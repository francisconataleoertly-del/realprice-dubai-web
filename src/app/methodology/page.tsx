import Link from "next/link";

import FonatPropLogo from "@/components/brand/FonatPropLogo";

const dubaiMetrics = [
  ["234K+", "verified Dubai transactions"],
  ["0.889", "R2 backtest score"],
  ["12.7%", "MAPE"],
  ["81.6%", "within 20% band"],
];

const proofSteps = [
  {
    title: "Use official transaction evidence",
    body: "Dubai uses verified DLD transaction history. France uses DVF public transaction data and DPE context.",
  },
  {
    title: "Return a range, not a fake certainty",
    body: "Public users see a broad band. Agents keep the private valuation workflow and final professional judgment.",
  },
  {
    title: "Publish accuracy as a product layer",
    body: "FonatProp should show sample size, median error and confidence bands so buyers can trust the engine.",
  },
  {
    title: "Retest by market",
    body: "Dubai and France stay separate because their data laws, fees, energy rules and price behavior are different.",
  },
];

const franceLayers = [
  "DVF transactions for commune and property-type benchmarks",
  "DPE energy class for price and rental legality risk",
  "Rent-cap and zone-tendue checks before yield is trusted",
  "Renovation aids and DPE work plans for net capex",
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#05060a] px-6 py-16 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <FonatPropLogo variant="lockup" className="h-auto w-full max-w-[330px] opacity-90" priority />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/broker-demo"
              className="rounded-full border border-white/12 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60 transition hover:text-white"
            >
              Broker demo
            </Link>
            <Link
              href="/fonatprop"
              className="rounded-full border border-white/12 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60 transition hover:text-white"
            >
              Dubai
            </Link>
            <Link
              href="/france"
              className="rounded-full border border-white/12 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60 transition hover:text-white"
            >
              France
            </Link>
          </div>
        </div>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-blue-200/55">
              Public accuracy proof
            </p>
            <h1 className="font-['Fraunces'] text-[clamp(3.2rem,8vw,7.2rem)] font-light leading-[0.88] tracking-[-0.06em]">
              Trust the range.
              <br />
              <span className="italic text-white/40">Audit the model.</span>
            </h1>
          </div>
          <p className="max-w-2xl text-[16px] leading-8 text-white/58">
            FonatProp is designed to sell confidence, not magic. The public product shows clear
            evidence, a confidence band and the data limits behind each valuation before an agent
            turns it into a final recommendation.
          </p>
        </section>

        <section className="mt-16 grid gap-px overflow-hidden rounded-[34px] border border-white/[0.08] bg-white/[0.06] md:grid-cols-4">
          {dubaiMetrics.map(([value, label]) => (
            <article key={label} className="bg-[#090a10]/94 p-7">
              <p className="font-['Fraunces'] text-5xl font-light tracking-[-0.05em] text-white">
                {value}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/34">
                {label}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
              How the public test should work
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {proofSteps.map((step) => (
                <div key={step.title} className="rounded-[24px] border border-white/[0.07] bg-[#0b0c12]/80 p-5">
                  <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/52">{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-blue-300/15 bg-blue-400/[0.06] p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-100/62">
              France commercial proof
            </p>
            <h2 className="mt-4 font-['Fraunces'] text-4xl font-light tracking-[-0.05em]">
              Official data plus compliance.
            </h2>
            <div className="mt-6 space-y-3">
              {franceLayers.map((layer) => (
                <div key={layer} className="rounded-2xl border border-white/10 bg-[#0b0c12]/70 px-4 py-3 text-sm leading-6 text-white/60">
                  {layer}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-white/46">
              France should be sold as a commercial beta until the address-level backtest is
              published. The product can already be valuable because investment and renovation
              require regulation, DPE and net capex, not only a single price.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
