import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from database import get_session
from main import app
from models.flight_plan import FlightPlan, FlightPlanWaypoint
from models.flight_telemetry import FlightTelemetry
from services.pln_parser import parse_msfs_pln, parse_world_position

SAMPLE_PLN = """<?xml version="1.0" encoding="UTF-8"?>
<SimBase.Document Type="AceXML" version="1,0">
    <Descr>AceXML Document</Descr>
    <FlightPlan.FlightPlan>
        <Title>EHAM to EGLL</Title>
        <FPType>IFR</FPType>
        <RouteType>Direct</RouteType>
        <CruisingAlt>24000</CruisingAlt>
        <DepartureID>EHAM</DepartureID>
        <DepartureLLA>N52° 18' 31.00",E4° 45' 50.00",-000011.00</DepartureLLA>
        <DestinationID>EGLL</DestinationID>
        <DestinationLLA>N51° 28' 14.00",W0° 27' 42.00",+000083.00</DestinationLLA>
        <DepartureName>Schiphol</DepartureName>
        <DestinationName>Heathrow</DestinationName>
        <ATCWaypoint id="EHAM">
            <ATCWaypointType>Airport</ATCWaypointType>
            <WorldPosition>N52° 18' 31.00",E4° 45' 50.00",-000011.00</WorldPosition>
            <ICAO>
                <ICAOIdent>EHAM</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
        <ATCWaypoint id="GORLO">
            <ATCWaypointType>Intersection</ATCWaypointType>
            <WorldPosition>N52° 10' 24.00",E3° 40' 12.00",+005000.00</WorldPosition>
            <ICAO>
                <ICAOIdent>GORLO</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
        <ATCWaypoint id="EGLL">
            <ATCWaypointType>Airport</ATCWaypointType>
            <WorldPosition>N51° 28' 14.00",W0° 27' 42.00",+000083.00</WorldPosition>
            <ICAO>
                <ICAOIdent>EGLL</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
    </FlightPlan.FlightPlan>
</SimBase.Document>"""

VALID_API_KEY = "test-api-key"
AUTH_HEADERS = {"X-API-Key": VALID_API_KEY}

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

