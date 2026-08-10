import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    """Test client - uses in-memory testing without database"""
    return TestClient(app)

@pytest.fixture
def auth_token(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "password123"}
    )
    return response.json()["access_token"]

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
