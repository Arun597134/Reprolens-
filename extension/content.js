// ReproLens Extension Content Script with Local Sanitization
(function () {
  'use strict';

  const REDACTED = '[REDACTED]';
  const SENSITIVE_KEY_REGEX = /pass(word)?|secret|token|bearer|auth|api[-_]?key|credit[-_]?card|card[-_]?number|cvv|cvc|ssn|pin/i;
  const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  const JWT_REGEX = /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/g;
  const CC_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

  function isLuhnValid(ccStr) {
    const digits = ccStr.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0, shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  function sanitizeString(str) {
    if (!str || typeof str !== 'string') return str;
    return str
      .replace(JWT_REGEX, REDACTED)
      .replace(EMAIL_REGEX, REDACTED)
      .replace(CC_REGEX, match => isLuhnValid(match) ? REDACTED : match);
  }

  function sanitizePayload(obj, keyName) {
    if (obj === null || obj === undefined) return obj;
    if (keyName && SENSITIVE_KEY_REGEX.test(keyName)) return REDACTED;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(item => sanitizePayload(item, keyName));
    if (typeof obj === 'object') {
      const clean = {};
      for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          clean[k] = sanitizePayload(obj[k], k);
        }
      }
      return clean;
    }
    return obj;
  }

  function getCssSelector(el) {
    if (!el || !(el instanceof Element)) return '';
    if (el.id) return '#' + el.id;
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        let sib = el, nth = 1;
        while ((sib = sib.previousElementSibling)) {
          if (sib.nodeName.toLowerCase() === selector) nth++;
        }
        if (nth !== 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(' > ');
  }

  const sessionToken = 'ext_sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
  const startTime = Date.now();
  let eventQueue = [];

  function record(type, payload) {
    eventQueue.push({
      timestamp_offset_ms: Date.now() - startTime,
      event_type: type,
      payload: sanitizePayload(payload),
      is_sanitized: true
    });
  }

  function flush() {
    if (!eventQueue.length) return;
    const batch = eventQueue.slice();
    eventQueue = [];

    chrome.runtime.sendMessage({
      type: "INGEST_BATCH",
      payload: {
        session_token: sessionToken,
        user_agent: navigator.userAgent,
        viewport_w: window.innerWidth,
        viewport_h: window.innerHeight,
        url: window.location.href,
        duration_ms: Date.now() - startTime,
        events: batch
      }
    });
  }

  // Record initial navigation
  record('navigation', { url: window.location.href, title: document.title });

  // Listeners
  document.addEventListener('click', e => {
    const t = e.target;
    record('click', {
      tag: t.tagName.toLowerCase(),
      selector: getCssSelector(t),
      text: (t.innerText || t.value || '').trim().substring(0, 80)
    });
  }, true);

  document.addEventListener('change', e => {
    const t = e.target;
    if (t && t.tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) {
      const isSecret = t.type === 'password' || SENSITIVE_KEY_REGEX.test(t.name || t.id || '');
      record('input', {
        selector: getCssSelector(t),
        name: t.name || t.id,
        value: isSecret ? REDACTED : sanitizeString(t.value)
      });
    }
  }, true);

  window.addEventListener('error', e => {
    record('js_exception', {
      message: e.message || 'Script error',
      filename: e.filename,
      lineno: e.lineno,
      stack: e.error && e.error.stack ? e.error.stack : ''
    });
    flush();
  });

  window.addEventListener('unhandledrejection', e => {
    record('js_exception', {
      message: 'Unhandled Promise Rejection: ' + (e.reason ? (e.reason.message || String(e.reason)) : '')
    });
    flush();
  });

  // Flush every 4 seconds
  setInterval(flush, 4000);

  // Floating badge UI
  function renderBadge() {
    const container = document.createElement('div');
    container.id = 'reprolens-badge-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #0f172a;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #f8fafc;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      user-select: none;
    `;
    container.innerHTML = `
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; animation: pulse 1.5s infinite;"></span>
      <span style="font-weight:600;">ReproLens</span>
      <span style="color:#94a3b8; font-size:11px;">Active</span>
    `;

    container.addEventListener('click', () => {
      record('click', { action: 'user_triggered_manual_bug_snapshot' });
      flush();
      alert('ReproLens snapshot transmitted! Case file synchronized to Developer Dashboard.');
    });

    document.body.appendChild(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBadge);
  } else {
    renderBadge();
  }
})();
