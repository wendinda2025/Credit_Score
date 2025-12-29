"""
Schémas pour CreditApplication
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.credit_application import (
    ApplicationStatus, PaymentFrequency, ActivitySector, 
    BusinessType, BusinessLocation
)


class ProjectItemCreate(BaseModel):
    """Création d'élément de projet"""
    description: str = Field(..., max_length=200)
    amount: int = Field(..., gt=0)
    item_type: str = Field(..., max_length=50)  # "cost" ou "funding"


class ProjectItemResponse(ProjectItemCreate):
    """Réponse élément de projet"""
    id: int
    credit_application_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CreditApplicationBase(BaseModel):
    """Base CreditApplication"""
    requested_amount: int = Field(..., gt=0, description="Montant en FCFA")
    duration_months: int = Field(..., gt=0, le=120)
    payment_frequency: PaymentFrequency
    credit_purpose: str = Field(..., min_length=10)
    business_name: Optional[str] = Field(None, max_length=200)
    activity_sector: Optional[ActivitySector] = None
    business_type: Optional[BusinessType] = None
    business_location_type: Optional[BusinessLocation] = None
    business_address: Optional[str] = None
    business_neighborhood: Optional[str] = Field(None, max_length=200)
    business_since_year: Optional[int] = None
    years_at_location: Optional[int] = None
    project_total_cost: Optional[int] = None
    personal_contribution: Optional[int] = None


class CreditApplicationCreate(CreditApplicationBase):
    """Création de demande de crédit"""
    client_id: int
    application_date: date = Field(default_factory=date.today)
    project_items: Optional[List[ProjectItemCreate]] = []


class CreditApplicationUpdate(BaseModel):
    """Mise à jour de demande de crédit"""
    requested_amount: Optional[int] = Field(None, gt=0)
    duration_months: Optional[int] = Field(None, gt=0, le=120)
    payment_frequency: Optional[PaymentFrequency] = None
    credit_purpose: Optional[str] = Field(None, min_length=10)
    status: Optional[ApplicationStatus] = None
    agent_recommended_amount: Optional[int] = None
    risk_officer_recommended_amount: Optional[int] = None
    chef_agence_recommended_amount: Optional[int] = None
    approved_amount: Optional[int] = None
    approved_duration_months: Optional[int] = None


class CreditApplicationResponse(CreditApplicationBase):
    """Réponse CreditApplication"""
    id: int
    application_number: str
    client_id: int
    agent_id: int
    application_date: date
    status: ApplicationStatus
    agent_recommended_amount: Optional[int] = None
    risk_officer_recommended_amount: Optional[int] = None
    chef_agence_recommended_amount: Optional[int] = None
    approved_amount: Optional[int] = None
    approved_duration_months: Optional[int] = None
    financing_percentage: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    disbursed_at: Optional[datetime] = None
    project_items: List[ProjectItemResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
