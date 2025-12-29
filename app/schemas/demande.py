"""
Schémas Pydantic pour les demandes de prêt
"""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

from app.models.demande import (
    PeriodiciteEnum, TypeGarantieEnum, StatutDemandeEnum, TypeCreditEnum
)


class GarantieCreate(BaseModel):
    """Schéma pour créer une garantie"""
    type_garantie: TypeGarantieEnum
    nature_description: str = Field(..., min_length=5, max_length=255)
    valeur_declaree: float = Field(..., gt=0)
    valeur_retenue: Optional[float] = None


class GarantieResponse(GarantieCreate):
    """Schéma de réponse pour garantie"""
    id: int
    
    class Config:
        from_attributes = True


class CoutProjetCreate(BaseModel):
    """Schéma pour créer un coût de projet"""
    description: str = Field(..., min_length=2, max_length=255)
    montant: float = Field(..., gt=0)


class CoutProjetResponse(CoutProjetCreate):
    """Schéma de réponse pour coût projet"""
    id: int
    
    class Config:
        from_attributes = True


class ProvenanceFondsCreate(BaseModel):
    """Schéma pour créer une provenance de fonds"""
    source: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    montant: float = Field(..., gt=0)


class ProvenanceFondsResponse(ProvenanceFondsCreate):
    """Schéma de réponse pour provenance fonds"""
    id: int
    
    class Config:
        from_attributes = True


class DemandeBase(BaseModel):
    """Schéma de base pour une demande"""
    montant_sollicite: float = Field(..., gt=0, description="Montant en FCFA")
    duree_mois: int = Field(..., gt=0, le=120, description="Durée en mois")
    periodicite: PeriodiciteEnum
    type_credit: Optional[TypeCreditEnum] = None
    taux_interet: float = Field(default=0.02, ge=0, le=1)
    objet_credit: str = Field(..., min_length=20, description="Description détaillée de l'objet du crédit")

    @field_validator('montant_sollicite')
    @classmethod
    def validate_montant(cls, v):
        if v < 50000:
            raise ValueError('Le montant minimum est de 50 000 FCFA')
        if v > 500000000:
            raise ValueError('Le montant maximum est de 500 000 000 FCFA')
        return v


class DemandeCreate(DemandeBase):
    """Schéma pour créer une demande"""
    client_id: int
    
    # Relations
    garanties: List[GarantieCreate] = []
    couts_projet: List[CoutProjetCreate] = []
    provenances_fonds: List[ProvenanceFondsCreate] = []


class DemandeUpdate(BaseModel):
    """Schéma pour mettre à jour une demande"""
    montant_sollicite: Optional[float] = None
    duree_mois: Optional[int] = None
    periodicite: Optional[PeriodiciteEnum] = None
    type_credit: Optional[TypeCreditEnum] = None
    taux_interet: Optional[float] = None
    objet_credit: Optional[str] = None
    statut: Optional[StatutDemandeEnum] = None


class DemandeResponse(DemandeBase):
    """Schéma de réponse pour une demande"""
    id: int
    client_id: int
    numero_demande: str
    date_demande: date
    statut: StatutDemandeEnum
    
    # Montants après décision
    montant_recommande_ac: Optional[float] = None
    montant_recommande_ro: Optional[float] = None
    montant_recommande_ca: Optional[float] = None
    montant_autorise: Optional[float] = None
    
    # Signature
    signature_client: bool = False
    date_signature_client: Optional[date] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Relations
    garanties: List[GarantieResponse] = []
    couts_projet: List[CoutProjetResponse] = []
    provenances_fonds: List[ProvenanceFondsResponse] = []
    
    # Propriétés calculées
    total_garanties: float = 0
    total_cout_projet: float = 0
    pourcentage_financement_pamf: float = 0
    
    class Config:
        from_attributes = True


class DemandeListResponse(BaseModel):
    """Schéma pour liste de demandes avec pagination"""
    items: List[DemandeResponse]
    total: int
    page: int
    size: int
    pages: int


class DemandeStatistiques(BaseModel):
    """Statistiques des demandes"""
    total_demandes: int
    demandes_en_cours: int
    demandes_approuvees: int
    demandes_refusees: int
    montant_total_sollicite: float
    montant_total_approuve: float
