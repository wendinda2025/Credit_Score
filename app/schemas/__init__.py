"""
Schémas Pydantic pour validation et sérialisation
"""
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse, ClientListResponse,
    PersonneReferenceCreate, CompteBancaireCreate
)
from app.schemas.demande import (
    DemandeCreate, DemandeUpdate, DemandeResponse, DemandeListResponse,
    GarantieCreate, CoutProjetCreate, ProvenanceFondsCreate
)
from app.schemas.visite import (
    VisiteValidationCreate, VisiteValidationUpdate, VisiteValidationResponse,
    ActifEntrepriseCreate, StockCreate
)
from app.schemas.finances import (
    DepensesFamilialesCreate, DepensesFamilialesResponse,
    BilanCreate, BilanResponse,
    CashFlowCreate, CompteExploitationCreate, ResultatNetCreate,
    AnalyseRatiosCreate, AnalyseRatiosResponse
)
from app.schemas.decision import (
    RecommandationACCreate, RecommandationACResponse,
    AvisRiskOfficerCreate, AvisChefAgenceCreate,
    DecisionComiteCreate, DecisionComiteResponse
)

__all__ = [
    "ClientCreate", "ClientUpdate", "ClientResponse", "ClientListResponse",
    "PersonneReferenceCreate", "CompteBancaireCreate",
    "DemandeCreate", "DemandeUpdate", "DemandeResponse", "DemandeListResponse",
    "GarantieCreate", "CoutProjetCreate", "ProvenanceFondsCreate",
    "VisiteValidationCreate", "VisiteValidationUpdate", "VisiteValidationResponse",
    "ActifEntrepriseCreate", "StockCreate",
    "DepensesFamilialesCreate", "DepensesFamilialesResponse",
    "BilanCreate", "BilanResponse",
    "CashFlowCreate", "CompteExploitationCreate", "ResultatNetCreate",
    "AnalyseRatiosCreate", "AnalyseRatiosResponse",
    "RecommandationACCreate", "RecommandationACResponse",
    "AvisRiskOfficerCreate", "AvisChefAgenceCreate",
    "DecisionComiteCreate", "DecisionComiteResponse"
]
