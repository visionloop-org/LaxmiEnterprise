def test_list_vehicles_unauthorized(client):
    response = client.get("/api/v1/vehicles")
    assert response.status_code == 401

def test_create_vehicle_unauthorized(client):
    vehicle_data = {
        "vehicleNumber": "MH01AB1234",
        "vehicleType": "Tipper"
    }
    response = client.post("/api/v1/vehicles", json=vehicle_data)
    assert response.status_code == 401
