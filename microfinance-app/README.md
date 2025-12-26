# 🏦 Plateforme de Microfinance - Système Complet de Gestion

## 📋 Vue d'ensemble

Plateforme web moderne de gestion de microfinance, équivalente fonctionnellement à **MIFOS X / Apache Fineract**, mais construite avec des technologies modernes et une architecture modulaire.

Cette solution complète permet la gestion de tous les aspects d'une institution de microfinance :
- ✅ Gestion des clients (personnes physiques, groupes, entreprises)
- ✅ Produits et prêts (création, approbation, décaissement, remboursement)
- ✅ Comptes d'épargne (dépôts, retraits, intérêts)
- ✅ Comptabilité en partie double (plan comptable, écritures, états financiers)
- ✅ Reporting et tableaux de bord (PAR, encours, performance)
- ✅ Audit et traçabilité complète
- ✅ Sécurité et gestion des rôles (RBAC)

---

## 🏗️ Architecture

### Stack Technique

**Backend:**
- **Framework:** NestJS (Node.js + TypeScript)
- **Base de données:** PostgreSQL 15
- **ORM:** Prisma
- **Authentification:** JWT + Refresh Tokens
- **Validation:** class-validator, class-transformer
- **Documentation API:** Swagger / OpenAPI

**Frontend:** (À développer)
- React.js + TypeScript
- Tailwind CSS
- React Query
- Zustand (state management)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (reverse proxy)

### Architecture Hexagonale / Modulaire

```
backend/
├── src/
│   ├── common/           # Utilitaires, decorators, guards, pipes
│   ├── config/           # Configuration centralisée
│   ├── prisma/           # Service Prisma
│   └── modules/
│       ├── auth/         # Authentification & autorisation
│       ├── users/        # Gestion des utilisateurs
│       ├── clients/      # Gestion des clients
│       ├── loans/        # Gestion des prêts
│       ├── savings/      # Gestion de l'épargne
│       ├── accounting/   # Comptabilité
│       ├── audit/        # Journal d'audit
│       ├── organizations/# Multi-tenant
│       └── reports/      # Reporting & analytics
```

---

## 🚀 Fonctionnalités Détaillées

### 1️⃣ Gestion des Clients

**Types de clients:**
- Personnes physiques
- Groupes solidaires
- Micro-entreprises

