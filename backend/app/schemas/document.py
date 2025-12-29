"""
Schémas pour Document
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.document import DocumentType


class DocumentBase(BaseModel):
    """Base Document"""
    document_type: DocumentType
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None


class DocumentCreate(DocumentBase):
    """Création de document"""
    credit_application_id: int
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=500)
    file_size: Optional[int] = None
    mime_type: Optional[str] = Field(None, max_length=100)
    uploaded_by: Optional[int] = None


class DocumentResponse(DocumentBase):
    """Réponse Document"""
    id: int
    credit_application_id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
