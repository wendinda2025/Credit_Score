# Plateforme de microfinance (socle) – Afrique de l’Ouest

Ce dépôt contient un **socle applicatif complet** (backend + frontend + modèle de données + docs) pour une plateforme de gestion de microfinance inspirée des concepts de **MIFOS X / Apache Fineract**, sans en copier le code.

## Objectifs couverts (socle)

- **Clients**: personnes, groupes, entreprises + KYC + statuts
- **Prêts**: produits, demande, approbation, décaissement, échéancier, remboursements, pénalités (socle)
- **Épargne**: comptes, dépôts, retraits (socle)
- **Comptabilité**: plan comptable configurable + écritures automatiques en **partie double**
- **Reporting**: indicateurs clés (PAR, encours, performance) – base extensible
- **Sécurité**: JWT + RBAC + audit log des actions critiques
- **Internationalisation & multidevise**: données prêtes (devise par produit/compte, base i18n)

## Structure

- `backend/`: API NestJS + Prisma + PostgreSQL
- `frontend/`: UI React (socle)
- `docs/`: architecture, modèle de données, endpoints
- `docker/`: fichiers Docker/Compose (si Docker est disponible)

## Lancement (dev)

Prérequis: Node.js 20+ et PostgreSQL 14+.

### Backend

1) Configurer l’environnement:

- Copier `backend/.env.example` vers `backend/.env`

2) Installer et lancer:

```bash
cd backend
npm i
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Swagger: `http://localhost:3000/api`

### Frontend

```bash
cd frontend
npm i
npm run dev
```

## Documentation

Voir `docs/`:
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/api.md`