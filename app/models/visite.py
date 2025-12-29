"""
Modèles pour la visite de validation - Feuille "Visite - validation"
"""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum


class TypeActifEnum(str, enum.Enum):
    TERRAIN = "Terrain"
    BATIMENT = "Bâtiment"
    EQUIPEMENT = "Équipement"
    MATERIEL_ROULANT = "Matériel Roulant"
    STOCK = "Stock"
    AUTRE = "Autre"


class StatutValidationEnum(str, enum.Enum):
    NON_VERIFIE = "Non vérifié"
    VALIDE = "Validé"
    NON_CONFORME = "Non conforme"
    EN_ATTENTE = "En attente"


class VisiteValidation(Base, TimestampMixin):
    """Visite de validation terrain"""
    __tablename__ = "visites_validation"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Informations de visite
    date_visite = Column(Date, nullable=True)
    agent_visite = Column(String(100), nullable=True)
    
    # Sources de revenus validées
    activite_principale_validee = Column(Boolean, default=False)
    activite_principale_observation = Column(Text, nullable=True)
    activite_secondaire_1 = Column(String(200), nullable=True)
    activite_secondaire_1_validee = Column(Boolean, default=False)
    activite_secondaire_2 = Column(String(200), nullable=True)
    activite_secondaire_2_validee = Column(Boolean, default=False)
    
    # Liquidités
    total_liquidites = Column(Float, default=0)
    liquidites_validees = Column(Boolean, default=False)
    
    # Dettes
    total_dettes = Column(Float, default=0)
    dettes_validees = Column(Boolean, default=False)
    
    # Commentaires généraux
    commentaires_visite = Column(Text, nullable=True)
    
    # Signature
    signature_agent = Column(Boolean, default=False)
    date_signature = Column(Date, nullable=True)
    
    # Relations
    demande = relationship("DemandePret", back_populates="visite_validation")
    actifs = relationship("ActifEntreprise", back_populates="visite", cascade="all, delete-orphan")
    stocks = relationship("Stock", back_populates="visite", cascade="all, delete-orphan")
    liquidites = relationship("Liquidite", back_populates="visite", cascade="all, delete-orphan")
    dettes = relationship("Dette", back_populates="visite", cascade="all, delete-orphan")


class ActifEntreprise(Base, TimestampMixin):
    """Actifs de l'entreprise (terrains, bâtiments, équipements, etc.)"""
    __tablename__ = "actifs_entreprise"
    
    id = Column(Integer, primary_key=True, index=True)
    visite_id = Column(Integer, ForeignKey("visites_validation.id"), nullable=False)
    
    type_actif = Column(SQLEnum(TypeActifEnum), nullable=False)
    description = Column(String(255), nullable=False)
    date_acquisition = Column(String(50), nullable=True)
    quantite = Column(Integer, default=1)
    valeur_estimee = Column(Float, nullable=True)
    statut_validation = Column(SQLEnum(StatutValidationEnum), default=StatutValidationEnum.NON_VERIFIE)
    observations = Column(Text, nullable=True)
    
    visite = relationship("VisiteValidation", back_populates="actifs")


class Stock(Base, TimestampMixin):
    """Stocks et fournitures"""
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    visite_id = Column(Integer, ForeignKey("visites_validation.id"), nullable=False)
    
    description = Column(String(255), nullable=False)
    quantite = Column(Float, nullable=False)
    prix_unitaire = Column(Float, nullable=True)
    valeur_totale = Column(Float, nullable=True)
    statut_validation = Column(SQLEnum(StatutValidationEnum), default=StatutValidationEnum.NON_VERIFIE)
    
    visite = relationship("VisiteValidation", back_populates="stocks")


class Liquidite(Base, TimestampMixin):
    """Liquidités du client"""
    __tablename__ = "liquidites"
    
    id = Column(Integer, primary_key=True, index=True)
    visite_id = Column(Integer, ForeignKey("visites_validation.id"), nullable=False)
    
    institution = Column(String(100), nullable=False)
    montant = Column(Float, nullable=False)
    statut_validation = Column(SQLEnum(StatutValidationEnum), default=StatutValidationEnum.NON_VERIFIE)
    
    visite = relationship("VisiteValidation", back_populates="liquidites")


class Dette(Base, TimestampMixin):
    """Dettes du client"""
    __tablename__ = "dettes"
    
    id = Column(Integer, primary_key=True, index=True)
    visite_id = Column(Integer, ForeignKey("visites_validation.id"), nullable=False)
    
    institution = Column(String(100), nullable=False)
    montant = Column(Float, nullable=False)
    statut_validation = Column(SQLEnum(StatutValidationEnum), default=StatutValidationEnum.NON_VERIFIE)
    
    visite = relationship("VisiteValidation", back_populates="dettes")
