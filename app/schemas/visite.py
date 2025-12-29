"""
Schémas Pydantic pour les visites de validation
"""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.visite import TypeActifEnum, StatutValidationEnum


class ActifEntrepriseCreate(BaseModel):
    """Schéma pour créer un actif d'entreprise"""
    type_actif: TypeActifEnum
    description: str = Field(..., min_length=2, max_length=255)
    date_acquisition: Optional[str] = None
    quantite: int = Field(default=1, ge=1)
    valeur_estimee: Optional[float] = None
    statut_validation: StatutValidationEnum = StatutValidationEnum.NON_VERIFIE
    observations: Optional[str] = None


class ActifEntrepriseResponse(ActifEntrepriseCreate):
    """Schéma de réponse pour actif entreprise"""
    id: int
    
    class Config:
        from_attributes = True


class StockCreate(BaseModel):
    """Schéma pour créer un stock"""
    description: str = Field(..., min_length=2, max_length=255)
    quantite: float = Field(..., gt=0)
    prix_unitaire: Optional[float] = None
    valeur_totale: Optional[float] = None
    statut_validation: StatutValidationEnum = StatutValidationEnum.NON_VERIFIE


class StockResponse(StockCreate):
    """Schéma de réponse pour stock"""
    id: int
    
    class Config:
        from_attributes = True


class LiquiditeCreate(BaseModel):
    """Schéma pour créer une liquidité"""
    institution: str = Field(..., min_length=2, max_length=100)
    montant: float = Field(..., ge=0)
    statut_validation: StatutValidationEnum = StatutValidationEnum.NON_VERIFIE


class LiquiditeResponse(LiquiditeCreate):
    """Schéma de réponse pour liquidité"""
    id: int
    
    class Config:
        from_attributes = True


class DetteCreate(BaseModel):
    """Schéma pour créer une dette"""
    institution: str = Field(..., min_length=2, max_length=100)
    montant: float = Field(..., ge=0)
    statut_validation: StatutValidationEnum = StatutValidationEnum.NON_VERIFIE


class DetteResponse(DetteCreate):
    """Schéma de réponse pour dette"""
    id: int
    
    class Config:
        from_attributes = True


class VisiteValidationBase(BaseModel):
    """Schéma de base pour visite validation"""
    date_visite: Optional[date] = None
    agent_visite: Optional[str] = None
    
    # Sources de revenus
    activite_principale_validee: bool = False
    activite_principale_observation: Optional[str] = None
    activite_secondaire_1: Optional[str] = None
    activite_secondaire_1_validee: bool = False
    activite_secondaire_2: Optional[str] = None
    activite_secondaire_2_validee: bool = False
    
    # Liquidités et dettes
    total_liquidites: float = Field(default=0, ge=0)
    liquidites_validees: bool = False
    total_dettes: float = Field(default=0, ge=0)
    dettes_validees: bool = False
    
    # Commentaires
    commentaires_visite: Optional[str] = None


class VisiteValidationCreate(VisiteValidationBase):
    """Schéma pour créer une visite validation"""
    demande_id: int
    
    # Relations
    actifs: List[ActifEntrepriseCreate] = []
    stocks: List[StockCreate] = []
    liquidites: List[LiquiditeCreate] = []
    dettes: List[DetteCreate] = []


class VisiteValidationUpdate(BaseModel):
    """Schéma pour mettre à jour une visite"""
    date_visite: Optional[date] = None
    agent_visite: Optional[str] = None
    activite_principale_validee: Optional[bool] = None
    activite_principale_observation: Optional[str] = None
    commentaires_visite: Optional[str] = None
    signature_agent: Optional[bool] = None
    date_signature: Optional[date] = None


class VisiteValidationResponse(VisiteValidationBase):
    """Schéma de réponse pour visite validation"""
    id: int
    demande_id: int
    signature_agent: bool = False
    date_signature: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    # Relations
    actifs: List[ActifEntrepriseResponse] = []
    stocks: List[StockResponse] = []
    liquidites: List[LiquiditeResponse] = []
    dettes: List[DetteResponse] = []
    
    class Config:
        from_attributes = True
