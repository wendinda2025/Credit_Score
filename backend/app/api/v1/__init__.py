"""
API V1
"""
from fastapi import APIRouter

from app.api.v1 import auth, users, clients, credit_applications, financial_analysis, approvals

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentification"])
api_router.include_router(users.router, prefix="/users", tags=["Utilisateurs"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(
    credit_applications.router, 
    prefix="/credit-applications", 
    tags=["Demandes de Crédit"]
)
api_router.include_router(
    financial_analysis.router, 
    prefix="/financial-analysis", 
    tags=["Analyses Financières"]
)
api_router.include_router(approvals.router, prefix="/approvals", tags=["Approbations"])
