// ReproLens Background Service Worker (Manifest V3)
const DEFAULT_ENDPOINT = "http://localhost:8000/api/v1/ingest";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    recording: true,
    apiKey: "rpl_shopnow_demo_key_99",
    endpoint: DEFAULT_ENDPOINT
  });
  console.log("[ReproLens Extension] Installed and initialized.");
});

// Relay messages between content scripts and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "INGEST_BATCH") {
    chrome.storage.local.get(["apiKey", "endpoint"], (res) => {
      const apiKey = res.apiKey || "rpl_shopnow_demo_key_99";
      const endpoint = res.endpoint || DEFAULT_ENDPOINT;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          session_token: request.payload.session_token,
          user_agent: request.payload.user_agent,
          browser_name: "Chrome Extension MV3",
          os_name: "Client OS",
          viewport_w: request.payload.viewport_w,
          viewport_h: request.payload.viewport_h,
          url: request.payload.url,
          duration_ms: request.payload.duration_ms,
          events: request.payload.events
        })
      })
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true; // Keep message channel open for async response
  }
});
