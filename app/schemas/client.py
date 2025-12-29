"""
Schémas Pydantic pour les clients
"""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re

from app.models.client import (
    SexeEnum, EtatCivilEnum, NiveauAcademiqueEnum,
    TypePieceIdentiteEnum, StatutProprietaireEnum,
    SecteurActiviteEnum, TypeEntrepriseEnum
)


class PersonneReferenceCreate(BaseModel):
    """Schéma pour créer une personne de référence"""
    numero_client_ref: Optional[str] = None
    nom_prenom: str = Field(..., min_length=2, max_length=200)
    profession: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    lien: Optional[str] = None

    @field_validator('telephone')
    @classmethod
    def validate_telephone(cls, v):
        if v and not re.match(r'^[\d\s\-\+]{8,20}$', v):
            raise ValueError('Numéro de téléphone invalide')
        return v


class PersonneReferenceResponse(PersonneReferenceCreate):
    """Schéma de réponse pour personne de référence"""
    id: int
    
    class Config:
        from_attributes = True


class CompteBancaireCreate(BaseModel):
    """Schéma pour créer un compte bancaire"""
    institution: str = Field(..., min_length=2, max_length=100)
    type_compte: Optional[str] = None
    numero_compte: Optional[str] = None
    solde: float = Field(default=0, ge=0)
    annee_ouverture: Optional[int] = None

    @field_validator('annee_ouverture')
    @classmethod
    def validate_annee(cls, v):
        if v and (v < 1900 or v > datetime.now().year):
            raise ValueError('Année d\'ouverture invalide')
        return v


class CompteBancaireResponse(CompteBancaireCreate):
    """Schéma de réponse pour compte bancaire"""
    id: int
    
    class Config:
        from_attributes = True


class ClientBase(BaseModel):
    """Schéma de base pour un client"""
    # Informations personnelles
    nom: str = Field(..., min_length=2, max_length=100)
    prenom: str = Field(..., min_length=2, max_length=100)
    date_naissance: Optional[date] = None
    sexe: SexeEnum
    
    # Pièce d'identité
    type_piece_identite: TypePieceIdentiteEnum
    numero_piece_identite: str = Field(..., min_length=5, max_length=50)
    
    # Coordonnées
    adresse: str = Field(..., min_length=5, max_length=255)
    adresse_depuis: Optional[str] = None
    cellulaire: str = Field(..., min_length=8, max_length=20)
    telephone_fixe: Optional[str] = None
    
    # Statut résidentiel
    statut_proprietaire: Optional[StatutProprietaireEnum] = None
    
    # Niveau académique
    niveau_academique: Optional[NiveauAcademiqueEnum] = None
    
    # Situation familiale
    etat_civil: Optional[EtatCivilEnum] = None
    nom_conjoint: Optional[str] = None
    prenom_conjoint: Optional[str] = None
    nombre_enfants: int = Field(default=0, ge=0)
    autres_personnes_charge: int = Field(default=0, ge=0)
    
    # Agence
    agence: str = Field(..., min_length=2, max_length=100)
    
    # Informations sur l'activité
    nom_entreprise: Optional[str] = None
    secteur_activite: Optional[SecteurActiviteEnum] = None
    type_entreprise: Optional[TypeEntrepriseEnum] = None
    adresse_activite: Optional[str] = None
    activite_depuis: Optional[str] = None
    profession: Optional[str] = None
    
    # Activité principale
    activite_principale: Optional[str] = None
    difficultes_activite: Optional[str] = None
    
    # Autres activités
    a_autres_activites: bool = False
    autres_activites_detail: Optional[str] = None

    @field_validator('cellulaire', 'telephone_fixe')
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r'^[\d\s\-\+]{8,20}$', v):
            raise ValueError('Numéro de téléphone invalide')
        return v


class ClientCreate(ClientBase):
    """Schéma pour créer un client"""
    numero_client: Optional[str] = None  # Auto-généré si non fourni
    numero_credit_cmb: Optional[str] = None  # Numéro du CBS Oracle
    date_adhesion: Optional[date] = None
    
    # Relations
    personnes_reference: List[PersonneReferenceCreate] = []
    comptes_bancaires: List[CompteBancaireCreate] = []


class ClientUpdate(BaseModel):
    """Schéma pour mettre à jour un client (tous champs optionnels)"""
    nom: Optional[str] = None
    prenom: Optional[str] = None
    date_naissance: Optional[date] = None
    sexe: Optional[SexeEnum] = None
    type_piece_identite: Optional[TypePieceIdentiteEnum] = None
    numero_piece_identite: Optional[str] = None
    adresse: Optional[str] = None
    cellulaire: Optional[str] = None
    telephone_fixe: Optional[str] = None
    agence: Optional[str] = None
    nom_entreprise: Optional[str] = None
    secteur_activite: Optional[SecteurActiviteEnum] = None
    profession: Optional[str] = None
    etat_civil: Optional[EtatCivilEnum] = None
    nombre_enfants: Optional[int] = None
    autres_personnes_charge: Optional[int] = None


class ClientResponse(ClientBase):
    """Schéma de réponse pour un client"""
    id: int
    numero_client: str
    numero_credit_cmb: Optional[str] = None
    date_adhesion: Optional[date] = None
    presence_liste_radies: bool = False
    historique_credit_positif: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    
    # Relations
    personnes_reference: List[PersonneReferenceResponse] = []
    comptes_bancaires: List[CompteBancaireResponse] = []
    
    class Config:
        from_attributes = True


class ClientListResponse(BaseModel):
    """Schéma pour liste de clients avec pagination"""
    items: List[ClientResponse]
    total: int
    page: int
    size: int
    pages: int
