from datetime import timedelta
from typing import List, Optional
import uuid
from schemas.telemetry import TrackPoint, TrackResponse
from services.geo import haversine_m, meters_to_nm
from services.telemetry_samples import TelemetrySample, parse_altitude

DISTANCE_DECIMALS = 1
SEGMENT_GAP = timedelta(minutes=10)

def is_same_segment(previous: TelemetrySample, sample: TelemetrySample) -> bool:
    return sample.created_at - previous.created_at <= SEGMENT_GAP

def _starts_segment(sample: TelemetrySample, previous: Optional[TelemetrySample]) -> bool:
    return previous is None or not is_same_segment(previous, sample)

def count_segments(samples: List[TelemetrySample]) -> int:
    previous_samples = [None, *samples[:-1]]
    return sum(1 for sample, previous in zip(samples, previous_samples) if _starts_segment(sample, previous))

def _is_segment_boundary(samples: List[TelemetrySample], index: int) -> bool:
    if index == 0 or index == len(samples) - 1:
        return True
    sample = samples[index]
    return _starts_segment(sample, samples[index - 1]) or _starts_segment(samples[index + 1], sample)

def thin_out(samples: List[TelemetrySample], min_distance_m: float) -> List[TelemetrySample]:
    kept: List[TelemetrySample] = []

    for index, sample in enumerate(samples):
        if _is_segment_boundary(samples, index) or haversine_m(kept[-1].position, sample.position) >= min_distance_m:
            kept.append(sample)

    return kept

def flown_distance_m(samples: List[TelemetrySample]) -> float:
    return sum(
        haversine_m(previous.position, sample.position)
        for previous, sample in zip(samples, samples[1:])
        if is_same_segment(previous, sample)
    )

def _to_track_point(sample: TelemetrySample, previous: Optional[TelemetrySample]) -> TrackPoint:
    return TrackPoint(
        lat=sample.latitude,
        lon=sample.longitude,
        altitude=parse_altitude(sample.altitude),
        airspeed=sample.airspeed,
        heading=sample.heading,
        on_ground=sample.on_ground,
        new_segment=_starts_segment(sample, previous),
        timestamp=sample.created_at,
    )

def build_track(samples: List[TelemetrySample], flightplan_id: Optional[uuid.UUID]) -> TrackResponse:
    previous_samples = [None, *samples[:-1]]
    return TrackResponse(
        flightplan_id=flightplan_id,
        started_at=samples[0].created_at if samples else None,
        total_points=len(samples),
        distance_nm=round(meters_to_nm(flown_distance_m(samples)), DISTANCE_DECIMALS),
        points=[_to_track_point(sample, previous) for sample, previous in zip(samples, previous_samples)],
    )