**Fonctionnalités:**
- KYC complet (pièces d'identité, photos, documents)
- Gestion des statuts (actif, suspendu, clôturé, décédé)
- Historique complet des actions
- Recherche et filtres avancés

**Endpoints API:**
```
POST   /clients              - Créer un client
GET    /clients              - Lister les clients
GET    /clients/:id          - Détails d'un client
PUT    /clients/:id          - Modifier un client
DELETE /clients/:id          - Supprimer (soft delete)
POST   /clients/:id/activate - Activer un client
POST   /clients/:id/suspend  - Suspendre un client
```

---

### 2️⃣ Gestion des Prêts

**Cycle de vie complet:**
1. Création de produits de prêt (paramétrage)
2. Demande de prêt
3. Approbation / Rejet
4. Décaissement
5. Remboursement
6. Clôture

**Méthodes d'intérêt:**
- **Taux forfaitaire (Flat Rate):** Intérêt calculé sur le montant initial
- **Taux dégressif (Declining Balance):** Intérêt calculé sur le solde restant

**Fonctionnalités avancées:**
- ✅ Calendrier d'amortissement automatique
- ✅ Gestion des pénalités de retard
- ✅ Rééchelonnement de prêts
- ✅ Remboursement anticipé
- ✅ Calcul du PAR (Portfolio at Risk)
- ✅ Remboursements partiels (priorité: pénalités > intérêts > frais > principal)

**Fréquences de remboursement:**
- Quotidien
- Hebdomadaire
- Bi-hebdomadaire
- Mensuel
- Trimestriel
- Semestriel
- Annuel

**Endpoints API:**
```
POST   /loans/products                    - Créer un produit de prêt
GET    /loans/products                    - Lister les produits
POST   /loans/applications                - Créer une demande
POST   /loans/:id/approve                 - Approuver un prêt
POST   /loans/:id/reject                  - Rejeter un prêt
POST   /loans/:id/disburse                - Décaisser
POST   /loans/:id/repay                   - Enregistrer un remboursement
POST   /loans/:id/reschedule              - Rééchelonner
POST   /loans/penalties/calculate         - Calculer les pénalités
GET    /loans/statistics/overview         - Statistiques
```

---

### 3️⃣ Gestion de l'Épargne

**Types de produits d'épargne:**
- Compte d'épargne classique
- Compte à terme
- Compte d'épargne à vue

**Fonctionnalités:**
- ✅ Dépôts et retraits
- ✅ Calcul automatique des intérêts créditeurs
- ✅ Frais de tenue de compte
- ✅ Blocage / déblocage de comptes
- ✅ Limites de retrait configurables
- ✅ Solde minimum requis

**Endpoints API:**
```
POST   /savings/products                  - Créer un produit d'épargne
GET    /savings/products                  - Lister les produits
POST   /savings/accounts                  - Créer un compte
POST   /savings/accounts/:id/activate     - Activer
POST   /savings/accounts/:id/deposit      - Dépôt
POST   /savings/accounts/:id/withdraw     - Retrait
POST   /savings/accounts/:id/block        - Bloquer
POST   /savings/interest/calculate-and-post - Affecter les intérêts
GET    /savings/statistics/overview       - Statistiques
```

---

### 4️⃣ Comptabilité (Très Important)

**Principe de la partie double:**
- Chaque écriture est équilibrée (Débit = Crédit)
- Validation automatique des écritures

**Plan comptable:**
- Types de comptes : Actif, Passif, Capitaux propres, Revenus, Charges
- Hiérarchie des comptes (comptes parents/enfants)
- Comptes automatiques vs manuels

**États financiers:**
- ✅ **Balance générale** (Trial Balance)
- ✅ **Grand livre** (General Ledger)
- ✅ **Compte de résultat** (Income Statement)
- ✅ **Bilan** (Balance Sheet)

**Écritures automatiques:**
Les écritures comptables sont créées automatiquement pour :
- Décaissement de prêt
- Remboursement de prêt (principal, intérêts, frais)
- Dépôt d'épargne
- Retrait d'épargne
- Affectation d'intérêts

**Endpoints API:**
```
POST   /accounting/accounts               - Créer un compte comptable
GET    /accounting/accounts               - Lister les comptes
POST   /accounting/journal-entries        - Créer une écriture
POST   /accounting/journal-entries/:id/reverse - Annuler une écriture
GET    /accounting/reports/trial-balance  - Balance générale
GET    /accounting/reports/ledger         - Grand livre
GET    /accounting/reports/income-statement - Compte de résultat
GET    /accounting/reports/balance-sheet  - Bilan
POST   /accounting/close-period           - Clôturer une période
```

---

### 5️⃣ Reporting & Analytics

**Rapports disponibles:**

1. **Qualité du portefeuille:**
   - PAR 30, PAR 90
   - Taux de remboursement
   - Prêts en retard

2. **Décaissements:**
   - Volume et montant des décaissements
   - Par produit, par agent, par période

3. **Encaissements:**
   - Remboursements collectés
   - Par mode de paiement

4. **Épargne:**
   - Soldes totaux
   - Dépôts et retraits
   - Intérêts payés

5. **Démographie clients:**
   - Par type, genre, statut
   - Répartition géographique

6. **Performance financière:**
   - Revenus d'intérêts
   - Revenus de frais
   - Charges d'intérêts
   - Résultat net

**Dashboard général:**
```json
{
  "overview": {
    "totalClients": 1250,
    "activeLoans": 450,
    "activeSavingsAccounts": 800
  },
  "loans": {
    "totalDisbursed": 5000000,
    "totalOutstanding": 3200000,
    "overdueLoans": 25,
    "portfolioAtRisk": 3.5
  },
  "savings": {
    "totalBalance": 1500000
  }
}
```

**Endpoints API:**
```
POST   /reports/generate                  - Générer un rapport
GET    /reports/dashboard                 - Dashboard général
```

---

### 6️⃣ Sécurité & Audit

**Authentification:**
- JWT avec access token (15 min) et refresh token (7 jours)
- Hashage des mots de passe avec bcrypt
- Protection contre les attaques par force brute

**Autorisation (RBAC):**
- **SUPER_ADMIN:** Gestion multi-organisations
- **ADMIN:** Gestion complète de l'organisation
- **MANAGER:** Supervision, approbations
- **LOAN_OFFICER:** Gestion des prêts
- **CASHIER:** Opérations de caisse
- **AUDITOR:** Lecture seule, consultation des logs

**Journal d'audit:**
Toutes les actions importantes sont tracées :
- Connexions/déconnexions
- Créations/modifications/suppressions
- Approbations/rejets
- Transactions financières

```typescript
{
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT',
  entityType: 'LOAN' | 'CLIENT' | 'SAVINGS_ACCOUNT',
  entityId: 'uuid',
  oldValue: {...},
  newValue: {...},
  userId: 'uuid',
  ipAddress: '192.168.1.1',
  timestamp: '2024-12-26T10:30:00Z'
}
```

**Endpoints API:**
```
POST   /auth/register                     - Inscription
POST   /auth/login                        - Connexion
POST   /auth/refresh                      - Rafraîchir le token
POST   /auth/logout                       - Déconnexion
GET    /audit/logs                        - Logs d'audit
GET    /audit/entity/:type/:id            - Historique d'une entité
```

---

## 📊 Modèle de Données

### Entités Principales

**Organization** (Multi-tenant)
```prisma
model Organization {
  id               String   @id @default(uuid())
  name             String
  email            String?
  phone            String?
  address          String?
  isActive         Boolean  @default(true)
  users            User[]
  clients          Client[]
  loans            Loan[]
  // ... autres relations
}
```

**Client**
```prisma
model Client {
  id              String       @id @default(uuid())
  accountNumber   String       @unique
  type            ClientType   // INDIVIDUAL, GROUP, BUSINESS
  firstName       String?
  lastName        String?
  dateOfBirth     DateTime?
  gender          Gender?
  status          ClientStatus // PENDING, ACTIVE, SUSPENDED, CLOSED
  // ... KYC fields
}
```

**Loan**
```prisma
model Loan {
  id                    String         @id @default(uuid())
  accountNumber         String         @unique
  principalAmount       Float
  interestRate          Float
  numberOfInstallments  Int
  repaymentFrequency    RepaymentFrequency
  interestMethod        InterestMethod // FLAT, DECLINING_BALANCE
  status                LoanStatus     // PENDING, APPROVED, ACTIVE, CLOSED
  repayments            LoanRepayment[]
  transactions          LoanTransaction[]
}
```

**SavingsAccount**
```prisma
model SavingsAccount {
  id                         String               @id @default(uuid())
  accountNumber              String               @unique
  balance                    Float                @default(0)
  availableBalance           Float                @default(0)
  nominalAnnualInterestRate  Float
  status                     SavingsAccountStatus // PENDING, ACTIVE, BLOCKED, CLOSED
  transactions               SavingsTransaction[]
}
```

**ChartOfAccount** (Plan comptable)
```prisma
model ChartOfAccount {
  id                    String       @id @default(uuid())
  accountCode           String       @unique
  name                  String
  type                  AccountType  // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  usage                 AccountUsage // MANUAL, AUTO, SYSTEM
  balance               Float        @default(0)
  manualEntriesAllowed  Boolean      @default(true)
}
```

---

## 🔧 Installation & Déploiement

### Prérequis

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optionnel)
- npm ou yarn

