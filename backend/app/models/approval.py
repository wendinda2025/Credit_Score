"""
Modèle Approval - Approbations et workflow
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Text, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ApprovalLevel(str, enum.Enum):
    """Niveau d'approbation"""
    AGENT_CREDIT = "agent_credit"
    RISK_OFFICER = "risk_officer"
    CHEF_AGENCE = "chef_agence"
    COMITE_CREDIT = "comite_credit"


class ApprovalDecision(str, enum.Enum):
    """Décision"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    POSTPONED = "postponed"


class Approval(Base):
    """Modèle Approval"""
    __tablename__ = "approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    credit_application_id = Column(Integer, ForeignKey("credit_applications.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Niveau d'approbation
    approval_level = Column(SQLEnum(ApprovalLevel), nullable=False)
    
    # Décision
    decision = Column(SQLEnum(ApprovalDecision), default=ApprovalDecision.PENDING, nullable=False)
    
    # Montants
    requested_amount = Column(BigInteger)
    recommended_amount = Column(BigInteger)
    
    # Évaluation
    is_complete = Column(Boolean)
    agree_with_recommendation = Column(Boolean)
    
    # Commentaires
    comments = Column(Text)
    clarifications_needed = Column(Text)
    disagreement_reasons = Column(Text)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime)
    
    # Relations
    credit_application = relationship("CreditApplication", back_populates="approvals")
    reviewer = relationship("User", back_populates="approvals")
    
    def __repr__(self):
        return f"<Approval {self.approval_level} - {self.decision}>"
