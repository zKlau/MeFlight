from datetime import datetime, timezone
from typing import List, Optional
import uuid
from sqlmodel import Session, delete
from models.flight_plan import FlightPlan, FlightPlanWaypoint
from schemas.flight_plan import WaypointWrite
from services.flight_plan_service import get_flight_plan_or_404
from services.result_cache import clear_result_cache

HALF_CIRCLE_DEGREES = 180
FULL_CIRCLE_DEGREES = 360

def normalize_longitude(longitude: float) -> float:
    return ((longitude + HALF_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES) - HALF_CIRCLE_DEGREES

def _world_position(latitude: float, longitude: float, altitude: Optional[float]) -> str:
    return f"{latitude},{longitude},{altitude or 0.0}"

def _to_record(flightplan_id: uuid.UUID, index: int, waypoint: WaypointWrite) -> FlightPlanWaypoint:
    identifier = waypoint.identifier.strip().upper()
    longitude = normalize_longitude(waypoint.longitude)
    return FlightPlanWaypoint(
        flight_plan_id=flightplan_id,
        order_index=index,
        identifier=identifier,
        waypoint_type=waypoint.waypoint_type,
        latitude=waypoint.latitude,
        longitude=longitude,
        altitude=waypoint.altitude,
        world_position=_world_position(waypoint.latitude, longitude, waypoint.altitude),
    )

def _sync_endpoints(flight_plan: FlightPlan, records: List[FlightPlanWaypoint]) -> None:
    departure = records[0].identifier
    destination = records[-1].identifier

    if flight_plan.departure_id != departure:
        flight_plan.departure_id = departure
        flight_plan.departure_name = None

    if flight_plan.destination_id != destination:
        flight_plan.destination_id = destination
        flight_plan.destination_name = None

def replace_waypoints(session: Session, flightplan_id: uuid.UUID, waypoints: List[WaypointWrite]) -> FlightPlan:
    flight_plan = get_flight_plan_or_404(session, flightplan_id)
    records = [_to_record(flightplan_id, index, waypoint) for index, waypoint in enumerate(waypoints)]

    session.exec(delete(FlightPlanWaypoint).where(FlightPlanWaypoint.flight_plan_id == flightplan_id))
    session.add_all(records)
    _sync_endpoints(flight_plan, records)
    flight_plan.updated_at = datetime.now(timezone.utc)
    session.add(flight_plan)
    session.commit()
    session.expire(flight_plan)
    session.refresh(flight_plan)
    clear_result_cache()
    return flight_plan
