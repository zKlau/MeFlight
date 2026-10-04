from datetime import datetime, timedelta, timezone
import uuid
from sqlmodel import Session, select
from models.flight_telemetry import FlightTelemetry
from fixtures import AUTH_HEADERS, SAMPLE_PLN, test_engine

EHAM = (52.3086, 4.7639)
GORLO = (52.1733, 3.67)
EGLL = (51.4706, -0.4617)
START = datetime(2026, 5, 1, 8, 0, 0, tzinfo=timezone.utc)
STEPS_PER_LEG = 30
OFFSET_LATITUDE = 0.02
TANKS = {"FUEL_TANK_LEFT_MAIN_LEVEL": 0.4, "FUEL_TANK_RIGHT_MAIN_LEVEL": 0.38}

def _upload_plan(client) -> str:
    response = client.post("/flightplans/upload", content=SAMPLE_PLN, headers={"Content-Type": "application/xml", **AUTH_HEADERS})
    return response.json()["id"]

def _interpolate(start, end, fraction):
    return (start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction)

def _record(plan_id, position, at, on_ground, altitude="5,000"):
    return FlightTelemetry(
        flightplan_id=uuid.UUID(plan_id),
        latitude=position[0],
        longitude=position[1],
        altitude=altitude,
        status="success",
        sim_on_ground=on_ground,
        fuel_percentage=39,
        fuel_total_quantity=21.5,
        fuel_tank_levels=TANKS,
        created_at=at,
    )

def _fly_plan(plan_id):
    records = [_record(plan_id, EHAM, START, on_ground=True, altitude="0")]
    clock = START
    for leg_start, leg_end in ((EHAM, GORLO), (GORLO, EGLL)):
        for step in range(1, STEPS_PER_LEG + 1):
            clock += timedelta(minutes=1)
            latitude, longitude = _interpolate(leg_start, leg_end, step / STEPS_PER_LEG)
            records.append(_record(plan_id, (latitude + OFFSET_LATITUDE, longitude), clock, on_ground=False))
    records.append(_record(plan_id, EGLL, clock + timedelta(minutes=1), on_ground=True, altitude="0"))

    with Session(test_engine) as session:
        session.add_all(records)
        session.commit()

def test_progress_of_completed_plan(client):
    plan_id = _upload_plan(client)
    _fly_plan(plan_id)

    data = client.get(f"/flightplans/{plan_id}/progress").json()

    assert data["completion_percent"] == 100
    assert data["current_leg_index"] == 1
    assert data["total_legs"] == 2
    assert [airport["identifier"] for airport in data["airports_visited"]] == ["EHAM", "EGLL"]
    assert data["airports_total"] == 2
    assert 0.5 < data["average_deviation_nm"] < 1.5
    assert data["sessions"] == 1
    assert data["airborne_seconds"] == 61 * 60
    assert data["flown_distance_nm"] >= data["planned_distance_nm"] * 0.95

def test_progress_without_telemetry(client):
    plan_id = _upload_plan(client)

    data = client.get(f"/flightplans/{plan_id}/progress").json()

    assert data["completion_percent"] == 0
    assert data["airports_visited"] == []
    assert data["planned_distance_nm"] > 0

def test_last_state_reports_parking_and_fuel(client):
    plan_id = _upload_plan(client)
    _fly_plan(plan_id)

    data = client.get(f"/flightplans/{plan_id}/last-state").json()

    assert data["on_ground"] is True
    assert data["fuel_tank_levels"] == TANKS
    assert data["nearest_airport"]["ident"] == "EGLL"

def test_last_state_missing(client):
    plan_id = _upload_plan(client)

    assert client.get(f"/flightplans/{plan_id}/last-state").status_code == 404

def test_flight_plan_track_splits_on_pause(client):
    plan_id = _upload_plan(client)
    _fly_plan(plan_id)
    resumed = START + timedelta(days=1)
    with Session(test_engine) as session:
        session.add(_record(plan_id, EGLL, resumed, on_ground=True, altitude="0"))
        session.commit()

    data = client.get(f"/flightplans/{plan_id}/track").json()

    assert data["points"][0]["new_segment"] is True
    assert data["points"][-1]["new_segment"] is True
    assert sum(point["new_segment"] for point in data["points"]) == 2

def test_live_telemetry_links_session_and_plan(client):
    plan_id = _upload_plan(client)
    session_id = str(uuid.uuid4())
    payload = {"LATITUDE": 52.3, "LONGITUDE": 4.7, "SESSION_ID": session_id, "FLIGHTPLAN_ID": plan_id}

    response = client.post("/live", json=payload, headers=AUTH_HEADERS)

    assert response.status_code == 201
    assert response.json()["session_id"] == session_id
    assert client.get(f"/flightplans/{plan_id}/last-state").status_code == 200

def test_live_telemetry_accepts_fuel_and_ground_fields(client):
    payload = {"LATITUDE": 1.0, "LONGITUDE": 2.0, "SIM_ON_GROUND": True, "FUEL_TANK_LEVELS": TANKS, "FUEL_TOTAL_QUANTITY": 30}

    response = client.post("/live", json=payload, headers=AUTH_HEADERS)

    assert response.status_code == 201
    assert response.json()["FUEL_TANK_LEVELS"] == TANKS
    assert response.json()["SIM_ON_GROUND"] is True

def test_live_telemetry_rejects_bad_plan_id(client):
    response = client.post("/live", json={"FLIGHTPLAN_ID": "not-a-uuid"}, headers=AUTH_HEADERS)

    assert response.status_code == 422

def test_samples_with_a_missing_coordinate_are_ignored(client):
    plan_id = _upload_plan(client)
    _fly_plan(plan_id)
    glitch_at = START + timedelta(minutes=10, seconds=30)
    with Session(test_engine) as session:
        session.add(_record(plan_id, (0.0, 4.2), glitch_at, on_ground=False))
        session.commit()

    track = client.get(f"/flightplans/{plan_id}/track").json()
    progress = client.get(f"/flightplans/{plan_id}/progress").json()

    assert all(point["lat"] != 0 for point in track["points"])
    assert progress["max_deviation_nm"] < 5

def test_deleting_a_plan_removes_its_recorded_flights(client):
    plan_id = _upload_plan(client)
    _fly_plan(plan_id)

    response = client.delete(f"/flightplans/{plan_id}", headers=AUTH_HEADERS)

    assert response.status_code == 204
    with Session(test_engine) as session:
        remaining = session.exec(select(FlightTelemetry).where(FlightTelemetry.flightplan_id == uuid.UUID(plan_id))).all()
    assert remaining == []
