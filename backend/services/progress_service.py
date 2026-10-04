from datetime import timedelta
from typing import List, Optional
import uuid
from sqlmodel import Session
from models.flight_plan import FlightPlanWaypoint
from schemas.progress import FlightPlanProgressResponse, VisitedAirport
from services.flight_plan_service import get_flight_plan_or_404
from services.geo import Coordinate, haversine_m, meters_to_nm
from services.route_following import follow_route, leg_lengths_m
from services.telemetry_samples import TelemetrySample, flight_plan_samples
from services.track_builder import count_segments, flown_distance_m, is_same_segment, thin_out

AIRPORT_WAYPOINT_TYPE = "Airport"
AIRPORT_VISIT_RADIUS_NM = 3.0
PROGRESS_MIN_DISTANCE_M = 200
DISTANCE_DECIMALS = 1
PERCENT = 100

def _visited_airports(waypoints: List[FlightPlanWaypoint], samples: List[TelemetrySample]) -> List[VisitedAirport]:
    ground_samples = [sample for sample in samples if sample.on_ground]
    visited = []
    search_from = 0

    for waypoint in waypoints:
        if waypoint.waypoint_type != AIRPORT_WAYPOINT_TYPE:
            continue
        match_index = _first_sample_near(ground_samples, (waypoint.latitude, waypoint.longitude), search_from)
        if match_index is None:
            continue
        search_from = match_index + 1
        visited.append(VisitedAirport(
            order_index=waypoint.order_index,
            identifier=waypoint.identifier,
            visited_at=ground_samples[match_index].created_at,
        ))

    return visited

def _first_sample_near(samples: List[TelemetrySample], position: Coordinate, start: int) -> Optional[int]:
    for index in range(start, len(samples)):
        if meters_to_nm(haversine_m(position, samples[index].position)) <= AIRPORT_VISIT_RADIUS_NM:
            return index
    return None

def _seconds(samples: List[TelemetrySample], airborne_only: bool) -> int:
    total = timedelta()
    for previous, sample in zip(samples, samples[1:]):
        counts = not airborne_only or not (previous.on_ground and sample.on_ground)
        if is_same_segment(previous, sample) and counts:
            total += sample.created_at - previous.created_at
    return int(total.total_seconds())

def _percent(part: float, whole: float) -> float:
    if whole == 0:
        return 0.0
    return round(min(PERCENT, part / whole * PERCENT), DISTANCE_DECIMALS)

def _nm(meters: float) -> float:
    return round(meters_to_nm(meters), DISTANCE_DECIMALS)

def get_flight_plan_progress(session: Session, flightplan_id: uuid.UUID) -> FlightPlanProgressResponse:
    flight_plan = get_flight_plan_or_404(session, flightplan_id)
    waypoints = sorted(flight_plan.waypoints, key=lambda waypoint: waypoint.order_index)
    route = [(waypoint.latitude, waypoint.longitude) for waypoint in waypoints]
    planned_m = sum(leg_lengths_m(route))

    samples = flight_plan_samples(session, flightplan_id)
    thinned = thin_out(samples, PROGRESS_MIN_DISTANCE_M)
    following = follow_route(route, thinned)
    deviations = following.deviations_m

    return FlightPlanProgressResponse(
        flightplan_id=flightplan_id,
        planned_distance_nm=_nm(planned_m),
        flown_distance_nm=_nm(flown_distance_m(thinned)),
        completion_percent=_percent(following.progress_m, planned_m),
        current_leg_index=following.current_leg_index,
        total_legs=max(len(route) - 1, 0),
        average_deviation_nm=_nm(sum(deviations) / len(deviations)) if deviations else 0.0,
        max_deviation_nm=_nm(max(deviations, default=0.0)),
        airborne_seconds=_seconds(samples, airborne_only=True),
        recorded_seconds=_seconds(samples, airborne_only=False),
        sessions=count_segments(samples),
        airports_total=sum(1 for waypoint in waypoints if waypoint.waypoint_type == AIRPORT_WAYPOINT_TYPE),
        airports_visited=_visited_airports(waypoints, thinned),
        first_flown_at=samples[0].created_at if samples else None,
        last_flown_at=samples[-1].created_at if samples else None,
    )
