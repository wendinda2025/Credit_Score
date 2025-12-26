# 📦 Guide d'Installation Complet

Ce guide vous accompagne pas à pas dans l'installation et la configuration de la plateforme de microfinance.

## Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Locale](#installation-locale)
3. [Configuration](#configuration)
4. [Migration de la Base de Données](#migration-de-la-base-de-données)
5. [Démarrage de l'Application](#démarrage-de-lapplication)
6. [Vérification](#vérification)
7. [Déploiement Docker](#déploiement-docker)
8. [Dépannage](#dépannage)

---

## Prérequis

### Logiciels Requis

- **Node.js** : version 18 ou supérieure
  ```bash
  node --version  # Doit afficher v18.x.x ou supérieur
  ```

- **PostgreSQL** : version 15 ou supérieure
  ```bash
  psql --version  # Doit afficher PostgreSQL 15.x ou supérieur
  ```

- **npm** : version 9 ou supérieure (inclus avec Node.js)
  ```bash
  npm --version
  ```

- **Git** : pour cloner le dépôt
  ```bash
  git --version
  ```

### Optionnel

- **Docker** et **Docker Compose** : pour le déploiement conteneurisé
- **Postman** ou **Insomnia** : pour tester l'API
- **pgAdmin** ou **DBeaver** : pour administrer PostgreSQL

---

## Installation Locale

### Étape 1 : Cloner le Dépôt

```bash
# Cloner le projet
git clone https://github.com/votre-org/microfinance-app.git

# Accéder au dossier
cd microfinance-app
```

### Étape 2 : Installer les Dépendances Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install
```

Cette commande va :
- Télécharger tous les packages npm nécessaires
- Installer Prisma CLI
- Configurer les outils de développement

### Étape 3 : Configurer PostgreSQL

#### Sur Ubuntu/Debian

```bash
# Installer PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Démarrer le service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer un utilisateur
sudo -u postgres createuser --interactive --pwprompt
# Nom: microfinance_user
# Mot de passe: microfinance_password_2024
# Superuser: Non

# Créer la base de données
sudo -u postgres createdb -O microfinance_user microfinance
```

#### Sur macOS (avec Homebrew)

```bash
# Installer PostgreSQL
brew install postgresql@15

# Démarrer le service
brew services start postgresql@15

# Créer un utilisateur et une base
psql postgres
CREATE USER microfinance_user WITH PASSWORD 'microfinance_password_2024';
CREATE DATABASE microfinance OWNER microfinance_user;
\q
```

#### Sur Windows

1. Télécharger l'installateur depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. Exécuter l'installateur et suivre les instructions
3. Utiliser pgAdmin pour créer :
   - Utilisateur : `microfinance_user`
   - Mot de passe : `microfinance_password_2024`
   - Base de données : `microfinance`

---

## Configuration

### Créer le Fichier `.env`

```bash
# Dans le dossier backend
cp .env.example .env
```

### Éditer le Fichier `.env`

Ouvrez `.env` et configurez les paramètres :

```env
# Database Configuration
DATABASE_URL="postgresql://microfinance_user:microfinance_password_2024@localhost:5432/microfinance?schema=public"

# JWT Configuration
JWT_SECRET="votre-secret-jwt-super-securise-changez-moi"
JWT_REFRESH_SECRET="votre-secret-refresh-super-securise-changez-moi"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server Configuration
NODE_ENV="development"
PORT=3000

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"
```

**⚠️ Important :**
- Changez ABSOLUMENT les secrets JWT en production
- Utilisez des secrets complexes et uniques
- Ne commitez JAMAIS le fichier `.env` dans Git

### Génération de Secrets Sécurisés

Pour générer des secrets forts :

```bash
# Sur Linux/macOS
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou en utilisant OpenSSL
openssl rand -hex 64
```

---

## Migration de la Base de Données

### Générer le Client Prisma

```bash
npm run prisma:generate
```

Cette commande génère le client TypeScript Prisma basé sur votre schéma.

### Créer les Tables

```bash
# En développement (crée une migration)
npm run prisma:migrate

# Suivre les instructions et nommer votre migration
# Par exemple: "init" pour la première migration
```

Cette commande va :
1. Créer toutes les tables dans PostgreSQL
2. Appliquer les contraintes et relations
3. Créer un dossier `prisma/migrations` avec l'historique

### Peupler avec des Données de Test

```bash
npm run prisma:seed
```

Cette commande va créer :
- ✅ Une organisation de démonstration
- ✅ 4 utilisateurs avec différents rôles
- ✅ Un plan comptable de base (13 comptes)
- ✅ 2 produits de prêt
- ✅ 2 produits d'épargne
- ✅ 3 clients de démonstration

**Identifiants de connexion créés :**
```
Admin:
  Email: admin@microfinance.com
  Password: Password123!

Manager:
  Email: manager@microfinance.com
  Password: Password123!

Agent de Crédit:
  Email: agent@microfinance.com
  Password: Password123!

Caissier:
  Email: caissier@microfinance.com
  Password: Password123!
```

---

## Démarrage de l'Application

### Mode Développement

```bash
# Démarrer avec rechargement automatique
npm run start:dev
```

Vous verrez :
```
[Nest] 12345  - 26/12/2024, 10:30:00   LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 26/12/2024, 10:30:00   LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] 12345  - 26/12/2024, 10:30:00   LOG [InstanceLoader] AuthModule dependencies initialized
...
[Nest] 12345  - 26/12/2024, 10:30:01   LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 26/12/2024, 10:30:01   LOG 🚀 Application is running on: http://localhost:3000
[Nest] 12345  - 26/12/2024, 10:30:01   LOG 📚 Swagger documentation: http://localhost:3000/api/docs
```

### Mode Production

```bash
# Compiler l'application
npm run build

# Démarrer en production
npm run start:prod
```

---

## Vérification

### 1. Tester l'API

**Vérifier que le serveur répond :**

```bash
curl http://localhost:3000
```

Réponse attendue :
```json
{
  "message": "Microfinance API is running",
  "version": "1.0.0"
}
```

**Tester l'authentification :**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@microfinance.com",
    "password": "Password123!"
  }'
```

Réponse attendue :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@microfinance.com",
    "firstName": "Admin",
    "lastName": "System",
    "role": "ADMIN"
  }
}
```

### 2. Accéder à la Documentation Swagger

Ouvrez votre navigateur et accédez à :

```
http://localhost:3000/api/docs
```

Vous verrez l'interface Swagger UI avec tous les endpoints documentés.

### 3. Utiliser Prisma Studio

Pour visualiser et modifier les données facilement :

```bash
npm run prisma:studio
```

Cela ouvre une interface web sur `http://localhost:5555`

---

## Déploiement Docker

### Avec Docker Compose

```bash
# Aller dans le dossier docker
cd ../docker

# Démarrer tous les services
docker-compose up -d

# Vérifier l'état des conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f backend

# Arrêter les services
docker-compose down
```

### Commandes Utiles

```bash
# Reconstruire les images
docker-compose build

# Redémarrer un service spécifique
docker-compose restart backend

# Accéder au shell du conteneur backend
docker-compose exec backend sh

# Exécuter une migration dans Docker
docker-compose exec backend npm run prisma:migrate:prod
```

---

## Dépannage

### Problème : Impossible de se connecter à PostgreSQL

**Erreur :**
```
Error: P1001: Can't reach database server at localhost:5432
```

**Solutions :**

1. Vérifier que PostgreSQL est démarré :
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   ```

2. Vérifier les identifiants dans `.env`

3. Tester la connexion manuellement :
   ```bash
   psql -h localhost -U microfinance_user -d microfinance
   ```

### Problème : Erreur lors des migrations

**Erreur :**
```
Error: Migration failed to apply cleanly to the shadow database
```

**Solutions :**

1. Réinitialiser la base de données :
   ```bash
   npm run prisma:migrate reset
   ```

2. Supprimer le dossier `prisma/migrations` et recommencer :
   ```bash
   rm -rf prisma/migrations
   npm run prisma:migrate
   ```

### Problème : Port 3000 déjà utilisé

**Erreur :**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions :**

1. Changer le port dans `.env` :
   ```env
   PORT=3001
   ```

2. Ou tuer le processus utilisant le port 3000 :
   ```bash
   # Linux/macOS
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Problème : Module non trouvé

**Erreur :**
```
Error: Cannot find module '@nestjs/...'
```

**Solution :**

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Problème : Prisma Client non généré

**Erreur :**
```
Error: @prisma/client did not initialize yet
```

**Solution :**

```bash
npm run prisma:generate
```

---

## Prochaines Étapes

Une fois l'installation terminée :

1. ✅ Lisez le [README principal](../README.md) pour comprendre l'architecture
2. ✅ Consultez la [documentation API](http://localhost:3000/api/docs)
3. ✅ Explorez les [exemples d'utilisation](./EXAMPLES.md)
4. ✅ Configurez votre IDE (VSCode recommandé)
5. ✅ Familiarisez-vous avec les [concepts de microfinance](./CONCEPTS.md)

---

## Support

Si vous rencontrez des problèmes non couverts par ce guide :

- 📧 Email : support@microfinance-app.com
- 🐛 GitHub Issues : [github.com/votre-org/microfinance-app/issues](https://github.com)
- 💬 Discord : [lien vers serveur Discord]

---

**Développé avec ❤️ pour les institutions de microfinance en Afrique**
