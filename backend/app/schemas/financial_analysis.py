"""
Schémas pour FinancialAnalysis
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class FinancialAnalysisBase(BaseModel):
    """Base FinancialAnalysis"""
    # Budget familial
    family_food: int = 0
    family_rent: int = 0
    family_education: int = 0
    family_clothing: int = 0
    family_transport: int = 0
    family_water: int = 0
    family_electricity: int = 0
    family_phone: int = 0
    family_medical: int = 0
    family_other: int = 0
    other_income: int = 0
    
    # Période d'analyse
    analysis_period_months: int = Field(12, ge=1, le=36)
    
    # Ventes
    monthly_sales_activity_a: int = 0
    monthly_sales_activity_b: int = 0
    monthly_sales_activity_c: int = 0
    
    # Coût des marchandises
    monthly_cogs_activity_a: int = 0
    monthly_cogs_activity_b: int = 0
    monthly_cogs_activity_c: int = 0
    
    # Charges opérationnelles
    salaries: int = 0
    rent: int = 0
    utilities: int = 0
    transport_communication: int = 0
    maintenance: int = 0
    customs_fees: int = 0
    taxes: int = 0
    interest_paid: int = 0
    bank_charges: int = 0
    loan_repayments: int = 0
    depreciation: int = 0
    other_expenses: int = 0
    
    # Bilan
    total_assets: int = 0
    total_liabilities: int = 0
    
    # Commentaires
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    mitigation_factors: Optional[str] = None
    agent_comments: Optional[str] = None
    
    # Données détaillées
    monthly_data: Optional[Dict[str, Any]] = None
    balance_sheet_details: Optional[Dict[str, Any]] = None
    ratio_details: Optional[Dict[str, Any]] = None


class FinancialAnalysisCreate(FinancialAnalysisBase):
    """Création d'analyse financière"""
    credit_application_id: int


class FinancialAnalysisUpdate(BaseModel):
    """Mise à jour d'analyse financière"""
    family_food: Optional[int] = None
    family_rent: Optional[int] = None
    family_education: Optional[int] = None
    other_income: Optional[int] = None
    monthly_sales_activity_a: Optional[int] = None
    monthly_cogs_activity_a: Optional[int] = None
    salaries: Optional[int] = None
    total_assets: Optional[int] = None
    total_liabilities: Optional[int] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    mitigation_factors: Optional[str] = None
    agent_comments: Optional[str] = None


class FinancialAnalysisResponse(FinancialAnalysisBase):
    """Réponse FinancialAnalysis"""
    id: int
    credit_application_id: int
    family_total: int
    total_monthly_sales: int
    total_monthly_cogs: int
    gross_margin: int
    gross_margin_percentage: float
    total_operating_expenses: int
    net_profit: int
    monthly_cash_flow: int
    annual_cash_available: int
    debt_service_capacity: int
    liquidity_ratio: float
    debt_ratio: float
    profitability_ratio: float
    coverage_ratio: float
    net_worth: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
