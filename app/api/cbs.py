"""
Routes API pour l'intégration avec le Core Banking System (CBS)
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.cbs_service import CBSService
from app.services.client_service import ClientService

router = APIRouter()


class SyncRequest(BaseModel):
    """Requête de synchronisation"""
    numero_compte_cbs: str


class CBSClientResponse(BaseModel):
    """Réponse avec données CBS"""
    numero_compte: str
    nom: str
    prenom: str
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    solde: Optional[float] = None
    statut: Optional[str] = None


@router.get("/client/{numero_compte}", response_model=CBSClientResponse)
async def get_client_cbs(numero_compte: str, db: Session = Depends(get_db)):
    """
    Récupère les informations d'un client depuis le CBS
    
    Note: En mode développement, retourne des données simulées.
    En production, se connecte au CBS Oracle.
    """
    cbs_service = CBSService(db)
    data = await cbs_service.get_client_from_cbs(numero_compte)
    
    if not data:
        raise HTTPException(status_code=404, detail="Client non trouvé dans le CBS")
    
    return CBSClientResponse(**data)


@router.post("/sync-client")
async def sync_client_from_cbs(request: SyncRequest, db: Session = Depends(get_db)):
    """
    Synchronise un client depuis le CBS vers l'application locale
    
    Si le client existe déjà (par numéro CBS), il est mis à jour.
    Sinon, un nouveau client est créé.
    """
    cbs_service = CBSService(db)
    client = await cbs_service.sync_client_from_cbs(request.numero_compte_cbs)
    
    if not client:
        raise HTTPException(
            status_code=404,
            detail="Impossible de synchroniser le client depuis le CBS"
        )
    
    return {
        "message": "Client synchronisé avec succès",
        "client_id": client.id,
        "numero_client": client.numero_client,
        "numero_cbs": client.numero_credit_cmb
    }


@router.get("/solde/{numero_compte}")
async def get_solde_compte(numero_compte: str, db: Session = Depends(get_db)):
    """
    Récupère le solde d'un compte depuis le CBS
    """
    cbs_service = CBSService(db)
    solde = await cbs_service.get_compte_solde(numero_compte)
    
    if solde is None:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    
    return {"numero_compte": numero_compte, "solde": solde}


@router.get("/historique-credits/{numero_client}")
async def get_historique_credits(numero_client: str, db: Session = Depends(get_db)):
    """
    Récupère l'historique des crédits d'un client depuis le CBS
    """
    cbs_service = CBSService(db)
    historique = await cbs_service.get_historique_credits(numero_client)
    
    return {
        "numero_client": numero_client,
        "credits": historique,
        "total": len(historique)
    }


@router.get("/check-radies/{numero_piece}")
async def check_liste_radies(numero_piece: str, db: Session = Depends(get_db)):
    """
    Vérifie si une personne est sur la liste des radiés
    """
    cbs_service = CBSService(db)
    is_radie = await cbs_service.verifier_liste_radies(numero_piece)
    
    return {
        "numero_piece": numero_piece,
        "is_radie": is_radie,
        "message": "Sur liste des radiés" if is_radie else "Non radié"
    }


@router.post("/push/{client_id}")
async def push_to_cbs(
    client_id: int,
    data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Envoie des données vers le CBS (asynchrone)
    
    Utile pour mettre à jour le CBS après une décision de crédit.
    """
    client_service = ClientService(db)
    client = client_service.get_by_id(client_id)
    
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    if not client.numero_credit_cmb:
        raise HTTPException(
            status_code=400,
            detail="Client non lié au CBS (pas de numéro CBS)"
        )
    
    # Ajouter la tâche en arrière-plan
    cbs_service = CBSService(db)
    
    async def do_push():
        await cbs_service.push_to_cbs(client_id, data)
    
    background_tasks.add_task(do_push)
    
    return {
        "message": "Synchronisation CBS programmée",
        "client_id": client_id,
        "numero_cbs": client.numero_credit_cmb
    }


# Configuration CBS
@router.get("/config")
def get_cbs_config():
    """
    Retourne la configuration CBS actuelle (sans données sensibles)
    """
    return {
        "mode": "simulation",  # ou "production"
        "type_connexion": "API REST",  # ou "Oracle Direct"
        "status": "configured",
        "features": [
            "sync_client",
            "get_solde",
            "historique_credits",
            "check_radies",
            "push_updates"
        ],
        "note": "En mode simulation, les données sont générées localement. "
                "Pour la production, configurer CBS_BASE_URL et CBS_API_KEY "
                "ou utiliser la connexion Oracle directe."
    }
