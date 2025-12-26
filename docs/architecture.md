## Architecture (socle) – Microfinance

### Principes

- **Modularité**: chaque domaine (IAM, clients, prêts, épargne, compta, audit, reporting) est isolé dans `backend/src/modules/*`.
- **Hexagonal / ports-adapters (pragmatique)**:
  - **API**: contrôleurs NestJS (REST).
  - **Application**: services (use-cases) qui appliquent les règles métier.
  - **Infrastructure**: persistance via Prisma (PostgreSQL), et services transverses (auth, compta).
- **Sécurité**: JWT + RBAC (rôles), garde global, endpoints annotés via `@Public()` et `@Roles(...)`.
- **Transactions atomiques**: les opérations critiques (décaissement, remboursement, dépôt/retrait) utilisent `prisma.$transaction(...)`.

### Découpage backend

- `modules/iam`: bootstrap, login/refresh/logout, JWT strategy, RBAC.
- `modules/users`: gestion des utilisateurs et rattachement aux rôles.
- `modules/clients`: personnes/groupes/entreprises + KYC (métadonnées).
- `modules/loan-products`: paramétrage produits.
- `modules/loans`: cycle de vie prêt (demande, approbation, décaissement, échéancier, remboursement).
- `modules/savings-products`: paramétrage produits d’épargne.
- `modules/savings`: comptes + dépôts/retraits.
- `modules/accounting`: plan comptable, règles d’imputation, journaux, balance.
- `modules/audit`: consultation du journal d’audit.
- `modules/reports`: KPI (PAR, encours, etc.) – base extensible.

### Flux comptables (partie double)

Les écritures sont générées via des **règles paramétrables** (`AccountingRule` + `AccountingRuleLine`) :

- **Décaissement prêt** (`LOAN_DISBURSEMENT`)
  - Débit `PRINCIPAL` (ex: portefeuille prêts)
  - Crédit `TOTAL` (ex: caisse)
- **Remboursement prêt** (`LOAN_REPAYMENT`)
  - Débit `TOTAL` (ex: caisse)
  - Crédit `PRINCIPAL` (ex: portefeuille prêts)
  - Crédit `INTEREST` (ex: produit d’intérêts)
- **Dépôt épargne** (`SAVINGS_DEPOSIT`)
  - Débit `TOTAL` (ex: caisse)
  - Crédit `TOTAL` (ex: dépôts clients)
- **Retrait épargne** (`SAVINGS_WITHDRAWAL`)
  - Débit `TOTAL` (ex: dépôts clients)
  - Crédit `TOTAL` (ex: caisse)

> Remarque: les pénalités/frais sont préparés dans le modèle (`FEE`, `PENALTY`) et peuvent être activés via règles + logique d’allocation.

