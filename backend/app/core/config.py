# goal
# config.py: Code describes behavior
# Environment describes deployment


from __future__ import annotations
from pathlib import Path
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3] # shifts up to parent dire by two levels
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    database_url: str = Field(default="sqlite:///./clausecop.db", alias="DATABASE_URL")
    upload_dir: str = Field(default="./data/uploads", alias="UPLOAD_DIR")
    cors_origins: list[str] = Field(default=["http://localhost:3000"], alias="CORS_ORIGINS")

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    unstructured_api_url: str = Field(
        default="https://platform.unstructuredapp.io/api/v1",
        alias="UNSTRUCTURED_API_URL",
    )
    unstructured_api_key: str = Field(default="", alias="UNSTRUCTURED_API_KEY")

    @field_validator("cors_origins", mode="before")
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


settings = Settings()
