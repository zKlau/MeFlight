import uuid
from datetime import timedelta
from sqlmodel import Session
from fixtures import test_engine
from test_flight_progress import START, _fly_plan, _record, _upload_plan

BRUSSELS = (50.85, 4.35)

def _add(record):
    with Session(test_engine) as session:
        session.add(record)
        session.commit()

def test_plan_countries_split_landed_and_flown_over(client):
    plan_id = _upload_plan(client)
    _fly_plan(plan_id)
    _add(_record(plan_id, BRUSSELS, START + timedelta(minutes=5), on_ground=False))

    data = client.get(f"/flightplans/{plan_id}/countries").json()

    by_code = {country["code"]: country for country in data["countries"]}
    assert by_code["NL"]["landed"] is True
    assert by_code["GB"]["landed"] is True
    assert by_code["BE"]["landed"] is False
    assert data["landed"] == 2
    assert data["flown_over"] == 1
    assert [country["code"] for country in data["countries"]][0] == "NL"

def test_all_countries_and_cache_refresh(client):
    plan_id = _upload_plan(client)
    _fly_plan(plan_id)
    first = client.get("/countries").json()

    _add(_record(plan_id, BRUSSELS, START + timedelta(hours=5), on_ground=True))
    second = client.get("/countries").json()

    assert "BE" not in {country["code"] for country in first["countries"]}
    assert second["total"] == first["total"] + 1

def test_countries_for_unknown_plan(client):
    assert client.get(f"/flightplans/{uuid.uuid4()}/countries").status_code == 404

def test_countries_without_telemetry(client):
    assert client.get("/countries").json()["total"] == 0
