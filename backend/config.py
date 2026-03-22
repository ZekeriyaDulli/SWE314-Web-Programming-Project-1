from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str = ""
    db_user: str = ""
    db_password: str = ""
    db_name: str = "movie_archive"
    db_port: int = 3306

    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    omdb_api_key: str = ""
    admin_user_id: int = 1

    class Config:
        env_file = ".env"


settings = Settings()
