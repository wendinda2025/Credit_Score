"""
Modèle Client - Clients demandeurs de crédit
"""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class Gender(str, enum.Enum):
    """Genre"""
    MALE = "male"
    FEMALE = "female"


class MaritalStatus(str, enum.Enum):
    """Situation familiale"""
    MARRIED = "married"
    SINGLE = "single"
    DIVORCED = "divorced"
    WIDOWED = "widowed"
    COHABITING = "cohabiting"


class EducationLevel(str, enum.Enum):
    """Niveau d'éducation"""
    ILLITERATE = "illiterate"
    PRIMARY = "primary"
    SECONDARY = "secondary"
    UNIVERSITY = "university"


class HousingStatus(str, enum.Enum):
    """Statut de logement"""
    OWNER = "owner"
    TENANT = "tenant"
    OTHER = "other"


class Client(Base):
    """Modèle Client"""
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Numéro client PAMF
    client_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(SQLEnum(Gender), nullable=False)
    date_of_birth = Column(Date)
    
    # Pièce d'identité
    id_type = Column(String(50))  # CNIB, Passeport, etc.
    id_number = Column(String(100))
    
    # Contact
    phone_mobile = Column(String(20))
    phone_fixed = Column(String(20))
    email = Column(String(255))
    
    # Adresse
    address = Column(Text)
    city = Column(String(100))
    sector = Column(String(50))
    address_since = Column(Integer)  # Nombre d'années
    previous_address = Column(Text)
    previous_address_duration = Column(Integer)  # En années
    
    # Situation familiale
    marital_status = Column(SQLEnum(MaritalStatus))
    spouse_name = Column(String(200))
    spouse_first_name = Column(String(100))
    number_of_children = Column(Integer, default=0)
    other_dependents = Column(Integer, default=0)
    
    # Logement
    housing_status = Column(SQLEnum(HousingStatus))
    
    # Éducation et profession
    education_level = Column(SQLEnum(EducationLevel))
    profession = Column(String(200))
    
    # Informations PAMF
    membership_date = Column(Date)
    agency = Column(String(100))
    
    # Historique de crédit
    credit_history_positive = Column(String(20))  # Oui/Non/NA
    is_blacklisted = Column(String(20))  # Oui/Non
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    credit_applications = relationship("CreditApplication", back_populates="client", cascade="all, delete-orphan")
    references = relationship("ClientReference", back_populates="client", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="client", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Client {self.client_number} - {self.last_name} {self.first_name}>"


class ClientReference(Base):
    """Références du client"""
    __tablename__ = "client_references"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False)
    
    name = Column(String(200), nullable=False)
    profession = Column(String(200))
    phone = Column(String(20))
    address = Column(Text)
    relationship_type = Column(String(100))  # Mari, Nièce, etc.
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relation
    from sqlalchemy import ForeignKey
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    client = relationship("Client", back_populates="references")


class BankAccount(Base):
    """Comptes bancaires du client"""
    __tablename__ = "bank_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    institution_name = Column(String(200), nullable=False)
    account_type = Column(String(50))  # DAV, Épargne, etc.
    account_number = Column(String(100))
    current_balance = Column(Integer)  # En FCFA
    opening_year = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relation
    from sqlalchemy import ForeignKey
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    client = relationship("Client", back_populates="bank_accounts")
