/**
 * ReproLens Web Client SDK v1.0.0
 * Zero-dependency client-side telemetry, session capture,
 * and client-side privacy sanitization engine.
 */
(function (root) {
  'use strict';

  var DEFAULT_ENDPOINT = 'http://localhost:8000/api/v1/ingest';
  var BATCH_INTERVAL_MS = 3000;
  var REDACTED = '[REDACTED]';

  // Client-side Privacy & Redaction Patterns
  var SENSITIVE_KEY_REGEX = /pass(word)?|secret|token|bearer|auth|api[-_]?key|credit[-_]?card|card[-_]?number|cvv|cvc|ssn|pin/i;
  var EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  var JWT_REGEX = /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/g;
  var CC_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

  function isLuhnValid(ccStr) {
    var digits = ccStr.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    var sum = 0;
    var shouldDouble = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = parseInt(digits.charAt(i), 10);
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
    str = str.replace(JWT_REGEX, REDACTED);
    str = str.replace(EMAIL_REGEX, REDACTED);
    str = str.replace(CC_REGEX, function (match) {
      return isLuhnValid(match) ? REDACTED : match;
    });
    return str;
  }

  function sanitizePayload(obj, keyName) {
    if (obj === null || obj === undefined) return obj;
    if (keyName && SENSITIVE_KEY_REGEX.test(keyName)) {
      return REDACTED;
    }
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(function (item) { return sanitizePayload(item, keyName); });
    }
    if (typeof obj === 'object') {
      var clean = {};
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          clean[k] = sanitizePayload(obj[k], k);
        }
      }
      return clean;
    }
    return obj;
  }

  function cleanText(str, maxLen) {
    if (!str || typeof str !== 'string') return '';
    var collapsed = str.replace(/\s+/g, ' ').trim();
    if (!collapsed) return '';
    if (maxLen && collapsed.length > maxLen) {
      return collapsed.substring(0, maxLen - 1).replace(/\s+$/, '') + '…';
    }
    return collapsed;
  }

  function safeHrefPath(rawHref) {
    if (!rawHref || typeof rawHref !== 'string') return '';
    var trimmed = rawHref.trim();
    if (!trimmed || trimmed.indexOf('javascript:') === 0 || trimmed === '#') return '';
    try {
      var parsed = new URL(trimmed, window.location.href);
      if (parsed.origin === window.location.origin) {
        return parsed.pathname + (parsed.search || '');
      }
      return parsed.origin + parsed.pathname;
    } catch (err) {
      return trimmed.substring(0, 120);
    }
  }

  var INTERACTIVE_SELECTOR = 'button, a[href], a, [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], input[type="submit"], input[type="button"], summary, [tabindex="0"], [onclick]';
  var CHROME_NOISE_REGEX = /^(like|unlike|comment|share|send|save|unsave|follow|following|unfollow|more|more options|close|cancel|ok|yes|no|submit|next|prev|back|reply|repost|retweet|bookmark|sponsored|verified|suggested for you|\d+[smhdwy])$/i;
  var COUNT_ONLY_REGEX = /^[\d,.]+\s*(likes?|comments?|shares?|views?|followers?|following|replies|retweets?)?$/i;
  var PERMALINK_PATH_REGEX = /\/(p|reel|reels|tv|status|watch|shorts|post|posts|product|products|dp|gp\/product|item|issues|pull|video)\b/i;

  function findInteractiveTarget(el) {
    if (!el || !(el instanceof Element)) return null;
    if (el.closest) {
      var direct = el.closest(INTERACTIVE_SELECTOR);
      if (direct) return direct;
    }
    var curr = el;
    for (var depth = 0; depth < 6 && curr && curr !== document.body; depth++) {
      if (curr.getAttribute('aria-label') || curr.getAttribute('title') || curr.getAttribute('data-testid') || curr.getAttribute('data-e2e')) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return el;
  }

  function resolveDirectAttrs(node) {
    if (!node || !(node instanceof Element)) return '';
    var labelledBy = node.getAttribute('aria-labelledby');
    if (labelledBy) {
      var ref = document.getElementById(labelledBy.split(/\s+/)[0]);
      if (ref) {
        var refText = cleanText(ref.innerText || ref.textContent, 80);
        if (refText) return refText;
      }
    }
    return cleanText(
      node.getAttribute('aria-label') ||
      node.getAttribute('title') ||
      node.getAttribute('alt') ||
      node.getAttribute('data-tooltip') ||
      '',
      80
    );
  }

  function extractActionLabel(rawTarget, target) {
    var curr = rawTarget;
    for (var i = 0; i < 6 && curr; i++) {
      var direct = resolveDirectAttrs(curr);
      if (direct) return direct;
      if (curr === target) break;
      curr = curr.parentElement;
    }
    if (target) {
      var targetAttr = resolveDirectAttrs(target);
      if (targetAttr) return targetAttr;
      if (typeof target.value === 'string' && cleanText(target.value, 80)) {
        return cleanText(target.value, 80);
      }
      var visibleText = cleanText(target.innerText || target.textContent, 80);
      if (visibleText) return visibleText;
      try {
        var labeledChild = target.querySelector('[aria-label], [title], img[alt], svg title');
        if (labeledChild) {
          var childLabel = labeledChild.tagName && labeledChild.tagName.toLowerCase() === 'title'
            ? cleanText(labeledChild.textContent, 80)
            : resolveDirectAttrs(labeledChild);
          if (childLabel) return childLabel;
        }
      } catch (err) {}
      var testAttr = target.getAttribute('data-testid') || target.getAttribute('data-e2e') || target.getAttribute('data-qa') || target.getAttribute('name') || '';
      if (testAttr) return cleanText(testAttr.replace(/[-_]+/g, ' '), 60);
      if (target.tagName === 'A' && target.getAttribute('href')) {
        var hrefPath = safeHrefPath(target.getAttribute('href'));
        if (hrefPath && hrefPath !== '/') return hrefPath;
      }
    }
    return '';
  }

  function extractEntityContext(target, actionLabel) {
    var container = null;
    var containerType = 'page';
    var curr = target ? target.parentElement : null;
    var vh = window.innerHeight || 800;

    while (curr && curr !== document.body && curr !== document.documentElement) {
      var cid = curr.id || '';
      if (cid === 'root' || cid === 'app' || cid === '__next' || cid.indexOf('mount_') === 0) break;
      var tag = curr.tagName.toLowerCase();
      var role = (curr.getAttribute('role') || '').toLowerCase();
      var testId = (curr.getAttribute('data-testid') || curr.getAttribute('data-e2e') || '').toLowerCase();
      var cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';

      if (tag === 'article' || role === 'article' || /tweet|post|feed|status|reel/.test(testId)) {
        container = curr; containerType = 'post'; break;
      }
      if (tag === 'dialog' || role === 'dialog' || curr.getAttribute('aria-modal') === 'true') {
        container = curr; containerType = 'dialog'; break;
      }
      if (tag === 'form') {
        container = curr; containerType = 'form'; break;
      }
      if (tag === 'tr' || role === 'row') {
        container = curr; containerType = 'row'; break;
      }
      if (tag === 'li' || role === 'listitem') {
        container = curr; containerType = 'list_item'; break;
      }
      if (tag === 'section' || /card|product|video|item/.test(testId) || /\b(card|post|product|item|tile)\b/.test(cls)) {
        try {
          if (curr.getBoundingClientRect().height <= vh * 2.5) {
            container = curr; containerType = 'card'; break;
          }
        } catch (err) {
          container = curr; containerType = 'card'; break;
        }
      }
      curr = curr.parentElement;
    }

    var ctx = { container_type: containerType, entity_author: '', entity_title: '', entity_url: '' };
    if (!container) {
      ctx.entity_title = cleanText(document.title, 90);
      return ctx;
    }

    try {
      var authorSelectors = ['header a[href]', '[data-testid*="User-Name" i]', '[data-testid*="user" i] a', '[data-testid*="author" i]', '[data-testid*="channel" i]', 'header strong', 'header h2', 'header h3', 'a[href*="/@"]'];
      for (var s = 0; s < authorSelectors.length; s++) {
        var el = container.querySelector(authorSelectors[s]);
        if (!el) continue;
        var candidate = cleanText(el.innerText || el.textContent, 60);
        if (candidate && !CHROME_NOISE_REGEX.test(candidate) && !COUNT_ONLY_REGEX.test(candidate) && candidate !== actionLabel) {
          ctx.entity_author = candidate;
          break;
        }
      }
      if (!ctx.entity_author) {
        var imgs = container.querySelectorAll('img[alt]');
        for (var im = 0; im < imgs.length; im++) {
          var alt = cleanText(imgs[im].getAttribute('alt'), 100);
          var prof = alt.match(/^(.+?)'s profile picture/i);
          if (prof && prof[1]) { ctx.entity_author = cleanText(prof[1], 60); break; }
          var pby = alt.match(/^Photo by ([^.,]+)/i);
          if (pby && pby[1]) { ctx.entity_author = cleanText(pby[1], 60); break; }
        }
      }
      var links = container.querySelectorAll('a[href]');
      var fallbackPath = '';
      for (var l = 0; l < links.length; l++) {
        var path = safeHrefPath(links[l].getAttribute('href'));
        if (!path || path === '/' || path === window.location.pathname) continue;
        if (PERMALINK_PATH_REGEX.test(path)) { ctx.entity_url = path; break; }
        if (!fallbackPath && cleanText(links[l].innerText || '', 60) !== ctx.entity_author) fallbackPath = path;
      }
      if (!ctx.entity_url && fallbackPath) ctx.entity_url = fallbackPath;

      var heading = container.querySelector('h1, h2, h3, h4, [role="heading"]');
      if (heading) {
        var hText = cleanText(heading.innerText || heading.textContent, 90);
        if (hText && hText !== ctx.entity_author && hText !== actionLabel && !CHROME_NOISE_REGEX.test(hText)) {
          ctx.entity_title = hText;
        }
      }
      if (!ctx.entity_title) {
        var textNodes = container.querySelectorAll('[data-testid*="caption" i], [data-testid*="title" i], [data-testid*="tweetText" i], p, figcaption, span[dir="auto"], div[dir="auto"]');
        for (var tn = 0; tn < textNodes.length; tn++) {
          var node = textNodes[tn];
          if (node.closest && node.closest('button, [role="button"], nav')) continue;
          var txt = cleanText(node.innerText || node.textContent, 100);
          if (!txt || txt.length < 4 || txt === ctx.entity_author || txt === actionLabel) continue;
          if (CHROME_NOISE_REGEX.test(txt) || COUNT_ONLY_REGEX.test(txt)) continue;
          ctx.entity_title = cleanText(txt, 90);
          break;
        }
      }
    } catch (err) {}
    return ctx;
  }

  function buildClickSummary(meta) {
    var label = meta.action_label || (meta.target_href ? meta.target_href : '') || ('<' + meta.tag + '>');
    var parts = ['Clicked "' + label + '"'];
    if (meta.container_type === 'post') {
      parts.push(meta.entity_author ? ('on post by ' + meta.entity_author) : 'on post');
      if (meta.entity_title) parts.push('("' + cleanText(meta.entity_title, 55) + '")');
    } else if (meta.entity_title && meta.entity_author) {
      parts.push('on ' + meta.entity_author + ' — "' + cleanText(meta.entity_title, 55) + '"');
    } else if (meta.entity_title) {
      parts.push('on "' + cleanText(meta.entity_title, 65) + '"');
    } else if (meta.entity_author) {
      parts.push('for ' + meta.entity_author);
    } else if (meta.container_type && meta.container_type !== 'page') {
      parts.push('in ' + meta.container_type.replace('_', ' '));
    }
    var linkRef = meta.entity_url || meta.target_href;
    if (linkRef && linkRef !== label) parts.push('(' + linkRef + ')');
    return parts.join(' ');
  }

  function getCssSelector(el) {
    if (!el || !(el instanceof Element)) return '';
    if (el.id) return '#' + el.id;
    var path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      var selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        var sib = el, nth = 1;
        while ((sib = sib.previousElementSibling)) {
          if (sib.nodeName.toLowerCase() === selector) nth++;
        }
        if (nth !== 1) selector += ':nth-of-type(' + nth + ')';
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(' > ');
  }

  function ReproLensClient() {
    this.projectKey = '';
    this.endpoint = DEFAULT_ENDPOINT;
    this.sessionToken = 'sess_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    this.sessionStartTime = Date.now();
    this.eventQueue = [];
    this.isRecording = false;
    this.flushTimer = null;
  }

  ReproLensClient.prototype.init = function (options) {
    var opts = options || {};
    this.projectKey = opts.projectKey || this.projectKey;
    this.endpoint = opts.endpoint || this.endpoint;

    if (!this.projectKey) {
      var scriptTag = document.currentScript || document.querySelector('script[data-project-key]');
      if (scriptTag) {
        this.projectKey = scriptTag.getAttribute('data-project-key') || '';
        if (scriptTag.getAttribute('data-endpoint')) {
          this.endpoint = scriptTag.getAttribute('data-endpoint');
        }
      }
    }

    if (!this.projectKey) {
      console.warn('[ReproLens] Project Key not specified. Capture is idle.');
      return;
    }

    this.start();
  };

  ReproLensClient.prototype.start = function () {
    if (this.isRecording) return;
    this.isRecording = true;
    this.sessionStartTime = Date.now();

    this._recordEvent('navigation', {
      url: window.location.href,
      pathname: window.location.pathname,
      title: document.title
    });

    this._attachListeners();
    this._patchNetwork();
    this._startBatchTimer();

    console.log('[ReproLens] Recording initiated for session:', this.sessionToken);
  };

  ReproLensClient.prototype._recordEvent = function (type, payload) {
    if (!this.isRecording) return;
    var offsetMs = Date.now() - this.sessionStartTime;
    var sanitized = sanitizePayload(payload);

    this.eventQueue.push({
      timestamp_offset_ms: offsetMs,
      event_type: type,
      payload: sanitized,
      is_sanitized: true
    });
  };

  ReproLensClient.prototype._attachListeners = function () {
    var self = this;

    // 1. Clicks (Universal Semantic Action + Post/Entity Context)
    document.addEventListener('click', function (e) {
      var rawTarget = e.target;
      if (!rawTarget || !(rawTarget instanceof Element)) return;
      var target = findInteractiveTarget(rawTarget) || rawTarget;
      var text = extractActionLabel(rawTarget, target);
      var anchor = target.tagName === 'A' ? target : (target.closest && target.closest('a[href]'));
      var targetHref = anchor ? safeHrefPath(anchor.getAttribute('href')) : '';
      var entityCtx = extractEntityContext(target, text);
      var clickMeta = {
        tag: target.tagName ? target.tagName.toLowerCase() : '',
        id: target.id || '',
        className: typeof target.className === 'string' ? target.className : '',
        text: text,
        action_label: text,
        target_href: targetHref,
        ariaLabel: target.getAttribute('aria-label') || text || '',
        dataTestId: target.getAttribute('data-testid') || target.getAttribute('data-e2e') || '',
        selector: getCssSelector(target),
        role: target.getAttribute('role') || '',
        container_type: entityCtx.container_type,
        entity_author: entityCtx.entity_author,
        entity_title: entityCtx.entity_title,
        entity_url: entityCtx.entity_url
      };
      clickMeta.semantic_summary = buildClickSummary(clickMeta);
      self._recordEvent('click', clickMeta);
    }, true);

    // 2. Inputs
    document.addEventListener('change', function (e) {
      var target = e.target;
      if (!target || !target.tagName) return;
      var tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        var inputType = target.type || 'text';
        var fieldLabel = resolveDirectAttrs(target) || cleanText(target.getAttribute('placeholder') || target.name || target.id || '', 70);
        var isSensitive = inputType === 'password' || SENSITIVE_KEY_REGEX.test(target.name || target.id || fieldLabel || '');
        var val = isSensitive ? REDACTED : target.value;
        var entityCtx = extractEntityContext(target, fieldLabel);
        var wherePart = entityCtx.entity_title ? (' in "' + cleanText(entityCtx.entity_title, 55) + '"') : '';
        self._recordEvent('input', {
          tag: tag,
          name: fieldLabel || target.name || target.id || '',
          field_label: fieldLabel,
          container_type: entityCtx.container_type,
          entity_title: entityCtx.entity_title,
          semantic_summary: 'Entered value in "' + (fieldLabel || tag) + '"' + wherePart,
          selector: getCssSelector(target),
          value: sanitizeString(val)
        });
      }
    }, true);

    // 2b. SPA Route Navigation
    var lastSpaHref = window.location.href;
    function recordSpaNav() {
      var href = window.location.href;
      if (href && href !== lastSpaHref) {
        lastSpaHref = href;
        self._recordEvent('navigation', { url: href, pathname: window.location.pathname, title: document.title });
      }
    }
    if (window.history && typeof window.history.pushState === 'function') {
      var origPush = window.history.pushState;
      window.history.pushState = function () {
        var r = origPush.apply(this, arguments);
        setTimeout(recordSpaNav, 80);
        return r;
      };
    }
    window.addEventListener('popstate', recordSpaNav);
    window.addEventListener('hashchange', recordSpaNav);

    // 3. Uncaught JavaScript Errors
    window.addEventListener('error', function (e) {
      self._recordEvent('js_exception', {
        message: e.message || 'Script error',
        filename: e.filename || '',
        lineno: e.lineno || 0,
        colno: e.colno || 0,
        stack: e.error && e.error.stack ? e.error.stack : ''
      });
      self.flush(); // Flush immediately on error
    });

    // 4. Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', function (e) {
      var reason = e.reason;
      var msg = typeof reason === 'object' && reason ? reason.message || JSON.stringify(reason) : String(reason);
      var stack = reason && reason.stack ? reason.stack : '';
      self._recordEvent('js_exception', {
        message: 'Unhandled Promise Rejection: ' + msg,
        stack: stack
      });
      self.flush();
    });

    // 5. Console Error Patching
    var originalConsoleError = console.error;
    console.error = function () {
      var args = Array.prototype.slice.call(arguments);
      var msg = args.map(function (a) {
        return typeof a === 'object' ? JSON.stringify(a) : String(a);
      }).join(' ');
      self._recordEvent('console_error', {
        message: sanitizeString(msg),
        level: 'error'
      });
      originalConsoleError.apply(console, arguments);
    };
  };

  ReproLensClient.prototype._patchNetwork = function () {
    var self = this;

    // 1. Monkey-patch window.fetch
    if (window.fetch) {
      var origFetch = window.fetch;
      window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        var method = (init && init.method) || 'GET';
        var startTime = Date.now();

        return origFetch.apply(window, arguments).then(function (response) {
          var duration = Date.now() - startTime;
          var clone = response.clone();

          clone.text().then(function (bodyText) {
            var parsedBody = null;
            try { parsedBody = JSON.parse(bodyText); } catch (err) { parsedBody = bodyText.substring(0, 500); }
            self._recordEvent('network_request', {
              url: url,
              method: method,
              status: response.status,
              status_text: response.statusText,
              duration_ms: duration,
              response_body: parsedBody
            });
            if (response.status >= 500) {
              self.flush();
            }
          }).catch(function () {});

          return response;
        }).catch(function (fetchErr) {
          var duration = Date.now() - startTime;
          self._recordEvent('network_request', {
            url: url,
            method: method,
            status: 0,
            status_text: 'Failed to fetch: ' + (fetchErr.message || ''),
            duration_ms: duration
          });
          self.flush();
          throw fetchErr;
        });
      };
    }

    // 2. Monkey-patch XMLHttpRequest
    if (window.XMLHttpRequest) {
      var origOpen = XMLHttpRequest.prototype.open;
      var origSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url) {
        this._reprolens_meta = { method: method, url: url, startTime: 0 };
        return origOpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function () {
        var xhr = this;
        if (xhr._reprolens_meta) {
          xhr._reprolens_meta.startTime = Date.now();
          xhr.addEventListener('loadend', function () {
            var duration = Date.now() - xhr._reprolens_meta.startTime;
            var bodyText = xhr.responseText ? xhr.responseText.substring(0, 500) : '';
            self._recordEvent('network_request', {
              url: xhr._reprolens_meta.url,
              method: xhr._reprolens_meta.method,
              status: xhr.status,
              status_text: xhr.statusText,
              duration_ms: duration,
              response_body: bodyText
            });
            if (xhr.status >= 500) {
              self.flush();
            }
          });
        }
        return origSend.apply(this, arguments);
      };
    }
  };

  ReproLensClient.prototype._startBatchTimer = function () {
    var self = this;
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(function () {
      self.flush();
    }, BATCH_INTERVAL_MS);
  };

  ReproLensClient.prototype.flush = function () {
    if (!this.eventQueue.length || !this.projectKey) return;

    var eventsToSend = this.eventQueue.slice();
    this.eventQueue = [];

    var payload = {
      api_key: this.projectKey,
      session_token: this.sessionToken,
      user_agent: navigator.userAgent,
      browser_name: 'Browser',
      os_name: navigator.platform || 'Unknown OS',
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1.0,
      url: window.location.href,
      duration_ms: Date.now() - this.sessionStartTime,
      source: 'web_sdk',
      events: eventsToSend
    };

    var payloadStr = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([payloadStr], { type: 'application/json' });
        var success = navigator.sendBeacon(this.endpoint, blob);
        if (success) return;
      } catch (e) {}
    }

    // Fallback to fetch
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payloadStr);
    } catch (e) {}
  };

  ReproLensClient.prototype.captureError = function (error, context) {
    this._recordEvent('js_exception', {
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : '',
      context: context || {}
    });
    this.flush();
  };

  // Expose global instance
  var instance = new ReproLensClient();
  root.ReproLens = instance;

  // Auto-init on script load if data-project-key present
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { instance.init(); });
    } else {
      instance.init();
    }
  }
})(typeof window !== 'undefined' ? window : this);
