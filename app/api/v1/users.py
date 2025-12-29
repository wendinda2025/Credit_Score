"""
Routes API pour la gestion des utilisateurs
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ConflictError, ValidationError
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.logging_config import get_logger
from app.api.dependencies import get_current_user, get_current_active_superuser
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserInDB
from datetime import timedelta
from app.core.config import settings

logger = get_logger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Crée un nouvel utilisateur"""
    logger.info("Création d'un nouvel utilisateur", email=user_data.email)
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise ConflictError(
            f"Un utilisateur avec l'email '{user_data.email}' existe déjà"
        )
    
    # Créer l'utilisateur
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
        logger.info("Utilisateur créé avec succès", user_id=db_user.id)
        return db_user
    except Exception as e:
        db.rollback()
        logger.error("Erreur lors de la création de l'utilisateur", error=str(e))
        raise ValidationError(f"Erreur lors de la création: {str(e)}")


@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les utilisateurs"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Retourne les informations de l'utilisateur actuel"""
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un utilisateur par son ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur", user_id)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un utilisateur"""
    # Vérifier les permissions
    if user_id != current_user.id and not current_user.is_superuser:
        raise NotFoundError("Utilisateur", user_id)  # Masquer l'existence pour sécurité
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur", user_id)
    
    # Mettre à jour les champs
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    try:
        db.commit()
        db.refresh(user)
        logger.info("Utilisateur mis à jour", user_id=user_id)
        return user
    except Exception as e:
        db.rollback()
        logger.error("Erreur lors de la mise à jour", error=str(e))
        raise ValidationError(f"Erreur lors de la mise à jour: {str(e)}")


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Supprime un utilisateur"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur", user_id)
    
    try:
        db.delete(user)
        db.commit()
        logger.info("Utilisateur supprimé", user_id=user_id)
    except Exception as e:
        db.rollback()
        logger.error("Erreur lors de la suppression", error=str(e))
        raise ValidationError(f"Erreur lors de la suppression: {str(e)}")
