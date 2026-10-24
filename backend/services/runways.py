import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

RUNWAYS_PATH = Path(__file__).resolve().parent.parent / "data" / "runways.csv"
LIGHTED = "1"

@dataclass(frozen=True)
class RunwayEnd:
    ident: str
    latitude: float
    longitude: float

@dataclass(frozen=True)
class Runway:
    airport: str
    low: RunwayEnd
    high: RunwayEnd
    length_ft: Optional[int]
    width_ft: Optional[int]
    surface: str
    lighted: bool

@dataclass(frozen=True)
class Bounds:
    south: float
    west: float
    north: float
    east: float

def _optional_int(value: str) -> Optional[int]:
    if not value:
        return None
    return int(value)

def _runway(row: dict) -> Runway:
    return Runway(
        airport=row["airport_ident"],
        low=RunwayEnd(row["le_ident"], float(row["le_latitude_deg"]), float(row["le_longitude_deg"])),
        high=RunwayEnd(row["he_ident"], float(row["he_latitude_deg"]), float(row["he_longitude_deg"])),
        length_ft=_optional_int(row["length_ft"]),
        width_ft=_optional_int(row["width_ft"]),
        surface=row["surface"],
        lighted=row["lighted"] == LIGHTED,
    )

@lru_cache(maxsize=1)
def _all_runways() -> List[Runway]:
    try:
        with RUNWAYS_PATH.open(encoding="utf-8", newline="") as source:
            return [_runway(row) for row in csv.DictReader(source)]
    except OSError:
        return []

def _longitude_inside(longitude: float, bounds: Bounds) -> bool:
    if bounds.west <= bounds.east:
        return bounds.west <= longitude <= bounds.east
    return longitude >= bounds.west or longitude <= bounds.east

def _end_inside(end: RunwayEnd, bounds: Bounds) -> bool:
    return bounds.south <= end.latitude <= bounds.north and _longitude_inside(end.longitude, bounds)

def runways_in_bounds(bounds: Bounds, limit: int) -> List[Runway]:
    matches = [runway for runway in _all_runways() if _end_inside(runway.low, bounds) or _end_inside(runway.high, bounds)]
    return matches[:limit]
