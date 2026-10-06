from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
import uuid
from schemas.countries import CountriesResponse, CountryVisit
from services.airports import nearest_airport
from services.countries import Country, country_index
from services.geo import Coordinate
from services.telemetry_samples import TelemetrySample
from services.track_builder import thin_out

COUNTRY_SAMPLE_SPACING_M = 2000
LANDING_AIRPORT_RADIUS_NM = 3.0
GROUND_CELL_DECIMALS = 2

@dataclass
class _Visit:
    country: Country
    landed: bool
    first_visited_at: datetime

def _remember(visits: Dict[str, _Visit], country: Optional[Country], at: datetime, landed: bool) -> None:
    if country is None:
        return

    visit = visits.get(country.code)
    if visit is None:
        visits[country.code] = _Visit(country=country, landed=landed, first_visited_at=at)
        return

    visit.landed = visit.landed or landed
    visit.first_visited_at = min(visit.first_visited_at, at)

def _ground_cells(samples: List[TelemetrySample]) -> Dict[Coordinate, datetime]:
    cells: Dict[Coordinate, datetime] = {}
    for sample in samples:
        if not sample.on_ground:
            continue
        cell = (round(sample.latitude, GROUND_CELL_DECIMALS), round(sample.longitude, GROUND_CELL_DECIMALS))
        cells.setdefault(cell, sample.created_at)
    return cells

def _landing_country(cell: Coordinate) -> Optional[Country]:
    nearby = nearest_airport(cell)
    if nearby is None or nearby.distance_nm > LANDING_AIRPORT_RADIUS_NM:
        return None
    return country_index().by_code(nearby.airport.country)

def _to_response(visits: Dict[str, _Visit], flightplan_id: Optional[uuid.UUID]) -> CountriesResponse:
    ordered = sorted(visits.values(), key=lambda visit: visit.first_visited_at)
    landed = sum(1 for visit in ordered if visit.landed)
    return CountriesResponse(
        flightplan_id=flightplan_id,
        total=len(ordered),
        landed=landed,
        flown_over=len(ordered) - landed,
        countries=[
            CountryVisit(
                code=visit.country.code,
                name=visit.country.name,
                landed=visit.landed,
                first_visited_at=visit.first_visited_at,
            )
            for visit in ordered
        ],
    )

def countries_visited(samples: List[TelemetrySample], flightplan_id: Optional[uuid.UUID]) -> CountriesResponse:
    index = country_index()
    visits: Dict[str, _Visit] = {}

    for sample in thin_out(samples, COUNTRY_SAMPLE_SPACING_M):
        _remember(visits, index.locate(sample.position), sample.created_at, landed=False)

    for cell, at in _ground_cells(samples).items():
        _remember(visits, _landing_country(cell), at, landed=True)

    return _to_response(visits, flightplan_id)
