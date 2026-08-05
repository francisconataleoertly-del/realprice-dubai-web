"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Banknote, Check, CreditCard, ShieldCheck } from "lucide-react";

import SessionRail from "@/components/access/SessionRail";
import FonatPropLogo from "@/components/brand/FonatPropLogo";

type PlanCode = "launch" | "private-label" | "growth" | "premium";
type BillingCycle = "monthly" | "annual";
type PaymentMethod = "card" | "transfer";

// Keep the commercial target separate from the public card amount. Paddle's
// published Checkout fee is 5% + USD 0.50 per transaction.
const PADDLE_CHECKOUT_PERCENT = Number(process.env.NEXT_PUBLIC_PADDLE_CHECKOUT_PERCENT ?? "0.05");
const PADDLE_CHECKOUT_FIXED_USD = Number(process.env.NEXT_PUBLIC_PADDLE_CHECKOUT_FIXED_USD ?? "0.50");
// Cross-border transfer costs vary by account, currency and withdrawal route.
// Keep a conservative configurable reserve until the signed-in provider quote
// for the Dubai -> Argentina corridor is confirmed.
const TRANSFER_FEE_PERCENT = Number(process.env.NEXT_PUBLIC_TRANSFER_FEE_RATE ?? "0.04");
const TRANSFER_FIXED_USD = Number(process.env.NEXT_PUBLIC_TRANSFER_FIXED_FEE_USD ?? "0");

function grossUpCardPrice(netUsd: number) {
  return (netUsd + PADDLE_CHECKOUT_FIXED_USD) / (1 - PADDLE_CHECKOUT_PERCENT);
}

function grossUpTransferPrice(netUsd: number) {
  return (netUsd + TRANSFER_FIXED_USD) / (1 - TRANSFER_FEE_PERCENT);
}

// Keep card checkout easy to quote: always round up, never down.
function roundCardPrice(value: number, billing: BillingCycle) {
  const increment = billing === "annual" ? 100 : 10;
  return Math.ceil(value / increment) * increment;
}

