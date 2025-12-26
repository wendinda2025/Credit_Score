# ⚡ Démarrage Rapide - 5 Minutes

Guide ultra-rapide pour démarrer la plateforme de microfinance localement.

## Prérequis Minimums

- Node.js 18+
- PostgreSQL 15+
- npm

## Installation Express

### 1. Cloner et installer

```bash
git clone <repo-url>
cd microfinance-app/backend
npm install
```

### 2. Base de données

```bash
# Créer la base
createdb microfinance

# Ou avec psql
psql postgres
CREATE DATABASE microfinance;
\q
```

### 3. Configuration

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env et modifier DATABASE_URL si nécessaire
# Par défaut : postgresql://user:password@localhost:5432/microfinance
```

### 4. Initialiser la base

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate

# Charger les données de test
npm run prisma:seed
```

### 5. Démarrer

```bash
npm run start:dev
```

✅ **C'est prêt !** L'API tourne sur http://localhost:3000

## Tester l'API

### Swagger UI

Ouvrez dans votre navigateur :
```
http://localhost:3000/api/docs
```

### Premier appel API

```bash
# Se connecter
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@microfinance.com",
    "password": "Password123!"
  }'

# Récupérer le accessToken dans la réponse
# Puis l'utiliser pour les autres requêtes :

curl http://localhost:3000/loans/products \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

## Comptes de Test

Créés automatiquement par le seed :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@microfinance.com | Password123! |
| Manager | manager@microfinance.com | Password123! |
| Agent Crédit | agent@microfinance.com | Password123! |
| Caissier | caissier@microfinance.com | Password123! |

## Données de Test Créées

✅ 1 organisation  
✅ 4 utilisateurs (différents rôles)  
✅ 13 comptes comptables  
✅ 2 produits de prêt  
✅ 2 produits d'épargne  
✅ 3 clients  

## Outils Utiles

### Prisma Studio (Interface BDD)

```bash
npm run prisma:studio
```
Ouvre sur http://localhost:5555

### Voir les logs

```bash
# En mode dev, les logs s'affichent automatiquement
# Pour plus de détails, regardez les messages dans le terminal
```

## Déploiement Docker (Alternatif)

```bash
cd ../docker
docker-compose up -d

# Attendre 30 secondes que tout démarre
# L'API est accessible sur http://localhost:3000
```

## Prochaines Étapes

1. 📖 Lire le [README complet](./README.md)
2. 📚 Explorer la [documentation API](http://localhost:3000/api/docs)
3. 🏗️ Comprendre l'[architecture](./docs/ARCHITECTURE.md)
4. 💾 Voir le [guide d'installation détaillé](./docs/INSTALLATION.md)

## Problèmes Courants

**Port 3000 déjà utilisé ?**
```bash
# Changer le port dans .env
PORT=3001
```

**Erreur de connexion PostgreSQL ?**
```bash
# Vérifier que PostgreSQL tourne
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Vérifier les identifiants dans .env
```

**Module non trouvé ?**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Support

- 📧 Email : support@microfinance-app.com
- 🐛 Issues : GitHub Issues
- 📖 Docs complètes : [README.md](./README.md)

---

**Vous êtes prêt ! Bon développement ! 🚀**
