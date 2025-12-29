"""
Modèles pour les données financières - Feuilles Bilan, Cash Flow, Compte d'Exploitation, etc.
"""
from datetime import date
from sqlalchemy import Column, Integer, String, Date, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class DepensesFamiliales(Base, TimestampMixin):
    """Dépenses familiales mensuelles"""
    __tablename__ = "depenses_familiales"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Dépenses courantes
    alimentation = Column(Float, default=0)
    loyer = Column(Float, default=0)
    electricite_eau = Column(Float, default=0)
    transport = Column(Float, default=0)
    sante = Column(Float, default=0)
    education = Column(Float, default=0)
    habillement = Column(Float, default=0)
    communication = Column(Float, default=0)
    loisirs = Column(Float, default=0)
    autres_depenses = Column(Float, default=0)
    autres_depenses_detail = Column(Text, nullable=True)
    
    # Total calculé
    @property
    def total_depenses(self) -> float:
        return (
            self.alimentation + self.loyer + self.electricite_eau +
            self.transport + self.sante + self.education +
            self.habillement + self.communication + self.loisirs +
            self.autres_depenses
        )
    
    demande = relationship("DemandePret", back_populates="depenses_familiales")


class Bilan(Base, TimestampMixin):
    """Bilan financier de l'entreprise"""
    __tablename__ = "bilans"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    date_bilan = Column(Date, nullable=True)
    
    # ACTIF IMMOBILISE
    terrains = Column(Float, default=0)
    batiments = Column(Float, default=0)
    equipements = Column(Float, default=0)
    materiel_roulant = Column(Float, default=0)
    autres_immobilisations = Column(Float, default=0)
    
    # ACTIF CIRCULANT
    stocks = Column(Float, default=0)
    creances_clients = Column(Float, default=0)
    autres_creances = Column(Float, default=0)
    disponibilites = Column(Float, default=0)
    
    # PASSIF - Dettes à court terme
    fournisseurs = Column(Float, default=0)
    dettes_fiscales = Column(Float, default=0)
    autres_dettes_ct = Column(Float, default=0)
    
    # PASSIF - Dettes à moyen/long terme
    emprunts_bancaires = Column(Float, default=0)
    autres_dettes_mlt = Column(Float, default=0)
    
    @property
    def total_actif_immobilise(self) -> float:
        return self.terrains + self.batiments + self.equipements + self.materiel_roulant + self.autres_immobilisations
    
    @property
    def total_actif_circulant(self) -> float:
        return self.stocks + self.creances_clients + self.autres_creances + self.disponibilites
    
    @property
    def total_actif(self) -> float:
        return self.total_actif_immobilise + self.total_actif_circulant
    
    @property
    def total_dettes_ct(self) -> float:
        return self.fournisseurs + self.dettes_fiscales + self.autres_dettes_ct
    
    @property
    def total_dettes_mlt(self) -> float:
        return self.emprunts_bancaires + self.autres_dettes_mlt
    
    @property
    def total_dettes(self) -> float:
        return self.total_dettes_ct + self.total_dettes_mlt
    
    @property
    def situation_nette(self) -> float:
        """Fonds propres = Actif - Dettes"""
        return self.total_actif - self.total_dettes
    
    demande = relationship("DemandePret", back_populates="bilan")


class CashFlow(Base, TimestampMixin):
    """Flux de trésorerie mensuels"""
    __tablename__ = "cash_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Données mensuelles stockées en JSON pour flexibilité
    # Format: {"mois1": valeur, "mois2": valeur, ...}
    chiffre_affaires_mensuel = Column(JSON, nullable=True)
    achats_mensuels = Column(JSON, nullable=True)
    charges_exploitation_mensuelles = Column(JSON, nullable=True)
    
    # Totaux annuels
    chiffre_affaires_annuel = Column(Float, default=0)
    achats_annuels = Column(Float, default=0)
    marge_brute_annuelle = Column(Float, default=0)
    
    commentaires = Column(Text, nullable=True)
    
    demande = relationship("DemandePret", back_populates="cash_flow")


