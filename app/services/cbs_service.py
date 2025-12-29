"""
Service pour l'intégration avec le Core Banking System (CBS) Oracle
"""
from typing import Optional, Dict, List
from datetime import datetime
import logging
import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.client import Client

logger = logging.getLogger(__name__)
settings = get_settings()


class CBSService:
    """
    Service pour la synchronisation avec le Core Banking System (Oracle)
    
    Ce service fournit une interface pour:
    1. Récupérer les données client depuis le CBS
    2. Mettre à jour les données dans le CBS
    3. Synchroniser les comptes et transactions
    
    Note: Dans un environnement de production, ce service se connecterait
    directement à la base Oracle ou via une API REST du CBS.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.cbs_base_url = None  # À configurer: URL de l'API CBS
        self.cbs_api_key = None   # À configurer: Clé API
    
    async def get_client_from_cbs(self, numero_compte: str) -> Optional[Dict]:
        """
        Récupère les informations d'un client depuis le CBS
        
        Args:
            numero_compte: Numéro de compte CBS
            
        Returns:
            Dict avec les informations client ou None
        """
        if not self.cbs_base_url:
            logger.warning("CBS non configuré - Mode simulation")
            return self._simulate_cbs_client(numero_compte)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.cbs_base_url}/clients/{numero_compte}",
                    headers={"Authorization": f"Bearer {self.cbs_api_key}"},
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Erreur CBS: {e}")
            return None
    
    async def sync_client_from_cbs(self, numero_compte: str) -> Optional[Client]:
        """
        Synchronise un client depuis le CBS vers l'application
        
        Args:
            numero_compte: Numéro de compte CBS
            
        Returns:
            Client mis à jour ou créé
        """
        cbs_data = await self.get_client_from_cbs(numero_compte)
        if not cbs_data:
            return None
        
        # Chercher le client existant
        client = self.db.query(Client).filter(
            Client.numero_credit_cmb == numero_compte
        ).first()
        
        if client:
            # Mettre à jour
            self._update_client_from_cbs(client, cbs_data)
        else:
            # Créer nouveau
            client = self._create_client_from_cbs(cbs_data)
            self.db.add(client)
        
        self.db.commit()
        self.db.refresh(client)
        return client
    
    async def push_to_cbs(self, client_id: int, data: Dict) -> bool:
        """
        Envoie des données vers le CBS
        
        Args:
            client_id: ID du client local
            data: Données à envoyer
            
        Returns:
            True si succès, False sinon
        """
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client or not client.numero_credit_cmb:
            logger.warning(f"Client {client_id} non lié au CBS")
            return False
        
        if not self.cbs_base_url:
            logger.warning("CBS non configuré - Mode simulation")
            return self._simulate_cbs_push(client.numero_credit_cmb, data)
        
        try:
            async with httpx.AsyncClient() as http_client:
                response = await http_client.put(
                    f"{self.cbs_base_url}/clients/{client.numero_credit_cmb}",
                    headers={"Authorization": f"Bearer {self.cbs_api_key}"},
                    json=data,
                    timeout=30.0
                )
                response.raise_for_status()
                return True
        except httpx.HTTPError as e:
            logger.error(f"Erreur push CBS: {e}")
            return False
    
    async def get_compte_solde(self, numero_compte: str) -> Optional[float]:
        """
        Récupère le solde d'un compte depuis le CBS
        """
        if not self.cbs_base_url:
            logger.warning("CBS non configuré - Mode simulation")
            return self._simulate_solde(numero_compte)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.cbs_base_url}/comptes/{numero_compte}/solde",
                    headers={"Authorization": f"Bearer {self.cbs_api_key}"},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("solde", 0)
        except httpx.HTTPError as e:
            logger.error(f"Erreur récupération solde CBS: {e}")
            return None
    
    async def get_historique_credits(self, numero_client: str) -> List[Dict]:
        """
        Récupère l'historique des crédits d'un client depuis le CBS
        """
        if not self.cbs_base_url:
            logger.warning("CBS non configuré - Mode simulation")
            return self._simulate_historique_credits(numero_client)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.cbs_base_url}/clients/{numero_client}/credits",
                    headers={"Authorization": f"Bearer {self.cbs_api_key}"},
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Erreur historique CBS: {e}")
            return []
    
    async def verifier_liste_radies(self, numero_piece: str) -> bool:
        """
        Vérifie si une personne est sur la liste des radiés
        """
        if not self.cbs_base_url:
            return False  # Mode simulation: pas sur liste
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.cbs_base_url}/radies/check/{numero_piece}",
                    headers={"Authorization": f"Bearer {self.cbs_api_key}"},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("is_radie", False)
        except httpx.HTTPError as e:
            logger.error(f"Erreur vérification radiés: {e}")
            return False
    
    # Méthodes de simulation pour le développement
    def _simulate_cbs_client(self, numero_compte: str) -> Dict:
        """Simule une réponse du CBS"""
        return {
            "numero_compte": numero_compte,
            "nom": "CLIENT",
            "prenom": "Test",
            "date_naissance": "1990-01-01",
            "adresse": "Adresse simulée",
            "telephone": "00000000",
            "solde": 50000,
            "date_ouverture": "2020-01-01",
            "statut": "ACTIF"
        }
    
    def _simulate_cbs_push(self, numero_compte: str, data: Dict) -> bool:
        """Simule un envoi vers le CBS"""
        logger.info(f"[SIMULATION] Push CBS pour {numero_compte}: {data}")
        return True
    
    def _simulate_solde(self, numero_compte: str) -> float:
        """Simule un solde de compte"""
        import random
        return random.randint(10000, 500000)
    
    def _simulate_historique_credits(self, numero_client: str) -> List[Dict]:
        """Simule un historique de crédits"""
        return [
            {
                "numero_credit": "CR-2023-001",
                "montant": 500000,
                "date_debut": "2023-01-15",
                "date_fin": "2023-12-15",
                "statut": "REMBOURSE",
                "incidents": 0
            }
        ]
    
    def _update_client_from_cbs(self, client: Client, cbs_data: Dict) -> None:
        """Met à jour un client avec les données CBS"""
        if cbs_data.get("nom"):
            client.nom = cbs_data["nom"]
        if cbs_data.get("prenom"):
            client.prenom = cbs_data["prenom"]
        if cbs_data.get("adresse"):
            client.adresse = cbs_data["adresse"]
        if cbs_data.get("telephone"):
            client.cellulaire = cbs_data["telephone"]
        client.updated_at = datetime.utcnow()
    
    def _create_client_from_cbs(self, cbs_data: Dict) -> Client:
        """Crée un client à partir des données CBS"""
        from app.services.client_service import ClientService
        from app.models.client import SexeEnum, TypePieceIdentiteEnum
        
        return Client(
            numero_client=ClientService(self.db).generate_numero_client(),
            numero_credit_cmb=cbs_data.get("numero_compte"),
            nom=cbs_data.get("nom", "INCONNU"),
            prenom=cbs_data.get("prenom", ""),
            sexe=SexeEnum.MASCULIN,  # Valeur par défaut
            type_piece_identite=TypePieceIdentiteEnum.CNIB,
            numero_piece_identite=cbs_data.get("numero_piece", "A_COMPLETER"),
            adresse=cbs_data.get("adresse", "A_COMPLETER"),
            cellulaire=cbs_data.get("telephone", "00000000"),
            agence=cbs_data.get("agence", "SIEGE")
        )


# Configuration pour connexion Oracle directe (alternative à l'API)
class OracleDirectConnection:
    """
    Classe pour connexion directe à Oracle CBS
    
    Utilisation:
    ```python
    from app.services.cbs_service import OracleDirectConnection
    
    oracle = OracleDirectConnection(
        host="oracle-server.pamf.local",
        port=1521,
        service_name="CBSPROD",
        user="api_user",
        password="secure_password"
    )
    
    client_data = oracle.get_client("214794")
    ```
    """
    
    def __init__(
        self,
        host: str,
        port: int,
        service_name: str,
        user: str,
        password: str
    ):
        self.connection_string = f"{user}/{password}@{host}:{port}/{service_name}"
        self._connection = None
    
    def connect(self):
        """Établit la connexion à Oracle"""
        try:
            import cx_Oracle
            self._connection = cx_Oracle.connect(self.connection_string)
            logger.info("Connexion Oracle CBS établie")
        except ImportError:
            logger.error("cx_Oracle non installé. Installer avec: pip install cx_Oracle")
        except Exception as e:
            logger.error(f"Erreur connexion Oracle: {e}")
    
    def disconnect(self):
        """Ferme la connexion"""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def get_client(self, numero_client: str) -> Optional[Dict]:
        """Récupère un client directement depuis Oracle"""
        if not self._connection:
            self.connect()
        
        if not self._connection:
            return None
        
        cursor = self._connection.cursor()
        try:
            cursor.execute("""
                SELECT 
                    CLI_NUMERO, CLI_NOM, CLI_PRENOM, CLI_DATE_NAISSANCE,
                    CLI_ADRESSE, CLI_TELEPHONE, CLI_STATUT
                FROM CLIENTS
                WHERE CLI_NUMERO = :numero
            """, {"numero": numero_client})
            
            row = cursor.fetchone()
            if row:
                return {
                    "numero_compte": row[0],
                    "nom": row[1],
                    "prenom": row[2],
                    "date_naissance": row[3],
                    "adresse": row[4],
                    "telephone": row[5],
                    "statut": row[6]
                }
            return None
        finally:
            cursor.close()
    
    def get_solde_compte(self, numero_compte: str) -> Optional[float]:
        """Récupère le solde d'un compte"""
        if not self._connection:
            self.connect()
        
        if not self._connection:
            return None
        
        cursor = self._connection.cursor()
        try:
            cursor.execute("""
                SELECT CPT_SOLDE
                FROM COMPTES
                WHERE CPT_NUMERO = :numero
            """, {"numero": numero_compte})
            
            row = cursor.fetchone()
            return row[0] if row else None
        finally:
            cursor.close()