function roundTransferPrice(value: number, billing: BillingCycle) {
  const increment = billing === "annual" ? 100 : 10;
  return Math.ceil(value / increment) * increment;
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const plans: Record<
  PlanCode,
  {
    label: string;
    title: string;
    netMonthly: number;
    netAnnual: number;
    annualNote: string;
    description: string;
    features: string[];
  }
> = {
  launch: {
    label: "Launch Widget",
    title: "Launch with FonatProp",
    netMonthly: 700,
    netAnnual: 7000,
    annualNote: "annual saves two months",
    description:
      "A branded private intake layer with FonatProp watermark, broker-ready inquiries and performance visibility.",
    features: [
      "FonatProp software fee: USD 700/month",
      "30-day free pilot",
      "White-label setup with FonatProp mark",
      "Private inquiry cards",
      "Broker-ready inquiry archive",
      "Private performance dashboard",
    ],
  },
  "private-label": {
    label: "Private label",
    title: "Own the experience",
    netMonthly: 1000,
    netAnnual: 10000,
    annualNote: "annual saves two months",
    description:
      "The same private acquisition experience, fully agency-branded and without visible FonatProp watermark.",
    features: [
      "FonatProp software fee: USD 1,000/month",
      "Everything in Launch Widget",
      "No FonatProp watermark",
      "Custom copy, photos and design",
      "Agency-branded reports",
      "Priority onboarding and optimization",
    ],
  },
  growth: {
    label: "Growth OS",
    title: "Seller Acquisition Operating System",
    netMonthly: 1500,
    netAnnual: 15000,
    annualNote: "annual saves two months",
    description:
      "FonatProp operates a private seller acquisition program with qualified demand, intake and measurable broker follow-up.",
    features: [
      "FonatProp operating fee: USD 1,500/month",
      "Everything in Private Label",
      "Managed demand program",
      "Agency-approved growth budget stays separate",
      "Private conversion workspace",
      "Monthly commercial performance review",
      "Optimization handled privately with the agency",
    ],
  },
  premium: {
    label: "Premium OS",
    title: "Run the acquisition system",
    netMonthly: 3000,
    netAnnual: 30000,
    annualNote: "annual saves two months",
    description:
      "A fuller real estate operating layer with advanced acquisition modules, private routing, reporting and priority support.",
    features: [
      "FonatProp premium operating fee: USD 3,000/month",
      "Everything in Growth OS",
      "Advanced acquisition modules",
      "Advanced private routing",
      "Monthly executive report",
      "Priority product support",
      "Agency-approved growth budget stays separate",
    ],
  },
};

const pilotTerms = [
  "30-day free pilot with personalized setup for the selected agency plan.",
  "Card details are handled by the hosted payment provider, not by FonatProp.",
  "If the pilot is not cancelled before it ends, the selected monthly or annual subscription can begin through the hosted checkout.",
  "Lead data stays private to the agency and is processed only to operate FonatProp, reports, analytics and abuse prevention.",
  "FonatProp measures commercial performance so the pilot can be evaluated with a clear before/after.",
  "Launch access includes visible FonatProp branding; private label and higher plans remove the visible watermark.",
  "Growth OS and Premium OS subscriptions are FonatProp operating fees. Any external growth budget is agreed separately and paid by the agency unless otherwise agreed in writing.",
  "FonatProp content, data, dashboards, reports and generated outputs may not be scraped, copied, resold, trained on or used for commercial extraction without written permission.",
];

function planFrom(value: string | null): PlanCode {
  if (value === "watermark") return "launch";
  if (value === "private-label" || value === "growth" || value === "premium") return value;
  return "launch";
}

function formatTrialDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const initialPlan = planFrom(searchParams.get("plan"));
  const initialBilling = searchParams.get("billing") === "annual" ? "annual" : "monthly";
  const missingCheckoutEnv = searchParams.get("missing");
  const [planCode, setPlanCode] = useState<PlanCode>(initialPlan);
  const [billing, setBilling] = useState<BillingCycle>(initialBilling);
  const [accepted, setAccepted] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [agency, setAgency] = useState("");
  const [email, setEmail] = useState("");
  const trialEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return formatTrialDate(date);
  }, []);

  const plan = plans[planCode];
  const netPrice = billing === "annual" ? plan.netAnnual : plan.netMonthly;
  const cardPrice = roundCardPrice(grossUpCardPrice(netPrice), billing);
  const price = formatUsd(cardPrice);
  const transferPrice = formatUsd(roundTransferPrice(grossUpTransferPrice(netPrice), billing));
  const priceUsd = cardPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const billingLabel = billing === "annual" ? "annual" : "monthly";
  const renewalFrequency = billing === "annual" ? "each year thereafter" : "each month thereafter";
  const checkoutPath = `/api/checkout-link?plan=${encodeURIComponent(planCode)}&billing=${encodeURIComponent(billing)}`;

  const fallbackMailto = useMemo(() => {
    const subject = encodeURIComponent(`FonatProp checkout - ${plan.title}`);
    const body = encodeURIComponent(
      [
        "Hi FonatProp,",
        "",
        `I want to start ${plan.title}.`,
        `Billing: ${billing}`,
        agency ? `Agency: ${agency}` : "",
        email ? `Billing email: ${email}` : "",
        "",
        "Please send the secure payment link.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return `mailto:contact@fonatprop.com?subject=${subject}&body=${body}`;
  }, [agency, billing, email, plan.title]);

  const paymentHref = paymentMethod === "transfer" ? fallbackMailto : checkoutPath;

  return (
    <main className="min-h-screen overflow-hidden bg-[#0a1018] text-white">
      <SessionRail surface="public" />
      <section className="relative px-6 pb-20 pt-10 md:px-10 lg:px-16">
        <div className="absolute inset-0 bg-[url('/dubai-slides/05-downtown-night.jpg')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(34,211,238,0.28),transparent_28%),linear-gradient(135deg,rgba(4,8,16,0.94),rgba(8,18,31,0.9)_54%,rgba(10,62,74,0.82))]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-5">
            <Link href="/fonatprop" className="inline-flex items-center gap-3 text-white/70 hover:text-white">
              <FonatPropLogo variant="mark" className="h-11 w-11 rounded-full border border-white/10" priority />
              <span className="font-mono text-[10px] uppercase tracking-[0.26em]">Back to FonatProp</span>
            </Link>
            <Link href="/pricing" className="hidden font-mono text-[10px] uppercase tracking-[0.26em] text-white/46 hover:text-white md:block">
              Pricing
            </Link>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="w-fit rounded-full border border-cyan-100/18 bg-cyan-100/[0.08] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-100/80">
                Secure checkout
              </p>
              <h1 className="mt-7 font-[var(--font-display)] text-[clamp(3rem,7vw,7rem)] font-light leading-[0.86] tracking-normal">
                Choose the
                <span className="block italic text-white/44">pilot setup.</span>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-8 text-white/66">
                Choose a plan, confirm the billing cycle and start a 30-day pilot. Card checkout and bank transfer are shown together so the commercial terms are clear before payment.
              </p>
              <div className="mt-8 grid gap-3 rounded-[24px] border border-cyan-100/18 bg-[#061421]/78 p-4 shadow-[0_20px_70px_rgba(34,211,238,0.08)] backdrop-blur md:grid-cols-3">
                {[
                  ["01", "Attract", "Qualified visitors to the agency surface."],
                  ["02", "Qualify", "Property intent becomes a private agency inquiry."],
                  ["03", "Prove", "Dashboard shows commercial movement."],
                ].map(([step, title, body]) => (
                  <div key={step} className="rounded-[18px] border border-white/10 bg-white/[0.045] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/48">{step}</p>
                    <p className="mt-3 text-xl font-semibold tracking-normal text-white">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/54">{body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[20px] border border-amber-100/14 bg-amber-100/[0.065] p-5 text-sm leading-7 text-amber-50/72">
                We do not replace web studios or agency websites. FonatProp adds a confidential acquisition layer around them.
              </div>
            </div>

            <div className="rounded-[30px] border border-white/12 bg-[#101a26]/88 p-5 shadow-[0_36px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-2">
                {(Object.keys(plans) as PlanCode[]).map((code) => {
                  const selected = code === planCode;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setPlanCode(code)}
                      className={`relative overflow-hidden rounded-[18px] border p-6 text-left transition ${
                        selected
                          ? "border-cyan-200/55 bg-cyan-100/[0.1]"
                          : "border-white/10 bg-[#08101b]/80 hover:border-white/22"
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-100/58">
                        {plans[code].label}
                      </p>
                      <p className="mt-5 text-2xl font-semibold tracking-normal">{plans[code].title}</p>
                      <p className="mt-3 text-sm leading-6 text-white/50">{plans[code].description}</p>
                      <p className="mt-6 font-[var(--font-display)] text-5xl font-light tracking-normal">
                        {formatUsd(roundCardPrice(grossUpCardPrice(plans[code].netMonthly), "monthly"))}
                        <span className="ml-2 font-sans text-sm text-white/38">/mo</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-cyan-100/12 bg-[#07101a] px-6 py-16 text-white md:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[url('/dubai-palm-bg.jpg')] bg-cover bg-center opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.18),transparent_28%),linear-gradient(110deg,rgba(7,16,26,0.96),rgba(7,16,26,0.82)_52%,rgba(6,45,60,0.68))]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative overflow-hidden rounded-[26px] border border-white/12 bg-[#08111d]/88 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[url('/dubai-slides/09-palm-aerial.jpg')] bg-cover bg-center opacity-10" />
            <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-700">
                  Billing
                </p>
                <h2 className="mt-4 font-[var(--font-display)] text-4xl font-light tracking-normal">
                  {plan.title}
                </h2>
              </div>
              <p className="font-[var(--font-display)] text-5xl font-light tracking-normal text-[#b98b1d]">
                {price}
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {(["monthly", "annual"] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBilling(cycle)}
                  className={`rounded-full border px-5 py-3 text-sm font-medium transition ${
                    billing === cycle
                      ? "border-cyan-200 bg-cyan-200 text-[#07101a]"
                      : "border-white/12 bg-white/[0.055] text-white/55 hover:text-white"
                  }`}
                >
                  {cycle === "monthly" ? "Monthly" : `Annual - ${plan.annualNote}`}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm text-white/66 last:border-b-0">
                  <Check className="h-4 w-4 text-cyan-200" />
                  {feature}
                </div>
              ))}
            </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[26px] border border-[#d7c8ae] bg-[#07101a] p-7 text-white shadow-[0_24px_80px_rgba(7,16,26,0.18)]">
            <div className="absolute inset-0 bg-[url('/dubai-slides/04-marina-night.jpg')] bg-cover bg-center opacity-24" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.22),transparent_24%),linear-gradient(135deg,rgba(7,16,26,0.94),rgba(7,16,26,0.78)_46%,rgba(6,22,35,0.64))]" />
            <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-100/50">
              Agency details
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={agency}
                onChange={(event) => setAgency(event.target.value)}
                placeholder="Agency name"
                className="rounded-[12px] border border-white/10 bg-[#07101a] px-4 py-4 text-sm text-white outline-none placeholder:text-white/24 focus:border-cyan-100/40"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Billing email"
                type="email"
                className="rounded-[12px] border border-white/10 bg-[#07101a] px-4 py-4 text-sm text-white outline-none placeholder:text-white/24 focus:border-cyan-100/40"
              />
            </div>

            {missingCheckoutEnv ? (
              <div className="mt-5 rounded-[16px] border border-amber-200/24 bg-amber-200/[0.08] p-5 text-sm leading-6 text-amber-50/78">
                The payment link for this option is not connected yet. Please use the contact route while FonatProp updates the hosted checkout URL.
              </div>
            ) : null}

            <div className="mt-5 rounded-[20px] border border-cyan-100/16 bg-cyan-100/[0.06] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/62">
                Direct transfer option
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                The selected plan is shown below through two separate payment routes. Card checkout includes the hosted card-processing reserve; direct transfer includes the current cross-border transfer reserve. FonatProp&apos;s target remains <span className="text-white">{formatUsd(netPrice)}</span> either way.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-cyan-100/20 bg-[#071522]/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-100/62">Card price</span>
                    <span className="text-lg font-semibold text-white">{price}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/48">Includes the estimated hosted card reserve of {Math.round(PADDLE_CHECKOUT_PERCENT * 100)}% + {formatUsd(PADDLE_CHECKOUT_FIXED_USD)}.</p>
                </div>
                <div className="rounded-[16px] border border-amber-100/20 bg-[#1a160d]/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-100/70">Transfer price</span>
                    <span className="text-lg font-semibold text-white">{transferPrice}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/48">Includes the current estimated transfer reserve of {Math.round(TRANSFER_FEE_PERCENT * 100)}%{TRANSFER_FIXED_USD ? ` + ${formatUsd(TRANSFER_FIXED_USD)}` : ""}. Confirmed before payment.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`rounded-[20px] border p-5 text-left transition ${
                  paymentMethod === "card"
                    ? "border-cyan-200/55 bg-cyan-100/[0.1]"
                    : "border-white/10 bg-white/[0.035] hover:border-white/25"
                }`}
              >
                <CreditCard className="h-5 w-5 text-cyan-100" />
                <p className="mt-4 text-lg font-medium tracking-normal">Card checkout</p>
                <p className="mt-3 font-[var(--font-display)] text-4xl font-light text-white">{price}</p>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  Continue to the secure hosted checkout for the selected plan and cycle.
                </p>
                <div className="mt-4 flex gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/42">
                  <span>Card</span><span>International</span><span>Secure</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`rounded-[20px] border p-5 text-left transition ${
                  paymentMethod === "transfer"
                    ? "border-amber-200/55 bg-amber-100/[0.1]"
                    : "border-white/10 bg-white/[0.035] hover:border-white/25"
                }`}
              >
                <Banknote className="h-5 w-5 text-amber-100" />
                <p className="mt-4 text-lg font-medium tracking-normal">Bank transfer</p>
                <p className="mt-3 font-[var(--font-display)] text-4xl font-light text-white">{transferPrice}</p>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  Request the preferred transfer rate and receive the payment instructions by email.
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-100/68">
                  Target price {transferPrice}
                </p>
                <div className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-white/42">
                  Rounded quote · Direct support
                </div>
              </button>
              <div className="rounded-[20px] border border-amber-100/12 bg-amber-100/[0.055] p-5 md:col-span-2">
                <ShieldCheck className="h-5 w-5 text-amber-100" />
                <p className="mt-4 text-lg font-medium tracking-normal">Pilot terms first</p>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  The agency confirms plan, billing cycle and onboarding terms before payment.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-cyan-100/14 bg-cyan-100/[0.055] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/58">
                Terms and billing statement
              </p>
              <p className="mt-4 text-sm leading-7 text-white/64">
                I agree to start a 30-day FonatProp pilot and accept the billing rules for the selected plan.
              </p>
              {showBillingDetails ? (
                <div className="mt-4 space-y-4 text-sm leading-7 text-white/64">
                  {paymentMethod === "card" ? (
                    <p>
                      I have read, understand, and agree to the FonatProp Terms of Service and Privacy Policy. The hosted payment provider securely handles my card details. If I do not cancel before the pilot ends, a recurring {billingLabel} subscription fee of{" "}
                      <span className="text-white">USD {priceUsd}</span> for <span className="text-white">{plan.title}</span> will be charged on <span className="text-white">{trialEndDate}</span> and {renewalFrequency} unless and until I cancel.
                    </p>
                  ) : (
                    <p>
                      I have read, understand, and agree to the FonatProp Terms of Service and Privacy Policy. I request the direct transfer quote of <span className="text-white">{transferPrice}</span> for <span className="text-white">{plan.title}</span> on a {billingLabel} billing cycle. This quote includes the current estimated processing reserve and FonatProp will confirm the transfer instructions before payment.
                    </p>
                  )}
                  <p>
                    Cancellations can be made through the cancellation link in the transaction receipt email, by emailing{" "}
                    <span className="text-white">contact@fonatprop.com</span>, or by WhatsApp at{" "}
                    <span className="text-white">+54 9 11 2640-9578</span>. Subscription fees are billed in advance,
                    non-refundable once the billing period has started, and cancellation must be processed before the next
                    billing cycle to prevent charges for the upcoming period.
                  </p>
                  <div className="grid gap-3 pt-2">
                    {pilotTerms
                      .filter((term) => paymentMethod === "card" || !term.startsWith("Card details"))
                      .map((term) => (
                      <div key={term} className="flex gap-3">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                  <p>
                    Please note that FONATPROP or the payment provider descriptor may show up on the billing statement.
                  </p>
                  <p>
                    Scraping, automated extraction, resale, model training or commercial reuse of FonatProp data, dashboards,
                    reports, designs, copy or generated outputs is not permitted without written approval.
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setShowBillingDetails((value) => !value)}
                className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-100/72 underline-offset-4 hover:text-cyan-50 hover:underline"
              >
                {showBillingDetails ? "Show less" : "Show more"}
              </button>
            </div>

            <label id="accept-terms" className="mt-4 flex cursor-pointer gap-4 rounded-[16px] border border-white/10 bg-white/[0.035] p-5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 accent-cyan-300"
              />
              <span className="text-sm leading-7 text-white/62">
                I accept the FonatProp pilot and billing statement above for the selected plan, billing cycle and trial expiration date.
              </span>
            </label>

            <a
              href={accepted ? paymentHref : "#accept-terms"}
              target={accepted ? "_blank" : undefined}
              rel={accepted ? "noopener noreferrer" : undefined}
              onClick={(event) => {
                if (!accepted) event.preventDefault();
              }}
              className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-semibold transition ${
                accepted
                  ? "bg-white text-[#07101a] hover:bg-cyan-50"
                  : "cursor-not-allowed bg-white/10 text-white/28"
              }`}
            >
              {paymentMethod === "transfer" ? "Request transfer terms" : "Continue to card checkout"}
              <ArrowRight className="h-4 w-4" />
            </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#07101a] px-6 py-14 text-white">
          <SessionRail surface="public" />
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/38">
            Loading checkout...
          </p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
