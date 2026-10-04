def test_airport_names_returns_known_airports_only(client):
    response = client.get("/airports/names", params={"idents": "ltba, LRSB,NOPE"})

    assert response.status_code == 200
    names = response.json()
    assert set(names) == {"LTBA", "LRSB"}
    assert "Ataturk" in names["LTBA"] or "Atatürk" in names["LTBA"]

def test_airport_names_without_idents(client):
    assert client.get("/airports/names").json() == {}
