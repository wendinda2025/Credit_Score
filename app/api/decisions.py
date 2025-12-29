"""
Routes API pour les décisions (Recommandation AC, Avis, Comité)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.demande_service import DemandeService
from app.schemas.decision import (
    RecommandationACCreate, RecommandationACResponse,
    AvisRiskOfficerCreate, AvisRiskOfficerResponse,
    AvisChefAgenceCreate, AvisChefAgenceResponse,
    DecisionComiteCreate, DecisionComiteResponse
)

router = APIRouter()


# Recommandation Agent de Crédit
@router.post("/recommandation-ac", response_model=RecommandationACResponse)
def save_recommandation_ac(data: RecommandationACCreate, db: Session = Depends(get_db)):
    """
    Enregistre la recommandation de l'agent de crédit
    """
    service = DemandeService(db)
    demande_id = data.demande_id
    reco_data = data.model_dump(exclude={"demande_id"})
    
    result = service.save_recommandation_ac(demande_id, reco_data)
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return result


@router.get("/recommandation-ac/{demande_id}", response_model=RecommandationACResponse)
def get_recommandation_ac(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère la recommandation AC d'une demande
    """
    from app.models.decision import RecommandationAC
    
    result = db.query(RecommandationAC).filter(
        RecommandationAC.demande_id == demande_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Recommandation non trouvée")
    
    return result


# Avis Risk Officer
@router.post("/avis-risk-officer", response_model=AvisRiskOfficerResponse)
def save_avis_risk_officer(data: AvisRiskOfficerCreate, db: Session = Depends(get_db)):
    """
    Enregistre l'avis du Risk Officer
    """
    from app.models.decision import AvisRiskOfficer
    
    demande_id = data.demande_id
    
    service = DemandeService(db)
    demande = service.get_by_id(demande_id)
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    existing = db.query(AvisRiskOfficer).filter(
        AvisRiskOfficer.demande_id == demande_id
    ).first()
    
    avis_data = data.model_dump(exclude={"demande_id"})
    
    if existing:
        for key, value in avis_data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        avis = AvisRiskOfficer(demande_id=demande_id, **avis_data)
        db.add(avis)
        
        # Mettre à jour le montant recommandé sur la demande
        if avis_data.get("montant_recommande"):
            demande.montant_recommande_ro = avis_data["montant_recommande"]
        
        db.commit()
        db.refresh(avis)
        return avis


@router.get("/avis-risk-officer/{demande_id}", response_model=AvisRiskOfficerResponse)
def get_avis_risk_officer(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère l'avis du Risk Officer d'une demande
    """
    from app.models.decision import AvisRiskOfficer
    
    result = db.query(AvisRiskOfficer).filter(
        AvisRiskOfficer.demande_id == demande_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    return result


# Avis Chef d'Agence
@router.post("/avis-chef-agence", response_model=AvisChefAgenceResponse)
def save_avis_chef_agence(data: AvisChefAgenceCreate, db: Session = Depends(get_db)):
    """
    Enregistre l'avis du Chef d'Agence
    """
    from app.models.decision import AvisChefAgence
    
    demande_id = data.demande_id
    
    service = DemandeService(db)
    demande = service.get_by_id(demande_id)
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    existing = db.query(AvisChefAgence).filter(
        AvisChefAgence.demande_id == demande_id
    ).first()
    
    avis_data = data.model_dump(exclude={"demande_id"})
    
    if existing:
        for key, value in avis_data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        avis = AvisChefAgence(demande_id=demande_id, **avis_data)
        db.add(avis)
        
        # Mettre à jour le montant recommandé sur la demande
        if avis_data.get("montant_recommande"):
            demande.montant_recommande_ca = avis_data["montant_recommande"]
        
        db.commit()
        db.refresh(avis)
        return avis


@router.get("/avis-chef-agence/{demande_id}", response_model=AvisChefAgenceResponse)
def get_avis_chef_agence(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère l'avis du Chef d'Agence d'une demande
    """
    from app.models.decision import AvisChefAgence
    
    result = db.query(AvisChefAgence).filter(
        AvisChefAgence.demande_id == demande_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    return result


# Décision Comité
@router.post("/decision-comite", response_model=DecisionComiteResponse)
def save_decision_comite(data: DecisionComiteCreate, db: Session = Depends(get_db)):
    """
    Enregistre la décision du comité de crédit
    """
    service = DemandeService(db)
    demande_id = data.demande_id
    
    # Extraire les membres si présents
    membres = data.membres if hasattr(data, 'membres') else []
    decision_data = data.model_dump(exclude={"demande_id", "membres"})
    
    # Convertir les membres en texte
    if membres:
        membres_text = "\n".join([
            f"{m.nom}|{m.prenom}|{m.fonction or ''}|{m.titre_comite or ''}"
            for m in membres
        ])
        decision_data["membres_comite"] = membres_text
    
    result = service.save_decision_comite(demande_id, decision_data)
    
    if not result:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return result


@router.get("/decision-comite/{demande_id}", response_model=DecisionComiteResponse)
def get_decision_comite(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère la décision du comité d'une demande
    """
    from app.models.decision import DecisionComite
    
    result = db.query(DecisionComite).filter(
        DecisionComite.demande_id == demande_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Décision non trouvée")
    
    return result


# Récapitulatif complet d'une demande
@router.get("/recapitulatif/{demande_id}")
def get_recapitulatif_demande(demande_id: int, db: Session = Depends(get_db)):
    """
    Récupère le récapitulatif complet d'une demande avec toutes les décisions
    """
    from app.models.decision import RecommandationAC, AvisRiskOfficer, AvisChefAgence, DecisionComite
    from app.models.finances import AnalyseRatios
    from app.services.calcul_service import CalculService
    
    service = DemandeService(db)
    demande = service.get_by_id(demande_id)
    
    if not demande:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # Récupérer toutes les informations
    reco_ac = db.query(RecommandationAC).filter(RecommandationAC.demande_id == demande_id).first()
    avis_ro = db.query(AvisRiskOfficer).filter(AvisRiskOfficer.demande_id == demande_id).first()
    avis_ca = db.query(AvisChefAgence).filter(AvisChefAgence.demande_id == demande_id).first()
    decision = db.query(DecisionComite).filter(DecisionComite.demande_id == demande_id).first()
    analyse = db.query(AnalyseRatios).filter(AnalyseRatios.demande_id == demande_id).first()
    
    # Calculer les ratios
    calcul_service = CalculService(db)
    ratios = calcul_service.calculer_ratios(demande_id)
    
    return {
        "demande": {
            "id": demande.id,
            "numero": demande.numero_demande,
            "date": demande.date_demande,
            "statut": demande.statut.value if demande.statut else None,
            "montant_sollicite": demande.montant_sollicite,
            "duree_mois": demande.duree_mois,
            "objet": demande.objet_credit,
            "client_id": demande.client_id
        },
        "recommandation_ac": {
            "montant_recommande": reco_ac.montant_recommande if reco_ac else None,
            "forces": reco_ac.forces if reco_ac else None,
            "faiblesses": reco_ac.faiblesses if reco_ac else None,
            "commentaires": reco_ac.commentaires if reco_ac else None,
            "agent": reco_ac.nom_agent if reco_ac else None,
            "date": reco_ac.date_signature if reco_ac else None
        } if reco_ac else None,
        "avis_risk_officer": {
            "montant_recommande": avis_ro.montant_recommande if avis_ro else None,
            "dossier_complet": avis_ro.dossier_complet if avis_ro else None,
            "decision": avis_ro.decision.value if avis_ro and avis_ro.decision else None,
            "commentaires": avis_ro.commentaires if avis_ro else None,
            "date": avis_ro.date_signature if avis_ro else None
        } if avis_ro else None,
        "avis_chef_agence": {
            "montant_recommande": avis_ca.montant_recommande if avis_ca else None,
            "dossier_complet": avis_ca.dossier_complet if avis_ca else None,
            "decision": avis_ca.decision.value if avis_ca and avis_ca.decision else None,
            "commentaires": avis_ca.commentaires if avis_ca else None,
            "date": avis_ca.date_signature if avis_ca else None
        } if avis_ca else None,
        "decision_comite": {
            "date_comite": decision.date_comite if decision else None,
            "decision": decision.decision.value if decision and decision.decision else None,
            "montant_autorise": decision.montant_autorise if decision else None,
            "taux": decision.taux_interet if decision else None,
            "duree_mois": decision.duree_mois if decision else None,
            "commentaires": decision.commentaires if decision else None,
            "conditions": decision.conditions_speciales if decision else None
        } if decision else None,
        "ratios": ratios
    }
