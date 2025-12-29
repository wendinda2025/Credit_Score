"""
Service pour les calculs financiers et ratios
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.models.demande import DemandePret
from app.models.finances import Bilan, ResultatNet, AnalyseRatios, DepensesFamiliales
from app.config import get_settings

settings = get_settings()


class CalculService:
    """Service pour les calculs financiers"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculer_mensualite(
        self, 
        montant: float, 
        taux_annuel: float, 
        duree_mois: int,
        periodicite: str = "Mensuel"
    ) -> float:
        """
        Calcule la mensualité d'un prêt
        Formule: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        """
        if taux_annuel == 0:
            return montant / duree_mois
        
        # Convertir selon la périodicité
        periodes_par_an = {
            "Mensuel": 12,
            "Trimestriel": 4,
            "Semestriel": 2,
            "Annuel": 1,
            "In Fine": 1
        }
        
        n_periodes = periodes_par_an.get(periodicite, 12)
        taux_periodique = taux_annuel / n_periodes
        nombre_paiements = duree_mois // (12 // n_periodes)
        
        if periodicite == "In Fine":
            # Pour un prêt in fine: intérêts périodiques + capital à la fin
            return montant * taux_periodique
        
        # Formule d'amortissement constant
        if taux_periodique > 0:
            mensualite = montant * (taux_periodique * (1 + taux_periodique) ** nombre_paiements) / \
                        ((1 + taux_periodique) ** nombre_paiements - 1)
        else:
            mensualite = montant / nombre_paiements
        
        return round(mensualite, 0)
    
    def calculer_echeancier(
        self,
        montant: float,
        taux_annuel: float,
        duree_mois: int,
        periodicite: str = "Mensuel"
    ) -> list:
        """Génère l'échéancier complet du prêt"""
        echeancier = []
        
        periodes_par_an = {
            "Mensuel": 12,
            "Trimestriel": 4,
            "Semestriel": 2,
            "Annuel": 1
        }
        
        n_periodes = periodes_par_an.get(periodicite, 12)
        taux_periodique = taux_annuel / n_periodes
        nombre_paiements = duree_mois // (12 // n_periodes)
        
        mensualite = self.calculer_mensualite(montant, taux_annuel, duree_mois, periodicite)
        solde = montant
        
        for i in range(1, nombre_paiements + 1):
            interets = solde * taux_periodique
            principal = mensualite - interets
            solde = solde - principal
            
            echeancier.append({
                "numero": i,
                "mensualite": round(mensualite, 0),
                "principal": round(principal, 0),
                "interets": round(interets, 0),
                "solde_restant": max(0, round(solde, 0))
            })
        
        return echeancier
    
    def calculer_ratios(self, demande_id: int) -> Dict:
        """
        Calcule tous les ratios financiers pour une demande
        """
        demande = self.db.query(DemandePret).filter(DemandePret.id == demande_id).first()
        if not demande:
            return {}
        
        bilan = self.db.query(Bilan).filter(Bilan.demande_id == demande_id).first()
        resultat = self.db.query(ResultatNet).filter(ResultatNet.demande_id == demande_id).first()
        depenses = self.db.query(DepensesFamiliales).filter(DepensesFamiliales.demande_id == demande_id).first()
        
        ratios = {
            "marge_beneficiaire": 0,
            "capacite_autofinancement": 0,
            "ratio_endettement": 0,
            "capacite_remboursement": 0,
            "ratio_participation": 0,
            "ratio_liquidite": 0,
            "ratio_endettement_global": 0,
            "rotation_stock": 0,
            "temps_ecoulement": 0,
            "appreciation": "Non calculé"
        }
        
        # Calcul de la mensualité
        mensualite = self.calculer_mensualite(
            demande.montant_sollicite,
            demande.taux_interet,
            demande.duree_mois,
            demande.periodicite.value if demande.periodicite else "Mensuel"
        )
        
        if resultat:
            # Marge bénéficiaire = Marge brute / CA
            if resultat.chiffre_affaires_moyen > 0:
                ratios["marge_beneficiaire"] = round(
                    resultat.marge_brute_moyenne / resultat.chiffre_affaires_moyen, 4
                )
            
            # CAF = Profit net + Amortissements
            ratios["capacite_autofinancement"] = round(
                resultat.profit_net_moyen + resultat.dotation_amortissement, 0
            )
            
            # Capacité de remboursement = Mensualité / (Marge nette - Dépenses familiales)
            marge_disponible = resultat.profit_net_moyen
            if depenses:
                marge_disponible -= depenses.total_depenses
            
            if marge_disponible > 0:
                ratios["capacite_remboursement"] = round(mensualite / marge_disponible, 4)
        
        if bilan:
            # Ratio d'endettement = Montant sollicité / Situation nette
            if bilan.situation_nette > 0:
                ratios["ratio_endettement"] = round(
                    demande.montant_sollicite / bilan.situation_nette, 4
                )
            
            # Ratio de participation = Situation nette / Actif total
            if bilan.total_actif > 0:
                ratios["ratio_participation"] = round(
                    bilan.situation_nette / bilan.total_actif, 4
                )
            
            # Ratio de liquidité = Actif CT / Passif CT
            if bilan.total_dettes_ct > 0:
                ratios["ratio_liquidite"] = round(
                    bilan.total_actif_circulant / bilan.total_dettes_ct, 4
                )
            
            # Ratio d'endettement global = Dettes totales / Fonds propres
            if bilan.situation_nette > 0:
                ratios["ratio_endettement_global"] = round(
                    bilan.total_dettes / bilan.situation_nette, 4
                )
            
            # Rotation des stocks et temps d'écoulement
            if resultat and bilan.stocks > 0:
                ca_annuel = resultat.chiffre_affaires_moyen * 12
                ratios["rotation_stock"] = round(ca_annuel / bilan.stocks, 2)
                ratios["temps_ecoulement"] = round((bilan.stocks / ca_annuel) * 365, 0)
        
        # Appréciation globale
        ratios["appreciation"] = self.evaluer_ratios(ratios)
        
        return ratios
    
    def evaluer_ratios(self, ratios: Dict) -> str:
        """Évalue les ratios selon les normes"""
        score = 0
        commentaires = []
        
        # Marge bénéficiaire (norme > 15%)
        if ratios["marge_beneficiaire"] >= 0.20:
            score += 2
            commentaires.append("Excellente marge bénéficiaire")
        elif ratios["marge_beneficiaire"] >= 0.15:
            score += 1
            commentaires.append("Bonne marge bénéficiaire")
        else:
            commentaires.append("Marge bénéficiaire à améliorer")
        
        # Capacité de remboursement (norme < 60%)
        if ratios["capacite_remboursement"] <= 0.40:
            score += 2
            commentaires.append("Excellente capacité de remboursement")
        elif ratios["capacite_remboursement"] <= 0.60:
            score += 1
            commentaires.append("Capacité de remboursement acceptable")
        else:
            commentaires.append("Capacité de remboursement tendue")
        
        # Ratio de participation (norme > 35%)
        if ratios["ratio_participation"] >= 0.50:
            score += 2
            commentaires.append("Très bonne capitalisation")
        elif ratios["ratio_participation"] >= 0.35:
            score += 1
            commentaires.append("Capitalisation correcte")
        else:
            commentaires.append("Capitalisation insuffisante")
        
        # Ratio de liquidité (norme > 1.5)
        if ratios["ratio_liquidite"] >= 2.0:
            score += 2
            commentaires.append("Excellente liquidité")
        elif ratios["ratio_liquidite"] >= 1.5:
            score += 1
            commentaires.append("Liquidité satisfaisante")
        else:
            commentaires.append("Liquidité à surveiller")
        
        # Appréciation finale
        if score >= 6:
            appreciation = "EXCELLENT - Dossier solide"
        elif score >= 4:
            appreciation = "BON - Dossier favorable"
        elif score >= 2:
            appreciation = "MOYEN - Dossier à risque modéré"
        else:
            appreciation = "FAIBLE - Dossier à risque élevé"
        
        return f"{appreciation}. {'; '.join(commentaires)}"
    
    def calculer_score_credit(self, client_id: int) -> Dict:
        """
        Calcule un score de crédit simplifié pour un client
        Basé sur l'historique et les ratios
        """
        from app.models.client import Client
        
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            return {"score": 0, "categorie": "Inconnu"}
        
        score = settings.SCORE_MIN + 200  # Score de base: 500
        
        # Bonus/malus basés sur l'historique
        if client.historique_credit_positif:
            score += 100
        
        if client.presence_liste_radies:
            score -= 200
        
        # Bonus pour ancienneté
        if client.date_adhesion:
            from datetime import date
            anciennete = (date.today() - client.date_adhesion).days // 365
            score += min(anciennete * 20, 100)
        
        # Bonus pour situation stable
        if client.statut_proprietaire and client.statut_proprietaire.value == "Propriétaire":
            score += 50
        
        # Limiter le score
        score = max(settings.SCORE_MIN, min(score, settings.SCORE_MAX))
        
        # Catégoriser
        if score >= settings.SEUIL_EXCELLENT:
            categorie = "Excellent"
        elif score >= settings.SEUIL_BON:
            categorie = "Bon"
        elif score >= settings.SEUIL_MOYEN:
            categorie = "Moyen"
        elif score >= settings.SEUIL_FAIBLE:
            categorie = "Faible"
        else:
            categorie = "Très faible"
        
        return {
            "score": score,
            "categorie": categorie,
            "score_min": settings.SCORE_MIN,
            "score_max": settings.SCORE_MAX
        }