def override_get_session():
    with Session(test_engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(autouse=True)
def setup_database():
    os.environ["API_KEY"] = VALID_API_KEY
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_parse_world_position_variations():
    lat, lon, alt = parse_world_position('N52° 18\' 31.00",E4° 45\' 50.00",-000011.00')
    assert round(lat, 4) == 52.3086
    assert round(lon, 4) == 4.7639
    assert alt == -11.0

    lat2, lon2, alt2 = parse_world_position('S12* 30\' 00.00",W77* 00\' 00.00",+001500.00')
    assert lat2 == -12.5
    assert lon2 == -77.0
    assert alt2 == 1500.0

    lat3, lon3, alt3 = parse_world_position("40.6413, -73.7781, 13")
    assert lat3 == 40.6413
    assert lon3 == -73.7781
    assert alt3 == 13.0

def test_parse_msfs_pln():
    plan = parse_msfs_pln(SAMPLE_PLN)
    assert plan.title == "EHAM to EGLL"
    assert plan.flight_plan_type == "IFR"
    assert plan.cruising_altitude == 24000.0
    assert plan.departure_id == "EHAM"
    assert plan.destination_id == "EGLL"
    assert len(plan.waypoints) == 3
    assert plan.waypoints[0].identifier == "EHAM"
    assert plan.waypoints[1].identifier == "GORLO"
    assert plan.waypoints[2].identifier == "EGLL"

def test_upload_pln_unauthorized_without_key(client):
    response = client.post(
        "/flightplans/upload",
        files={"file": ("route.pln", SAMPLE_PLN, "application/xml")},
    )
    assert response.status_code == 401

    wrong_key_res = client.post(
        "/flightplans/upload",
        files={"file": ("route.pln", SAMPLE_PLN, "application/xml")},
        headers={"X-API-Key": "wrong-key"},
    )
    assert wrong_key_res.status_code == 401

def test_upload_pln_file(client):
    response = client.post(
        "/flightplans/upload",
        files={"file": ("route.pln", SAMPLE_PLN, "application/xml")},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "EHAM to EGLL"
    assert data["departure_id"] == "EHAM"
    assert data["destination_id"] == "EGLL"
    assert data["total_waypoints"] == 3
    assert "id" in data

def test_upload_pln_raw_body_with_bearer(client):
    response = client.post(
        "/flightplans/upload",
        content=SAMPLE_PLN,
        headers={"Content-Type": "application/xml", "Authorization": f"Bearer {VALID_API_KEY}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "EHAM to EGLL"
    assert data["total_waypoints"] == 3

def test_upload_pln_query_param(client):
    response = client.post(
        f"/flightplans/upload?api_key={VALID_API_KEY}",
        content=SAMPLE_PLN,
        headers={"Content-Type": "application/xml"},
    )
    assert response.status_code == 201

def test_upload_invalid_pln(client):
    response = client.post(
        "/flightplans/upload",
        content="<InvalidXML>",
        headers={"Content-Type": "application/xml", **AUTH_HEADERS},
    )
    assert response.status_code == 400

    empty_response = client.post(
        "/flightplans/upload",
        content="",
        headers={"Content-Type": "application/xml", **AUTH_HEADERS},
    )
    assert empty_response.status_code == 400

def test_list_and_get_flight_plans_public(client):
    client.post("/flightplans/upload", content=SAMPLE_PLN, headers={"Content-Type": "application/xml", **AUTH_HEADERS})
    list_res = client.get("/flightplans")
    assert list_res.status_code == 200
    plans = list_res.json()
    assert len(plans) == 1
    plan_id = plans[0]["id"]

    single_res = client.get(f"/flightplans/{plan_id}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == plan_id

def test_delete_flight_plan_requires_auth(client):
    upload_res = client.post("/flightplans/upload", content=SAMPLE_PLN, headers={"Content-Type": "application/xml", **AUTH_HEADERS})
    plan_id = upload_res.json()["id"]

    unauth_res = client.delete(f"/flightplans/{plan_id}")
    assert unauth_res.status_code == 401

    del_res = client.delete(f"/flightplans/{plan_id}", headers=AUTH_HEADERS)
    assert del_res.status_code == 204

    get_res = client.get(f"/flightplans/{plan_id}")
    assert get_res.status_code == 404

def test_get_flight_plan_route(client):
    upload_res = client.post(
        "/flightplans/upload",
        content=SAMPLE_PLN,
        headers={"Content-Type": "application/xml", **AUTH_HEADERS},
    )
    plan_id = upload_res.json()["id"]

    route_res = client.get(f"/flightplans/{plan_id}/route")
    assert route_res.status_code == 200
    data = route_res.json()
    assert data["flightplan_id"] == plan_id
    assert data["total_points"] == 3
    assert len(data["coordinates"]) == 3
    assert len(data["points"]) == 3
    assert round(data["coordinates"][0][0], 2) == 52.31
    assert round(data["coordinates"][0][1], 2) == 4.76
    assert data["points"][0]["identifier"] == "EHAM"

    points_res = client.get(f"/flightplans/{plan_id}/points")
    assert points_res.status_code == 200
    assert points_res.json()["total_points"] == 3

def test_add_telemetry_requires_auth_and_fetch_is_public(client):
    upload_res = client.post(
        "/flightplans/upload",
        content=SAMPLE_PLN,
        headers={"Content-Type": "application/xml", **AUTH_HEADERS},
    )
    plan_id = upload_res.json()["id"]

    telemetry_payload_1 = {
        "LATITUDE": 52.31,
        "LONGITUDE": 4.76,
        "ALTITUDE": "100",
        "AIRSPEED_INDICATE": 140,
        "MAGNETIC_COMPASS": 260,
    }

    unauth_res = client.post(f"/flightplans/{plan_id}/telemetry", json=telemetry_payload_1)
    assert unauth_res.status_code == 401

    t1_res = client.post(f"/flightplans/{plan_id}/telemetry", json=telemetry_payload_1, headers=AUTH_HEADERS)
    assert t1_res.status_code == 201
    t1_data = t1_res.json()
    assert t1_data["LATITUDE"] == 52.31
    assert t1_data["FLIGHTPLAN_ID"] == plan_id

    telemetry_payload_2 = {
        "latitude": 52.20,
        "longitude": 4.20,
        "altitude": "5,000",
        "airspeed_indicate": 220,
        "magnetic_compass": 265,
    }
    t2_res = client.post(f"/flightplans/{plan_id}/telemetry", json=telemetry_payload_2, headers=AUTH_HEADERS)
    assert t2_res.status_code == 201

    fetch_res = client.get(f"/flightplans/{plan_id}/telemetry")
    assert fetch_res.status_code == 200
    telemetry_list = fetch_res.json()
    assert len(telemetry_list) == 2

    path_res = client.get(f"/flightplans/{plan_id}/path")
    assert path_res.status_code == 200
    path_data = path_res.json()
    assert path_data["flightplan_id"] == plan_id
    assert path_data["total_points"] == 2
    assert path_data["coordinates"] == [[52.31, 4.76], [52.2, 4.2]]
    assert len(path_data["telemetry"]) == 2

def test_not_found_flight_plan(client):
    random_id = uuid.uuid4()
    assert client.get(f"/flightplans/{random_id}").status_code == 404
    assert client.get(f"/flightplans/{random_id}/route").status_code == 404
    assert client.post(f"/flightplans/{random_id}/telemetry", json={"LATITUDE": 0, "LONGITUDE": 0}, headers=AUTH_HEADERS).status_code == 404
    assert client.get(f"/flightplans/{random_id}/telemetry").status_code == 404
    assert client.get(f"/flightplans/{random_id}/path").status_code == 404
    assert client.delete(f"/flightplans/{random_id}", headers=AUTH_HEADERS).status_code == 404

def test_live_telemetry_auth(client):
    live_payload = {
        "LATITUDE": 50.0,
        "LONGITUDE": 10.0,
        "ALTITUDE": "10,000",
        "AIRSPEED_INDICATE": 250,
    }

    unauth_res = client.post("/live", json=live_payload)
    assert unauth_res.status_code == 401

    res = client.post("/live", json=live_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    assert res.json()["LATITUDE"] == 50.0

    latest_res = client.get("/live")
    assert latest_res.status_code == 200
    assert latest_res.json()["LATITUDE"] == 50.0

def test_track_returns_only_latest_flight(client):
    start = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    old_flight = [(10.0, 10.0), (10.01, 10.0)]
    new_flight = [(0.0, 0.0), (50.0, 10.0), (50.0, 10.00001), (50.01, 10.0), (50.02, 10.0)]

    with Session(test_engine) as session:
        for i, (lat, lon) in enumerate(old_flight):
            session.add(FlightTelemetry(latitude=lat, longitude=lon, altitude="1,000", status="success", created_at=start + timedelta(seconds=i)))
        new_start = start + timedelta(hours=2)
        for i, (lat, lon) in enumerate(new_flight):
            session.add(FlightTelemetry(latitude=lat, longitude=lon, altitude="12,500", status="success", created_at=new_start + timedelta(seconds=i)))
        session.commit()

    res = client.get("/track")
    assert res.status_code == 200
    data = res.json()
    assert [(p["lat"], p["lon"]) for p in data["points"]] == [(50.0, 10.0), (50.01, 10.0), (50.02, 10.0)]
    assert data["points"][0]["altitude"] == 12500
    assert data["distance_nm"] == 1.2

def test_track_empty(client):
    res = client.get("/track")
    assert res.status_code == 200
    assert res.json()["points"] == []

def test_upload_real_rtw_pln(client):
    real_pln_path = Path("x:/Development/Projects/MeFLight/test/RTW-LRSB.PLN")
    if real_pln_path.exists():
        content = real_pln_path.read_text(encoding="utf-8")
        res = client.post("/flightplans/upload", content=content, headers={"Content-Type": "application/xml", **AUTH_HEADERS})
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "LRSB - LRSB"
        assert data["total_waypoints"] > 100

        route_res = client.get(f"/flightplans/{data['id']}/route")
        assert route_res.status_code == 200
        route_data = route_res.json()
        assert len(route_data["coordinates"]) > 100
        assert route_data["total_points"] > 100

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "MeFlight API" in res.json()["message"]

