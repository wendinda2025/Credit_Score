"""
Routes API pour l'authentification
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.core.logging_config import get_logger
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from pydantic import BaseModel

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


class Token(BaseModel):
    """Schéma de réponse pour le token"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Données du token"""
    user_id: int


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Enregistre un nouvel utilisateur"""
    logger.info("Tentative d'enregistrement", email=user_data.email)
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec cet email existe déjà"
        )
    
    # Créer l'utilisateur
    from app.core.security import get_password_hash
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info("Utilisateur enregistré avec succès", user_id=db_user.id)
        return db_user
    except Exception as e:
        db.rollback()
        logger.error("Erreur lors de l'enregistrement", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Authentifie un utilisateur et retourne un token JWT"""
    logger.info("Tentative de connexion", email=form_data.username)
    
    # Trouver l'utilisateur
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning("Tentative de connexion échouée", email=form_data.username)
        raise UnauthorizedError("Email ou mot de passe incorrect")
    
    if not user.is_active:
        raise UnauthorizedError("Compte utilisateur désactivé")
    
    # Créer le token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )
    
    logger.info("Connexion réussie", user_id=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
