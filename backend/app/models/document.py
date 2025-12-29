"""
Modèle Document - Documents associés aux demandes
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DocumentType(str, enum.Enum):
    """Type de document"""
    ID_CARD = "id_card"
    PROOF_OF_ADDRESS = "proof_of_address"
    BUSINESS_LICENSE = "business_license"
    BANK_STATEMENT = "bank_statement"
    FINANCIAL_STATEMENT = "financial_statement"
    GUARANTEE_DOCUMENT = "guarantee_document"
    PROPERTY_TITLE = "property_title"
    CONTRACT = "contract"
    PHOTO = "photo"
    OTHER = "other"


class Document(Base):
    """Modèle Document"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    credit_application_id = Column(Integer, ForeignKey("credit_applications.id", ondelete="CASCADE"), nullable=False)
    
    # Informations du document
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)  # En octets
    mime_type = Column(String(100))
    
    # Description
    title = Column(String(200))
    description = Column(Text)
    
    # Métadonnées
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relation
    credit_application = relationship("CreditApplication", back_populates="documents")
    
    def __repr__(self):
        return f"<Document {self.file_name} - {self.document_type}>"
