from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Individual DB fields (used locally)
    db_host: str = ""
    db_user: str = ""
    db_password: str = ""
    db_name: str = "movie_archive"
    db_port: int = 3306

    # Railway provides a full DATABASE_URL — takes priority when set
    database_url: Optional[str] = None

    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    omdb_api_key: str = ""
    admin_user_id: int = 1

    # Frontend origin for CORS (set FRONTEND_URL in Railway env vars)
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
