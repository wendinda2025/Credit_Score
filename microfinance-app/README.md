# Plateforme de Microfinance (Core Banking System)

Une application complète de gestion de microfinance, moderne et modulaire, inspirée de MIFOS X mais reconstruite avec des technologies actuelles.

## 🏗 Architecture Technique

### Backend (API REST)
- **Framework** : NestJS (Node.js/TypeScript) - Architecture modulaire et scalable.
- **ORM** : Prisma - Type-safe, migrations automatiques.
- **Base de données** : PostgreSQL - Robustesse transactionnelle pour les données financières.
- **Authentification** : JWT + RBAC (Role-Based Access Control).
- **Calculs** : Moteur d'amortissement précis (Flat, Declining Balance).
- **Comptabilité** : Système à partie double intégré.

### Structure du Projet
```
backend/
  src/
    modules/
      auth/       # Gestion authentification & rôles
      users/      # Gestion utilisateurs internes
      clients/    # Gestion clients (KYC)
      loans/      # Cœur métier : Produits, Demandes, Amortissement, Remboursement
      accounting/ # Comptabilité générale & auxiliaire
      reports/    # Reporting (à faire)
    prisma/       # Configuration DB & Service
```

## 🚀 Installation & Démarrage

### Pré-requis
- Docker & Docker Compose
- Node.js 18+ (pour développement local)

### Démarrage Rapide (Docker)
```bash
docker-compose up --build
```
L'API sera accessible sur `http://localhost:3000`.
PgAdmin sur `http://localhost:5050` (Email: admin@admin.com / Pass: admin).

### Développement Local
1. Installer les dépendances :
   ```bash
   cd backend
   npm install
   ```
2. Configurer `.env` (copier `.env.example` si besoin, ou utiliser les defaults).
3. Lancer la base de données (via Docker si besoin).
4. Générer le client Prisma :
   ```bash
   npx prisma generate
   ```
5. Lancer le serveur :
   ```bash
   npm run start:dev
   ```

## 📚 Fonctionnalités Implémentées

### 1. Gestion des Prêts (Loans)
- **Produits de Prêt** : Configuration flexible (Taux, Durée, Périodicité, Type d'intérêt).
- **Amortissement** : Moteur de calcul supportant :
  - Taux fixe (Flat)
  - Amortissement dégressif (Declining Balance)
  - Périodicités variées (Mensuel, Hebdo, etc.)
- **Cycle de Vie** : Création -> Approbation -> Décaissement -> Remboursement.
- **Transactions** : Historique complet des décaissements et remboursements.
- **Remboursement** : Allocation automatique des paiements (Intérêts d'abord, puis Capital).

### 2. Comptabilité (Accounting)
- **Partie Double** : Chaque opération financière génère une écriture équilibrée (Débit = Crédit).
- **Plan Comptable** : Gestion des comptes (Actif, Passif, Charges, Produits).
- **Grand Livre** : Suivi des balances de comptes.
- **Balance Sheet** : Génération simplifiée du bilan.

### 3. Sécurité
- **JWT** : Tokens sécurisés pour l'API.
- **RBAC** : Rôles (ADMIN, LOAN_OFFICER, CASHIER, AUDITOR).
- **Audit** : Traçabilité des actions (via `created_by`, `approved_by`, logs).

## 🧪 Tests
L'architecture est prête pour les tests unitaires (Jest).
```bash
npm run test
```

## 🔮 Évolutions Futures (Roadmap)
- [ ] Frontend React/Next.js complet.
- [ ] Module d'épargne (Savings).
- [ ] Reporting avancé (PDF/Excel).
- [ ] Intégration Mobile Money.
