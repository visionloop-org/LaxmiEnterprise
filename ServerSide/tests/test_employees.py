def test_list_employees(client, auth_headers, seed_data):
    response = client.get("/api/v1/employees", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert any(e["employeeId"] == "EMP001" for e in data)

def test_list_employees_filter_category(client, auth_headers, seed_data):
    response = client.get("/api/v1/employees?category=Driver", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["employeeId"] == "EMP001"

def test_get_employee_by_id(client, auth_headers, seed_data):
    response = client.get("/api/v1/employees/EMP001", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["category"] == "Driver"

def test_get_employee_not_found(client, auth_headers, seed_data):
    response = client.get("/api/v1/employees/NONEXISTENT", headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "EMPLOYEE_NOT_FOUND"

def test_create_employee_success(client, auth_headers, seed_data):
    new_employee = {
        "employeeId": "EMP099",
        "name": "Alex Mercer",
        "category": "Worker",
        "phone": "9998887770",
        "active": True
    }
    response = client.post("/api/v1/employees", json=new_employee, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["employeeId"] == "EMP099"
    assert data["name"] == "Alex Mercer"

def test_create_employee_duplicate_conflict(client, auth_headers, seed_data):
    duplicate = {
        "employeeId": "EMP001",
        "name": "Duplicate John",
        "category": "Driver"
    }
    response = client.post("/api/v1/employees", json=duplicate, headers=auth_headers)
    assert response.status_code == 409
    data = response.json()
    assert data["error"]["code"] == "DUPLICATE_EMPLOYEE_ID"

def test_update_employee(client, auth_headers, seed_data):
    update_payload = {"phone": "1112223333", "category": "Senior Driver"}
    response = client.put("/api/v1/employees/EMP001", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == "1112223333"
    assert data["category"] == "Senior Driver"
