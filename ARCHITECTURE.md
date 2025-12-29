# Architecture de l'Application

## Vue d'ensemble

Cette application suit une architecture modulaire et robuste basée sur FastAPI, avec une séparation claire des responsabilités.

## Structure Modulaire

### `app/core/`
Module central contenant la configuration et les utilitaires partagés :

- **`config.py`** : Configuration centralisée avec validation Pydantic
- **`database.py`** : Configuration SQLAlchemy et gestion des sessions
- **`exceptions.py`** : Exceptions personnalisées pour une gestion d'erreurs robuste
- **`logging_config.py`** : Configuration du logging structuré
- **`security.py`** : Fonctions de sécurité (JWT, hashage des mots de passe)

### `app/models/`
Modèles SQLAlchemy représentant les entités de la base de données :

- **`user.py`** : Modèle utilisateur avec tous les champs nécessaires

### `app/schemas/`
Schémas Pydantic pour la validation et la sérialisation :

- **`user.py`** : Schémas pour la création, mise à jour et réponse des utilisateurs

### `app/api/`
Routes API organisées par version :

- **`dependencies.py`** : Dépendances FastAPI réutilisables (authentification, etc.)
- **`v1/auth.py`** : Routes d'authentification (register, login)
- **`v1/users.py`** : Routes CRUD pour les utilisateurs

### `app/main.py`
Point d'entrée de l'application FastAPI avec :
- Configuration de l'application
- Middleware CORS
- Gestionnaires d'exceptions globaux
- Middleware de logging
- Inclusion des routes

## Principes de Robustesse

### 1. Gestion des Erreurs
- Exceptions personnalisées avec codes HTTP appropriés
- Gestionnaire d'exceptions global pour capturer toutes les erreurs
- Messages d'erreur structurés et informatifs

### 2. Validation des Données
- Validation automatique avec Pydantic
- Validation stricte des mots de passe (complexité)
- Validation des emails et autres champs

### 3. Sécurité
- Hashage des mots de passe avec bcrypt
- Tokens JWT avec expiration configurable
- Protection CORS configurée
- Variables sensibles dans `.env` (non versionné)

### 4. Logging
- Logging structuré avec structlog
- Logs de toutes les requêtes HTTP
- Niveaux de log configurables par environnement

### 5. Base de Données
- ORM SQLAlchemy pour l'abstraction
- Gestion des transactions avec rollback automatique
- Pool de connexions configuré
- Migrations avec Alembic

### 6. Tests
- Tests unitaires et d'intégration
- Fixtures pytest pour la base de données
- Couverture de code configurée

### 7. Configuration
- Variables d'environnement avec validation
- Configuration différenciée par environnement
- Fichier `.env.example` pour référence

## Flux de Données

1. **Requête HTTP** → `app/main.py`
2. **Routing** → `app/api/v1/*.py`
3. **Validation** → `app/schemas/*.py` (Pydantic)
4. **Authentification** → `app/api/dependencies.py`
5. **Logique Métier** → Routes API
6. **Accès DB** → `app/models/*.py` (SQLAlchemy)
7. **Réponse** → Schémas Pydantic pour sérialisation

## Sécurité des Données

- Les mots de passe ne sont jamais stockés en clair
- Les tokens JWT contiennent uniquement l'ID utilisateur
- Les schémas de réponse excluent les données sensibles
- Validation stricte de toutes les entrées utilisateur

## Extensibilité

L'architecture permet d'ajouter facilement :
- De nouveaux modèles dans `app/models/`
- De nouveaux schémas dans `app/schemas/`
- De nouvelles routes dans `app/api/v1/`
- De nouvelles versions d'API dans `app/api/v2/`

## Bonnes Pratiques Appliquées

- ✅ Type hints partout
- ✅ Docstrings pour toutes les fonctions
- ✅ Gestion d'erreurs explicite
- ✅ Configuration externalisée
- ✅ Logging structuré
- ✅ Tests automatisés
- ✅ Code formaté et linté
- ✅ Documentation complète
