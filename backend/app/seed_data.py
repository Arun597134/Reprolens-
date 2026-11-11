from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, Base, engine
from app.models.schema import (
    Project, Session as SessionModel, Event as EventModel,
    BugReport, Investigation, Reproduction, RegressionTest, SystemSetting
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Project).filter(Project.name == "ShopNow E-Commerce").first():
        print("Database already seeded with demo data.")
        db.close()
        return

    print("Seeding ReproLens database with real-world ShopNow checkout failure case...")

    # 1. Project
    now = datetime.now(timezone.utc)
    project = Project(
        name="ShopNow E-Commerce",
        api_key="rpl_shopnow_demo_key_99",
        website_url="http://localhost:3000",
        redaction_config={
            "mask_all_inputs": True,
            "filter_query_params": True,
            "custom_keywords": ["secret", "cvv", "token", "card"]
        },
        created_at=now - timedelta(days=3)
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # 2. Main Checkout Session
    session1 = SessionModel(
        project_id=project.id,
        session_token="sess_shopnow_chk_8829",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        browser_name="Chrome 124",
        os_name="Windows 10",
        viewport_w=1440,
        viewport_h=900,
        device_pixel_ratio=1.0,
        url="http://localhost:3000/checkout",
        started_at=now - timedelta(minutes=45),
        duration_ms=16400,
        error_count=2,
        status="error"
    )
    db.add(session1)
    db.commit()
    db.refresh(session1)

    # 3. Main Session Events (Exact sequence from user prompt)
    events1 = [
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=0,
            event_type="navigation",
            payload={"url": "http://localhost:3000/", "title": "ShopNow | Premium Tech & Lifestyle Store"},
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=4200,
            event_type="click",
            payload={
                "tag": "button",
                "text": "Add to Cart",
                "selector": "#product-card-1 > .add-to-cart-btn",
                "product_name": "Pro Wireless Headphones",
                "price": "₹2,500"
            },
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=9100,
            event_type="navigation",
            payload={"url": "http://localhost:3000/checkout", "title": "ShopNow | Secure Checkout"},
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=11500,
            event_type="input",
            payload={"name": "email", "selector": "#customer-email", "value": "[REDACTED]"},
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=13200,
            event_type="input",
            payload={"name": "cardNumber", "selector": "#card-number", "value": "[REDACTED]"},
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=14800,
            event_type="click",
            payload={
                "tag": "button",
                "text": "Pay Now",
                "selector": "#btn-pay-now",
                "role": "button"
            },
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=15900,
            event_type="network_request",
            payload={
                "method": "POST",
                "url": "/api/payment",
                "status": 500,
                "status_text": "Internal Server Error",
                "duration_ms": 1100,
                "response_body": {"error": "Payment gateway timeout", "success": False}
            },
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=16100,
            event_type="js_exception",
            payload={
                "message": "Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')",
                "error_type": "TypeError",
                "filename": "checkout.js",
                "lineno": 142,
                "colno": 28,
                "stack": "TypeError: Cannot read properties of undefined (reading 'transactionId')\n    at handlePaymentCallback (http://localhost:3000/checkout.js:142:28)\n    at async onSubmitPayment (http://localhost:3000/checkout.js:115:9)"
            },
            is_sanitized=True
        ),
        EventModel(
            session_id=session1.id,
            timestamp_offset_ms=16200,
            event_type="console_error",
            payload={
                "message": "Payment processing halted due to unhandled callback exception.",
                "level": "error"
            },
            is_sanitized=True
        )
    ]
    db.bulk_save_objects(events1)

    # 4. Bug Report for Checkout Failure
    bug1 = BugReport(
        project_id=project.id,
        session_id=session1.id,
        title="Checkout payment failure: Cannot read properties of undefined (reading 'transactionId')",
        status="reproduced",
        severity="critical",
        error_message="Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')",
        error_type="TypeError",
        stack_trace="TypeError: Cannot read properties of undefined (reading 'transactionId')\n    at handlePaymentCallback (checkout.js:142:28)\n    at async onSubmitPayment (checkout.js:115:9)",
        url="http://localhost:3000/checkout",
        component_context="CheckoutPaymentForm > #btn-pay-now",
        created_at=now - timedelta(minutes=40)
    )
    db.add(bug1)
    db.commit()
    db.refresh(bug1)

    # 5. AI Investigation Case File
    investigation1 = Investigation(
        bug_id=bug1.id,
        status="completed",
        summary="Payment handler attempted to access a missing response property ('transactionId') following an HTTP 500 internal server error from the payment gateway endpoint.",
        root_cause_analysis="The payment submission callback expected an HTTP 200 payload containing a 'data.transactionId' string. Because the backend gateway at '/api/payment' timed out and returned HTTP 500, the JSON payload did not contain 'data'. The frontend code directly evaluated 'response.data.transactionId.toUpperCase()' without verifying response.ok or utilizing optional chaining, throwing an unhandled TypeError that crashed the checkout form.",
        observed_facts=[
            "T+0.0s: User navigated to ShopNow landing page",
            "T+4.2s: User clicked 'Add to Cart' for Pro Wireless Headphones (₹2,500)",
            "T+9.1s: User navigated to '/checkout'",
            "T+11.5s: User filled customer email (sanitized as [REDACTED])",
            "T+13.2s: User filled payment details (sanitized as [REDACTED])",
            "T+14.8s: User clicked 'Pay Now' button (#btn-pay-now)",
            "T+15.9s: Network failure: POST /api/payment returned HTTP 500 (Internal Server Error) after 1100ms",
            "T+16.1s: Failure detected: Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId') at checkout.js:142"
        ],
        inferred_explanations=[
            "The client code directly accesses 'response.data.transactionId' under the implicit assumption that network requests will always succeed.",
            "No error boundary or try/catch block enclosed the post-submission callback, allowing a single missing property to halt execution.",
            "The submit button remained in an indefinite loading spinner state because the exception prevented the finally block from clearing state."
        ],
        unverified_hypotheses=[
            "The upstream banking payment gateway may be experiencing intermittent latency or downtime.",
            "The backend /api/payment service may lack timeout handling for third-party webhook acknowledgments."
        ],
        confidence_score=0.96,
        fix_recommendations=[
            {
                "title": "Add Guard Clause & Safe Fallback in Payment Handler",
                "file": "src/checkout.js",
                "diff": """- const txId = response.data.transactionId.toUpperCase();
- updateReceipt(txId);
+ if (!response.ok || !response.data) {
+   showToast('Payment processing could not be completed. Your account has not been charged.', 'error');
+   setSubmitting(false);
+   return;
+ }
+ const txId = response.data?.transactionId?.toUpperCase() ?? 'N/A';
+ updateReceipt(txId);"""
            },
            {
                "title": "Wrap Async Network Call with Error Boundary and Retry Option",
                "file": "src/components/PaymentModal.tsx",
                "diff": """+ try {
    const res = await api.post('/api/payment', payload);
+ } catch (networkError) {
+   console.error('Captured payment error:', networkError);
+   displayRetryBanner('Connection to payment service timed out. Please retry.');
+ } finally {
+   setIsLoading(false);
+ }"""
            }
        ],
        evidence={
            "failing_endpoint": "/api/payment",
            "http_status": 500,
            "error_type": "TypeError",
            "trigger_action": "click on #btn-pay-now",
            "source_location": "checkout.js:142:28"
        },
        ai_model_used="ReproLens Deep Root-Cause Engine v1.0",
        created_at=now - timedelta(minutes=35)
    )
    db.add(investigation1)

    # 6. Deterministic Reproduction Record
    reproduction1 = Reproduction(
        bug_id=bug1.id,
        status="reproduced",
        reproduction_steps=[
            {"step": "navigation", "target": "http://localhost:3000/checkout", "status": "executed"},
            {"step": "click", "selector": "#btn-pay-now", "text": "Pay Now", "status": "clicked"},
            {"step": "network_intercept", "target": "**/api/payment", "status": "mocked_500"},
            {"step": "error_capture", "target": "TypeError: Cannot read properties of undefined", "status": "verified"}
        ],
        environment_config={
            "viewport_w": 1440,
            "viewport_h": 900,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0",
            "browser": "Chromium 125",
            "simulated_network": True,
            "mocked_endpoints": ["/api/payment"]
        },
        screenshot_url="/screenshots/repro_checkout_error.png",
        execution_logs="""[10:30:00] Initializing ReproLens Deterministic Browser Environment...
[10:30:01] Configuring viewport: 1440x900
[10:30:01] Target initial route: http://localhost:3000/checkout
[10:30:02] Network emulation active: Latency 120ms, 3G/4G simulated.
[10:30:02] Arming deterministic mock route: POST **/api/payment -> HTTP 500
[10:30:03] Executing navigation: page.goto('http://localhost:3000/checkout')
[10:30:04] Replaying 1 recorded user interaction steps...
[10:30:04] Step 1/1: CLICK on 'Pay Now' (#btn-pay-now)
[10:30:05] Intercepted request http://localhost:3000/api/payment - fulfilling with simulated HTTP 500
[10:30:05] [BROWSER UNCAUGHT EXCEPTION] TypeError: Cannot read properties of undefined (reading 'transactionId')
[10:30:06] High-res state screenshot captured: repro_checkout_error.png
[10:30:06] Deterministic Reproduction SUCCESS: Target failure successfully reproduced in isolated browser!""",
        duration_ms=4200,
        exit_code=0,
        created_at=now - timedelta(minutes=30)
    )
    db.add(reproduction1)

    # 7. AI-Generated Regression Test
    test1 = RegressionTest(
        bug_id=bug1.id,
        title="Verify checkout handles payment API failure gracefully without crashing",
        test_code="""import { test, expect } from "@playwright/test";

/**
 * ReproLens AI-Generated Regression Test
 * Bug: Checkout payment failure: Cannot read properties of undefined (reading 'transactionId')
 * Target: http://localhost:3000/checkout
 */
test("checkout handles payment API failure gracefully without crashing", async ({ page }) => {
  // 1. Mock failing payment endpoint deterministically
  await page.route("**/api/payment", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Payment service unavailable",
        code: "GATEWAY_TIMEOUT"
      })
    });
  });

  // 2. Navigate to checkout page
  await page.goto("http://localhost:3000/checkout");

  // 3. Click Pay Now button
  await page.getByRole("button", { name: "Pay Now" }).click();

  // 4. Assert user receives friendly notification instead of broken spinner
  const alert = page.getByRole("alert").or(page.getByText(/payment failed|error|unable to complete/i));
  await expect(alert.first()).toBeVisible({ timeout: 5000 });

  // 5. Assert No White-Screen or Uncaught Crash
  const bodyText = await page.textContent("body");
  expect(bodyText).not.toContain("Cannot read properties of undefined");
  expect(bodyText).not.toContain("Uncaught TypeError");
});
""",
        framework="playwright",
        status="passing",
        last_run_at=now - timedelta(minutes=15),
        execution_result={
            "status": "passing",
            "duration_ms": 2840,
            "stdout": "[10:35:10] Playwright test suite started.\n[10:35:11] Intercepted route **/api/payment (500)\n[10:35:12] Clicked 'Pay Now'\n[10:35:13] Asserted alert visibility: PASS\n[10:35:13] Asserted clean unhandled crash check: PASS"
        },
        created_at=now - timedelta(minutes=25)
    )
    db.add(test1)

    # 8. Add a second session: Cart Coupon Code crash
    session2 = SessionModel(
        project_id=project.id,
        session_token="sess_shopnow_cpn_4412",
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
        browser_name="Mobile Safari",
        os_name="iOS 17.4",
        viewport_w=390,
        viewport_h=844,
        device_pixel_ratio=3.0,
        url="http://localhost:3000/cart",
        started_at=now - timedelta(hours=2),
        duration_ms=28000,
        error_count=1,
        status="error"
    )
    db.add(session2)
    db.commit()
    db.refresh(session2)

    events2 = [
        EventModel(
            session_id=session2.id,
            timestamp_offset_ms=0,
            event_type="navigation",
            payload={"url": "http://localhost:3000/cart", "title": "ShopNow | Your Shopping Bag"},
            is_sanitized=True
        ),
        EventModel(
            session_id=session2.id,
            timestamp_offset_ms=5100,
            event_type="input",
            payload={"name": "coupon", "selector": "#coupon-input", "value": "SUMMER50"},
            is_sanitized=True
        ),
        EventModel(
            session_id=session2.id,
            timestamp_offset_ms=6400,
            event_type="click",
            payload={"tag": "button", "text": "Apply Coupon", "selector": "#apply-coupon-btn"},
            is_sanitized=True
        ),
        EventModel(
            session_id=session2.id,
            timestamp_offset_ms=7200,
            event_type="js_exception",
            payload={
                "message": "Uncaught ReferenceError: discountCalculationService is not defined",
                "error_type": "ReferenceError",
                "stack": "ReferenceError: discountCalculationService is not defined\n    at applyDiscount (cart.js:89:12)"
            },
            is_sanitized=True
        )
    ]
    db.bulk_save_objects(events2)

    bug2 = BugReport(
        project_id=project.id,
        session_id=session2.id,
        title="Cart Coupon Crash: ReferenceError: discountCalculationService is not defined",
        status="open",
        severity="high",
        error_message="Uncaught ReferenceError: discountCalculationService is not defined",
        error_type="ReferenceError",
        stack_trace="ReferenceError: discountCalculationService is not defined\n    at applyDiscount (cart.js:89:12)",
        url="http://localhost:3000/cart",
        component_context="CartPromoDrawer > #apply-coupon-btn",
        created_at=now - timedelta(hours=2)
    )
    db.add(bug2)

    # 9. Clean sessions without errors
    for i in range(1, 5):
        s_clean = SessionModel(
            project_id=project.id,
            session_token=f"sess_clean_browse_{i}",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0",
            browser_name="Chrome 124",
            os_name="Windows 10",
            viewport_w=1920,
            viewport_h=1080,
            url="http://localhost:3000",
            started_at=now - timedelta(hours=i * 3),
            duration_ms=45000 + i * 2000,
            error_count=0,
            status="completed"
        )
        db.add(s_clean)

    # Save default settings
    default_settings = [
        ("mask_passwords", "true", "Automatically scrub password inputs"),
        ("mask_emails", "true", "Automatically scrub email addresses"),
        ("mask_credit_cards", "true", "Scrub Luhn-valid credit card numbers"),
        ("filter_query_params", "true", "Strip sensitive tokens from URLs"),
        ("default_reproduction_timeout_s", "30", "Timeout for Playwright reproduction")
    ]
    for k, v, desc in default_settings:
        db.add(SystemSetting(key=k, value=v, description=desc))

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
