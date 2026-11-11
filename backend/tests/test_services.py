import asyncio
import sys
import unittest
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.sanitization import sanitizer
from app.services.ai_investigator import ai_investigator
from app.services.test_generator import test_generator

class TestReproLensCoreServices(unittest.TestCase):

    def test_privacy_sanitizer_luhn_credit_cards(self):
        valid_card = "4242 4242 4242 4242"
        text = f"User typed card number {valid_card} in checkout."
        sanitized = sanitizer.sanitize_string(text)
        self.assertNotIn("4242", sanitized)
        self.assertIn("[REDACTED]", sanitized)

    def test_privacy_sanitizer_emails_and_jwt(self):
        email = "arun.kumar@gmail.com"
        jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        raw_dict = {
            "user_email": email,
            "access_token": jwt_token,
            "password": "superSecretPassword123!",
            "public_id": "cust_9921",
            "profile_url": f"https://example.com/callback?token={jwt_token}&user=arun"
        }
        res = sanitizer.sanitize_data(raw_dict)
        self.assertEqual(res["password"], "[REDACTED]")
        self.assertEqual(res["access_token"], "[REDACTED]")
        self.assertEqual(res["user_email"], "[REDACTED]")
        self.assertEqual(res["public_id"], "cust_9921")
        self.assertNotIn("superSecretPassword", str(res))

    def test_privacy_sanitizer_query_parameters(self):
        url = "https://shopnow.com/checkout?token=secret123&session=99283&product_id=4"
        clean_url = sanitizer.sanitize_url(url)
        self.assertNotIn("secret123", clean_url)
        self.assertIn("product_id=4", clean_url)

    def test_ai_investigator_root_cause_analysis(self):
        bug_report = {
            "title": "Payment Button Failure",
            "error_message": "Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')",
            "error_type": "TypeError",
            "url": "http://localhost:3000/checkout"
        }
        events = [
            {"event_type": "navigation", "timestamp_offset_ms": 0, "payload": {"url": "http://localhost:3000/checkout"}},
            {"event_type": "click", "timestamp_offset_ms": 14000, "payload": {"text": "Pay Now", "selector": "#btn-pay"}},
            {"event_type": "network_request", "timestamp_offset_ms": 15000, "payload": {"method": "POST", "url": "/api/payment", "status": 500}},
            {"event_type": "js_exception", "timestamp_offset_ms": 15200, "payload": {"message": "Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')"}}
        ]

        result = ai_investigator.investigate(
            bug_report=bug_report,
            session_events=events,
            use_external_llm=False
        )

        self.assertIn("observed_facts", result)
        self.assertIn("inferred_explanations", result)
        self.assertIn("unverified_hypotheses", result)
        self.assertIn("fix_recommendations", result)
        self.assertGreater(result["confidence_score"], 0.8)

        # Verify strict 4-tier separation
        self.assertTrue(any("HTTP 500" in f for f in result["observed_facts"]))
        self.assertTrue(any("transactionId" in inf or "contract" in inf for inf in result["inferred_explanations"]))
        self.assertIn("diff", result["fix_recommendations"][0])

    def test_regression_test_generator(self):
        bug_report = {
            "title": "Checkout Payment Failure",
            "error_message": "Uncaught TypeError: Cannot read properties of undefined (reading 'transactionId')",
            "url": "http://localhost:3000/checkout"
        }
        events = [
            {"event_type": "click", "payload": {"text": "Pay Now", "selector": "#btn-pay-now"}},
            {"event_type": "network_request", "payload": {"url": "/api/payment", "status": 500, "method": "POST"}}
        ]

        gen = test_generator.generate_playwright_test(bug_report, events)
        test_code = gen["test_code"]

        self.assertIn("import { test, expect } from \"@playwright/test\";", test_code)
        self.assertIn("page.route", test_code)
        self.assertIn("/api/payment", test_code)
        self.assertIn("Pay Now", test_code)
        self.assertIn("toBeVisible", test_code)

    def test_ci_workflow_generation(self):
        yaml = test_generator.generate_ci_workflow("checkout-regression.spec.ts")
        self.assertIn("name: ReproLens Regression Suite", yaml)
        self.assertIn("playwright test", yaml)

if __name__ == "__main__":
    unittest.main()
