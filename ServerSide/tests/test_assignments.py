def test_assign_vehicle_success(client, auth_headers, seed_data):
    session_id = "SES-2026-08-11"
    employee_id = "EMP001"
    vehicle_id = "VEH-101"

    # First mark employee as present/arrived in session
    att_payload = {"status": "arrived", "arrivalTime": "2026-08-11T08:15:00Z"}
    client.put(f"/api/v1/attendance/sessions/{session_id}/employees/{employee_id}", json=att_payload, headers=auth_headers)

    # Assign vehicle
    response = client.post(f"/api/v1/assignments/sessions/{session_id}/vehicles/{vehicle_id}/employees/{employee_id}", headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["sessionId"] == session_id
    assert data["employeeId"] == employee_id
    assert data["vehicleId"] == vehicle_id

def test_assign_vehicle_absent_employee_fails(client, auth_headers, seed_data):
    session_id = "SES-2026-08-11"
    employee_id = "EMP002"
    vehicle_id = "VEH-101"

    # Employee EMP002 has no attendance or absent status
    response = client.post(f"/api/v1/assignments/sessions/{session_id}/vehicles/{vehicle_id}/employees/{employee_id}", headers=auth_headers)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "EMPLOYEE_ABSENT"

def test_assign_vehicle_under_maintenance_fails(client, auth_headers, seed_data):
    session_id = "SES-2026-08-11"
    employee_id = "EMP001"
    vehicle_id = "VEH-102" # Under maintenance in seed_data

    # Mark employee as arrived
    client.put(f"/api/v1/attendance/sessions/{session_id}/employees/{employee_id}", json={"status": "arrived"}, headers=auth_headers)

    response = client.post(f"/api/v1/assignments/sessions/{session_id}/vehicles/{vehicle_id}/employees/{employee_id}", headers=auth_headers)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "VEHICLE_UNDER_MAINTENANCE"

def test_unassign_vehicle_success(client, auth_headers, seed_data):
    session_id = "SES-2026-08-11"
    employee_id = "EMP001"
    vehicle_id = "VEH-101"

    # 1. Mark arrived & assign
    client.put(f"/api/v1/attendance/sessions/{session_id}/employees/{employee_id}", json={"status": "arrived"}, headers=auth_headers)
    client.post(f"/api/v1/assignments/sessions/{session_id}/vehicles/{vehicle_id}/employees/{employee_id}", headers=auth_headers)

    # 2. Unassign
    response = client.delete(f"/api/v1/assignments/sessions/{session_id}/employees/{employee_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["unassignedAt"] is not None
