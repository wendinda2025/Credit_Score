"""
Routes pour les approbations
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.approval import Approval
from app.schemas.approval import ApprovalCreate, ApprovalUpdate, ApprovalResponse
from app.services.credit_application_service import CreditApplicationService

router = APIRouter()


@router.get("/application/{application_id}", response_model=List[ApprovalResponse])
async def get_approvals_for_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupère toutes les approbations pour une demande"""
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    approvals = db.query(Approval).filter(
        Approval.credit_application_id == application_id
    ).order_by(Approval.created_at).all()
    
    return approvals


@router.post("/", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED)
async def create_approval(
    approval_data: ApprovalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle approbation"""
    # Vérifier que la demande existe
    application = CreditApplicationService.get_by_id(db, approval_data.credit_application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    # Créer l'approbation
    db_approval = Approval(
        **approval_data.model_dump(),
        reviewer_id=current_user.id
    )
    
    db.add(db_approval)
    db.commit()
    db.refresh(db_approval)
    
    return db_approval


@router.put("/{approval_id}", response_model=ApprovalResponse)
async def update_approval(
    approval_id: int,
    approval_data: ApprovalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Met à jour une approbation"""
    db_approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not db_approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approbation non trouvée"
        )
    
    # Vérifier que c'est bien le reviewer qui modifie
    if db_approval.reviewer_id != current_user.id and current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    # Mettre à jour les champs
    update_data = approval_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_approval, field, value)
    
    # Mettre à jour reviewed_at si une décision est prise
    if approval_data.decision and approval_data.decision != "pending":
        from datetime import datetime
        db_approval.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_approval)
    
    return db_approval
