def test_list_employees_unauthorized(client):
    response = client.get("/api/v1/employees")
    assert response.status_code == 401

def test_create_employee_unauthorized(client):
    employee_data = {
        "employeeId": "EMP001",
        "name": "John Doe",
        "category": "Workers"
    }
    response = client.post("/api/v1/employees", json=employee_data)
    assert response.status_code == 401
