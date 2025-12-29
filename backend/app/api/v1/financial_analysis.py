"""
Routes pour les analyses financières
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.financial_analysis import (
    FinancialAnalysisUpdate, FinancialAnalysisResponse
)
from app.services.financial_service import FinancialService
from app.services.credit_application_service import CreditApplicationService

router = APIRouter()


@router.get("/{application_id}", response_model=FinancialAnalysisResponse)
async def get_financial_analysis(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupère l'analyse financière d'une demande"""
    # Vérifier que la demande existe et que l'utilisateur y a accès
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    if current_user.role not in ["admin", "chef_agence", "risk_officer", "comite_credit"]:
        if application.agent_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé"
            )
    
    return FinancialService.get_by_application(db, application_id)


@router.put("/{application_id}", response_model=FinancialAnalysisResponse)
async def update_financial_analysis(
    application_id: int,
    analysis_data: FinancialAnalysisUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Met à jour l'analyse financière d'une demande"""
    # Vérifier que la demande existe et que l'utilisateur y a accès
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    if current_user.role not in ["admin", "agent_credit", "chef_agence"]:
        if application.agent_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé"
            )
    
    return FinancialService.update(db, application_id, analysis_data)


@router.get("/{application_id}/recommendation")
async def get_recommendation(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtient une recommandation automatique basée sur l'analyse financière"""
    # Vérifier que la demande existe
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    analysis = FinancialService.get_by_application(db, application_id)
    recommendation = FinancialService.get_recommendation(analysis)
    
    return recommendation
