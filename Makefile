# Makefile pour faciliter les commandes courantes

.PHONY: help install dev test clean docker-build docker-up docker-down

help: ## Afficher cette aide
	@echo "Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Installer les dépendances
	@echo "Installation du backend..."
	cd backend && python -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	@echo "Installation du frontend..."
	cd frontend && npm install
	@echo "✅ Installation terminée!"

dev-backend: ## Lancer le backend en mode développement
	cd backend && . venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Lancer le frontend en mode développement
	cd frontend && npm run dev

dev: ## Lancer backend et frontend en parallèle
	@echo "Démarrage du backend et frontend..."
	make -j 2 dev-backend dev-frontend

test-backend: ## Lancer les tests du backend
	cd backend && . venv/bin/activate && pytest tests/ -v --cov=app

test-frontend: ## Lancer les tests du frontend
	cd frontend && npm test

test: ## Lancer tous les tests
	make test-backend
	make test-frontend

lint-backend: ## Vérifier le code backend
	cd backend && . venv/bin/activate && flake8 app/ && black --check app/

lint-frontend: ## Vérifier le code frontend
	cd frontend && npm run lint

format-backend: ## Formater le code backend
	cd backend && . venv/bin/activate && black app/

db-init: ## Initialiser la base de données
	cd backend && . venv/bin/activate && alembic upgrade head && python -m app.utils.init_db

db-migrate: ## Créer une nouvelle migration
	cd backend && . venv/bin/activate && alembic revision --autogenerate -m "$(message)"

db-upgrade: ## Appliquer les migrations
	cd backend && . venv/bin/activate && alembic upgrade head

db-downgrade: ## Annuler la dernière migration
	cd backend && . venv/bin/activate && alembic downgrade -1

clean: ## Nettoyer les fichiers temporaires
	@echo "Nettoyage..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	rm -rf backend/htmlcov
	rm -rf frontend/dist
	rm -rf frontend/build
	@echo "✅ Nettoyage terminé!"

docker-build: ## Construire les images Docker
	docker-compose build

docker-up: ## Démarrer les conteneurs Docker
	docker-compose up -d

docker-down: ## Arrêter les conteneurs Docker
	docker-compose down

docker-logs: ## Afficher les logs Docker
	docker-compose logs -f

docker-restart: ## Redémarrer les conteneurs Docker
	docker-compose restart

docker-clean: ## Nettoyer Docker
	docker-compose down -v
	docker system prune -f

backup-db: ## Sauvegarder la base de données
	@echo "Sauvegarde de la base de données..."
	pg_dump -U pamf_user -h localhost pamf_credit | gzip > backup_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "✅ Sauvegarde créée!"

restore-db: ## Restaurer la base de données (restore-db file=backup.sql.gz)
	@echo "Restauration de la base de données depuis $(file)..."
	gunzip < $(file) | psql -U pamf_user -h localhost pamf_credit
	@echo "✅ Restauration terminée!"

build-prod: ## Builder pour la production
	@echo "Build du frontend..."
	cd frontend && npm run build
	@echo "✅ Build terminé!"

.DEFAULT_GOAL := help
