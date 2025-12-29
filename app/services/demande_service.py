"""
Service pour la gestion des demandes de prêt
"""
from datetime import datetime, date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import uuid

from app.models.demande import DemandePret, Garantie, CoutProjet, ProvenanceFonds, StatutDemandeEnum
from app.models.visite import VisiteValidation, ActifEntreprise, Stock, Liquidite, Dette
from app.models.finances import DepensesFamiliales, Bilan, CashFlow, CompteExploitation, ResultatNet, AnalyseRatios
from app.models.decision import RecommandationAC, AvisRiskOfficer, AvisChefAgence, DecisionComite
from app.schemas.demande import DemandeCreate, DemandeUpdate


class DemandeService:
    """Service pour les opérations sur les demandes de prêt"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_numero_demande(self) -> str:
        """Génère un numéro de demande unique"""
        # Format: DEM-YYYYMMDD-XXXX
        today = datetime.now().strftime("%Y%m%d")
        random_part = uuid.uuid4().hex[:4].upper()
        return f"DEM-{today}-{random_part}"
    
    def create(self, demande_data: DemandeCreate) -> DemandePret:
        """Crée une nouvelle demande de prêt"""
        numero_demande = self.generate_numero_demande()
        
        # Extraire les relations
        garanties = demande_data.garanties
        couts = demande_data.couts_projet
        provenances = demande_data.provenances_fonds
        
        # Créer la demande
        demande_dict = demande_data.model_dump(
            exclude={"garanties", "couts_projet", "provenances_fonds"}
        )
        demande_dict["numero_demande"] = numero_demande
        demande_dict["date_demande"] = date.today()
        
        demande = DemandePret(**demande_dict)
        self.db.add(demande)
        self.db.flush()
        
        # Ajouter les garanties
        for g_data in garanties:
            g = Garantie(demande_id=demande.id, **g_data.model_dump())
            self.db.add(g)
        
        # Ajouter les coûts du projet
        for c_data in couts:
            c = CoutProjet(demande_id=demande.id, **c_data.model_dump())
            self.db.add(c)
        
        # Ajouter les provenances de fonds
        for p_data in provenances:
            p = ProvenanceFonds(demande_id=demande.id, **p_data.model_dump())
            self.db.add(p)
        
        self.db.commit()
        self.db.refresh(demande)
        return demande
    
    def get_by_id(self, demande_id: int) -> Optional[DemandePret]:
        """Récupère une demande par son ID"""
        return self.db.query(DemandePret).filter(DemandePret.id == demande_id).first()
    
    def get_by_numero(self, numero_demande: str) -> Optional[DemandePret]:
        """Récupère une demande par son numéro"""
        return self.db.query(DemandePret).filter(DemandePret.numero_demande == numero_demande).first()
    
    def get_by_client(self, client_id: int) -> List[DemandePret]:
        """Récupère toutes les demandes d'un client"""
        return self.db.query(DemandePret).filter(
            DemandePret.client_id == client_id
        ).order_by(DemandePret.date_demande.desc()).all()
    
    def search(
        self,
        query: Optional[str] = None,
        statut: Optional[StatutDemandeEnum] = None,
        client_id: Optional[int] = None,
        date_debut: Optional[date] = None,
        date_fin: Optional[date] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[DemandePret], int]:
        """Recherche des demandes avec filtres et pagination"""
        q = self.db.query(DemandePret)
        
        if query:
            search_term = f"%{query}%"
            q = q.filter(
                or_(
                    DemandePret.numero_demande.ilike(search_term),
                    DemandePret.objet_credit.ilike(search_term)
                )
            )
        
        if statut:
            q = q.filter(DemandePret.statut == statut)
        
        if client_id:
            q = q.filter(DemandePret.client_id == client_id)
        
        if date_debut:
            q = q.filter(DemandePret.date_demande >= date_debut)
        
        if date_fin:
            q = q.filter(DemandePret.date_demande <= date_fin)
        
        total = q.count()
        demandes = q.order_by(DemandePret.created_at.desc()).offset((page - 1) * size).limit(size).all()
        
        return demandes, total
    
    def update(self, demande_id: int, demande_data: DemandeUpdate) -> Optional[DemandePret]:
        """Met à jour une demande"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        update_data = demande_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(demande, field, value)
        
        demande.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(demande)
        return demande
    
    def update_statut(self, demande_id: int, nouveau_statut: StatutDemandeEnum) -> Optional[DemandePret]:
        """Met à jour le statut d'une demande"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        demande.statut = nouveau_statut
        demande.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(demande)
        return demande
    
    def delete(self, demande_id: int) -> bool:
        """Supprime une demande"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return False
        
        self.db.delete(demande)
        self.db.commit()
        return True
    
    # Méthodes pour les sous-éléments
    def add_garantie(self, demande_id: int, data: dict) -> Optional[Garantie]:
        """Ajoute une garantie à une demande"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        garantie = Garantie(demande_id=demande_id, **data)
        self.db.add(garantie)
        self.db.commit()
        self.db.refresh(garantie)
        return garantie
    
    def add_cout_projet(self, demande_id: int, data: dict) -> Optional[CoutProjet]:
        """Ajoute un coût au projet"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        cout = CoutProjet(demande_id=demande_id, **data)
        self.db.add(cout)
        self.db.commit()
        self.db.refresh(cout)
        return cout
    
    # Visite de validation
    def create_visite(self, demande_id: int, data: dict) -> Optional[VisiteValidation]:
        """Crée une visite de validation"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        # Extraire les sous-éléments
        actifs = data.pop("actifs", [])
        stocks = data.pop("stocks", [])
        liquidites = data.pop("liquidites", [])
        dettes = data.pop("dettes", [])
        
        visite = VisiteValidation(demande_id=demande_id, **data)
        self.db.add(visite)
        self.db.flush()
        
        for a in actifs:
            self.db.add(ActifEntreprise(visite_id=visite.id, **a))
        for s in stocks:
            self.db.add(Stock(visite_id=visite.id, **s))
        for l in liquidites:
            self.db.add(Liquidite(visite_id=visite.id, **l))
        for d in dettes:
            self.db.add(Dette(visite_id=visite.id, **d))
        
        demande.statut = StatutDemandeEnum.VISITE_EFFECTUEE
        self.db.commit()
        self.db.refresh(visite)
        return visite
    
    # Données financières
    def save_depenses_familiales(self, demande_id: int, data: dict) -> Optional[DepensesFamiliales]:
        """Enregistre les dépenses familiales"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        existing = self.db.query(DepensesFamiliales).filter(
            DepensesFamiliales.demande_id == demande_id
        ).first()
        
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            depenses = DepensesFamiliales(demande_id=demande_id, **data)
            self.db.add(depenses)
            self.db.commit()
            self.db.refresh(depenses)
            return depenses
    
    def save_bilan(self, demande_id: int, data: dict) -> Optional[Bilan]:
        """Enregistre le bilan"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        existing = self.db.query(Bilan).filter(Bilan.demande_id == demande_id).first()
        
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            bilan = Bilan(demande_id=demande_id, **data)
            self.db.add(bilan)
            self.db.commit()
            self.db.refresh(bilan)
            return bilan
    
    def save_analyse_ratios(self, demande_id: int, data: dict) -> Optional[AnalyseRatios]:
        """Enregistre l'analyse des ratios"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        existing = self.db.query(AnalyseRatios).filter(
            AnalyseRatios.demande_id == demande_id
        ).first()
        
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            analyse = AnalyseRatios(demande_id=demande_id, **data)
            self.db.add(analyse)
            self.db.commit()
            self.db.refresh(analyse)
            return analyse
    
    # Décisions
    def save_recommandation_ac(self, demande_id: int, data: dict) -> Optional[RecommandationAC]:
        """Enregistre la recommandation de l'agent de crédit"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        existing = self.db.query(RecommandationAC).filter(
            RecommandationAC.demande_id == demande_id
        ).first()
        
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            reco = RecommandationAC(demande_id=demande_id, **data)
            self.db.add(reco)
            demande.statut = StatutDemandeEnum.EN_ANALYSE
            if data.get("montant_recommande"):
                demande.montant_recommande_ac = data["montant_recommande"]
            self.db.commit()
            self.db.refresh(reco)
            return reco
    
    def save_decision_comite(self, demande_id: int, data: dict) -> Optional[DecisionComite]:
        """Enregistre la décision du comité"""
        demande = self.get_by_id(demande_id)
        if not demande:
            return None
        
        existing = self.db.query(DecisionComite).filter(
            DecisionComite.demande_id == demande_id
        ).first()
        
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            decision_obj = existing
        else:
            decision_obj = DecisionComite(demande_id=demande_id, **data)
            self.db.add(decision_obj)
        
        # Mettre à jour le statut de la demande selon la décision
        from app.models.decision import DecisionEnum
        decision_value = data.get("decision")
        if decision_value == DecisionEnum.ACCORD:
            demande.statut = StatutDemandeEnum.APPROUVEE
            demande.montant_autorise = data.get("montant_autorise")
        elif decision_value == DecisionEnum.REFUS:
            demande.statut = StatutDemandeEnum.REFUSEE
        elif decision_value == DecisionEnum.AJOURNEMENT:
            demande.statut = StatutDemandeEnum.AJOURNEE
        
        self.db.commit()
        self.db.refresh(decision_obj)
        return decision_obj
    
    def get_statistiques(self) -> dict:
        """Calcule les statistiques des demandes"""
        total = self.db.query(DemandePret).count()
        
        en_cours = self.db.query(DemandePret).filter(
            DemandePret.statut.in_([
                StatutDemandeEnum.SOUMISE,
                StatutDemandeEnum.EN_ANALYSE,
                StatutDemandeEnum.VISITE_PLANIFIEE,
                StatutDemandeEnum.VISITE_EFFECTUEE,
                StatutDemandeEnum.EN_COMITE
            ])
        ).count()
        
        approuvees = self.db.query(DemandePret).filter(
            DemandePret.statut == StatutDemandeEnum.APPROUVEE
        ).count()
        
        refusees = self.db.query(DemandePret).filter(
            DemandePret.statut == StatutDemandeEnum.REFUSEE
        ).count()
        
        from sqlalchemy import func
        montant_sollicite = self.db.query(func.sum(DemandePret.montant_sollicite)).scalar() or 0
        montant_approuve = self.db.query(func.sum(DemandePret.montant_autorise)).filter(
            DemandePret.statut == StatutDemandeEnum.APPROUVEE
        ).scalar() or 0
        
        return {
            "total_demandes": total,
            "demandes_en_cours": en_cours,
            "demandes_approuvees": approuvees,
            "demandes_refusees": refusees,
            "montant_total_sollicite": montant_sollicite,
            "montant_total_approuve": montant_approuve
        }
