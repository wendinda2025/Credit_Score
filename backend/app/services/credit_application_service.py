"""
Service pour la gestion des demandes de crédit
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.credit_application import CreditApplication, ProjectItem
from app.models.financial_analysis import FinancialAnalysis
from app.schemas.credit_application import CreditApplicationCreate, CreditApplicationUpdate


class CreditApplicationService:
    """Service de gestion des demandes de crédit"""
    
    @staticmethod
    def generate_application_number(db: Session) -> str:
        """Génère un numéro de demande unique"""
        # Format: PAMF-YYYYMMDD-XXXX
        today = datetime.now()
        prefix = f"PAMF-{today.strftime('%Y%m%d')}"
        
        # Compter les demandes du jour
        count = db.query(CreditApplication).filter(
            CreditApplication.application_number.like(f"{prefix}%")
        ).count()
        
        return f"{prefix}-{count + 1:04d}"
    
    @staticmethod
    def get_by_id(db: Session, application_id: int) -> Optional[CreditApplication]:
        """Récupère une demande par ID"""
        return db.query(CreditApplication).filter(
            CreditApplication.id == application_id
        ).first()
    
    @staticmethod
    def get_by_number(db: Session, application_number: str) -> Optional[CreditApplication]:
        """Récupère une demande par numéro"""
        return db.query(CreditApplication).filter(
            CreditApplication.application_number == application_number
        ).first()
    
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        client_id: Optional[int] = None,
        agent_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[CreditApplication]:
        """Récupère toutes les demandes avec filtres"""
        query = db.query(CreditApplication)
        
        if client_id:
            query = query.filter(CreditApplication.client_id == client_id)
        if agent_id:
            query = query.filter(CreditApplication.agent_id == agent_id)
        if status:
            query = query.filter(CreditApplication.status == status)
        
        return query.order_by(CreditApplication.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, application_data: CreditApplicationCreate, agent_id: int) -> CreditApplication:
        """Crée une nouvelle demande"""
        # Générer le numéro de demande
        application_number = CreditApplicationService.generate_application_number(db)
        
        # Extraire les items du projet
        project_items_data = application_data.project_items or []
        application_dict = application_data.model_dump(exclude={'project_items'})
        
        # Calculer le pourcentage de financement
        if application_dict.get('project_total_cost') and application_dict['project_total_cost'] > 0:
            financing_percentage = (
                application_dict['requested_amount'] / application_dict['project_total_cost']
            )
            application_dict['financing_percentage'] = financing_percentage
        
        # Créer la demande
        db_application = CreditApplication(
            **application_dict,
            application_number=application_number,
            agent_id=agent_id
        )
        
        db.add(db_application)
        db.flush()  # Pour obtenir l'ID
        
        # Créer les items du projet
        for item_data in project_items_data:
            db_item = ProjectItem(
                **item_data.model_dump(),
                credit_application_id=db_application.id
            )
            db.add(db_item)
        
        # Créer une analyse financière vide
        db_analysis = FinancialAnalysis(credit_application_id=db_application.id)
        db.add(db_analysis)
        
        db.commit()
        db.refresh(db_application)
        
        return db_application
    
    @staticmethod
    def update(db: Session, application_id: int, application_data: CreditApplicationUpdate) -> CreditApplication:
        """Met à jour une demande"""
        db_application = CreditApplicationService.get_by_id(db, application_id)
        if not db_application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Demande non trouvée"
            )
        
        # Mettre à jour les champs
        update_data = application_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_application, field, value)
        
        db.commit()
        db.refresh(db_application)
        
        return db_application
    
    @staticmethod
    def submit(db: Session, application_id: int) -> CreditApplication:
        """Soumet une demande pour évaluation"""
        db_application = CreditApplicationService.get_by_id(db, application_id)
        if not db_application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Demande non trouvée"
            )
        
        db_application.status = "submitted"
        db_application.submitted_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_application)
        
        return db_application
    
    @staticmethod
    def delete(db: Session, application_id: int) -> bool:
        """Supprime une demande"""
        db_application = CreditApplicationService.get_by_id(db, application_id)
        if not db_application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Demande non trouvée"
            )
        
        db.delete(db_application)
        db.commit()
        
        return True
