def test_list_sessions(client, auth_headers, seed_data):
    response = client.get("/api/v1/sessions", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

def test_get_session_by_id(client, auth_headers, seed_data):
    response = client.get("/api/v1/sessions/SES-2026-08-11", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["sessionDate"] == "2026-08-11"

def test_get_session_not_found(client, auth_headers, seed_data):
    response = client.get("/api/v1/sessions/SES-INVALID", headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "SESSION_NOT_FOUND"

def test_create_session_success(client, auth_headers, seed_data):
    new_session = {
        "sessionDate": "2026-08-12",
        "shift": "Morning",
        "supervisorId": "admin",
        "status": "in_progress",
        "version": 1
    }
    response = client.post("/api/v1/sessions", json=new_session, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["sessionDate"] == "2026-08-12"
    assert data["shift"] == "Morning"

def test_create_session_duplicate_conflict(client, auth_headers, seed_data):
    duplicate = {
        "sessionDate": "2026-08-11",
        "shift": "Morning",
        "supervisorId": "admin",
        "status": "in_progress",
        "version": 1
    }
    response = client.post("/api/v1/sessions", json=duplicate, headers=auth_headers)
    assert response.status_code == 409
    data = response.json()
    assert data["error"]["code"] == "SESSION_ALREADY_EXISTS"

def test_finalize_session_success(client, auth_headers, seed_data):
    response = client.post("/api/v1/sessions/SES-2026-08-11/finalize", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "finalized"

def test_finalize_session_idempotent(client, auth_headers, seed_data):
    response = client.post("/api/v1/sessions/SES-2026-08-10/finalize", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "finalized"

def test_unlock_session_admin_success(client, auth_headers, seed_data):
    # Unlock a finalized session as admin
    response = client.post("/api/v1/sessions/SES-2026-08-10/unlock", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"

def test_unlock_session_by_date_success(client, auth_headers, seed_data):
    # First finalize
    client.post("/api/v1/sessions/SES-2026-08-11/finalize", headers=auth_headers)
    # Unlock using sessionDate
    response = client.post("/api/v1/sessions/2026-08-11/unlock", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"

