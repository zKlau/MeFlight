from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List, Optional
from services.geo import Coordinate, haversine_m, meters_to_nm

AIRPORT_CODE_TYPE = "ICAO"
SEARCH_BOX_DEGREES = 1.0

@dataclass(frozen=True)
class Airport:
    ident: str
    name: str
    latitude: float
    longitude: float

@dataclass(frozen=True)
class NearbyAirport:
    airport: Airport
    distance_nm: float

@lru_cache(maxsize=1)
def _all_airports() -> List[Airport]:
    try:
        import airportsdata
        records = airportsdata.load(AIRPORT_CODE_TYPE)
    except Exception:
        return []

    return [
        Airport(ident=ident, name=info["name"], latitude=float(info["lat"]), longitude=float(info["lon"]))
        for ident, info in records.items()
    ]

def _within_search_box(airport: Airport, position: Coordinate) -> bool:
    latitude, longitude = position
    return (
        abs(airport.latitude - latitude) <= SEARCH_BOX_DEGREES
        and abs(airport.longitude - longitude) <= SEARCH_BOX_DEGREES
    )

def nearest_airport(position: Coordinate) -> Optional[NearbyAirport]:
    candidates = [airport for airport in _all_airports() if _within_search_box(airport, position)]

    if not candidates:
        return None

    closest = min(candidates, key=lambda airport: haversine_m(position, (airport.latitude, airport.longitude)))
    distance_m = haversine_m(position, (closest.latitude, closest.longitude))
    return NearbyAirport(airport=closest, distance_nm=meters_to_nm(distance_m))

@lru_cache(maxsize=1)
def _airports_by_ident() -> Dict[str, Airport]:
    return {airport.ident: airport for airport in _all_airports()}

def airport_names(idents: List[str]) -> Dict[str, str]:
    airports = _airports_by_ident()
    return {ident: airports[ident].name for ident in idents if ident in airports}
