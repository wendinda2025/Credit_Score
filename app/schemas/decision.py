"""
Schémas Pydantic pour les décisions
"""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.decision import DecisionEnum


class RecommandationACBase(BaseModel):
    """Schéma de base pour recommandation AC"""
    forces: Optional[str] = None
    faiblesses: Optional[str] = None
    facteurs_attenuation: Optional[str] = None
    commentaires: Optional[str] = None
    
    montant_sollicite: Optional[float] = None
    montant_recommande: Optional[float] = None
    type_credit: Optional[str] = None
    taux_interet: float = Field(default=0.02, ge=0, le=1)
    periodicite: Optional[str] = None
    duree_mois: Optional[int] = None
    montant_traite: Optional[float] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    
    nom_agent: Optional[str] = None


class RecommandationACCreate(RecommandationACBase):
    """Schéma pour créer une recommandation AC"""
    demande_id: int


class RecommandationACResponse(RecommandationACBase):
    """Schéma de réponse pour recommandation AC"""
    id: int
    demande_id: int
    signature: bool = False
    date_signature: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AvisRiskOfficerBase(BaseModel):
    """Schéma de base pour avis Risk Officer"""
    montant_demande: Optional[float] = None
    montant_recommande_ac: Optional[float] = None
    
    dossier_complet: bool = False
    accord_recommandation_ac: bool = False
    
    elements_a_clarifier: Optional[str] = None
    commentaires_desaccord: Optional[str] = None
    
    montant_recommande: Optional[float] = None
    decision: DecisionEnum = DecisionEnum.EN_ATTENTE
    commentaires: Optional[str] = None
    
    nom_risk_officer: Optional[str] = None


class AvisRiskOfficerCreate(AvisRiskOfficerBase):
    """Schéma pour créer un avis Risk Officer"""
    demande_id: int


class AvisRiskOfficerResponse(AvisRiskOfficerBase):
    """Schéma de réponse pour avis Risk Officer"""
    id: int
    demande_id: int
    signature: bool = False
    date_signature: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AvisChefAgenceBase(BaseModel):
    """Schéma de base pour avis Chef d'Agence"""
    montant_demande: Optional[float] = None
    montant_recommande_ac: Optional[float] = None
    
    dossier_complet: bool = False
    accord_recommandation_ac: bool = False
    
    elements_a_clarifier: Optional[str] = None
    commentaires_desaccord: Optional[str] = None
    
    montant_recommande: Optional[float] = None
    decision: DecisionEnum = DecisionEnum.EN_ATTENTE
    commentaires: Optional[str] = None
    
    nom_chef_agence: Optional[str] = None


class AvisChefAgenceCreate(AvisChefAgenceBase):
    """Schéma pour créer un avis Chef d'Agence"""
    demande_id: int


class AvisChefAgenceResponse(AvisChefAgenceBase):
    """Schéma de réponse pour avis Chef Agence"""
    id: int
    demande_id: int
    signature: bool = False
    date_signature: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MembreComiteSchema(BaseModel):
    """Schéma pour membre du comité"""
    nom: str
    prenom: str
    fonction: Optional[str] = None
    titre_comite: Optional[str] = None
    signature: bool = False


class DecisionComiteBase(BaseModel):
    """Schéma de base pour décision comité"""
    date_comite: Optional[date] = None
    
    # Éléments de décision
    analyse_conforme_politique: bool = False
    montant_raisonnable: bool = False
    volonte_remboursement: bool = False
    capacite_remboursement: bool = False
    dossier_inspire_confiance: bool = False
    validations_adequates: bool = False
    
    # Décision
    decision: DecisionEnum = DecisionEnum.EN_ATTENTE
    montant_autorise: Optional[float] = None
    taux_interet: float = Field(default=0.02, ge=0, le=1)
    duree_mois: Optional[int] = None
    nombre_echeances: Optional[int] = None
    montant_traite: Optional[float] = None
    
    # Garanties
    caution_financiere_pct: float = Field(default=0.1, ge=0, le=1)
    garantie_materielle_detail: Optional[str] = None
    
    # Commentaires
    commentaires: Optional[str] = None
    conditions_speciales: Optional[str] = None


class DecisionComiteCreate(DecisionComiteBase):
    """Schéma pour créer une décision comité"""
    demande_id: int
    membres: List[MembreComiteSchema] = []


class DecisionComiteResponse(DecisionComiteBase):
    """Schéma de réponse pour décision comité"""
    id: int
    demande_id: int
    membres_comite: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
