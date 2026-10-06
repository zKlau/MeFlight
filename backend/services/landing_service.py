from typing import List, Optional
import uuid
from sqlmodel import Session, delete, select
from models.landing import Landing
from schemas.widgets import LandingCreate, LandingRead, LandingsResponse
from services.airports import Airport, nearest_airport

LANDING_AIRPORT_RADIUS_NM = 3.0

def _airport_for(latitude: float, longitude: float) -> Optional[Airport]:
    nearby = nearest_airport((latitude, longitude))
    if nearby is None or nearby.distance_nm > LANDING_AIRPORT_RADIUS_NM:
        return None
    return nearby.airport

def _read(landing: Landing) -> LandingRead:
    return LandingRead.model_validate(landing, from_attributes=True)

def record_landing(session: Session, payload: LandingCreate) -> LandingRead:
    airport = _airport_for(payload.latitude, payload.longitude)
    landing = Landing(
        flightplan_id=payload.flightplan_id,
        session_id=payload.session_id,
        rate_fpm=payload.rate_fpm,
        latitude=payload.latitude,
        longitude=payload.longitude,
        airport_ident=airport.ident if airport else None,
        airport_name=airport.name if airport else None,
    )
    session.add(landing)
    session.commit()
    session.refresh(landing)
    return _read(landing)

def _landings(session: Session, flightplan_id: Optional[uuid.UUID]) -> List[Landing]:
    statement = select(Landing).order_by(Landing.created_at.desc(), Landing.id.desc())
    if flightplan_id is not None:
        statement = statement.where(Landing.flightplan_id == flightplan_id)
    return list(session.exec(statement).all())

def list_landings(session: Session, flightplan_id: Optional[uuid.UUID], limit: int) -> LandingsResponse:
    landings = [_read(landing) for landing in _landings(session, flightplan_id)]

    if not landings:
        return LandingsResponse(count=0, landings=[])

    return LandingsResponse(
        count=len(landings),
        last=landings[0],
        best=min(landings, key=lambda landing: abs(landing.rate_fpm)),
        landings=landings[:limit],
    )

def delete_plan_landings(session: Session, flightplan_id: uuid.UUID) -> None:
    session.exec(delete(Landing).where(Landing.flightplan_id == flightplan_id))
