from fastapi import APIRouter, HTTPException
from app.schemas.credit import CreditApplication, CreditScoreResponse

router = APIRouter()

@router.post("/calculate", response_model=CreditScoreResponse)
async def calculate_credit_score(application: CreditApplication):
    """
    Simule un calcul de score de crédit très basique.
    Dans une vraie application robuste, cela appellerait un service complexe
    avec accès base de données, modèles ML, etc.
    """
    
    # Logique métier simplifiée pour l'exemple
    base_score = application.credit_history_score
    income_ratio = application.requested_amount / application.monthly_income
    
    final_score = base_score
    
    if income_ratio > 10:
        final_score -= 100
    elif income_ratio < 3:
        final_score += 50
        
    risk_level = "HIGH"
    if final_score > 750:
        risk_level = "LOW"
    elif final_score > 600:
        risk_level = "MEDIUM"
        
    approved = final_score > 600
    
    return CreditScoreResponse(
        approved=approved,
        score=final_score,
        max_amount=application.monthly_income * 12 if approved else 0,
        risk_level=risk_level
    )
