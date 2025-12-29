"""
Configuration de la base de données
Support SQLite pour dev, préparé pour Oracle en production
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
from typing import Generator
import logging

from app.config import get_settings
from app.models.base import Base

logger = logging.getLogger(__name__)
settings = get_settings()

# Configuration du moteur de base de données
# Pour SQLite (développement)
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG
    )
    
    # Activer les clés étrangères pour SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Pour Oracle (production) - à configurer avec cx_Oracle
elif settings.DATABASE_URL.startswith("oracle"):
    # Format: oracle+cx_oracle://user:password@host:port/service_name
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )
else:
    # Autre base de données (PostgreSQL, MySQL, etc.)
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialise la base de données (crée les tables)"""
    Base.metadata.create_all(bind=engine)
    logger.info("Base de données initialisée avec succès")


def get_db() -> Generator[Session, None, None]:
    """Dépendance FastAPI pour obtenir une session de base de données"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager pour utilisation en dehors de FastAPI"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
