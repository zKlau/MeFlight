import time
from recorder.api_client import ApiClient, ApiError
from recorder.sim import Sim

DEBOUNCE_SECONDS = 30.0
SECONDS_PER_MINUTE = 60

class LandingReporter:
    def __init__(self, sim: Sim, api: ApiClient):
        self._sim = sim
        self._api = api
        self._was_on_ground: bool | None = None
        self._last_landing_at = 0.0

    def reset(self) -> None:
        self._was_on_ground = None

    def _is_touchdown(self, on_ground: bool) -> bool:
        touched_down = self._was_on_ground is False and on_ground
        self._was_on_ground = on_ground
        recent = time.monotonic() - self._last_landing_at < DEBOUNCE_SECONDS
        return touched_down and not recent

    def observe(self, telemetry: dict, flightplan_id: str | None, session_id: str | None) -> float | None:
        if not self._is_touchdown(telemetry["SIM_ON_GROUND"]):
            return None

        self._last_landing_at = time.monotonic()
        rate_fpm = -abs(self._sim.read_touchdown_velocity() * SECONDS_PER_MINUTE)
        try:
            self._api.post_landing({
                "rate_fpm": round(rate_fpm),
                "latitude": telemetry["LATITUDE"],
                "longitude": telemetry["LONGITUDE"],
                "flightplan_id": flightplan_id,
                "session_id": session_id,
            })
        except ApiError:
            pass
        return rate_fpm
