import http.server
import json
import os
import sys
import time
from pathlib import Path

PORT = 3000
DEMO_DIR = Path(__file__).resolve().parent

class ShopNowHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DEMO_DIR), **kwargs)

    def end_headers(self):
        # Enable CORS and disable caching for test development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path.startswith("/api/payment"):
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            bug_mode = True
            try:
                payload = json.loads(post_data.decode("utf-8"))
                bug_mode = payload.get("bugMode", True)
            except Exception:
                pass

            # Simulate network latency
            time.sleep(0.35)

            if bug_mode:
                # Deliberate Failure Scenario: HTTP 500
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                response_payload = {
                    "success": False,
                    "error": "Payment gateway timeout: upstream acquiring bank unresponsive",
                    "code": "GATEWAY_TIMEOUT"
                }
                self.wfile.write(json.dumps(response_payload).encode("utf-8"))
            else:
                # Successful response
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                response_payload = {
                    "success": True,
                    "data": {
                        "transactionId": f"TXN_{int(time.time())}_OK",
                        "status": "APPROVED",
                        "amount": 2500,
                        "currency": "INR"
                    }
                }
                self.wfile.write(json.dumps(response_payload).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        # Route fallback: rewrite /checkout and /cart to index.html for SPA routing
        clean_path = self.path.split("?")[0]
        if clean_path in ("/checkout", "/cart"):
            self.path = "/index.html"
        return super().do_GET()

def run_server():
    print(f"[ShopNow Demo Server] Running at http://localhost:{PORT}")
    with http.server.HTTPServer(("0.0.0.0", PORT), ShopNowHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[ShopNow Demo Server] Stopping.")

if __name__ == "__main__":
    run_server()
