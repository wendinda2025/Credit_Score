"""
Tests pour la gestion des utilisateurs
"""
import pytest
from fastapi import status


def test_create_user_requires_auth(client):
    """Test que la création d'utilisateur nécessite une authentification"""
    response = client.post(
        "/api/v1/users/",
        json={
            "email": "new@example.com",
            "password": "Test1234!",
            "full_name": "New User"
        }
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_get_current_user_requires_auth(client):
    """Test que l'obtention de l'utilisateur actuel nécessite une authentification"""
    response = client.get("/api/v1/users/me")
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_get_current_user_with_token(client):
    """Test l'obtention de l'utilisateur actuel avec un token valide"""
    # Créer et se connecter
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "password": "Test1234!",
            "full_name": "Me User"
        }
    )
    
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "me@example.com",
            "password": "Test1234!"
        }
    )
    token = login_response.json()["access_token"]
    
    # Obtenir les infos de l'utilisateur
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "me@example.com"
