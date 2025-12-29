"""
Modèle CreditApplication - Demandes de crédit
"""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, BigInteger, Enum as SQLEnum, ForeignKey, Float
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    """Statut de la demande"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    POSTPONED = "postponed"
    DISBURSED = "disbursed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentFrequency(str, enum.Enum):
    """Fréquence de remboursement"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"


class ActivitySector(str, enum.Enum):
    """Secteur d'activité"""
    PRODUCTION = "production"
    SERVICE = "service"
    COMMERCE = "commerce"


class BusinessType(str, enum.Enum):
    """Type d'entreprise"""
    INDIVIDUAL = "individual"
    GROUP = "group"
    COMPANY = "company"


class BusinessLocation(str, enum.Enum):
    """Type de localisation"""
    WORKSHOP = "workshop"
    HOME = "home"
    MARKET = "market"
    STREET = "street"


class CreditApplication(Base):
    """Modèle CreditApplication"""
    __tablename__ = "credit_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Références
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Informations de la demande
    application_date = Column(Date, default=date.today, nullable=False)
    requested_amount = Column(BigInteger, nullable=False)  # En FCFA
    duration_months = Column(Integer, nullable=False)
    payment_frequency = Column(SQLEnum(PaymentFrequency), nullable=False)
    
    # Objet du crédit
    credit_purpose = Column(Text, nullable=False)
    
    # Informations sur l'activité
    business_name = Column(String(200))
    activity_sector = Column(SQLEnum(ActivitySector))
    business_type = Column(SQLEnum(BusinessType))
    business_location_type = Column(SQLEnum(BusinessLocation))
    business_address = Column(Text)
    business_neighborhood = Column(String(200))
    business_since_year = Column(Integer)
    years_at_location = Column(Integer)
    
    # Projet
    project_total_cost = Column(BigInteger)  # En FCFA
    personal_contribution = Column(BigInteger)  # En FCFA
    financing_percentage = Column(Float)
    
    # Montants recommandés et approuvés
    agent_recommended_amount = Column(BigInteger)
    risk_officer_recommended_amount = Column(BigInteger)
    chef_agence_recommended_amount = Column(BigInteger)
    approved_amount = Column(BigInteger)
    approved_duration_months = Column(Integer)
    
    # Statut
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.DRAFT, nullable=False)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime)
    approved_at = Column(DateTime)
    disbursed_at = Column(DateTime)
    
    # Relations
    client = relationship("Client", back_populates="credit_applications")
    agent = relationship("User", back_populates="credit_applications", foreign_keys=[agent_id])
    guarantees = relationship("Guarantee", back_populates="credit_application", cascade="all, delete-orphan")
    financial_analysis = relationship("FinancialAnalysis", back_populates="credit_application", uselist=False, cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="credit_application", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="credit_application", cascade="all, delete-orphan")
    project_items = relationship("ProjectItem", back_populates="credit_application", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CreditApplication {self.application_number} - {self.status}>"


class ProjectItem(Base):
    """Éléments du projet (coût détaillé)"""
    __tablename__ = "project_items"
    
    id = Column(Integer, primary_key=True, index=True)
    credit_application_id = Column(Integer, ForeignKey("credit_applications.id", ondelete="CASCADE"), nullable=False)
    
    description = Column(String(200), nullable=False)
    amount = Column(BigInteger, nullable=False)  # En FCFA
    item_type = Column(String(50))  # "cost" ou "funding"
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relation
    credit_application = relationship("CreditApplication", back_populates="project_items")
