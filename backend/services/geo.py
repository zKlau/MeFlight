from math import acos, asin, atan2, cos, radians, sin, sqrt
from typing import Tuple

EARTH_RADIUS_M = 6_371_000
METERS_PER_NM = 1852

Coordinate = Tuple[float, float]

def haversine_m(start: Coordinate, end: Coordinate) -> float:
    lat1, lon1 = map(radians, start)
    lat2, lon2 = map(radians, end)
    a = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(min(1.0, sqrt(a)))

def initial_bearing_rad(start: Coordinate, end: Coordinate) -> float:
    lat1, lon1 = map(radians, start)
    lat2, lon2 = map(radians, end)
    y = sin(lon2 - lon1) * cos(lat2)
    x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(lon2 - lon1)
    return atan2(y, x)

def _clamp_unit(value: float) -> float:
    return max(-1.0, min(1.0, value))

def distance_to_leg_m(point: Coordinate, leg_start: Coordinate, leg_end: Coordinate) -> Tuple[float, float]:
    leg_length_m = haversine_m(leg_start, leg_end)
    start_to_point_m = haversine_m(leg_start, point)

    if leg_length_m == 0:
        return start_to_point_m, 0.0

    angular_start_to_point = start_to_point_m / EARTH_RADIUS_M
    bearing_delta = initial_bearing_rad(leg_start, point) - initial_bearing_rad(leg_start, leg_end)
    angular_cross_track = asin(_clamp_unit(sin(angular_start_to_point) * sin(bearing_delta)))
    angular_along_track = acos(_clamp_unit(cos(angular_start_to_point) / cos(angular_cross_track)))

    if cos(bearing_delta) < 0:
        angular_along_track = -angular_along_track

    along_track_m = angular_along_track * EARTH_RADIUS_M

    if along_track_m < 0:
        return start_to_point_m, 0.0

    if along_track_m > leg_length_m:
        return haversine_m(leg_end, point), leg_length_m

    return abs(angular_cross_track) * EARTH_RADIUS_M, along_track_m

def meters_to_nm(meters: float) -> float:
    return meters / METERS_PER_NM
