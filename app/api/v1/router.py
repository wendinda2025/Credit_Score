from fastapi import APIRouter
from app.api.v1.endpoints import credit

api_router = APIRouter()
api_router.include_router(credit.router, prefix="/credit", tags=["credit"])
