"""
Modèle Guarantee - Garanties
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Text, Enum as SQLEnum, ForeignKey, Float
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class GuaranteeType(str, enum.Enum):
    """Type de garantie"""
    FINANCIAL_SECURITY = "financial_security"
    MATERIAL_GUARANTEE = "material_guarantee"
    PLEDGE = "pledge"
    REAL_ESTATE = "real_estate"
    EQUIPMENT = "equipment"
    VEHICLE = "vehicle"


class GuaranteeStatus(str, enum.Enum):
    """Statut de la garantie"""
    PENDING = "pending"
    VALIDATED = "validated"
    REJECTED = "rejected"


class Guarantee(Base):
    """Modèle Guarantee"""
    __tablename__ = "guarantees"
    
    id = Column(Integer, primary_key=True, index=True)
    credit_application_id = Column(Integer, ForeignKey("credit_applications.id", ondelete="CASCADE"), nullable=False)
    
    # Type et description
    guarantee_type = Column(SQLEnum(GuaranteeType), nullable=False)
    nature_description = Column(Text, nullable=False)
    
    # Propriétaire
    owner_name = Column(String(200))
    owner_type = Column(String(100))  # Personnel ou Entreprise
    
    # Localisation (pour immobilier)
    location = Column(String(200))
    plot_number = Column(String(100))
    area = Column(String(100))  # Superficie
    
    # Équipement/Véhicule
    brand = Column(String(100))
    model = Column(String(100))
    
    # Valeurs
    declared_value = Column(BigInteger)  # En FCFA
    market_value = Column(BigInteger)  # En FCFA
    applicable_percentage = Column(Float)  # 0.0 à 1.0
    loan_value = Column(BigInteger)  # Valeur d'emprunt/réalisation
    
    # Statut
    status = Column(SQLEnum(GuaranteeStatus), default=GuaranteeStatus.PENDING)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relation
    credit_application = relationship("CreditApplication", back_populates="guarantees")
    
    def __repr__(self):
        return f"<Guarantee {self.guarantee_type} - {self.declared_value} FCFA>"
