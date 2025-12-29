# Credit_Score - Application Robuste

Application robuste et moderne pour la gestion de scores de crédit, développée avec FastAPI, SQLAlchemy et Pydantic.

## 🚀 Caractéristiques

- **Architecture modulaire** : Structure claire et organisée
- **Gestion d'erreurs robuste** : Exceptions personnalisées avec gestion centralisée
- **Sécurité** : Authentification JWT, hashage des mots de passe, validation stricte
- **Validation des données** : Schémas Pydantic pour une validation automatique
- **Logging structuré** : Logs détaillés pour le debugging et le monitoring
- **Tests complets** : Suite de tests unitaires et d'intégration
- **Documentation automatique** : Swagger/OpenAPI intégré
- **Configuration flexible** : Variables d'environnement avec validation
- **Type hints** : Support complet des annotations de type Python

## 📋 Prérequis

- Python 3.10+
- PostgreSQL (ou SQLite pour le développement)
- pip

## 🛠️ Installation

1. **Cloner le projet** (si applicable)

2. **Créer un environnement virtuel** :
```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

3. **Installer les dépendances** :
```bash
make install
# ou
pip install -r requirements.txt
```

4. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

5. **Initialiser la base de données** :
```bash
# Créer la base de données PostgreSQL
# Puis modifier DATABASE_URL dans .env
```

## 🏃 Utilisation

### Lancer l'application

```bash
make run
# ou
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

L'application sera accessible sur `http://localhost:8000`

### Documentation API

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## 📁 Structure du Projet

```
.
├── app/
│   ├── api/              # Routes API
│   │   └── v1/          # Version 1 de l'API
│   │       ├── auth.py  # Authentification
│   │       └── users.py # Gestion des utilisateurs
│   ├── core/            # Configuration centrale
│   │   ├── config.py    # Configuration de l'app
│   │   ├── database.py  # Configuration DB
│   │   ├── exceptions.py # Exceptions personnalisées
│   │   ├── logging_config.py # Configuration logging
│   │   └── security.py # Sécurité et JWT
│   ├── models/          # Modèles SQLAlchemy
│   │   └── user.py
│   ├── schemas/         # Schémas Pydantic
│   │   └── user.py
│   └── main.py          # Point d'entrée FastAPI
├── tests/               # Tests
│   ├── conftest.py     # Configuration pytest
│   ├── test_auth.py    # Tests d'authentification
│   └── test_users.py   # Tests utilisateurs
├── requirements.txt     # Dépendances Python
├── .env.example        # Exemple de configuration
├── Makefile            # Commandes utiles
└── README.md           # Ce fichier
```

## 🧪 Tests

```bash
# Lancer tous les tests
make test

# Avec couverture de code
pytest tests/ --cov=app --cov-report=html
```

## 🔍 Qualité du Code

```bash
# Vérifier le code (linting)
make lint

# Formater le code
make format
```

## 🔐 Sécurité

- **Mots de passe** : Hashés avec bcrypt
- **JWT** : Tokens d'accès avec expiration configurable
- **Validation** : Validation stricte des entrées utilisateur
- **CORS** : Configuration sécurisée des origines autorisées
- **Variables sensibles** : Stockées dans `.env` (non versionné)

## 📝 API Endpoints

### Authentification
- `POST /api/v1/auth/register` - Enregistrer un nouvel utilisateur
- `POST /api/v1/auth/login` - Se connecter et obtenir un token

### Utilisateurs (nécessite authentification)
- `GET /api/v1/users/me` - Obtenir les informations de l'utilisateur actuel
- `GET /api/v1/users/` - Lister tous les utilisateurs
- `GET /api/v1/users/{id}` - Obtenir un utilisateur par ID
- `PATCH /api/v1/users/{id}` - Mettre à jour un utilisateur
- `DELETE /api/v1/users/{id}` - Supprimer un utilisateur (admin seulement)

### Santé
- `GET /health` - Vérification de santé de l'application
- `GET /` - Point d'entrée de l'API

## 🏗️ Architecture Robuste

### Gestion des Erreurs
- Exceptions personnalisées avec codes HTTP appropriés
- Gestionnaire d'exceptions global
- Messages d'erreur structurés

### Logging
- Logging structuré avec structlog
- Logs de toutes les requêtes HTTP
- Niveaux de log configurables

### Validation
- Validation automatique avec Pydantic
- Validation des mots de passe (complexité)
- Validation des emails

### Base de Données
- SQLAlchemy ORM
- Gestion des transactions
- Pool de connexions configuré

## 🚀 Déploiement

1. Configurer les variables d'environnement pour la production
2. Désactiver le mode DEBUG
3. Configurer une base de données PostgreSQL robuste
4. Utiliser un serveur WSGI comme Gunicorn avec Uvicorn workers
5. Configurer HTTPS avec un reverse proxy (Nginx)

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt.