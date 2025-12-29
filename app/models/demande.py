"""
Modèles pour la demande de prêt - Feuille "Demande"
"""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum


class PeriodiciteEnum(str, enum.Enum):
    MENSUEL = "Mensuel"
    TRIMESTRIEL = "Trimestriel"
    SEMESTRIEL = "Semestriel"
    ANNUEL = "Annuel"
    INFINE = "In Fine"
    AUTRE = "Autre"


class TypeGarantieEnum(str, enum.Enum):
    CAUTION_FINANCIERE = "Caution Financière"
    GARANTIE_MATERIELLE = "Garantie Matérielle"
    MISE_EN_GAGE = "Mise en Gage"
    NANTISSEMENT = "Nantissement"
    HYPOTHEQUE = "Hypothèque"
    AUTRE = "Autre"


class StatutDemandeEnum(str, enum.Enum):
    BROUILLON = "Brouillon"
    SOUMISE = "Soumise"
    EN_ANALYSE = "En Analyse"
    VISITE_PLANIFIEE = "Visite Planifiée"
    VISITE_EFFECTUEE = "Visite Effectuée"
    EN_COMITE = "En Comité"
    APPROUVEE = "Approuvée"
    REFUSEE = "Refusée"
    AJOURNEE = "Ajournée"
    DECAISSEE = "Décaissée"
    ANNULEE = "Annulée"


class TypeCreditEnum(str, enum.Enum):
    FDR = "Fonds de Roulement"
    INVESTISSEMENT = "Investissement"
    EQUIPEMENT = "Équipement"
    IMMOBILIER = "Immobilier"
    CONSOMMATION = "Consommation"
    AUTRE = "Autre"


class DemandePret(Base, TimestampMixin):
    """Modèle pour la demande de prêt"""
    __tablename__ = "demandes_pret"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    # Numéro de demande auto-généré
    numero_demande = Column(String(50), unique=True, index=True, nullable=False)
    date_demande = Column(Date, default=date.today, nullable=False)
    
    # Statut du workflow
    statut = Column(SQLEnum(StatutDemandeEnum), default=StatutDemandeEnum.BROUILLON)
    
    # Informations de la demande
    montant_sollicite = Column(Float, nullable=False)
    duree_mois = Column(Integer, nullable=False)
    periodicite = Column(SQLEnum(PeriodiciteEnum), nullable=False)
    type_credit = Column(SQLEnum(TypeCreditEnum), nullable=True)
    taux_interet = Column(Float, default=0.02)  # 2% par défaut
    
    # Objet du crédit (description détaillée)
    objet_credit = Column(Text, nullable=False)
    
    # Montants finaux (après décision)
    montant_recommande_ac = Column(Float, nullable=True)
    montant_recommande_ro = Column(Float, nullable=True)
    montant_recommande_ca = Column(Float, nullable=True)
    montant_autorise = Column(Float, nullable=True)
    
    # Signature client
    signature_client = Column(Boolean, default=False)
    date_signature_client = Column(Date, nullable=True)
    
    # Relations
    client = relationship("Client", back_populates="demandes_pret")
    garanties = relationship("Garantie", back_populates="demande", cascade="all, delete-orphan")
    couts_projet = relationship("CoutProjet", back_populates="demande", cascade="all, delete-orphan")
    provenances_fonds = relationship("ProvenanceFonds", back_populates="demande", cascade="all, delete-orphan")
    visite_validation = relationship("VisiteValidation", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    depenses_familiales = relationship("DepensesFamiliales", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    bilan = relationship("Bilan", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    cash_flow = relationship("CashFlow", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    compte_exploitation = relationship("CompteExploitation", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    resultat_net = relationship("ResultatNet", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    analyse_ratios = relationship("AnalyseRatios", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    recommandation_ac = relationship("RecommandationAC", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    avis_risk_officer = relationship("AvisRiskOfficer", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    avis_chef_agence = relationship("AvisChefAgence", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    decision_comite = relationship("DecisionComite", back_populates="demande", uselist=False, cascade="all, delete-orphan")
    
    @property
    def total_garanties(self) -> float:
        """Calcule le total des garanties retenues"""
        return sum(g.valeur_retenue or 0 for g in self.garanties)
    
    @property
    def total_cout_projet(self) -> float:
        """Calcule le coût total du projet"""
        return sum(c.montant or 0 for c in self.couts_projet)
    
    @property
    def total_provenance_fonds(self) -> float:
        """Calcule le total des fonds"""
        return sum(p.montant or 0 for p in self.provenances_fonds)
    
    @property
    def pourcentage_financement_pamf(self) -> float:
        """Calcule le % de financement PAMF"""
        total = self.total_cout_projet
        if total == 0:
            return 0
        pamf = sum(p.montant or 0 for p in self.provenances_fonds if p.source == "PAMF")
        return (pamf / total) * 100
    
    def __repr__(self):
        return f"<DemandePret {self.numero_demande}: {self.montant_sollicite} FCFA>"


class Garantie(Base, TimestampMixin):
    """Garanties proposées pour le prêt"""
    __tablename__ = "garanties"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    type_garantie = Column(SQLEnum(TypeGarantieEnum), nullable=False)
    nature_description = Column(String(255), nullable=False)
    valeur_declaree = Column(Float, nullable=False)
    valeur_retenue = Column(Float, nullable=True)
    
    # Documents associés
    document_path = Column(String(500), nullable=True)
    
    demande = relationship("DemandePret", back_populates="garanties")


class CoutProjet(Base, TimestampMixin):
    """Coûts détaillés du projet"""
    __tablename__ = "couts_projet"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    description = Column(String(255), nullable=False)
    montant = Column(Float, nullable=False)
    
    demande = relationship("DemandePret", back_populates="couts_projet")


class ProvenanceFonds(Base, TimestampMixin):
    """Provenance des fonds pour le projet"""
    __tablename__ = "provenances_fonds"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    source = Column(String(100), nullable=False)  # Apports personnels, PAMF, Autre
    description = Column(String(255), nullable=True)
    montant = Column(Float, nullable=False)
    
    demande = relationship("DemandePret", back_populates="provenances_fonds")
