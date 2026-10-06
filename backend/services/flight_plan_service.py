from typing import Optional, List
import uuid
from fastapi import HTTPException, status
from sqlmodel import Session, delete, select
from models.flight_plan import FlightPlan, FlightPlanWaypoint
from models.flight_telemetry import FlightTelemetry
from schemas.flight_plan import (
    WaypointRead,
    FlightPlanRouteResponse,
    FlightPlanPathResponse,
)
from services.landing_service import delete_plan_landings
from services.pln_parser import parse_msfs_pln

def create_flight_plan_from_pln(
    session: Session,
    xml_content: str | bytes,
) -> FlightPlan:
    parsed = parse_msfs_pln(xml_content)

    flight_plan = FlightPlan(
        title=parsed.title,
        description=parsed.description,
        flight_plan_type=parsed.flight_plan_type,
        route_type=parsed.route_type,
        cruising_altitude=parsed.cruising_altitude,
        departure_id=parsed.departure_id,
        departure_name=parsed.departure_name,
        destination_id=parsed.destination_id,
        destination_name=parsed.destination_name,
    )
    session.add(flight_plan)
    session.flush()

    for wp in parsed.waypoints:
        waypoint_record = FlightPlanWaypoint(
            flight_plan_id=flight_plan.id,
            order_index=wp.order_index,
            identifier=wp.identifier,
            waypoint_type=wp.waypoint_type,
            latitude=wp.latitude,
            longitude=wp.longitude,
            altitude=wp.altitude,
            world_position=wp.world_position,
        )
        session.add(waypoint_record)

    session.commit()
    session.refresh(flight_plan)
    return flight_plan

def get_flight_plan(
    session: Session,
    flightplan_id: uuid.UUID,
) -> Optional[FlightPlan]:
    statement = select(FlightPlan).where(FlightPlan.id == flightplan_id)
    return session.exec(statement).first()

def get_flight_plan_or_404(
    session: Session,
    flightplan_id: uuid.UUID,
) -> FlightPlan:
    flight_plan = get_flight_plan(session, flightplan_id)
    if not flight_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight plan with ID {flightplan_id} not found",
        )
    return flight_plan

def list_flight_plans(
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> List[FlightPlan]:
    statement = (
        select(FlightPlan)
        .order_by(FlightPlan.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())

def delete_flight_plan(
    session: Session,
    flightplan_id: uuid.UUID,
) -> bool:
    flight_plan = get_flight_plan(session, flightplan_id)
    if not flight_plan:
        return False
    session.exec(delete(FlightTelemetry).where(FlightTelemetry.flightplan_id == flightplan_id))
    delete_plan_landings(session, flightplan_id)
    session.delete(flight_plan)
    session.commit()
    return True

def get_flight_plan_route(
    session: Session,
    flightplan_id: uuid.UUID,
) -> FlightPlanRouteResponse:
    flight_plan = get_flight_plan_or_404(session, flightplan_id)
    statement = (
        select(FlightPlanWaypoint)
        .where(FlightPlanWaypoint.flight_plan_id == flightplan_id)
        .order_by(FlightPlanWaypoint.order_index.asc())
    )
    waypoints = list(session.exec(statement).all())

    points = [WaypointRead.model_validate(wp) for wp in waypoints]
    coordinates = [[wp.latitude, wp.longitude] for wp in waypoints]

    return FlightPlanRouteResponse(
        flightplan_id=flight_plan.id,
        title=flight_plan.title,
        departure_id=flight_plan.departure_id,
        destination_id=flight_plan.destination_id,
        total_points=len(points),
        coordinates=coordinates,
        points=points,
    )

def add_flight_plan_telemetry(
    session: Session,
    flightplan_id: uuid.UUID,
    telemetry: FlightTelemetry,
) -> FlightTelemetry:
    get_flight_plan_or_404(session, flightplan_id)
    telemetry.flightplan_id = flightplan_id
    if not telemetry.status:
        telemetry.status = "success"
    session.add(telemetry)
    session.commit()
    session.refresh(telemetry)
    return telemetry

def get_flight_plan_telemetry(
    session: Session,
    flightplan_id: uuid.UUID,
) -> List[FlightTelemetry]:
    get_flight_plan_or_404(session, flightplan_id)
    statement = (
        select(FlightTelemetry)
        .where(FlightTelemetry.flightplan_id == flightplan_id)
        .order_by(FlightTelemetry.created_at.asc(), FlightTelemetry.id.asc())
    )
    return list(session.exec(statement).all())

def get_flight_plan_path(
    session: Session,
    flightplan_id: uuid.UUID,
) -> FlightPlanPathResponse:
    telemetry_list = get_flight_plan_telemetry(session, flightplan_id)
    coordinates = [[t.latitude, t.longitude] for t in telemetry_list]

    return FlightPlanPathResponse(
        flightplan_id=flightplan_id,
        total_points=len(telemetry_list),
        coordinates=coordinates,
        telemetry=telemetry_list,
    )

