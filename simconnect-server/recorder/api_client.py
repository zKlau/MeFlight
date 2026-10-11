import json
import urllib.error
import urllib.request
from typing import Any
from recorder.settings import Settings

USER_AGENT = "MeFlight-Recorder/2.0"
REQUEST_TIMEOUT_SECONDS = 10
JSON_CONTENT_TYPE = "application/json"
XML_CONTENT_TYPE = "application/xml"
NOT_FOUND = 404
NOT_CONFIGURED = 503
NOT_CONFIGURED_MESSAGE = "MeFlight is not connected to a server yet. Open Settings to add the server URL and API key."

class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status

class ApiClient:
    def __init__(self, settings: Settings):
        self._settings = settings

    @property
    def settings(self) -> Settings:
        return self._settings

    def configure(self, settings: Settings) -> None:
        self._settings = settings

    def _headers(self, settings: Settings, content_type: str | None) -> dict:
        headers = {"User-Agent": USER_AGENT}
        if content_type:
            headers["Content-Type"] = content_type
        if settings.api_key:
            headers["X-API-Key"] = settings.api_key
        return headers

    def _request(self, method: str, path: str, body: bytes | None = None, content_type: str | None = None) -> Any:
        settings = self._settings
        if not settings.server_url:
            raise ApiError(NOT_CONFIGURED, NOT_CONFIGURED_MESSAGE)
        request = urllib.request.Request(
            f"{settings.server_url}/{path}",
            data=body,
            headers=self._headers(settings, content_type),
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                payload = response.read()
        except urllib.error.HTTPError as error:
            raise ApiError(error.code, error.read().decode("utf-8", errors="replace")) from error
        except urllib.error.URLError as error:
            raise ApiError(0, str(error.reason)) from error

        return json.loads(payload) if payload else None

    def check_api_key(self) -> None:
        self._request("GET", "auth/check")

    def list_flight_plans(self) -> list:
        return self._request("GET", "flightplans")

    def upload_flight_plan(self, pln_xml: bytes) -> dict:
        return self._request("POST", "flightplans/upload", pln_xml, XML_CONTENT_TYPE)

    def delete_flight_plan(self, flightplan_id: str) -> None:
        self._request("DELETE", f"flightplans/{flightplan_id}")

    def last_state(self, flightplan_id: str) -> dict | None:
        try:
            return self._request("GET", f"flightplans/{flightplan_id}/last-state")
        except ApiError as error:
            if error.status == NOT_FOUND:
                return None
            raise

    def progress(self, flightplan_id: str) -> dict:
        return self._request("GET", f"flightplans/{flightplan_id}/progress")

    def flight_plan(self, flightplan_id: str) -> dict:
        return self._request("GET", f"flightplans/{flightplan_id}")

    def update_waypoints(self, flightplan_id: str, route: dict) -> dict:
        return self._request("PUT", f"flightplans/{flightplan_id}/waypoints", json.dumps(route).encode("utf-8"), JSON_CONTENT_TYPE)

    def airport(self, ident: str) -> dict:
        return self._request("GET", f"airports/{ident}")

    def post_landing(self, landing: dict) -> None:
        self._request("POST", "landings", json.dumps(landing).encode("utf-8"), JSON_CONTENT_TYPE)

    def push_telemetry(self, telemetry: dict) -> None:
        self._request("POST", "live", json.dumps(telemetry).encode("utf-8"), JSON_CONTENT_TYPE)
