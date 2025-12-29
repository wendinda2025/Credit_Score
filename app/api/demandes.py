"""
Routes API pour la gestion des demandes de prêt
"""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.demande_service import DemandeService
from app.services.calcul_service import CalculService
from app.models.demande import StatutDemandeEnum
from app.schemas.demande import (
    DemandeCreate, DemandeUpdate, DemandeResponse, DemandeListResponse,
    GarantieCreate, CoutProjetCreate, ProvenanceFondsCreate, DemandeStatistiques
)
from app.schemas.visite import VisiteValidationCreate, VisiteValidationResponse

router = APIRouter()


@router.post("/", response_model=DemandeResponse, status_code=201)
def create_demande(demande_data: DemandeCreate, db: Session = Depends(get_db)):
    """
    Crée une nouvelle demande de prêt
    """
    service = DemandeService(db)
    demande = service.create(demande_data)
    return demande


@router.get("/", response_model=DemandeListResponse)
def list_demandes(
    query: Optional[str] = Query(None, description="Recherche par numéro ou objet"),
    statut: Optional[StatutDemandeEnum] = Query(None, description="Filtrer par statut"),
    client_id: Optional[int] = Query(None, description="Filtrer par client"),
    date_debut: Optional[date] = Query(None, description="Date de début"),
    date_fin: Optional[date] = Query(None, description="Date de fin"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Liste les demandes avec pagination et filtres
    """
    service = DemandeService(db)
    demandes, total = service.search(
        query=query,
        statut=statut,
        client_id=client_id,
        date_debut=date_debut,
        date_fin=date_fin,
        page=page,
        size=size
    )
    
    return DemandeListResponse(
        items=demandes,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size
    )


@router.get("/statistiques", response_model=DemandeStatistiques)
def get_statistiques(db: Session = Depends(get_db)):
    """
    Récupère les statistiques des demandes
    """
    service = DemandeService(db)
    return service.get_statistiques()


@router.get("/{demande_id}", response_model=DemandeResponse)
def get_demande(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère une demande par son ID
    """
    service = DemandeService(db)
    demande = service.get_by_id(demande_id)
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return demande


@router.get("/numero/{numero_demande}", response_model=DemandeResponse)
def get_demande_by_numero(numero_demande: str, db: Session = Depends(get_db)):
    """
    Récupère une demande par son numéro
    """
    service = DemandeService(db)
    demande = service.get_by_numero(numero_demande)
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return demande


@router.put("/{demande_id}", response_model=DemandeResponse)
def update_demande(demande_id: int, demande_data: DemandeUpdate, db: Session = Depends(get_db)):
    """
    Met à jour une demande
    """
    service = DemandeService(db)
    demande = service.update(demande_id, demande_data)
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return demande


@router.patch("/{demande_id}/statut")
def update_statut(
    demande_id: int,
    statut: StatutDemandeEnum,
    db: Session = Depends(get_db)
):
    """
    Met à jour le statut d'une demande
    """
    service = DemandeService(db)
    demande = service.update_statut(demande_id, statut)
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return {"message": f"Statut mis à jour: {statut.value}", "demande_id": demande_id}


@router.delete("/{demande_id}", status_code=204)
def delete_demande(demande_id: int, db: Session = Depends(get_db)):
    """
    Supprime une demande
    """
    service = DemandeService(db)
    
    if not service.delete(demande_id):
        raise HTTPException(status_code=404, detail="Demande non trouvée")


# Garanties
@router.post("/{demande_id}/garanties")
def add_garantie(demande_id: int, data: GarantieCreate, db: Session = Depends(get_db)):
    """
    Ajoute une garantie à une demande
    """
    service = DemandeService(db)
    result = service.add_garantie(demande_id, data.model_dump())
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return result


# Coûts du projet
@router.post("/{demande_id}/couts-projet")
def add_cout_projet(demande_id: int, data: CoutProjetCreate, db: Session = Depends(get_db)):
    """
    Ajoute un coût au projet
    """
    service = DemandeService(db)
    result = service.add_cout_projet(demande_id, data.model_dump())
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return result


# Visite de validation
@router.post("/{demande_id}/visite", response_model=VisiteValidationResponse)
def create_visite(
    demande_id: int,
    data: VisiteValidationCreate,
    db: Session = Depends(get_db)
):
    """
    Crée une visite de validation pour une demande
    """
    service = DemandeService(db)
    
    visite_data = data.model_dump()
    visite_data.pop("demande_id", None)  # Utiliser l'ID de l'URL
    
    # Convertir les sous-objets
    visite_data["actifs"] = [a.model_dump() if hasattr(a, 'model_dump') else a for a in visite_data.get("actifs", [])]
    visite_data["stocks"] = [s.model_dump() if hasattr(s, 'model_dump') else s for s in visite_data.get("stocks", [])]
    visite_data["liquidites"] = [l.model_dump() if hasattr(l, 'model_dump') else l for l in visite_data.get("liquidites", [])]
    visite_data["dettes"] = [d.model_dump() if hasattr(d, 'model_dump') else d for d in visite_data.get("dettes", [])]
    
    result = service.create_visite(demande_id, visite_data)
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return result


# Calculs financiers
@router.get("/{demande_id}/ratios")
def get_ratios(demande_id: int, db: Session = Depends(get_db)):
    """
    Calcule les ratios financiers pour une demande
    """
    calcul_service = CalculService(db)
    demande_service = DemandeService(db)
    
    demande = demande_service.get_by_id(demande_id)
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    ratios = calcul_service.calculer_ratios(demande_id)
    return ratios


@router.get("/{demande_id}/echeancier")
def get_echeancier(demande_id: int, db: Session = Depends(get_db)):
    """
    Génère l'échéancier de remboursement
    """
    calcul_service = CalculService(db)
    demande_service = DemandeService(db)
    
    demande = demande_service.get_by_id(demande_id)
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # Utiliser le montant autorisé s'il existe, sinon le montant sollicité
    montant = demande.montant_autorise or demande.montant_sollicite
    
    echeancier = calcul_service.calculer_echeancier(
        montant=montant,
        taux_annuel=demande.taux_interet,
        duree_mois=demande.duree_mois,
        periodicite=demande.periodicite.value if demande.periodicite else "Mensuel"
    )
    
    return {
        "demande_id": demande_id,
        "montant": montant,
        "taux": demande.taux_interet,
        "duree_mois": demande.duree_mois,
        "periodicite": demande.periodicite.value if demande.periodicite else "Mensuel",
        "echeancier": echeancier
    }
