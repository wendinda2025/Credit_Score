"""
Service pour la gestion des clients
"""
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid

from app.models.client import Client, PersonneReference, CompteBancaire
from app.schemas.client import ClientCreate, ClientUpdate


class ClientService:
    """Service pour les opérations CRUD sur les clients"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_numero_client(self) -> str:
        """Génère un numéro client unique"""
        # Format: CLI-YYYYMMDD-XXXX
        today = datetime.now().strftime("%Y%m%d")
        random_part = uuid.uuid4().hex[:4].upper()
        return f"CLI-{today}-{random_part}"
    
    def create(self, client_data: ClientCreate) -> Client:
        """Crée un nouveau client"""
        # Générer le numéro client si non fourni
        if not client_data.numero_client:
            client_data.numero_client = self.generate_numero_client()
        
        # Extraire les relations
        personnes_ref = client_data.personnes_reference
        comptes = client_data.comptes_bancaires
        
        # Créer le client sans les relations
        client_dict = client_data.model_dump(exclude={"personnes_reference", "comptes_bancaires"})
        client = Client(**client_dict)
        
        self.db.add(client)
        self.db.flush()  # Pour obtenir l'ID
        
        # Ajouter les personnes de référence
        for pr_data in personnes_ref:
            pr = PersonneReference(client_id=client.id, **pr_data.model_dump())
            self.db.add(pr)
        
        # Ajouter les comptes bancaires
        for cb_data in comptes:
            cb = CompteBancaire(client_id=client.id, **cb_data.model_dump())
            self.db.add(cb)
        
        self.db.commit()
        self.db.refresh(client)
        return client
    
    def get_by_id(self, client_id: int) -> Optional[Client]:
        """Récupère un client par son ID"""
        return self.db.query(Client).filter(Client.id == client_id).first()
    
    def get_by_numero(self, numero_client: str) -> Optional[Client]:
        """Récupère un client par son numéro"""
        return self.db.query(Client).filter(Client.numero_client == numero_client).first()
    
    def get_by_numero_cmb(self, numero_cmb: str) -> Optional[Client]:
        """Récupère un client par son numéro CBS (Core Banking System)"""
        return self.db.query(Client).filter(Client.numero_credit_cmb == numero_cmb).first()
    
    def search(
        self, 
        query: Optional[str] = None,
        agence: Optional[str] = None,
        page: int = 1, 
        size: int = 20
    ) -> Tuple[List[Client], int]:
        """Recherche des clients avec pagination"""
        q = self.db.query(Client)
        
        if query:
            search_term = f"%{query}%"
            q = q.filter(
                or_(
                    Client.nom.ilike(search_term),
                    Client.prenom.ilike(search_term),
                    Client.numero_client.ilike(search_term),
                    Client.cellulaire.ilike(search_term),
                    Client.numero_piece_identite.ilike(search_term)
                )
            )
        
        if agence:
            q = q.filter(Client.agence == agence)
        
        total = q.count()
        clients = q.order_by(Client.created_at.desc()).offset((page - 1) * size).limit(size).all()
        
        return clients, total
    
    def update(self, client_id: int, client_data: ClientUpdate) -> Optional[Client]:
        """Met à jour un client"""
        client = self.get_by_id(client_id)
        if not client:
            return None
        
        update_data = client_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(client, field, value)
        
        client.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(client)
        return client
    
    def delete(self, client_id: int) -> bool:
        """Supprime un client"""
        client = self.get_by_id(client_id)
        if not client:
            return False
        
        self.db.delete(client)
        self.db.commit()
        return True
    
    def add_personne_reference(self, client_id: int, data: dict) -> Optional[PersonneReference]:
        """Ajoute une personne de référence"""
        client = self.get_by_id(client_id)
        if not client:
            return None
        
        pr = PersonneReference(client_id=client_id, **data)
        self.db.add(pr)
        self.db.commit()
        self.db.refresh(pr)
        return pr
    
    def add_compte_bancaire(self, client_id: int, data: dict) -> Optional[CompteBancaire]:
        """Ajoute un compte bancaire"""
        client = self.get_by_id(client_id)
        if not client:
            return None
        
        cb = CompteBancaire(client_id=client_id, **data)
        self.db.add(cb)
        self.db.commit()
        self.db.refresh(cb)
        return cb
    
    def get_all_agences(self) -> List[str]:
        """Récupère la liste des agences distinctes"""
        result = self.db.query(Client.agence).distinct().all()
        return [r[0] for r in result if r[0]]
