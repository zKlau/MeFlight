import threading
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from recorder.api_client import ApiClient, ApiError
from recorder.landings import LandingReporter
from recorder.sim import Sim, SimNotConnected

RECONNECT_DELAY_SECONDS = 3.0

@dataclass
class RecorderStatus:
    sim_connected: bool = False
    recording: bool = False
    flightplan_id: str | None = None
    session_id: str | None = None
    pushed_count: int = 0
    last_push_at: str | None = None
    last_error: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    altitude: str | None = None
    fuel_percentage: float | None = None
    on_ground: bool | None = None
    last_landing_fpm: float | None = None

class Recorder:
    def __init__(self, sim: Sim, api: ApiClient, interval_seconds: float):
        self._sim = sim
        self._api = api
        self._interval = interval_seconds
        self._status = RecorderStatus()
        self._landings = LandingReporter(sim, api)
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)

    def start_thread(self) -> None:
        self._thread.start()

    def shutdown(self) -> None:
        self._stop.set()
        self._sim.disconnect()

    def status(self) -> dict:
        with self._lock:
            self._status.sim_connected = self._sim.connected
            return asdict(self._status)

    def start_recording(self, flightplan_id: str | None) -> None:
        with self._lock:
            self._status.recording = True
            self._status.flightplan_id = flightplan_id
            self._status.session_id = str(uuid.uuid4())
            self._status.pushed_count = 0
            self._status.last_error = None
        self._landings.reset()

    def restore_fuel(self, tank_levels: dict) -> dict:
        return self._sim.set_tank_levels(tank_levels)

    def stop_recording(self) -> None:
        with self._lock:
            self._status.recording = False
            self._status.session_id = None

    def _set_error(self, message: str | None) -> None:
        with self._lock:
            self._status.last_error = message

    def _ensure_sim(self) -> bool:
        if self._sim.connected:
            return True
        try:
            self._sim.connect()
            self._set_error(None)
            return True
        except Exception as error:
            self._set_error(f"Waiting for MSFS: {error}")
            return False

    def _remember(self, telemetry: dict) -> None:
        with self._lock:
            self._status.latitude = telemetry["LATITUDE"]
            self._status.longitude = telemetry["LONGITUDE"]
            self._status.altitude = telemetry["ALTITUDE"]
            self._status.fuel_percentage = telemetry["FUEL_PERCENTAGE"]
            self._status.on_ground = telemetry["SIM_ON_GROUND"]

    def _payload(self, telemetry: dict) -> dict | None:
        with self._lock:
            if not self._status.recording:
                return None
            return {
                **telemetry,
                "SESSION_ID": self._status.session_id,
                "FLIGHTPLAN_ID": self._status.flightplan_id,
            }

    def _mark_pushed(self) -> None:
        with self._lock:
            self._status.pushed_count += 1
            self._status.last_push_at = datetime.now(timezone.utc).isoformat()
            self._status.last_error = None

    def _tick(self) -> None:
        telemetry = self._sim.read_telemetry()
        if telemetry is None:
            return
        self._remember(telemetry)
        payload = self._payload(telemetry)
        if payload is None:
            return
        self._api.push_telemetry(payload)
        self._mark_pushed()
        self._report_landing(telemetry, payload)

    def _report_landing(self, telemetry: dict, payload: dict) -> None:
        rate_fpm = self._landings.observe(telemetry, payload["FLIGHTPLAN_ID"], payload["SESSION_ID"])
        if rate_fpm is None:
            return
        with self._lock:
            self._status.last_landing_fpm = round(rate_fpm)

    def _run(self) -> None:
        while not self._stop.is_set():
            if not self._ensure_sim():
                self._stop.wait(RECONNECT_DELAY_SECONDS)
                continue
            try:
                self._tick()
            except SimNotConnected:
                self._sim.disconnect()
            except ApiError as error:
                self._set_error(f"Server error {error.status}: {error}")
            except Exception as error:
                self._set_error(f"Telemetry error: {error}")
            self._stop.wait(self._interval)