class CompteExploitation(Base, TimestampMixin):
    """Compte d'exploitation (Profit & Loss)"""
    __tablename__ = "comptes_exploitation"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Données mensuelles en JSON
    ventes_mensuelles = Column(JSON, nullable=True)
    achats_mensuels = Column(JSON, nullable=True)
    
    # Charges d'exploitation mensuelles
    loyer_mensuel = Column(Float, default=0)
    electricite_eau_mensuel = Column(Float, default=0)
    salaires_mensuel = Column(Float, default=0)
    transport_mensuel = Column(Float, default=0)
    telephone_mensuel = Column(Float, default=0)
    entretien_mensuel = Column(Float, default=0)
    autres_charges_mensuel = Column(Float, default=0)
    
    # Totaux annuels
    ventes_annuelles = Column(Float, default=0)
    achats_annuels = Column(Float, default=0)
    marge_brute = Column(Float, default=0)
    total_charges_exploitation = Column(Float, default=0)
    resultat_exploitation = Column(Float, default=0)
    
    commentaires = Column(Text, nullable=True)
    
    @property
    def charges_mensuelles_total(self) -> float:
        return (
            self.loyer_mensuel + self.electricite_eau_mensuel +
            self.salaires_mensuel + self.transport_mensuel +
            self.telephone_mensuel + self.entretien_mensuel +
            self.autres_charges_mensuel
        )
    
    demande = relationship("DemandePret", back_populates="compte_exploitation")


class ResultatNet(Base, TimestampMixin):
    """Résultat net et analyse de rentabilité"""
    __tablename__ = "resultats_nets"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Données mensuelles
    chiffre_affaires_mensuel = Column(JSON, nullable=True)
    cout_achats_mensuel = Column(JSON, nullable=True)
    marge_brute_mensuelle = Column(JSON, nullable=True)
    charges_exploitation_mensuelles = Column(JSON, nullable=True)
    
    # Moyennes
    chiffre_affaires_moyen = Column(Float, default=0)
    marge_brute_moyenne = Column(Float, default=0)
    charges_exploitation_moyenne = Column(Float, default=0)
    
    # Résultats
    resultat_exploitation_moyen = Column(Float, default=0)
    dotation_amortissement = Column(Float, default=0)
    charges_financieres = Column(Float, default=0)
    autres_charges = Column(Float, default=0)
    profit_net_moyen = Column(Float, default=0)
    
    commentaires = Column(Text, nullable=True)
    
    demande = relationship("DemandePret", back_populates="resultat_net")


class AnalyseRatios(Base, TimestampMixin):
    """Analyse des ratios financiers"""
    __tablename__ = "analyses_ratios"
    
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes_pret.id"), nullable=False)
    
    # Montant à rembourser par période
    montant_remboursement_periode = Column(Float, default=0)
    
    # Capacités de l'entrepreneur
    capacites_gestion = Column(Text, nullable=True)
    systeme_approvisionnement = Column(Text, nullable=True)
    operations_entreprise = Column(Text, nullable=True)
    mise_en_marche = Column(Text, nullable=True)
    secteur_environnement = Column(Text, nullable=True)
    
    # Ratios de rentabilité
    marge_beneficiaire = Column(Float, default=0)  # Marge brute / CA
    capacite_autofinancement = Column(Float, default=0)  # CAF
    
    # Ratios de structure et liquidité
    ratio_endettement = Column(Float, default=0)  # Montant sollicité / Situation nette
    capacite_remboursement = Column(Float, default=0)  # Montant à rembourser / Marge nette
    ratio_participation = Column(Float, default=0)  # Situation nette / Actif total
    ratio_liquidite = Column(Float, default=0)  # Actif CT / Passif CT (Fonds de roulement)
    ratio_endettement_global = Column(Float, default=0)  # Dettes totales / Fonds propres
    
    # Ratios de rotation
    rotation_stock = Column(Float, default=0)  # CA / Stock moyen
    temps_ecoulement = Column(Float, default=0)  # (Stock moyen / CA) * 365
    
    commentaires_ratios = Column(Text, nullable=True)
    
    demande = relationship("DemandePret", back_populates="analyse_ratios")
