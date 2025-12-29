# Guide d'Installation - PAMF

## 🚀 Installation Rapide (Développement)

### Prérequis

- Python 3.11 ou supérieur
- Node.js 18 ou supérieur  
- PostgreSQL 15 ou supérieur
- Git

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-repo/pamf-credit.git
cd pamf-credit
```

### 2. Configuration de la Base de Données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE pamf_credit;
CREATE USER pamf_user WITH ENCRYPTED PASSWORD 'pamf_password';
GRANT ALL PRIVILEGES ON DATABASE pamf_credit TO pamf_user;
\q
```

### 3. Installation du Backend

```bash
cd backend

# Créer un environnement virtuel
python3 -m venv venv

# Activer l'environnement virtuel
# Sur Linux/Mac:
source venv/bin/activate
# Sur Windows:
# venv\Scripts\activate

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Créer les tables
alembic upgrade head

# Initialiser avec des données de test
python -m app.utils.init_db
```

### 4. Lancer le Backend

```bash
# Depuis le dossier backend avec venv activé
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Le backend sera accessible sur http://localhost:8000
Documentation API : http://localhost:8000/docs

### 5. Installation du Frontend

```bash
# Ouvrir un nouveau terminal
cd frontend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local si nécessaire

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

## 🧪 Lancer les Tests

### Tests Backend

```bash
cd backend
source venv/bin/activate
pytest tests/ -v --cov=app
```

### Tests Frontend

```bash
cd frontend
npm test
```

## 🔧 Configuration Avancée

### Variables d'Environnement Backend

Éditez `backend/.env` :

```env
# Application
APP_NAME="Système de Gestion de Crédit PAMF"
DEBUG=True
ENVIRONMENT=development

# Base de données
DATABASE_URL=postgresql://pamf_user:pamf_password@localhost:5432/pamf_credit

# Sécurité (générer une clé secrète forte)
SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire-32-caracteres-minimum
```

### Variables d'Environnement Frontend

Éditez `frontend/.env.local` :

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Système de Gestion de Crédit PAMF
```

## 📝 Comptes de Test

Après l'initialisation, vous pouvez vous connecter avec :

- **Admin** : admin / admin123
- **Agent de Crédit** : agent / agent123
- **Risk Officer** : risk / risk123
- **Chef d'Agence** : chef / chef123

## 🐛 Dépannage

### Erreur de connexion PostgreSQL

Vérifiez que PostgreSQL est en cours d'exécution :

```bash
# Sur Linux
sudo systemctl status postgresql

# Sur Mac
brew services list

# Sur Windows
# Vérifier dans les services Windows
```

### Port déjà utilisé

Si le port 8000 ou 3000 est déjà utilisé :

**Backend** : Modifiez le port dans la commande uvicorn
```bash
uvicorn app.main:app --reload --port 8001
```

**Frontend** : Modifiez vite.config.ts
```typescript
export default defineConfig({
  server: {
    port: 3001,
  },
})
```

### Erreur d'import Python

Vérifiez que vous avez bien activé l'environnement virtuel :
```bash
which python  # Doit pointer vers le venv
```

## 📚 Prochaines Étapes

1. Consultez le [README.md](README.md) pour un aperçu complet
2. Lisez le [GUIDE_UTILISATEUR.md](GUIDE_UTILISATEUR.md) pour apprendre à utiliser l'application
3. Pour le déploiement en production, consultez [DEPLOYMENT.md](DEPLOYMENT.md)

## 🆘 Support

Si vous rencontrez des problèmes :
- Vérifiez les logs du backend et frontend
- Consultez la documentation API sur /docs
- Créez une issue sur GitHub
- Contactez support@pamf.bf
