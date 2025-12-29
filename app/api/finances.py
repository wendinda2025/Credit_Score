"""
Routes API pour les données financières
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.demande_service import DemandeService
from app.schemas.finances import (
    DepensesFamilialesCreate, DepensesFamilialesResponse,
    BilanCreate, BilanResponse,
    CashFlowCreate, CashFlowResponse,
    CompteExploitationCreate, CompteExploitationResponse,
    ResultatNetCreate, ResultatNetResponse,
    AnalyseRatiosCreate, AnalyseRatiosResponse
)

router = APIRouter()


# Dépenses familiales
@router.post("/depenses-familiales", response_model=DepensesFamilialesResponse)
def save_depenses_familiales(data: DepensesFamilialesCreate, db: Session = Depends(get_db)):
    """
    Enregistre les dépenses familiales pour une demande
    """
    service = DemandeService(db)
    demande_id = data.demande_id
    depenses_data = data.model_dump(exclude={"demande_id"})
    
    result = service.save_depenses_familiales(demande_id, depenses_data)
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # Calculer le total pour la réponse
    response_data = {
        **depenses_data,
        "id": result.id,
        "demande_id": demande_id,
        "total_depenses": result.total_depenses,
        "created_at": result.created_at,
        "updated_at": result.updated_at
    }
    
    return response_data


@router.get("/depenses-familiales/{demande_id}", response_model=DepensesFamilialesResponse)
def get_depenses_familiales(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère les dépenses familiales d'une demande
    """
    from app.models.finances import DepensesFamiliales
    
    result = db.query(DepensesFamiliales).filter(
        DepensesFamiliales.demande_id == demande_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Dépenses familiales non trouvées")
    
    return result


# Bilan
@router.post("/bilan", response_model=BilanResponse)
def save_bilan(data: BilanCreate, db: Session = Depends(get_db)):
    """
    Enregistre le bilan pour une demande
    """
    service = DemandeService(db)
    demande_id = data.demande_id
    bilan_data = data.model_dump(exclude={"demande_id"})
    
    result = service.save_bilan(demande_id, bilan_data)
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return result


@router.get("/bilan/{demande_id}", response_model=BilanResponse)
def get_bilan(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère le bilan d'une demande
    """
    from app.models.finances import Bilan
    
    result = db.query(Bilan).filter(Bilan.demande_id == demande_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Bilan non trouvé")
    
    return result


# Cash Flow
@router.post("/cash-flow")
def save_cash_flow(data: CashFlowCreate, db: Session = Depends(get_db)):
    """
    Enregistre le cash flow pour une demande
    """
    from app.models.finances import CashFlow
    
    demande_id = data.demande_id
    
    service = DemandeService(db)
    demande = service.get_by_id(demande_id)
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    existing = db.query(CashFlow).filter(CashFlow.demande_id == demande_id).first()
    
    cash_flow_data = data.model_dump(exclude={"demande_id"})
    
    if existing:
        for key, value in cash_flow_data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        cash_flow = CashFlow(demande_id=demande_id, **cash_flow_data)
        db.add(cash_flow)
        db.commit()
        db.refresh(cash_flow)
        return cash_flow


# Compte d'exploitation
@router.post("/compte-exploitation")
def save_compte_exploitation(data: CompteExploitationCreate, db: Session = Depends(get_db)):
    """
    Enregistre le compte d'exploitation pour une demande
    """
    from app.models.finances import CompteExploitation
    
    demande_id = data.demande_id
    
    service = DemandeService(db)
    demande = service.get_by_id(demande_id)
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    existing = db.query(CompteExploitation).filter(
        CompteExploitation.demande_id == demande_id
    ).first()
    
    ce_data = data.model_dump(exclude={"demande_id"})
    
    if existing:
        for key, value in ce_data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        compte_exp = CompteExploitation(demande_id=demande_id, **ce_data)
        db.add(compte_exp)
        db.commit()
        db.refresh(compte_exp)
        return compte_exp


# Résultat Net
@router.post("/resultat-net")
def save_resultat_net(data: ResultatNetCreate, db: Session = Depends(get_db)):
    """
    Enregistre le résultat net pour une demande
    """
    from app.models.finances import ResultatNet
    
    demande_id = data.demande_id
    
    service = DemandeService(db)
    demande = service.get_by_id(demande_id)
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    existing = db.query(ResultatNet).filter(
        ResultatNet.demande_id == demande_id
    ).first()
    
    rn_data = data.model_dump(exclude={"demande_id"})
    
    if existing:
        for key, value in rn_data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        resultat = ResultatNet(demande_id=demande_id, **rn_data)
        db.add(resultat)
        db.commit()
        db.refresh(resultat)
        return resultat


# Analyse des ratios
@router.post("/analyse-ratios", response_model=AnalyseRatiosResponse)
def save_analyse_ratios(data: AnalyseRatiosCreate, db: Session = Depends(get_db)):
    """
    Enregistre l'analyse des ratios pour une demande
    """
    service = DemandeService(db)
    demande_id = data.demande_id
    analyse_data = data.model_dump(exclude={"demande_id"})
    
    result = service.save_analyse_ratios(demande_id, analyse_data)
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return result


@router.get("/analyse-ratios/{demande_id}", response_model=AnalyseRatiosResponse)
def get_analyse_ratios(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère l'analyse des ratios d'une demande
    """
    from app.models.finances import AnalyseRatios
    
    result = db.query(AnalyseRatios).filter(
        AnalyseRatios.demande_id == demande_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    
    return result
