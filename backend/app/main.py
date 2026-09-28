import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base, ensure_ai_report_columns, ensure_resume_editor_columns
import app.models  # ensure models are registered
from app.routers import (
    auth_router, resumes_router, upload_router,
    ai_router, ats_router, job_match_router, pdf_router
)

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)
ensure_ai_report_columns()
ensure_resume_editor_columns()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Resume builder and ATS analysis using built-in, deterministic resume review rules.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(resumes_router, prefix=settings.API_V1_STR)
app.include_router(upload_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(ats_router, prefix=settings.API_V1_STR)
app.include_router(job_match_router, prefix=settings.API_V1_STR)
app.include_router(pdf_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "cost": "₹0 - 100% Free & Open Source",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "upload_dir": os.path.exists(settings.UPLOAD_DIR)
    }
