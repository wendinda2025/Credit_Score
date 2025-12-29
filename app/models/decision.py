"""
Modèles pour les décisions - Recommandation AC, Avis Risk Officer, Chef d'Agence, Comité
"""
from datetime import date
from sqlalchemy import Column, Integer, String, Date, Float, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum


class DecisionEnum(str, enum.Enum):
    EN_ATTENTE = "En attente"
    ACCORD = "Accord"
    REFUS = "Refus"
    AJOURNEMENT = "Ajournement"


class RecommandationAC(Base, TimestampMixin):
    """Recommandation de l'Agent de Crédit"""
    __tablename__ = "recommandations_ac"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Analyse SWOT
    forces = Column(Text, nullable=True)
    faiblesses = Column(Text, nullable=True)
    facteurs_attenuation = Column(Text, nullable=True)
    
    # Commentaires et recommandation
    commentaires = Column(Text, nullable=True)
    
    # Détails de la recommandation
    montant_sollicite = Column(Float, nullable=True)
    montant_recommande = Column(Float, nullable=True)
    type_credit = Column(String(100), nullable=True)
    taux_interet = Column(Float, default=0.02)
    periodicite = Column(String(50), nullable=True)
    duree_mois = Column(Integer, nullable=True)
    montant_traite = Column(Float, nullable=True)
    date_debut = Column(Date, nullable=True)
    date_fin = Column(Date, nullable=True)
    
    # Signature
    nom_agent = Column(String(100), nullable=True)
    signature = Column(Boolean, default=False)
    date_signature = Column(Date, nullable=True)
    
    demande = relationship("DemandePret", back_populates="recommandation_ac")


class AvisRiskOfficer(Base, TimestampMixin):
    """Avis du Risk Officer"""
    __tablename__ = "avis_risk_officer"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Montants
    montant_demande = Column(Float, nullable=True)
    montant_recommande_ac = Column(Float, nullable=True)
    
    # Vérifications
    dossier_complet = Column(Boolean, default=False)
    accord_recommandation_ac = Column(Boolean, default=False)
    
    # Si incomplet ou désaccord
    elements_a_clarifier = Column(Text, nullable=True)
    commentaires_desaccord = Column(Text, nullable=True)
    
    # Recommandation
    montant_recommande = Column(Float, nullable=True)
    decision = Column(SQLEnum(DecisionEnum), default=DecisionEnum.EN_ATTENTE)
    commentaires = Column(Text, nullable=True)
    
    # Signature
    nom_risk_officer = Column(String(100), nullable=True)
    signature = Column(Boolean, default=False)
    date_signature = Column(Date, nullable=True)
    
    demande = relationship("DemandePret", back_populates="avis_risk_officer")


class AvisChefAgence(Base, TimestampMixin):
    """Avis du Chef d'Agence"""
    __tablename__ = "avis_chef_agence"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Montants
    montant_demande = Column(Float, nullable=True)
    montant_recommande_ac = Column(Float, nullable=True)
    
    # Vérifications
    dossier_complet = Column(Boolean, default=False)
    accord_recommandation_ac = Column(Boolean, default=False)
    
    # Si incomplet ou désaccord
    elements_a_clarifier = Column(Text, nullable=True)
    commentaires_desaccord = Column(Text, nullable=True)
    
    # Recommandation
    montant_recommande = Column(Float, nullable=True)
    decision = Column(SQLEnum(DecisionEnum), default=DecisionEnum.EN_ATTENTE)
    commentaires = Column(Text, nullable=True)
    
    # Signature
    nom_chef_agence = Column(String(100), nullable=True)
    signature = Column(Boolean, default=False)
    date_signature = Column(Date, nullable=True)
    
    demande = relationship("DemandePret", back_populates="avis_chef_agence")


class DecisionComite(Base, TimestampMixin):
    """Décision du Comité de Crédit"""
    __tablename__ = "decisions_comite"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Date du comité
    date_comite = Column(Date, nullable=True)
    
    # Éléments de décision
    analyse_conforme_politique = Column(Boolean, default=False)
    montant_raisonnable = Column(Boolean, default=False)
    volonte_remboursement = Column(Boolean, default=False)
    capacite_remboursement = Column(Boolean, default=False)
    dossier_inspire_confiance = Column(Boolean, default=False)
    validations_adequates = Column(Boolean, default=False)
    
    # Décision finale
    decision = Column(SQLEnum(DecisionEnum), default=DecisionEnum.EN_ATTENTE)
    montant_autorise = Column(Float, nullable=True)
    taux_interet = Column(Float, default=0.02)
    duree_mois = Column(Integer, nullable=True)
    nombre_echeances = Column(Integer, nullable=True)
    montant_traite = Column(Float, nullable=True)
    
    # Garanties
    caution_financiere_pct = Column(Float, default=0.1)  # 10% par défaut
    garantie_materielle_detail = Column(Text, nullable=True)
    
    # Commentaires et conditions
    commentaires = Column(Text, nullable=True)
    conditions_speciales = Column(Text, nullable=True)
    
    # Membres du comité (stocké en JSON serait idéal mais simplifions)
    membres_comite = Column(Text, nullable=True)  # Format: NOM|PRENOM|FONCTION|TITRE\n...
    
    demande = relationship("DemandePret", back_populates="decision_comite")


class MembreComite(Base, TimestampMixin):
    """Membres du comité de crédit"""
    __tablename__ = "membres_comite"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_comite_id = Column(Integer, ForeignKey("decisions_comite.id"), nullable=False)
    
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    fonction = Column(String(100), nullable=True)
    titre_comite = Column(String(100), nullable=True)  # Président, Membre, Direction
    signature = Column(Boolean, default=False)
