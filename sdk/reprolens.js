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

    // 1. Clicks
    document.addEventListener('click', function (e) {
      var target = e.target;
      var text = (target.innerText || target.value || target.getAttribute('aria-label') || '').trim().substring(0, 80);
      self._recordEvent('click', {
        tag: target.tagName ? target.tagName.toLowerCase() : '',
        id: target.id || '',
        className: target.className || '',
        text: text,
        selector: getCssSelector(target),
        role: target.getAttribute('role') || ''
      });
    }, true);

    // 2. Inputs
    document.addEventListener('change', function (e) {
      var target = e.target;
      if (!target || !target.tagName) return;
      var tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        var inputType = target.type || 'text';
        var isSensitive = inputType === 'password' || SENSITIVE_KEY_REGEX.test(target.name || target.id || '');
        var val = isSensitive ? REDACTED : target.value;
        self._recordEvent('input', {
          tag: tag,
          name: target.name || target.id || '',
          selector: getCssSelector(target),
          value: sanitizeString(val)
        });
      }
    }, true);

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
