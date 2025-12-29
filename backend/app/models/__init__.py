"""
Modèles de base de données
"""
from app.models.user import User
from app.models.client import Client
from app.models.credit_application import CreditApplication
from app.models.financial_analysis import FinancialAnalysis
from app.models.guarantee import Guarantee
from app.models.approval import Approval
from app.models.document import Document

__all__ = [
    "User",
    "Client",
    "CreditApplication",
    "FinancialAnalysis",
    "Guarantee",
    "Approval",
    "Document"
]
