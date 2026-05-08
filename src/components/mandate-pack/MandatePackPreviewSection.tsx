"use client";

import Link from "next/link";

import { demoDubaiMandatePack } from "@/data/mandate-pack-demo";

const previewCards = [
  {
    title: "Seller-ready",
    body: "The owner understands the recommended price, the range and the next step without a long explanation.",
  },
  {
    title: "AI-backed",
    body: "The broker gets confidence logic, recent comparables and a clearer pricing conversation.",
  },
  {
    title: "Shareable",
    body: "Open it in the office, send it to the owner, or print it as a clean PDF in one click.",
  },
];

const aed = (value: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(value);

export default function MandatePackPreviewSection() {
  return (
    <section className="bg-[#f4f1ea] px-5 py-24 text-[#15120f]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.34em] text-[#3b82f6]">
              Product 03 / Mandate Pack
            </p>
            <h2 className="max-w-3xl font-['Fraunces'] text-[clamp(2.8rem,6vw,6rem)] font-light leading-[0.9] tracking-[-0.055em]">
              Turn the valuation
              <br />
              <span className="italic text-[#15120f]/42">into a seller report.</span>
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-8 text-[#15120f]/58">
              After the private AI valuation, the broker needs a clean deliverable: recommended
              price, comparables, confidence and next steps for the owner conversation.
            </p>

            <div className="mt-8 space-y-4">
              {previewCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[26px] border border-black/10 bg-white/72 p-5 shadow-[0_18px_48px_rgba(21,18,15,0.08)]"
                >
                  <h3 className="text-xl font-semibold tracking-[-0.04em]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-black/58">{card.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/broker-demo/mandate-pack"
                className="rounded-full bg-[#15120f] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.26em] text-white transition hover:bg-black"
              >
                Open report
              </Link>
              <Link
                href="/broker-demo/mandate-pack?seller=1"
                className="rounded-full border border-black/12 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.26em] text-black/72 transition hover:border-black/25 hover:text-black"
              >
                Seller view
              </Link>
            </div>
          </div>

          <div className="rounded-[34px] border border-black/10 bg-[#0d1017] p-5 text-white shadow-[0_30px_90px_rgba(21,18,15,0.18)]">
            <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue-200/62">
                    Dubai / Mandate Pack
                  </p>
                  <h3 className="mt-3 font-['Fraunces'] text-4xl font-light tracking-[-0.05em]">
                    Seller pricing report.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/56">
                    {demoDubaiMandatePack.property.address}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/32">
                    Recommended value
                  </p>
                  <p className="mt-2 font-['Fraunces'] text-2xl font-light">
                    <span className="mr-1 text-[0.55em] text-white/34">AED</span>
                    {aed(demoDubaiMandatePack.valuation.predicted_aed)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34">
                    Fast sale
                  </p>
                  <p className="mt-2 text-sm text-white">
                    AED {aed(demoDubaiMandatePack.listing_strategy.fast_sale_aed)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-blue-300/35 bg-blue-400/[0.08] p-4 shadow-[0_0_24px_rgba(96,165,250,0.15)]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-blue-100/70">
                    Target price
                  </p>
                  <p className="mt-2 text-sm text-white">
                    AED {aed(demoDubaiMandatePack.listing_strategy.target_aed)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34">
                    Ambitious
                  </p>
                  <p className="mt-2 text-sm text-white">
                    AED {aed(demoDubaiMandatePack.listing_strategy.ambitious_aed)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34">
                    Comparable evidence
                  </p>
                  <div className="mt-3 space-y-3">
                    {demoDubaiMandatePack.comparables.slice(0, 3).map((item) => (
                      <div key={`${item.building}-${item.date}`} className="flex items-center justify-between gap-4 text-sm">
                        <div>
                          <p className="text-white/78">{item.building}</p>
                          <p className="text-xs text-white/38">
                            {item.date} · {item.area_sqft} sqft
                          </p>
                        </div>
                        <p className="font-mono text-white/66">AED {aed(item.price_aed)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34">
                    Why brokers like it
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-white/58">
                    <p>Confidence band included.</p>
                    <p>Negotiation floor stays private.</p>
                    <p>Owner can read it alone.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
