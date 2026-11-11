"""
ReproLens Unified Full-Stack Launcher.
Starts:
  1. Backend API & Engine:    http://localhost:8000
  2. Developer Dashboard:     http://localhost:5173 (or http://localhost:8000/)
  3. ShopNow Demo Web App:    http://localhost:3000
"""

import os
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
DEMO_DIR = ROOT_DIR / "demo-app"

def banner():
    print(r"""
======================================================================
  ____                             _                      
 |  _ \  ___  _ __   _ __  ___    | |     ___  _ __   ___ 
 | |_) |/ _ \| '_ \ | '__|/ _ \   | |    / _ \| '_ \ / __|
 |  _ <|  __/| |_) || |  | (_) |  | |___|  __/| | | |\__ \
 |_| \_\\___|| .__/ |_|   \___/___|_____|\___||_| |_||___/
             |_|             |_____|                      
  AI-Powered Bug Investigation, Reproduction & Regression
======================================================================
""")

def main():
    banner()

    env = os.environ.copy()
    env["PYTHONPATH"] = str(BACKEND_DIR)

    processes = []

    try:
        # 1. Start Backend
        print("  [1/3] Starting ReproLens FastAPI Backend on http://localhost:8000...")
        backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
        backend_proc = subprocess.Popen(backend_cmd, cwd=str(BACKEND_DIR), env=env)
        processes.append(("Backend API", backend_proc))

        # 2. Start ShopNow Demo App
        print("  [2/3] Starting ShopNow E-Commerce Demo on http://localhost:3000...")
        demo_cmd = [sys.executable, "server.py"]
        demo_proc = subprocess.Popen(demo_cmd, cwd=str(DEMO_DIR))
        processes.append(("ShopNow Demo App", demo_proc))

        # 3. Start Frontend Dashboard
        print("  [3/3] Starting Developer Dashboard on http://localhost:5173...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(FRONTEND_DIR), shell=(sys.platform == "win32"))
        processes.append(("Developer Dashboard", frontend_proc))

        time.sleep(2)
        print("\n" + "=" * 70)
        print("  ReproLens Platform is LIVE:")
        print("   -> Developer Dashboard:   http://localhost:5173")
        print("   -> ShopNow Demo Store:    http://localhost:3000")
        print("   -> Backend REST API Docs: http://localhost:8000/docs")
        print("   -> SDK Endpoint:          http://localhost:8000/sdk/reprolens.js")
        print("=" * 70)
        print("  Press Ctrl+C to terminate all services safely.\n")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[ReproLens] Shutting down full-stack ecosystem...")
        for name, proc in processes:
            print(f"  Stopping {name}...")
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
        print("[ReproLens] All services stopped cleanly.")

if __name__ == "__main__":
    main()
