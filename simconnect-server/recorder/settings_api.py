from dataclasses import asdict
from fastapi import FastAPI
from pydantic import BaseModel
from recorder.api_client import ApiClient, ApiError
from recorder.settings import Settings, make_settings, save_settings
from recorder.version import VERSION

UNREACHABLE = 0
UNAUTHORIZED = 401
NOT_FOUND = 404
MISSING_FIELDS_MESSAGE = "Enter both the server URL and the API key."
VALID_MESSAGE = "Connected. The API key is valid."
OLD_SERVER_MESSAGE = "Connected, but this server is too old to verify API keys."
REJECTED_KEY_MESSAGE = "The server is reachable, but it rejected this API key."
UNREACHABLE_MESSAGE = "Could not reach the server"
SERVER_ERROR_MESSAGE = "The server answered with an error"

class SettingsBody(BaseModel):
    server_url: str = ""
    api_key: str = ""

    def to_settings(self) -> Settings:
        return make_settings(self.server_url, self.api_key)

def _settings_view(settings: Settings) -> dict:
    return {**asdict(settings), "configured": settings.configured, "version": VERSION}

def _check_result(ok: bool, message: str) -> dict:
    return {"ok": ok, "message": message}

def _error_result(error: ApiError) -> dict:
    if error.status == UNAUTHORIZED:
        return _check_result(False, REJECTED_KEY_MESSAGE)
    if error.status == NOT_FOUND:
        return _check_result(True, OLD_SERVER_MESSAGE)
    if error.status == UNREACHABLE:
        return _check_result(False, f"{UNREACHABLE_MESSAGE}: {error}")
    return _check_result(False, f"{SERVER_ERROR_MESSAGE} ({error.status}).")

def check_connection(settings: Settings) -> dict:
    if not settings.configured:
        return _check_result(False, MISSING_FIELDS_MESSAGE)
    try:
        ApiClient(settings).check_api_key()
    except ApiError as error:
        return _error_result(error)
    return _check_result(True, VALID_MESSAGE)

def add_settings_routes(app: FastAPI, api: ApiClient) -> None:
    @app.get("/api/settings")
    def get_settings():
        return _settings_view(api.settings)

    @app.put("/api/settings")
    def update_settings(body: SettingsBody):
        settings = body.to_settings()
        save_settings(settings)
        api.configure(settings)
        return _settings_view(settings)

    @app.post("/api/settings/test")
    def test_settings(body: SettingsBody):
        return check_connection(body.to_settings())
