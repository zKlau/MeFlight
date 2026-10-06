from datetime import datetime, timedelta, timezone
from typing import List
from sqlmodel import Session
from schemas.widgets import SessionResponse
from services.geo import meters_to_nm
from services.telemetry_samples import TelemetrySample, latest_samples_newest_first
from services.track_builder import SEGMENT_GAP, flown_distance_m, is_same_segment

MAX_SESSION_RECORDS = 100_000
DISTANCE_DECIMALS = 1

def _current_segment(newest_first: List[TelemetrySample]) -> List[TelemetrySample]:
    segment: List[TelemetrySample] = []
    for sample in newest_first:
        if segment and not is_same_segment(sample, segment[-1]):
            break
        segment.append(sample)
    segment.reverse()
    return [sample for sample in segment if sample.is_placed]

def _airborne_seconds(segment: List[TelemetrySample]) -> int:
    total = timedelta()
    for previous, sample in zip(segment, segment[1:]):
        if not (previous.on_ground and sample.on_ground):
            total += sample.created_at - previous.created_at
    return int(total.total_seconds())

def _as_utc(moment: datetime) -> datetime:
    if moment.tzinfo is None:
        return moment.replace(tzinfo=timezone.utc)
    return moment

def current_session(session: Session) -> SessionResponse:
    segment = _current_segment(latest_samples_newest_first(session, MAX_SESSION_RECORDS))

    if not segment:
        return SessionResponse(active=False, distance_nm=0, airborne_seconds=0)

    last_seen = _as_utc(segment[-1].created_at)
    return SessionResponse(
        active=datetime.now(timezone.utc) - last_seen <= SEGMENT_GAP,
        flightplan_id=segment[-1].flightplan_id,
        started_at=segment[0].created_at,
        last_seen_at=segment[-1].created_at,
        distance_nm=round(meters_to_nm(flown_distance_m(segment)), DISTANCE_DECIMALS),
        airborne_seconds=_airborne_seconds(segment),
    )
