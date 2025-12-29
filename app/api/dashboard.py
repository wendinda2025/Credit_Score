"""
Routes API pour le tableau de bord
"""
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.client import Client
from app.models.demande import DemandePret, StatutDemandeEnum

router = APIRouter()


@router.get("/statistiques")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Récupère les statistiques globales pour le tableau de bord
    """
    # Statistiques clients
    total_clients = db.query(Client).count()
    nouveaux_clients_mois = db.query(Client).filter(
        Client.created_at >= date.today().replace(day=1)
    ).count()
    
    # Statistiques demandes
    total_demandes = db.query(DemandePret).count()
    demandes_en_cours = db.query(DemandePret).filter(
        DemandePret.statut.in_([
            StatutDemandeEnum.BROUILLON,
            StatutDemandeEnum.SOUMISE,
            StatutDemandeEnum.EN_ANALYSE,
            StatutDemandeEnum.VISITE_PLANIFIEE,
            StatutDemandeEnum.VISITE_EFFECTUEE,
            StatutDemandeEnum.EN_COMITE
        ])
    ).count()
    demandes_approuvees = db.query(DemandePret).filter(
        DemandePret.statut == StatutDemandeEnum.APPROUVEE
    ).count()
    demandes_refusees = db.query(DemandePret).filter(
        DemandePret.statut == StatutDemandeEnum.REFUSEE
    ).count()
    
    # Montants
    montant_sollicite = db.query(func.sum(DemandePret.montant_sollicite)).scalar() or 0
    montant_approuve = db.query(func.sum(DemandePret.montant_autorise)).filter(
        DemandePret.statut == StatutDemandeEnum.APPROUVEE
    ).scalar() or 0
    
    # Taux d'approbation
    total_decidees = demandes_approuvees + demandes_refusees
    taux_approbation = (demandes_approuvees / total_decidees * 100) if total_decidees > 0 else 0
    
    return {
        "clients": {
            "total": total_clients,
            "nouveaux_ce_mois": nouveaux_clients_mois
        },
        "demandes": {
            "total": total_demandes,
            "en_cours": demandes_en_cours,
            "approuvees": demandes_approuvees,
            "refusees": demandes_refusees,
            "taux_approbation": round(taux_approbation, 1)
        },
        "montants": {
            "total_sollicite": montant_sollicite,
            "total_approuve": montant_approuve,
            "montant_moyen_demande": montant_sollicite / total_demandes if total_demandes > 0 else 0
        }
    }


@router.get("/demandes-recentes")
def get_demandes_recentes(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Récupère les demandes les plus récentes
    """
    demandes = db.query(DemandePret).order_by(
        DemandePret.created_at.desc()
    ).limit(limit).all()
    
    return [
        {
            "id": d.id,
            "numero": d.numero_demande,
            "client_id": d.client_id,
            "montant": d.montant_sollicite,
            "statut": d.statut.value if d.statut else None,
            "date": d.date_demande,
            "created_at": d.created_at
        }
        for d in demandes
    ]


@router.get("/demandes-par-statut")
def get_demandes_par_statut(db: Session = Depends(get_db)):
    """
    Récupère le nombre de demandes par statut
    """
    result = db.query(
        DemandePret.statut,
        func.count(DemandePret.id)
    ).group_by(DemandePret.statut).all()
    
    return {
        statut.value if statut else "Non défini": count
        for statut, count in result
    }


@router.get("/demandes-par-mois")
def get_demandes_par_mois(
    mois: int = Query(12, ge=1, le=24, description="Nombre de mois à afficher"),
    db: Session = Depends(get_db)
):
    """
    Récupère l'évolution des demandes sur les derniers mois
    """
    date_debut = date.today() - timedelta(days=mois * 30)
    
    result = db.query(
        func.strftime('%Y-%m', DemandePret.date_demande).label('mois'),
        func.count(DemandePret.id).label('total'),
        func.sum(DemandePret.montant_sollicite).label('montant')
    ).filter(
        DemandePret.date_demande >= date_debut
    ).group_by(
        func.strftime('%Y-%m', DemandePret.date_demande)
    ).order_by('mois').all()
    
    return [
        {
            "mois": r.mois,
            "nombre_demandes": r.total,
            "montant_total": r.montant or 0
        }
        for r in result
    ]


@router.get("/demandes-par-agence")
def get_demandes_par_agence(db: Session = Depends(get_db)):
    """
    Récupère les demandes groupées par agence
    """
    result = db.query(
        Client.agence,
        func.count(DemandePret.id).label('total'),
        func.sum(DemandePret.montant_sollicite).label('montant_sollicite'),
        func.sum(DemandePret.montant_autorise).label('montant_approuve')
    ).join(
        DemandePret, Client.id == DemandePret.client_id
    ).group_by(Client.agence).all()
    
    return [
        {
            "agence": r.agence,
            "nombre_demandes": r.total,
            "montant_sollicite": r.montant_sollicite or 0,
            "montant_approuve": r.montant_approuve or 0
        }
        for r in result
    ]


@router.get("/alertes")
def get_alertes(db: Session = Depends(get_db)):
    """
    Récupère les alertes et notifications
    """
    alertes = []
    
    # Demandes en attente depuis plus de 7 jours
    date_limite = date.today() - timedelta(days=7)
    demandes_anciennes = db.query(DemandePret).filter(
        DemandePret.statut.in_([
            StatutDemandeEnum.SOUMISE,
            StatutDemandeEnum.EN_ANALYSE
        ]),
        DemandePret.date_demande <= date_limite
    ).count()
    
    if demandes_anciennes > 0:
        alertes.append({
            "type": "warning",
            "message": f"{demandes_anciennes} demande(s) en attente depuis plus de 7 jours",
            "action": "Traiter les demandes en attente"
        })
    
    # Demandes en comité
    demandes_comite = db.query(DemandePret).filter(
        DemandePret.statut == StatutDemandeEnum.EN_COMITE
    ).count()
    
    if demandes_comite > 0:
        alertes.append({
            "type": "info",
            "message": f"{demandes_comite} demande(s) prête(s) pour le comité",
            "action": "Planifier une réunion du comité"
        })
    
    # Visites à planifier
    demandes_visite = db.query(DemandePret).filter(
        DemandePret.statut == StatutDemandeEnum.VISITE_PLANIFIEE
    ).count()
    
    if demandes_visite > 0:
        alertes.append({
            "type": "info",
            "message": f"{demandes_visite} visite(s) de validation à effectuer",
            "action": "Planifier les visites terrain"
        })
    
    return alertes
