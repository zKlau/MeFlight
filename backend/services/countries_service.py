import uuid
from sqlmodel import Session
from schemas.countries import CountriesResponse
from services.countries_visited import countries_visited
from services.flight_plan_service import get_flight_plan_or_404
from services.result_cache import cached_until_new_telemetry
from services.telemetry_samples import all_samples, flight_plan_samples

COUNTRIES_CACHE_SCOPE = "countries"

def get_all_countries(session: Session) -> CountriesResponse:
    return cached_until_new_telemetry(
        session,
        COUNTRIES_CACHE_SCOPE,
        None,
        lambda: countries_visited(all_samples(session), None),
    )

def get_flight_plan_countries(session: Session, flightplan_id: uuid.UUID) -> CountriesResponse:
    get_flight_plan_or_404(session, flightplan_id)
    return cached_until_new_telemetry(
        session,
        COUNTRIES_CACHE_SCOPE,
        flightplan_id,
        lambda: countries_visited(flight_plan_samples(session, flightplan_id), flightplan_id),
    )