### Installation Locale

```bash
# 1. Cloner le projet
git clone <repository-url>
cd microfinance-app

# 2. Installer les dépendances backend
cd backend
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 4. Créer la base de données PostgreSQL
createdb microfinance

# 5. Exécuter les migrations Prisma
npx prisma migrate dev

# 6. (Optionnel) Seeder les données de test
npx prisma db seed

# 7. Démarrer le serveur
npm run start:dev

# L'API est accessible sur http://localhost:3000
# Documentation Swagger : http://localhost:3000/api/docs
```

### Déploiement avec Docker

```bash
# 1. Aller dans le dossier docker
cd docker

# 2. Démarrer tous les services
docker-compose up -d

# 3. Vérifier que tout fonctionne
docker-compose ps

# 4. Voir les logs
docker-compose logs -f backend

# 5. Arrêter les services
docker-compose down
```

### Variables d'Environnement

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/microfinance?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

---

## 📚 Documentation API

La documentation complète de l'API est disponible via **Swagger UI** :

```
http://localhost:3000/api/docs
```

### Exemple d'utilisation

**1. S'authentifier**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Réponse:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**2. Créer un client**
```bash
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "Jean",
    "lastName": "Kouassi",
    "dateOfBirth": "1985-05-15",
    "gender": "MALE",
    "phone": "+225 07 12 34 56 78",
    "address": "Abidjan, Cocody"
  }'
```

