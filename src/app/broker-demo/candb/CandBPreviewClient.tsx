"use client";

import { useEffect, useMemo, useState } from "react";

type ReviewStep = "intro" | "form" | "success";

type ReviewForm = {
  property: string;
  type: string;
  bedrooms: string;
  area: string;
  intent: string;
  priority: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

const initialForm: ReviewForm = {
  property: "Dubai Marina",
  type: "Apartment",
  bedrooms: "2 BR",
  area: "120",
  intent: "Sell",
  priority: "Best price",
  name: "",
  email: "",
  phone: "",
  consent: false,
};

const photos = [
  {
    src: "/dubai-slides/05-downtown-night.jpg",
    label: "Downtown private client review",
    position: "center",
  },
  {
    src: "/dubai-slides/04-marina-night.jpg",
    label: "Marina evening demand",
    position: "center",
  },
  {
    src: "/dubai-slides/09-palm-aerial.jpg",
    label: "Palm Jumeirah investor context",
    position: "center",
  },
  {
    src: "/dubai-slides/02-burj-khalifa.jpg",
    label: "Prime Dubai valuation signal",
    position: "center",
  },
];

const snippet = `<div
  data-fonatprop-widget
  data-mode="banner"
  data-agency-id="candb"
  data-agency-token="C_AND_B_WIDGET_TOKEN"
  data-widget-mode="valuation"
  data-brand-color="#c9a46a"
  data-banner-title="Know your position before your next move."
  data-banner-cta="Request private review"
></div>
<script async src="https://fonatprop.com/widget/embed.js"></script>`;

const fieldOptions = {
  type: ["Apartment", "Villa", "Townhouse", "Penthouse", "Land"],
  bedrooms: ["Studio", "1 BR", "2 BR", "3 BR", "4+ BR"],
  intent: ["Sell", "Rent", "Hold", "Reinvest", "Not sure"],
  priority: ["Best price", "Speed", "Yield", "Clarity", "Reduce risk"],
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPhone(value: string) {
  return value.replace(/[^\d+]/g, "").length >= 8;
}

export default function CandBPreviewClient() {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [autoPhotos, setAutoPhotos] = useState(true);
  const [step, setStep] = useState<ReviewStep>("intro");
  const [form, setForm] = useState<ReviewForm>(initialForm);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [events, setEvents] = useState({
    view: 1,
    start: 0,
    lead: 0,
    handoff: 0,
  });

  useEffect(() => {
    if (!autoPhotos) return;
    const timer = window.setInterval(() => {
      setPhotoIndex((current) => (current + 1) % photos.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [autoPhotos]);

  const activePhoto = photos[photoIndex];

  const leadScore = useMemo(() => {
    let score = 54;
    if (form.intent === "Sell") score += 18;
    if (form.priority === "Speed") score += 10;
    if (form.priority === "Best price") score += 8;
    if (form.phone.trim()) score += 10;
    if (form.email.trim()) score += 6;
    return Math.min(score, 96);
  }, [form]);

  const handoff = useMemo(
    () => ({
      source: "C&B private review widget",
      property: form.property || "Dubai property",
      intent: form.intent,
      priority: form.priority,
      contact: form.name ? `${form.name} / ${form.phone || "phone pending"}` : "Lead contact pending",
      leadScore,
    }),
    [form, leadScore],
  );

  function choosePhoto(index: number) {
    setAutoPhotos(false);
    setPhotoIndex((index + photos.length) % photos.length);
  }

  function updateField<K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startReview() {
    setStep("form");
    setErrors([]);
    setEvents((current) => ({ ...current, start: Math.max(current.start, 1) }));
  }

  function submitReview() {
    const nextErrors: string[] = [];
    if (!form.property.trim()) nextErrors.push("Add the property, building or zone.");
    if (!form.area.trim() || Number(form.area) <= 0) nextErrors.push("Add an approximate size.");
    if (!form.name.trim()) nextErrors.push("Add your name.");
    if (!isEmail(form.email)) nextErrors.push("Add a valid email.");
    if (!isPhone(form.phone)) nextErrors.push("Add a valid WhatsApp number.");
    if (!form.consent) nextErrors.push("Confirm consent so C&B can follow up.");

    setErrors(nextErrors);
    if (nextErrors.length) return;

    setSubmittedAt(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }).format(new Date()),
    );
    setStep("success");
    setEvents((current) => ({ ...current, lead: 1, handoff: 1 }));
  }

  function resetPreview() {
    setStep("intro");
    setForm(initialForm);
    setErrors([]);
    setSubmittedAt(null);
  }

  return (
    <main className="candb-page">
      <section className="candb-hero">
        <div className="candb-hero__bg" />
        <nav className="candb-nav" aria-label="C&B preview navigation">
          <span className="candb-brand"><strong>C&amp;B</strong><small>PROJECT PROPERTIES</small></span>
          <div className="candb-nav__links" aria-label="C&B navigation preview">
            <span>Buy</span>
            <span>Rent</span>
            <span>Area Guides</span>
            <span>About us</span>
            <span>Meet our team</span>
            <span>Services</span>
          </div>
          <a className="candb-nav__phone" href="tel:+971508928199">+971 50 892 8199 ↗</a>
        </nav>

        <div className="candb-hero__content">
          <p className="candb-eyebrow">C&B Project / Dubai boutique agency</p>
          <h1>Less talk.<br />Smarter investments.<br />C&amp;B Project.</h1>
          <p>
            No pressure. No mass listings. No generic advice.
          </p>
          <div className="candb-hero__actions">
            <a href="#candb-widget" className="candb-button candb-button--primary">
              View widget
            </a>
            <a href="#candb-analytics" className="candb-button candb-button--ghost">
              View analytics
            </a>
          </div>
        </div>
      </section>

      <section className="candb-reference candb-reference--mockup" aria-label="C&B homepage with integrated FonatProp widget">
        <div className="candb-reference__heading">
          <p className="candb-eyebrow">Private implementation preview</p>
          <h2>C&B&apos;s homepage, with the review layer inside it.</h2>
          <p>
            A wide, branded placement that feels native to the C&B experience instead of looking like a separate app.
          </p>
        </div>
        <div className="candb-site-mockup">
          <img src="/candb/candb-homepage-reference.png" alt="C&B public homepage visual reference" />
          <div className="candb-site-mockup__scrim" aria-hidden="true" />
          <div className="candb-site-mockup__widget">
            <div className="candb-site-mockup__widget-meta">
              <span className="candb-site-mockup__mini-mark">F</span>
              <span>C&B PROJECT / PRIVATE REVIEW</span>
            </div>
            <p className="candb-widget-label">SELLER SIGNAL</p>
            <h3>What is your property worth?</h3>
            <p>One focused request, captured on the C&B site and routed to the right advisor.</p>
            <a href="#candb-widget" className="candb-button candb-button--primary">Start private review <span>↗</span></a>
          </div>
        </div>
        <div className="candb-reference__copy">
          <p className="candb-eyebrow">Adapted to the C&B voice</p>
          <h2>No pressure. Clearer next moves.</h2>
          <p>
            The widget keeps C&B&apos;s selective, advisory tone while adding a private property-review request with intent, context and a broker-ready handoff.
          </p>
          <div className="candb-reference__tags">
            <span>Selective advice</span>
            <span>Dubai property context</span>
            <span>Private handoff</span>
          </div>
        </div>
      </section>

      <section id="candb-widget" className="candb-section candb-section--widget">
        <div className="candb-section__top">
          <div>
            <p className="candb-eyebrow">Pilot preview</p>
            <h2>One valuation flow. Multiple C&B visuals.</h2>
          </div>
          <p>
            This mirrors the premium broker-demo widget, but keeps only the valuation/private
            review path for the first real pilot.
          </p>
          <p className="candb-preview-note">
            Preview mode: this presentation form stays local and does not contact C&amp;B.
          </p>
        </div>

        <div className="candb-widget-frame">
          <div className="candb-widget-toolbar">
            <span>Private review surface</span>
            <div className="candb-photo-controls" aria-label="Widget background controls">
              <button type="button" onClick={() => choosePhoto(photoIndex - 1)} aria-label="Previous photo">
                {"<"}
              </button>
              <button type="button" onClick={() => choosePhoto(photoIndex + 1)} aria-label="Next photo">
                {">"}
              </button>
            </div>
          </div>

          <article className={`candb-widget-card candb-widget-card--${step}`}>
            <div className="candb-widget-bg" aria-hidden="true">
              {photos.map((photo, index) => (
                <span
                  key={photo.src}
                  className={index === photoIndex ? "is-active" : ""}
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(1,6,12,.94), rgba(1,8,15,.62) 48%, rgba(1,8,15,.28)), url("${photo.src}")`,
                    backgroundPosition: photo.position,
                  }}
                />
              ))}
            </div>

            <div className="candb-widget-header">
              <div className="candb-logo-mark">F</div>
              <div>
                <strong>C&B Project</strong>
                <span>{activePhoto.label}</span>
              </div>
            </div>

            {step === "intro" && (
              <div className="candb-widget-intro">
                <p className="candb-widget-label">Private AI review</p>
                <h3>What is your Dubai property position?</h3>
                <p>
                  Share the property, intent and contact details. C&B receives a private handoff
                  before the pricing conversation starts.
                </p>
                <button type="button" className="candb-widget-cta" onClick={startReview}>
                  Start private review
                </button>
              </div>
            )}

            {step === "form" && (
              <div className="candb-widget-form" aria-label="C&B private review form">
                <div className="candb-form-heading">
                  <div>
                    <p className="candb-widget-label">Step 01 / context</p>
                    <h3>Tell C&B what you need to decide.</h3>
                  </div>
                  <button type="button" onClick={resetPreview}>
                    Back
                  </button>
                </div>

                <div className="candb-form-grid">
                  <label>
                    Property, building or zone
                    <input
                      value={form.property}
                      onChange={(event) => updateField("property", event.target.value)}
                      placeholder="Palm Jumeirah, Downtown, Dubai Marina..."
                    />
                  </label>

                  <label>
                    Approx. size (m2)
                    <input
                      value={form.area}
                      onChange={(event) => updateField("area", event.target.value)}
                      inputMode="decimal"
                      placeholder="120"
                    />
                  </label>

                  <label>
                    Property type
                    <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                      {fieldOptions.type.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Bedrooms
                    <select
                      value={form.bedrooms}
                      onChange={(event) => updateField("bedrooms", event.target.value)}
                    >
                      {fieldOptions.bedrooms.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Intent
                    <select value={form.intent} onChange={(event) => updateField("intent", event.target.value)}>
                      {fieldOptions.intent.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Priority
                    <select
                      value={form.priority}
                      onChange={(event) => updateField("priority", event.target.value)}
                    >
                      {fieldOptions.priority.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Name
                    <input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Your name"
                    />
                  </label>

                  <label>
                    Email
                    <input
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="name@email.com"
                    />
                  </label>

                  <label className="candb-form-grid__wide">
                    WhatsApp
                    <input
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="+971 50 000 0000"
                    />
                  </label>
                </div>

                <label className="candb-consent">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(event) => updateField("consent", event.target.checked)}
                  />
                  I agree that C&B may contact me about this private property review.
                </label>

                <button type="button" className="candb-widget-cta candb-widget-cta--wide" onClick={submitReview}>
                  Request private review
                </button>

                {errors.length > 0 && (
                  <div className="candb-errors" role="alert">
                    {errors.map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === "success" && (
              <div className="candb-success">
                <p className="candb-widget-label">Handoff ready</p>
                <h3>Your private review request was received.</h3>
                <p>
                  A C&B advisor receives your property context and can continue by WhatsApp,
                  email or CRM. You can also open WhatsApp now if you prefer.
                </p>

                <div className="candb-success-grid">
                  <div>
                    <span>Lead score</span>
                    <strong>{leadScore}/100</strong>
                  </div>
                  <div>
                    <span>Intent</span>
                    <strong>{form.intent}</strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>{form.priority}</strong>
                  </div>
                </div>

                <div className="candb-success-actions">
                  <a
                    className="candb-widget-cta"
                    href={`https://wa.me/971508928199?text=${encodeURIComponent(
                      `Hi C&B, I requested a private property review through FonatProp for ${form.property}.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open WhatsApp with C&B
                  </a>
                  <button type="button" onClick={resetPreview}>
                    Reset preview
                  </button>
                </div>
              </div>
            )}

            <div className="candb-widget-dots">
              {photos.map((photo, index) => (
                <button
                  type="button"
                  key={photo.src}
                  className={index === photoIndex ? "is-active" : ""}
                  onClick={() => choosePhoto(index)}
                  aria-label={`Use background ${index + 1}`}
                />
              ))}
            </div>
          </article>

          <footer className="candb-widget-footer">
            <span>Powered by FonatProp</span>
            <span>Secure broker handoff</span>
          </footer>
        </div>
      </section>

      <section id="candb-analytics" className="candb-section candb-analytics">
        <div className="candb-section__top">
          <div>
            <p className="candb-eyebrow">Illustrative pilot view</p>
            <h2>What C&B should see after installation.</h2>
          </div>
            <p>
              The production pilot will be judged by measured requests and broker action, not by a
              vague promise of guaranteed leads.
            </p>
        </div>

        <div className="candb-metrics">
          <div>
            <span>Widget views</span>
            <strong>{events.view}</strong>
            <small>Preview opened</small>
          </div>
          <div>
            <span>Review starts</span>
            <strong>{events.start}</strong>
            <small>Visitor clicked start</small>
          </div>
          <div>
            <span>Lead captured</span>
            <strong>{events.lead}</strong>
            <small>Validated contact</small>
          </div>
          <div>
            <span>Handoff ready</span>
            <strong>{events.handoff}</strong>
            <small>Broker context prepared</small>
          </div>
        </div>

        <div className="candb-ops-grid">
          <article className="candb-handoff">
            <p className="candb-eyebrow">Broker handoff</p>
            <h3>Directly useful, not decorative.</h3>
            <dl>
              <div>
                <dt>Source</dt>
                <dd>{handoff.source}</dd>
              </div>
              <div>
                <dt>Property</dt>
                <dd>{handoff.property}</dd>
              </div>
              <div>
                <dt>Intent</dt>
                <dd>{handoff.intent}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{handoff.priority}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{handoff.contact}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{submittedAt || "Waiting for preview submission"}</dd>
              </div>
            </dl>
          </article>

          <article className="candb-map">
            <p className="candb-eyebrow">Operating map</p>
            <ol>
              <li>Visitor opens private widget</li>
              <li>Visitor submits property + contact</li>
              <li>Production FonatProp stores lead, source and consent</li>
              <li>Production FonatProp calculates score and context</li>
              <li>Configured broker receives WhatsApp/email handoff</li>
              <li>Production analytics tracks follow-up and outcome</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="candb-section candb-section--snippet">
        <div>
          <p className="candb-eyebrow">Snippet</p>
          <h2>Ready to install when Juan sends the repo.</h2>
          <p>
            Replace the token after the C&amp;B agency is provisioned in FonatProp. Broker routing
            is configured server-side and is never placed in the public snippet.
          </p>
        </div>
        <pre>{snippet}</pre>
      </section>

      <style jsx global>{`
        :root {
          color-scheme: dark;
        }

        .candb-page {
          min-height: 100vh;
          background: #03060a;
          color: #f9f5eb;
          font-family:
            "Avenir Next", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .candb-hero {
          position: relative;
          min-height: 86vh;
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(3, 6, 10, 0.98), rgba(3, 6, 10, 0.68) 48%, rgba(3, 6, 10, 0.28)),
            url("/dubai-slides/05-downtown-night.jpg") center / cover;
        }

        .candb-hero__bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 18%, rgba(201, 164, 106, 0.2), transparent 26%),
            radial-gradient(circle at 80% 70%, rgba(58, 170, 177, 0.18), transparent 28%),
            linear-gradient(0deg, #03060a, transparent 35%);
          pointer-events: none;
        }

        .candb-nav {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 34px clamp(20px, 5vw, 82px);
        }

        .candb-brand {
          font-family: "Iowan Old Style", Baskerville, Georgia, "Times New Roman", serif;
          font-size: 30px;
          letter-spacing: 0;
        }

        .candb-pill {
          border: 1px solid rgba(201, 164, 106, 0.34);
          border-radius: 999px;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(249, 245, 235, 0.72);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .candb-hero__content {
          position: relative;
          z-index: 1;
          max-width: 980px;
          padding: 13vh clamp(20px, 5vw, 82px) 13vh;
        }

        .candb-eyebrow {
          margin: 0 0 18px;
          color: #c9a46a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.34em;
          text-transform: uppercase;
        }

        .candb-hero h1,
        .candb-section h2,
        .candb-widget-card h3 {
          margin: 0;
          font-family: "Iowan Old Style", Baskerville, Georgia, "Times New Roman", serif;
          font-weight: 400;
          letter-spacing: 0;
        }

        .candb-hero h1 {
          font-size: clamp(54px, 8vw, 126px);
          line-height: 0.9;
          max-width: 900px;
        }

        .candb-hero__content > p:not(.candb-eyebrow),
        .candb-section__top > p,
        .candb-section--snippet p {
          max-width: 740px;
          color: rgba(249, 245, 235, 0.68);
          font-size: 17px;
          line-height: 1.8;
        }

        .candb-hero__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
        }

        .candb-button,
        .candb-widget-cta,
        .candb-success-actions button,
        .candb-form-heading button {
          display: inline-flex;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 0 24px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease;
        }

        .candb-button:hover,
        .candb-widget-cta:hover,
        .candb-success-actions button:hover,
        .candb-form-heading button:hover {
          transform: translateY(-1px);
        }

        .candb-button--primary,
        .candb-widget-cta {
          background: #f9f5eb;
          color: #03060a;
        }

        .candb-button--ghost,
        .candb-success-actions button,
        .candb-form-heading button {
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(249, 245, 235, 0.8);
        }

        .candb-section {
          padding: 96px clamp(18px, 5vw, 82px);
          border-top: 1px solid rgba(201, 164, 106, 0.2);
          background:
            radial-gradient(circle at 88% 10%, rgba(58, 170, 177, 0.16), transparent 26%),
            #03060a;
        }

        .candb-section--widget {
          background:
            linear-gradient(180deg, rgba(5, 15, 29, 0.72), rgba(3, 6, 10, 1)),
            url("/dubai-slides/business-bay.jpg") center / cover fixed;
        }

        .candb-section__top {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.7fr);
          gap: 42px;
          align-items: end;
          margin-bottom: 42px;
        }

        .candb-section h2 {
          max-width: 960px;
          font-size: clamp(42px, 6vw, 88px);
          line-height: 0.92;
        }

        .candb-reference--mockup {
          display: grid;
          gap: 24px;
        }

        .candb-reference__heading {
          display: grid;
          gap: 10px;
          max-width: 760px;
        }

        .candb-reference__heading h2,
        .candb-reference__copy h2 {
          margin: 0;
          font-family: "Iowan Old Style", Baskerville, Georgia, "Times New Roman", serif;
          font-size: clamp(38px, 5vw, 76px);
          font-weight: 400;
          line-height: 0.96;
          letter-spacing: -0.03em;
        }

        .candb-reference__heading > p:last-child,
        .candb-reference__copy > p:not(.candb-eyebrow) {
          max-width: 720px;
          margin: 0;
          color: rgba(255, 255, 255, 0.64);
          line-height: 1.7;
        }

        .candb-site-mockup {
          position: relative;
          min-height: clamp(360px, 38vw, 560px);
          aspect-ratio: 16 / 8;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 42px;
          background: #090d12;
          box-shadow: 0 44px 140px rgba(0, 0, 0, 0.34);
        }

        .candb-site-mockup > img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .candb-site-mockup__scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(4, 7, 12, 0.08), rgba(4, 7, 12, 0.16) 48%, rgba(4, 7, 12, 0.55));
          pointer-events: none;
        }

        .candb-site-mockup__widget {
          position: absolute;
          right: clamp(18px, 5vw, 76px);
          bottom: clamp(18px, 5vw, 68px);
          width: min(520px, 46%);
          min-height: 218px;
          padding: 24px 28px;
          border: 1px solid rgba(217, 177, 102, 0.68);
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(4, 8, 13, 0.96), rgba(11, 18, 26, 0.85));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(18px);
        }

        .candb-site-mockup__widget-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.72);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .candb-site-mockup__mini-mark {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border: 1px solid rgba(255, 255, 255, 0.42);
          border-radius: 10px;
          color: #ff3347;
          font-family: Georgia, serif;
          font-size: 17px;
        }

        .candb-site-mockup__widget h3 {
          max-width: 440px;
          margin: 0;
          font-size: clamp(28px, 3vw, 48px);
          line-height: 0.98;
          letter-spacing: -0.035em;
        }

        .candb-site-mockup__widget > p:not(.candb-widget-label) {
          margin: 14px 0 20px;
          color: rgba(255, 255, 255, 0.66);
          font-size: 14px;
          line-height: 1.55;
        }

        .candb-site-mockup__widget .candb-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        @media (max-width: 760px) {
          .candb-site-mockup {
            aspect-ratio: auto;
            min-height: 620px;
          }

          .candb-site-mockup > img {
            object-position: center top;
          }

          .candb-site-mockup__widget {
            right: 16px;
            bottom: 16px;
            left: 16px;
            width: auto;
          }
        }

        .candb-widget-frame {
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 54px;
          background:
            radial-gradient(circle at top right, rgba(58, 170, 177, 0.2), transparent 28%),
            linear-gradient(180deg, #07111d, #03060a);
          box-shadow: 0 42px 130px rgba(0, 0, 0, 0.42);
          padding: clamp(18px, 3vw, 32px);
        }

        .candb-widget-toolbar,
        .candb-widget-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          color: rgba(249, 245, 235, 0.54);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .candb-photo-controls {
          display: flex;
          gap: 10px;
        }

        .candb-photo-controls button {
          width: 44px;
          height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          color: #fff;
          cursor: pointer;
          font-size: 30px;
          line-height: 1;
          transition:
            transform 180ms ease,
            background 180ms ease;
        }

        .candb-photo-controls button:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.14);
        }

        .candb-widget-card {
          position: relative;
          min-height: 560px;
          overflow: hidden;
          border: 1px solid rgba(217, 177, 102, 0.58);
          border-radius: 44px;
          margin-top: 22px;
          background: #04070c;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 28px 90px rgba(0, 0, 0, 0.34);
        }

        .candb-widget-card--form,
        .candb-widget-card--success {
          min-height: 660px;
        }

        .candb-widget-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .candb-widget-bg span {
          position: absolute;
          inset: 0;
          background-size: cover;
          opacity: 0;
          transform: scale(1.03);
          transition:
            opacity 1250ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 5600ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .candb-widget-bg span.is-active {
          opacity: 1;
          transform: scale(1.095);
        }

        .candb-widget-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 10% 20%, rgba(201, 164, 106, 0.18), transparent 26%),
            linear-gradient(180deg, transparent 0%, rgba(1, 4, 8, 0.76) 100%);
          pointer-events: none;
        }

        .candb-widget-header,
        .candb-widget-intro,
        .candb-widget-form,
        .candb-success,
        .candb-widget-dots {
          position: relative;
          z-index: 1;
        }

        .candb-widget-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 28px 30px 0;
        }

        .candb-logo-mark {
          display: grid;
          width: 48px;
          height: 48px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          background: rgba(0, 0, 0, 0.46);
          color: #c9a46a;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
        }

        .candb-widget-header strong,
        .candb-widget-header span {
          display: block;
        }

        .candb-widget-header strong {
          font-size: 13px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .candb-widget-header span {
          margin-top: 5px;
          color: rgba(249, 245, 235, 0.48);
          font-size: 12px;
        }

        .candb-widget-intro {
          max-width: 680px;
          padding: 86px 42px 42px;
        }

        .candb-widget-label {
          margin: 0 0 18px;
          color: #9dc7ff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .candb-widget-card h3 {
          max-width: 860px;
          font-size: clamp(42px, 5.8vw, 82px);
          line-height: 0.96;
        }

        .candb-widget-intro p:not(.candb-widget-label),
        .candb-success p:not(.candb-widget-label) {
          max-width: 760px;
          color: rgba(249, 245, 235, 0.76);
          font-size: 18px;
          line-height: 1.75;
        }

        .candb-widget-intro .candb-widget-cta {
          margin-top: 30px;
        }

        .candb-widget-form,
        .candb-success {
          padding: 36px 38px 42px;
        }

        .candb-form-heading {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: start;
          margin-bottom: 24px;
        }

        .candb-form-heading h3,
        .candb-success h3 {
          font-size: clamp(34px, 4.2vw, 58px);
        }

        .candb-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .candb-form-grid label,
        .candb-consent {
          display: grid;
          gap: 9px;
          color: rgba(249, 245, 235, 0.66);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .candb-form-grid__wide {
          grid-column: 1 / -1;
        }

        .candb-form-grid input,
        .candb-form-grid select {
          width: 100%;
          min-height: 54px;
          border: 1px solid rgba(255, 255, 255, 0.17);
          border-radius: 16px;
          background: rgba(2, 7, 13, 0.68);
          color: #fff;
          font-size: 15px;
          letter-spacing: 0;
          outline: none;
          padding: 0 16px;
        }

        .candb-consent {
          grid-template-columns: auto 1fr;
          align-items: center;
          margin: 18px 0;
          text-transform: none;
          letter-spacing: 0;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.6;
        }

        .candb-consent input {
          width: 18px;
          height: 18px;
        }

        .candb-widget-cta--wide {
          width: 100%;
        }

        .candb-errors {
          display: grid;
          gap: 6px;
          margin-top: 14px;
          border: 1px solid rgba(255, 120, 120, 0.34);
          border-radius: 18px;
          background: rgba(120, 20, 20, 0.32);
          padding: 14px 16px;
          color: #ffd8d8;
          font-size: 13px;
        }

        .candb-success {
          max-width: 840px;
        }

        .candb-success-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 28px 0;
        }

        .candb-success-grid div,
        .candb-metrics div,
        .candb-handoff,
        .candb-map {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.055);
          backdrop-filter: blur(18px);
        }

        .candb-success-grid div {
          padding: 18px;
        }

        .candb-success-grid span,
        .candb-metrics span,
        .candb-handoff dt {
          display: block;
          color: rgba(249, 245, 235, 0.48);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .candb-success-grid strong,
        .candb-metrics strong {
          display: block;
          margin-top: 10px;
          color: #fff;
          font-size: 28px;
        }

        .candb-success-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .candb-widget-dots {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 28px;
          display: flex;
          justify-content: center;
          gap: 9px;
        }

        .candb-widget-dots button {
          width: 38px;
          height: 3px;
          border: 0;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.22);
          cursor: pointer;
        }

        .candb-widget-dots button.is-active {
          background: #6fa8ff;
        }

        .candb-widget-footer {
          margin-top: 20px;
          padding: 0 10px;
        }

        .candb-analytics {
          background:
            linear-gradient(180deg, rgba(3, 6, 10, 0.92), rgba(3, 6, 10, 1)),
            url("/dubai-slides/07-marina-aerial.jpg") center / cover fixed;
        }

        .candb-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .candb-metrics div {
          min-height: 160px;
          padding: 24px;
        }

        .candb-metrics strong {
          font-size: 54px;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
        }

        .candb-metrics small {
          color: rgba(249, 245, 235, 0.56);
        }

        .candb-ops-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 18px;
          margin-top: 18px;
        }

        .candb-handoff,
        .candb-map {
          padding: 28px;
        }

        .candb-handoff h3 {
          margin: 0 0 22px;
          font-size: 32px;
        }

        .candb-handoff dl {
          display: grid;
          gap: 14px;
          margin: 0;
        }

        .candb-handoff div {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 14px;
        }

        .candb-handoff dd {
          margin: 0;
          color: rgba(249, 245, 235, 0.78);
        }

        .candb-map ol {
          display: grid;
          gap: 12px;
          margin: 0;
          padding-left: 22px;
          color: rgba(249, 245, 235, 0.72);
          font-size: 16px;
          line-height: 1.7;
        }

        .candb-section--snippet {
          display: grid;
          grid-template-columns: minmax(0, 0.74fr) minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }

        .candb-section--snippet pre {
          overflow: auto;
          margin: 0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: rgba(0, 0, 0, 0.46);
          padding: 24px;
          color: rgba(249, 245, 235, 0.84);
          font-size: 12px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        @media (max-width: 980px) {
          .candb-section__top,
          .candb-ops-grid,
          .candb-section--snippet {
            grid-template-columns: 1fr;
          }

          .candb-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .candb-nav,
          .candb-widget-toolbar,
          .candb-widget-footer,
          .candb-form-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .candb-hero h1 {
            font-size: 50px;
          }

          .candb-widget-card,
          .candb-widget-card--form,
          .candb-widget-card--success {
            min-height: 720px;
            border-radius: 28px;
          }

          .candb-widget-intro,
          .candb-widget-form,
          .candb-success {
            padding: 54px 20px 72px;
          }

          .candb-form-grid,
          .candb-success-grid,
          .candb-metrics {
            grid-template-columns: 1fr;
          }

          .candb-handoff div {
            grid-template-columns: 1fr;
          }
        }
        /* C&B integration: the agency page stays primary; FonatProp is an
           embedded lead-capture module inside the hero. */
        .candb-page { position: relative; overflow-x: clip; background: #071018; }
        .candb-reference--mockup { display: none !important; }
        .candb-hero { position: relative; min-height: clamp(720px, 86vh, 900px); overflow: visible; }
        .candb-hero__content {
          max-width: min(55vw, 900px);
          padding-right: 5vw;
        }
        .candb-section--widget {
          position: absolute;
          z-index: 5;
          right: clamp(24px, 5vw, 92px);
          bottom: clamp(34px, 5vw, 76px);
          width: min(41vw, 650px);
          max-width: none;
          margin: 0;
          padding: 0;
          background: transparent;
          border: 0;
        }
        .candb-section--widget .candb-section__top { display: none; }
        .candb-widget-frame {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 10px;
          border-radius: 24px;
          background: rgba(3, 8, 14, .78);
          border: 1px solid rgba(255, 255, 255, .22);
          box-shadow: 0 26px 80px rgba(0, 0, 0, .48);
          backdrop-filter: blur(12px);
        }
        .candb-widget-toolbar { min-height: 32px; }
        .candb-widget-card {
          width: 100%;
          height: clamp(300px, 29vw, 420px);
          min-height: 0;
          margin-top: 8px;
          border-radius: 18px;
          overflow: hidden;
        }
        .candb-widget-card--form,
        .candb-widget-card--success { height: auto; min-height: 420px; }
        .candb-widget-footer { min-height: 30px; }
        @media (max-width: 1100px) {
          .candb-hero__content { max-width: 52vw; }
          .candb-section--widget { width: min(43vw, 560px); }
        }
        @media (max-width: 900px) {
          .candb-hero { min-height: auto; overflow: visible; }
          .candb-hero__content { max-width: none; padding-right: 0; padding-bottom: 38px; }
          .candb-nav__links { display: none; }
          .candb-section--widget {
            position: relative;
            right: auto;
            bottom: auto;
            width: auto;
            margin: -10px 16px 42px;
          }
          .candb-widget-card { height: 440px; }
        }
        @media (max-width: 680px) {
          .candb-widget-frame { padding: 8px; border-radius: 20px; }
          .candb-widget-card { height: 430px; border-radius: 16px; }
          .candb-widget-card--form,
          .candb-widget-card--success { min-height: 620px; }
        }
      `}</style>
    </main>
  );
}
