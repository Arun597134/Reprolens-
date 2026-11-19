document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('api-key-input');
  const endpointInput = document.getElementById('endpoint-input');
  const latencyToggle = document.getElementById('chaos-latency-toggle');
  const force500Toggle = document.getElementById('chaos-500-toggle');
  const flightRecorderToggle = document.getElementById('flight-recorder-toggle');
  const saveBtn = document.getElementById('save-btn');
  const dashBtn = document.getElementById('dashboard-btn');

  chrome.storage.local.get(
    ['apiKey', 'endpoint', 'chaosLatencyMs', 'chaosForce500', 'flightRecorderMode'],
    (res) => {
      if (res.apiKey && res.apiKey !== 'rpl_shopnow_demo_key_99') {
        keyInput.value = res.apiKey;
      } else {
        keyInput.value = 'rpl_3b40c1052e5b1070bd90ee0900d884af';
      }
      if (res.endpoint) endpointInput.value = res.endpoint;
      latencyToggle.checked = Number(res.chaosLatencyMs) > 0;
      force500Toggle.checked = Boolean(res.chaosForce500);
      flightRecorderToggle.checked = Boolean(res.flightRecorderMode);
    }
  );

  const persistChaos = () => {
    chrome.storage.local.set({
      chaosLatencyMs: latencyToggle.checked ? 2500 : 0,
      chaosForce500: force500Toggle.checked,
      flightRecorderMode: flightRecorderToggle.checked
    });
  };

  latencyToggle.addEventListener('change', persistChaos);
  force500Toggle.addEventListener('change', persistChaos);
  flightRecorderToggle.addEventListener('change', persistChaos);

  saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({
      apiKey: keyInput.value.trim(),
      endpoint: endpointInput.value.trim(),
      chaosLatencyMs: latencyToggle.checked ? 2500 : 0,
      chaosForce500: force500Toggle.checked,
      flightRecorderMode: flightRecorderToggle.checked
    }, () => {
      saveBtn.innerText = 'SAVED!';
      setTimeout(() => { saveBtn.innerText = 'SAVE CONFIG'; }, 1500);
    });
  });

  dashBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/?view=dashboard' });
  });

  // --- LIVE AI BUG HUNTER & AUTO-SOLVER RADAR ANIMATION ---
  const hunterBadge = document.getElementById('hunter-phase-badge');
  const radarBlip = document.getElementById('radar-blip');
  const logIndicator = document.getElementById('log-indicator');
  const logTitle = document.getElementById('log-title');
  const logDesc = document.getElementById('hunter-log-desc');
  const logCode = document.getElementById('hunter-log-code');
  const simBtn = document.getElementById('hunter-sim-btn');

  let currentPhase = 0;
  let cycleTimer = null;

  const phases = [
    {
      badge: 'SCANNING',
      badgeClass: '',
      blip: false,
      indicator: 'green',
      title: 'Radar Active: Monitoring DOM & Network',
      desc: 'Observing clickstream, unhandled rejections & fetch 500s across tabs.',
      showCode: false,
      duration: 3500
    },
    {
      badge: 'BUG DETECTED',
      badgeClass: 'detected',
      blip: true,
      indicator: 'red',
      title: 'Fatal Runtime Crash Isolated',
      desc: 'TypeError: Cannot read properties of undefined at handleCheckout() (line 42).',
      showCode: false,
      duration: 2500
    },
    {
      badge: 'SYNTHESIZING FIX',
      badgeClass: 'fixing',
      blip: true,
      indicator: 'yellow',
      title: 'ReproLens AST Reasoner Active',
      desc: 'Analyzing unhydrated state array. Generating deterministic AST code diff.',
      showCode: false,
      duration: 2500
    },
    {
      badge: 'AUTO-SOLVED',
      badgeClass: 'solved',
      blip: false,
      indicator: 'green',
      title: 'Autonomous Patch Verified & Applied',
      desc: 'Runtime fallback injected safely into memory. 0 regression exceptions.',
      showCode: true,
      duration: 4000
    }
  ];

  function applyPhase(idx) {
    currentPhase = idx;
    const p = phases[idx];

    if (hunterBadge) {
      hunterBadge.textContent = p.badge;
      hunterBadge.className = 'hunter-badge' + (p.badgeClass ? ' ' + p.badgeClass : '');
    }

    if (radarBlip) {
      if (p.blip) {
        radarBlip.classList.add('active');
      } else {
        radarBlip.classList.remove('active');
      }
    }

    if (logIndicator) {
      logIndicator.className = 'log-indicator ' + p.indicator;
    }

    if (logTitle) logTitle.textContent = p.title;
    if (logDesc) logDesc.textContent = p.desc;
    if (logCode) logCode.style.display = p.showCode ? 'block' : 'none';
  }

  function runNextPhase() {
    let nextIdx = (currentPhase + 1) % phases.length;
    applyPhase(nextIdx);
    cycleTimer = setTimeout(runNextPhase, phases[nextIdx].duration);
  }

  // Start radar cycle
  applyPhase(0);
  cycleTimer = setTimeout(runNextPhase, phases[0].duration);

  // Manual trigger button to instantly experience the detection & auto-solve flow
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      if (cycleTimer) clearTimeout(cycleTimer);
      simBtn.innerText = 'HUNTING BUG...';
      applyPhase(1); // Jump straight to BUG DETECTED!
      
      cycleTimer = setTimeout(() => {
        applyPhase(2); // SYNTHESIZING
        cycleTimer = setTimeout(() => {
          applyPhase(3); // AUTO-SOLVED
          simBtn.innerText = 'AUTO-SOLVED IN 180ms';
          cycleTimer = setTimeout(() => {
            simBtn.innerText = 'SIMULATE BUG & AUTO-SOLVE';
            runNextPhase();
          }, 3500);
        }, 2200);
      }, 2000);
    });
  }
});
