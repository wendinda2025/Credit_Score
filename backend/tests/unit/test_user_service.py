"""
Tests unitaires pour UserService
"""
import pytest
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole


def test_create_user(db):
    """Test de création d'utilisateur"""
    user_data = UserCreate(
        email="newuser@example.com",
        username="newuser",
        password="password123",
        first_name="New",
        last_name="User",
        role=UserRole.AGENT_CREDIT
    )
    
    user = UserService.create(db, user_data)
    
    assert user.id is not None
    assert user.email == "newuser@example.com"
    assert user.username == "newuser"
    assert user.first_name == "New"
    assert user.last_name == "User"
    assert user.role == UserRole.AGENT_CREDIT
    assert user.is_active is True


def test_get_user_by_id(db, test_user):
    """Test de récupération d'utilisateur par ID"""
    user = UserService.get_by_id(db, test_user.id)
    
    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


def test_get_user_by_username(db, test_user):
    """Test de récupération d'utilisateur par username"""
    user = UserService.get_by_username(db, test_user.username)
    
    assert user is not None
    assert user.id == test_user.id
    assert user.username == test_user.username


def test_authenticate_user(db, test_user):
    """Test d'authentification"""
    user = UserService.authenticate(db, "testuser", "testpass123")
    
    assert user is not None
    assert user.id == test_user.id
    
    # Test avec mauvais mot de passe
    user = UserService.authenticate(db, "testuser", "wrongpassword")
    assert user is None


def test_get_all_users(db, test_user, admin_user):
    """Test de récupération de tous les utilisateurs"""
    users = UserService.get_all(db)
    
    assert len(users) == 2
    assert any(u.id == test_user.id for u in users)
    assert any(u.id == admin_user.id for u in users)
