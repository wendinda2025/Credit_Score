# Système de Gestion de Demandes de Crédit - PAMF

## 🎯 Vue d'ensemble

Application web robuste pour la gestion complète des demandes de crédit, incluant :
- Gestion des informations clients
- Création et suivi des demandes de prêt
- Évaluation financière complète
- Workflow d'approbation multi-niveaux
- Analyse des ratios et recommandations
- Gestion des garanties

## 🏗️ Architecture

### Backend
- **Framework** : FastAPI (Python 3.11+)
- **Base de données** : PostgreSQL avec SQLAlchemy ORM
- **Authentification** : JWT (JSON Web Tokens)
- **Validation** : Pydantic models
- **Tests** : Pytest avec couverture de code
- **Documentation** : Swagger/OpenAPI automatique

### Frontend
- **Framework** : React 18 avec TypeScript
- **State Management** : React Context + Hooks
- **Styling** : Tailwind CSS pour un design moderne
- **Formulaires** : React Hook Form avec validation
- **HTTP Client** : Axios
- **Tests** : Jest + React Testing Library

### Base de données
- **SGBD** : PostgreSQL 15+
- **Migrations** : Alembic
- **Architecture** : Normalisée avec relations optimisées

## 🚀 Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Git

### Configuration Backend

```bash
# Créer l'environnement virtuel
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos paramètres de connexion

# Créer la base de données et lancer les migrations
alembic upgrade head

# Lancer le serveur de développement
uvicorn app.main:app --reload
```

Le backend sera accessible sur http://localhost:8000
Documentation API : http://localhost:8000/docs

### Configuration Frontend

```bash
# Installer les dépendances
cd frontend
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local si nécessaire

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

## 📊 Structure du Projet

```
/workspace/
├── backend/
│   ├── app/
│   │   ├── api/            # Endpoints API
│   │   ├── models/         # Modèles SQLAlchemy
│   │   ├── schemas/        # Schémas Pydantic
│   │   ├── services/       # Logique métier
│   │   ├── core/           # Configuration, sécurité
│   │   └── main.py         # Point d'entrée
│   ├── tests/              # Tests unitaires et d'intégration
│   ├── alembic/            # Migrations de base de données
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── contexts/       # Contextes React
│   │   └── types/          # Types TypeScript
│   ├── public/
│   └── package.json
└── README.md
```

## 🔐 Sécurité

- **Authentification JWT** avec refresh tokens
- **Hachage des mots de passe** avec bcrypt
- **Validation stricte** des entrées côté serveur
- **CORS** configuré pour la production
- **Rate limiting** sur les endpoints sensibles
- **SQL injection** prévenue par SQLAlchemy ORM
- **XSS protection** avec sanitization des données

## 📝 Fonctionnalités Principales

### 1. Gestion des Clients
- Création et modification des profils clients
- Historique des demandes
- Documents associés
- Références de contact

### 2. Demandes de Crédit
- Création de nouvelles demandes
- Calcul automatique des ratios financiers
- Gestion des garanties
- Évaluation des risques

### 3. Workflow d'Approbation
- **Agent de Crédit** : Recommandation initiale
- **Risk Officer** : Validation des risques
- **Chef d'Agence** : Approbation finale
- **Comité de Crédit** : Décision finale
- Historique complet des décisions

### 4. Analyses Financières
- Bilan comptable
- Compte d'exploitation
- Cash flow prévisionnel
- Budget familial
- Analyse des ratios (liquidité, solvabilité, rentabilité)

### 5. Reporting
- Tableaux de bord interactifs
- Statistiques en temps réel
- Export des données (PDF, Excel)
- Graphiques et visualisations

## 🧪 Tests

### Backend
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Frontend
```bash
cd frontend
npm test
npm run test:coverage
```

## 🔄 Workflow de Développement

1. **Créer une branche** : `git checkout -b feature/nom-feature`
2. **Développer** avec tests
3. **Valider** : `git commit -m "Description"`
4. **Pousser** : `git push origin feature/nom-feature`
5. **Pull Request** pour review

## 📚 API Documentation

La documentation complète de l'API est disponible automatiquement via Swagger UI à l'adresse :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## 🛠️ Technologies Utilisées

### Backend
- FastAPI - Framework web moderne
- SQLAlchemy - ORM puissant
- Pydantic - Validation des données
- Alembic - Migrations de base de données
- Pytest - Framework de tests
- python-jose - JWT
- passlib - Hachage de mots de passe
- psycopg2 - Driver PostgreSQL

### Frontend
- React 18 - Bibliothèque UI
- TypeScript - Typage statique
- Tailwind CSS - Framework CSS utility-first
- React Hook Form - Gestion des formulaires
- Axios - Client HTTP
- React Router - Routing
- Chart.js - Graphiques
- date-fns - Manipulation de dates

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'équipe de développement

## 📄 Licence

Propriétaire - PAMF © 2025

## 👥 Contributeurs

- Équipe de développement PAMF

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2025
