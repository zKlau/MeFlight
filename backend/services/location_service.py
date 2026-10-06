from typing import Optional
from schemas.telemetry import NearestAirportRead
from schemas.widgets import CountryRead, LocationResponse
from services.airports import nearest_airport
from services.countries import country_index
from services.geo import Coordinate

DISTANCE_DECIMALS = 1

def _country(position: Coordinate) -> Optional[CountryRead]:
    country = country_index().locate(position)
    if country is None:
        return None
    return CountryRead(code=country.code, name=country.name)

def _airport(position: Coordinate) -> Optional[NearestAirportRead]:
    nearby = nearest_airport(position)
    if nearby is None:
        return None
    return NearestAirportRead(
        ident=nearby.airport.ident,
        name=nearby.airport.name,
        distance_nm=round(nearby.distance_nm, DISTANCE_DECIMALS),
    )

def locate(position: Coordinate) -> LocationResponse:
    return LocationResponse(country=_country(position), nearest_airport=_airport(position))
