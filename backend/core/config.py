"""
Configuration settings for the application
"""
import os
from typing import List


class Settings:
    PROJECT_NAME: str = "Classroom Management System"
    VERSION: str = "2.1.0"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./classroom_rag.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    
    # API
    API_V1_STR: str = "/api"


settings = Settings()