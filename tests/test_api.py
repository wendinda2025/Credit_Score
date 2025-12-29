from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Credit Score API"}

def test_calculate_credit_score_approved():
    payload = {
        "applicant_name": "Jean Dupont",
        "monthly_income": 5000,
        "requested_amount": 10000,
        "credit_history_score": 750
    }
    response = client.post("/api/v1/credit/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["approved"] is True
    assert data["risk_level"] == "LOW"

def test_calculate_credit_score_rejected():
    payload = {
        "applicant_name": "Jean Risque",
        "monthly_income": 1000,
        "requested_amount": 50000,
        "credit_history_score": 500
    }
    response = client.post("/api/v1/credit/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["approved"] is False
    assert data["risk_level"] == "HIGH"
