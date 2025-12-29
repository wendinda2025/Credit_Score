#!/usr/bin/env python3
"""
Script d'initialisation de la base de données
"""
import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import init_db, engine
from app.core.logging_config import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)


def main():
    """Initialise la base de données"""
    try:
        logger.info("Initialisation de la base de données...")
        init_db()
        logger.info("Base de données initialisée avec succès!")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
