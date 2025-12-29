"""
Routes pour la gestion des demandes de crédit
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.credit_application import (
    CreditApplicationCreate, CreditApplicationUpdate, CreditApplicationResponse
)
from app.services.credit_application_service import CreditApplicationService

router = APIRouter()


@router.get("/", response_model=List[CreditApplicationResponse])
async def get_credit_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des demandes de crédit.
    Supporte des filtres par client et statut.
    """
    # Si l'utilisateur n'est pas admin/chef, ne montrer que ses demandes
    agent_id = None
    if current_user.role not in ["admin", "chef_agence", "risk_officer", "comite_credit"]:
        agent_id = current_user.id
    
    applications = CreditApplicationService.get_all(
        db, skip=skip, limit=limit, client_id=client_id, agent_id=agent_id, status=status
    )
    return applications


@router.get("/{application_id}", response_model=CreditApplicationResponse)
async def get_credit_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupère une demande de crédit par ID"""
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "chef_agence", "risk_officer", "comite_credit"]:
        if application.agent_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé à cette demande"
            )
    
    return application


@router.post("/", response_model=CreditApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_credit_application(
    application_data: CreditApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle demande de crédit"""
    return CreditApplicationService.create(db, application_data, current_user.id)


@router.put("/{application_id}", response_model=CreditApplicationResponse)
async def update_credit_application(
    application_id: int,
    application_data: CreditApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Met à jour une demande de crédit"""
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "chef_agence"]:
        if application.agent_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé à cette demande"
            )
    
    return CreditApplicationService.update(db, application_id, application_data)


@router.post("/{application_id}/submit", response_model=CreditApplicationResponse)
async def submit_credit_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Soumet une demande de crédit pour évaluation"""
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    # Vérifier les permissions
    if application.agent_id != current_user.id and current_user.role not in ["admin", "chef_agence"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé à cette demande"
        )
    
    return CreditApplicationService.submit(db, application_id)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credit_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Supprime une demande de crédit"""
    application = CreditApplicationService.get_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande non trouvée"
        )
    
    # Seul l'agent ou un admin peut supprimer
    if application.agent_id != current_user.id and current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    CreditApplicationService.delete(db, application_id)
    return None
