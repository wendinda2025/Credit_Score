"""
Routes API pour l'application de gestion de crédit
"""
from fastapi import APIRouter
from app.api import clients, demandes, finances, decisions, cbs, dashboard

api_router = APIRouter()

api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(demandes.router, prefix="/demandes", tags=["Demandes de Prêt"])
api_router.include_router(finances.router, prefix="/finances", tags=["Données Financières"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["Décisions"])
api_router.include_router(cbs.router, prefix="/cbs", tags=["Intégration CBS"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Tableau de Bord"])
