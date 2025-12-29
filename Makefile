.PHONY: help install dev test lint format run clean

help:
	@echo "Commandes disponibles:"
	@echo "  make install    - Installer les dépendances"
	@echo "  make dev        - Installer les dépendances de développement"
	@echo "  make test       - Lancer les tests"
	@echo "  make lint       - Vérifier le code avec flake8 et mypy"
	@echo "  make format     - Formater le code avec black et isort"
	@echo "  make run        - Lancer l'application"
	@echo "  make clean      - Nettoyer les fichiers temporaires"

install:
	pip install -r requirements.txt

dev:
	pip install -r requirements.txt

test:
	pytest tests/ -v

lint:
	flake8 app tests
	mypy app

format:
	black app tests
	isort app tests

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -r {} +
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
