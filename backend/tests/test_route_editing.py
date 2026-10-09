from fixtures import AUTH_HEADERS
from test_flight_progress import _upload_plan

ROUTE = [
    {"identifier": "eham", "waypoint_type": "Airport", "latitude": 52.3086, "longitude": 4.7639},
    {"identifier": "USER1", "waypoint_type": "User", "latitude": 52.0, "longitude": 3.0, "altitude": 5000},
    {"identifier": "EGKK", "waypoint_type": "Airport", "latitude": 51.148, "longitude": -0.19},
]

def test_replace_waypoints_reorders_and_updates_endpoints(client):
    plan_id = _upload_plan(client)

    response = client.put(f"/flightplans/{plan_id}/waypoints", json={"waypoints": ROUTE}, headers=AUTH_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert [waypoint["identifier"] for waypoint in data["waypoints"]] == ["EHAM", "USER1", "EGKK"]
    assert [waypoint["order_index"] for waypoint in data["waypoints"]] == [0, 1, 2]
    assert data["destination_id"] == "EGKK"
    assert data["destination_name"] is None
    assert data["departure_name"] == "Schiphol"
    route = client.get(f"/flightplans/{plan_id}/route").json()
    assert route["total_points"] == 3

def test_replace_waypoints_normalizes_longitude(client):
    plan_id = _upload_plan(client)
    wrapped = [dict(ROUTE[0]), {**ROUTE[2], "longitude": 359.81}]

    data = client.put(f"/flightplans/{plan_id}/waypoints", json={"waypoints": wrapped}, headers=AUTH_HEADERS).json()

    assert round(data["waypoints"][1]["longitude"], 2) == -0.19

def test_replace_waypoints_validation_and_auth(client):
    plan_id = _upload_plan(client)

    assert client.put(f"/flightplans/{plan_id}/waypoints", json={"waypoints": ROUTE}).status_code == 401
    assert client.put(f"/flightplans/{plan_id}/waypoints", json={"waypoints": ROUTE[:1]}, headers=AUTH_HEADERS).status_code == 422

def test_replacing_waypoints_refreshes_progress(client):
    plan_id = _upload_plan(client)
    before = client.get(f"/flightplans/{plan_id}/progress").json()

    client.put(f"/flightplans/{plan_id}/waypoints", json={"waypoints": ROUTE}, headers=AUTH_HEADERS)
    after = client.get(f"/flightplans/{plan_id}/progress").json()

    assert after["total_legs"] == 2
    assert after["planned_distance_nm"] != before["planned_distance_nm"]

def test_airport_lookup(client):
    found = client.get("/airports/lrsb").json()

    assert found["ident"] == "LRSB"
    assert round(found["latitude"], 1) == 45.8
    assert client.get("/airports/ZZZZ").status_code == 404
