import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Resume Builder & ATS Analyzer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = "ai-resume-builder-secret-key-super-secure-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database - Default SQLite for 100% free zero-config local run, supports PostgreSQL via env
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    
    # Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]
    
    # Local AI - Ollama (100% free open-source local LLM)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"  # or mistral, phi3, gemma, etc.
    # Optional bearer token for a secured Ollama-compatible proxy in production.
    OLLAMA_API_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://localhost:80",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
