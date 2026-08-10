def test_list_sessions_unauthorized(client):
    response = client.get("/api/v1/sessions")
    assert response.status_code == 401

def test_create_session_unauthorized(client):
    session_data = {
        "sessionDate": "2026-08-06",
        "shift": "morning",
        "supervisorId": "admin"
    }
    response = client.post("/api/v1/sessions", json=session_data)
    assert response.status_code == 401
