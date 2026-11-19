// ReproLens Extension Content Script (MV3 Isolated World + Privacy + Silent UX Radar)
(function () {
  'use strict';

  // Do not inject telemetry recorder or chaos badge into ReproLens Dashboard itself
  if (typeof window !== 'undefined' && window.location) {
    const port = String(window.location.port || '');
    const host = String(window.location.hostname || '').toLowerCase();
    const href = String(window.location.href || '').toLowerCase();
    if (
      port === '5173' ||
      port === '8000' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('reprolens') ||
      href.includes(':5173') ||
      href.includes(':8000')
    ) {
      return;
    }
  }

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
  const RING_WINDOW_MS = 45000;
  const RING_MAX_EVENTS = 80;
  let eventQueue = [];
  let ringBuffer = [];
  let lastNetworkActivityTs = 0;
  let lastNavigationUrl = window.location.href;
  let chaosState = { chaosLatencyMs: 0, chaosForce500: false, flightRecorderMode: false };

  function pushConfigToMainWorld(cfg) {
    chaosState = {
      chaosLatencyMs: Number(cfg.chaosLatencyMs) || 0,
      chaosForce500: Boolean(cfg.chaosForce500),
      flightRecorderMode: Boolean(cfg.flightRecorderMode)
    };
    window.postMessage({
      source: 'REPROLENS_EXT_CONFIG',
      config: { chaosLatencyMs: chaosState.chaosLatencyMs, chaosForce500: chaosState.chaosForce500 }
    }, '*');
    updateBadgeChaosIndicator();
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['chaosLatencyMs', 'chaosForce500', 'flightRecorderMode'], (res) => {
      pushConfigToMainWorld(res || {});
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes.chaosLatencyMs || changes.chaosForce500 || changes.flightRecorderMode)) {
        chrome.storage.local.get(['chaosLatencyMs', 'chaosForce500', 'flightRecorderMode'], (res) => {
          pushConfigToMainWorld(res || {});
        });
      }
    });
  }

  function record(type, payload) {
    const evt = {
      timestamp_offset_ms: Date.now() - startTime,
      event_type: type,
      payload: sanitizePayload(payload),
      is_sanitized: true
    };
    if (chaosState.flightRecorderMode) {
      const now = Date.now();
      ringBuffer.push({ _wallTs: now, evt });
      while (ringBuffer.length > 0 && (now - ringBuffer[0]._wallTs > RING_WINDOW_MS || ringBuffer.length > RING_MAX_EVENTS)) {
        ringBuffer.shift();
      }
    } else {
      eventQueue.push(evt);
    }
  }

  function flush(isIncident = false) {
    let batch = [];
    if (chaosState.flightRecorderMode) {
      if (!isIncident || !ringBuffer.length) return;
      batch = ringBuffer.map(item => item.evt);
      ringBuffer = [];
    } else {
      if (!eventQueue.length) return;
      batch = eventQueue.slice();
      eventQueue = [];
    }

    chrome.runtime.sendMessage({
      type: 'INGEST_BATCH',
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

  // Listen to MAIN-world fetch / XHR / console.error bridge
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'REPROLENS_MAIN_WORLD') return;
    const { eventType, payload } = event.data;

    if (eventType === 'network_activity') {
      lastNetworkActivityTs = Date.now();
      return;
    }

    if (eventType === 'network_request') {
      record('network_request', payload);
      if (payload && (payload.status >= 500 || payload.status === 0)) {
        flush(true);
      }
    } else if (eventType === 'console_error') {
      record('console_error', payload);
      flush(true);
    } else if (eventType === 'navigation' && payload && payload.url) {
      lastNavigationUrl = payload.url;
      record('navigation', payload);
    } else if (eventType === 'long_task') {
      record('long_task', payload);
    } else if (eventType === 'performance_sample') {
      record('performance_sample', payload);
    }
  });

  // Record initial navigation
  record('navigation', { url: window.location.href, title: document.title });

  // Feature #3: Rage-Click, Dead-Click & Universal Semantic Context Extraction
  const clickHistory = [];
  let rageCooldownUntil = 0;

  const INTERACTIVE_SELECTOR = [
    'button',
    'a[href]',
    'a',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="tab"]',
    '[role="switch"]',
    '[role="checkbox"]',
    '[role="radio"]',
    'input[type="submit"]',
    'input[type="button"]',
    'summary',
    '[tabindex="0"]',
    '[onclick]'
  ].join(', ');

  const CHROME_NOISE_REGEX = /^(like|unlike|comment|share|send|save|unsave|follow|following|unfollow|more|more options|close|cancel|ok|yes|no|submit|next|prev|back|reply|repost|retweet|bookmark|sponsored|verified|suggested for you|\d+[smhdwy])$/i;
  const COUNT_ONLY_REGEX = /^[\d,.]+\s*(likes?|comments?|shares?|views?|followers?|following|replies|retweets?)?$/i;
  const PERMALINK_PATH_REGEX = /\/(p|reel|reels|tv|status|watch|shorts|post|posts|product|products|dp|gp\/product|item|issues|pull|video)\b/i;

  function cleanText(str, maxLen) {
    if (!str || typeof str !== 'string') return '';
    const collapsed = str.replace(/\s+/g, ' ').trim();
    if (!collapsed) return '';
    if (maxLen && collapsed.length > maxLen) {
      return collapsed.substring(0, maxLen - 1).trimEnd() + '…';
    }
    return collapsed;
  }

  function safeHrefPath(rawHref) {
    if (!rawHref || typeof rawHref !== 'string') return '';
    const trimmed = rawHref.trim();
    if (!trimmed || trimmed.startsWith('javascript:') || trimmed === '#') return '';
    try {
      const parsed = new URL(trimmed, window.location.href);
      const pathAndQuery = parsed.pathname + (parsed.search || '');
      if (parsed.origin === window.location.origin) {
        return pathAndQuery;
      }
      return parsed.origin + parsed.pathname;
    } catch (_) {
      return trimmed.substring(0, 120);
    }
  }

  function findInteractiveTarget(el) {
    if (!el || !(el instanceof Element)) return null;
    const direct = el.closest(INTERACTIVE_SELECTOR);
    if (direct) return direct;
    // Climb up to find an interactive labeled wrapper (handles SVG/DIV icon controls)
    let curr = el;
    for (let depth = 0; depth < 6 && curr && curr !== document.body; depth++) {
      if (
        curr.getAttribute('aria-label') ||
        curr.getAttribute('title') ||
        curr.getAttribute('data-testid') ||
        curr.getAttribute('data-e2e')
      ) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return el;
  }

  function resolveDirectAttrs(node) {
    if (!node || !(node instanceof Element)) return '';
    const labelledBy = node.getAttribute('aria-labelledby');
    if (labelledBy) {
      const ref = document.getElementById(labelledBy.split(/\s+/)[0]);
      if (ref) {
        const refText = cleanText(ref.innerText || ref.textContent, 80);
        if (refText) return refText;
      }
    }
    return cleanText(
      node.getAttribute('aria-label') ||
      node.getAttribute('title') ||
      node.getAttribute('alt') ||
      node.getAttribute('data-tooltip') ||
      node.getAttribute('data-original-title') ||
      '',
      80
    );
  }

  function extractActionLabel(rawTarget, target) {
    // 1. Check raw clicked node -> interactive ancestor (catches nested <svg aria-label="Like">)
    let curr = rawTarget;
    for (let i = 0; i < 6 && curr; i++) {
      const direct = resolveDirectAttrs(curr);
      if (direct) return direct;
      if (curr === target) break;
      curr = curr.parentElement;
    }

    // 2. Check target's accessible/text attributes
    if (target) {
      const targetAttr = resolveDirectAttrs(target);
      if (targetAttr) return targetAttr;

      if (typeof target.value === 'string' && cleanText(target.value, 80)) {
        return cleanText(target.value, 80);
      }

      const visibleText = cleanText(target.innerText || target.textContent, 80);
      if (visibleText) return visibleText;

      // 3. Check descendants inside button/link (common for Instagram/YouTube icon wrappers)
      try {
        const labeledChild = target.querySelector('[aria-label], [title], img[alt], svg title');
        if (labeledChild) {
          const childLabel =
            labeledChild.tagName && labeledChild.tagName.toLowerCase() === 'title'
              ? cleanText(labeledChild.textContent, 80)
              : resolveDirectAttrs(labeledChild);
          if (childLabel) return childLabel;
        }
      } catch (_) {}

      // 4. Semantic attributes / link path fallback
      const testAttr = target.getAttribute('data-testid') || target.getAttribute('data-e2e') || target.getAttribute('data-qa') || target.getAttribute('name') || '';
      if (testAttr) return cleanText(testAttr.replace(/[-_]+/g, ' '), 60);

      if (target.tagName === 'A' && target.getAttribute('href')) {
        const hrefPath = safeHrefPath(target.getAttribute('href'));
        if (hrefPath && hrefPath !== '/') return hrefPath;
      }
    }
    return '';
  }

  function classifyTargetKind(target) {
    if (!target || !target.tagName) return 'element';
    const tag = target.tagName.toLowerCase();
    const role = (target.getAttribute('role') || '').toLowerCase();
    if (tag === 'a' || role === 'link') return 'link';
    if (role === 'menuitem') return 'menu_item';
    if (role === 'tab') return 'tab';
    if (role === 'switch' || role === 'checkbox' || role === 'radio') return role;
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'input';
    if (tag === 'button' || role === 'button') {
      const hasSvgOrImg = Boolean(target.querySelector && target.querySelector('svg, img'));
      const txt = cleanText(target.innerText || '', 40);
      return hasSvgOrImg && !txt ? 'icon_button' : 'button';
    }
    return tag;
  }

  function findEnclosingContainer(el) {
    if (!el || !(el instanceof Element)) return { node: null, type: 'page' };
    let curr = el.parentElement;
    const vh = window.innerHeight || 800;

    while (curr && curr !== document.body && curr !== document.documentElement) {
      const id = curr.id || '';
      if (id === 'root' || id === 'app' || id === '__next' || id.startsWith('mount_')) break;

      const tag = curr.tagName.toLowerCase();
      const role = (curr.getAttribute('role') || '').toLowerCase();
      const testId = (curr.getAttribute('data-testid') || curr.getAttribute('data-e2e') || '').toLowerCase();
      const cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';

      if (tag === 'article' || role === 'article' || /tweet|post|feed|status|reel/.test(testId)) {
        return { node: curr, type: 'post' };
      }
      if (tag === 'dialog' || role === 'dialog' || curr.getAttribute('aria-modal') === 'true') {
        return { node: curr, type: 'dialog' };
      }
      if (tag === 'form') {
        return { node: curr, type: 'form' };
      }
      if (tag === 'tr' || role === 'row') {
        return { node: curr, type: 'row' };
      }
      if (tag === 'li' || role === 'listitem') {
        return { node: curr, type: 'list_item' };
      }
      if (tag === 'section' || /card|product|video|item/.test(testId) || /\b(card|post|product|item|tile)\b/.test(cls)) {
        try {
          const rect = curr.getBoundingClientRect();
          if (rect.height <= vh * 2.5) {
            return { node: curr, type: 'card' };
          }
        } catch (_) {
          return { node: curr, type: 'card' };
        }
      }
      curr = curr.parentElement;
    }
    return { node: null, type: 'page' };
  }

  function extractEntityContext(target, actionLabel) {
    const { node: container, type: containerType } = findEnclosingContainer(target);
    const ctx = {
      container_type: containerType,
      entity_author: '',
      entity_title: '',
      entity_url: ''
    };

    if (!container) {
      ctx.entity_title = cleanText(document.title, 90);
      return ctx;
    }

    try {
      // 1. Author / Creator / Subject Header
      const authorSelectors = [
        'header a[href]',
        '[data-testid*="User-Name" i]',
        '[data-testid*="user" i] a',
        '[data-testid*="author" i]',
        '[data-testid*="channel" i]',
        'header strong',
        'header h2',
        'header h3',
        'a[href*="/@"]'
      ];
      for (const sel of authorSelectors) {
        const el = container.querySelector(sel);
        if (!el) continue;
        const candidate = cleanText(el.innerText || el.textContent, 60);
        if (candidate && !CHROME_NOISE_REGEX.test(candidate) && !COUNT_ONLY_REGEX.test(candidate) && candidate !== actionLabel) {
          ctx.entity_author = candidate;
          break;
        }
      }

      if (!ctx.entity_author) {
        const imgs = container.querySelectorAll('img[alt]');
        for (const img of imgs) {
          const alt = cleanText(img.getAttribute('alt'), 100);
          if (!alt) continue;
          const profileMatch = alt.match(/^(.+?)'s profile picture/i);
          if (profileMatch && profileMatch[1]) {
            ctx.entity_author = cleanText(profileMatch[1], 60);
            break;
          }
          const photoByMatch = alt.match(/^Photo by ([^.,]+)/i);
          if (photoByMatch && photoByMatch[1]) {
            ctx.entity_author = cleanText(photoByMatch[1], 60);
            break;
          }
        }
      }

      // Single-segment handle fallback from links in header (e.g., instagram.com/virat.kohli/)
      if (!ctx.entity_author) {
        const headerLinks = container.querySelectorAll('a[href]');
        for (const a of headerLinks) {
          const path = safeHrefPath(a.getAttribute('href'));
          if (/^\/[A-Za-z0-9._]{2,35}\/?$/.test(path) && !/^\/(explore|reels|direct|accounts|settings|home|login)\/?$/i.test(path)) {
            const linkText = cleanText(a.innerText || path.replace(/\//g, ''), 50);
            if (linkText && !CHROME_NOISE_REGEX.test(linkText)) {
              ctx.entity_author = linkText;
              break;
            }
          }
        }
      }

      // 2. Canonical Item / Post / Product Permalink URL
      const links = container.querySelectorAll('a[href]');
      let fallbackPath = '';
      for (const a of links) {
        const path = safeHrefPath(a.getAttribute('href'));
        if (!path || path === '/' || path === window.location.pathname) continue;
        if (PERMALINK_PATH_REGEX.test(path)) {
          ctx.entity_url = path;
          break;
        }
        const linkText = cleanText(a.innerText || '', 60);
        if (!fallbackPath && linkText !== ctx.entity_author) {
          fallbackPath = path;
        }
      }
      if (!ctx.entity_url && fallbackPath) {
        ctx.entity_url = fallbackPath;
      }

      // 3. Heading / Post Caption / Product Title
      const heading = container.querySelector('h1, h2, h3, h4, [role="heading"]');
      if (heading) {
        const hText = cleanText(heading.innerText || heading.textContent, 90);
        if (hText && hText !== ctx.entity_author && hText !== actionLabel && !CHROME_NOISE_REGEX.test(hText)) {
          ctx.entity_title = hText;
        }
      }

      if (!ctx.entity_title) {
        const textNodes = container.querySelectorAll(
          '[data-testid*="caption" i], [data-testid*="title" i], [data-testid*="tweetText" i], p, figcaption, span[dir="auto"], div[dir="auto"]'
        );
        for (const node of textNodes) {
          if (node.closest('button, [role="button"], nav')) continue;
          const t = cleanText(node.innerText || node.textContent, 100);
          if (!t || t.length < 4) continue;
          if (t === ctx.entity_author || t === actionLabel) continue;
          if (CHROME_NOISE_REGEX.test(t) || COUNT_ONLY_REGEX.test(t)) continue;
          ctx.entity_title = cleanText(t, 90);
          break;
        }
      }

      if (!ctx.entity_title) {
        const mediaNodes = container.querySelectorAll('img[alt], video[aria-label]');
        for (const m of mediaNodes) {
          const mLabel = cleanText(m.getAttribute('alt') || m.getAttribute('aria-label'), 90);
          if (!mLabel || /profile picture|avatar|logo|icon/i.test(mLabel)) continue;
          ctx.entity_title = mLabel;
          break;
        }
      }
    } catch (_) {
      // Never block user interaction on context scraping failure
    }

    return ctx;
  }

  function buildClickSemanticSummary(meta) {
    const label = meta.action_label || (meta.target_kind === 'link' && meta.target_href ? meta.target_href : '') || `<${meta.tag}>`;
    const parts = [`Clicked "${label}"`];

    if (meta.container_type === 'post') {
      if (meta.entity_author) {
        parts.push(`on post by ${meta.entity_author}`);
      } else {
        parts.push('on post');
      }
      if (meta.entity_title) {
        parts.push(`("${cleanText(meta.entity_title, 55)}")`);
      }
    } else if (meta.entity_title && meta.entity_author) {
      parts.push(`on ${meta.entity_author} — "${cleanText(meta.entity_title, 55)}"`);
    } else if (meta.entity_title) {
      parts.push(`on "${cleanText(meta.entity_title, 65)}"`);
    } else if (meta.entity_author) {
      parts.push(`for ${meta.entity_author}`);
    } else if (meta.container_type && meta.container_type !== 'page') {
      parts.push(`in ${meta.container_type.replace('_', ' ')}`);
    }

    const linkRef = meta.entity_url || meta.target_href;
    if (linkRef && linkRef !== label) {
      parts.push(`(${linkRef})`);
    }
    return parts.join(' ');
  }

  function extractInputLabel(inputEl) {
    const direct = resolveDirectAttrs(inputEl);
    if (direct) return direct;
    if (inputEl.id) {
      try {
        const lbl = document.querySelector(`label[for="${CSS.escape(inputEl.id)}"]`);
        if (lbl) {
          const txt = cleanText(lbl.innerText || lbl.textContent, 70);
          if (txt) return txt;
        }
      } catch (_) {}
    }
    const parentLabel = inputEl.closest('label');
    if (parentLabel) {
      const txt = cleanText(parentLabel.innerText || parentLabel.textContent, 70);
      if (txt) return txt;
    }
    return cleanText(
      inputEl.getAttribute('placeholder') ||
      inputEl.getAttribute('aria-placeholder') ||
      inputEl.name ||
      inputEl.id ||
      '',
      70
    );
  }

  document.addEventListener('click', (e) => {
    const rawTarget = e.target;
    if (!rawTarget || !(rawTarget instanceof Element)) return;
    if (rawTarget.closest('#reprolens-badge-container')) return;

    const target = findInteractiveTarget(rawTarget) || rawTarget;
    const selector = getCssSelector(target);
    const labelText = extractActionLabel(rawTarget, target);
    const targetKind = classifyTargetKind(target);
    const anchor = target.tagName === 'A' ? target : (target.closest && target.closest('a[href]'));
    const targetHref = anchor ? safeHrefPath(anchor.getAttribute('href')) : '';
    const entityCtx = extractEntityContext(target, labelText);

    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const xPct = Math.round((e.clientX / vw) * 1000) / 10;
    const yPct = Math.round((e.clientY / vh) * 1000) / 10;

    const clickMeta = {
      tag: target.tagName.toLowerCase(),
      selector: selector,
      text: labelText,
      action_label: labelText,
      target_kind: targetKind,
      target_href: targetHref,
      ariaLabel: target.getAttribute('aria-label') || labelText || '',
      dataTestId: target.getAttribute('data-testid') || target.getAttribute('data-e2e') || target.getAttribute('data-cy') || '',
      container_type: entityCtx.container_type,
      entity_author: entityCtx.entity_author,
      entity_title: entityCtx.entity_title,
      entity_url: entityCtx.entity_url,
      xPct: xPct,
      yPct: yPct
    };
    clickMeta.semantic_summary = buildClickSemanticSummary(clickMeta);

    // Self-healing + rich semantic click telemetry
    record('click', clickMeta);

    const now = Date.now();

    // 1. Rage Click Detection (>= 3 rapid clicks on same selector or 35px radius in 1100ms)
    clickHistory.push({ selector, x: e.clientX, y: e.clientY, ts: now });
    while (clickHistory.length > 0 && now - clickHistory[0].ts > 1100) {
      clickHistory.shift();
    }
    const matchingRecent = clickHistory.filter((c) => {
      const dist = Math.hypot(c.x - e.clientX, c.y - e.clientY);
      return c.selector === selector || dist <= 35;
    });

    if (matchingRecent.length >= 3 && now > rageCooldownUntil) {
      rageCooldownUntil = now + 3000;
      const readableTarget = labelText || entityCtx.entity_title || selector;
      record('rage_click', {
        selector: selector,
        text: labelText,
        action_label: labelText,
        entity_author: entityCtx.entity_author,
        entity_title: entityCtx.entity_title,
        entity_url: entityCtx.entity_url,
        semantic_summary: clickMeta.semantic_summary,
        click_count: matchingRecent.length,
        xPct: xPct,
        yPct: yPct,
        error_type: 'RageClickAnomaly',
        message: `Rage Click Detected: User clicked '${readableTarget}' ${matchingRecent.length}x rapidly (${clickMeta.semantic_summary})`
      });
      flush(true);
    }

    // 2. Dead Click Detection (actionable control triggers 0 DOM mutation & 0 network activity within 850ms)
    const actionable = rawTarget.closest(INTERACTIVE_SELECTOR);
    if (actionable && document.body) {
      const clickTs = now;
      const startUrl = window.location.href;
      let domMutated = false;

      const observer = new MutationObserver(() => {
        domMutated = true;
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });

      setTimeout(() => {
        observer.disconnect();
        const navChanged = window.location.href !== startUrl || window.location.href !== lastNavigationUrl;
        const netOccurred = lastNetworkActivityTs >= clickTs - 50;

        if (!domMutated && !netOccurred && !navChanged) {
          const readableTarget = labelText || entityCtx.entity_title || selector;
          record('dead_click', {
            selector: selector,
            text: labelText,
            action_label: labelText,
            entity_author: entityCtx.entity_author,
            entity_title: entityCtx.entity_title,
            entity_url: entityCtx.entity_url,
            semantic_summary: clickMeta.semantic_summary,
            xPct: xPct,
            yPct: yPct,
            error_type: 'SilentUXFreeze',
            message: `Dead Click / Frozen UI: '${readableTarget}' produced zero DOM mutation or network call within 850ms (${clickMeta.semantic_summary})`
          });
          flush(true);
        }
        lastNavigationUrl = window.location.href;
      }, 850);
    }
  }, true);

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t && t.tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) {
      const fieldLabel = extractInputLabel(t);
      const isSecret = t.type === 'password' || SENSITIVE_KEY_REGEX.test(t.name || t.id || fieldLabel || '');
      const entityCtx = extractEntityContext(t, fieldLabel);
      const safeValue = isSecret ? REDACTED : sanitizeString(t.value);
      const wherePart = entityCtx.entity_title ? ` in "${cleanText(entityCtx.entity_title, 55)}"` : '';
      record('input', {
        selector: getCssSelector(t),
        name: fieldLabel || t.name || t.id || '',
        field_label: fieldLabel,
        container_type: entityCtx.container_type,
        entity_title: entityCtx.entity_title,
        semantic_summary: `Entered value in "${fieldLabel || t.tagName.toLowerCase()}"${wherePart}`,
        value: safeValue
      });
    }
  }, true);

  window.addEventListener('error', (e) => {
    record('js_exception', {
      message: e.message || 'Script error',
      filename: e.filename,
      lineno: e.lineno,
      stack: e.error && e.error.stack ? e.error.stack : ''
    });
    flush(true);
  });

  window.addEventListener('unhandledrejection', (e) => {
    record('js_exception', {
      message: 'Unhandled Promise Rejection: ' + (e.reason ? (e.reason.message || String(e.reason)) : '')
    });
    flush(true);
  });

  // Periodic stream flush only when Flight Recorder Mode is disabled
  setInterval(() => flush(false), 4000);

  function updateBadgeChaosIndicator() {
    const dot = document.getElementById('reprolens-badge-dot');
    const sub = document.getElementById('reprolens-badge-status');
    if (!dot || !sub) return;
    const chaosOn = chaosState.chaosForce500 || chaosState.chaosLatencyMs > 0;
    if (chaosOn && chaosState.flightRecorderMode) {
      dot.style.background = '#f59e0b';
      sub.textContent = 'CHAOS + 45s';
      sub.style.color = '#fbbf24';
    } else if (chaosOn) {
      dot.style.background = '#f59e0b';
      sub.textContent = 'CHAOS ON';
      sub.style.color = '#fbbf24';
    } else if (chaosState.flightRecorderMode) {
      dot.style.background = '#38bdf8';
      sub.textContent = 'BLACK-BOX 45s';
      sub.style.color = '#7dd3fc';
    } else {
      dot.style.background = '#10b981';
      sub.textContent = 'Active';
      sub.style.color = '#94a3b8';
    }
  }

  // Floating badge UI + extension presence marker
  function renderBadge() {
    if (document.getElementById('reprolens-badge-container')) return;

    const marker = document.createElement('div');
    marker.id = 'reprolens-extension-badge';
    marker.style.display = 'none';
    document.body.appendChild(marker);

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
      background: rgba(12, 14, 22, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      padding: 6px 12px;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #f8fafc;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
      cursor: pointer;
      user-select: none;
    `;
    container.innerHTML = `
      <span id="reprolens-badge-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
      <span style="font-weight:600;">ReproLens</span>
      <span id="reprolens-badge-status" style="color:#94a3b8; font-size:11px;">Active</span>
    `;

    container.addEventListener('click', () => {
      record('click', {
        action: 'user_triggered_manual_bug_snapshot',
        action_label: 'Manual ReproLens Snapshot',
        text: 'Manual ReproLens Snapshot',
        semantic_summary: 'Triggered manual ReproLens bug snapshot on "' + (document.title || window.location.pathname) + '" (' + window.location.pathname + ')'
      });
      flush(true);
      alert('ReproLens snapshot transmitted! Case file synchronized to Developer Dashboard.');
    });

    document.body.appendChild(container);
    updateBadgeChaosIndicator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBadge);
  } else {
    renderBadge();
  }
})();
