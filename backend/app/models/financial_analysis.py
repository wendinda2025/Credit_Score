"""
Modèle FinancialAnalysis - Analyses financières
"""
from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, DateTime, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class FinancialAnalysis(Base):
    """Modèle FinancialAnalysis"""
    __tablename__ = "financial_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    credit_application_id = Column(Integer, ForeignKey("credit_applications.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Budget familial (mensuel en FCFA)
    family_food = Column(BigInteger, default=0)
    family_rent = Column(BigInteger, default=0)
    family_education = Column(BigInteger, default=0)
    family_clothing = Column(BigInteger, default=0)
    family_transport = Column(BigInteger, default=0)
    family_water = Column(BigInteger, default=0)
    family_electricity = Column(BigInteger, default=0)
    family_phone = Column(BigInteger, default=0)
    family_medical = Column(BigInteger, default=0)
    family_other = Column(BigInteger, default=0)
    family_total = Column(BigInteger, default=0)
    
    # Autres revenus mensuels
    other_income = Column(BigInteger, default=0)
    
    # Période d'analyse (en mois)
    analysis_period_months = Column(Integer, default=12)
    
    # Ventes (moyennes mensuelles)
    monthly_sales_activity_a = Column(BigInteger, default=0)
    monthly_sales_activity_b = Column(BigInteger, default=0)
    monthly_sales_activity_c = Column(BigInteger, default=0)
    total_monthly_sales = Column(BigInteger, default=0)
    
    # Coût des marchandises vendues (mensuel)
    monthly_cogs_activity_a = Column(BigInteger, default=0)
    monthly_cogs_activity_b = Column(BigInteger, default=0)
    monthly_cogs_activity_c = Column(BigInteger, default=0)
    total_monthly_cogs = Column(BigInteger, default=0)
    
    # Marge brute
    gross_margin = Column(BigInteger, default=0)
    gross_margin_percentage = Column(Float, default=0.0)
    
    # Charges opérationnelles (mensuelles)
    salaries = Column(BigInteger, default=0)
    rent = Column(BigInteger, default=0)
    utilities = Column(BigInteger, default=0)
    transport_communication = Column(BigInteger, default=0)
    maintenance = Column(BigInteger, default=0)
    customs_fees = Column(BigInteger, default=0)
    taxes = Column(BigInteger, default=0)
    interest_paid = Column(BigInteger, default=0)
    bank_charges = Column(BigInteger, default=0)
    loan_repayments = Column(BigInteger, default=0)
    depreciation = Column(BigInteger, default=0)
    other_expenses = Column(BigInteger, default=0)
    total_operating_expenses = Column(BigInteger, default=0)
    
    # Résultat net
    net_profit = Column(BigInteger, default=0)
    
    # Cash flow et capacité de remboursement
    monthly_cash_flow = Column(BigInteger, default=0)
    annual_cash_available = Column(BigInteger, default=0)  # CAF
    debt_service_capacity = Column(BigInteger, default=0)
    
    # Ratios financiers
    liquidity_ratio = Column(Float, default=0.0)
    debt_ratio = Column(Float, default=0.0)
    profitability_ratio = Column(Float, default=0.0)
    coverage_ratio = Column(Float, default=0.0)
    
    # Bilan (actifs et passifs)
    total_assets = Column(BigInteger, default=0)
    total_liabilities = Column(BigInteger, default=0)
    net_worth = Column(BigInteger, default=0)
    
    # Données détaillées (JSON pour flexibilité)
    monthly_data = Column(JSON)  # Données mensuelles détaillées
    balance_sheet_details = Column(JSON)  # Détails du bilan
    ratio_details = Column(JSON)  # Détails des ratios
    
    # Commentaires
    strengths = Column(Text)
    weaknesses = Column(Text)
    mitigation_factors = Column(Text)
    agent_comments = Column(Text)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relation
    credit_application = relationship("CreditApplication", back_populates="financial_analysis")
    
    def __repr__(self):
        return f"<FinancialAnalysis for Application {self.credit_application_id}>"
