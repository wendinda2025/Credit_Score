"""
Modèle User - Utilisateurs du système
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """Rôles des utilisateurs"""
    ADMIN = "admin"
    AGENT_CREDIT = "agent_credit"
    RISK_OFFICER = "risk_officer"
    CHEF_AGENCE = "chef_agence"
    COMITE_CREDIT = "comite_credit"
    CONSULTANT = "consultant"


class User(Base):
    """Modèle User"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    
    # Rôle et permissions
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CONSULTANT)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Agence
    agency = Column(String(100))
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime)
    
    # Relations
    credit_applications = relationship("CreditApplication", back_populates="agent", foreign_keys="CreditApplication.agent_id")
    approvals = relationship("Approval", back_populates="reviewer")
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
