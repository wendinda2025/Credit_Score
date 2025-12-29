"""
Modèles pour les informations client - Feuille "Info Client"
"""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum


class SexeEnum(str, enum.Enum):
    MASCULIN = "M"
    FEMININ = "F"


class EtatCivilEnum(str, enum.Enum):
    MARIE = "Marié(e)"
    CELIBATAIRE = "Célibataire"
    DIVORCE = "Divorcé(e)"
    CONCUBINAGE = "Concubinage"
    VEUF = "Veuf/Veuve"


class NiveauAcademiqueEnum(str, enum.Enum):
    ANALPHABETE = "Analphabète"
    PRIMAIRE = "Primaire"
    SECONDAIRE = "Secondaire"
    UNIVERSITAIRE = "Universitaire"


class TypePieceIdentiteEnum(str, enum.Enum):
    CNIB = "CNIB"
    PASSEPORT = "Passeport"
    CARTE_CONSULAIRE = "Carte Consulaire"
    AUTRE = "Autre"


class StatutProprietaireEnum(str, enum.Enum):
    PROPRIETAIRE = "Propriétaire"
    LOCATAIRE = "Locataire"
    AUTRE = "Autre"


class SecteurActiviteEnum(str, enum.Enum):
    PRODUCTION = "Production"
    SERVICE = "Service"
    COMMERCE = "Commerce"


class TypeEntrepriseEnum(str, enum.Enum):
    INDIVIDUEL = "Individuel"
    GROUPE = "Groupe"
    SOCIETE = "Société"


class TypeLieuActiviteEnum(str, enum.Enum):
    ATELIER = "Atelier"
    DOMICILE = "Domicile"
    MARCHE = "Marché"
    RUE = "Rue"


class Client(Base, TimestampMixin):
    """Modèle principal pour les informations client"""
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identifiants
    numero_client = Column(String(50), unique=True, index=True, nullable=False)
    numero_credit_cmb = Column(String(50), nullable=True)  # Numéro du CBS
    
    # Informations personnelles
    nom = Column(String(100), nullable=False, index=True)
    prenom = Column(String(100), nullable=False)
    date_naissance = Column(Date, nullable=True)
    sexe = Column(SQLEnum(SexeEnum), nullable=False)
    
    # Pièce d'identité
    type_piece_identite = Column(SQLEnum(TypePieceIdentiteEnum), nullable=False)
    numero_piece_identite = Column(String(50), nullable=False)
    
    # Coordonnées
    adresse = Column(String(255), nullable=False)
    adresse_depuis = Column(String(50), nullable=True)
    cellulaire = Column(String(20), nullable=False)
    telephone_fixe = Column(String(20), nullable=True)
    fax = Column(String(20), nullable=True)
    
    # Statut résidentiel
    statut_proprietaire = Column(SQLEnum(StatutProprietaireEnum), nullable=True)
    statut_autre_detail = Column(String(100), nullable=True)
    
    # Niveau académique
    niveau_academique = Column(SQLEnum(NiveauAcademiqueEnum), nullable=True)
    
    # Situation familiale
    etat_civil = Column(SQLEnum(EtatCivilEnum), nullable=True)
    nom_conjoint = Column(String(100), nullable=True)
    prenom_conjoint = Column(String(100), nullable=True)
    nombre_enfants = Column(Integer, default=0)
    autres_personnes_charge = Column(Integer, default=0)
    
    # Ancienne adresse
    ancienne_adresse = Column(String(255), nullable=True)
    temps_ancienne_adresse = Column(String(50), nullable=True)
    
    # Historique PAMF
    agence = Column(String(100), nullable=False)
    date_adhesion = Column(Date, nullable=True)
    presence_liste_radies = Column(Boolean, default=False)
    historique_credit_positif = Column(Boolean, nullable=True)
    
    # Informations sur l'activité
    nom_entreprise = Column(String(200), nullable=True)
    secteur_activite = Column(SQLEnum(SecteurActiviteEnum), nullable=True)
    type_lieu_activite = Column(String(100), nullable=True)  # Peut être multiple
    type_entreprise = Column(SQLEnum(TypeEntrepriseEnum), nullable=True)
    adresse_activite = Column(String(255), nullable=True)
    activite_depuis = Column(String(50), nullable=True)
    quartier_repere = Column(String(255), nullable=True)
    statut_emploi = Column(String(100), nullable=True)
    profession = Column(String(100), nullable=True)
    
    # Activité principale
    activite_principale = Column(Text, nullable=True)
    debut_activite_principale = Column(String(50), nullable=True)
    difficultes_activite = Column(Text, nullable=True)
    
    # Autres activités
    a_autres_activites = Column(Boolean, default=False)
    autres_activites_detail = Column(Text, nullable=True)
    
    # Personnes liées PAMF
    personnes_liees_pamf = Column(Text, nullable=True)
    
    # Relations
    personnes_reference = relationship("PersonneReference", back_populates="client", cascade="all, delete-orphan")
    comptes_bancaires = relationship("CompteBancaire", back_populates="client", cascade="all, delete-orphan")
    demandes_pret = relationship("DemandePret", back_populates="client", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Client {self.numero_client}: {self.nom} {self.prenom}>"


class PersonneReference(Base, TimestampMixin):
    """Personnes de référence ou de contact"""
    __tablename__ = "personnes_reference"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    numero_client_ref = Column(String(50), nullable=True)
    nom_prenom = Column(String(200), nullable=False)
    profession = Column(String(100), nullable=True)
    telephone = Column(String(20), nullable=True)
    adresse = Column(String(255), nullable=True)
    lien = Column(String(100), nullable=True)  # Ex: Mari, Nièce, etc.
    
    client = relationship("Client", back_populates="personnes_reference")


class CompteBancaire(Base, TimestampMixin):
    """Comptes PAMF et autres institutions financières"""
    __tablename__ = "comptes_bancaires"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    institution = Column(String(100), nullable=False)
    type_compte = Column(String(50), nullable=True)  # DAV, etc.
    numero_compte = Column(String(50), nullable=True)
    solde = Column(Float, default=0)
    annee_ouverture = Column(Integer, nullable=True)
    
    client = relationship("Client", back_populates="comptes_bancaires")


class CreditEnCours(Base, TimestampMixin):
    """Crédits en cours PAMF ou autres dettes"""
    __tablename__ = "credits_en_cours"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    institution = Column(String(100), nullable=False)
    montant_initial = Column(Float, nullable=False)
    duree = Column(String(50), nullable=True)
    solde_restant = Column(Float, nullable=True)
    versement_periodique = Column(Float, nullable=True)
    date_echeance = Column(Date, nullable=True)
