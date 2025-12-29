# Credit_Score (API robuste)

Ce dépôt contient un **socle d’application robuste** pour la gestion de **demandes de crédit** et un **moteur de scoring** extensible.

## Démarrage rapide (local)

- **Prérequis**: `python3.12+`
- **Installer**:

```bash
python3 -m pip install --user -r requirements.txt -r requirements-dev.txt
```

- **Configurer** (optionnel):

```bash
cp .env.example .env
```

- **Lancer l’API**:

```bash
PYTHONPATH=src python3 -m uvicorn credit_score.api.main:app --reload --port 8000
```

Puis ouvrir la doc OpenAPI: `http://localhost:8000/docs`

## Endpoints

- **GET** `/health`: healthcheck
- **POST** `/v1/applications`: crée une demande
- **GET** `/v1/applications/{id}`: récupère une demande
- **POST** `/v1/applications/{id}/score`: calcule + stocke le score

## Exemple (cURL)

```bash
curl -s -X POST "http://localhost:8000/v1/applications" \
  -H "content-type: application/json" \
  -d '{
    "client": {"client_number": "214794", "last_name": "OUEDRAOGO", "first_name": "Zenabo"},
    "loan": {"amount": 15000000, "duration_months": 12, "repayment_frequency": "TRIMESTRIEL"},
    "financials": {
      "net_monthly_business_income": 6574545,
      "other_monthly_income": 700000,
      "monthly_family_expenses": 97500,
      "retained_collateral_value": 22500000,
      "years_in_business": 10
    }
  }'
```

## Qualité / robustesse

- **Validation stricte** des entrées (Pydantic)
- **Logs JSON** + `x-request-id` pour traçabilité
- **Persistance** SQLite via SQLAlchemy (modifiable via `CREDIT_SCORE_DATABASE_URL`)
- **Tests** (pytest), **lint** (ruff) et **type-check** (mypy)
- **CI GitHub Actions**: `.github/workflows/ci.yml`