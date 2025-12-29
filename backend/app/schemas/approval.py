"""
Schémas pour Approval
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.approval import ApprovalLevel, ApprovalDecision


class ApprovalBase(BaseModel):
    """Base Approval"""
    approval_level: ApprovalLevel
    decision: ApprovalDecision = ApprovalDecision.PENDING
    requested_amount: Optional[int] = None
    recommended_amount: Optional[int] = None
    is_complete: Optional[bool] = None
    agree_with_recommendation: Optional[bool] = None
    comments: Optional[str] = None
    clarifications_needed: Optional[str] = None
    disagreement_reasons: Optional[str] = None


class ApprovalCreate(ApprovalBase):
    """Création d'approbation"""
    credit_application_id: int


class ApprovalUpdate(BaseModel):
    """Mise à jour d'approbation"""
    decision: Optional[ApprovalDecision] = None
    recommended_amount: Optional[int] = None
    is_complete: Optional[bool] = None
    agree_with_recommendation: Optional[bool] = None
    comments: Optional[str] = None
    clarifications_needed: Optional[str] = None
    disagreement_reasons: Optional[str] = None


class ApprovalResponse(ApprovalBase):
    """Réponse Approval"""
    id: int
    credit_application_id: int
    reviewer_id: int
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
