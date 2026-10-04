from datetime import timedelta
from math import asin, cos, radians, sin, sqrt
from typing import List, Sequence
from sqlmodel import Session, select
from models.flight_telemetry import FlightTelemetry
from schemas.telemetry import TrackPoint, TrackResponse

EARTH_RADIUS_M = 6_371_000
METERS_PER_NM = 1852
DISTANCE_DECIMALS = 1
THOUSANDS_SEPARATOR = ","
UNPLACED_LATITUDE = 0
UNPLACED_LONGITUDE = 0

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(sqrt(a))

def parse_altitude(value: str | float | None) -> float:
    if value is None:
        return 0.0
    try:
        return float(str(value).replace(THOUSANDS_SEPARATOR, ""))
    except ValueError:
        return 0.0

def _distance_between(start: FlightTelemetry, end: FlightTelemetry) -> float:
    return haversine_m(start.latitude, start.longitude, end.latitude, end.longitude)

def _is_placed(record: FlightTelemetry) -> bool:
    return not (record.latitude == UNPLACED_LATITUDE and record.longitude == UNPLACED_LONGITUDE)

def _latest_records(session: Session, max_records: int) -> Sequence[FlightTelemetry]:
    statement = (
        select(FlightTelemetry)
        .order_by(FlightTelemetry.created_at.desc(), FlightTelemetry.id.desc())
        .limit(max_records)
    )
    return session.exec(statement).all()

def _latest_flight(newest_first: Sequence[FlightTelemetry], max_gap: timedelta) -> List[FlightTelemetry]:
    flight: List[FlightTelemetry] = []
    for record in newest_first:
        if flight and flight[-1].created_at - record.created_at > max_gap:
            break
        flight.append(record)
    flight.reverse()
    return [record for record in flight if _is_placed(record)]

def _thin_out(flight: List[FlightTelemetry], min_distance_m: float) -> List[FlightTelemetry]:
    if not flight:
        return []

    kept = [flight[0]]
    for record in flight[1:-1]:
        if _distance_between(kept[-1], record) >= min_distance_m:
            kept.append(record)

    if len(flight) > 1:
        kept.append(flight[-1])
    return kept

def _total_distance_nm(records: List[FlightTelemetry]) -> float:
    distance_m = sum(_distance_between(start, end) for start, end in zip(records, records[1:]))
    return round(distance_m / METERS_PER_NM, DISTANCE_DECIMALS)

def _to_track_point(record: FlightTelemetry) -> TrackPoint:
    return TrackPoint(
        lat=record.latitude,
        lon=record.longitude,
        altitude=parse_altitude(record.altitude),
        airspeed=record.airspeed_indicate,
        heading=record.magnetic_compass,
        timestamp=record.created_at,
    )

def get_current_track(
    session: Session,
    max_gap: timedelta,
    min_distance_m: float,
    max_records: int,
) -> TrackResponse:
    flight = _latest_flight(_latest_records(session, max_records), max_gap)
    kept = _thin_out(flight, min_distance_m)

    if not kept:
        return TrackResponse(total_points=0, distance_nm=0, points=[])

    return TrackResponse(
        flightplan_id=kept[-1].flightplan_id,
        started_at=kept[0].created_at,
        total_points=len(kept),
        distance_nm=_total_distance_nm(kept),
        points=[_to_track_point(record) for record in kept],
    )
