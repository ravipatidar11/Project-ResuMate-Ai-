from app.routers.auth import router as auth_router
from app.routers.resumes import router as resumes_router
from app.routers.upload import router as upload_router
from app.routers.ai import router as ai_router
from app.routers.ats import router as ats_router
from app.routers.job_match import router as job_match_router
from app.routers.pdf import router as pdf_router

__all__ = [
    "auth_router", "resumes_router", "upload_router",
    "ai_router", "ats_router", "job_match_router", "pdf_router"
]
