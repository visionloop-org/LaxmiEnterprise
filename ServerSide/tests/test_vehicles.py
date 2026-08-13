def test_list_vehicles(client, auth_headers, seed_data):
    response = client.get("/api/v1/vehicles", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

def test_get_vehicle_by_number(client, auth_headers, seed_data):
    response = client.get("/api/v1/vehicles/VEH-101", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["vehicleNumber"] == "VEH-101"

def test_get_vehicle_not_found(client, auth_headers, seed_data):
    response = client.get("/api/v1/vehicles/UNKNOWN-VEH", headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "VEHICLE_NOT_FOUND"

def test_create_vehicle_success(client, auth_headers, seed_data):
    new_vehicle = {
        "vehicleNumber": "VEH-999",
        "vehicleType": "Truck",
        "status": "available",
        "active": True
    }
    response = client.post("/api/v1/vehicles", json=new_vehicle, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["vehicleNumber"] == "VEH-999"

def test_create_vehicle_duplicate(client, auth_headers, seed_data):
    duplicate = {
        "vehicleNumber": "VEH-101",
        "vehicleType": "Truck",
        "status": "available"
    }
    response = client.post("/api/v1/vehicles", json=duplicate, headers=auth_headers)
    assert response.status_code == 409
    data = response.json()
    assert data["error"]["code"] == "DUPLICATE_VEHICLE_NUMBER"

def test_update_vehicle_status(client, auth_headers, seed_data):
    update_data = {"status": "maintenance"}
    response = client.patch("/api/v1/vehicles/VEH-101", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "maintenance"
