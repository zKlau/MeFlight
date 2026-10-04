from dataclasses import dataclass, field
from typing import List
from services.geo import Coordinate, distance_to_leg_m, haversine_m
from services.telemetry_samples import TelemetrySample

LEG_LOOKAHEAD = 3

@dataclass
class RouteFollowing:
    current_leg_index: int = 0
    progress_m: float = 0.0
    deviations_m: List[float] = field(default_factory=list)

def leg_lengths_m(route: List[Coordinate]) -> List[float]:
    return [haversine_m(start, end) for start, end in zip(route, route[1:])]

def _leg_offsets_m(lengths: List[float]) -> List[float]:
    offsets = [0.0]
    for length in lengths[:-1]:
        offsets.append(offsets[-1] + length)
    return offsets

def follow_route(route: List[Coordinate], samples: List[TelemetrySample]) -> RouteFollowing:
    result = RouteFollowing()
    lengths = leg_lengths_m(route)

    if not lengths:
        return result

    offsets = _leg_offsets_m(lengths)
    last_leg_index = len(lengths) - 1

    for sample in samples:
        candidates = range(result.current_leg_index, min(result.current_leg_index + LEG_LOOKAHEAD, last_leg_index) + 1)
        distance_m, along_m, leg_index = min(
            (*distance_to_leg_m(sample.position, route[index], route[index + 1]), index) for index in candidates
        )
        result.current_leg_index = leg_index
        result.progress_m = max(result.progress_m, offsets[leg_index] + along_m)

        if not sample.on_ground:
            result.deviations_m.append(distance_m)

    return result
