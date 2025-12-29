"""
Tests pour l'authentification
"""
import pytest
from fastapi import status


def test_register_user(client):
    """Test l'enregistrement d'un nouvel utilisateur"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "Test1234!",
            "full_name": "Test User"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    """Test qu'on ne peut pas enregistrer deux utilisateurs avec le même email"""
    # Premier enregistrement
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "Test1234!",
            "full_name": "First User"
        }
    )
    
    # Tentative de doublon
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "Test1234!",
            "full_name": "Second User"
        }
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_login_success(client):
    """Test la connexion avec des identifiants valides"""
    # Créer un utilisateur
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "Test1234!",
            "full_name": "Login User"
        }
    )
    
    # Se connecter
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "login@example.com",
            "password": "Test1234!"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    """Test la connexion avec des identifiants invalides"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "WrongPassword123!"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
