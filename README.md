# 🏦 PAMF Credit Score - Application de Gestion des Demandes de Prêt

Application web robuste pour la dématérialisation du processus de gestion des demandes de crédit pour PAMF (Première Agence de Microfinance West Africa).

## 📋 Fonctionnalités

### Gestion des Clients
- ✅ Création et modification des fiches clients
- ✅ Informations personnelles, professionnelles et bancaires
- ✅ Personnes de référence et contacts
- ✅ Historique des crédits

### Gestion des Demandes de Prêt
- ✅ Création de demandes avec formulaires complets
- ✅ Gestion des garanties et coûts du projet
- ✅ Calcul automatique des ratios financiers
- ✅ Workflow de validation multi-niveaux

### Workflow de Validation
1. **Saisie de la demande** - Agent de crédit
2. **Visite de validation** - Vérification terrain
3. **Analyse financière** - Bilan, Cash Flow, Ratios
4. **Recommandation AC** - Agent de crédit
5. **Avis Risk Officer** - Contrôle des risques
6. **Avis Chef d'Agence** - Validation hiérarchique
7. **Décision Comité** - Approbation finale

### Données Financières
- 📊 Dépenses familiales
- 📊 Bilan comptable
- 📊 Cash Flow
- 📊 Compte d'exploitation
- 📊 Analyse des ratios (rentabilité, liquidité, endettement)

### Intégration CBS (Core Banking System)
- 🔗 API REST pour synchronisation avec Oracle CBS
- 🔗 Récupération des données clients
- 🔗 Mise à jour automatique des soldes
- 🔗 Vérification liste des radiés

## 🚀 Installation

### Prérequis
- Python 3.10+
- pip

### Installation des dépendances

```bash
# Cloner le projet
cd /workspace

# Créer un environnement virtuel (recommandé)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### Configuration

Créer un fichier `.env` à la racine :

```env
# Application
APP_NAME="PAMF Credit Manager"
DEBUG=true

# Base de données
# SQLite (développement)
DATABASE_URL=sqlite:///./credit_score.db

# Oracle (production)
# DATABASE_URL=oracle+cx_oracle://user:password@host:1521/service_name

# Sécurité
SECRET_KEY=votre-cle-secrete-a-changer

# Logging
LOG_LEVEL=INFO
```

### Lancement

```bash
# Démarrer le serveur
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

L'application sera accessible sur : http://localhost:8000

## 📚 Documentation API

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | `/api/v1/clients` | Gestion des clients |
| GET/POST | `/api/v1/demandes` | Gestion des demandes |
| POST | `/api/v1/finances/*` | Données financières |
| POST | `/api/v1/decisions/*` | Décisions (AC, RO, CA, Comité) |
| GET | `/api/v1/cbs/*` | Intégration CBS |
| GET | `/api/v1/dashboard/*` | Tableau de bord |

## 🏗️ Architecture

```
app/
├── __init__.py
├── main.py              # Application FastAPI principale
├── config.py            # Configuration
├── database.py          # Connexion base de données
├── models/              # Modèles SQLAlchemy
│   ├── client.py        # Client, PersonneReference, CompteBancaire
│   ├── demande.py       # DemandePret, Garantie, CoutProjet
│   ├── visite.py        # VisiteValidation, Actifs, Stocks
│   ├── finances.py      # Bilan, CashFlow, Ratios
│   └── decision.py      # Recommandation, Avis, DecisionComite
├── schemas/             # Schémas Pydantic (validation)
├── services/            # Logique métier
│   ├── client_service.py
│   ├── demande_service.py
│   ├── calcul_service.py   # Calculs financiers
│   └── cbs_service.py      # Intégration CBS Oracle
└── api/                 # Routes API
    ├── clients.py
    ├── demandes.py
    ├── finances.py
    ├── decisions.py
    ├── cbs.py
    └── dashboard.py
```

## 🔌 Intégration CBS Oracle

### Configuration API REST

```python
# Dans .env
CBS_BASE_URL=https://cbs.pamf.local/api
CBS_API_KEY=votre-cle-api
```

### Connexion Oracle Directe

```python
from app.services.cbs_service import OracleDirectConnection

oracle = OracleDirectConnection(
    host="oracle-server.pamf.local",
    port=1521,
    service_name="CBSPROD",
    user="api_user",
    password="secure_password"
)

# Récupérer un client
client_data = oracle.get_client("214794")
```

## 📊 Calcul des Ratios

L'application calcule automatiquement les ratios financiers suivants :

| Ratio | Formule | Norme |
|-------|---------|-------|
| Marge bénéficiaire | Marge brute / CA | > 15% |
| Capacité de remboursement | Mensualité / Marge nette | < 60% |
| Ratio de participation | Fonds propres / Actif total | > 35% |
| Ratio de liquidité | Actif CT / Passif CT | > 1.5 |
| Rotation des stocks | CA / Stock moyen | - |

## 🧪 Tests

```bash
# Lancer les tests
pytest

# Avec couverture
pytest --cov=app --cov-report=html
```

## 📦 Structure des Données (basée sur le CANEVAS)

Le modèle de données reproduit fidèlement les feuilles du fichier Excel CANEVAS :

1. **Info Client** → `Client`, `PersonneReference`, `CompteBancaire`
2. **Demande** → `DemandePret`, `Garantie`, `CoutProjet`, `ProvenanceFonds`
3. **Visite - validation** → `VisiteValidation`, `ActifEntreprise`, `Stock`
4. **Dépenses Familiales** → `DepensesFamiliales`
5. **Bilan** → `Bilan`
6. **Cash Flow** → `CashFlow`
7. **Compte d'Exploitation** → `CompteExploitation`
8. **Résultat Net** → `ResultatNet`
9. **Analyse des Ratios** → `AnalyseRatios`
10. **Recommandation AC** → `RecommandationAC`
11. **Autorisations-Comité** → `AvisRiskOfficer`, `AvisChefAgence`, `DecisionComite`

## 🔐 Sécurité

- Validation des données avec Pydantic
- Protection CORS configurable
- Préparé pour authentification JWT (à implémenter)
- Logs des opérations sensibles

## 🛣️ Roadmap

- [ ] Authentification et gestion des utilisateurs
- [ ] Génération de rapports PDF
- [ ] Export Excel des données
- [ ] Notifications par email
- [ ] Application mobile
- [ ] Tableau de bord avancé avec graphiques

## 📄 Licence

© 2025 PAMF - Première Agence de Microfinance West Africa

---

**Développé avec ❤️ pour la dématérialisation des processus de crédit**
