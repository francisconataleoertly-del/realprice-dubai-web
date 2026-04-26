/*!
 * RealPrice Dubai — Embeddable Valuation Widget
 * Vanilla JS + Shadow DOM. Premium editorial design.
 * Modes: inline · popup · drawer
 */
(function () {
  "use strict";

  var API_BASE_DEFAULT = "https://web-production-9051f.up.railway.app";
  var DEFAULT_BRAND_COLOR = "#3b82f6";
  var DEFAULT_TITLE = "Estimate your property's value";
  var DEFAULT_SUBTITLE = "AI-powered market estimate in under a minute. Backed by 234K Dubai transactions.";
  var ROOM_OPTIONS = ["Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR"];
  var PROPERTY_TYPES = [
    { label: "Apartment", value: "Flat" },
    { label: "Villa", value: "Villa" },
    { label: "Townhouse", value: "Townhouse" },
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

  function loadZones(apiBase) {
    if (ZONE_CACHE.options && ZONE_CACHE.options.length) {
      return Promise.resolve(ZONE_CACHE.options);
    }
    if (ZONE_CACHE.promise) return ZONE_CACHE.promise;

    ZONE_CACHE.promise = fetch(apiBase.replace(/\/$/, "") + "/zones", {
      method: "GET",
      headers: { Accept: "application/json" },
    })
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
        console.error("[RealPrice Widget] zones load failed", error);
        ZONE_CACHE.promise = null;
        return [
          "Dubai Marina", "Downtown Dubai", "Business Bay", "Palm Jumeirah",
          "JVC", "JLT", "Dubai Hills", "DIFC",
        ];
      });

    return ZONE_CACHE.promise;
  }

  function sendWebhook(url, payload) {
    if (!url) return Promise.resolve(false);
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
      keepalive: true,
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Webhook failed " + response.status);
        return true;
      })
      .catch(function (error) {
        console.error("[RealPrice Widget] webhook failed", error);
        return false;
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
      'font-family:"Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'font-feature-settings:"cv11","ss01","ss03";',
      'color:var(--rp-fg);',
      '-webkit-font-smoothing:antialiased;',
      'position:relative;line-height:1.5;',
      '}',
      '.rp-inline{max-width:460px}',

      // Card
      '.rp-card{',
      'position:relative;background:var(--rp-bg);border:1px solid var(--rp-line);',
      'border-radius:20px;padding:32px 28px 26px;width:100%;',
      'box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.06),0 30px 60px -20px rgba(15,23,42,.12);',
      '}',

      // Header
      '.rp-header{margin-bottom:22px}',
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

      // Powered by
      '.rp-powered{margin-top:22px;padding-top:16px;border-top:1px solid var(--rp-line-soft);',
      'display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--rp-fg-muted);letter-spacing:.01em}',
      '.rp-powered-brand{display:flex;align-items:center;gap:6px;color:var(--rp-fg-soft);font-weight:500;text-decoration:none}',
      '.rp-powered-brand .rp-logo-dot{width:6px;height:6px;border-radius:999px;background:var(--rp-fg)}',
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

      // Mobile
      '@media (max-width:520px){',
      '.rp-card{padding:24px 20px 20px;border-radius:16px}',
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
      '<div class="rp-eyebrow"><span class="rp-dot"></span><span class="rp-eyebrow-text">Dubai Property Valuation</span></div>',
      '<h2 class="rp-title">' + DEFAULT_TITLE.replace("property's value", "property's <em>value</em>") + '</h2>',
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
      '<div class="rp-field"><span class="rp-label">Full name</span>',
      '<input class="rp-input" name="name" type="text" placeholder="Jane Doe" autocomplete="name" required />',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Email</span>',
      '<input class="rp-input" name="email" type="email" placeholder="jane@company.com" autocomplete="email" required />',
      '</div>',
      '<div class="rp-field"><span class="rp-label">Phone</span>',
      '<div class="rp-phone">',
      '<span class="rp-phone-prefix"><span class="rp-flag">🇦🇪</span><span>+971</span></span>',
      '<input name="phone" type="tel" placeholder="50 123 4567" autocomplete="tel-national" required />',
      '</div>',
      '</div>',
      '<button class="rp-button rp-lead-submit" type="submit">',
      '<span class="rp-button-text">Continue</span>' + svgArrow,
      '</button>',
      '</form>',
      '<div class="rp-error rp-lead-error" hidden><span class="rp-ic">!</span><span class="rp-msg"></span></div>',
      '</section>',

      // Step 2 — Estimation
      '<section class="rp-step rp-step-2">',
      '<form class="rp-form rp-estimate-form">',
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
      '<span class="rp-button-text">Get Estimate</span>' + svgArrow,
      '</button>',
      '</form>',
      '<div class="rp-error rp-estimate-error" hidden><span class="rp-ic">!</span><span class="rp-msg"></span></div>',

      '<div class="rp-result" hidden>',
      '<div class="rp-result-inner">',
      '<p class="rp-result-label">Estimated market value</p>',
      '<p class="rp-result-value"><span class="rp-unit">AED</span><span class="rp-result-number">—</span></p>',
      '<p class="rp-result-range-label">Confidence range</p>',
      '<div class="rp-result-bar"><div class="rp-result-bar-fill"></div><div class="rp-result-bar-marker"></div></div>',
      '<div class="rp-result-bounds"><span class="rp-lo">—</span><span class="rp-hi">—</span></div>',
      '<p class="rp-footnote">This is an AI-powered estimate. <strong>For a precise valuation, contact our agent.</strong></p>',
      '<div class="rp-contact-grid">',
      '<a class="rp-link-button rp-whatsapp" href="#" target="_blank" rel="noopener">' + svgWhatsApp + '<span>WhatsApp</span></a>',
      '<a class="rp-link-button rp-email" href="#">' + svgMail + '<span>Email agent</span></a>',
      '</div>',
      '</div>',
      '</div>',
      '</section>',

      '</div>',

      // Powered by
      '<div class="rp-powered">',
      '<a class="rp-powered-brand" href="https://fonatprop.com" target="_blank" rel="noopener"><span class="rp-logo-dot"></span>Powered by FonatProp</a>',
      '<span class="rp-powered-secure">' + svgLock + 'Secure &amp; private</span>',
      '</div>',
    ].join("");
    // unused in prod but keeps ESLint happy if we inline check icons elsewhere
    svgCheck; // eslint-disable-line
  }

  function createTemplate(config) {
    var svgSparkle = '<svg class="rp-fab-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="currentColor" opacity=".95"/></svg>';
    return (
      '<div class="rp-shell ' + (config.mode === "inline" ? "rp-inline" : "") + '">' +
      (config.mode === "inline"
        ? '<div class="rp-card">' + createCardInner() + '</div>'
        : '<button type="button" class="rp-fab">' + svgSparkle + '<span>' +
            (config.mode === "drawer" ? "Valuate my property" : "Valuate my property") +
          '</span></button>' +
          '<div class="rp-overlay"></div>' +
          '<div class="' + (config.mode === "drawer" ? "rp-drawer-panel" : "rp-modal") + '">' +
          '<div class="rp-card">' +
          '<button type="button" class="rp-close" aria-label="Close widget">×</button>' +
          createCardInner() +
          '</div></div>') +
      '</div>'
    );
  }

  // ── Mount ─────────────────────────────────────────────────
  function mountWidget(host) {
    if (!host || host.__realPriceWidgetMounted) return;
    host.__realPriceWidgetMounted = true;
    ensureFonts();

    var mode = (host.getAttribute("data-mode") || "inline").toLowerCase();
    var brandColor = host.getAttribute("data-brand-color") || DEFAULT_BRAND_COLOR;
    var apiBase = host.getAttribute("data-api-base") || API_BASE_DEFAULT;
    var config = {
      agencyId: host.getAttribute("data-agency-id") || "agency-unknown",
      agentPhone: host.getAttribute("data-agent-phone") || "",
      agentEmail: host.getAttribute("data-agent-email") || "",
      brandColor: brandColor,
      leadWebhook: host.getAttribute("data-lead-webhook") || "",
      mode: mode === "popup" || mode === "drawer" ? mode : "inline",
      apiBase: apiBase,
    };

    var shadowRoot = host.attachShadow({ mode: "open" });
    injectStyles(shadowRoot, brandColor);

    var mount = document.createElement("div");
    mount.innerHTML = createTemplate(config);
    shadowRoot.appendChild(mount);

    var overlay = shadowRoot.querySelector(".rp-overlay");
    var panel = shadowRoot.querySelector(".rp-modal, .rp-drawer-panel");
    var fab = shadowRoot.querySelector(".rp-fab");
    var closeButton = shadowRoot.querySelector(".rp-close");
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

    loadZones(config.apiBase).then(function (zones) {
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

      if (!name || !email || !phone) {
        showError(leadError, "Please complete all contact fields.");
        return;
      }
      if (!/^[0-9\s-]{7,}$/.test(phone)) {
        showError(leadError, "Please enter a valid UAE phone number.");
        return;
      }
      var fullPhone = "+971 " + phone;
      state.lead = { name: name, email: email, phone: fullPhone };

      setLoading(leadSubmitButton, true, "Saving…");
      sendWebhook(config.leadWebhook, {
        event: "lead_captured",
        agency_id: config.agencyId,
        agent_email: config.agentEmail,
        agent_phone: config.agentPhone,
        name: name, email: email, phone: fullPhone,
        estimated_value: null, property: null,
        timestamp: new Date().toISOString(),
      }).finally(function () {
        setLoading(leadSubmitButton, false, "Continue");
        switchStep(2);
      });
    });

    estimateForm.addEventListener("submit", function (event) {
      event.preventDefault();
      hideError(estimateError);
      resultCard.hidden = true;

      var fd = new FormData(estimateForm);
      var zone = String(fd.get("zone") || "").trim();
      var rooms = String(fd.get("rooms") || "1 BR").trim();
      var areaM2 = Number(fd.get("area_m2"));
      var propertyType = String(fd.get("property_type") || "Flat");

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

      setLoading(estimateSubmitButton, true, "Estimating…");

      fetch(config.apiBase.replace(/\/$/, "") + "/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
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
          // animate number
          animateNumber(resultNumber, lo, lo, 10, function (v) { return currencyCompact(v).replace("AED ", ""); });
          setTimeout(function () {
            resultNumber.textContent = rangeText.replace(/AED /g, "");
          }, 50);
          // fill bounds
          resultLo.textContent = currencyCompact(lo);
          resultHi.textContent = currencyCompact(hi);

          if (config.agentPhone) {
            var waText = "Hi! I used the FonatProp valuation widget. My estimated range for " +
              zone + " (" + rooms + ", " + areaM2 + "m²) is " + rangeText +
              ". Could you help me with a precise valuation?";
            whatsappLink.href = "https://wa.me/" + sanitizePhone(config.agentPhone) + "?text=" + encodeURIComponent(waText);
          } else whatsappLink.href = "#";

          if (config.agentEmail) {
            var subj = encodeURIComponent("Property valuation request — " + zone);
            var body = encodeURIComponent(
              "Hello,\n\nI used the FonatProp widget and would like a precise valuation.\n\n" +
              "Name: " + (state.lead ? state.lead.name : "") + "\n" +
              "Email: " + (state.lead ? state.lead.email : "") + "\n" +
              "Phone: " + (state.lead ? state.lead.phone : "") + "\n" +
              "Zone: " + zone + "\n" +
              "Rooms: " + rooms + "\n" +
              "Area: " + areaM2 + " m²\n" +
              "Type: " + propertyType + "\n" +
              "Estimated range: " + rangeText + "\n"
            );
            emailLink.href = "mailto:" + config.agentEmail + "?subject=" + subj + "&body=" + body;
          } else emailLink.href = "#";

          sendWebhook(config.leadWebhook, {
            event: "valuation_completed",
            agency_id: config.agencyId,
            name: state.lead ? state.lead.name : "",
            email: state.lead ? state.lead.email : "",
            phone: state.lead ? state.lead.phone : "",
            estimated_value: rangeText,
            property: state.valuation.property,
            raw_prediction: prediction,
            timestamp: new Date().toISOString(),
          });
        })
        .catch(function (error) {
          console.error("[FonatProp Widget] predict failed", error);
          showError(estimateError, "We couldn't estimate this property right now. Please contact the agent for a manual valuation.");
        })
        .finally(function () {
          setLoading(estimateSubmitButton, false, "Get Estimate");
        });
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
    collect(document.querySelectorAll("#realprice-widget"));
    collect(document.querySelectorAll("#fonatprop-widget"));
    collect(document.querySelectorAll("[data-realprice-widget]"));
    collect(document.querySelectorAll("[data-fonatprop-widget]"));
    collect(document.querySelectorAll(".realprice-widget"));
    nodes.forEach(mountWidget);
  }

  window.FonatPropWidget = { mountAll: mountAll, mount: mountWidget };
  window.RealPriceWidget = window.FonatPropWidget;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll, { once: true });
  } else {
    mountAll();
  }
})();
