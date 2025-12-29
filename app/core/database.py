"""
Configuration de la base de données avec SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Création de l'engine SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool if settings.is_development else None,
    pool_pre_ping=True,  # Vérifie la connexion avant utilisation
    echo=settings.DEBUG,  # Log les requêtes SQL en mode debug
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()


def get_db():
    """
    Dépendance FastAPI pour obtenir une session de base de données
    Gère automatiquement la fermeture de la session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error("Erreur de base de données", error=str(e), exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialise la base de données (crée les tables)"""
    logger.info("Initialisation de la base de données")
    Base.metadata.create_all(bind=engine)
    logger.info("Base de données initialisée avec succès")
