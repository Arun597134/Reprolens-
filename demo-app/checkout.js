// ShopNow Frontend Application Logic & Bug Injection Simulator

let currentView = 'home';
let bugModeActive = true; // By default, bug is ACTIVE as described in the user prompt!

function logToUi(msg, type = 'info') {
  const box = document.getElementById('console-log-box');
  if (!box) return;
  const line = document.createElement('div');
  const time = new Date().toTimeString().split(' ')[0];
  if (type === 'error') {
    line.className = 'text-red-400 font-bold';
    line.innerText = `[${time}] ❌ ${msg}`;
  } else if (type === 'warn') {
    line.className = 'text-amber-400';
    line.innerText = `[${time}] ⚠ ${msg}`;
  } else {
    line.className = 'text-slate-300';
    line.innerText = `[${time}] ℹ ${msg}`;
  }
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function navigate(viewName) {
  document.getElementById('view-home').classList.add('hidden');
  document.getElementById('view-cart').classList.add('hidden');
  document.getElementById('view-checkout').classList.add('hidden');

  currentView = viewName;
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.remove('hidden');
    window.history.pushState({ view: viewName }, '', `/${viewName === 'home' ? '' : viewName}`);
    logToUi(`Navigated to route: /${viewName}`);
  }
}

function showAlert(message, isSuccess = false) {
  const banner = document.getElementById('alert-banner');
  const content = document.getElementById('alert-content');
  banner.className = isSuccess
    ? 'max-w-4xl mx-auto mt-4 px-4 py-3 rounded-lg border text-sm font-medium flex items-center justify-between bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
    : 'max-w-4xl mx-auto mt-4 px-4 py-3 rounded-lg border text-sm font-medium flex items-center justify-between bg-red-950/80 border-red-500/40 text-red-200';
  content.innerHTML = isSuccess ? `<span>✔ ${message}</span>` : `<span>⚠ ${message}</span>`;
  banner.classList.remove('hidden');
}

function hideAlert() {
  document.getElementById('alert-banner').classList.add('hidden');
}

function addToCart(productName, price) {
  logToUi(`Added to cart: ${productName} (₹${price})`);
  showAlert(`Added "${productName}" to your bag! Proceeding to Checkout...`, true);
  setTimeout(() => {
    hideAlert();
    navigate('checkout');
  }, 900);
}

function toggleBugMode() {
  bugModeActive = !bugModeActive;
  const label = document.getElementById('simulator-mode-label');
  const btn = document.getElementById('bug-toggle-btn');
  if (bugModeActive) {
    label.innerText = 'PAYMENT_500_CRASH (Active)';
    label.className = 'ml-2 font-bold text-red-400';
    btn.className = 'px-2.5 py-1 bg-red-600/20 text-red-300 border border-red-500/40 rounded text-[11px] font-semibold hover:bg-red-600/30';
    logToUi('Bug Mode ENABLED: Checkout will trigger HTTP 500 and unhandled TypeError crash.');
  } else {
    label.innerText = 'FIXED_RESILIENT_MODE (Patched)';
    label.className = 'ml-2 font-bold text-emerald-400';
    btn.className = 'px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-semibold hover:bg-emerald-600/30';
    logToUi('Bug Mode DISABLED: Checkout now uses defensive error handling.');
  }
}

function applyCoupon() {
  const code = document.getElementById('coupon-input').value.trim();
  logToUi(`Applying coupon code: '${code}'`);

  if (code.toUpperCase() === 'SUMMER50') {
    logToUi('Triggering coupon discount evaluation...');
    // Deliberate crash scenario 2: ReferenceError
    // Attempting to call non-existent service
    discountCalculationService.applyPromotion(code);
  } else {
    showAlert('Invalid coupon code entered.');
  }
}

/**
 * THE REAL-WORLD REPROLENS FAILURE SCENARIO:
 * User clicks "Pay Now".
 * Network returns HTTP 500.
 * Callback assumes response.data.transactionId exists without check.
 * Throws Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId').
 */
async function submitPayment() {
  const spinner = document.getElementById('pay-spinner');
  const btnText = document.getElementById('pay-btn-text');
  const btn = document.getElementById('btn-pay-now');

  spinner.classList.remove('hidden');
  btnText.innerText = 'Authorizing Payment...';
  btn.disabled = true;

  logToUi('POST /api/payment dispatching for ₹2,500...');

  const payload = {
    amount: 2500,
    currency: 'INR',
    items: ['Pro Wireless Headphones'],
    email: document.getElementById('customer-email').value,
    cardNumber: document.getElementById('card-number').value,
    bugMode: bugModeActive
  };

  try {
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    logToUi(`Payment API returned HTTP ${res.status}: ${JSON.stringify(data)}`, res.ok ? 'info' : 'warn');

    if (!bugModeActive) {
      // FIXED IMPLEMENTATION: Safe guard clauses
      if (!res.ok || !data.success) {
        spinner.classList.add('hidden');
        btnText.innerText = 'Pay Now ₹2,500';
        btn.disabled = false;
        showAlert('Payment service is currently unavailable. Your card was not charged. Please try again.', false);
        logToUi('Resilient handling caught failure gracefully without unhandled exception.');
        return;
      }
      const txId = (data.data && data.data.transactionId) ? data.data.transactionId : 'TXN_SUCCESS';
      showAlert(`Payment Successful! Transaction ID: ${txId}`, true);
      spinner.classList.add('hidden');
      btnText.innerText = 'Paid Successfully';
      return;
    }

    // =========================================================================
    // BUGGY IMPLEMENTATION (LINE 142)
    // The exact defect highlighted in Section 2 & Module 3 of the prompt:
    // When API returns HTTP 500, data is { "error": "Payment gateway timeout", "success": false }
    // It has NO "data" property! Calling data.data.transactionId throws:
    // Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')
    // =========================================================================
    const transactionId = data.data.transactionId.toUpperCase();
    logToUi(`Transaction completed with ID: ${transactionId}`);

  } catch (err) {
    logToUi(`Uncaught Exception in submitPayment: ${err.message}`, 'error');
    // Re-throw so ReproLens window.onerror and Extension catch the unhandled crash!
    throw err;
  }
}
