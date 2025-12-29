"""
Schémas pour Guarantee
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.guarantee import GuaranteeType, GuaranteeStatus


class GuaranteeBase(BaseModel):
    """Base Guarantee"""
    guarantee_type: GuaranteeType
    nature_description: str
    owner_name: Optional[str] = Field(None, max_length=200)
    owner_type: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    plot_number: Optional[str] = Field(None, max_length=100)
    area: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    declared_value: Optional[int] = Field(None, gt=0)
    market_value: Optional[int] = Field(None, gt=0)
    applicable_percentage: Optional[float] = Field(None, ge=0.0, le=1.0)


class GuaranteeCreate(GuaranteeBase):
    """Création de garantie"""
    credit_application_id: int


class GuaranteeUpdate(BaseModel):
    """Mise à jour de garantie"""
    nature_description: Optional[str] = None
    declared_value: Optional[int] = Field(None, gt=0)
    market_value: Optional[int] = Field(None, gt=0)
    applicable_percentage: Optional[float] = Field(None, ge=0.0, le=1.0)
    status: Optional[GuaranteeStatus] = None


class GuaranteeResponse(GuaranteeBase):
    """Réponse Guarantee"""
    id: int
    credit_application_id: int
    loan_value: Optional[int] = None
    status: GuaranteeStatus
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
