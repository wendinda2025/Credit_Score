"""
Modèle Client - Représente un client dans le système
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class Client(Base):
    """
    Modèle représentant un client du système de crédit.
    
    Attributes:
        id: Identifiant unique du client
        nom: Nom de famille du client
        prenom: Prénom du client
        email: Adresse email unique
        telephone: Numéro de téléphone
        date_naissance: Date de naissance
        adresse: Adresse postale
        revenu_mensuel: Revenu mensuel déclaré
        emploi: Type d'emploi actuel
        anciennete_emploi: Ancienneté dans l'emploi actuel (en mois)
        score_credit: Score de crédit calculé
        actif: Si le compte client est actif
        created_at: Date de création du compte
        updated_at: Date de dernière modification
    """
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Informations personnelles
    nom = Column(String(100), nullable=False, index=True)
    prenom = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    telephone = Column(String(20), nullable=True)
    date_naissance = Column(DateTime, nullable=True)
    adresse = Column(Text, nullable=True)
    
    # Informations financières
    revenu_mensuel = Column(Float, nullable=False, default=0.0)
    emploi = Column(String(100), nullable=True)
    anciennete_emploi = Column(Integer, nullable=True, default=0)  # en mois
    
    # Score de crédit
    score_credit = Column(Integer, nullable=True)
    
    # Historique financier
    nombre_credits_anterieurs = Column(Integer, default=0)
    credits_rembourses = Column(Integer, default=0)
    incidents_paiement = Column(Integer, default=0)
    
    # Statut
    actif = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    demandes = relationship("DemandeCredit", back_populates="client", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Client(id={self.id}, nom='{self.nom}', prenom='{self.prenom}', email='{self.email}')>"
    
    @property
    def nom_complet(self) -> str:
        """Retourne le nom complet du client"""
        return f"{self.prenom} {self.nom}"
    
    @property
    def taux_remboursement(self) -> float:
        """Calcule le taux de remboursement des crédits antérieurs"""
        if self.nombre_credits_anterieurs == 0:
            return 0.0
        return (self.credits_rembourses / self.nombre_credits_anterieurs) * 100
