# 🎉 Bienvenue dans le Système de Gestion de Crédit PAMF !

## 🚀 Démarrage Rapide (3 minutes)

### 📋 Étape 1 : Configuration de la Base de Données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE pamf_credit;
CREATE USER pamf_user WITH ENCRYPTED PASSWORD 'pamf_password';
GRANT ALL PRIVILEGES ON DATABASE pamf_credit TO pamf_user;
\q
```

### 🔧 Étape 2 : Installation

```bash
# Option Simple : Utiliser le Makefile
make install
```

**OU manuellement :**

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python -m app.utils.init_db

# Frontend (nouveau terminal)
cd frontend
npm install
```

### ▶️ Étape 3 : Lancer l'Application

```bash
# Option Simple
make dev
```

**OU manuellement :**

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 🌐 Accès

- **Application** : http://localhost:3000
- **API Documentation** : http://localhost:8000/docs
- **Backend API** : http://localhost:8000

### 👤 Connexion

Utilisez un de ces comptes de test :

| Rôle | Username | Mot de passe |
|------|----------|--------------|
| **Admin** | `admin` | `admin123` |
| Agent | `agent` | `agent123` |
| Risk Officer | `risk` | `risk123` |
| Chef d'Agence | `chef` | `chef123` |

---

## 📚 Documentation Complète

- 📘 **[README.md](README.md)** - Vue d'ensemble du projet
- 🔧 **[INSTALLATION.md](INSTALLATION.md)** - Guide d'installation détaillé
- 🚀 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Déploiement en production
- 👥 **[GUIDE_UTILISATEUR.md](GUIDE_UTILISATEUR.md)** - Manuel utilisateur complet
- 🤝 **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide de contribution
- 📝 **[CHANGELOG.md](CHANGELOG.md)** - Historique des versions
- 🎯 **[RESUME_PROJET.md](RESUME_PROJET.md)** - Résumé technique complet

---

## 🎯 Que faire ensuite ?

### Pour Tester l'Application

1. **Connectez-vous** avec le compte admin
2. **Créez un client** dans "Clients" > "Nouveau Client"
3. **Créez une demande** dans "Demandes" > "Nouvelle Demande"
4. **Complétez l'analyse financière**
5. **Testez le workflow d'approbation** avec différents rôles

### Pour Développer

1. Lisez le **[CONTRIBUTING.md](CONTRIBUTING.md)**
2. Explorez le code dans `backend/app` et `frontend/src`
3. Lancez les tests : `make test`
4. Consultez l'API : http://localhost:8000/docs

### Pour Déployer

1. Lisez le **[DEPLOYMENT.md](DEPLOYMENT.md)**
2. Configurez votre serveur
3. Utilisez Docker : `docker-compose up -d`
4. Ou suivez le guide de déploiement manuel

---

## 🆘 Besoin d'Aide ?

### Problèmes Courants

**Port déjà utilisé :**
```bash
# Backend sur un autre port
uvicorn app.main:app --reload --port 8001

# Frontend : modifiez vite.config.ts
```

**Erreur de base de données :**
```bash
# Vérifiez que PostgreSQL est lancé
sudo systemctl status postgresql

# Vérifiez les credentials dans backend/.env
```

**Erreur d'import Python :**
```bash
# Activez l'environnement virtuel
source backend/venv/bin/activate
which python  # Doit pointer vers le venv
```

### Support

- 📧 Email : support@pamf.bf
- 📖 Documentation : Tous les fichiers .md
- 🐛 Issues : Créez une issue sur GitHub

---

## ✨ Fonctionnalités Principales

- ✅ Gestion complète des clients
- ✅ Demandes de crédit avec garanties
- ✅ Analyse financière automatisée
- ✅ Calcul automatique de tous les ratios
- ✅ Recommandations basées sur l'analyse
- ✅ Workflow d'approbation multi-niveaux
- ✅ Authentification sécurisée avec rôles
- ✅ Interface moderne et responsive
- ✅ Documentation API complète
- ✅ Tests unitaires et d'intégration
- ✅ Prêt pour la production

---

## 📊 Architecture

```
Application Web Full Stack
├── Backend (FastAPI + PostgreSQL)
│   ├── 8 Modèles de données
│   ├── 30+ Endpoints API
│   ├── Authentification JWT
│   ├── Calculs financiers automatiques
│   └── Tests complets
│
└── Frontend (React + TypeScript)
    ├── Interface moderne (Tailwind)
    ├── Composants réutilisables
    ├── Formulaires avec validation
    ├── Routes protégées
    └── Design responsive
```

---

## 🎉 Prêt à Commencer ?

```bash
# Lancez l'application maintenant !
make install
make dev
```

**Puis ouvrez votre navigateur sur http://localhost:3000**

Bon développement ! 🚀

---

**PAMF - Système de Gestion de Crédit v1.0.0**  
© 2025 - Tous droits réservés
