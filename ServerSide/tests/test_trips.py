import pytest

def test_create_and_update_trip_flow(client, auth_headers, seed_data):
    # 1. Create a vehicle trip
    payload = {
        "sessionId": "SES-2026-08-11",
        "vehicleId": "VEH-101",
        "vehicleNumber": "VEH-101",
        "driverEmployeeId": "EMP001",
        "driverName": "John Doe",
        "destinationLocation": "Site Construction Alpha",
        "productDetails": "Concrete Aggregate Grade A",
        "status": "dispatched",
        "remarks": "Leaving quarry"
    }

    create_res = client.post("/api/v1/trips/", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    trip = create_res.json()
    assert trip["vehicleNumber"] == "VEH-101"
    assert trip["status"] == "dispatched"
    assert len(trip["timeline"]) == 1
    trip_id = trip.get("id") or trip.get("_id")
    assert trip_id is not None

    # 2. Update status to reached_location
    update_res = client.put(
        f"/api/v1/trips/{trip_id}/status",
        json={"status": "reached_location", "locationName": "Site Alpha Gate 2", "remarks": "Arrived at gate"},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    updated_trip = update_res.json()
    assert updated_trip["status"] == "reached_location"
    assert len(updated_trip["timeline"]) == 2
    assert updated_trip["reachedLocationAt"] is not None

    # 3. Update status to delivered
    delivered_res = client.put(
        f"/api/v1/trips/{trip_id}/status",
        json={"status": "delivered", "remarks": "Material unloaded successfully"},
        headers=auth_headers
    )
    assert delivered_res.status_code == 200
    delivered_trip = delivered_res.json()
    assert delivered_trip["status"] == "delivered"
    assert delivered_trip["deliveredAt"] is not None

    # 4. List trips
    list_res = client.get(f"/api/v1/trips/?session_id=SES-2026-08-11", headers=auth_headers)
    assert list_res.status_code == 200
    trips = list_res.json()
    assert len(trips) >= 1
