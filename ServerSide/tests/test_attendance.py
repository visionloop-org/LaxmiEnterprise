def test_attendance_unauthorized(client):
    response = client.put("/api/v1/attendance/sessions/test/employees/test")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"

def test_record_attendance_create_and_update(client, auth_headers, seed_data):
    session_id = "SES-2026-08-11"
    employee_id = "EMP001"
    
    # 1. Create attendance record
    payload = {
        "status": "arrived",
        "arrivalTime": "2026-08-11T08:30:00Z",
        "remarks": "On time"
    }
    response = client.put(f"/api/v1/attendance/sessions/{session_id}/employees/{employee_id}", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "arrived"
    assert data["version"] == 1

    # 2. Update attendance record (version 1 -> 2)
    update_payload = {
        "status": "on_time",
        "version": 1
    }
    response2 = client.put(f"/api/v1/attendance/sessions/{session_id}/employees/{employee_id}", json=update_payload, headers=auth_headers)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["status"] == "on_time"
    assert data2["version"] == 2

def test_record_attendance_finalized_session_locked(client, auth_headers, seed_data):
    session_id = "SES-2026-08-10" # Finalized session in seed_data
    employee_id = "EMP001"
    
    payload = {"status": "arrived"}
    response = client.put(f"/api/v1/attendance/sessions/{session_id}/employees/{employee_id}", json=payload, headers=auth_headers)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "SESSION_FINALIZED_LOCKED"

def test_record_attendance_session_not_found(client, auth_headers, seed_data):
    response = client.put("/api/v1/attendance/sessions/NONEXISTENT/employees/EMP001", json={"status": "arrived"}, headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "SESSION_NOT_FOUND"

def test_record_attendance_employee_not_found(client, auth_headers, seed_data):
    response = client.put("/api/v1/attendance/sessions/SES-2026-08-11/employees/NONEXISTENT", json={"status": "arrived"}, headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "EMPLOYEE_NOT_FOUND"
