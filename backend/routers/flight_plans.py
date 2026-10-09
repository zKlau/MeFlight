from typing import Any, Dict, List, Optional
import uuid
from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, Request, Response, UploadFile, status
from sqlmodel import Session
from database import get_session
from models.flight_telemetry import FlightTelemetry
from schemas.progress import FlightPlanProgressResponse
from schemas.telemetry import LastStateResponse, TrackResponse
from services.flight_state_service import get_flight_plan_last_state, get_flight_plan_track
from schemas.countries import CountriesResponse
from services.countries_service import get_flight_plan_countries
from services.progress_service import get_flight_plan_progress
from services.result_cache import cached_until_new_telemetry
from services.route_editing import replace_waypoints
from services.telemetry_payload import parse_telemetry
from schemas.flight_plan import (
    FlightPlanRead,
    FlightPlanRouteResponse,
    FlightPlanPathResponse,
    WaypointRead,
    WaypointsUpdate,
)
from security import verify_api_key
from services.flight_plan_service import (
    create_flight_plan_from_pln,
    get_flight_plan_or_404,
    list_flight_plans,
    delete_flight_plan,
    get_flight_plan_route,
    add_flight_plan_telemetry,
    get_flight_plan_telemetry,
    get_flight_plan_path,
)

router = APIRouter(prefix="/flightplans", tags=["Flight Plans"])

DEFAULT_PLAN_TRACK_MIN_DISTANCE_M = 100
PLAN_TRACK_CACHE_SCOPE = "plan-track"
PROGRESS_CACHE_SCOPE = "progress"

def _to_flight_plan_read(flight_plan) -> FlightPlanRead:
    waypoints = [WaypointRead.model_validate(wp) for wp in flight_plan.waypoints] if flight_plan.waypoints else []
    return FlightPlanRead(
        id=flight_plan.id,
        title=flight_plan.title,
        description=flight_plan.description,
        flight_plan_type=flight_plan.flight_plan_type,
        route_type=flight_plan.route_type,
        cruising_altitude=flight_plan.cruising_altitude,
        departure_id=flight_plan.departure_id,
        departure_name=flight_plan.departure_name,
        destination_id=flight_plan.destination_id,
        destination_name=flight_plan.destination_name,
        total_waypoints=len(waypoints),
        created_at=flight_plan.created_at,
        updated_at=flight_plan.updated_at,
        waypoints=waypoints,
    )

@router.post(
    "/upload",
    response_model=FlightPlanRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_api_key)],
)
async def upload_flight_plan(
    request: Request,
    file: Optional[UploadFile] = File(default=None),
    session: Session = Depends(get_session),
):
    xml_content = None

    if file is not None:
        content_bytes = await file.read()
        xml_content = content_bytes.decode("utf-8", errors="replace")
    else:
        body_bytes = await request.body()
        if body_bytes:
            xml_content = body_bytes.decode("utf-8", errors="replace")

    if not xml_content or not xml_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No flight plan PLN XML content provided. Upload a file or send XML body.",
        )

    try:
        flight_plan = create_flight_plan_from_pln(session, xml_content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_flight_plan_read(flight_plan)

@router.get("", response_model=List[FlightPlanRead])
def get_flight_plans(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
):
    plans = list_flight_plans(session, skip=skip, limit=limit)
    return [_to_flight_plan_read(p) for p in plans]

@router.get("/{flightplan_id}", response_model=FlightPlanRead)
def get_single_flight_plan(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    plan = get_flight_plan_or_404(session, flightplan_id)
    return _to_flight_plan_read(plan)

@router.delete(
    "/{flightplan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_api_key)],
)
def remove_flight_plan(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    deleted = delete_flight_plan(session, flightplan_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight plan with ID {flightplan_id} not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.put(
    "/{flightplan_id}/waypoints",
    response_model=FlightPlanRead,
    dependencies=[Depends(verify_api_key)],
)
def update_flight_plan_waypoints(
    flightplan_id: uuid.UUID,
    payload: WaypointsUpdate,
    session: Session = Depends(get_session),
):
    return _to_flight_plan_read(replace_waypoints(session, flightplan_id, payload.waypoints))

@router.get("/{flightplan_id}/route", response_model=FlightPlanRouteResponse)
@router.get("/{flightplan_id}/points", response_model=FlightPlanRouteResponse)
def get_flight_plan_route_points(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    return get_flight_plan_route(session, flightplan_id)

@router.post(
    "/{flightplan_id}/telemetry",
    response_model=FlightTelemetry,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_api_key)],
)
def record_flight_plan_telemetry(
    flightplan_id: uuid.UUID,
    payload: Dict[str, Any] = Body(...),
    session: Session = Depends(get_session),
):
    return add_flight_plan_telemetry(session, flightplan_id, parse_telemetry(payload))

@router.get("/{flightplan_id}/telemetry", response_model=List[FlightTelemetry])
def fetch_flight_plan_telemetry(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    return get_flight_plan_telemetry(session, flightplan_id)

@router.get("/{flightplan_id}/track", response_model=TrackResponse)
def fetch_flight_plan_track(
    flightplan_id: uuid.UUID,
    min_distance_m: float = Query(default=DEFAULT_PLAN_TRACK_MIN_DISTANCE_M, ge=0),
    session: Session = Depends(get_session),
):
    return cached_until_new_telemetry(
        session,
        (PLAN_TRACK_CACHE_SCOPE, min_distance_m),
        flightplan_id,
        lambda: get_flight_plan_track(session, flightplan_id, min_distance_m),
    )

@router.get("/{flightplan_id}/progress", response_model=FlightPlanProgressResponse)
def fetch_flight_plan_progress(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    return cached_until_new_telemetry(
        session,
        PROGRESS_CACHE_SCOPE,
        flightplan_id,
        lambda: get_flight_plan_progress(session, flightplan_id),
    )

@router.get("/{flightplan_id}/countries", response_model=CountriesResponse)
def fetch_flight_plan_countries(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    return get_flight_plan_countries(session, flightplan_id)

@router.get("/{flightplan_id}/last-state", response_model=LastStateResponse)
def fetch_flight_plan_last_state(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    return get_flight_plan_last_state(session, flightplan_id)

@router.get("/{flightplan_id}/path", response_model=FlightPlanPathResponse)
def fetch_flight_plan_path(
    flightplan_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    return get_flight_plan_path(session, flightplan_id)

