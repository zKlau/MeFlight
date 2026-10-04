import threading
from typing import Dict
from recorder.telemetry import FUEL_TANKS, capacity_simvar, extract_telemetry, has_position

REQUEST_CACHE_MS = 10
SIM_QUIT_FLAG = 1

class SimNotConnected(Exception):
    pass

class Sim:
    def __init__(self):
        self._lock = threading.Lock()
        self._connection = None
        self._requests = None
        self._tanks: tuple[str, ...] = ()

    @property
    def connected(self) -> bool:
        return self._connection is not None and getattr(self._connection, "quit", 0) != SIM_QUIT_FLAG

    def connect(self) -> None:
        from SimConnect import AircraftRequests, SimConnect

        with self._lock:
            self._connection = SimConnect()
            self._requests = AircraftRequests(self._connection, _time=REQUEST_CACHE_MS)
            self._tanks = self._installed_tanks()

    def disconnect(self) -> None:
        with self._lock:
            connection = self._connection
            self._connection = None
            self._requests = None

        if connection is not None:
            try:
                connection.exit()
            except Exception:
                pass

    def _read(self, simvar: str) -> float | None:
        return self._requests.get(simvar)

    def _installed_tanks(self) -> tuple[str, ...]:
        return tuple(tank for tank in FUEL_TANKS if (self._read(capacity_simvar(tank)) or 0) > 0)

    def _ensure_connected(self) -> None:
        if not self.connected:
            raise SimNotConnected()

    def read_telemetry(self) -> dict | None:
        self._ensure_connected()
        with self._lock:
            if not self._tanks:
                self._tanks = self._installed_tanks()
            telemetry = extract_telemetry(self._read, self._tanks)
        if not has_position(telemetry):
            return None
        return telemetry

    def set_tank_levels(self, levels: Dict[str, float]) -> Dict[str, float]:
        self._ensure_connected()
        applied = {}
        with self._lock:
            for simvar, level in levels.items():
                if self._requests.set(simvar, level):
                    applied[simvar] = level
        return applied
