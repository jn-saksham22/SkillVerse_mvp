from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "SKILLVERSE API"

    database_url: str = (
        "postgresql+psycopg://skillverse:skillverse@localhost:5432/skillverse"
    )

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
