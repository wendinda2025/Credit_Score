"""
Tests d'intégration pour l'API d'authentification
"""
def test_login_success(client, test_user):
    """Test de connexion réussie"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    """Test de connexion avec identifiants invalides"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wronguser", "password": "wrongpass"}
    )
    
    assert response.status_code == 401


def test_get_current_user(client, auth_headers, test_user):
    """Test de récupération de l'utilisateur courant"""
    response = client.get("/api/v1/users/me", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["username"] == test_user.username
    assert data["email"] == test_user.email


def test_get_current_user_unauthorized(client):
    """Test d'accès non autorisé"""
    response = client.get("/api/v1/users/me")
    
    assert response.status_code == 401
