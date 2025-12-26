# 🏦 Plateforme de Gestion de Microfinance

Application complète de gestion de microfinance, équivalente fonctionnellement à MIFOS/Apache Fineract, mais moderne, modulaire et extensible.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technologique](#stack-technologique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Structure du projet](#structure-du-projet)

## ✨ Fonctionnalités

### 🧍 Gestion des clients
- Personnes physiques
- Groupes solidaires
- Entreprises
- KYC (pièces d'identité, photos, statuts)
- Statuts (actif, suspendu, clôturé)

### 💳 Produits de prêts
- Paramétrage des produits :
  - Taux d'intérêt (fixe, dégressif)
  - Périodicité de remboursement
  - Pénalités et frais
- Types de prêts :
  - Individuel
  - Groupe
- Calendrier d'amortissement automatique
- Décaissement
- Rééchelonnement
- Anticipation de remboursement
- Gestion des impayés

### 💰 Épargne
- Comptes d'épargne
- Dépôts et retraits
- Intérêts créditeurs
- Blocage / clôture

### 📊 Comptabilité
- Plan comptable configurable
- Journaux comptables
- Écritures automatiques :
  - Décaissement
  - Remboursement
  - Intérêts
  - Pénalités
- Principe de la partie double
- États financiers :
  - Balance
  - Grand livre
  - Compte de résultat

### 📈 Reporting & supervision
- Tableaux de bord
- Indicateurs :
  - PAR (Portfolio at Risk)
  - Taux de remboursement
  - Encours
- Exports PDF/Excel (à venir)
- Rapports réglementaires paramétrables

### 🔐 Sécurité & conformité
- Gestion des utilisateurs
- Rôles :
  - Admin
  - Caissier
  - Agent crédit
  - Auditeur
- Journal d'audit :
  - Connexions
  - Actions critiques
- Historisation des modifications
- Conformité PCI-DSS (logique applicative)

### 🌐 Multidevise & internationalisation
- Support multi-devises
- Langues :
  - Français (par défaut)
  - Anglais (à venir)

## 🏗️ Architecture

L'application suit une architecture modulaire/hexagonale :

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      API REST (NestJS)                  │
│  ┌───────────────────────────────────┐ │
│  │  Modules métier                   │ │
│  │  - Auth, Users, Clients           │ │
│  │  - Loans, Savings                 │ │
│  │  - Accounting, Reports, Audit     │ │
│  └───────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Base de données (PostgreSQL)       │
└─────────────────────────────────────────┘
```

## 🛠️ Stack technologique

### Backend
- **Framework**: NestJS (Node.js/TypeScript)
- **Base de données**: PostgreSQL
- **ORM**: Prisma
- **Authentification**: JWT + RBAC
- **Documentation API**: Swagger/OpenAPI

### Frontend
- **Framework**: React.js (à venir)
- **Styling**: Tailwind CSS (à venir)

### Infrastructure
- **Conteneurisation**: Docker + Docker Compose
- **CI/CD**: (à configurer)

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optionnel)

### Installation locale

1. **Cloner le projet**
```bash
git clone <repository-url>
cd microfinance-app
```

2. **Installer les dépendances**
```bash
cd backend
npm install
```

3. **Configurer la base de données**
```bash
# Créer un fichier .env à partir de .env.example
cp .env.example .env

# Modifier DATABASE_URL dans .env
```

4. **Initialiser la base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate dev

# Seed les données initiales
npm run prisma:seed
```

5. **Démarrer l'application**
```bash
npm run start:dev
```

L'API sera accessible sur `http://localhost:3000`
La documentation Swagger sera disponible sur `http://localhost:3000/api/docs`

### Installation avec Docker

```bash
cd docker
docker-compose up -d
```

## ⚙️ Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/microfinance_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1h"

# Application
NODE_ENV="development"
PORT=3000
API_PREFIX="api/v1"

# Security
BCRYPT_ROUNDS=10
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Organization
DEFAULT_CURRENCY="XOF"
DEFAULT_LOCALE="fr"
```

## 📖 Utilisation

### Connexion

Après le seed, utilisez les identifiants suivants :
- **Username**: `admin`
- **Password**: `admin123`

### Endpoints principaux

#### Authentification
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/register` - Inscription
- `GET /api/v1/auth/profile` - Profil utilisateur

#### Clients
- `GET /api/v1/clients` - Liste des clients
- `POST /api/v1/clients` - Créer un client
- `GET /api/v1/clients/:id` - Détails d'un client

#### Prêts
- `GET /api/v1/loans` - Liste des prêts
- `POST /api/v1/loans` - Créer un prêt
- `POST /api/v1/loans/:id/approve` - Approuver un prêt
- `POST /api/v1/loans/:id/disburse` - Décaisser un prêt
- `POST /api/v1/loans/:id/repayments` - Enregistrer un remboursement

#### Épargne
- `GET /api/v1/savings/accounts` - Liste des comptes
- `POST /api/v1/savings/accounts` - Créer un compte
- `POST /api/v1/savings/accounts/:id/transactions` - Transaction

#### Comptabilité
- `GET /api/v1/accounting/chart-of-accounts` - Plan comptable
- `POST /api/v1/accounting/journal-entries` - Créer une écriture
- `GET /api/v1/accounting/balance-sheet` - Bilan

#### Reporting
- `GET /api/v1/reports/dashboard` - Tableau de bord
- `GET /api/v1/reports/par` - Portfolio at Risk

## 📚 API Documentation

La documentation complète de l'API est disponible via Swagger à l'adresse :
```
http://localhost:3000/api/docs
```

## 📁 Structure du projet

```
microfinance-app/
├── backend/
│   ├── src/
│   │   ├── common/          # Utilitaires communs
│   │   ├── modules/         # Modules métier
│   │   │   ├── auth/        # Authentification
│   │   │   ├── users/       # Utilisateurs
│   │   │   ├── clients/     # Clients
│   │   │   ├── loans/       # Prêts
│   │   │   ├── savings/     # Épargne
│   │   │   ├── accounting/  # Comptabilité
│   │   │   ├── reports/     # Reporting
│   │   │   ├── audit/       # Audit
│   │   │   └── organizations/ # Organisations
│   │   └── prisma/          # Service Prisma
│   ├── prisma/
│   │   ├── schema.prisma    # Schéma de base de données
│   │   └── seed.ts          # Données initiales
│   └── package.json
├── frontend/                # (À venir)
├── docker/
│   └── docker-compose.yml
└── README.md
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests e2e
npm run test:e2e
```

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- Hachage des mots de passe avec bcrypt
- Rate limiting sur les endpoints
- Validation des entrées avec class-validator
- Journalisation complète des actions (audit trail)
- RBAC (Role-Based Access Control)

## 📝 Modèle de données

Le modèle de données est défini dans `prisma/schema.prisma` et inclut :

- **Organisations & Utilisateurs**: Gestion multi-tenant
- **Clients**: Personnes, groupes, entreprises avec KYC
- **Prêts**: Produits, demandes, approbations, décaissements, remboursements
- **Épargne**: Produits, comptes, transactions
- **Comptabilité**: Plan comptable, écritures, journaux
- **Audit**: Journalisation complète

## 🚧 Roadmap

- [ ] Frontend React complet
- [ ] Exports PDF/Excel
- [ ] Notifications
- [ ] Intégration SMS/Mobile Money
- [ ] Module de scoring
- [ ] API mobile
- [ ] Multi-devises avancé
- [ ] Internationalisation complète

## 📄 Licence

MIT

## 👥 Contribution

Les contributions sont les bienvenues ! Veuillez créer une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, veuillez créer une issue sur le repository.

---

**Note**: Cette application est conçue pour un environnement réel de microfinance en Afrique de l'Ouest. Assurez-vous de configurer correctement la sécurité et les paramètres de production avant le déploiement.
