HEATHROW_BOUNDS = {"south": 51.45, "west": -0.5, "north": 51.49, "east": -0.42}
ANTIMERIDIAN_BOUNDS = {"south": -18.5, "west": 177.0, "north": -16.0, "east": -179.0}

def test_runways_in_bounds_include_both_end_designators(client):
    response = client.get("/runways", params=HEATHROW_BOUNDS)

    assert response.status_code == 200
    heathrow = [runway for runway in response.json() if runway["airport"] == "EGLL"]
    ends = {(runway["low"]["ident"], runway["high"]["ident"]) for runway in heathrow}
    assert ends == {("09L", "27R"), ("09R", "27L")}

def test_runways_across_antimeridian(client):
    response = client.get("/runways", params=ANTIMERIDIAN_BOUNDS)

    assert response.status_code == 200
    assert "NFFN" in {runway["airport"] for runway in response.json()}

def test_runways_reject_invalid_bounds(client):
    assert client.get("/runways", params={**HEATHROW_BOUNDS, "north": 120}).status_code == 422
