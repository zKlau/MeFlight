from datetime import timedelta
from typing import List
from sqlmodel import Session
from schemas.telemetry import TrackResponse
from services.telemetry_samples import TelemetrySample, latest_samples_newest_first
from services.track_builder import build_track, thin_out

def _latest_flight(newest_first: List[TelemetrySample], max_gap: timedelta) -> List[TelemetrySample]:
    flight: List[TelemetrySample] = []
    for sample in newest_first:
        if flight and flight[-1].created_at - sample.created_at > max_gap:
            break
        flight.append(sample)
    flight.reverse()
    return [sample for sample in flight if sample.is_placed]

def get_current_track(
    session: Session,
    max_gap: timedelta,
    min_distance_m: float,
    max_records: int,
) -> TrackResponse:
    flight = _latest_flight(latest_samples_newest_first(session, max_records), max_gap)
    kept = thin_out(flight, min_distance_m)
    flightplan_id = kept[-1].flightplan_id if kept else None
    return build_track(kept, flightplan_id)
