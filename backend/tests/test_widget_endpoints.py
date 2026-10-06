from datetime import datetime, timedelta, timezone
from sqlmodel import Session
from fixtures import AUTH_HEADERS, test_engine
from models.flight_telemetry import FlightTelemetry
from services import weather_service
from test_flight_progress import _upload_plan

SIBIU = (45.7856, 24.0913)
ATLANTIC = (35.0, -40.0)
METAR_REPORT = {
    "icaoId": "LRSB",
    "rawOb": "METAR LRSB 061600Z 27003KT CAVOK 17/04 Q1021",
    "obsTime": 1791302400,
    "wdir": 270,
    "wspd": 3,
    "visib": "6+",
    "temp": 17,
    "dewp": 4,
    "altim": 1021,
    "cover": "CAVOK",
    "fltCat": "VFR",
}

def _landing(rate, position=SIBIU, plan_id=None):
    return {"rate_fpm": rate, "latitude": position[0], "longitude": position[1], "flightplan_id": plan_id}

def test_location_over_land_and_sea(client):
    land = client.get("/location", params={"lat": SIBIU[0], "lon": SIBIU[1]}).json()
    sea = client.get("/location", params={"lat": ATLANTIC[0], "lon": ATLANTIC[1]}).json()

    assert land["country"]["code"] == "RO"
    assert land["nearest_airport"]["ident"] == "LRSB"
    assert sea["country"] is None

def test_landings_require_key_and_report_best_and_last(client):
    assert client.post("/landings", json=_landing(-120)).status_code == 401

    client.post("/landings", json=_landing(-250), headers=AUTH_HEADERS)
    created = client.post("/landings", json=_landing(-90), headers=AUTH_HEADERS).json()
    client.post("/landings", json=_landing(-400), headers=AUTH_HEADERS)
    data = client.get("/landings").json()

    assert created["airport_ident"] == "LRSB"
    assert data["count"] == 3
    assert data["last"]["rate_fpm"] == -400
    assert data["best"]["rate_fpm"] == -90

def test_landings_filtered_by_plan_and_deleted_with_it(client):
    plan_id = _upload_plan(client)
    client.post("/landings", json=_landing(-150, plan_id=plan_id), headers=AUTH_HEADERS)
    client.post("/landings", json=_landing(-300), headers=AUTH_HEADERS)

    assert client.get("/landings", params={"flightplan_id": plan_id}).json()["count"] == 1
    client.delete(f"/flightplans/{plan_id}", headers=AUTH_HEADERS)
    assert client.get("/landings").json()["count"] == 1

def test_session_reports_current_segment(client):
    now = datetime.now(timezone.utc)
    with Session(test_engine) as session:
        session.add(FlightTelemetry(latitude=10, longitude=10, status="success", created_at=now - timedelta(hours=3)))
        for minute, latitude in enumerate((45.0, 45.1, 45.2)):
            session.add(FlightTelemetry(
                latitude=latitude, longitude=24.0, status="success", sim_on_ground=False,
                created_at=now - timedelta(minutes=3 - minute),
            ))
        session.commit()

    data = client.get("/session").json()

    assert data["active"] is True
    assert data["airborne_seconds"] == 120
    assert 11 < data["distance_nm"] < 13

def test_session_without_data(client):
    assert client.get("/session").json()["active"] is False

def test_metar_is_parsed_and_cached(client, monkeypatch):
    calls = []
    monkeypatch.setattr(weather_service, "_cache", {})
    monkeypatch.setattr(weather_service, "_fetch", lambda ident: calls.append(ident) or [METAR_REPORT])

    first = client.get("/weather/metar", params={"ident": "lrsb"}).json()
    client.get("/weather/metar", params={"ident": "LRSB"})

    assert first["wind_direction"] == "270"
    assert first["temperature_c"] == 17
    assert first["flight_category"] == "VFR"
    assert calls == ["LRSB"]

def test_metar_unknown_airport(client, monkeypatch):
    monkeypatch.setattr(weather_service, "_cache", {})
    monkeypatch.setattr(weather_service, "_fetch", lambda ident: [])

    assert client.get("/weather/metar", params={"ident": "ZZZZ"}).status_code == 404
    assert client.get("/weather/metar", params={"ident": "not an icao"}).status_code == 422
