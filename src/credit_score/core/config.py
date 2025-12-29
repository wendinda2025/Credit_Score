from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CREDIT_SCORE_", extra="ignore")

    app_name: str = "credit-score-api"
    environment: str = "dev"  # dev|test|prod
    database_url: str = "sqlite:///./credit_score.sqlite3"

    # Scoring defaults (can be overridden by env)
    score_weight_dscr: float = 0.45
    score_weight_collateral: float = 0.45
    score_weight_stability: float = 0.10


settings = Settings()

