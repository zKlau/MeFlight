from typing import Dict, Optional, Tuple
import uuid
from sqlalchemy import func
from sqlmodel import Session, select
from models.flight_telemetry import FlightTelemetry
from schemas.countries import CountriesResponse
from services.countries_visited import countries_visited
from services.flight_plan_service import get_flight_plan_or_404
from services.telemetry_samples import all_samples, flight_plan_samples

CACHE_LIMIT = 64

CacheKey = Tuple[Optional[uuid.UUID], int, Optional[int]]
_cache: Dict[CacheKey, CountriesResponse] = {}

def _cache_key(session: Session, flightplan_id: Optional[uuid.UUID]) -> CacheKey:
    statement = select(func.count(FlightTelemetry.id), func.max(FlightTelemetry.id))
    if flightplan_id is not None:
        statement = statement.where(FlightTelemetry.flightplan_id == flightplan_id)
    count, newest_id = session.exec(statement).one()
    return (flightplan_id, count, newest_id)

def _cached(key: CacheKey, compute) -> CountriesResponse:
    if key not in _cache:
        if len(_cache) >= CACHE_LIMIT:
            _cache.clear()
        _cache[key] = compute()
    return _cache[key]

def get_all_countries(session: Session) -> CountriesResponse:
    return _cached(_cache_key(session, None), lambda: countries_visited(all_samples(session), None))

def get_flight_plan_countries(session: Session, flightplan_id: uuid.UUID) -> CountriesResponse:
    get_flight_plan_or_404(session, flightplan_id)
    return _cached(
        _cache_key(session, flightplan_id),
        lambda: countries_visited(flight_plan_samples(session, flightplan_id), flightplan_id),
    )

def clear_countries_cache() -> None:
    _cache.clear()
