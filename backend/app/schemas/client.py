"""
Schémas pour Client
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.client import Gender, MaritalStatus, EducationLevel, HousingStatus


class ClientReferenceCreate(BaseModel):
    """Création de référence client"""
    name: str = Field(..., max_length=200)
    profession: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    relationship_type: Optional[str] = Field(None, max_length=100)


class ClientReferenceResponse(ClientReferenceCreate):
    """Réponse référence client"""
    id: int
    client_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class BankAccountCreate(BaseModel):
    """Création de compte bancaire"""
    institution_name: str = Field(..., max_length=200)
    account_type: Optional[str] = Field(None, max_length=50)
    account_number: Optional[str] = Field(None, max_length=100)
    current_balance: Optional[int] = None
    opening_year: Optional[int] = None


class BankAccountResponse(BankAccountCreate):
    """Réponse compte bancaire"""
    id: int
    client_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ClientBase(BaseModel):
    """Base Client"""
    client_number: str = Field(..., max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    gender: Gender
    date_of_birth: Optional[date] = None
    id_type: Optional[str] = Field(None, max_length=50)
    id_number: Optional[str] = Field(None, max_length=100)
    phone_mobile: Optional[str] = Field(None, max_length=20)
    phone_fixed: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=50)
    address_since: Optional[int] = None
    previous_address: Optional[str] = None
    previous_address_duration: Optional[int] = None
    marital_status: Optional[MaritalStatus] = None
    spouse_name: Optional[str] = Field(None, max_length=200)
    spouse_first_name: Optional[str] = Field(None, max_length=100)
    number_of_children: int = 0
    other_dependents: int = 0
    housing_status: Optional[HousingStatus] = None
    education_level: Optional[EducationLevel] = None
    profession: Optional[str] = Field(None, max_length=200)
    membership_date: Optional[date] = None
    agency: Optional[str] = Field(None, max_length=100)
    credit_history_positive: Optional[str] = Field(None, max_length=20)
    is_blacklisted: Optional[str] = Field(None, max_length=20)


class ClientCreate(ClientBase):
    """Création de client"""
    references: Optional[List[ClientReferenceCreate]] = []
    bank_accounts: Optional[List[BankAccountCreate]] = []


class ClientUpdate(BaseModel):
    """Mise à jour de client"""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    id_type: Optional[str] = Field(None, max_length=50)
    id_number: Optional[str] = Field(None, max_length=100)
    phone_mobile: Optional[str] = Field(None, max_length=20)
    phone_fixed: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=50)
    marital_status: Optional[MaritalStatus] = None
    profession: Optional[str] = Field(None, max_length=200)


class ClientResponse(ClientBase):
    """Réponse Client"""
    id: int
    created_at: datetime
    updated_at: datetime
    references: List[ClientReferenceResponse] = []
    bank_accounts: List[BankAccountResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
