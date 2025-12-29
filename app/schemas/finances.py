"""
Schémas Pydantic pour les données financières
"""
from datetime import date, datetime
from typing import Optional, Dict
from pydantic import BaseModel, Field


class DepensesFamilialesBase(BaseModel):
    """Schéma de base pour dépenses familiales"""
    alimentation: float = Field(default=0, ge=0)
    loyer: float = Field(default=0, ge=0)
    electricite_eau: float = Field(default=0, ge=0)
    transport: float = Field(default=0, ge=0)
    sante: float = Field(default=0, ge=0)
    education: float = Field(default=0, ge=0)
    habillement: float = Field(default=0, ge=0)
    communication: float = Field(default=0, ge=0)
    loisirs: float = Field(default=0, ge=0)
    autres_depenses: float = Field(default=0, ge=0)
    autres_depenses_detail: Optional[str] = None


class DepensesFamilialesCreate(DepensesFamilialesBase):
    """Schéma pour créer dépenses familiales"""
    demande_id: int


class DepensesFamilialesResponse(DepensesFamilialesBase):
    """Schéma de réponse pour dépenses familiales"""
    id: int
    demande_id: int
    total_depenses: float = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BilanBase(BaseModel):
    """Schéma de base pour bilan"""
    date_bilan: Optional[date] = None
    
    # Actif immobilisé
    terrains: float = Field(default=0, ge=0)
    batiments: float = Field(default=0, ge=0)
    equipements: float = Field(default=0, ge=0)
    materiel_roulant: float = Field(default=0, ge=0)
    autres_immobilisations: float = Field(default=0, ge=0)
    
    # Actif circulant
    stocks: float = Field(default=0, ge=0)
    creances_clients: float = Field(default=0, ge=0)
    autres_creances: float = Field(default=0, ge=0)
    disponibilites: float = Field(default=0, ge=0)
    
    # Passif CT
    fournisseurs: float = Field(default=0, ge=0)
    dettes_fiscales: float = Field(default=0, ge=0)
    autres_dettes_ct: float = Field(default=0, ge=0)
    
    # Passif MLT
    emprunts_bancaires: float = Field(default=0, ge=0)
    autres_dettes_mlt: float = Field(default=0, ge=0)


class BilanCreate(BilanBase):
    """Schéma pour créer un bilan"""
    demande_id: int


class BilanResponse(BilanBase):
    """Schéma de réponse pour bilan"""
    id: int
    demande_id: int
    
    # Propriétés calculées
    total_actif_immobilise: float = 0
    total_actif_circulant: float = 0
    total_actif: float = 0
    total_dettes_ct: float = 0
    total_dettes_mlt: float = 0
    total_dettes: float = 0
    situation_nette: float = 0
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CashFlowBase(BaseModel):
    """Schéma de base pour cash flow"""
    chiffre_affaires_mensuel: Optional[Dict[str, float]] = None
    achats_mensuels: Optional[Dict[str, float]] = None
    charges_exploitation_mensuelles: Optional[Dict[str, float]] = None
    
    chiffre_affaires_annuel: float = Field(default=0, ge=0)
    achats_annuels: float = Field(default=0, ge=0)
    marge_brute_annuelle: float = Field(default=0, ge=0)
    
    commentaires: Optional[str] = None


class CashFlowCreate(CashFlowBase):
    """Schéma pour créer un cash flow"""
    demande_id: int


class CashFlowResponse(CashFlowBase):
    """Schéma de réponse pour cash flow"""
    id: int
    demande_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CompteExploitationBase(BaseModel):
    """Schéma de base pour compte d'exploitation"""
    ventes_mensuelles: Optional[Dict[str, float]] = None
    achats_mensuels: Optional[Dict[str, float]] = None
    
    loyer_mensuel: float = Field(default=0, ge=0)
    electricite_eau_mensuel: float = Field(default=0, ge=0)
    salaires_mensuel: float = Field(default=0, ge=0)
    transport_mensuel: float = Field(default=0, ge=0)
    telephone_mensuel: float = Field(default=0, ge=0)
    entretien_mensuel: float = Field(default=0, ge=0)
    autres_charges_mensuel: float = Field(default=0, ge=0)
    
    ventes_annuelles: float = Field(default=0, ge=0)
    achats_annuels: float = Field(default=0, ge=0)
    marge_brute: float = Field(default=0, ge=0)
    total_charges_exploitation: float = Field(default=0, ge=0)
    resultat_exploitation: float = Field(default=0, ge=0)
    
    commentaires: Optional[str] = None


class CompteExploitationCreate(CompteExploitationBase):
    """Schéma pour créer un compte d'exploitation"""
    demande_id: int


class CompteExploitationResponse(CompteExploitationBase):
    """Schéma de réponse pour compte exploitation"""
    id: int
    demande_id: int
    charges_mensuelles_total: float = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResultatNetBase(BaseModel):
    """Schéma de base pour résultat net"""
    chiffre_affaires_mensuel: Optional[Dict[str, float]] = None
    cout_achats_mensuel: Optional[Dict[str, float]] = None
    marge_brute_mensuelle: Optional[Dict[str, float]] = None
    charges_exploitation_mensuelles: Optional[Dict[str, float]] = None
    
    chiffre_affaires_moyen: float = Field(default=0, ge=0)
    marge_brute_moyenne: float = Field(default=0, ge=0)
    charges_exploitation_moyenne: float = Field(default=0, ge=0)
    
    resultat_exploitation_moyen: float = Field(default=0, ge=0)
    dotation_amortissement: float = Field(default=0, ge=0)
    charges_financieres: float = Field(default=0, ge=0)
    autres_charges: float = Field(default=0, ge=0)
    profit_net_moyen: float = Field(default=0, ge=0)
    
    commentaires: Optional[str] = None


class ResultatNetCreate(ResultatNetBase):
    """Schéma pour créer un résultat net"""
    demande_id: int


class ResultatNetResponse(ResultatNetBase):
    """Schéma de réponse pour résultat net"""
    id: int
    demande_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AnalyseRatiosBase(BaseModel):
    """Schéma de base pour analyse des ratios"""
    montant_remboursement_periode: float = Field(default=0, ge=0)
    
    # Capacités
    capacites_gestion: Optional[str] = None
    systeme_approvisionnement: Optional[str] = None
    operations_entreprise: Optional[str] = None
    mise_en_marche: Optional[str] = None
    secteur_environnement: Optional[str] = None
    
    # Ratios de rentabilité
    marge_beneficiaire: float = Field(default=0, ge=0, le=1)
    capacite_autofinancement: float = Field(default=0, ge=0)
    
    # Ratios structure et liquidité
    ratio_endettement: float = Field(default=0, ge=0)
    capacite_remboursement: float = Field(default=0, ge=0)
    ratio_participation: float = Field(default=0, ge=0)
    ratio_liquidite: float = Field(default=0, ge=0)
    ratio_endettement_global: float = Field(default=0, ge=0)
    
    # Ratios rotation
    rotation_stock: float = Field(default=0, ge=0)
    temps_ecoulement: float = Field(default=0, ge=0)
    
    commentaires_ratios: Optional[str] = None


class AnalyseRatiosCreate(AnalyseRatiosBase):
    """Schéma pour créer une analyse de ratios"""
    demande_id: int


class AnalyseRatiosResponse(AnalyseRatiosBase):
    """Schéma de réponse pour analyse ratios"""
    id: int
    demande_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
