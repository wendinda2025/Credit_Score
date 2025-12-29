from pydantic import BaseModel, Field, PositiveInt

class CreditApplication(BaseModel):
    applicant_name: str = Field(..., min_length=2, description="Nom complet du demandeur")
    monthly_income: PositiveInt = Field(..., description="Revenu mensuel en devise locale")
    requested_amount: PositiveInt = Field(..., description="Montant demandé")
    credit_history_score: int = Field(..., ge=0, le=850, description="Score historique de crédit (ex: FICO)")

class CreditScoreResponse(BaseModel):
    approved: bool
    score: int
    max_amount: int
    risk_level: str
