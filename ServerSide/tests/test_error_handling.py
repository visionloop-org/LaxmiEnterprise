def test_request_id_header_generated(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 0

def test_custom_request_id_propagated(client):
    custom_id = "test-correlation-id-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == custom_id

def test_standard_404_error_schema(client, auth_headers):
    response = client.get("/api/v1/employees/NONEXISTENT_EMP_99", headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    
    assert "detail" in data
    assert "error" in data
    
    err = data["error"]
    assert err["code"] == "EMPLOYEE_NOT_FOUND"
    assert "message" in err
    assert "timestamp" in err
    assert "path" in err
    assert "requestId" in err
    assert err["path"] == "/api/v1/employees/NONEXISTENT_EMP_99"

def test_standard_401_error_schema(client):
    response = client.get("/api/v1/employees")
    assert response.status_code == 401
    data = response.json()
    
    assert "error" in data
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "requestId" in data["error"]

def test_standard_422_validation_error_schema(client, auth_headers):
    response = client.post("/api/v1/employees", json={"invalidField": True}, headers=auth_headers)
    assert response.status_code == 422
    data = response.json()
    
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert isinstance(data["error"]["details"], list)
