// ReproLens MAIN-World Interceptor & Chaos Simulator (Manifest V3)
// Executes directly in the page JS context so fetch/XHR HTTP errors and console.error
// are captured on ANY external website without CSP inline-script violations.
(function () {
  'use strict';

  // 0. ABSOLUTE DASHBOARD EXCLUSION: Never hook or inject into ReproLens Dashboard itself
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

  if (window.__REPROLENS_MAIN_WORLD_HOOKED__) return;
  window.__REPROLENS_MAIN_WORLD_HOOKED__ = true;

  let chaosConfig = {
    latencyMs: 0,
    force500: false
  };

  // Sync Chaos settings from isolated content script
  window.addEventListener('message', function (event) {
    if (event.source !== window || !event.data) return;
    if (event.data.source === 'REPROLENS_EXT_CONFIG' && event.data.config) {
      chaosConfig = {
        latencyMs: Number(event.data.config.chaosLatencyMs) || 0,
        force500: Boolean(event.data.config.chaosForce500)
      };
    }
  });

  function emitToContent(eventType, payload) {
    try {
      window.postMessage(
        {
          source: 'REPROLENS_MAIN_WORLD',
          eventType: eventType,
          payload: payload
        },
        '*'
      );
    } catch (_) {
      // Never break host page
    }
  }

  function isReproLensBackend(url) {
    if (typeof window !== 'undefined' && window.location) {
      const port = String(window.location.port || '');
      const host = String(window.location.hostname || '').toLowerCase();
      if (
        port === '5173' ||
        port === '8000' ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.includes('reprolens')
      ) {
        return true;
      }
    }
    if (!url) return false;
    const urlStr = String(url).toLowerCase();
    return (
      urlStr.includes(':8000') ||
      urlStr.includes(':5173') ||
      urlStr.includes('localhost') ||
      urlStr.includes('127.0.0.1') ||
      urlStr.startsWith('/api/') ||
      urlStr.includes('/api/v1/') ||
      urlStr.includes('/github/')
    );
  }

  // 1. Patch console.error
  const origConsoleError = console.error;
  console.error = function (...args) {
    try {
      const msg = args
        .map((a) => {
          if (a instanceof Error) return a.stack || a.message;
          if (typeof a === 'object') {
            try { return JSON.stringify(a); } catch (_) { return String(a); }
          }
          return String(a);
        })
        .join(' ')
        .substring(0, 1200);

      emitToContent('console_error', {
        message: msg,
        level: 'error'
      });
    } catch (_) {}
    return origConsoleError.apply(console, args);
  };

  // 2. Patch window.fetch + Chaos Simulator
  if (typeof window.fetch === 'function') {
    const origFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = (init && init.method) || (input && input.method) || 'GET';

      if (isReproLensBackend(url)) {
        return origFetch(input, init);
      }

      emitToContent('network_activity', { url: url, method: method, ts: Date.now() });
      const startTime = Date.now();

      // Chaos: Optional Latency Injection
      if (chaosConfig.latencyMs > 0) {
        await new Promise((r) => setTimeout(r, chaosConfig.latencyMs));
      }

      // Chaos: Optional Force HTTP 500 Drop on API/Mutating endpoints
      const isApiTarget = method.toUpperCase() !== 'GET' || url.includes('/api/') || url.includes('/graphql');
      if (chaosConfig.force500 && isApiTarget) {
        const duration = Date.now() - startTime;
        const chaosBody = JSON.stringify({
          success: false,
          chaos: true,
          error: 'ReproLens Chaos Simulator: Forced HTTP 500 Service Drop'
        });
        emitToContent('network_request', {
          url: url,
          method: method,
          status: 500,
          status_text: 'Internal Server Error (Chaos Drop)',
          duration_ms: duration,
          response_body: chaosBody
        });
        return new Response(chaosBody, {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const response = await origFetch(input, init);
        const duration = Date.now() - startTime;
        let responsePreview = '';
        try {
          const cloned = response.clone();
          responsePreview = (await cloned.text()).substring(0, 500);
        } catch (_) {}

        emitToContent('network_request', {
          url: url,
          method: method,
          status: response.status,
          status_text: response.statusText || '',
          duration_ms: duration,
          response_body: responsePreview
        });
        return response;
      } catch (err) {
        const duration = Date.now() - startTime;
        emitToContent('network_request', {
          url: url,
          method: method,
          status: 0,
          status_text: 'Network Error: ' + (err && err.message ? err.message : 'Failed to fetch'),
          duration_ms: duration
        });
        throw err;
      }
    };
  }

  // 3. Patch XMLHttpRequest
  if (typeof window.XMLHttpRequest === 'function') {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__reprolensMeta = { method: method || 'GET', url: String(url || ''), startTime: 0 };
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      const xhr = this;
      if (xhr.__reprolensMeta && !isReproLensBackend(xhr.__reprolensMeta.url)) {
        xhr.__reprolensMeta.startTime = Date.now();
        emitToContent('network_activity', {
          url: xhr.__reprolensMeta.url,
          method: xhr.__reprolensMeta.method,
          ts: Date.now()
        });

        xhr.addEventListener('loadend', function () {
          const duration = Date.now() - xhr.__reprolensMeta.startTime;
          let preview = '';
          try {
            if (!xhr.responseType || xhr.responseType === 'text') {
              preview = (xhr.responseText || '').substring(0, 500);
            }
          } catch (_) {}

          emitToContent('network_request', {
            url: xhr.__reprolensMeta.url,
            method: xhr.__reprolensMeta.method,
            status: xhr.status,
            status_text: xhr.statusText || '',
            duration_ms: duration,
            response_body: preview
          });
        });
      }
      return origSend.apply(this, arguments);
    };
  }

  // 4. Capture SPA Route / Modal URL Changes (Instagram /p/..., YouTube /watch, React Router)
  let lastEmittedHref = window.location.href;
  function notifySpaNavigation() {
    try {
      const currentHref = window.location.href;
      if (currentHref && currentHref !== lastEmittedHref) {
        lastEmittedHref = currentHref;
        setTimeout(() => {
          emitToContent('navigation', {
            url: window.location.href,
            title: document.title || ''
          });
        }, 120);
      }
    } catch (_) {}
  }

  if (window.history && typeof window.history.pushState === 'function') {
    const origPushState = window.history.pushState;
    window.history.pushState = function () {
      const res = origPushState.apply(this, arguments);
      notifySpaNavigation();
      return res;
    };
  }
  if (window.history && typeof window.history.replaceState === 'function') {
    const origReplaceState = window.history.replaceState;
    window.history.replaceState = function () {
      const res = origReplaceState.apply(this, arguments);
      notifySpaNavigation();
      return res;
    };
  }
  window.addEventListener('popstate', notifySpaNavigation);
  window.addEventListener('hashchange', notifySpaNavigation);

  // 5. Performance & Long Task Radar (Blocks > 50ms)
  try {
    if (typeof PerformanceObserver === 'function') {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          emitToContent('long_task', {
            duration_ms: Math.round(entry.duration),
            start_time: Math.round(entry.startTime),
            name: entry.name
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  } catch (_) {}

  // 6. Memory & Frame Rate Radar (Sampled every 5s)
  try {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let currentFps = 60;

    function countFrames(now) {
      frameCount++;
      const delta = now - lastFrameTime;
      if (delta >= 1000) {
        currentFps = Math.round((frameCount * 1000) / delta);
        frameCount = 0;
        lastFrameTime = now;
      }
      requestAnimationFrame(countFrames);
    }
    requestAnimationFrame(countFrames);

    setInterval(() => {
      let heapUsedMb = 0;
      let heapTotalMb = 0;
      if (window.performance && window.performance.memory) {
        const mem = window.performance.memory;
        heapUsedMb = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
        heapTotalMb = Math.round((mem.totalJSHeapSize / (1024 * 1024)) * 10) / 10;
      }
      emitToContent('performance_sample', {
        heap_used_mb: heapUsedMb,
        heap_total_mb: heapTotalMb,
        fps: currentFps,
        ts: Date.now()
      });
    }, 5000);
  } catch (_) {}
})();
