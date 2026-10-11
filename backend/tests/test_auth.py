from fixtures import AUTH_HEADERS

WRONG_KEY_HEADERS = {"X-API-Key": "wrong-key"}

def test_auth_check_accepts_valid_key(client):
    response = client.get("/auth/check", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert response.json() == {"valid": True}

def test_auth_check_rejects_missing_or_wrong_key(client):
    assert client.get("/auth/check").status_code == 401
    assert client.get("/auth/check", headers=WRONG_KEY_HEADERS).status_code == 401
