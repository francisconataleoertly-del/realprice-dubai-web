/*!
 * FonatProp Dubai — Embeddable Valuation Widget
 * Vanilla JS + Shadow DOM. Premium editorial design.
 * Modes: inline · popup · drawer
 */
(function () {
  "use strict";

  var API_BASE_DEFAULT = "https://web-production-9051f.up.railway.app";
  var ADDRESS_API_BASE_DEFAULT = "https://fonatprop.com/api/widget";
  var WIDGET_CONFIG_DEFAULT = "https://fonatprop.com/api/widget/config";
  var DEFAULT_FUNNEL_ENDPOINT = "https://fonatprop.com/api/funnel-events";
  var DEFAULT_BRAND_COLOR = "#3b82f6";
  var DEFAULT_LEAD_WEBHOOK = "https://fonatprop.com/api/leads";
  var DEFAULT_TITLE = "AI property check";
  var DEFAULT_SUBTITLE = "Get a private Dubai estimate. A broker reviews the final number.";
  // Banner mode (horizontal hero card on agency websites)
  var DEFAULT_BANNER_TITLE = "Want to know how much a property is worth?";
  var DEFAULT_BANNER_CTA = "Get your free valuation";
  var DEFAULT_BANNER_BG = "https://fonatprop.com/dubai-slides/03-burj-al-arab.jpg";
  var PRIVACY_VERSION = "2026-06-30";
  var REQUIRED_CONSENT_TEXT = "I agree that the agency and FonatProp may process my contact and property details to prepare this request and follow up.";
  var OPTIONAL_MARKETING_TEXT = "Send me occasional market updates and property opportunities.";
  // Real Dubai market benchmarks (kept general — for the precise number, the agency takes over)
  var DUBAI_MARKET_BENCHMARK = {
    avgPsf: "AED 1,650",
    onebrAvg: "AED 1.2M",
    yoyGrowth: "+8.5%",
  };
  var ROOM_OPTIONS = ["Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR"];
  var PROPERTY_TYPES = [
    { label: "Apartment", value: "Flat" },
    { label: "Villa", value: "Villa" },
    { label: "Townhouse", value: "Townhouse" },
  ];
  var DEFAULT_WIDGET_MODE = "valuation";
  var CAROUSEL_CARD_DEFINITIONS = [
    {
      id: "valuation",
      title: "What is your property worth?",
      eyebrow: "Seller lead",
      short: "Open the seller conversation with a broad AI range, then hand the final pricing discussion to the broker.",
      image: "https://fonatprop.com/dubai-slides/03-burj-al-arab.jpg",
      imagePosition: "center center",
      cta: "Start valuation",
      intent: "seller_valuation",
      benefit: "We saved the valuation context. An advisor can send the full report on WhatsApp.",
    },
    {
      id: "golden_visa",
      title: "Which investor visa threshold are you near?",
      eyebrow: "Investor check",
      short: "Pre-qualify the buyer against AED 2M Golden Visa and AED 750k property-investor thresholds.",
      image: "https://fonatprop.com/dubai-slides/05-downtown-night.jpg",
      imagePosition: "center 62%",
      cta: "Check threshold",
      intent: "golden_visa",
      benefit: "We saved the investor context. An advisor can review the route, paperwork and suitable properties.",
    },
    {
      id: "net_yield",
      title: "How much can you earn renting it?",
      eyebrow: "Yield net",
      short: "Turn price, expected rent and running costs into a first-pass investor lead.",
      image: "https://fonatprop.com/dubai-slides/04-marina-night.jpg",
      imagePosition: "center 62%",
      cta: "Estimate yield",
      intent: "rental_yield",
      benefit: "We saved the yield snapshot. An advisor can compare it with real opportunities and service charges.",
    },
    {
      id: "offplan_payment",
      title: "Does this off-plan payment plan make sense?",
      eyebrow: "Off-plan fit",
      short: "Check whether installments and expected rent deserve a broker review.",
      image: "https://fonatprop.com/dubai-slides/09-palm-aerial.jpg",
      imagePosition: "center 50%",
      cta: "Test the plan",
      intent: "offplan_payment",
      benefit: "We saved the plan snapshot. An advisor can compare developers, handover risk and payment structures.",
    },
  ];
  var ZONE_CACHE = { promise: null, options: null };
  var FONTS_LOADED = false;

  // ── Utilities ──────────────────────────────────────────────
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function quarterFromDate(date) {
    return Math.floor(date.getMonth() / 3) + 1;
  }
  function currencyCompact(value) {
    if (!isFinite(value)) return "AED —";
    if (value >= 1000000) {
      return "AED " + (value / 1000000).toFixed(value >= 10000000 ? 1 : 2).replace(/\.?0+$/, "") + "M";
    }
    if (value >= 1000) return "AED " + Math.round(value / 1000) + "K";
    return "AED " + Math.round(value).toLocaleString("en-US");
  }
  function sanitizePhone(phone) {
    return String(phone || "").replace(/[^\d]/g, "");
  }
  function normalizeLeadPhone(phone) {
    var raw = String(phone || "").trim();
    if (!raw) return "";
    var compact = raw.replace(/[^\d+]/g, "");
    if (compact.charAt(0) === "+") return compact;
    if (compact.indexOf("00") === 0) return "+" + compact.slice(2);
    if (compact.indexOf("971") === 0) return "+" + compact;
    return "+971" + compact.replace(/^0+/, "");
  }
  function isValidLeadPhone(phone) {
    var normalized = normalizeLeadPhone(phone);
    return /^\+\d{8,15}$/.test(normalized);
  }
  function hasQuotaBlock(config) {
    return !!(config && config.quota && config.quota.blocksCapture);
  }
  function buildConsentPayload(marketing) {
    var acceptedAt = new Date().toISOString();
    return {
      consent_privacy: true,
      consent_contact: true,
      consent_whatsapp: true,
      consent_marketing: Boolean(marketing),
      consent_text: REQUIRED_CONSENT_TEXT,
      consent_at: acceptedAt,
      privacy_version: PRIVACY_VERSION,
      consent: {
        privacy: true,
        contact: true,
        whatsapp: true,
        marketing: Boolean(marketing),
        text: REQUIRED_CONSENT_TEXT,
        accepted_at: acceptedAt,
        version: PRIVACY_VERSION,
      },
    };
  }
  function renderConsentFields() {
    return [
      '<label class="rp-consent"><input name="consent" type="checkbox" required />',
      '<span>' + escapeHtml(REQUIRED_CONSENT_TEXT) + '</span></label>',
      '<label class="rp-consent rp-consent-optional"><input name="consent_marketing" type="checkbox" />',
      '<span>' + escapeHtml(OPTIONAL_MARKETING_TEXT) + '</span></label>',
    ].join("");
  }
  function safeJsonParse(payload) {
    if (payload == null) return null;
    if (typeof payload === "string") {
      try { return JSON.parse(payload); } catch (_) { return null; }
    }
    return payload;
  }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function escapeAttribute(s) {
    return escapeHtml(s).replace(/`/g, "&#96;");
  }

  function sanitizeCssColor(value, fallback) {
    var text = String(value || "").trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(text)) return text;
    if (/^(rgb|rgba|hsl|hsla)\([0-9\s.,%/-]+\)$/.test(text)) return text;
    return fallback || DEFAULT_BRAND_COLOR;
  }

  function sanitizeUrl(value) {
    var text = String(value || "").trim();
    if (!text) return "";
    if (/^https?:\/\//i.test(text) || text.charAt(0) === "/") return text;
    return "";
  }

  function normalizeImageList(value) {
    var raw = Array.isArray(value) ? value : String(value || "").split(",");
    var seen = {};
    return raw
      .map(function (item) { return sanitizeUrl(item); })
      .filter(function (item) {
        if (!item || seen[item]) return false;
        seen[item] = true;
        return true;
      });
  }

  function makeId(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function getSessionId(config) {
    if (config && config.sessionId) return config.sessionId;
    var key = "fonatprop_widget_session";
    var value = "";
    try {
      value = window.sessionStorage.getItem(key) || "";
      if (!value) {
        value = makeId("fps");
        window.sessionStorage.setItem(key, value);
      }
    } catch (_) {
      value = makeId("fps");
    }
    if (config) config.sessionId = value;
    return value;
  }

  function normalizeFrameShape(value) {
    return value === "soft" || value === "square" || value === "pill" ? value : "rounded";
  }

  function normalizeSurfaceTone(value) {
    return value === "dark" || value === "glass" ? value : "light";
  }

  function normalizeWidgetMode(value) {
    return value === "carousel" ? "carousel" : DEFAULT_WIDGET_MODE;
  }

  function getCarouselCards(config) {
    var allowed = {};
    CAROUSEL_CARD_DEFINITIONS.forEach(function (card) { allowed[card.id] = card; });
    var requested = Array.isArray(config && config.carouselCards) ? config.carouselCards : [];
    var cards = requested
      .map(function (id) { return allowed[String(id || "").trim()]; })
      .filter(Boolean);
    return cards.length ? cards : CAROUSEL_CARD_DEFINITIONS.slice();
  }

  function shellClass(config, extra) {
    var classes = ["rp-shell"];
    if (extra) {
      String(extra).split(/\s+/).filter(Boolean).forEach(function (className) {
        classes.push(className);
      });
    }
    classes.push("rp-shape-" + normalizeFrameShape(config && config.frameShape));
    classes.push("rp-tone-" + normalizeSurfaceTone(config && config.surfaceTone));
    if (config && config.compact) classes.push("rp-compact");
    return classes.join(" ");
  }

  function shellStyle(config) {
    return ' style="--rp-brand:' + escapeAttribute(sanitizeCssColor(config && config.brandColor, DEFAULT_BRAND_COLOR)) + ';"';
  }

  function formatHeadline(text, fallback) {
    var safe = escapeHtml(text || fallback);
    return safe.replace(/(worth\??|value\??|valuation\??|estimate\??|check)$/i, "<em>$1</em>");
  }

  // Load fonts once into <head> (Inter + Fraunces)
  function ensureFonts() {
    if (FONTS_LOADED || typeof document === "undefined") return;
    FONTS_LOADED = true;
    try {
      var existing = document.querySelector('link[data-rp-fonts]');
      if (existing) return;
      var preconnect1 = document.createElement("link");
      preconnect1.rel = "preconnect";
      preconnect1.href = "https://fonts.googleapis.com";
      preconnect1.setAttribute("data-rp-fonts", "1");
      var preconnect2 = document.createElement("link");
      preconnect2.rel = "preconnect";
      preconnect2.href = "https://fonts.gstatic.com";
      preconnect2.crossOrigin = "anonymous";
      preconnect2.setAttribute("data-rp-fonts", "1");
      var fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.setAttribute("data-rp-fonts", "1");
      fontLink.href =
        "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..500&family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(preconnect1);
      document.head.appendChild(preconnect2);
      document.head.appendChild(fontLink);
    } catch (_) { /* noop */ }
  }

  function normalizeZonesResponse(raw) {
    var parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") return [];
    var aliases = parsed.aliases && typeof parsed.aliases === "object" ? Object.keys(parsed.aliases) : [];
    var zones = Array.isArray(parsed.zones) ? parsed.zones.slice() : [];
    var topPriority = [
      "Dubai Marina", "Downtown Dubai", "Business Bay", "Palm Jumeirah",
      "Dubai Hills", "Dubai Hills Estate", "JVC", "JLT", "DIFC", "Jumeirah",
      "Arabian Ranches", "Emirates Hills",
    ];
    var seen = Object.create(null);
    var merged = [];
    function addZone(name) {
      var zoneName = String(name || "").trim();
      if (!zoneName) return;
      var key = zoneName.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      merged.push(zoneName);
    }
    topPriority.forEach(addZone);
    aliases.sort().forEach(addZone);
    zones.sort().forEach(addZone);
    return merged;
  }

  function loadZones(apiBase, config) {
    if (ZONE_CACHE.options && ZONE_CACHE.options.length) {
      return Promise.resolve(ZONE_CACHE.options);
    }
    if (ZONE_CACHE.promise) return ZONE_CACHE.promise;

    ZONE_CACHE.promise = fetchWidgetJson(apiBase.replace(/\/$/, "") + "/zones", {
      method: "GET",
    }, config)
      .then(function (response) {
        if (!response.ok) throw new Error("Failed to load zones");
        return response.text();
      })
      .then(function (text) {
        var options = normalizeZonesResponse(text);
        ZONE_CACHE.options = options;
        return options;
      })
      .catch(function (error) {
        console.error("[FonatProp Widget] zones load failed", error);
        ZONE_CACHE.promise = null;
        return [
          "Dubai Marina", "Downtown Dubai", "Business Bay", "Palm Jumeirah",
          "JVC", "JLT", "Dubai Hills", "DIFC",
        ];
      });

    return ZONE_CACHE.promise;
  }

  function sendWebhook(url, payload, config) {
    if (!url) return Promise.reject(new Error("Lead endpoint is not configured."));
    return fetch(url, {
      method: "POST",
      headers: buildWidgetHeaders(config, { "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
      mode: "cors",
      keepalive: true,
    })
      .then(function (response) {
        return response.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (_) {
            data = {};
          }
          if (!response.ok || data.ok === false) {
            throw new Error(data.detail || data.error || "Lead could not be saved.");
          }
          return data;
        });
      });
  }

  function trackFunnelEvent(config, eventName, properties) {
    if (!config || !config.funnelEndpoint) return;
    var campaign = readCampaignContext();
    var payload = {
      event_name: eventName,
      session_id: getSessionId(config),
      source: campaign.utm_source || (config.mode === "banner" ? "widget-banner" : "widget"),
      page_url: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      properties: Object.assign({}, campaign, properties || {}),
    };

    fetch(config.funnelEndpoint, {
      method: "POST",
      headers: buildWidgetHeaders(config, { "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
      mode: "cors",
      keepalive: true,
    }).catch(function () {
      /* analytics must never block the widget */
    });
  }

  function readCampaignContext() {
    var context = {
      page_url: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: "",
    };
    try {
      if (typeof window === "undefined") return context;
      var params = new URLSearchParams(window.location.search || "");
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
        context[key] = String(params.get(key) || "").slice(0, 160);
      });
    } catch (_) {}
    return context;
  }

  function buildWidgetHeaders(config, extraHeaders) {
    var headers = {
      Accept: "application/json",
      "X-FonatProp-Agency": config && config.agencyId ? config.agencyId : "",
      "X-FonatProp-Token": config && config.agencyToken ? config.agencyToken : "",
    };
    if (!extraHeaders) return headers;
    Object.keys(extraHeaders).forEach(function (key) {
      headers[key] = extraHeaders[key];
    });
    return headers;
  }

  function fetchWidgetJson(url, options, config) {
    var requestOptions = options || {};
    requestOptions.headers = buildWidgetHeaders(config, requestOptions.headers || {});
    return fetch(url, requestOptions);
  }

  function hydrateWidgetConfig(config) {
    var endpoint =
      (config.configEndpoint || WIDGET_CONFIG_DEFAULT).replace(/\/$/, "") +
      "?agencyId=" + encodeURIComponent(config.agencyId) +
      "&token=" + encodeURIComponent(config.agencyToken || "");

    return fetchWidgetJson(endpoint, { method: "GET" }, config)
      .then(function (response) {
        if (!response.ok) throw new Error("Failed to load widget config");
        return response.json();
      })
      .then(function (runtime) {
        var runtimeTheme = runtime && runtime.theme && typeof runtime.theme === "object" ? runtime.theme : {};
        var runtimeBrand = runtime && runtime.brand && typeof runtime.brand === "object" ? runtime.brand : {};
        var accent = runtimeTheme.accentColor || runtimeBrand.accentColor || config.brandColor || DEFAULT_BRAND_COLOR;
        var bannerImage = sanitizeUrl(runtimeTheme.backgroundImage || config.bannerImage || DEFAULT_BANNER_BG) || DEFAULT_BANNER_BG;
        var bannerImages = normalizeImageList(runtimeTheme.backgroundImages || runtimeTheme.bannerImages || config.bannerImages);
        if (!bannerImages.length) {
          bannerImages = [bannerImage];
        } else if (bannerImages.indexOf(bannerImage) === -1) {
          bannerImages.unshift(bannerImage);
        }
        return {
          agencyId: config.agencyId,
          agencyToken: config.agencyToken,
          brandColor: sanitizeCssColor(accent, config.brandColor || DEFAULT_BRAND_COLOR),
          mode: config.mode,
          compact: config.compact,
          title: runtimeTheme.headline || config.title || DEFAULT_TITLE,
          subtitle: runtimeTheme.subheadline || config.subtitle || DEFAULT_SUBTITLE,
          bannerTitle: runtimeTheme.headline || config.bannerTitle,
          bannerCta: runtimeTheme.ctaLabel || config.bannerCta,
          bannerImage: bannerImage,
          bannerImages: bannerImages,
          agencyLogo: sanitizeUrl(runtimeTheme.logoUrl || runtimeBrand.logoUrl || config.agencyLogo || ""),
          frameShape: normalizeFrameShape(runtimeTheme.frameShape || config.frameShape),
          surfaceTone: normalizeSurfaceTone(runtimeTheme.surfaceTone || config.surfaceTone),
          configEndpoint: config.configEndpoint,
          agentPhone: runtime.agentPhone || "",
          agentEmail: runtime.agentEmail || "",
          leadWebhook: runtime.leadWebhook || DEFAULT_LEAD_WEBHOOK,
          funnelEndpoint: runtime.funnelEndpoint || DEFAULT_FUNNEL_ENDPOINT,
          watermarkEnabled: !runtimeBrand || runtimeBrand.watermarkEnabled !== false,
          quota: runtime.quota || null,
          plan: runtime.plan || null,
          agencyLabel: runtimeBrand && runtimeBrand.label ? runtimeBrand.label : "",
          widgetMode: normalizeWidgetMode(config.widgetModeLocked ? config.widgetMode : (runtime.widgetMode || config.widgetMode)),
          carouselCards: Array.isArray(runtime.carouselCards) ? runtime.carouselCards : config.carouselCards,
          apiBase: runtime.apiBase || runtime.widgetApiBase || config.apiBase || ADDRESS_API_BASE_DEFAULT,
          addressApiBase:
            runtime.widgetApiBase || runtime.apiBase || config.addressApiBase || ADDRESS_API_BASE_DEFAULT,
        };
      })
      .catch(function (error) {
        console.error("[FonatProp Widget] config load failed", error);
        return config;
      });
  }

  // Animate a number count-up into an element
  function animateNumber(el, from, to, duration, formatter) {
    if (!el) return;
    var start = performance.now();
    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = from + (to - from) * eased;
      el.textContent = formatter(value);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Styles (premium editorial) ────────────────────────────
  function injectStyles(shadowRoot, brandColor) {
    var style = document.createElement("style");
    style.textContent = [
      ':host{all:initial;display:block}',
      '*,*::before,*::after{box-sizing:border-box}',

      // Root shell
      '.rp-shell{',
      '--rp-brand:' + brandColor + ';',
      '--rp-bg:#ffffff;',
      '--rp-fg:#0f172a;',
      '--rp-fg-soft:#475569;',
      '--rp-fg-muted:#94a3b8;',
      '--rp-line:#e2e8f0;',
      '--rp-line-soft:#f1f5f9;',
      '--rp-surface-soft:#f8fafc;',
      '--rp-input-bg:#fff;',
      '--rp-frame-radius:24px;',
      '--rp-panel-radius:18px;',
      '--rp-control-radius:12px;',
      '--rp-inner-radius:9px;',
      'font-family:"Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'font-feature-settings:"cv11","ss01","ss03";',
      'color:var(--rp-fg);',
      '-webkit-font-smoothing:antialiased;',
      'position:relative;line-height:1.5;',
      '}',
      '.rp-inline{max-width:460px}',
      '.rp-inline-carousel{max-width:none;width:100%}',
      '.rp-tone-dark{--rp-bg:#080b12;--rp-fg:#f8fafc;--rp-fg-soft:rgba(255,255,255,.70);--rp-fg-muted:rgba(255,255,255,.42);--rp-line:rgba(255,255,255,.12);--rp-line-soft:rgba(255,255,255,.08);--rp-surface-soft:rgba(255,255,255,.06);--rp-input-bg:rgba(255,255,255,.05)}',
      '.rp-tone-light{--rp-bg:#fff;--rp-fg:#0f172a;--rp-fg-soft:#475569;--rp-fg-muted:#94a3b8;--rp-line:#e2e8f0;--rp-line-soft:#f1f5f9;--rp-surface-soft:#f8fafc;--rp-input-bg:#fff}',
      '.rp-tone-glass{--rp-bg:rgba(7,10,18,.72);--rp-fg:#f8fafc;--rp-fg-soft:rgba(255,255,255,.72);--rp-fg-muted:rgba(255,255,255,.46);--rp-line:rgba(255,255,255,.16);--rp-line-soft:rgba(255,255,255,.08);--rp-surface-soft:rgba(255,255,255,.07);--rp-input-bg:rgba(255,255,255,.06)}',
      '.rp-shape-square{--rp-frame-radius:6px;--rp-panel-radius:4px;--rp-control-radius:3px;--rp-inner-radius:2px}',
      '.rp-shape-rounded{--rp-frame-radius:24px;--rp-panel-radius:18px;--rp-control-radius:12px;--rp-inner-radius:9px}',
      '.rp-shape-soft{--rp-frame-radius:36px;--rp-panel-radius:26px;--rp-control-radius:18px;--rp-inner-radius:14px}',
      '.rp-shape-pill{--rp-frame-radius:46px;--rp-panel-radius:30px;--rp-control-radius:999px;--rp-inner-radius:999px}',
      '.rp-tone-dark .rp-card,.rp-tone-glass .rp-card{box-shadow:0 18px 60px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.06)}',
      '.rp-tone-glass .rp-card{backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}',

      // Card
      '.rp-card{',
      'position:relative;background:var(--rp-bg);border:1px solid var(--rp-line);',
      'border-radius:var(--rp-frame-radius);padding:32px 28px 26px;width:100%;',
      'box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.06),0 30px 60px -20px rgba(15,23,42,.12);',
      '}',

      // Header
      '.rp-header{margin-bottom:22px}',
      '.rp-header-brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}',
      '.rp-header-brand .rp-eyebrow{margin-bottom:0}',
      '.rp-client-mark{width:34px;height:34px;border-radius:999px;object-fit:cover;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);box-shadow:0 10px 24px rgba(0,0,0,.18)}',
      '.rp-banner-brand{display:flex;align-items:center;gap:12px;margin-bottom:18px}',
      '.rp-banner-brand .rp-banner-eyebrow{margin-bottom:0}',
      '.rp-banner-brand .rp-client-mark{width:38px;height:38px}',
      '.rp-eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:14px;font-size:11px;',
      'color:var(--rp-fg-muted);font-weight:500;letter-spacing:.01em}',
      '.rp-eyebrow .rp-dot{width:6px;height:6px;border-radius:999px;background:var(--rp-brand);',
      'box-shadow:0 0 0 3px color-mix(in srgb,var(--rp-brand) 20%,transparent);',
      'animation:rp-dot-pulse 2.4s ease-in-out infinite}',
      '@keyframes rp-dot-pulse{0%,100%{box-shadow:0 0 0 3px color-mix(in srgb,var(--rp-brand) 18%,transparent)}50%{box-shadow:0 0 0 6px color-mix(in srgb,var(--rp-brand) 4%,transparent)}}',
      '.rp-eyebrow-text{text-transform:uppercase;letter-spacing:.22em;font-size:10.5px;color:var(--rp-fg-muted);font-weight:600}',
      '.rp-title{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:28px;line-height:1.08;',
      'letter-spacing:-.02em;margin:0;color:var(--rp-fg)}',
      '.rp-title em{font-style:italic;font-weight:300;color:var(--rp-fg-muted)}',
      '.rp-subtitle{font-size:14px;line-height:1.6;color:var(--rp-fg-soft);margin:12px 0 0;max-width:44ch}',

      // Step indicator
      '.rp-steps{display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid var(--rp-line-soft)}',
      '.rp-step-pill{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--rp-fg-muted)}',
      '.rp-step-pill .rp-num{display:inline-flex;align-items:center;justify-content:center;',
      'width:22px;height:22px;border-radius:999px;background:var(--rp-surface-soft);',
      'border:1px solid var(--rp-line);font-weight:600;font-size:10.5px;color:var(--rp-fg-muted);',
      'transition:all .3s ease}',
      '.rp-step-pill.rp-on .rp-num{background:var(--rp-fg);color:#fff;border-color:var(--rp-fg)}',
      '.rp-step-pill.rp-done .rp-num{background:var(--rp-brand);color:#fff;border-color:var(--rp-brand)}',
      '.rp-step-pill .rp-lbl{font-weight:500;color:var(--rp-fg-muted);transition:color .3s ease}',
      '.rp-step-pill.rp-on .rp-lbl{color:var(--rp-fg)}',
      '.rp-step-connector{flex:1;height:1px;background:linear-gradient(90deg,var(--rp-line),var(--rp-line-soft))}',

      // Step wrapper + transitions
      '.rp-step-wrap{position:relative;min-height:360px;margin-top:24px}',
      '.rp-step{position:absolute;inset:0;opacity:0;transform:translateY(12px);pointer-events:none;',
      'transition:opacity .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1)}',
      '.rp-step.rp-active{opacity:1;transform:translateY(0);pointer-events:auto;position:relative}',

      // Form
      '.rp-form{display:grid;gap:14px}',
      '.rp-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.rp-field{display:block}',
      '.rp-label{display:block;font-size:12px;font-weight:500;color:var(--rp-fg-soft);margin-bottom:7px;letter-spacing:.01em}',

      // Inputs
      '.rp-input,.rp-select{',
      'appearance:none;-webkit-appearance:none;width:100%;',
      'border:1px solid var(--rp-line);border-radius:10px;background:#fff;color:var(--rp-fg);',
      'font:inherit;font-size:15px;padding:12px 14px;outline:none;',
      'transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;',
      '}',
      '.rp-input::placeholder{color:var(--rp-fg-muted)}',
      '.rp-input:hover,.rp-select:hover{border-color:#cbd5e1}',
      '.rp-input:focus,.rp-select:focus{',
      'border-color:var(--rp-brand);',
      'box-shadow:0 0 0 4px color-mix(in srgb,var(--rp-brand) 14%,transparent);',
      '}',
      '.rp-select-wrap{position:relative}',
      '.rp-select-wrap::after{content:"";position:absolute;right:14px;top:50%;width:8px;height:8px;',
      'border-right:1.5px solid var(--rp-fg-muted);border-bottom:1.5px solid var(--rp-fg-muted);',
      'transform:translateY(-70%) rotate(45deg);pointer-events:none;transition:border-color .2s}',
      '.rp-select-wrap:focus-within::after{border-color:var(--rp-brand)}',

      // Phone input with flag prefix
      '.rp-phone{display:flex;align-items:stretch;border:1px solid var(--rp-line);border-radius:10px;',
      'transition:border-color .18s ease,box-shadow .18s ease}',
      '.rp-phone:focus-within{border-color:var(--rp-brand);box-shadow:0 0 0 4px color-mix(in srgb,var(--rp-brand) 14%,transparent)}',
      '.rp-phone-prefix{display:flex;align-items:center;gap:6px;padding:0 12px;',
      'background:var(--rp-surface-soft);border-right:1px solid var(--rp-line);border-radius:9px 0 0 9px;',
      'font-size:14px;color:var(--rp-fg-soft);font-weight:500;letter-spacing:.02em}',
      '.rp-phone-prefix .rp-flag{font-size:15px}',
      '.rp-phone input{flex:1;border:0;padding:12px 14px;background:transparent;outline:none;',
      'font:inherit;font-size:15px;color:var(--rp-fg);border-radius:0 9px 9px 0}',
      '.rp-phone input::placeholder{color:var(--rp-fg-muted)}',
      '.rp-consent{display:flex;gap:9px;align-items:flex-start;font-size:11.5px;line-height:1.45;color:var(--rp-fg-muted)}',
      '.rp-consent input{margin-top:2px;accent-color:var(--rp-brand)}',
      '.rp-consent-optional{opacity:.82}',
      '.rp-microcopy{margin:2px 0 0;font-size:11.5px;line-height:1.45;color:var(--rp-fg-muted)}',
      '.rp-hp{position:absolute!important;left:-9999px!important;opacity:0!important;pointer-events:none!important}',

      // Segmented toggle (property type)
      '.rp-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:0;',
      'background:var(--rp-surface-soft);border-radius:10px;padding:4px;position:relative}',
      '.rp-seg button{position:relative;z-index:1;border:0;background:transparent;color:var(--rp-fg-soft);',
      'font:inherit;font-size:13px;font-weight:500;padding:10px 8px;cursor:pointer;',
      'border-radius:7px;transition:color .25s ease}',
      '.rp-seg button.rp-selected{color:var(--rp-fg);font-weight:600;',
      'background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05),0 4px 10px rgba(15,23,42,.06)}',

      // Button (primary)
      '.rp-button{',
      'display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;',
      'border:0;border-radius:10px;padding:14px 18px;',
      'background:linear-gradient(180deg,var(--rp-brand) 0%,color-mix(in srgb,var(--rp-brand) 88%,#000) 100%);',
      'color:#fff;font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;',
      'letter-spacing:.005em;',
      'box-shadow:',
      'inset 0 1px 0 rgba(255,255,255,.2),',
      '0 1px 2px rgba(15,23,42,.1),',
      '0 8px 20px color-mix(in srgb,var(--rp-brand) 28%,transparent);',
      'transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;',
      '}',
      '.rp-button:hover{transform:translateY(-1px);filter:saturate(1.05);',
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 4px rgba(15,23,42,.1),0 14px 28px color-mix(in srgb,var(--rp-brand) 32%,transparent)}',
      '.rp-button:active{transform:translateY(0)}',
      '.rp-button:disabled{opacity:.6;cursor:not-allowed;transform:none;filter:none}',
      '.rp-button .rp-arrow{transition:transform .25s cubic-bezier(.22,1,.36,1)}',
      '.rp-button:hover .rp-arrow{transform:translateX(4px)}',

      // Messages
      '.rp-success,.rp-error{margin-top:14px;padding:12px 14px;border-radius:10px;font-size:13.5px;line-height:1.5;',
      'display:flex;align-items:flex-start;gap:10px;animation:rp-slide-in .35s cubic-bezier(.22,1,.36,1)}',
      '.rp-success{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}',
      '.rp-error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}',
      '.rp-success .rp-ic,.rp-error .rp-ic{flex-shrink:0;width:18px;height:18px;border-radius:999px;',
      'display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;margin-top:1px}',
      '.rp-success .rp-ic{background:#16a34a}',
      '.rp-error .rp-ic{background:#dc2626}',
      '@keyframes rp-slide-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}',

      // Result card
      '.rp-result{margin-top:20px;position:relative;border-radius:16px;',
      'border:1px solid var(--rp-line);overflow:hidden;',
      'background:linear-gradient(180deg,#fafbff 0%,#f1f5f9 100%);',
      'animation:rp-result-in .5s cubic-bezier(.22,1,.36,1)}',
      '@keyframes rp-result-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
      '.rp-result-inner{padding:22px 22px 20px;border-radius:16px;',
      'background:radial-gradient(ellipse at top right,color-mix(in srgb,var(--rp-brand) 8%,transparent),transparent 60%)}',
      '.rp-result-label{font-family:"Fraunces",Georgia,serif;font-style:italic;font-size:14px;',
      'color:var(--rp-fg-muted);margin:0 0 8px;letter-spacing:.002em}',
      '.rp-result-value{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:30px;line-height:1.05;',
      'letter-spacing:-.03em;color:var(--rp-fg);margin-bottom:6px;font-variant-numeric:tabular-nums}',
      '.rp-result-value .rp-unit{font-size:.6em;color:var(--rp-fg-muted);margin-right:4px;font-weight:400}',
      '.rp-result-range-label{font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:var(--rp-fg-muted);font-weight:500;margin-top:10px}',
      '.rp-result-bar{margin-top:8px;height:4px;background:var(--rp-line);border-radius:999px;overflow:hidden;position:relative}',
      '.rp-result-bar-fill{position:absolute;top:0;bottom:0;left:10%;right:10%;',
      'background:linear-gradient(90deg,#86efac,color-mix(in srgb,var(--rp-brand) 60%,#fff),#fcd34d);border-radius:999px;',
      'animation:rp-bar-grow 1.1s cubic-bezier(.22,1,.36,1)}',
      '.rp-result-bar-marker{position:absolute;top:-4px;left:50%;width:12px;height:12px;border-radius:999px;',
      'background:#fff;border:2px solid var(--rp-fg);transform:translateX(-50%);',
      'box-shadow:0 2px 6px rgba(15,23,42,.2)}',
      '@keyframes rp-bar-grow{from{transform:scaleX(0);transform-origin:center}to{transform:scaleX(1)}}',
      '.rp-result-bounds{display:flex;justify-content:space-between;margin-top:10px;font-size:12px;',
      'font-variant-numeric:tabular-nums;color:var(--rp-fg-soft)}',
      '.rp-footnote{margin:16px 0 0;font-size:12.5px;color:var(--rp-fg-muted);line-height:1.5}',
      '.rp-footnote strong{color:var(--rp-fg-soft);font-weight:500}',

      // Contact buttons
      '.rp-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}',
      '.rp-link-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;',
      'text-decoration:none;padding:13px 14px;border-radius:10px;font-weight:600;font-size:14px;',
      'border:1px solid var(--rp-line);color:var(--rp-fg);background:#fff;transition:all .18s ease}',
      '.rp-link-button:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(15,23,42,.06);border-color:#cbd5e1}',
      '.rp-link-button.rp-whatsapp{background:#25D366;color:#fff;border-color:#25D366;',
      'box-shadow:0 1px 2px rgba(37,211,102,.25),0 6px 16px rgba(37,211,102,.28)}',
      '.rp-link-button.rp-whatsapp:hover{background:#20b558;border-color:#20b558}',
      '.rp-link-button svg{width:16px;height:16px;flex-shrink:0}',

      // Carousel mode
      '.rp-carousel-card{overflow:hidden;padding:0;background:#070b12;color:#fff;border-color:rgba(255,255,255,.12);border-radius:30px}',
      '.rp-carousel-hero{position:relative;min-height:168px;padding:28px 30px 24px;overflow:hidden;',
      'background:linear-gradient(135deg,rgba(6,10,18,.82),rgba(9,24,34,.56)),var(--rp-carousel-bg);background-size:cover;background-position:center}',
      '.rp-carousel-hero::after{content:"";position:absolute;inset:auto -20% -40% -20%;height:90%;',
      'background:radial-gradient(circle at 50% 0,color-mix(in srgb,var(--rp-brand) 32%,transparent),transparent 64%);pointer-events:none}',
      '.rp-carousel-brand{position:relative;z-index:1;display:flex;align-items:center;gap:12px;margin-bottom:18px}',
      '.rp-carousel-logo{width:40px;height:40px;border-radius:12px;object-fit:cover;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08)}',
      '.rp-carousel-agency{font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,.54);font-weight:700}',
      '.rp-carousel-headline{font-size:14px;color:rgba(255,255,255,.78);line-height:1.45;margin-top:2px}',
      '.rp-carousel-title{position:relative;z-index:1;font-family:"Fraunces",Georgia,serif;font-weight:300;',
      'font-size:31px;line-height:1.03;letter-spacing:-.03em;margin:0;max-width:9.5em;color:#fff}',
      '.rp-carousel-title em{font-style:italic;color:rgba(255,255,255,.55)}',
      '.rp-carousel-body{padding:24px 28px 26px;background:linear-gradient(180deg,#090d15,#05070c)}',
      '.rp-carousel-topline{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}',
      '.rp-carousel-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.22em;color:rgba(255,255,255,.48);font-weight:700}',
      '.rp-carousel-nav{display:flex;gap:8px}',
      '.rp-carousel-nav button{width:34px;height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.14);',
      'background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font:inherit;font-size:20px;line-height:1;transition:background .18s,transform .18s}',
      '.rp-carousel-nav button:hover{background:rgba(255,255,255,.12);transform:translateY(-1px)}',
      '.rp-carousel-track{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:2px 2px 16px;margin:0 -2px}',
      '.rp-carousel-track::-webkit-scrollbar{display:none}',
      '.rp-carousel-track.rp-track-animated{transition:transform .62s cubic-bezier(.22,1,.36,1)}',
      '.rp-tool-card{scroll-snap-align:center;min-width:78%;border:1px solid rgba(255,255,255,.12);border-radius:18px;',
      'padding:18px;background:linear-gradient(150deg,rgba(255,255,255,.08),rgba(255,255,255,.025));cursor:pointer;',
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.08);transition:border-color .2s,transform .2s,background .2s}',
      '.rp-tool-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.24)}',
      '.rp-tool-card.rp-selected{border-color:color-mix(in srgb,var(--rp-brand) 70%,#fff);background:linear-gradient(150deg,color-mix(in srgb,var(--rp-brand) 22%,transparent),rgba(255,255,255,.04))}',
      '.rp-tool-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.2em;color:rgba(255,255,255,.48);font-weight:700;margin-bottom:10px}',
      '.rp-tool-title{font-size:19px;line-height:1.15;color:#fff;font-weight:700;letter-spacing:-.02em;margin-bottom:10px}',
      '.rp-tool-short{font-size:13px;line-height:1.5;color:rgba(255,255,255,.62)}',
      '.rp-carousel-panels{position:relative;border:1px solid rgba(255,255,255,.1);border-radius:18px;overflow:hidden;background:rgba(255,255,255,.04)}',
      '.rp-card-step{display:none;padding:20px}',
      '.rp-card-step.rp-active{display:block;animation:rp-result-in .38s cubic-bezier(.22,1,.36,1)}',
      '.rp-carousel-panels .rp-label{color:rgba(255,255,255,.66);font-size:11px;text-transform:uppercase;letter-spacing:.13em;font-weight:700}',
      '.rp-carousel-panels .rp-input,.rp-carousel-panels .rp-select{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff}',
      '.rp-carousel-panels .rp-input::placeholder{color:rgba(255,255,255,.34)}',
      '.rp-carousel-panels .rp-phone{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}',
      '.rp-carousel-panels .rp-phone-prefix{background:rgba(255,255,255,.06);border-right-color:rgba(255,255,255,.12);color:rgba(255,255,255,.7)}',
      '.rp-carousel-panels .rp-phone input{color:#fff}',
      '.rp-card-context{margin:0 0 16px;color:rgba(255,255,255,.66);font-size:13px;line-height:1.55}',
      '.rp-result-list{display:grid;gap:10px;margin:16px 0}',
      '.rp-result-chip{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.055);border-radius:13px;padding:12px}',
      '.rp-result-chip span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,.42);font-weight:700;margin-bottom:4px}',
      '.rp-result-chip strong{font-size:16px;color:#fff;font-weight:700}',
      '.rp-carousel-card .rp-powered{border-top-color:rgba(255,255,255,.08);padding:16px 28px 20px;margin:0;background:#05070c;color:rgba(255,255,255,.44)}',
      '.rp-carousel-card .rp-powered-brand{color:rgba(255,255,255,.68)}',
      '.rp-carousel-single{padding:26px 26px 22px;background:linear-gradient(180deg,#080b12,#05070c)}',
      '.rp-carousel-single .rp-carousel-track{gap:0;padding:0 0 14px;margin:0;scroll-padding:0;overflow:visible;overscroll-behavior-x:contain;will-change:transform;touch-action:pan-y;cursor:grab;user-select:none}',
      '.rp-carousel-single .rp-carousel-track.rp-dragging{cursor:grabbing}',
      '.rp-widget-slide{position:relative;display:flex;min-width:100%;width:100%;height:430px;flex-direction:column;align-items:flex-start;justify-content:flex-end;overflow:hidden;border-radius:38px;padding:40px;text-align:left;background:#101722;border-color:rgba(255,255,255,.16);scroll-snap-align:start;scroll-snap-stop:always;flex:0 0 100%;appearance:none;-webkit-appearance:none}',
      '.rp-widget-slide::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 -90px 130px rgba(0,0,0,.45);pointer-events:none}',
      '.rp-slide-bg{position:absolute;inset:0;background-image:var(--rp-slide-bg);background-size:cover;background-position:var(--rp-slide-pos,center);opacity:.9;transform:scale(1.015);transition:transform .7s cubic-bezier(.22,1,.36,1),opacity .42s ease}',
      '.rp-widget-slide.rp-selected .rp-slide-bg{transform:scale(1.04);opacity:.96}',
      '.rp-slide-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.38) 52%,rgba(0,0,0,.10)),linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.70))}',
      '.rp-slide-watermark{position:absolute;left:22px;top:20px;z-index:2;display:flex;align-items:center;gap:10px;font-size:10px;text-transform:uppercase;letter-spacing:.22em;color:rgba(255,255,255,.68);font-weight:700}',
      '.rp-slide-watermark .rp-carousel-logo{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.08)}',
      '.rp-widget-slide .rp-tool-eyebrow,.rp-widget-slide .rp-tool-title,.rp-widget-slide .rp-tool-short,.rp-widget-slide .rp-slide-cta{position:relative;z-index:2}',
      '.rp-widget-slide .rp-tool-eyebrow{margin-bottom:13px;color:rgba(192,220,255,.78)}',
      '.rp-widget-slide .rp-tool-title{max-width:560px;font-size:46px;line-height:.96;letter-spacing:-.05em;text-wrap:balance}',
      '.rp-widget-slide .rp-tool-short{max-width:520px;margin-top:15px;color:rgba(255,255,255,.72);font-size:16px;line-height:1.6}',
      '.rp-slide-cta{margin-top:26px;display:inline-flex;align-items:center;justify-content:center;background:#fff;color:#07101b;border:0;border-radius:0;padding:15px 24px;font:inherit;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.24em;box-shadow:0 20px 54px rgba(0,0,0,.28);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}',
      '.rp-slide-cta:hover{transform:translateY(-1px);box-shadow:0 24px 62px rgba(0,0,0,.34)}',
      '.rp-carousel-stage{position:relative;min-height:430px;overflow:hidden;border-radius:38px}',
      '.rp-carousel-dots{display:flex;justify-content:center;gap:8px;margin:10px 0 2px}',
      '.rp-carousel-dot{width:24px;height:2px;border-radius:999px;background:rgba(255,255,255,.18);transition:background .2s,width .2s}',
      '.rp-carousel-dot.rp-active{width:42px;background:var(--rp-brand)}',
      '.rp-carousel-panels{position:absolute;inset:0;display:none;z-index:20;height:100%}',
      '.rp-carousel-panels.rp-panel-open{display:block;animation:rpPanelIn .32s cubic-bezier(.22,1,.36,1) both}',
      '.rp-carousel-track.rp-stage-hidden{opacity:0;pointer-events:none;transform:scale(.988);filter:saturate(.94) blur(.4px)}',
      '.rp-card-step{display:none;height:100%;padding:0}',
      '.rp-card-step.rp-active{display:block;animation:rp-result-in .38s cubic-bezier(.22,1,.36,1)}',
      '.rp-stage-panel{position:relative;height:100%;min-height:430px;overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:38px;background:linear-gradient(140deg,rgba(7,11,18,.92),rgba(4,7,12,.98));box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}',
      '.rp-stage-panel::before{content:"";position:absolute;inset:0;background-image:var(--rp-stage-bg);background-size:cover;background-position:var(--rp-stage-pos,center);opacity:.92;transform:scale(1.04)}',
      '.rp-stage-panel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.42) 52%,rgba(0,0,0,.24)),linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.72));pointer-events:none}',
      '.rp-stage-panel-inner{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:flex-start;height:100%;padding:26px 32px 24px;overflow:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.22) transparent}',
      '.rp-stage-panel-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}',
      '.rp-stage-panel-top .rp-slide-watermark{position:static;padding:0;background:none;border:0;backdrop-filter:none}',
      '.rp-stage-panel-back{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(4,9,16,.42);padding:9px 13px;color:rgba(255,255,255,.76);font:inherit;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;cursor:pointer;transition:background .18s ease,border-color .18s ease,color .18s ease}',
      '.rp-stage-panel-back:hover{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.22);color:#fff}',
      '.rp-stage-copy{max-width:840px;margin-top:30px}',
      '.rp-stage-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.22em;color:rgba(192,220,255,.78);font-weight:700;margin-bottom:10px}',
      '.rp-stage-title{font-size:40px;line-height:.96;color:#fff;font-weight:700;letter-spacing:-.05em;text-wrap:balance;margin:0}',
      '.rp-stage-description{max-width:680px;margin:12px 0 0;color:rgba(255,255,255,.74);font-size:14px;line-height:1.45}',
      '.rp-stage-form{display:grid;gap:10px;max-width:880px;margin-top:16px}',
      '.rp-stage-form .rp-label{color:rgba(255,255,255,.68);font-size:11px;text-transform:uppercase;letter-spacing:.13em;font-weight:700}',
      '.rp-stage-form .rp-input,.rp-stage-form .rp-select{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#fff;padding:11px 13px;min-height:48px}',
      '.rp-stage-form .rp-input::placeholder{color:rgba(255,255,255,.32)}',
      '.rp-stage-form .rp-phone{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}',
      '.rp-stage-form .rp-phone-prefix{background:rgba(255,255,255,.08);border-right-color:rgba(255,255,255,.14);color:rgba(255,255,255,.7)}',
      '.rp-stage-form .rp-phone input{color:#fff}',
      '.rp-stage-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}',
      '.rp-stage-success-grid{display:grid;gap:12px;max-width:760px;margin-top:18px}',
      '.rp-stage-success-card{border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.08);padding:16px 18px}',
      '.rp-stage-success-card span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,.46);font-weight:700;margin-bottom:6px}',
      '.rp-stage-success-card strong{display:block;color:#fff;font-size:18px;line-height:1.35;font-weight:700}',
      '.rp-stage-note{max-width:620px;margin:16px 0 0;color:rgba(255,255,255,.68);font-size:14px;line-height:1.6}',
      '.rp-stage-secondary{display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;padding:14px 22px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.22em;text-decoration:none;transition:background .18s ease,border-color .18s ease}',
      '.rp-stage-secondary:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.24)}',
      '@keyframes rpPanelIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}',

      // Powered by
      '.rp-powered{margin-top:22px;padding-top:16px;border-top:1px solid var(--rp-line-soft);',
      'display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--rp-fg-muted);letter-spacing:.01em}',
      '.rp-powered.rp-hidden{display:none}',
      '.rp-powered-brand{display:flex;align-items:center;gap:8px;color:var(--rp-fg-soft);font-weight:500;text-decoration:none}',
      '.rp-powered-logo{width:20px;height:20px;border-radius:7px;object-fit:cover;box-shadow:0 0 0 1px rgba(15,23,42,.08)}',
      '.rp-powered-secure{display:inline-flex;align-items:center;gap:5px}',

      // Spinner
      '.rp-spinner{width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.35);',
      'border-top-color:#fff;animation:rp-spin .7s linear infinite}',
      '@keyframes rp-spin{to{transform:rotate(360deg)}}',

      // Popup modal (centered)
      '.rp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);',
      'opacity:0;pointer-events:none;transition:opacity .3s ease;z-index:2147483645}',
      '.rp-overlay.rp-open{opacity:1;pointer-events:auto}',
      '.rp-modal{position:fixed;top:50%;left:50%;width:min(460px,calc(100vw - 24px));',
      'transform:translate(-50%,-48%) scale(.96);opacity:0;pointer-events:none;',
      'transition:opacity .3s cubic-bezier(.22,1,.36,1),transform .35s cubic-bezier(.22,1,.36,1);',
      'z-index:2147483646;max-height:calc(100vh - 40px);overflow-y:auto}',
      '.rp-modal.rp-open{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:auto}',

      // Drawer
      '.rp-drawer-panel{position:fixed;top:0;right:0;height:100vh;width:min(460px,100vw);',
      'transform:translateX(100%);transition:transform .4s cubic-bezier(.22,1,.36,1);',
      'z-index:2147483646;overflow-y:auto;padding:18px}',
      '.rp-drawer-panel.rp-open{transform:translateX(0)}',
      '.rp-drawer-panel .rp-card{height:auto;max-height:calc(100vh - 36px)}',

      // Floating action button (FAB)
      '.rp-fab{position:fixed;right:18px;bottom:18px;z-index:2147483644;',
      'display:inline-flex;align-items:center;gap:10px;',
      'border:0;border-radius:999px;padding:14px 20px;',
      'background:linear-gradient(180deg,var(--rp-brand) 0%,color-mix(in srgb,var(--rp-brand) 85%,#000) 100%);',
      'color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.005em;',
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 4px 12px rgba(15,23,42,.15),',
      '0 16px 40px color-mix(in srgb,var(--rp-brand) 35%,transparent);',
      'transition:transform .2s ease,box-shadow .2s ease}',
      '.rp-fab:hover{transform:translateY(-2px)}',
      '.rp-fab-icon{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center}',

      // Close button
      '.rp-close{position:absolute;top:14px;right:14px;z-index:2;border:0;background:var(--rp-surface-soft);',
      'color:var(--rp-fg-soft);width:32px;height:32px;border-radius:999px;cursor:pointer;',
      'font:inherit;font-size:16px;display:flex;align-items:center;justify-content:center;',
      'transition:background .18s ease,color .18s ease}',
      '.rp-close:hover{background:var(--rp-line);color:var(--rp-fg)}',

      // ── Banner mode (horizontal card with Dubai background) ────
      '.rp-banner-shell{width:100%}',
      '.rp-banner{position:relative;width:100%;min-height:300px;border-radius:20px;overflow:hidden;',
      'background-color:#0a0a0f;background-size:cover;background-position:center;',
      'box-shadow:0 1px 2px rgba(15,23,42,.08),0 24px 60px -20px rgba(15,23,42,.35)}',
      '.rp-banner-bg{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;',
      'opacity:0;transform:scale(1.015);transition:opacity 1.15s ease,transform 5.8s cubic-bezier(.16,1,.3,1);will-change:opacity,transform}',
      '.rp-banner-bg.rp-active{opacity:1;transform:scale(1.055)}',
      '.rp-banner-shell.rp-compact .rp-banner{min-height:178px;border-radius:24px;',
      'box-shadow:0 18px 60px rgba(0,0,0,.28)}',
      '.rp-banner-overlay{position:absolute;inset:0;z-index:1;',
      'background:linear-gradient(105deg,rgba(10,10,15,.76) 0%,rgba(10,10,15,.52) 45%,rgba(10,10,15,.22) 100%)}',
      '.rp-banner-content{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;',
      'gap:40px;padding:48px 56px;min-height:300px}',
      '.rp-banner-shell.rp-compact .rp-banner-content{min-height:178px;padding:26px 30px;gap:22px}',
      '.rp-banner-step{display:none;width:100%}',
      '.rp-banner-step.rp-active{display:flex;align-items:center;justify-content:space-between;gap:40px;width:100%;',
      'animation:rp-banner-fade .5s cubic-bezier(.22,1,.36,1)}',
      '@keyframes rp-banner-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',

      // Banner hero (step 0)
      '.rp-banner-text{max-width:580px;flex:1}',
      '.rp-banner-eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:18px;',
      'font-size:11px;color:rgba(255,255,255,.55);letter-spacing:.22em;text-transform:uppercase;font-weight:500}',
      '.rp-banner-eyebrow .rp-dot{width:6px;height:6px;border-radius:999px;background:var(--rp-brand);',
      'box-shadow:0 0 0 3px color-mix(in srgb,var(--rp-brand) 25%,transparent);animation:rp-dot-pulse 2.4s ease-in-out infinite}',
      '.rp-banner-title{font-family:"Fraunces",Georgia,serif;font-weight:300;',
      'font-size:clamp(28px,3.2vw,40px);line-height:1.05;letter-spacing:-.02em;',
      'color:#fff;margin:0}',
      '.rp-banner-shell.rp-compact .rp-banner-title{max-width:520px;font-size:clamp(25px,3vw,35px)}',
      '.rp-banner-title em{font-style:italic;font-weight:300;color:rgba(255,255,255,.55)}',
      '.rp-banner-cta-wrap{flex-shrink:0}',
      '.rp-banner-cta{display:inline-flex;align-items:center;gap:12px;border:0;border-radius:999px;',
      'padding:18px 30px;background:#fff;color:#0a0a0f;font:inherit;font-size:14.5px;font-weight:600;',
      'letter-spacing:.005em;cursor:pointer;',
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 8px 24px rgba(0,0,0,.3),0 2px 6px rgba(0,0,0,.18);',
      'transition:transform .2s ease,box-shadow .2s ease}',
      '.rp-banner-shell.rp-compact .rp-banner-cta{padding:14px 22px;font-size:13.5px}',
      '.rp-banner-cta:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 14px 32px rgba(0,0,0,.4)}',
      '.rp-banner-cta .rp-arrow{transition:transform .25s cubic-bezier(.22,1,.36,1)}',
      '.rp-banner-cta:hover .rp-arrow{transform:translateX(4px)}',

      // Banner lead form (step 1) — dark card on the right
      '.rp-banner-lead-copy{max-width:380px;flex:1;color:#fff}',
      '.rp-banner-lead-copy .rp-banner-eyebrow{color:rgba(255,255,255,.55)}',
      '.rp-banner-lead-copy h3{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:30px;',
      'line-height:1.1;letter-spacing:-.02em;margin:0 0 14px;color:#fff}',
      '.rp-banner-lead-copy p{font-size:14px;color:rgba(255,255,255,.55);line-height:1.6;margin:0}',
      '.rp-banner-form-wrap{flex:1;max-width:420px;background:rgba(15,23,42,.4);',
      'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
      'border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px}',
      '.rp-banner-form-wrap .rp-label{color:rgba(255,255,255,.65);font-size:11.5px;',
      'text-transform:uppercase;letter-spacing:.12em;font-weight:500}',
      '.rp-banner-form-wrap .rp-input,.rp-banner-form-wrap .rp-phone{',
      'background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);color:#fff}',
      '.rp-banner-form-wrap .rp-input::placeholder{color:rgba(255,255,255,.3)}',
      '.rp-banner-form-wrap .rp-input:hover,.rp-banner-form-wrap .rp-phone:hover{border-color:rgba(255,255,255,.2)}',
      '.rp-banner-form-wrap .rp-input:focus,.rp-banner-form-wrap .rp-phone:focus-within{',
      'border-color:var(--rp-brand);background:rgba(255,255,255,.06);',
      'box-shadow:0 0 0 4px color-mix(in srgb,var(--rp-brand) 18%,transparent)}',
      '.rp-banner-form-wrap .rp-phone-prefix{background:rgba(255,255,255,.04);',
      'border-right-color:rgba(255,255,255,.1);color:rgba(255,255,255,.7)}',
      '.rp-banner-form-wrap .rp-phone input{color:#fff}',
      '.rp-banner-form-wrap .rp-phone input::placeholder{color:rgba(255,255,255,.3)}',
      '.rp-banner-form-wrap .rp-button{margin-top:6px}',

      // Banner result (step 2) — general benchmark
      '.rp-banner-result-copy{max-width:380px;flex:1;color:#fff}',
      '.rp-banner-result-copy h3{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:28px;',
      'line-height:1.1;letter-spacing:-.02em;margin:0 0 14px;color:#fff}',
      '.rp-banner-result-copy p{font-size:14px;color:rgba(255,255,255,.6);line-height:1.6;margin:0 0 16px}',
      '.rp-banner-result-copy p strong{color:rgba(255,255,255,.85);font-weight:500}',
      '.rp-general-result{flex:1;max-width:480px;background:rgba(15,23,42,.5);',
      'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
      'border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;color:#fff}',
      '.rp-general-result-label{font-family:"Fraunces",Georgia,serif;font-style:italic;',
      'font-size:13px;color:rgba(255,255,255,.55);margin:0 0 18px}',
      '.rp-general-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}',
      '.rp-general-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);',
      'border-radius:12px;padding:14px 12px;text-align:center}',
      '.rp-general-stat-label{font-size:10px;text-transform:uppercase;letter-spacing:.18em;',
      'color:rgba(255,255,255,.45);font-weight:500;margin-bottom:8px}',
      '.rp-general-stat-value{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:20px;',
      'letter-spacing:-.02em;color:#fff;font-variant-numeric:tabular-nums}',
      '.rp-general-result .rp-contact-grid{margin-top:14px}',
      '.rp-general-result .rp-link-button{background:rgba(255,255,255,.06);',
      'border-color:rgba(255,255,255,.1);color:#fff}',
      '.rp-general-result .rp-link-button:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2)}',
      '.rp-general-result .rp-link-button.rp-whatsapp{background:#25D366;border-color:#25D366;color:#fff}',
      '.rp-general-result .rp-link-button.rp-whatsapp:hover{background:#20b558;border-color:#20b558}',
      '.rp-banner-watermark{position:absolute;right:22px;bottom:16px;z-index:2;',
      'display:inline-flex;align-items:center;gap:7px;border-radius:999px;border:1px solid rgba(255,255,255,.14);',
      'background:rgba(4,8,18,.34);backdrop-filter:blur(12px);padding:7px 11px;',
      'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,.58)}',
      '.rp-banner-watermark.rp-hidden{display:none}',
      '.rp-quota-message{border:1px solid rgba(250,204,21,.26);background:rgba(250,204,21,.08);',
      'color:rgba(255,255,255,.78);border-radius:14px;padding:14px 16px;font-size:13px;line-height:1.55}',

      // Banner address form (inside step 2 result card)
      '.rp-general-result .rp-form{display:grid;gap:14px;margin-bottom:16px}',
      '.rp-general-result .rp-label{color:rgba(255,255,255,.65);font-size:11.5px;',
      'text-transform:uppercase;letter-spacing:.12em;font-weight:500}',
      '.rp-general-result .rp-input,.rp-general-result .rp-select{',
      'background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);color:#fff}',
      '.rp-general-result .rp-input::placeholder{color:rgba(255,255,255,.3)}',
      '.rp-general-result .rp-input:hover,.rp-general-result .rp-select:hover{border-color:rgba(255,255,255,.2)}',
      '.rp-general-result .rp-input:focus,.rp-general-result .rp-select:focus{',
      'border-color:var(--rp-brand);background:rgba(255,255,255,.06);',
      'box-shadow:0 0 0 4px color-mix(in srgb,var(--rp-brand) 18%,transparent)}',
      '.rp-general-result .rp-select-wrap::after{border-color:rgba(255,255,255,.5)}',

      // Banner range display
      '.rp-banner-estimate{margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);',
      'animation:rp-result-in .5s cubic-bezier(.22,1,.36,1)}',
      '.rp-banner-range-value{display:flex;align-items:baseline;gap:14px;margin-top:10px;',
      'font-family:"Fraunces",Georgia,serif;font-weight:300;letter-spacing:-.02em;color:#fff;',
      'font-variant-numeric:tabular-nums}',
      '.rp-banner-range-lo,.rp-banner-range-hi{font-size:30px;line-height:1.05}',
      '.rp-banner-range-sep{color:rgba(255,255,255,.35);font-size:24px}',
      '.rp-banner-range-bar{margin-top:12px;height:5px;background:rgba(255,255,255,.08);border-radius:999px;',
      'position:relative;overflow:hidden}',
      '.rp-banner-range-fill{position:absolute;top:0;bottom:0;left:0;right:0;',
      'background:linear-gradient(90deg,#86efac 0%,color-mix(in srgb,var(--rp-brand) 60%,#fff) 50%,#fcd34d 100%);',
      'border-radius:999px;animation:rp-bar-grow 1.1s cubic-bezier(.22,1,.36,1)}',
      '.rp-banner-range-note{margin:14px 0 0;font-size:13px;color:rgba(255,255,255,.6);line-height:1.55}',
      '.rp-banner-range-note strong{color:rgba(255,255,255,.85);font-weight:500}',

      // Banner mobile
      '@media (max-width:760px){',
      '.rp-banner-content{padding:32px 26px;flex-direction:column;align-items:flex-start;gap:24px;min-height:0}',
      '.rp-banner-step.rp-active{flex-direction:column;align-items:stretch;gap:24px}',
      '.rp-banner-text,.rp-banner-lead-copy,.rp-banner-result-copy{max-width:100%}',
      '.rp-banner-form-wrap,.rp-general-result{max-width:100%;width:100%}',
      '.rp-banner-cta{width:100%;justify-content:center}',
      '.rp-banner-title{font-size:26px}',
      '.rp-general-stats{grid-template-columns:repeat(3,1fr);gap:6px}',
      '.rp-general-stat{padding:10px 6px}',
      '.rp-general-stat-value{font-size:16px}',
      '}',

      // Mobile
      '@media (max-width:520px){',
      '.rp-card{padding:24px 20px 20px;border-radius:16px}',
      '.rp-carousel-card{padding:0;border-radius:24px}',
      '.rp-carousel-hero{padding:22px 20px 20px;min-height:150px}',
      '.rp-carousel-title{font-size:27px}',
      '.rp-carousel-body{padding:18px 16px 18px}',
      '.rp-tool-card{min-width:88%;padding:16px}',
      '.rp-carousel-single .rp-carousel-track{padding-bottom:12px}',
      '.rp-widget-slide{min-width:100%;height:462px;padding:26px;border-radius:28px}',
      '.rp-widget-slide .rp-tool-title{font-size:34px}',
      '.rp-widget-slide .rp-tool-short{font-size:14px}',
      '.rp-stage-panel{min-height:520px;border-radius:28px}',
      '.rp-stage-panel-inner{padding:22px 20px 20px}',
      '.rp-stage-title{font-size:34px}',
      '.rp-stage-description{font-size:14px;line-height:1.55}',
      '.rp-stage-form{margin-top:16px;gap:10px}',
      '.rp-grid-2,.rp-contact-grid{grid-template-columns:1fr}',
      '.rp-title{font-size:24px}',
      '.rp-result-value{font-size:26px}',
      '.rp-fab{left:12px;right:12px;bottom:12px;border-radius:14px;justify-content:center}',
      '.rp-modal{width:calc(100vw - 16px);max-height:calc(100vh - 20px)}',
      '}',
    ].join("");
    shadowRoot.appendChild(style);
  }

  // ── Template ──────────────────────────────────────────────
  function createCardInner() {
    var svgArrow = '<svg class="rp-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var svgLock = '<svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 7V5a4 4 0 118 0v2m-9 0h10v7H3V7z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var svgWhatsApp = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.6-1.9-.1-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.1 2.9c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/><path d="M20.5 3.5C18.3 1.3 15.3 0 12 0 5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.7 1.4 5.7 1.4 6.6 0 12-5.4 12-12 0-3.3-1.3-6.3-3.5-8.3zm-8.5 18.5c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.6 15.9 2 14 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/></svg>';
    var svgMail = '<svg viewBox="0 0 24 24" fill="none"><path d="M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11z" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 7l8.5 6 8.5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var svgCheck = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    return [
      '<div class="rp-header">',
      '<div class="rp-eyebrow"><span class="rp-dot"></span><span class="rp-eyebrow-text">Dubai Valuation</span></div>',
      '<h2 class="rp-title">' + DEFAULT_TITLE.replace("property check", "property <em>check</em>") + '</h2>',
      '<p class="rp-subtitle">' + DEFAULT_SUBTITLE + '</p>',
      '<div class="rp-steps">',
      '<div class="rp-step-pill rp-pill-1 rp-on"><span class="rp-num">01</span><span class="rp-lbl">Your details</span></div>',
      '<div class="rp-step-connector"></div>',
      '<div class="rp-step-pill rp-pill-2"><span class="rp-num">02</span><span class="rp-lbl">Property</span></div>',
      '</div>',
      '</div>',

      '<div class="rp-step-wrap">',

      // Step 1 — Lead capture
      '<section class="rp-step rp-step-1 rp-active">',
      '<form class="rp-form rp-lead-form" autocomplete="on">',
      '<input class="rp-hp" name="company_website" tabindex="-1" autocomplete="off" />',
      '<div class="rp-field"><span class="rp-label">Full name</span>',
      '<input class="rp-input" name="name" type="text" placeholder="Jane Doe" autocomplete="name" required />',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Email (optional)</span>',
      '<input class="rp-input" name="email" type="email" placeholder="jane@company.com" autocomplete="email" />',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Phone</span>',
      '<div class="rp-phone">',
      '<span class="rp-phone-prefix"><span class="rp-flag">🇦🇪</span><span>WA</span></span>',
      '<input name="phone" type="tel" placeholder="+971 50 123 4567" autocomplete="tel" required />',
      '</div>',
      '</div>',
      renderConsentFields(),
      '<button class="rp-button rp-lead-submit" type="submit">',
      '<span class="rp-button-text">Continue</span>' + svgArrow,
      '</button>',
      '</form>',
      '<div class="rp-error rp-lead-error" hidden><span class="rp-ic">!</span><span class="rp-msg"></span></div>',
      '</section>',

      // Step 2 — Estimation
      '<section class="rp-step rp-step-2">',
      '<form class="rp-form rp-estimate-form">',
      '<div class="rp-field"><span class="rp-label">Property address or building</span>',
      '<input class="rp-input" name="address" type="text" placeholder="e.g. Marina Gate, Dubai Marina" autocomplete="street-address" required />',
      '<p class="rp-microcopy">A broker receives this context privately before replying.</p>',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Zone</span>',
      '<div class="rp-select-wrap"><select class="rp-select" name="zone" required>',
      '<option value="">Loading zones…</option></select></div>',
      '</div>',
      '<div class="rp-grid-2">',
      '<div class="rp-field"><span class="rp-label">Bedrooms</span>',
      '<div class="rp-select-wrap"><select class="rp-select" name="rooms" required>' +
        ROOM_OPTIONS.map(function (r) { return '<option value="' + r + '">' + r + "</option>"; }).join("") +
        "</select></div></div>",
      '<div class="rp-field"><span class="rp-label">Area (m²)</span>',
      '<input class="rp-input" name="area_m2" type="number" min="20" max="1000" step="1" placeholder="75" required />',
      '</div>',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Property type</span>',
      '<div class="rp-seg">' +
        PROPERTY_TYPES.map(function (t, i) {
          return '<button type="button" class="' + (i === 0 ? "rp-selected" : "") + '" data-type="' + t.value + '">' + t.label + '</button>';
        }).join("") +
        '</div><input type="hidden" name="property_type" value="Flat" /></div>',
      '<button class="rp-button rp-estimate-submit" type="submit">',
      '<span class="rp-button-text">Notify broker</span>' + svgArrow,
      '</button>',
      '</form>',
      '<div class="rp-error rp-estimate-error" hidden><span class="rp-ic">!</span><span class="rp-msg"></span></div>',

      '<div class="rp-result" hidden>',
      '<div class="rp-result-inner">',
      '<p class="rp-result-label">Broker notified</p>',
      '<p class="rp-result-value"><span class="rp-result-number">Valuation context sent</span></p>',
      '<p class="rp-footnote">Your contact and property details were saved for the agency. <strong>The broker can follow up with the valuation context; you can also continue on WhatsApp now.</strong></p>',
      '<div class="rp-contact-grid">',
      '<a class="rp-link-button rp-whatsapp" href="#" target="_blank" rel="noopener">' + svgWhatsApp + '<span>Go to agency WhatsApp</span></a>',
      '<a class="rp-link-button rp-email" href="#">' + svgMail + '<span>Email agency</span></a>',
      '</div>',
      '</div>',
      '</div>',
      '</section>',

      '</div>',

      // Powered by
      '<div class="rp-powered">',
      '<a class="rp-powered-brand" href="https://fonatprop.com" target="_blank" rel="noopener"><img class="rp-powered-logo" src="https://fonatprop.com/brand/fonatprop-mark.webp" alt="FonatProp" loading="lazy" />Powered by FonatProp</a>',
      '<span class="rp-powered-secure">' + svgLock + 'Secure &amp; private</span>',
      '</div>',
    ].join("");
    // unused in prod but keeps ESLint happy if we inline check icons elsewhere
    svgCheck; // eslint-disable-line
  }

  function createBannerInner(config) {
    var svgArrow = '<svg class="rp-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var svgWhatsApp = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.6-1.9-.1-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.1 2.9c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/><path d="M20.5 3.5C18.3 1.3 15.3 0 12 0 5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.7 1.4 5.7 1.4 6.6 0 12-5.4 12-12 0-3.3-1.3-6.3-3.5-8.3zm-8.5 18.5c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.6 15.9 2 14 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/></svg>';
    var svgMail = '<svg viewBox="0 0 24 24" fill="none"><path d="M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11z" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 7l8.5 6 8.5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var titleHtml = (config.bannerTitle || DEFAULT_BANNER_TITLE).replace(/worth\??$/i, function (m) {
      return "<em>" + m + "</em>";
    });

    return [
      // Step 0 — Hero CTA
      '<section class="rp-banner-step rp-banner-hero rp-active">',
      '<div class="rp-banner-text">',
      '<h2 class="rp-banner-title">' + titleHtml + '</h2>',
      '</div>',
      '<div class="rp-banner-cta-wrap">',
      '<button type="button" class="rp-banner-cta">' + (config.bannerCta || DEFAULT_BANNER_CTA) + svgArrow + '</button>',
      '</div>',
      '</section>',

      // Step 1 — Lead capture
      '<section class="rp-banner-step rp-banner-lead">',
      '<div class="rp-banner-lead-copy">',
      '<div class="rp-banner-eyebrow"><span class="rp-dot"></span><span>Just three details</span></div>',
      '<h3>Tell us how to reach you.</h3>',
      '<p>We&rsquo;ll share a Dubai market benchmark with you and a precise, agent-led valuation will follow shortly.</p>',
      '</div>',
      '<div class="rp-banner-form-wrap">',
      '<form class="rp-form rp-banner-lead-form" autocomplete="on" novalidate>',
      '<input class="rp-hp" name="company_website" tabindex="-1" autocomplete="off" />',
      '<div class="rp-field"><span class="rp-label">Full name</span>',
      '<input class="rp-input" name="name" type="text" placeholder="Jane Doe" autocomplete="name" required />',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Email (optional)</span>',
      '<input class="rp-input" name="email" type="email" placeholder="jane@company.com" autocomplete="email" />',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Phone</span>',
      '<div class="rp-phone">',
      '<span class="rp-phone-prefix"><span class="rp-flag">🇦🇪</span><span>WA</span></span>',
      '<input name="phone" type="tel" placeholder="+971 50 123 4567" autocomplete="tel" required />',
      '</div>',
      '</div>',
      '<div class="rp-grid-2">',
      '<div class="rp-field"><span class="rp-label">I want to</span>',
      '<div class="rp-select-wrap"><select class="rp-select" name="intent" required>',
      '<option value="value_sell" selected>Value / sell</option>',
      '<option value="buy">Buy</option>',
      '<option value="rent">Rent</option>',
      '<option value="invest">Invest</option>',
      '</select></div></div>',
      '<div class="rp-field"><span class="rp-label">Timeline</span>',
      '<div class="rp-select-wrap"><select class="rp-select" name="timeline" required>',
      '<option value="now" selected>Now</option>',
      '<option value="30_days">30 days</option>',
      '<option value="90_days">90 days</option>',
      '<option value="researching">Researching</option>',
      '</select></div></div>',
      '</div>',
      renderConsentFields(),
      '<button class="rp-button rp-banner-lead-submit" type="submit" disabled>',
      '<span class="rp-button-text">Continue</span>' + svgArrow,
      '</button>',
      '</form>',
      '<div class="rp-error rp-banner-lead-error" hidden><span class="rp-ic">!</span><span class="rp-msg"></span></div>',
      '</div>',
      '</section>',

      // Step 2 — Address-based general estimate + agent contact
      '<section class="rp-banner-step rp-banner-result">',
      '<div class="rp-banner-result-copy">',
      '<div class="rp-banner-eyebrow"><span class="rp-dot"></span><span>Private broker handoff</span></div>',
      '<h3>Tell us where it is.</h3>',
      '<p>Type a real Dubai property address or residential building. FonatProp saves the AI range privately for the agency. <strong>Then continue on WhatsApp with the broker.</strong></p>',
      '</div>',
      '<div class="rp-general-result">',
      '<form class="rp-form rp-banner-address-form" autocomplete="off" novalidate>',
      '<div class="rp-field"><span class="rp-label">Property address or residential building</span>',
      '<input class="rp-input" name="address" type="text" placeholder="e.g. Jumeirah Village St 2, Dubai" required />',
      '</div>',
      '<div class="rp-grid-2">',
      '<div class="rp-field"><span class="rp-label">Bedrooms</span>',
      '<div class="rp-select-wrap"><select class="rp-select" name="rooms" required>' +
        ROOM_OPTIONS.map(function (r, i) { return '<option value="' + r + '"' + (i === 1 ? ' selected' : '') + '>' + r + '</option>'; }).join("") +
        '</select></div></div>',
      '<div class="rp-field"><span class="rp-label">Area (m²)</span>',
      '<input class="rp-input" name="area_m2" type="number" min="20" max="2000" step="1" placeholder="e.g. 75" required />',
      '</div>',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Expected or listed price (optional)</span>',
      '<input class="rp-input" name="asking_price_aed" type="number" min="0" step="10000" placeholder="e.g. 1,850,000" />',
      '<p class="rp-microcopy">Optional signal for the agent. It does not force the AI range.</p>',
      '</div>',
      '<button class="rp-button rp-banner-address-submit" type="submit" disabled>',
      '<span class="rp-button-text">Prepare broker context</span>' + svgArrow,
      '</button>',
      '</form>',
      '<div class="rp-error rp-banner-address-error" hidden><span class="rp-ic">!</span><span class="rp-msg"></span></div>',

      // Handoff display - hidden until we get a result
      '<div class="rp-banner-estimate" hidden>',
      '<p class="rp-general-result-label">Broker handoff ready</p>',
      '<p class="rp-banner-range-note">Your property details and AI range were saved for the agency. <strong>Open WhatsApp to receive the valuation context from the broker.</strong></p>',
      '<div class="rp-contact-grid">',
      '<a class="rp-link-button rp-whatsapp rp-banner-whatsapp" href="#" target="_blank" rel="noopener">' + svgWhatsApp + '<span>Go to agency WhatsApp</span></a>',
      '<a class="rp-link-button rp-email rp-banner-email" href="#">' + svgMail + '<span>Email agency</span></a>',
      '</div>',
      '</div>',
      '</div>',
      '</section>',
    ].join("");
  }

  function renderCarouselLeadCapture(card, config) {
    var logo = sanitizeUrl(config.agencyLogo || "");
    var logoHtml = logo
      ? '<img class="rp-carousel-logo" src="' + escapeAttribute(logo) + '" alt="" loading="lazy" />'
      : '<img class="rp-carousel-logo" src="https://fonatprop.com/brand/fonatprop-mark.webp" alt="" loading="lazy" />';
    var agencyLabel = escapeHtml(config.agencyLabel || "Dubai agency");
    var cardBg = sanitizeUrl(card.image || "") || DEFAULT_BANNER_BG;
    var cardPosition = escapeAttribute(card.imagePosition || "center");

    return [
      '<div class="rp-stage-panel" style="--rp-stage-bg:url(\'' + escapeAttribute(cardBg) + '\');--rp-stage-pos:' + cardPosition + '">',
      '<div class="rp-stage-panel-inner">',
      '<div class="rp-stage-panel-top">',
      '<span class="rp-slide-watermark">' + logoHtml + '<span>' + agencyLabel + '</span></span>',
      '<button type="button" class="rp-stage-panel-back rp-carousel-back">Back</button>',
      '</div>',
      '<div class="rp-stage-copy">',
      '<p class="rp-stage-eyebrow">' + escapeHtml(card.eyebrow) + '</p>',
      '<h3 class="rp-stage-title">' + escapeHtml(card.title) + '</h3>',
      '<p class="rp-stage-description">' + escapeHtml(card.short) + '</p>',
      '<form class="rp-stage-form rp-carousel-capture-form" autocomplete="on" novalidate>',
      '<input class="rp-hp" name="company_website" tabindex="-1" autocomplete="off" />',
      renderCarouselCardFields(card),
      '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Full name</span><input class="rp-input" name="name" type="text" placeholder="Jane Doe" autocomplete="name" required /></div><div class="rp-field"><span class="rp-label">Email</span><input class="rp-input" name="email" type="email" placeholder="jane@company.com" autocomplete="email" required /></div></div>',
      '<div class="rp-field"><span class="rp-label">WhatsApp</span><div class="rp-phone"><span class="rp-phone-prefix"><span>WA</span></span><input name="phone" type="tel" placeholder="+971 50 123 4567" autocomplete="tel" required /></div></div>',
      renderConsentFields(),
      '<div class="rp-stage-actions"><button class="rp-button rp-carousel-capture-submit" type="submit"><span class="rp-button-text">' + escapeHtml(card.cta || "Continue") + '</span><svg class="rp-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>',
      '</form>',
      '<div class="rp-error rp-carousel-capture-error" hidden><span class="rp-ic">!</span><span class="rp-msg"></span></div>',
      '</div>',
      '</div>',
      '</div>',
    ].join("");
  }

  function renderCarouselCardFields(card) {
    var bedrooms = ROOM_OPTIONS.map(function (room, index) {
      return '<option value="' + escapeAttribute(room) + '"' + (index === 1 ? ' selected' : '') + '>' + escapeHtml(room) + '</option>';
    }).join("");
    if (card.id === "golden_visa") {
      return [
        '<div class="rp-field"><span class="rp-label">Property value or buying budget (AED)</span><input class="rp-input" name="property_value_aed" type="number" min="100000" step="50000" placeholder="e.g. 2,000,000" required /></div>',
        '<div class="rp-field"><span class="rp-label">Stage</span><div class="rp-select-wrap"><select class="rp-select" name="purchase_stage" required><option value="own_property">I own a property</option><option value="buying">I am buying</option><option value="researching" selected>I am researching</option></select></div></div>',
      ].join("");
    }
    if (card.id === "net_yield") {
      return [
        '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Dubai zone</span><input class="rp-input" name="zone" type="text" placeholder="Dubai Marina" required /></div><div class="rp-field"><span class="rp-label">Property value (AED)</span><input class="rp-input" name="property_value_aed" type="number" min="100000" step="50000" placeholder="e.g. 1,800,000" required /></div></div>',
        '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Annual rent (AED)</span><input class="rp-input" name="annual_rent_aed" type="number" min="10000" step="5000" placeholder="e.g. 120,000" required /></div><div class="rp-field"><span class="rp-label">Service charges (AED/year)</span><input class="rp-input" name="service_charges_aed" type="number" min="0" step="1000" placeholder="e.g. 18,000" /></div></div>',
        '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Vacancy (%)</span><input class="rp-input" name="vacancy_pct" type="number" min="0" max="30" step="0.5" value="5" required /></div><div class="rp-field"><span class="rp-label">Maintenance (%)</span><input class="rp-input" name="maintenance_pct" type="number" min="0" max="10" step="0.5" value="1.5" required /></div></div>',
      ].join("");
    }
    if (card.id === "offplan_payment") {
      return [
        '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Property price (AED)</span><input class="rp-input" name="property_price_aed" type="number" min="100000" step="50000" placeholder="e.g. 2,200,000" required /></div><div class="rp-field"><span class="rp-label">Down payment (%)</span><input class="rp-input" name="down_payment_pct" type="number" min="0" max="90" step="1" value="20" required /></div></div>',
        '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">During construction (%)</span><input class="rp-input" name="construction_payment_pct" type="number" min="0" max="100" step="1" value="40" required /></div><div class="rp-field"><span class="rp-label">Post-handover years</span><input class="rp-input" name="post_handover_years" type="number" min="1" max="10" step="1" value="4" required /></div></div>',
        '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Expected annual rent (AED)</span><input class="rp-input" name="annual_rent_aed" type="number" min="0" step="5000" placeholder="e.g. 140,000" required /></div><div class="rp-field"><span class="rp-label">Handover in years</span><input class="rp-input" name="handover_years" type="number" min="0.5" max="8" step="0.5" value="2" required /></div></div>',
      ].join("");
    }
    return [
      '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Dubai zone or building</span><input class="rp-input" name="zone" type="text" placeholder="Dubai Marina" required /></div><div class="rp-field"><span class="rp-label">Bedrooms</span><div class="rp-select-wrap"><select class="rp-select" name="rooms" required>' + bedrooms + '</select></div></div></div>',
      '<div class="rp-grid-2"><div class="rp-field"><span class="rp-label">Area (m2)</span><input class="rp-input" name="area_m2" type="number" min="20" max="2000" step="1" placeholder="e.g. 75" required /></div><div class="rp-field"><span class="rp-label">Property type</span><div class="rp-select-wrap"><select class="rp-select" name="property_type" required><option value="Apartment" selected>Apartment</option><option value="Villa">Villa</option><option value="Townhouse">Townhouse</option><option value="Penthouse">Penthouse</option></select></div></div></div>',
    ].join("");
  }

  function createCarouselInner(config) {
    var cards = getCarouselCards(config);
    var bg = sanitizeUrl(config.bannerImage || "") || DEFAULT_BANNER_BG;
    var logo = sanitizeUrl(config.agencyLogo || "");
    var brandLabel = escapeHtml(config.agencyLabel || "Dubai agency");
    var headline = escapeHtml(config.title || config.bannerTitle || "Choose the right property move.");
    var logoHtml = logo ? '<img class="rp-carousel-logo" src="' + escapeAttribute(logo) + '" alt="" loading="lazy" />' : '<img class="rp-carousel-logo" src="https://fonatprop.com/brand/fonatprop-mark.webp" alt="" loading="lazy" />';

    return [
      '<div class="rp-carousel-body rp-carousel-single">',
      '<div class="rp-carousel-topline"><span class="rp-carousel-kicker">Swipe the widget</span><div class="rp-carousel-nav"><button type="button" class="rp-carousel-prev" aria-label="Previous widget">&lsaquo;</button><button type="button" class="rp-carousel-next" aria-label="Next widget">&rsaquo;</button></div></div>',
      '<div class="rp-carousel-stage">',
      '<div class="rp-carousel-track" role="list">',
      cards.map(function (card, index) {
        var cardBg = sanitizeUrl(card.image || "") || bg;
        var cardPosition = escapeAttribute(card.imagePosition || "center");
        return '<div class="rp-tool-card rp-widget-slide' + (index === 0 ? ' rp-selected' : '') + '" data-card-id="' + card.id + '" role="listitem" tabindex="0" aria-label="' + escapeAttribute(card.title) + '" style="--rp-slide-bg:url(\'' + escapeAttribute(cardBg) + '\');--rp-slide-pos:' + cardPosition + '">' +
          '<span class="rp-slide-bg"></span>' +
          '<span class="rp-slide-shade"></span>' +
          '<span class="rp-slide-watermark">' + logoHtml + '<span>' + brandLabel + '</span></span>' +
          '<span class="rp-tool-eyebrow">' + escapeHtml(card.eyebrow) + '</span>' +
          '<span class="rp-tool-title">' + escapeHtml(card.title) + '</span>' +
          '<span class="rp-tool-short">' + escapeHtml(card.short) + '</span>' +
          '<button type="button" class="rp-slide-cta">' + escapeHtml(card.cta || "Start") + '</button>' +
          '</div>';
      }).join(""),
      '</div>',
      '<div class="rp-carousel-panels">',
      '<section class="rp-card-step rp-carousel-form"></section>',
      '<section class="rp-card-step rp-carousel-result"></section>',
      '</div>',
      '</div>',
      '<div class="rp-carousel-dots">' + cards.map(function (_, index) {
        return '<span class="rp-carousel-dot' + (index === 0 ? ' rp-active' : '') + '"></span>';
      }).join("") + '</div>',
      '<div class="rp-powered">',
      '<a class="rp-powered-brand" href="https://fonatprop.com" target="_blank" rel="noopener"><img class="rp-powered-logo" src="https://fonatprop.com/brand/fonatprop-mark.webp" alt="FonatProp" loading="lazy" />Powered by FonatProp</a>',
      '<span class="rp-powered-secure">Secure handoff</span>',
      '</div>',
    ].join("");
  }

  function numberFromForm(value) {
    var number = Number(String(value || "").replace(/[^\d.-]/g, ""));
    return isFinite(number) ? number : 0;
  }

  function clampScore(value) {
    return Math.max(20, Math.min(96, Math.round(value)));
  }

  function scoreBand(score) {
    if (score >= 82) return "Hot";
    if (score >= 65) return "Qualified";
    return "Early";
  }

  function calculateLeadScore(card, answers, lead, result) {
    var score = 42;
    if (lead && lead.name) score += 8;
    if (lead && lead.email) score += 8;
    if (lead && lead.phone) score += 12;

    if (card.id === "valuation") {
      if (answers.zone) score += 8;
      if (numberFromForm(answers.area_m2) >= 45) score += 8;
      if (/villa|townhouse|penthouse/i.test(answers.property_type || "")) score += 6;
      return clampScore(score + 8);
    }

    if (card.id === "golden_visa") {
      var value = numberFromForm(answers.property_value_aed);
      if (value >= 2000000) score += 36;
      else if (value >= 750000) score += 24;
      else if (value >= 450000) score += 12;
      if (answers.purchase_stage === "buying" || answers.purchase_stage === "own_property") score += 8;
      return clampScore(score);
    }

    if (card.id === "net_yield") {
      var propertyValue = numberFromForm(answers.property_value_aed);
      var annualRent = numberFromForm(answers.annual_rent_aed);
      var yieldText = result && result.value ? parseFloat(String(result.value).replace("%", "")) : 0;
      if (answers.zone) score += 7;
      if (propertyValue >= 1000000) score += 10;
      if (annualRent >= 70000) score += 8;
      if (yieldText >= 6) score += 12;
      else if (yieldText >= 4) score += 7;
      return clampScore(score);
    }

    if (card.id === "offplan_payment") {
      var price = numberFromForm(answers.property_price_aed);
      var cover = result && result.rental_cover_pct ? Number(result.rental_cover_pct) : 0;
      if (price >= 1200000) score += 10;
      if (numberFromForm(answers.down_payment_pct) >= 15) score += 8;
      if (cover >= 60) score += 12;
      else if (cover >= 35) score += 7;
      return clampScore(score);
    }

    return clampScore(score);
  }

  function calculateStaticCardResult(card, answers) {
    if (card.id === "valuation") {
      var area = numberFromForm(answers.area_m2);
      var rooms = answers.rooms || "property";
      var zone = answers.zone || "Dubai";
      return {
        headline: "Valuation handoff ready",
        value: "Private broker range",
        detail: "Your " + rooms + " in " + zone + (area ? " (" + area + " m2)" : "") + " was saved with the agency. They can send the valuation context by WhatsApp or email.",
      };
    }
    if (card.id === "golden_visa") {
      var value = numberFromForm(answers.property_value_aed);
      var status = value >= 2000000
        ? "Golden Visa threshold likely reached"
        : value >= 750000
          ? "Investor residence threshold likely reached"
          : "Below the main property thresholds";
      var next = value >= 2000000
        ? "The AED 2M property-investor level is the key Golden Visa signal. A broker should verify title, mortgage status and current rules before advising."
        : value >= 750000
          ? "This is a useful investor-residence signal, but not the AED 2M Golden Visa level. A broker should qualify the route before recommending properties."
          : "The buyer may need a different budget, joint structure or property strategy before this becomes a visa-led purchase.";
      return { headline: status, value: currencyCompact(value), detail: next + " This is a preliminary eligibility signal, not legal or immigration advice." };
    }
    if (card.id === "net_yield") {
      var propertyValue = numberFromForm(answers.property_value_aed);
      var annualRent = numberFromForm(answers.annual_rent_aed);
      var serviceCharges = numberFromForm(answers.service_charges_aed);
      var vacancyPct = Math.max(0, Math.min(30, numberFromForm(answers.vacancy_pct) || 5));
      var maintenancePct = Math.max(0, Math.min(10, numberFromForm(answers.maintenance_pct) || 1.5));
      var vacancyLoss = annualRent * (vacancyPct / 100);
      var maintenance = annualRent * (maintenancePct / 100);
      var netRent = Math.max(0, annualRent - serviceCharges - vacancyLoss - maintenance);
      var yieldPct = propertyValue > 0 ? (netRent / propertyValue) * 100 : 0;
      return {
        headline: "First-pass net yield",
        value: yieldPct.toFixed(1) + "%",
        net_rent_aed: Math.round(netRent),
        detail: "Net rent after service charges, vacancy and maintenance assumptions: " + currencyCompact(netRent) + ". The broker should verify live rents, building fees and occupancy before advising.",
      };
    }
    if (card.id === "offplan_payment") {
      var price = numberFromForm(answers.property_price_aed);
      var downPct = numberFromForm(answers.down_payment_pct);
      var constructionPct = numberFromForm(answers.construction_payment_pct);
      var years = Math.max(1, numberFromForm(answers.post_handover_years));
      var annual = numberFromForm(answers.annual_rent_aed);
      var dueBeforeHandover = Math.max(0, price * ((downPct + constructionPct) / 100));
      var postHandoverBalance = Math.max(0, price - dueBeforeHandover);
      var monthly = postHandoverBalance / (years * 12);
      var rentalCover = monthly > 0 ? (annual / 12 / monthly) * 100 : 0;
      return {
        headline: rentalCover >= 70 ? "Strong rent-cover signal" : rentalCover >= 35 ? "Needs broker review" : "High cash-flow pressure",
        value: Math.round(rentalCover) + "% rent cover",
        rental_cover_pct: Math.round(rentalCover),
        detail: "Cash due before handover: " + currencyCompact(dueBeforeHandover) + ". Estimated post-handover monthly installment: " + currencyCompact(monthly) + ". The broker should review developer risk, handover timing and rent assumptions.",
      };
    }
    return { headline: "Broker context saved", value: "Ready", detail: card.benefit };
  }

  function createTemplate(config) {
    var svgSparkle = '<svg class="rp-fab-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="currentColor" opacity=".95"/></svg>';

    if (config.mode === "banner") {
      var bg = config.bannerImage || DEFAULT_BANNER_BG;
      var bannerImages = normalizeImageList(config.bannerImages);
      if (!bannerImages.length) bannerImages = [bg];
      if (bannerImages.indexOf(bg) === -1) bannerImages.unshift(bg);
      return (
        '<div class="' + shellClass(config, "rp-banner-shell") + '"' + shellStyle(config) + '>' +
        '<div class="rp-banner">' +
        bannerImages.slice(0, 6).map(function (image, index) {
          return '<span class="rp-banner-bg' + (index === 0 ? " rp-active" : "") + '" data-bg-index="' + index + '" style="background-image:url(\'' + escapeAttribute(image) + '\')"></span>';
        }).join("") +
        '<div class="rp-banner-overlay"></div>' +
        '<div class="rp-banner-content">' +
        createBannerInner(config) +
        '</div>' +
        '<a class="rp-banner-watermark" href="https://fonatprop.com" target="_blank" rel="noopener">Powered by FonatProp</a>' +
        '</div>' +
        '</div>'
      );
    }

    var isCarousel = normalizeWidgetMode(config.widgetMode) === "carousel";
    var cardInner = isCarousel ? createCarouselInner(config) : createCardInner();
    var cardClass = isCarousel ? "rp-card rp-carousel-card" : "rp-card";
    var fabLabel = isCarousel ? "Explore property tools" : "Valuate my property";
    var inlineClass = config.mode === "inline"
      ? (isCarousel ? "rp-inline rp-inline-carousel" : "rp-inline")
      : "";

    return (
      '<div class="' + shellClass(config, inlineClass) + '"' + shellStyle(config) + '>' +
      (config.mode === "inline"
        ? '<div class="' + cardClass + '">' + cardInner + '</div>'
        : '<button type="button" class="rp-fab">' + svgSparkle + '<span>' +
            fabLabel +
          '</span></button>' +
          '<div class="rp-overlay"></div>' +
          '<div class="' + (config.mode === "drawer" ? "rp-drawer-panel" : "rp-modal") + '">' +
          '<div class="' + cardClass + '">' +
          '<button type="button" class="rp-close" aria-label="Close widget">×</button>' +
          cardInner +
          '</div></div>') +
      '</div>'
    );
  }

  // ── Banner mount (hero → lead capture → general benchmark) ─
  function mountBanner(shadowRoot, config) {
    var heroStep = shadowRoot.querySelector(".rp-banner-hero");
    var leadStep = shadowRoot.querySelector(".rp-banner-lead");
    var resultStep = shadowRoot.querySelector(".rp-banner-result");
    var ctaButton = shadowRoot.querySelector(".rp-banner-cta");
    var leadForm = shadowRoot.querySelector(".rp-banner-lead-form");
    var leadSubmit = shadowRoot.querySelector(".rp-banner-lead-submit");
    var leadError = shadowRoot.querySelector(".rp-banner-lead-error");
    var nameInput = leadForm.querySelector('input[name="name"]');
    var emailInput = leadForm.querySelector('input[name="email"]');
    var phoneInput = leadForm.querySelector('input[name="phone"]');
    var intentInput = leadForm.querySelector('select[name="intent"]');
    var timelineInput = leadForm.querySelector('select[name="timeline"]');
    var consentInput = leadForm.querySelector('input[name="consent"]');
    var marketingInput = leadForm.querySelector('input[name="consent_marketing"]');
    var whatsappLink = shadowRoot.querySelector(".rp-banner-whatsapp");
    var emailLink = shadowRoot.querySelector(".rp-banner-email");
    var backgroundLayers = Array.prototype.slice.call(shadowRoot.querySelectorAll(".rp-banner-bg"));
    var backgroundIndex = 0;
    var backgroundTimer = null;

    function startBackgroundRotation() {
      if (backgroundLayers.length < 2) return;
      try {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      } catch (_) {}
      backgroundTimer = window.setInterval(function () {
        backgroundLayers[backgroundIndex].classList.remove("rp-active");
        backgroundIndex = (backgroundIndex + 1) % backgroundLayers.length;
        backgroundLayers[backgroundIndex].classList.add("rp-active");
      }, 6200);
    }

    function showError(node, message) {
      if (!node) return;
      node.hidden = false;
      var msgEl = node.querySelector(".rp-msg");
      if (msgEl) msgEl.textContent = message; else node.textContent = message;
    }
    function hideError(node) {
      if (!node) return;
      node.hidden = true;
      var msgEl = node.querySelector(".rp-msg");
      if (msgEl) msgEl.textContent = "";
    }
    function setLoading(button, loading, label) {
      if (!button) return;
      var text = button.querySelector(".rp-button-text");
      var arrow = button.querySelector(".rp-arrow");
      button.disabled = loading;
      if (!text) return;
      if (loading) {
        text.innerHTML = '<span class="rp-spinner"></span> ' + label;
        if (arrow) arrow.style.display = "none";
      } else {
        text.textContent = label;
        if (arrow) arrow.style.display = "";
      }
    }

    function switchTo(stepEl) {
      [heroStep, leadStep, resultStep].forEach(function (s) {
        if (s) s.classList.remove("rp-active");
      });
      if (stepEl) stepEl.classList.add("rp-active");
    }

    function isValidName(v) { return String(v || "").trim().length >= 2; }
    function isValidEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v || "").trim()); }
    function isValidPhone(v) { return isValidLeadPhone(v); }

    function updateContinueState() {
      var ok =
        isValidName(nameInput.value) &&
        (!emailInput.value.trim() || isValidEmail(emailInput.value)) &&
        isValidPhone(phoneInput.value) &&
        (!consentInput || consentInput.checked);
      leadSubmit.disabled = !ok;
    }

    if (ctaButton) {
      if (hasQuotaBlock(config)) {
        ctaButton.disabled = true;
        ctaButton.innerHTML = "Lead credits used";
        var quotaNote = document.createElement("div");
        quotaNote.className = "rp-quota-message";
        quotaNote.textContent = "This brokerage has used the included FonatProp lead credits for the current period. Please contact the agency directly for a valuation.";
        var ctaWrap = shadowRoot.querySelector(".rp-banner-cta-wrap");
        if (ctaWrap) ctaWrap.appendChild(quotaNote);
      }
      ctaButton.addEventListener("click", function () {
        if (hasQuotaBlock(config)) return;
        trackFunnelEvent(config, "widget_open", { mode: "banner" });
        trackFunnelEvent(config, "widget_start", { mode: "banner", step: "lead_form" });
        switchTo(leadStep);
        // focus first field after the transition
        setTimeout(function () { try { nameInput.focus(); } catch (_) {} }, 250);
      });
    }

    [nameInput, emailInput, phoneInput, intentInput, timelineInput, consentInput, marketingInput].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", function () {
        hideError(leadError);
        updateContinueState();
      });
      el.addEventListener("change", function () {
        hideError(leadError);
        updateContinueState();
      });
    });
    updateContinueState();

    var leadState = { name: "", email: "", phone: "", intent: "", timeline: "" };

    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();
      hideError(leadError);
      if (hasQuotaBlock(config)) {
        showError(leadError, "This agency has used the included FonatProp lead credits for this period. Please contact the agent directly.");
        return;
      }
      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var phone = phoneInput.value.trim();
      var honeypot = String(new FormData(leadForm).get("company_website") || "").trim();
      var intent = intentInput ? intentInput.value : "value_sell";
      var timeline = timelineInput ? timelineInput.value : "now";
      var consent = Boolean(consentInput && consentInput.checked);
      var consentPayload = buildConsentPayload(marketingInput && marketingInput.checked);

      if (honeypot) return;
      if (!isValidName(name) || (email && !isValidEmail(email)) || !isValidPhone(phone) || !consent) {
        showError(leadError, "Please add your name, WhatsApp and consent to process this request. Email is optional, but must be valid if used.");
        return;
      }

      var fullPhone = normalizeLeadPhone(phone);
      leadState = { name: name, email: email, phone: fullPhone, intent: intent, timeline: timeline, consent: consentPayload };
      var campaign = readCampaignContext();

      trackFunnelEvent(config, "lead_submit", {
        mode: "banner",
        intent: intent,
        timeline: timeline,
      });
      setLoading(leadSubmit, true, "Saving…");
      sendWebhook(config.leadWebhook, {
        event: "banner_lead_captured",
        market: "dubai",
        source: "public-widget",
        section: "widget_banner",
        agency_id: config.agencyId,
        card_id: "valuation",
        card_title: "Property valuation",
        page_url: campaign.page_url,
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content,
        utm_term: campaign.utm_term,
        agent_email: config.agentEmail,
        agent_phone: config.agentPhone,
        name: name, email: email, phone: fullPhone,
        intent: intent,
        timeline: timeline,
        agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
        consent_privacy: consentPayload.consent_privacy,
        consent_contact: consentPayload.consent_contact,
        consent_whatsapp: consentPayload.consent_whatsapp,
        consent_marketing: consentPayload.consent_marketing,
        consent_text: consentPayload.consent_text,
        consent_at: consentPayload.consent_at,
        privacy_version: consentPayload.privacy_version,
        consent: consentPayload.consent,
        property: {
          card_id: "valuation",
          card_title: "Property valuation",
        },
        snapshot: {
          funnel_session_id: getSessionId(config),
          widget_mode: "banner",
          card_id: "valuation",
          card_title: "Property valuation",
          page_url: campaign.page_url,
          referrer: campaign.referrer,
          utm_source: campaign.utm_source,
          utm_medium: campaign.utm_medium,
          utm_campaign: campaign.utm_campaign,
          utm_content: campaign.utm_content,
          utm_term: campaign.utm_term,
          intent: intent,
          timeline: timeline,
          agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
          consent_privacy: consentPayload.consent_privacy,
          consent_contact: consentPayload.consent_contact,
          consent_whatsapp: consentPayload.consent_whatsapp,
          consent_marketing: consentPayload.consent_marketing,
          consent_text: consentPayload.consent_text,
          consent_at: consentPayload.consent_at,
          privacy_version: consentPayload.privacy_version,
          consent: consentPayload.consent,
        },
        timestamp: new Date().toISOString(),
      }, config).then(function () {
        trackFunnelEvent(config, "lead_captured", {
          mode: "banner",
          card_id: "valuation",
          card_title: "Property valuation",
          intent: intent,
          timeline: timeline,
        });
        switchTo(resultStep);
      }).catch(function (error) {
        console.error("[FonatProp Widget] banner lead save failed", error);
        showError(leadError, "We could not save your request. Please try again or contact the agency directly.");
      }).finally(function () {
        setLoading(leadSubmit, false, "Continue");
      });
    });

    // ── Step 2: address-based general estimate ─────────────────
    var addressForm = shadowRoot.querySelector(".rp-banner-address-form");
    var addressInput = addressForm.querySelector('input[name="address"]');
    var roomsSelect = addressForm.querySelector('select[name="rooms"]');
    var areaInput = addressForm.querySelector('input[name="area_m2"]');
    var askingPriceInput = addressForm.querySelector('input[name="asking_price_aed"]');
    var addressSubmit = shadowRoot.querySelector(".rp-banner-address-submit");
    var addressError = shadowRoot.querySelector(".rp-banner-address-error");
    var estimateBox = shadowRoot.querySelector(".rp-banner-estimate");
    var rangeLoEl = shadowRoot.querySelector(".rp-banner-range-lo");
    var rangeHiEl = shadowRoot.querySelector(".rp-banner-range-hi");

    function isValidAddress(v) {
      var text = String(v || "").trim();
      if (text.length < 6) return false;
      if (/\b(bridge|station|metro|airport|tram|bus station|train station|subway|monorail)\b/i.test(text)) return false;
      if (/\d/.test(text)) return true;
      if (/\b(street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|circle|way|tower|residence|residences|building|villa|apartment|unit|phase|block)\b/i.test(text)) return true;
      var normalized = text.toLowerCase().replace(/[^a-z0-9,]+/g, " ").trim();
      var parts = normalized.split(",").map(function (part) { return part.trim(); }).filter(Boolean);
      var words = normalized.split(/\s+/).filter(Boolean);
      return parts.length >= 2 && words.length >= 4;
    }
    function isValidArea(v) { var n = Number(v); return isFinite(n) && n >= 20 && n <= 2000; }
    function updateAddressSubmit() {
      addressSubmit.disabled = !(
        isValidAddress(addressInput.value) &&
        roomsSelect.value &&
        isValidArea(areaInput.value)
      );
    }
    [addressInput, areaInput, askingPriceInput].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", function () {
        hideError(addressError);
        updateAddressSubmit();
      });
    });
    roomsSelect.addEventListener("change", function () {
      hideError(addressError);
      updateAddressSubmit();
    });
    updateAddressSubmit();

    function wireAgentLinks(name, address, rangeText) {
      if (config.agentPhone && whatsappLink) {
        var waText = "Hi, I'm " + name + ". I just used the property valuation widget on your website. " +
          (leadState.intent ? "Intent: " + leadState.intent.replace(/_/g, " ") + ". " : "") +
          (leadState.timeline ? "Timeline: " + leadState.timeline.replace(/_/g, " ") + ". " : "") +
          (address ? "Address: " + address + ". " : "") +
          "Could you review it and send me the valuation context?";
        whatsappLink.href = "https://wa.me/" + sanitizePhone(config.agentPhone) + "?text=" + encodeURIComponent(waText);
      } else if (whatsappLink) { whatsappLink.href = "#"; }

      if (config.agentEmail && emailLink) {
        var subj = encodeURIComponent("Property valuation request — " + (address || "Dubai"));
        var body = encodeURIComponent(
          "Hello,\n\nI used the FonatProp widget and would like the broker valuation context.\n\n" +
          "Name: " + leadState.name + "\nEmail: " + leadState.email + "\nPhone: " + leadState.phone + "\n" +
          (leadState.intent ? "Intent: " + leadState.intent.replace(/_/g, " ") + "\n" : "") +
          (leadState.timeline ? "Timeline: " + leadState.timeline.replace(/_/g, " ") + "\n" : "") +
          (address ? "Address: " + address + "\n" : "") +
          "The AI range is saved privately in FonatProp for the agency.\n"
        );
        emailLink.href = "mailto:" + config.agentEmail + "?subject=" + subj + "&body=" + body;
      } else if (emailLink) { emailLink.href = "#"; }
    }

    addressForm.addEventListener("submit", function (event) {
      event.preventDefault();
      hideError(addressError);
      estimateBox.hidden = true;

      var address = addressInput.value.trim();
      var rooms = (roomsSelect.value || "1 BR").trim();
      var areaM2 = Number(areaInput.value);
      var askingPriceAed = askingPriceInput ? Number(askingPriceInput.value) : NaN;

      if (!isValidAddress(address)) { showError(addressError, "Use a real Dubai property address or residential building. Stations, bridges and generic landmarks are not supported."); return; }
      if (!isValidArea(areaM2)) { showError(addressError, "Please enter an area between 20 and 2000 m²."); return; }

      var apiRooms = rooms === "Studio" ? "Studio" : rooms.replace(" BR", " B/R");

      setLoading(addressSubmit, true, "Estimating…");

      var url = config.addressApiBase.replace(/\/$/, "") + "/predict-address";
      fetchWidgetJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address,
          building_name: address,
          zona: address,
          rooms: apiRooms,
          area_m2: areaM2,
        }),
      }, config)
        .then(function (r) {
          return r.json().then(function (data) { return { ok: r.ok, data: data }; });
        })
        .then(function (result) {
          if (!result.ok) {
            throw new Error((result.data && result.data.detail) || "We couldn't estimate this address.");
          }
          var predictedAed = Number(result.data && result.data.predicted_aed);
          if (!isFinite(predictedAed) || predictedAed <= 0) {
            throw new Error("Invalid response from valuation engine.");
          }

          // Public range stays broad, but tightens when the API returns stronger evidence.
          var reliability = result.data && result.data.reliability ? Number(result.data.reliability.score || result.data.reliability.ai_score) : 0;
          var loFactor = reliability >= 80 ? 0.82 : reliability >= 65 ? 0.75 : 0.65;
          var hiFactor = reliability >= 80 ? 1.18 : reliability >= 65 ? 1.25 : 1.35;
          var lo = predictedAed * loFactor;
          var hi = predictedAed * hiFactor;
          var rangeText = currencyCompact(lo) + " – " + currencyCompact(hi);

          if (rangeLoEl) rangeLoEl.textContent = "";
          if (rangeHiEl) rangeHiEl.textContent = "";
          estimateBox.hidden = false;

          wireAgentLinks(leadState.name, address, rangeText);
          trackFunnelEvent(config, "valuation_completed", {
            mode: "banner",
            rooms: rooms,
            area_m2: areaM2,
            has_address: Boolean(address),
          });

          var savedConsent = leadState.consent || buildConsentPayload(false);
          // Send the enriched lead (now including the address + estimate) to the agency
          sendWebhook(config.leadWebhook, {
            event: "banner_address_estimate",
            market: "dubai",
            source: "public-widget",
            agency_id: config.agencyId,
            section: "widget_banner",
            agent_email: config.agentEmail,
            agent_phone: config.agentPhone,
            name: leadState.name,
            email: leadState.email,
            phone: leadState.phone,
            intent: leadState.intent,
            timeline: leadState.timeline,
            address: address,
            rooms: rooms,
            area_m2: areaM2,
            asking_price_aed: isFinite(askingPriceAed) && askingPriceAed > 0 ? Math.round(askingPriceAed) : null,
            estimated_range: rangeText,
            estimated_low_aed: Math.round(lo),
            estimated_high_aed: Math.round(hi),
            card_id: "valuation",
            card_title: "Property valuation",
            agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
            consent_privacy: savedConsent.consent_privacy,
            consent_contact: savedConsent.consent_contact,
            consent_whatsapp: savedConsent.consent_whatsapp,
            consent_marketing: savedConsent.consent_marketing,
            consent_text: savedConsent.consent_text,
            consent_at: savedConsent.consent_at,
            privacy_version: savedConsent.privacy_version,
            consent: savedConsent.consent,
            lead_score: clampScore(72 + (reliability >= 80 ? 10 : reliability >= 65 ? 5 : 0)),
            raw_prediction: result.data,
            snapshot: {
              funnel_session_id: getSessionId(config),
              widget_mode: "banner",
              card_id: "valuation",
              card_title: "Property valuation",
              address: address,
              rooms: rooms,
              area_m2: areaM2,
              intent: leadState.intent,
              timeline: leadState.timeline,
              agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
              consent_privacy: savedConsent.consent_privacy,
              consent_contact: savedConsent.consent_contact,
              consent_whatsapp: savedConsent.consent_whatsapp,
              consent_marketing: savedConsent.consent_marketing,
              consent_text: savedConsent.consent_text,
              consent_at: savedConsent.consent_at,
              privacy_version: savedConsent.privacy_version,
              consent: savedConsent.consent,
            },
            timestamp: new Date().toISOString(),
          }, config).catch(function (saveError) {
            console.error("[FonatProp Widget] enriched valuation handoff failed", saveError);
          });
        })
        .catch(function (error) {
          console.error("[FonatProp Widget] address estimate failed", error);
          showError(addressError, error.message || "We couldn't estimate this address right now. Please contact the agent.");
          // Still expose the agent links so the user can reach out
          wireAgentLinks(leadState.name, address, "");
          estimateBox.hidden = true;
        })
        .finally(function () {
          setLoading(addressSubmit, false, "Prepare broker context");
        });
    });

    if (whatsappLink) {
      whatsappLink.addEventListener("click", function () {
        trackFunnelEvent(config, "broker_contacted", { mode: "banner", channel: "whatsapp" });
      });
    }
    if (emailLink) {
      emailLink.addEventListener("click", function () {
        trackFunnelEvent(config, "broker_contacted", { mode: "banner", channel: "email" });
      });
    }

    startBackgroundRotation();
  }

  // ── Mount ─────────────────────────────────────────────────
  function mountCarousel(shadowRoot, config) {
    var cards = getCarouselCards(config);
    var track = shadowRoot.querySelector(".rp-carousel-track");
    var realButtons = Array.prototype.slice.call(shadowRoot.querySelectorAll(".rp-tool-card"));
    var dots = Array.prototype.slice.call(shadowRoot.querySelectorAll(".rp-carousel-dot"));
    var prevButton = shadowRoot.querySelector(".rp-carousel-prev");
    var nextButton = shadowRoot.querySelector(".rp-carousel-next");
    var panels = shadowRoot.querySelector(".rp-carousel-panels");
    var formStep = shadowRoot.querySelector(".rp-carousel-form");
    var resultStep = shadowRoot.querySelector(".rp-carousel-result");
    var state = { card: cards[0], lead: null, result: null, answers: {} };
    var autoplayTimer = null;
    var autoplayLockedByUser = false;
    var slides = realButtons;
    var activeTrackIndex = 0;
    var dragStartX = null;
    var dragStartY = null;
    var dragCurrentX = null;
    var dragDeltaX = 0;
    var dragDeltaY = 0;
    var dragSuppressedClick = false;
    var isDragging = false;
    var wheelLocked = false;

    function cardById(id) {
      for (var i = 0; i < cards.length; i += 1) if (cards[i].id === id) return cards[i];
      return cards[0];
    }
    function showStep(name) {
      if (formStep) formStep.classList.toggle("rp-active", name === "form");
      if (resultStep) resultStep.classList.toggle("rp-active", name === "result");
    }
    function openPanel(stepName) {
      if (panels) panels.classList.add("rp-panel-open");
      if (track) track.classList.add("rp-stage-hidden");
      showStep(stepName);
    }
    function closePanel() {
      if (panels) panels.classList.remove("rp-panel-open");
      if (track) track.classList.remove("rp-stage-hidden");
      showStep("");
    }
    function showError(node, message) {
      if (!node) return;
      node.hidden = false;
      var msgEl = node.querySelector(".rp-msg");
      if (msgEl) msgEl.textContent = message; else node.textContent = message;
    }
    function hideError(node) {
      if (!node) return;
      node.hidden = true;
      var msgEl = node.querySelector(".rp-msg");
      if (msgEl) msgEl.textContent = "";
    }
    function setLoading(button, loading, label) {
      if (!button) return;
      var text = button.querySelector(".rp-button-text");
      var arrow = button.querySelector(".rp-arrow");
      button.disabled = loading;
      if (!text) return;
      if (loading) {
        text.innerHTML = '<span class="rp-spinner"></span> ' + label;
        if (arrow) arrow.style.display = "none";
      } else {
        text.textContent = label;
        if (arrow) arrow.style.display = "";
      }
    }
    function formToObject(form) {
      var fd = new FormData(form);
      var out = {};
      fd.forEach(function (value, key) { out[key] = String(value || "").trim(); });
      return out;
    }
    function selectedIndex() {
      for (var i = 0; i < cards.length; i += 1) if (cards[i].id === state.card.id) return i;
      return 0;
    }
    function syncSelectedVisuals() {
      var logicalIndex = selectedIndex();
      slides.forEach(function (button, buttonIndex) {
        button.classList.toggle("rp-selected", buttonIndex === logicalIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("rp-active", dotIndex === logicalIndex);
      });
    }
    function setTrackTransform(deltaPx) {
      if (!track) return;
      var offset = "calc(" + (-activeTrackIndex * 100) + "% + " + (deltaPx || 0) + "px)";
      track.style.transform = "translate3d(" + offset + ",0,0)";
    }
    function applyTrackPosition(animated) {
      if (!track) return;
      if (animated) track.classList.add("rp-track-animated");
      else track.classList.remove("rp-track-animated");
      setTrackTransform(0);
      syncSelectedVisuals();
    }
    function selectCard(cardId, options) {
      state.card = cardById(cardId);
      activeTrackIndex = selectedIndex();
      state.lead = null;
      state.result = null;
      state.answers = {};
      applyTrackPosition(false);
      syncSelectedVisuals();
      if (!(options && options.keepPanel)) closePanel();
    }
    function move(delta) {
      if (cards.length < 2 || !track) return;
      activeTrackIndex = (activeTrackIndex + delta + cards.length) % cards.length;
      state.card = cards[activeTrackIndex];
      state.lead = null;
      state.result = null;
      state.answers = {};
      applyTrackPosition(true);
      syncSelectedVisuals();
      closePanel();
    }
    function activateSlide(button) {
      if (!button) return;
      var cardId = button.getAttribute("data-card-id");
      activeTrackIndex = slides.indexOf(button);
      selectCard(cardId, { keepPanel: true });
      renderLeadCapture();
      openPanel("form");
      trackFunnelEvent(config, "widget_start", { mode: config.mode, widget_mode: "carousel", card_id: state.card.id, card_title: state.card.title });
    }
    function startAutoplay() {
      if (autoplayLockedByUser || autoplayTimer || cards.length < 2) return;
      autoplayTimer = window.setInterval(function () {
        if (panels && panels.classList.contains("rp-panel-open")) return;
        move(1);
      }, 5200);
    }
    function clearAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }
    function stopAutoplayForever() {
      autoplayLockedByUser = true;
      clearAutoplay();
    }
    function extractCardAnswers(card, raw) {
      if (card.id === "golden_visa") {
        return {
          property_value_aed: raw.property_value_aed || "",
          purchase_stage: raw.purchase_stage || "",
        };
      }
      if (card.id === "net_yield") {
        return {
          zone: raw.zone || "",
          property_value_aed: raw.property_value_aed || "",
          annual_rent_aed: raw.annual_rent_aed || "",
          annual_costs_pct: raw.annual_costs_pct || "",
          service_charges_aed: raw.service_charges_aed || "",
          vacancy_pct: raw.vacancy_pct || "",
          maintenance_pct: raw.maintenance_pct || "",
        };
      }
      if (card.id === "offplan_payment") {
        return {
          property_price_aed: raw.property_price_aed || "",
          down_payment_pct: raw.down_payment_pct || "",
          construction_payment_pct: raw.construction_payment_pct || "",
          post_handover_years: raw.post_handover_years || "",
          annual_rent_aed: raw.annual_rent_aed || "",
          handover_years: raw.handover_years || "",
        };
      }
      return {
        zone: raw.zone || "",
        rooms: raw.rooms || "",
        area_m2: raw.area_m2 || "",
        property_type: raw.property_type || "",
      };
    }
    function validateCardAnswers(card, answers) {
      if (card.id === "golden_visa") {
        if (numberFromForm(answers.property_value_aed) <= 0) return "Please add the property value or buying budget.";
        return "";
      }
      if (card.id === "net_yield") {
        if (!answers.zone) return "Please add the Dubai zone.";
        if (numberFromForm(answers.property_value_aed) <= 0) return "Please add the property value.";
        if (numberFromForm(answers.annual_rent_aed) <= 0) return "Please add the expected annual rent.";
        return "";
      }
      if (card.id === "offplan_payment") {
        if (numberFromForm(answers.property_price_aed) <= 0) return "Please add the property price.";
        if (numberFromForm(answers.construction_payment_pct) < 0 || numberFromForm(answers.construction_payment_pct) > 100) return "Please add a valid construction payment percentage.";
        if (numberFromForm(answers.post_handover_years) <= 0) return "Please add the post-handover period.";
        return "";
      }
      if (!answers.zone) return "Please add the Dubai zone or building.";
      if (numberFromForm(answers.area_m2) <= 0) return "Please add the property area.";
      return "";
    }
    function buildCardPropertySnapshot(card, answers) {
      var snapshot = {
        card_id: card.id,
        card_title: card.title,
      };
      Object.keys(answers || {}).forEach(function (key) {
        snapshot[key] = answers[key];
      });
      return snapshot;
    }
    function buildLeadPayload(result) {
      var campaign = readCampaignContext();
      var consentPayload = state.lead && state.lead.consent ? state.lead.consent : null;
      return {
        event: "lead_captured",
        market: "dubai",
        source: "public-widget",
        section: "widget_carousel",
        agency_id: config.agencyId,
        card_id: state.card.id,
        card_title: state.card.title,
        page_url: campaign.page_url,
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content,
        utm_term: campaign.utm_term,
        agent_email: config.agentEmail,
        agent_phone: config.agentPhone,
        name: state.lead.name,
        email: state.lead.email,
        phone: state.lead.phone,
        intent: state.card.intent,
        lead_score: result && result.lead_score ? result.lead_score : null,
        estimated_value: result && result.value ? result.value : "",
        agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
        consent_privacy: consentPayload ? consentPayload.consent_privacy : false,
        consent_contact: consentPayload ? consentPayload.consent_contact : false,
        consent_whatsapp: consentPayload ? consentPayload.consent_whatsapp : false,
        consent_marketing: consentPayload ? consentPayload.consent_marketing : false,
        consent_text: consentPayload ? consentPayload.consent_text : "",
        consent_at: consentPayload ? consentPayload.consent_at : "",
        privacy_version: consentPayload ? consentPayload.privacy_version : PRIVACY_VERSION,
        consent: consentPayload ? consentPayload.consent : null,
        property: buildCardPropertySnapshot(state.card, state.answers || {}),
        snapshot: {
          funnel_session_id: getSessionId(config),
          widget_mode: "carousel",
          card_id: state.card.id,
          card_title: state.card.title,
          lead_score: result && result.lead_score ? result.lead_score : null,
          lead_score_band: result && result.lead_score ? scoreBand(result.lead_score) : "",
          page_url: campaign.page_url,
          referrer: campaign.referrer,
          utm_source: campaign.utm_source,
          utm_medium: campaign.utm_medium,
          utm_campaign: campaign.utm_campaign,
          utm_content: campaign.utm_content,
          utm_term: campaign.utm_term,
          card_answers: state.answers || {},
          card_result: result || null,
          agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
          consent_privacy: consentPayload ? consentPayload.consent_privacy : false,
          consent_contact: consentPayload ? consentPayload.consent_contact : false,
          consent_whatsapp: consentPayload ? consentPayload.consent_whatsapp : false,
          consent_marketing: consentPayload ? consentPayload.consent_marketing : false,
          consent_text: consentPayload ? consentPayload.consent_text : "",
          consent_at: consentPayload ? consentPayload.consent_at : "",
          privacy_version: consentPayload ? consentPayload.privacy_version : PRIVACY_VERSION,
          consent: consentPayload ? consentPayload.consent : null,
        },
        timestamp: new Date().toISOString(),
      };
    }
    function showResult(result) {
      state.result = result;
      var contextText = "Hi, I'm " + state.lead.name + ". I just used the " + state.card.title + " tool on your website. Could you help me with the next step?";
      var waHref = config.agentPhone ? "https://wa.me/" + sanitizePhone(config.agentPhone) + "?text=" + encodeURIComponent(contextText) : "#";
      var emailHref = config.agentEmail
        ? "mailto:" + config.agentEmail + "?subject=" + encodeURIComponent("FonatProp request - " + state.card.title) + "&body=" + encodeURIComponent(contextText + "\n\nName: " + state.lead.name + "\nEmail: " + state.lead.email + "\nPhone: " + state.lead.phone + "\n")
        : "#";
      var logo = sanitizeUrl(config.agencyLogo || "");
      var logoHtml = logo
        ? '<img class="rp-carousel-logo" src="' + escapeAttribute(logo) + '" alt="" loading="lazy" />'
        : '<img class="rp-carousel-logo" src="https://fonatprop.com/brand/fonatprop-mark.webp" alt="" loading="lazy" />';
      var agencyLabel = escapeHtml(config.agencyLabel || "Dubai agency");
      var cardBg = sanitizeUrl(state.card.image || "") || DEFAULT_BANNER_BG;
      var cardPosition = escapeAttribute(state.card.imagePosition || "center");
      var actionText = config.agentPhone
        ? "Your lead was saved. You can continue on WhatsApp now, or the agency can follow up with the details you just shared."
        : "Your lead was saved. The agency can now contact you using the details you just shared.";
      var score = result.lead_score || 0;
      var scoreText = score ? scoreBand(score) + " lead (" + score + "/100)" : "Lead ready";
      resultStep.innerHTML = [
        '<div class="rp-stage-panel" style="--rp-stage-bg:url(\'' + escapeAttribute(cardBg) + '\');--rp-stage-pos:' + cardPosition + '">',
        '<div class="rp-stage-panel-inner">',
        '<div class="rp-stage-panel-top">',
        '<span class="rp-slide-watermark">' + logoHtml + '<span>' + agencyLabel + '</span></span>',
        '<button type="button" class="rp-stage-panel-back rp-carousel-reset">Back</button>',
        '</div>',
        '<div class="rp-stage-copy">',
        '<p class="rp-stage-eyebrow">Lead captured</p>',
        '<h3 class="rp-stage-title">Congratulations.</h3>',
        '<p class="rp-stage-description">' + escapeHtml(result.detail) + '</p>',
        '<div class="rp-stage-success-grid">',
        '<div class="rp-stage-success-card"><span>Status</span><strong>' + escapeHtml(result.headline) + '</strong></div>',
        '<div class="rp-stage-success-card"><span>Lead score</span><strong>' + escapeHtml(scoreText) + '</strong></div>',
        '<div class="rp-stage-success-card"><span>Next step</span><strong>' + escapeHtml(actionText) + '</strong></div>',
        '</div>',
        '<p class="rp-stage-note">' + escapeHtml(state.card.benefit) + '</p>',
        '<div class="rp-stage-actions">' +
          (config.agentPhone ? '<a class="rp-link-button rp-whatsapp rp-carousel-whatsapp" href="' + escapeAttribute(waHref) + '" target="_blank" rel="noopener">Go to agency WhatsApp</a>' : '') +
          (config.agentEmail ? '<a class="rp-stage-secondary rp-carousel-email" href="' + escapeAttribute(emailHref) + '">Email agency</a>' : '') +
        '</div>',
        '</div>',
        '</div>',
        '</div>',
      ].join("");
      openPanel("result");
      var wa = resultStep.querySelector(".rp-carousel-whatsapp");
      var email = resultStep.querySelector(".rp-carousel-email");
      var reset = resultStep.querySelector(".rp-carousel-reset");
      if (wa) wa.addEventListener("click", function () {
        trackFunnelEvent(config, "broker_contacted", { mode: config.mode, widget_mode: "carousel", card_id: state.card.id, channel: "whatsapp" });
      });
      if (email) email.addEventListener("click", function () {
        trackFunnelEvent(config, "broker_contacted", { mode: config.mode, widget_mode: "carousel", card_id: state.card.id, channel: "email" });
      });
      if (reset) reset.addEventListener("click", function () {
        closePanel();
      });
    }
    function submitCarouselLead() {
      trackFunnelEvent(config, "lead_submit", { mode: config.mode, widget_mode: "carousel", card_id: state.card.id, card_title: state.card.title });
      return Promise.resolve(calculateStaticCardResult(state.card, state.answers || {})).then(function (result) {
        result.lead_score = calculateLeadScore(state.card, state.answers || {}, state.lead, result);
        return sendWebhook(config.leadWebhook, buildLeadPayload(result), config).then(function () {
          trackFunnelEvent(config, "lead_captured", {
            mode: config.mode,
            widget_mode: "carousel",
            card_id: state.card.id,
            card_title: state.card.title,
            card_answers: state.answers || {},
            lead_score: result.lead_score,
          });
          showResult(result);
          return true;
        });
      });
    }
    function renderLeadCapture() {
      if (!formStep || !resultStep) return;
      formStep.innerHTML = renderCarouselLeadCapture(state.card, config);
      resultStep.innerHTML = "";
      var form = formStep.querySelector(".rp-carousel-capture-form");
      var error = formStep.querySelector(".rp-carousel-capture-error");
      var submitButton = formStep.querySelector(".rp-carousel-capture-submit");
      var backButton = formStep.querySelector(".rp-carousel-back");
      if (backButton) backButton.addEventListener("click", closePanel);
      if (!form) return;
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideError(error);
        if (hasQuotaBlock(config)) {
          showError(error, "This agency has used the included FonatProp lead credits for this period. Please contact the agent directly.");
          return;
        }
        var lead = formToObject(form);
        if (lead.company_website) return;
        if (!lead.name || !lead.email || !lead.phone) {
          showError(error, "Please add your name, email and WhatsApp.");
          return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) {
          showError(error, "Please enter a valid email.");
          return;
        }
        if (!isValidLeadPhone(lead.phone)) {
          showError(error, "Please enter a valid WhatsApp phone number.");
          return;
        }
        if (!lead.consent) {
          showError(error, "Please accept data processing so the agency can prepare and follow up on this request.");
          return;
        }
        var answers = extractCardAnswers(state.card, lead);
        var answerError = validateCardAnswers(state.card, answers);
        if (answerError) {
          showError(error, answerError);
          return;
        }
        var consentPayload = buildConsentPayload(lead.consent_marketing);
        delete lead.consent;
        delete lead.consent_marketing;
        lead.phone = normalizeLeadPhone(lead.phone);
        lead.consent = consentPayload;
        state.lead = lead;
        state.answers = answers;
        setLoading(submitButton, true, "Saving...");
        submitCarouselLead().catch(function (saveError) {
          console.error("[FonatProp Widget] carousel lead save failed", saveError);
          showError(error, "We could not save your request. Please try again or contact the agency directly.");
        }).finally(function () { setLoading(submitButton, false, state.card.cta || "Continue"); });
      });
    }

    slides.forEach(function (button) {
      var cta = button.querySelector(".rp-slide-cta");
      button.addEventListener("click", function (event) {
        if (dragSuppressedClick) {
          if (event) event.preventDefault();
          return;
        }
        stopAutoplayForever();
        activateSlide(button);
      });
      button.addEventListener("keydown", function (event) {
        if (!event || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        stopAutoplayForever();
        activateSlide(button);
      });
      if (cta) cta.addEventListener("click", function (event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (dragSuppressedClick) return;
        stopAutoplayForever();
        activateSlide(button);
      });
    });
    if (prevButton) prevButton.addEventListener("click", function () { stopAutoplayForever(); move(-1); });
    if (nextButton) nextButton.addEventListener("click", function () { stopAutoplayForever(); move(1); });
    if (track) {
      track.addEventListener("mouseenter", clearAutoplay);
      track.addEventListener("mouseleave", function () {
        if (!autoplayLockedByUser) startAutoplay();
      });
      track.addEventListener("pointerdown", function (event) {
        if (!event || event.button > 0) return;
        if (event.target && event.target.closest && event.target.closest(".rp-slide-cta")) return;
        clearAutoplay();
        track.classList.remove("rp-track-animated");
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragCurrentX = event.clientX;
        dragDeltaX = 0;
        dragDeltaY = 0;
        isDragging = true;
        track.classList.add("rp-dragging");
        if (track.setPointerCapture && event.pointerId != null) {
          try { track.setPointerCapture(event.pointerId); } catch (_) {}
        }
      });
      track.addEventListener("pointermove", function (event) {
        if (!isDragging) return;
        dragCurrentX = event.clientX;
        dragDeltaX = dragCurrentX - dragStartX;
        dragDeltaY = event.clientY - dragStartY;
        if (Math.abs(dragDeltaX) > 8 && Math.abs(dragDeltaX) > Math.abs(dragDeltaY) && event.cancelable) {
          event.preventDefault();
        }
        if (Math.abs(dragDeltaX) > Math.abs(dragDeltaY)) {
          setTrackTransform(Math.max(-180, Math.min(180, dragDeltaX)));
        }
      }, { passive: false });
      track.addEventListener("pointerup", function (event) {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove("rp-dragging");
        if (track.releasePointerCapture && event && event.pointerId != null) {
          try { track.releasePointerCapture(event.pointerId); } catch (_) {}
        }
        if (Math.abs(dragDeltaX) > 28 && Math.abs(dragDeltaX) > Math.abs(dragDeltaY)) {
          dragSuppressedClick = true;
          stopAutoplayForever();
          move(dragDeltaX < 0 ? 1 : -1);
          window.setTimeout(function () { dragSuppressedClick = false; }, 120);
        } else {
          applyTrackPosition(true);
        }
        dragStartX = null;
        dragStartY = null;
        dragCurrentX = null;
        dragDeltaX = 0;
        dragDeltaY = 0;
      });
      track.addEventListener("pointercancel", function () {
        isDragging = false;
        track.classList.remove("rp-dragging");
        applyTrackPosition(true);
        dragStartX = null;
        dragStartY = null;
        dragCurrentX = null;
        dragDeltaX = 0;
        dragDeltaY = 0;
      });
      track.addEventListener("wheel", function (event) {
        if (!event || wheelLocked || (panels && panels.classList.contains("rp-panel-open"))) return;
        var absX = Math.abs(event.deltaX || 0);
        var absY = Math.abs(event.deltaY || 0);
        var intent = absX > absY ? event.deltaX : event.deltaY;
        if (Math.abs(intent) < 38) return;
        if (event.cancelable) event.preventDefault();
        wheelLocked = true;
        stopAutoplayForever();
        move(intent > 0 ? 1 : -1);
        window.setTimeout(function () { wheelLocked = false; }, 620);
      }, { passive: false });
    }
    applyTrackPosition(false);
    closePanel();
    startAutoplay();
  }

  function mountWidget(host) {
    if (!host || host.__fonatPropWidgetMounted || host.__realPriceWidgetMounted) return;
    host.__fonatPropWidgetMounted = true;
    // Keep the old marker so an existing embed cannot mount twice during migration.
    host.__realPriceWidgetMounted = true;
    ensureFonts();

    var mode = (host.getAttribute("data-mode") || "inline").toLowerCase();
    var brandColor = host.getAttribute("data-brand-color") || DEFAULT_BRAND_COLOR;
    var apiBase = host.getAttribute("data-api-base") || ADDRESS_API_BASE_DEFAULT;
    var config = {
      agencyId: host.getAttribute("data-agency-id") || "agency-unknown",
      agencyToken: host.getAttribute("data-agency-token") || "",
      agentPhone: "",
      agentEmail: "",
      brandColor: brandColor,
      leadWebhook: DEFAULT_LEAD_WEBHOOK,
      funnelEndpoint: DEFAULT_FUNNEL_ENDPOINT,
      sessionId: "",
      watermarkEnabled: true,
      quota: null,
      plan: null,
      agencyLabel: "",
      mode: mode === "popup" || mode === "drawer" || mode === "banner" ? mode : "inline",
      apiBase: apiBase,
      addressApiBase: ADDRESS_API_BASE_DEFAULT,
      configEndpoint: host.getAttribute("data-config-endpoint") || WIDGET_CONFIG_DEFAULT,
      bannerTitle: host.getAttribute("data-banner-title") || "",
      bannerCta: host.getAttribute("data-banner-cta") || "",
      bannerImage: host.getAttribute("data-banner-image") || "",
      bannerImages: normalizeImageList(host.getAttribute("data-banner-images") || host.getAttribute("data-background-images") || ""),
      widgetMode: normalizeWidgetMode(host.getAttribute("data-widget-mode") || host.getAttribute("data-fonatprop-widget-mode")),
      widgetModeLocked: Boolean(host.getAttribute("data-widget-mode") || host.getAttribute("data-fonatprop-widget-mode")),
      carouselCards: String(host.getAttribute("data-carousel-cards") || "")
        .split(",")
        .map(function (item) { return item.trim(); })
        .filter(Boolean),
      compact: host.getAttribute("data-compact") === "true",
    };

    var shadowRoot = host.attachShadow({ mode: "open" });
    injectStyles(shadowRoot, brandColor);

    var mount = document.createElement("div");
    mount.innerHTML = createTemplate(config);
    shadowRoot.appendChild(mount);

    hydrateWidgetConfig(config).then(function (resolvedConfig) {
    config = resolvedConfig;
    getSessionId(config);
    mount.innerHTML = createTemplate(config);
    trackFunnelEvent(config, "page_view", { mode: config.mode });
    trackFunnelEvent(config, "widget_view", { mode: config.mode });
    if (config.watermarkEnabled === false) {
      Array.prototype.slice.call(shadowRoot.querySelectorAll(".rp-powered,.rp-banner-watermark")).forEach(function (node) {
        node.classList.add("rp-hidden");
      });
    }

    if (config.mode === "banner") {
      mountBanner(shadowRoot, config);
      return;
    }

    var overlay = shadowRoot.querySelector(".rp-overlay");
    var panel = shadowRoot.querySelector(".rp-modal, .rp-drawer-panel");
    var fab = shadowRoot.querySelector(".rp-fab");
    var closeButton = shadowRoot.querySelector(".rp-close");
    if (normalizeWidgetMode(config.widgetMode) === "carousel") {
      function openCarouselWidget() {
        if (overlay) overlay.classList.add("rp-open");
        if (panel) panel.classList.add("rp-open");
        document.body.style.overflow = "hidden";
        trackFunnelEvent(config, "widget_open", { mode: config.mode, widget_mode: "carousel" });
      }
      function closeCarouselWidget() {
        if (overlay) overlay.classList.remove("rp-open");
        if (panel) panel.classList.remove("rp-open");
        document.body.style.overflow = "";
      }
      if (fab) fab.addEventListener("click", openCarouselWidget);
      if (closeButton) closeButton.addEventListener("click", closeCarouselWidget);
      if (overlay) overlay.addEventListener("click", closeCarouselWidget);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && panel && panel.classList.contains("rp-open")) closeCarouselWidget();
      });
      mountCarousel(shadowRoot, config);
      return;
    }
    var leadForm = shadowRoot.querySelector(".rp-lead-form");
    var estimateForm = shadowRoot.querySelector(".rp-estimate-form");
    var leadError = shadowRoot.querySelector(".rp-lead-error");
    var estimateError = shadowRoot.querySelector(".rp-estimate-error");
    var resultCard = shadowRoot.querySelector(".rp-result");
    var resultNumber = shadowRoot.querySelector(".rp-result-number");
    var resultLo = shadowRoot.querySelector(".rp-lo");
    var resultHi = shadowRoot.querySelector(".rp-hi");
    var whatsappLink = shadowRoot.querySelector(".rp-whatsapp");
    var emailLink = shadowRoot.querySelector(".rp-email");
    var zoneSelect = shadowRoot.querySelector('select[name="zone"]');
    var propertyTypeInput = shadowRoot.querySelector('input[name="property_type"]');
    var toggleButtons = Array.prototype.slice.call(shadowRoot.querySelectorAll(".rp-seg button"));
    var leadStep = shadowRoot.querySelector(".rp-step-1");
    var estimateStep = shadowRoot.querySelector(".rp-step-2");
    var pill1 = shadowRoot.querySelector(".rp-pill-1");
    var pill2 = shadowRoot.querySelector(".rp-pill-2");
    var leadSubmitButton = shadowRoot.querySelector(".rp-lead-submit");
    var estimateSubmitButton = shadowRoot.querySelector(".rp-estimate-submit");
    var leadConsentInput = leadForm.querySelector('input[name="consent"]');
    var leadMarketingInput = leadForm.querySelector('input[name="consent_marketing"]');
    var state = { lead: null, valuation: null };

    function setLoading(button, loading, label) {
      if (!button) return;
      var text = button.querySelector(".rp-button-text");
      var arrow = button.querySelector(".rp-arrow");
      button.disabled = loading;
      if (!text) return;
      if (loading) {
        text.innerHTML = '<span class="rp-spinner"></span> ' + label;
        if (arrow) arrow.style.display = "none";
      } else {
        text.textContent = label;
        if (arrow) arrow.style.display = "";
      }
    }

    function showError(node, message) {
      if (!node) return;
      node.hidden = false;
      var msgEl = node.querySelector(".rp-msg");
      if (msgEl) msgEl.textContent = message;
      else node.textContent = message;
    }
    function hideError(node) {
      if (!node) return;
      node.hidden = true;
      var msgEl = node.querySelector(".rp-msg");
      if (msgEl) msgEl.textContent = "";
    }

    function switchStep(stepNumber) {
      var isLead = stepNumber === 1;
      leadStep.classList.toggle("rp-active", isLead);
      estimateStep.classList.toggle("rp-active", !isLead);
      if (pill1 && pill2) {
        pill1.classList.toggle("rp-on", isLead);
        pill1.classList.toggle("rp-done", !isLead);
        pill2.classList.toggle("rp-on", !isLead);
      }
    }

    function openWidget() {
      if (overlay) overlay.classList.add("rp-open");
      if (panel) panel.classList.add("rp-open");
      document.body.style.overflow = "hidden";
      trackFunnelEvent(config, "widget_open", { mode: config.mode });
    }
    function closeWidget() {
      if (overlay) overlay.classList.remove("rp-open");
      if (panel) panel.classList.remove("rp-open");
      document.body.style.overflow = "";
    }

    if (fab) fab.addEventListener("click", openWidget);
    if (closeButton) closeButton.addEventListener("click", closeWidget);
    if (overlay) overlay.addEventListener("click", closeWidget);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel && panel.classList.contains("rp-open")) closeWidget();
    });

    toggleButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        toggleButtons.forEach(function (item) { item.classList.remove("rp-selected"); });
        button.classList.add("rp-selected");
        propertyTypeInput.value = button.getAttribute("data-type") || "Flat";
      });
    });

    loadZones(config.apiBase, config).then(function (zones) {
      zoneSelect.innerHTML = '<option value="">Select a zone</option>' +
        zones.map(function (z) { return '<option value="' + escapeHtml(z) + '">' + escapeHtml(z) + '</option>'; }).join("");
    });

    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();
      hideError(leadError);
      var fd = new FormData(leadForm);
      var name = String(fd.get("name") || "").trim();
      var email = String(fd.get("email") || "").trim();
      var phone = String(fd.get("phone") || "").trim();
      var honeypot = String(fd.get("company_website") || "").trim();
      var consent = Boolean(fd.get("consent"));
      var consentPayload = buildConsentPayload(Boolean(fd.get("consent_marketing")));

      if (honeypot) return;
      if (!name || !phone) {
        showError(leadError, "Please add your name and WhatsApp. Email is optional.");
        return;
      }
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showError(leadError, "Please enter a valid email, or leave it empty.");
        return;
      }
      if (!isValidLeadPhone(phone)) {
        showError(leadError, "Please enter a valid WhatsApp phone number.");
        return;
      }
      if (!consent || !leadConsentInput || !leadConsentInput.checked) {
        showError(leadError, "Please accept data processing so the agency can prepare and follow up on this request.");
        return;
      }
      if (hasQuotaBlock(config)) {
        showError(leadError, "This agency has used the included FonatProp lead credits for this period. Please contact the agent directly.");
        return;
      }
      var fullPhone = normalizeLeadPhone(phone);
      state.lead = { name: name, email: email, phone: fullPhone, consent: consentPayload };
      trackFunnelEvent(config, "widget_start", { mode: config.mode, step: "lead_form" });
      switchStep(2);
    });

    estimateForm.addEventListener("submit", function (event) {
      event.preventDefault();
      hideError(estimateError);
      resultCard.hidden = true;

      var fd = new FormData(estimateForm);
      var address = String(fd.get("address") || "").trim();
      var zone = String(fd.get("zone") || "").trim();
      var rooms = String(fd.get("rooms") || "1 BR").trim();
      var areaM2 = Number(fd.get("area_m2"));
      var propertyType = String(fd.get("property_type") || "Flat");

      if (!address || address.length < 3) {
        showError(estimateError, "Please add the property address or building.");
        return;
      }
      if (!zone) { showError(estimateError, "Please select a zone."); return; }
      if (!isFinite(areaM2) || areaM2 < 20 || areaM2 > 1000) {
        showError(estimateError, "Please enter an area between 20 and 1000 m².");
        return;
      }

      var now = new Date();
      var payload = {
        zona: zone,
        rooms: rooms === "Studio" ? "Studio" : rooms.replace(" BR", " B/R"),
        area_m2: areaM2,
        is_freehold: true, is_offplan: false, has_parking: true,
        property_type: propertyType,
        year: now.getFullYear(),
        quarter: quarterFromDate(now),
      };

      setLoading(estimateSubmitButton, true, "Notifying broker...");

      var predictionReady = fetchWidgetJson(config.apiBase.replace(/\/$/, "") + "/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }, config)
        .then(function (r) {
          if (!r.ok) throw new Error("Prediction failed");
          return r.json();
        })
        .then(function (prediction) {
          var predictedAed = Number(prediction && prediction.predicted_aed);
          if (!isFinite(predictedAed) || predictedAed <= 0) throw new Error("Invalid response");
          var lo = clamp(predictedAed * 0.82, 0, Number.MAX_SAFE_INTEGER);
          var hi = clamp(predictedAed * 1.18, 0, Number.MAX_SAFE_INTEGER);
          return {
            range: currencyCompact(lo) + " - " + currencyCompact(hi),
            lo: lo,
            hi: hi,
            prediction: prediction,
            status: "estimated",
          };
        })
        .catch(function (error) {
          console.error("[FonatProp Widget] predict failed; saving manual broker handoff", error);
          return {
            range: "",
            lo: null,
            hi: null,
            prediction: null,
            status: "manual_review_required",
          };
        });

      predictionReady
        .then(function (valuation) {
          var campaign = readCampaignContext();
          var consentPayload = state.lead && state.lead.consent ? state.lead.consent : buildConsentPayload(false);
          var property = {
            address: address,
            zone: zone,
            rooms: rooms,
            area_m2: areaM2,
            type: propertyType,
            card_id: "valuation",
            card_title: "Property valuation",
            valuation_status: valuation.status,
          };

          state.valuation = {
            range: valuation.range,
            lo: valuation.lo,
            hi: valuation.hi,
            prediction: valuation.prediction,
            property: property,
          };

          trackFunnelEvent(config, "lead_submit", {
            mode: config.mode,
            card_id: "valuation",
            card_title: "Property valuation",
            valuation_status: valuation.status,
            zone: zone,
          });

          if (config.agentPhone) {
            var waText = "Hi, I'm " + (state.lead ? state.lead.name : "") +
              ". I just completed your property valuation widget for " +
              address + ", " + zone + " (" + rooms + ", " + areaM2 + "m2). Could you review it and send me the valuation context?";
            whatsappLink.href = "https://wa.me/" + sanitizePhone(config.agentPhone) + "?text=" + encodeURIComponent(waText);
          } else whatsappLink.href = "#";

          if (config.agentEmail) {
            var subj = encodeURIComponent("Property valuation request - " + zone);
            var body = encodeURIComponent(
              "Hello,\n\nI used the FonatProp widget and would like the broker valuation context.\n\n" +
              "Name: " + (state.lead ? state.lead.name : "") + "\n" +
              "Email: " + (state.lead ? state.lead.email : "") + "\n" +
              "Phone: " + (state.lead ? state.lead.phone : "") + "\n" +
              "Address/building: " + address + "\n" +
              "Zone: " + zone + "\n" +
              "Rooms: " + rooms + "\n" +
              "Area: " + areaM2 + " m2\n" +
              "Type: " + propertyType + "\n" +
              "Status: " + (valuation.status === "estimated" ? "AI range saved privately" : "Manual broker review requested") + "\n"
            );
            emailLink.href = "mailto:" + config.agentEmail + "?subject=" + subj + "&body=" + body;
          } else emailLink.href = "#";

          return sendWebhook(config.leadWebhook, {
            event: valuation.status === "estimated" ? "valuation_completed" : "valuation_manual_review_requested",
            market: "dubai",
            source: "public-widget",
            agency_id: config.agencyId,
            section: "widget_valuation",
            card_id: "valuation",
            card_title: "Property valuation",
            page_url: campaign.page_url,
            utm_source: campaign.utm_source,
            utm_medium: campaign.utm_medium,
            utm_campaign: campaign.utm_campaign,
            utm_content: campaign.utm_content,
            utm_term: campaign.utm_term,
            agent_email: config.agentEmail,
            agent_phone: config.agentPhone,
            name: state.lead ? state.lead.name : "",
            email: state.lead ? state.lead.email : "",
            phone: state.lead ? state.lead.phone : "",
            address: address,
            zone: zone,
            rooms: rooms,
            area_m2: areaM2,
            property_type: propertyType,
            estimated_value: valuation.range || null,
            agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
            consent_privacy: consentPayload.consent_privacy,
            consent_contact: consentPayload.consent_contact,
            consent_whatsapp: consentPayload.consent_whatsapp,
            consent_marketing: consentPayload.consent_marketing,
            consent_text: consentPayload.consent_text,
            consent_at: consentPayload.consent_at,
            privacy_version: consentPayload.privacy_version,
            consent: consentPayload.consent,
            property: property,
            raw_prediction: valuation.prediction,
            snapshot: {
              funnel_session_id: getSessionId(config),
              widget_mode: "valuation",
              card_id: "valuation",
              card_title: "Property valuation",
              valuation_status: valuation.status,
              card_result: {
                headline: valuation.status === "estimated" ? "Broker valuation context ready" : "Manual valuation review requested",
                value: valuation.range || "Broker follow-up required",
                detail: "The visitor does not receive the full valuation on the website; the broker receives the context for follow-up.",
              },
              page_url: campaign.page_url,
              referrer: campaign.referrer,
              utm_source: campaign.utm_source,
              utm_medium: campaign.utm_medium,
              utm_campaign: campaign.utm_campaign,
              utm_content: campaign.utm_content,
              utm_term: campaign.utm_term,
              agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
              consent_privacy: consentPayload.consent_privacy,
              consent_contact: consentPayload.consent_contact,
              consent_whatsapp: consentPayload.consent_whatsapp,
              consent_marketing: consentPayload.consent_marketing,
              consent_text: consentPayload.consent_text,
              consent_at: consentPayload.consent_at,
              privacy_version: consentPayload.privacy_version,
              consent: consentPayload.consent,
            },
            timestamp: new Date().toISOString(),
          }, config).then(function () {
            resultCard.hidden = false;
            if (resultNumber) resultNumber.textContent = valuation.status === "estimated" ? "Broker context saved" : "Broker review requested";
            if (resultLo) resultLo.textContent = "";
            if (resultHi) resultHi.textContent = "";
            trackFunnelEvent(config, "lead_captured", {
              mode: config.mode,
              card_id: "valuation",
              card_title: "Property valuation",
              valuation_status: valuation.status,
            });
            trackFunnelEvent(config, valuation.status === "estimated" ? "valuation_completed" : "valuation_manual_handoff", {
              mode: config.mode,
              zone: zone,
              rooms: rooms,
              area_m2: areaM2,
            });
          });
        })
        .catch(function (error) {
          console.error("[FonatProp Widget] valuation handoff save failed", error);
          showError(estimateError, "We could not notify the broker. Please try again or contact the agency directly.");
        })
        .finally(function () {
          setLoading(estimateSubmitButton, false, "Notify broker");
        });

      return;

      fetchWidgetJson(config.apiBase.replace(/\/$/, "") + "/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }, config)
        .then(function (r) {
          if (!r.ok) throw new Error("Prediction failed");
          return r.json();
        })
        .then(function (prediction) {
          var predictedAed = Number(prediction && prediction.predicted_aed);
          if (!isFinite(predictedAed) || predictedAed <= 0) throw new Error("Invalid response");
          var lo = clamp(predictedAed * 0.82, 0, Number.MAX_SAFE_INTEGER);
          var hi = clamp(predictedAed * 1.18, 0, Number.MAX_SAFE_INTEGER);
          var rangeText = currencyCompact(lo) + " – " + currencyCompact(hi);

          state.valuation = {
            range: rangeText, lo: lo, hi: hi, prediction: prediction,
            property: { zone: zone, rooms: rooms, area_m2: areaM2, type: propertyType },
          };

          resultCard.hidden = false;
          if (resultNumber) resultNumber.textContent = "Broker context saved";
          if (resultLo) resultLo.textContent = "";
          if (resultHi) resultHi.textContent = "";
          trackFunnelEvent(config, "valuation_completed", {
            mode: config.mode,
            zone: zone,
            rooms: rooms,
            area_m2: areaM2,
          });

          if (config.agentPhone) {
            var waText = "Hi, I'm " + (state.lead ? state.lead.name : "") +
              ". I just completed your property valuation widget for " +
              zone + " (" + rooms + ", " + areaM2 + "m2). Could you review it and send me the valuation context?";
            whatsappLink.href = "https://wa.me/" + sanitizePhone(config.agentPhone) + "?text=" + encodeURIComponent(waText);
          } else whatsappLink.href = "#";

          if (config.agentEmail) {
            var subj = encodeURIComponent("Property valuation request — " + zone);
            var body = encodeURIComponent(
              "Hello,\n\nI used the FonatProp widget and would like the broker valuation context.\n\n" +
              "Name: " + (state.lead ? state.lead.name : "") + "\n" +
              "Email: " + (state.lead ? state.lead.email : "") + "\n" +
              "Phone: " + (state.lead ? state.lead.phone : "") + "\n" +
              "Zone: " + zone + "\n" +
              "Rooms: " + rooms + "\n" +
              "Area: " + areaM2 + " m2\n" +
              "Type: " + propertyType + "\n" +
              "The AI range is saved privately in FonatProp for the agency.\n"
            );
            emailLink.href = "mailto:" + config.agentEmail + "?subject=" + subj + "&body=" + body;
          } else emailLink.href = "#";

          var consentPayload = state.lead && state.lead.consent ? state.lead.consent : buildConsentPayload(false);
          sendWebhook(config.leadWebhook, {
            event: "valuation_completed",
            market: "dubai",
            source: "public-widget",
            agency_id: config.agencyId,
            section: "widget_valuation",
            card_id: "valuation",
            card_title: "Property valuation",
            name: state.lead ? state.lead.name : "",
            email: state.lead ? state.lead.email : "",
            phone: state.lead ? state.lead.phone : "",
            estimated_value: rangeText,
            agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
            consent_privacy: consentPayload.consent_privacy,
            consent_contact: consentPayload.consent_contact,
            consent_whatsapp: consentPayload.consent_whatsapp,
            consent_marketing: consentPayload.consent_marketing,
            consent_text: consentPayload.consent_text,
            consent_at: consentPayload.consent_at,
            privacy_version: consentPayload.privacy_version,
            consent: consentPayload.consent,
            property: state.valuation.property,
            raw_prediction: prediction,
            snapshot: {
              funnel_session_id: getSessionId(config),
              widget_mode: "valuation",
              card_id: "valuation",
              card_title: "Property valuation",
              agency_token_hint: config.agencyId ? "agency:" + String(config.agencyId).slice(0, 12) : "",
              consent_privacy: consentPayload.consent_privacy,
              consent_contact: consentPayload.consent_contact,
              consent_whatsapp: consentPayload.consent_whatsapp,
              consent_marketing: consentPayload.consent_marketing,
              consent_text: consentPayload.consent_text,
              consent_at: consentPayload.consent_at,
              privacy_version: consentPayload.privacy_version,
              consent: consentPayload.consent,
            },
            timestamp: new Date().toISOString(),
          }, config);
        })
        .catch(function (error) {
          console.error("[FonatProp Widget] predict failed", error);
          showError(estimateError, "We couldn't estimate this property right now. Please contact the agent for a manual valuation.");
        })
        .finally(function () {
          setLoading(estimateSubmitButton, false, "Prepare broker context");
        });
    });

    if (whatsappLink) {
      whatsappLink.addEventListener("click", function () {
        trackFunnelEvent(config, "broker_contacted", { mode: config.mode, channel: "whatsapp" });
      });
    }
    if (emailLink) {
      emailLink.addEventListener("click", function () {
        trackFunnelEvent(config, "broker_contacted", { mode: config.mode, channel: "email" });
      });
    }
    });
  }

  function mountAll() {
    var nodes = [];
    var seen = [];
    function collect(nodeList) {
      Array.prototype.slice.call(nodeList || []).forEach(function (node) {
        if (seen.indexOf(node) >= 0) return;
        seen.push(node);
        nodes.push(node);
      });
    }
    collect(document.querySelectorAll("#fonatprop-widget"));
    collect(document.querySelectorAll("[data-fonatprop-widget]"));
    collect(document.querySelectorAll(".fonatprop-widget"));
    collect(document.querySelectorAll("#realprice-widget"));
    collect(document.querySelectorAll("[data-realprice-widget]"));
    collect(document.querySelectorAll(".realprice-widget"));
    nodes.forEach(mountWidget);
  }

  window.FonatPropWidget = { mountAll: mountAll, mount: mountWidget };
  // Backwards-compatible alias for older agency snippets.
  window.RealPriceWidget = window.FonatPropWidget;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll, { once: true });
  } else {
    mountAll();
  }
})();
