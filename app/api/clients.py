"""
Routes API pour la gestion des clients
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.client_service import ClientService
from app.services.calcul_service import CalculService
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse, ClientListResponse,
    PersonneReferenceCreate, CompteBancaireCreate
)

router = APIRouter()


@router.post("/", response_model=ClientResponse, status_code=201)
def create_client(client_data: ClientCreate, db: Session = Depends(get_db)):
    """
    Crée un nouveau client
    """
    service = ClientService(db)
    
    # Vérifier si le numéro client existe déjà
    if client_data.numero_client:
        existing = service.get_by_numero(client_data.numero_client)
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Le numéro client {client_data.numero_client} existe déjà"
            )
    
    client = service.create(client_data)
    return client


@router.get("/", response_model=ClientListResponse)
def list_clients(
    query: Optional[str] = Query(None, description="Recherche par nom, prénom, numéro"),
    agence: Optional[str] = Query(None, description="Filtrer par agence"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Liste les clients avec pagination et filtres
    """
    service = ClientService(db)
    clients, total = service.search(query=query, agence=agence, page=page, size=size)
    
    return ClientListResponse(
        items=clients,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size
    )


@router.get("/agences", response_model=List[str])
def list_agences(db: Session = Depends(get_db)):
    """
    Liste toutes les agences
    """
    service = ClientService(db)
    return service.get_all_agences()


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    """
    Récupère un client par son ID
    """
    service = ClientService(db)
    client = service.get_by_id(client_id)
    
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    return client


@router.get("/numero/{numero_client}", response_model=ClientResponse)
def get_client_by_numero(numero_client: str, db: Session = Depends(get_db)):
    """
    Récupère un client par son numéro
    """
    service = ClientService(db)
    client = service.get_by_numero(numero_client)
    
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    return client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, client_data: ClientUpdate, db: Session = Depends(get_db)):
    """
    Met à jour un client
    """
    service = ClientService(db)
    client = service.update(client_id, client_data)
    
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    return client


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    """
    Supprime un client
    """
    service = ClientService(db)
    
    if not service.delete(client_id):
        raise HTTPException(status_code=404, detail="Client non trouvé")


@router.post("/{client_id}/personnes-reference")
def add_personne_reference(
    client_id: int,
    data: PersonneReferenceCreate,
    db: Session = Depends(get_db)
):
    """
    Ajoute une personne de référence à un client
    """
    service = ClientService(db)
    result = service.add_personne_reference(client_id, data.model_dump())
    
    if not result:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    return result


@router.post("/{client_id}/comptes-bancaires")
def add_compte_bancaire(
    client_id: int,
    data: CompteBancaireCreate,
    db: Session = Depends(get_db)
):
    """
    Ajoute un compte bancaire à un client
    """
    service = ClientService(db)
    result = service.add_compte_bancaire(client_id, data.model_dump())
    
    if not result:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    return result


@router.get("/{client_id}/score-credit")
def get_score_credit(client_id: int, db: Session = Depends(get_db)):
    """
    Calcule le score de crédit d'un client
    """
    service = CalculService(db)
    score = service.calculer_score_credit(client_id)
    
    if score["score"] == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    return score
