import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.seed_data import seed_database

from app.api.ingest import router as ingest_router
from app.api.projects import router as projects_router
from app.api.sessions import router as sessions_router
from app.api.bugs import router as bugs_router
from app.api.investigations import router as investigations_router
from app.api.reproductions import router as reproductions_router
from app.api.regression_tests import router as regression_tests_router
from app.api.stats import router as stats_router
from app.api.settings_api import router as settings_router
from app.api.github_pr import router as github_pr_router
from app.api.webhooks import router as webhooks_router
from app.api.auto_heal import router as auto_heal_router
from app.api.auto_shield import router as auto_shield_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ReproLens: AI-Powered Bug Investigation, Reproduction, and Regression Testing Platform"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static mounts
screenshots_dir = Path(settings.SCREENSHOTS_PATH)
screenshots_dir.mkdir(parents=True, exist_ok=True)
app.mount("/screenshots", StaticFiles(directory=str(screenshots_dir)), name="screenshots")

sdk_dir = Path(__file__).resolve().parent.parent.parent / "sdk"
sdk_dir.mkdir(parents=True, exist_ok=True)
app.mount("/sdk", StaticFiles(directory=str(sdk_dir)), name="sdk")

# Mount production frontend dashboard if dist exists
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

# Include API Routers
app.include_router(ingest_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(sessions_router, prefix=settings.API_V1_STR)
app.include_router(bugs_router, prefix=settings.API_V1_STR)
app.include_router(investigations_router, prefix=settings.API_V1_STR)
app.include_router(reproductions_router, prefix=settings.API_V1_STR)
app.include_router(regression_tests_router, prefix=settings.API_V1_STR)
app.include_router(stats_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(github_pr_router, prefix=settings.API_V1_STR)
app.include_router(webhooks_router, prefix=settings.API_V1_STR)
app.include_router(auto_heal_router, prefix=settings.API_V1_STR)
app.include_router(auto_shield_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    print("[ReproLens Backend] Booting and seeding initial case files...")
    seed_database()
    print("[ReproLens Backend] Ready at http://localhost:8000")

@app.get("/download/extension")
@app.get("/download/extension.zip")
@app.get("/download/reprolens-extension.zip")
def download_extension_zip():
    zip_path = Path(__file__).resolve().parent.parent / "storage" / "reprolens-extension-v1.0.0.zip"
    if not zip_path.exists():
        import zipfile
        root_dir = Path(__file__).resolve().parent.parent.parent
        zip_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(root_dir / 'extension'):
                for file in files:
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, root_dir / 'extension')
                    zf.write(full_p, rel_p)
    return FileResponse(
        path=str(zip_path),
        filename="reprolens-extension-v1.0.0.zip",
        media_type="application/zip"
    )

@app.get("/")
@app.get("/dashboard")
def serve_dashboard():
    dist_index = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist" / "index.html"
    if dist_index.exists():
        return FileResponse(dist_index)
    return {
        "status": "online",
        "service": "ReproLens Platform Backend",
        "dashboard": "Run 'npm run dev' inside frontend/ or check port 5173"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ReproLens Core Engine",
        "version": settings.VERSION
    }
