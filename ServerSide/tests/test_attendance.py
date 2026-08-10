def test_attendance_unauthorized(client):
    response = client.put("/api/v1/attendance/sessions/test/employees/test")
    assert response.status_code == 401
