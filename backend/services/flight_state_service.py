from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session, select
from models.flight_telemetry import FlightTelemetry
from schemas.telemetry import LastStateResponse, NearestAirportRead, TrackResponse
from services.airports import nearest_airport
from services.flight_plan_service import get_flight_plan_or_404
from services.telemetry_samples import MISSING_COORDINATE, flight_plan_samples, parse_altitude
from services.track_builder import build_track, thin_out

DISTANCE_DECIMALS = 1
NO_STATE_DETAIL = "No position recorded for this flight plan yet"

def get_flight_plan_track(session: Session, flightplan_id: uuid.UUID, min_distance_m: float) -> TrackResponse:
    get_flight_plan_or_404(session, flightplan_id)
    samples = thin_out(flight_plan_samples(session, flightplan_id), min_distance_m)
    return build_track(samples, flightplan_id)

def _last_placed_record(session: Session, flightplan_id: uuid.UUID) -> Optional[FlightTelemetry]:
    statement = (
        select(FlightTelemetry)
        .where(FlightTelemetry.flightplan_id == flightplan_id)
        .where(FlightTelemetry.latitude != MISSING_COORDINATE)
        .where(FlightTelemetry.longitude != MISSING_COORDINATE)
        .order_by(FlightTelemetry.created_at.desc(), FlightTelemetry.id.desc())
        .limit(1)
    )
    return session.exec(statement).first()

def _nearest_airport_read(record: FlightTelemetry) -> Optional[NearestAirportRead]:
    nearby = nearest_airport((record.latitude, record.longitude))
    if nearby is None:
        return None
    return NearestAirportRead(
        ident=nearby.airport.ident,
        name=nearby.airport.name,
        distance_nm=round(nearby.distance_nm, DISTANCE_DECIMALS),
    )

def get_flight_plan_last_state(session: Session, flightplan_id: uuid.UUID) -> LastStateResponse:
    get_flight_plan_or_404(session, flightplan_id)
    record = _last_placed_record(session, flightplan_id)

    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NO_STATE_DETAIL)

    return LastStateResponse(
        flightplan_id=flightplan_id,
        timestamp=record.created_at,
        lat=record.latitude,
        lon=record.longitude,
        altitude=parse_altitude(record.altitude),
        heading=record.magnetic_compass,
        on_ground=record.sim_on_ground,
        fuel_percentage=record.fuel_percentage,
        fuel_total_quantity=record.fuel_total_quantity,
        fuel_tank_levels=record.fuel_tank_levels,
        nearest_airport=_nearest_airport_read(record),
    )
