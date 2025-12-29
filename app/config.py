"""
Configuration de l'application
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Configuration centralisée de l'application"""
    
    # Application
    APP_NAME: str = "Credit Score Manager"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Base de données
    DATABASE_URL: str = "sqlite:///./credit_score.db"
    
    # Sécurité
    SECRET_KEY: str = "votre-cle-secrete-a-changer-en-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Score de crédit - Paramètres
    SCORE_MIN: int = 300
    SCORE_MAX: int = 850
    
    # Seuils de décision
    SEUIL_EXCELLENT: int = 750
    SEUIL_BON: int = 670
    SEUIL_MOYEN: int = 580
    SEUIL_FAIBLE: int = 500
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/credit_app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retourne l'instance singleton des paramètres"""
    return Settings()
