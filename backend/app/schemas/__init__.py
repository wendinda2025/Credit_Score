"""
Schémas Pydantic pour la validation des données
"""
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserLogin, Token
)
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse,
    ClientReferenceCreate, BankAccountCreate
)
from app.schemas.credit_application import (
    CreditApplicationCreate, CreditApplicationUpdate, CreditApplicationResponse,
    ProjectItemCreate
)
from app.schemas.guarantee import (
    GuaranteeCreate, GuaranteeUpdate, GuaranteeResponse
)
from app.schemas.financial_analysis import (
    FinancialAnalysisCreate, FinancialAnalysisUpdate, FinancialAnalysisResponse
)
from app.schemas.approval import (
    ApprovalCreate, ApprovalUpdate, ApprovalResponse
)
from app.schemas.document import (
    DocumentCreate, DocumentResponse
)

__all__ = [
    "UserCreate", "UserUpdate", "UserResponse", "UserLogin", "Token",
    "ClientCreate", "ClientUpdate", "ClientResponse",
    "ClientReferenceCreate", "BankAccountCreate",
    "CreditApplicationCreate", "CreditApplicationUpdate", "CreditApplicationResponse",
    "ProjectItemCreate",
    "GuaranteeCreate", "GuaranteeUpdate", "GuaranteeResponse",
    "FinancialAnalysisCreate", "FinancialAnalysisUpdate", "FinancialAnalysisResponse",
    "ApprovalCreate", "ApprovalUpdate", "ApprovalResponse",
    "DocumentCreate", "DocumentResponse"
]
