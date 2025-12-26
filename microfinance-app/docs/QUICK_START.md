# Guide de démarrage rapide

## Installation en 5 minutes

### 1. Prérequis
- Node.js 18+ installé
- PostgreSQL 15+ installé et démarré
- npm ou yarn

### 2. Configuration rapide

```bash
# Cloner et naviguer
cd microfinance-app/backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Modifier DATABASE_URL dans .env selon votre configuration PostgreSQL

# Initialiser la base de données
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 3. Démarrer l'application

```bash
npm run start:dev
```

### 4. Accéder à l'API

- **API** : http://localhost:3000/api/v1
- **Documentation Swagger** : http://localhost:3000/api/docs
- **Identifiants par défaut** :
  - Username: `admin`
  - Password: `admin123`

## Premiers pas

### 1. Se connecter

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Récupérer le `access_token` de la réponse.

### 2. Créer un client

```bash
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "organizationId": "YOUR_ORG_ID",
    "officeId": "YOUR_OFFICE_ID",
    "type": "INDIVIDUAL",
    "firstName": "Jean",
    "lastName": "Dupont",
    "nationalId": "CI123456789",
    "phone": "+225 07 12 34 56 78"
  }'
```

### 3. Créer un prêt

```bash
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "organizationId": "YOUR_ORG_ID",
    "officeId": "YOUR_OFFICE_ID",
    "clientId": "CLIENT_ID",
    "loanProductId": "LOAN_PRODUCT_ID",
    "principalAmount": 100000,
    "loanTerm": 90
  }'
```

### 4. Consulter le tableau de bord

```bash
curl -X GET http://localhost:3000/api/v1/reports/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Commandes utiles

```bash
# Générer le client Prisma après modification du schema
npx prisma generate

# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Réinitialiser la base de données (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Seed les données
npm run prisma:seed
```

## Structure des endpoints

Tous les endpoints sont préfixés par `/api/v1`

### Authentification
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription
- `GET /auth/profile` - Profil utilisateur

### Clients
- `GET /clients` - Liste
- `POST /clients` - Créer
- `GET /clients/:id` - Détails
- `PATCH /clients/:id` - Modifier
- `POST /clients/:id/close` - Clôturer

### Prêts
- `GET /loans` - Liste
- `POST /loans` - Créer
- `GET /loans/:id` - Détails
- `POST /loans/:id/approve` - Approuver
- `POST /loans/:id/disburse` - Décaisser
- `POST /loans/:id/repayments` - Rembourser

### Épargne
- `GET /savings/accounts` - Liste des comptes
- `POST /savings/accounts` - Créer un compte
- `POST /savings/accounts/:id/transactions` - Transaction

### Comptabilité
- `GET /accounting/chart-of-accounts` - Plan comptable
- `POST /accounting/journal-entries` - Créer une écriture
- `GET /accounting/balance-sheet` - Bilan

### Reporting
- `GET /reports/dashboard` - Tableau de bord
- `GET /reports/par` - Portfolio at Risk
- `GET /reports/repayment-rate` - Taux de remboursement

## Dépannage

### Erreur de connexion à la base de données
- Vérifier que PostgreSQL est démarré
- Vérifier la DATABASE_URL dans .env
- Vérifier les permissions de l'utilisateur PostgreSQL

### Erreur Prisma
```bash
# Régénérer le client Prisma
npx prisma generate

# Réappliquer les migrations
npx prisma migrate deploy
```

### Port déjà utilisé
Modifier le PORT dans .env ou arrêter le processus utilisant le port 3000

## Prochaines étapes

1. Explorer la documentation Swagger : http://localhost:3000/api/docs
2. Lire ARCHITECTURE.md pour comprendre l'architecture
3. Consulter le README.md pour plus de détails
4. Personnaliser les produits de prêts et d'épargne
5. Configurer le plan comptable selon vos besoins
