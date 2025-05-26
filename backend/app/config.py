from decouple import config
from pathlib import Path
import os

class Settings:
    DATABASE_URL: str = config("DATABASE_URL", default="postgresql+asyncpg://tensorbin:tensorbin@localhost:5432/tensorbin")
    REDIS_URL: str = config("REDIS_URL", default="redis://localhost:6379/0")
    SECRET_KEY: str = config("SECRET_KEY", default="dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
    REFRESH_TOKEN_EXPIRE_DAYS: int = config("REFRESH_TOKEN_EXPIRE_DAYS", default=7, cast=int)
    
    UPLOAD_DIR: str = config("UPLOAD_DIR", default="./uploads")
    MAX_FILE_SIZE: int = config("MAX_FILE_SIZE", default=10737418240, cast=int)  # 10GB
    ALLOWED_EXTENSIONS: list = config("ALLOWED_EXTENSIONS", default=".jpg,.jpeg,.png,.gif,.pdf,.txt,.zip,.tar,.gz,.mp4,.mp3,.doc,.docx").split(",")
    
    ENVIRONMENT: str = config("ENVIRONMENT", default="development")
    
    def __init__(self):
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)

settings = Settings()