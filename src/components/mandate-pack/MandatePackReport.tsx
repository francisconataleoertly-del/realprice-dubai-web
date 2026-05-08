import ValuationReliabilityPanel from "@/components/valuation/ValuationReliabilityPanel";
import type { MandatePackReport as MandatePackReportShape } from "@/data/mandate-pack-demo";

type ViewMode = "broker" | "seller";

type Props = {
  report: MandatePackReportShape;
  viewMode?: ViewMode;
};

const aed = (value: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(value);

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function PriceStrategyCard({
  label,
  value,
  tone,
  active = false,
}: {
  label: string;
  value: number;
  tone: "white" | "blue" | "amber";
  active?: boolean;
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-300/35 bg-blue-400/[0.08] text-blue-50 print:border-sky-300 print:bg-sky-50 print:text-slate-900"
      : tone === "amber"
        ? "border-amber-300/30 bg-amber-300/[0.08] text-amber-50 print:border-amber-300 print:bg-amber-50 print:text-slate-900"
        : "border-white/12 bg-white/[0.04] text-white print:border-slate-300 print:bg-white print:text-slate-900";

  return (
    <div
      className={`rounded-[24px] border p-5 ${toneClass} ${active ? "shadow-[0_0_40px_rgba(96,165,250,0.14)] print:shadow-none" : ""}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-current/65">{label}</p>
      <p className="mt-4 font-['Fraunces'] text-[2.2rem] font-light tracking-[-0.045em]">
        <span className="mr-1 text-[0.5em] text-current/55">AED</span>
        {aed(value)}
      </p>
    </div>
  );
}

function ExecutiveMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/18 p-4 print:border-black/10 print:bg-slate-50">
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34 print:text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-white print:text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs leading-6 text-white/42 print:text-slate-500">{detail}</p>}
    </div>
  );
}

export default function MandatePackReport({ report, viewMode = "broker" }: Props) {
  const isSeller = viewMode === "seller";
  const accent = report.branding?.accent_hex || "#60a5fa";
  const logoSrc = report.branding?.logo_data_url || "/brand/fonatprop-final-icon-circle.png";

  return (
    <div className="mandate-pack-report rounded-[34px] border border-white/10 bg-[#0d1017] text-white shadow-[0_34px_110px_rgba(0,0,0,0.32)] print:rounded-none print:border-0 print:bg-white print:text-black print:shadow-none">
      <div className="mandate-pack-section border-b border-white/8 px-6 py-6 print:border-black/10 print:px-0 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-4">
              <img
                src={logoSrc}
                alt={report.agency.name}
                className="h-14 w-14 rounded-full border border-white/10 bg-white/5 object-cover p-1 print:border-black/10"
              />
              <div>
                <p className="text-sm text-white print:text-slate-900">{report.agency.name}</p>
                <p className="mt-1 text-xs text-white/42 print:text-slate-500">
                  {report.agent.name} / {report.agent.title}
                </p>
              </div>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.34em] print:text-slate-500" style={{ color: accent }}>
              {report.market} / {report.title}
            </p>
            <h1 className="mt-3 font-['Fraunces'] text-[clamp(2.3rem,4.4vw,4.2rem)] font-light leading-[0.92] tracking-[-0.05em]">
              {isSeller ? "Seller pricing report." : "Broker mandate pack."}
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-white/62 print:text-slate-700">
              {isSeller ? report.seller_summary : report.subtitle}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-white/62 print:text-slate-700 md:min-w-[320px]">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 print:border-black/10 print:bg-slate-50">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34 print:text-slate-500">
                Prepared for
              </p>
              <p className="mt-2 text-white">{report.owner.name}</p>
              <p className="mt-1 text-white/48 print:text-slate-500">
                {report.owner.intent} / {report.owner.timeline}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 print:border-black/10 print:bg-slate-50">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/34 print:text-slate-500">
                Prepared by
              </p>
              <p className="mt-2 text-white">{report.agent.name}</p>
              <p className="mt-1 text-white/48 print:text-slate-500">{report.agency.name}</p>
              <p className="mt-1 text-white/48 print:text-slate-500">{report.agency.office}</p>
              <p className="mt-1 text-white/48 print:text-slate-500">
                {report.agency.phone} / {report.agency.website}
              </p>
              <p className="mt-1 text-white/48 print:text-slate-500">{formatDate(report.generated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mandate-pack-section px-6 py-6 print:px-0 md:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <ExecutiveMetric
            label="Property"
            value={`${report.property.type} / ${report.property.rooms}`}
            detail={`${report.property.area_sqft} sqft / ${report.property.community}`}
          />
          <ExecutiveMetric
            label="Recommended value"
            value={`AED ${aed(report.valuation.predicted_aed)}`}
            detail={`USD ${usd(report.valuation.predicted_usd)}`}
          />
          <ExecutiveMetric
            label="AI range"
            value={`AED ${aed(report.valuation.confidence_low_aed)} to AED ${aed(report.valuation.confidence_high_aed)}`}
            detail={`+/- ${report.valuation.confidence_pct.toFixed(1)}% confidence band`}
          />
          <ExecutiveMetric
            label="Recommended action"
            value={report.listing_strategy.recommended_label}
            detail={`Expected live period ${report.listing_strategy.expected_days_live}`}
          />
        </div>
      </div>

      <div className="grid gap-8 px-6 py-2 print:px-0 md:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-7">
          <div className="mandate-pack-section rounded-[30px] border border-white/10 bg-white/[0.035] p-6 print:border-black/10 print:bg-slate-50 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/32 print:text-slate-500">
                  Recommended market value
                </p>
                <p className="mt-3 font-['Fraunces'] text-[clamp(2.8rem,5vw,5rem)] font-light leading-[0.9] tracking-[-0.055em]">
                  <span className="mr-2 text-[0.34em] text-white/34 print:text-slate-500">AED</span>
                  {aed(report.valuation.predicted_aed)}
                </p>
                <p className="mt-3 text-sm text-white/46 print:text-slate-500">
                  Based on {report.valuation.evidence_scope.toLowerCase()} and recent comparable activity.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 px-5 py-4 print:border-black/10 print:bg-white">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/32 print:text-slate-500">
                  Owner summary
                </p>
                <p className="mt-2 max-w-sm text-sm leading-7 text-white/78 print:text-slate-800">
                  {report.seller_summary}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <PriceStrategyCard label="Fast sale" value={report.listing_strategy.fast_sale_aed} tone="white" />
              <PriceStrategyCard
                label={report.listing_strategy.recommended_label}
                value={report.listing_strategy.target_aed}
                tone="blue"
                active
              />
              <PriceStrategyCard label="Ambitious" value={report.listing_strategy.ambitious_aed} tone="amber" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ExecutiveMetric
                label="Negotiation floor"
                value={`AED ${aed(report.listing_strategy.negotiation_floor_aed)}`}
              />
              <ExecutiveMetric
                label="Price per sqft"
                value={`AED ${aed(report.valuation.price_per_sqft_aed)}`}
              />
              <ExecutiveMetric label="Expected live period" value={report.listing_strategy.expected_days_live} />
            </div>
          </div>

          <div className="mandate-pack-section rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:border-black/10 print:bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34 print:text-slate-500">
                  Comparable evidence
                </p>
                <p className="mt-2 text-sm text-white/52 print:text-slate-600">
                  Recent comparable sales supporting the mandate conversation.
                </p>
              </div>
              <div className="rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/44 print:border-black/10 print:text-slate-500">
                {report.comparables.length} comps
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {report.comparables.map((item) => (
                <div
                  key={`${item.building}-${item.date}-${item.price_aed}`}
                  className="grid gap-3 rounded-[20px] border border-white/8 bg-black/18 p-4 print:border-black/10 print:bg-slate-50 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.6fr]"
                >
                  <div>
                    <p className="text-sm text-white print:text-slate-900">{item.building}</p>
                    <p className="mt-1 text-xs text-white/42 print:text-slate-500">
                      {item.date} / {item.rooms} / {item.area_sqft} sqft
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34 print:text-slate-500">
                      Sale price
                    </p>
                    <p className="mt-2 text-sm text-white print:text-slate-900">AED {aed(item.price_aed)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34 print:text-slate-500">
                      AED / sqft
                    </p>
                    <p className="mt-2 text-sm text-white print:text-slate-900">{aed(item.price_per_sqft_aed)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34 print:text-slate-500">
                      Match
                    </p>
                    <p className="mt-2 text-sm text-white print:text-slate-900">{item.similarity_label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mandate-pack-section rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:border-black/10 print:bg-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34 print:text-slate-500">
              Recommended next steps
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {report.next_actions.map((step) => (
                <div
                  key={step}
                  className="rounded-[20px] border border-white/8 bg-black/18 p-4 text-sm leading-7 text-white/68 print:border-black/10 print:bg-slate-50 print:text-slate-700"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-7">
          <div className="mandate-pack-section rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:border-black/10 print:bg-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34 print:text-slate-500">
              Property summary
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Building", report.property.building],
                ["Community", report.property.community],
                ["Status", report.property.status],
                ["Parking", report.property.parking],
                ["View", report.property.view],
                ["Area", `${report.property.area_m2} sqm / ${report.property.area_sqft} sqft`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-white/8 bg-black/18 p-4 print:border-black/10 print:bg-slate-50"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34 print:text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-sm text-white/78 print:text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mandate-pack-section print:hidden">
            {!isSeller && <ValuationReliabilityPanel reliability={report.reliability} compact />}
          </div>

          <div className="mandate-pack-section rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:border-black/10 print:bg-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34 print:text-slate-500">
              Confidence summary
            </p>
            <div className="mt-5 grid gap-3">
              <ExecutiveMetric
                label="Reliability"
                value={report.reliability.label}
                detail={`${report.reliability.score}/100 internal confidence score`}
              />
              <ExecutiveMetric
                label="Evidence depth"
                value={report.reliability.evidence[1]?.value || "Model evidence"}
                detail={report.reliability.evidence[1]?.detail}
              />
              <ExecutiveMetric
                label="Method"
                value={report.valuation.evidence_scope}
                detail="Broker should still confirm upgrades, floor, view and live competition."
              />
            </div>
          </div>

          <div className="mandate-pack-section rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:border-black/10 print:bg-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34 print:text-slate-500">
              Market signals
            </p>
            <div className="mt-5 space-y-3">
              {report.market_signals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-[20px] border border-white/8 bg-black/18 p-4 print:border-black/10 print:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/34 print:text-slate-500">
                      {signal.label}
                    </p>
                    <p className="text-sm text-white print:text-slate-900">{signal.value}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/58 print:text-slate-700">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mandate-pack-section rounded-[30px] border border-white/10 bg-white/[0.03] p-6 print:border-black/10 print:bg-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/34 print:text-slate-500">
              {isSeller ? "What happens next" : "Broker notes"}
            </p>
            <div className="mt-5 space-y-3">
              {(isSeller ? report.next_actions : report.broker_notes).map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-white/8 bg-black/18 p-4 text-sm leading-7 text-white/64 print:border-black/10 print:bg-slate-50 print:text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mandate-pack-section border-t border-white/8 px-6 py-5 print:border-black/10 print:px-0 md:px-8">
        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <p className="text-sm leading-7 text-white/42 print:text-slate-500">{report.disclaimer}</p>
          <div className="text-sm text-white/54 print:text-slate-600 md:text-right">
            <p>{report.agency.name}</p>
            <p className="mt-1">
              {report.agent.email} / {report.agent.whatsapp}
            </p>
            <p className="mt-1">{report.agency.website}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
