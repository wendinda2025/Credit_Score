# 🏦 Plateforme de Microfinance

Une plateforme complète de gestion de microfinance, équivalente fonctionnellement à MIFOS X / Apache Fineract, mais moderne, modulaire et extensible.

## 🌟 Fonctionnalités

### Gestion des Clients
- ✅ Personnes physiques, groupes solidaires, entreprises
- ✅ KYC complet (pièces d'identité, photos, documents)
- ✅ Gestion des statuts (actif, suspendu, clôturé)
- ✅ Membres de famille et contacts d'urgence

### Produits de Prêts
- ✅ Paramétrage flexible des produits
- ✅ Taux d'intérêt (fixe, dégressif)
- ✅ Méthodes d'amortissement (EMI, principal constant)
- ✅ Frais de dossier et pénalités configurables
- ✅ Calendrier d'amortissement automatique

### Gestion des Prêts
- ✅ Cycle complet: demande → approbation → décaissement → remboursements
- ✅ Calendrier de remboursement dynamique
- ✅ Gestion des impayés et pénalités
- ✅ Garanties et garants
- ✅ Rééchelonnement et anticipation

### Épargne
- ✅ Comptes d'épargne à vue et à terme
- ✅ Dépôts et retraits
- ✅ Blocages de fonds
- ✅ Calcul des intérêts

### Comptabilité
- ✅ Plan comptable paramétrable
- ✅ Écritures automatiques (partie double)
- ✅ Journal comptable
- ✅ Balance de vérification
- ✅ Compte de résultat

### Reporting
- ✅ Tableau de bord temps réel
- ✅ PAR (Portfolio At Risk)
- ✅ Production de prêts
- ✅ Collections
- ✅ Exports PDF/Excel

### Sécurité
- ✅ Authentification JWT avec refresh tokens
- ✅ RBAC (Contrôle d'accès basé sur les rôles)
- ✅ Journal d'audit complet
- ✅ Verrouillage de compte après tentatives échouées

## 🛠️ Stack Technique

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Base de données**: PostgreSQL
- **ORM**: Prisma
- **Authentification**: JWT + Passport
- **Documentation API**: Swagger/OpenAPI
- **Validation**: class-validator

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand + React Query
- **UI**: Tailwind CSS + Headless UI
- **Routing**: React Router v6
- **Forms**: React Hook Form

### Infrastructure
- **Conteneurisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (optionnel)

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optionnel)

### Installation avec Docker (recommandé)

```bash
# Cloner le projet
cd microfinance-app

# Démarrer les services
cd docker
docker-compose up -d

# Attendre que PostgreSQL soit prêt, puis exécuter les migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### Installation manuelle

#### Backend
```bash
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate dev

# Initialiser les données
npx prisma db seed

# Démarrer le serveur
npm run start:dev
```

#### Frontend
```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
```

## 📚 Documentation API

Une fois le backend démarré, accédez à la documentation Swagger:

```
http://localhost:3000/docs
```

## 🔐 Identifiants par défaut

```
Email: admin@microfinance.local
Mot de passe: Admin@123!
```

## 📁 Structure du Projet

```
microfinance-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modèle de données
│   │   └── seed.ts            # Données initiales
│   ├── src/
│   │   ├── common/            # Utilitaires partagés
│   │   ├── config/            # Configuration
│   │   ├── modules/
│   │   │   ├── auth/          # Authentification
│   │   │   ├── users/         # Gestion utilisateurs
│   │   │   ├── clients/       # Gestion clients
│   │   │   ├── loans/         # Gestion prêts
│   │   │   ├── savings/       # Gestion épargne
│   │   │   ├── accounting/    # Comptabilité
│   │   │   ├── reports/       # Reporting
│   │   │   └── audit/         # Journal d'audit
│   │   └── prisma/            # Service Prisma
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── pages/             # Pages
│   │   ├── services/          # Services API
│   │   ├── store/             # State management
│   │   └── types/             # Types TypeScript
│   └── Dockerfile
├── docker/
│   └── docker-compose.yml
└── README.md
```

## 🏗️ Architecture

### Architecture Hexagonale
Le backend suit une architecture modulaire inspirée de l'architecture hexagonale:

```
Module/
├── dto/           # Data Transfer Objects (entrée/sortie)
├── interfaces/    # Interfaces et types
├── guards/        # Guards de sécurité
├── services/      # Logique métier
├── controller.ts  # Endpoints REST
└── module.ts      # Configuration du module
```

### Modèle de Données

Le schéma Prisma définit les entités principales:

- **User, Role, Permission**: Sécurité et RBAC
- **Client, FamilyMember, GroupMember**: Gestion des clients
- **LoanProduct, Loan, LoanSchedule, LoanTransaction**: Prêts
- **SavingsProduct, SavingsAccount, SavingsTransaction**: Épargne
- **GLAccount, JournalEntry, JournalEntryLine**: Comptabilité
- **AuditLog**: Journal d'audit

## 🔧 Configuration

### Variables d'environnement (Backend)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement | `development` |
| `PORT` | Port du serveur | `3000` |
| `DATABASE_URL` | URL PostgreSQL | - |
| `JWT_SECRET` | Clé secrète JWT | - |
| `JWT_EXPIRES_IN` | Durée token | `15m` |
| `JWT_REFRESH_SECRET` | Clé refresh token | - |
| `JWT_REFRESH_EXPIRES_IN` | Durée refresh | `7d` |
| `DEFAULT_CURRENCY` | Devise par défaut | `XOF` |

## 📊 Indicateurs Clés

- **PAR30/PAR90**: Portfolio At Risk à 30/90 jours
- **Taux de remboursement**: Collections / Attendu
- **Encours total**: Somme des prêts actifs
- **Taux de croissance**: Évolution du portefeuille

## 🧪 Tests

```bash
# Tests unitaires backend
cd backend
npm run test

# Tests e2e backend
npm run test:e2e

# Couverture
npm run test:cov
```

## 🌍 Internationalisation

L'application supporte:
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais

## 💱 Devises Supportées

- XOF (Franc CFA BCEAO)
- XAF (Franc CFA BEAC)
- EUR (Euro)
- USD (Dollar US)

## 🔒 Conformité

L'application intègre les bonnes pratiques de:
- Sécurité des données financières
- Traçabilité des opérations
- Séparation des responsabilités
- Audit trail complet

## 📄 Licence

MIT License

## 👥 Contribution

Les contributions sont les bienvenues! Veuillez consulter le guide de contribution.

## 📞 Support

Pour toute question ou support, ouvrez une issue sur GitHub.

---

Développé avec ❤️ pour la microfinance en Afrique de l'Ouest
