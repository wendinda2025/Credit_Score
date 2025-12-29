# Guide de Déploiement - PAMF

## 📋 Prérequis

### Serveur
- Ubuntu 20.04+ ou Debian 11+
- 2GB RAM minimum (4GB recommandé)
- 20GB d'espace disque
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Nginx
- Accès root ou sudo

### Services externes
- Nom de domaine configuré
- Certificat SSL (Let's Encrypt recommandé)

## 🚀 Installation en Production

### 1. Préparation du Serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y python3.11 python3.11-venv python3-pip
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y nginx
sudo apt install -y git curl

# Installation de Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Configuration de PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE DATABASE pamf_credit;
CREATE USER pamf_user WITH ENCRYPTED PASSWORD 'VOTRE_MOT_DE_PASSE_SECURISE';
GRANT ALL PRIVILEGES ON DATABASE pamf_credit TO pamf_user;
\q
```

### 3. Déploiement du Backend

```bash
# Créer un utilisateur système
sudo useradd -m -s /bin/bash pamf
sudo su - pamf

# Cloner le repository
git clone https://github.com/votre-repo/pamf-credit.git
cd pamf-credit/backend

# Créer l'environnement virtuel
python3.11 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
nano .env
```

Modifiez le fichier `.env` :
```env
APP_NAME="Système de Gestion de Crédit PAMF"
APP_VERSION="1.0.0"
DEBUG=False
ENVIRONMENT=production

DATABASE_URL=postgresql://pamf_user:VOTRE_MOT_DE_PASSE@localhost:5432/pamf_credit
DATABASE_ECHO=False

SECRET_KEY=GENERER_UNE_CLE_SECRETE_LONGUE_ET_ALEATOIRE_32_CARACTERES_MINIMUM
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

BACKEND_CORS_ORIGINS=["https://votre-domaine.com"]

DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

MAX_UPLOAD_SIZE_MB=10
UPLOAD_DIR=/var/www/pamf/uploads
```

```bash
# Lancer les migrations
alembic upgrade head

# Initialiser la base de données
python -m app.utils.init_db

# Tester le démarrage
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Configuration de Systemd pour le Backend

```bash
# Sortir de l'utilisateur pamf
exit

# Créer le service systemd
sudo nano /etc/systemd/system/pamf-backend.service
```

Contenu du fichier :
```ini
[Unit]
Description=PAMF Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=pamf
Group=pamf
WorkingDirectory=/home/pamf/pamf-credit/backend
Environment="PATH=/home/pamf/pamf-credit/backend/venv/bin"
ExecStart=/home/pamf/pamf-credit/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable pamf-backend
sudo systemctl start pamf-backend
sudo systemctl status pamf-backend
```

### 5. Déploiement du Frontend

```bash
sudo su - pamf
cd pamf-credit/frontend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
nano .env
```

Contenu du fichier `.env` :
```env
VITE_API_BASE_URL=https://votre-domaine.com/api/v1
VITE_APP_NAME=Système de Gestion de Crédit PAMF
```

```bash
# Builder le frontend
npm run build

# Sortir de l'utilisateur pamf
exit

# Copier les fichiers buildés
sudo mkdir -p /var/www/pamf
sudo cp -r /home/pamf/pamf-credit/frontend/dist/* /var/www/pamf/
sudo chown -R www-data:www-data /var/www/pamf
```

### 6. Configuration de Nginx

```bash
sudo nano /etc/nginx/sites-available/pamf
```

Contenu du fichier :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    # Certificats SSL (à configurer avec Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Configuration SSL recommandée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Frontend
    root /var/www/pamf;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend - toutes les routes vont à index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Documentation API
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploads
    location /uploads {
        alias /var/www/pamf/uploads;
        autoindex off;
    }

    # Logs
    access_log /var/log/nginx/pamf_access.log;
    error_log /var/log/nginx/pamf_error.log;
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/pamf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configuration de Let's Encrypt (SSL)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement automatique est configuré par défaut
```

## 🔒 Sécurité

### Firewall

```bash
# Configurer UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Sauvegarde de la Base de Données

```bash
# Créer un script de sauvegarde
sudo nano /usr/local/bin/backup-pamf-db.sh
```

Contenu :
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/pamf"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
pg_dump -U pamf_user pamf_credit | gzip > $BACKUP_DIR/pamf_$DATE.sql.gz

# Garder seulement les 30 dernières sauvegardes
find $BACKUP_DIR -name "pamf_*.sql.gz" -mtime +30 -delete

echo "Sauvegarde effectuée: $BACKUP_DIR/pamf_$DATE.sql.gz"
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-pamf-db.sh

# Ajouter une tâche cron (tous les jours à 2h du matin)
sudo crontab -e
```

Ajouter :
```
0 2 * * * /usr/local/bin/backup-pamf-db.sh
```

## 📊 Monitoring

### Logs

```bash
# Logs du backend
sudo journalctl -u pamf-backend -f

# Logs Nginx
sudo tail -f /var/log/nginx/pamf_access.log
sudo tail -f /var/log/nginx/pamf_error.log

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## 🔄 Mise à Jour

```bash
sudo su - pamf
cd pamf-credit

# Récupérer les dernières modifications
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
exit

# Redémarrer le backend
sudo systemctl restart pamf-backend

# Frontend
cd ../frontend
npm install
npm run build
exit

# Copier les nouveaux fichiers
sudo cp -r /home/pamf/pamf-credit/frontend/dist/* /var/www/pamf/
sudo systemctl reload nginx
```

## 🆘 Dépannage

### Le backend ne démarre pas

```bash
sudo systemctl status pamf-backend
sudo journalctl -u pamf-backend -n 50
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL fonctionne
sudo systemctl status postgresql

# Tester la connexion
sudo -u pamf psql -h localhost -U pamf_user -d pamf_credit
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que le backend est en cours d'exécution
sudo systemctl status pamf-backend

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/pamf_error.log
```

## 📞 Support

Pour toute question ou problème :
- Documentation : `/docs` sur votre serveur
- Email : support@pamf.bf
- Issues GitHub : https://github.com/votre-repo/pamf-credit/issues
