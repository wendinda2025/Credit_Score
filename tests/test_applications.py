def test_create_and_score_application(client):
    payload = {
        "client": {"client_number": "214794", "last_name": "OUEDRAOGO", "first_name": "Zenabo"},
        "loan": {
            "amount": 15000000,
            "duration_months": 12,
            "repayment_frequency": "REMBOURSEMENT TRIMESTRIEL",
            "purpose": "Vente de pagnes",
        },
        "financials": {
            "net_monthly_business_income": 6574545,
            "other_monthly_income": 700000,
            "monthly_family_expenses": 97500,
            "retained_collateral_value": 22500000,
            "years_in_business": 10,
        },
    }

    resp = client.post("/v1/applications", json=payload)
    assert resp.status_code == 201, resp.text
    created = resp.json()
    app_id = created["id"]
    assert created["client_number"] == "214794"

    resp = client.post(f"/v1/applications/{app_id}/score")
    assert resp.status_code == 200, resp.text
    scored = resp.json()
    assert 0 <= scored["total"] <= 100
    assert scored["recommendation"] in {"approve", "review", "reject"}

    resp = client.get(f"/v1/applications/{app_id}")
    assert resp.status_code == 200, resp.text
    fetched = resp.json()
    assert fetched["score_total"] is not None
    assert fetched["score_recommendation"] is not None