**3. Créer un prêt**
```bash
curl -X POST http://localhost:3000/loans/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-uuid",
    "loanProductId": "product-uuid",
    "principalAmount": 500000,
    "interestRate": 15,
    "numberOfInstallments": 12,
    "repaymentFrequency": "MONTHLY"
  }'
```

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de code
npm run test:cov
```

---

## 📦 Structure du Projet Complet

```
microfinance-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Schéma de base de données
│   ├── src/
│   │   ├── common/                # Utilitaires partagés
│   │   ├── config/                # Configuration
│   │   ├── prisma/                # Service Prisma
│   │   ├── modules/
│   │   │   ├── auth/              # Authentification
│   │   │   ├── users/             # Utilisateurs
│   │   │   ├── clients/           # Clients
│   │   │   ├── loans/             # Prêts
│   │   │   │   ├── dto/
│   │   │   │   ├── services/
│   │   │   │   │   ├── loans.service.ts
│   │   │   │   │   └── amortization.service.ts
│   │   │   │   ├── loans.controller.ts
│   │   │   │   └── loans.module.ts
│   │   │   ├── savings/           # Épargne
│   │   │   ├── accounting/        # Comptabilité
│   │   │   ├── audit/             # Audit
│   │   │   ├── organizations/     # Organisations
│   │   │   └── reports/           # Reporting
│   │   ├── main.ts
│   │   └── app.module.ts
│   ├── test/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # À développer
│   └── ...
├── docker/
│   └── docker-compose.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
└── README.md
```

---

## 🎯 Concepts Clés de Microfinance

### PAR (Portfolio at Risk)
Indicateur de la qualité du portefeuille de prêts. Mesure la part du portefeuille en situation de retard.

```
PAR 30 = (Montant des prêts en retard > 30 jours / Encours total) × 100
```

### Calendrier d'Amortissement
Planification des remboursements d'un prêt avec détail :
- Date d'échéance
- Principal dû
- Intérêts dus
- Frais
- Solde restant

### Principe de la Partie Double
Chaque transaction affecte au moins deux comptes :
- Un compte débité (augmentation d'actif ou diminution de passif)
- Un compte crédité (diminution d'actif ou augmentation de passif)

**Exemple - Décaissement d'un prêt de 100 000 FCFA:**
```
Débit:  Compte Prêts Clients        100 000 FCFA
Crédit: Compte Caisse               100 000 FCFA
```

---

## 🌍 Adaptation Afrique de l'Ouest

### Devises Supportées
- FCFA (XOF) - Afrique de l'Ouest
- FCFA (XAF) - Afrique Centrale
- Autres devises configurables

### Langues
- Français (par défaut)
- Anglais
- Extensible pour langues locales

### Conformité Réglementaire
- BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)
- Normes de microfinance UEMOA
- Rapports réglementaires paramétrables

---

## 🔐 Sécurité & Conformité

### Bonnes Pratiques Implémentées
- ✅ Chiffrement des mots de passe (bcrypt)
- ✅ Protection CSRF
- ✅ Validation des entrées
- ✅ Rate limiting
- ✅ HTTPS obligatoire en production
- ✅ Audit trail complet
- ✅ Principe du moindre privilège
- ✅ Séparation des environnements

### Recommandations pour Production
1. Changer TOUS les secrets dans `.env`
2. Activer HTTPS avec certificat SSL
3. Configurer des sauvegardes automatiques de la BDD
4. Mettre en place un monitoring (logs, métriques)
5. Configurer des alertes (prêts en retard, soldes faibles)
6. Former les utilisateurs aux bonnes pratiques

---

## 🚧 Roadmap

### Phase 1 (Complétée) ✅
- [x] Architecture backend complète
- [x] Gestion des clients
- [x] Gestion des prêts (cycle complet)
- [x] Gestion de l'épargne
- [x] Comptabilité en partie double
- [x] Reporting de base
- [x] Audit et sécurité

### Phase 2 (À venir)
- [ ] Frontend React complet
- [ ] Module de gestion des employés
- [ ] Gestion des groupes solidaires
- [ ] Module de remboursement mobile (Mobile Money)
- [ ] Intégration SMS/Email
- [ ] Module de scoring crédit

### Phase 3 (Futur)
- [ ] Application mobile (client)
- [ ] Module de signature électronique
- [ ] BI et analytics avancés
- [ ] API publique pour intégrations tierces
- [ ] Module de garanties/collatéraux

---

## 👥 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 📞 Support & Contact

Pour toute question ou assistance :
- **Email:** support@microfinance-app.com
- **Documentation:** https://docs.microfinance-app.com
- **Issues:** GitHub Issues

---

## 🙏 Remerciements

Ce projet s'inspire de :
- **Apache Fineract / MIFOS X** - Référence en logiciels de microfinance open source
- **Mambu** - Pour les concepts de configuration produits
- **Finacle** - Pour l'architecture comptable

---

## ⚠️ Avertissement

Cette application est fournie à des fins éducatives et de démonstration. Pour une utilisation en production dans un environnement de microfinance réel, un audit de sécurité complet, des tests exhaustifs et une adaptation aux réglementations locales sont indispensables.

---

**Développé avec ❤️ pour les institutions de microfinance en Afrique**
