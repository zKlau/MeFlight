import threading
import time
from typing import Any, Callable, Dict, Hashable, Optional, Tuple
import uuid
from sqlalchemy import func
from sqlmodel import Session, select
from models.flight_telemetry import FlightTelemetry

CACHE_LIMIT = 256

_lock = threading.Lock()
_versioned: Dict[Hashable, Any] = {}
_timed: Dict[Hashable, Tuple[float, Any]] = {}

def _telemetry_version(session: Session, flightplan_id: Optional[uuid.UUID]) -> Tuple[int, Optional[int]]:
    statement = select(func.count(FlightTelemetry.id), func.max(FlightTelemetry.id))
    if flightplan_id is not None:
        statement = statement.where(FlightTelemetry.flightplan_id == flightplan_id)
    return tuple(session.exec(statement).one())

def _store(cache: Dict[Hashable, Any], key: Hashable, value: Any) -> None:
    with _lock:
        if len(cache) >= CACHE_LIMIT:
            cache.clear()
        cache[key] = value

def cached_until_new_telemetry(
    session: Session,
    scope: Hashable,
    flightplan_id: Optional[uuid.UUID],
    compute: Callable[[], Any],
) -> Any:
    key = (scope, flightplan_id, _telemetry_version(session, flightplan_id))
    if key in _versioned:
        return _versioned[key]
    value = compute()
    _store(_versioned, key, value)
    return value

def cached_for(seconds: float, key: Hashable, compute: Callable[[], Any]) -> Any:
    entry = _timed.get(key)
    if entry is not None and time.monotonic() - entry[0] < seconds:
        return entry[1]
    value = compute()
    _store(_timed, key, (time.monotonic(), value))
    return value

def clear_result_cache() -> None:
    with _lock:
        _versioned.clear()
        _timed.clear()
