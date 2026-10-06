from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session
from database import get_session
from schemas.widgets import LandingCreate, LandingRead, LandingsResponse, LocationResponse, MetarResponse, SessionResponse
from security import verify_api_key
from services.landing_service import list_landings, record_landing
from services.location_service import locate
from services.session_service import current_session
from services.weather_service import get_metar

router = APIRouter(tags=["Widgets"])

DEFAULT_LANDINGS_LIMIT = 10
MAX_LANDINGS_LIMIT = 100
MAX_LATITUDE = 90
MAX_LONGITUDE = 180
ICAO_PATTERN = "^[A-Za-z0-9]{3,4}$"

@router.get("/location", response_model=LocationResponse)
def get_location(
    lat: float = Query(ge=-MAX_LATITUDE, le=MAX_LATITUDE),
    lon: float = Query(ge=-MAX_LONGITUDE, le=MAX_LONGITUDE),
):
    return locate((lat, lon))

@router.get("/session", response_model=SessionResponse)
def get_current_session(session: Session = Depends(get_session)):
    return current_session(session)

@router.post(
    "/landings",
    response_model=LandingRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_api_key)],
)
def create_landing(payload: LandingCreate, session: Session = Depends(get_session)):
    return record_landing(session, payload)

@router.get("/landings", response_model=LandingsResponse)
def get_landings(
    flightplan_id: Optional[uuid.UUID] = None,
    limit: int = Query(default=DEFAULT_LANDINGS_LIMIT, gt=0, le=MAX_LANDINGS_LIMIT),
    session: Session = Depends(get_session),
):
    return list_landings(session, flightplan_id, limit)

@router.get("/weather/metar", response_model=MetarResponse)
def get_weather(ident: str = Query(pattern=ICAO_PATTERN)):
    return get_metar(ident)
