"""
Dépendances FastAPI réutilisables
"""
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedError
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dépendance pour obtenir l'utilisateur actuel depuis le token JWT"""
    try:
        payload = decode_access_token(credentials.credentials)
        user_id: int = payload.get("sub")
        
        if user_id is None:
            raise UnauthorizedError("Token invalide")
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise UnauthorizedError("Utilisateur non trouvé")
        
        if not user.is_active:
            raise UnauthorizedError("Utilisateur inactif")
        
        return user
    except UnauthorizedError:
        raise
    except Exception as e:
        raise UnauthorizedError(f"Erreur d'authentification: {str(e)}")


def get_current_active_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dépendance pour obtenir un superutilisateur actif"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux superutilisateurs"
        )
    return current_user
