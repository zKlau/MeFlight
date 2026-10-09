from typing import Dict
from fastapi import APIRouter, HTTPException, Query, status
from schemas.flight_plan import AirportRead
from services.airports import airport_by_ident, airport_names

router = APIRouter(prefix="/airports", tags=["Airports"])

IDENT_SEPARATOR = ","
MAX_IDENTS = 500
NOT_FOUND_DETAIL = "Unknown airport"

@router.get("/names", response_model=Dict[str, str])
def get_airport_names(idents: str = Query(default="", description="Comma separated ICAO codes")):
    requested = [ident.strip().upper() for ident in idents.split(IDENT_SEPARATOR) if ident.strip()]
    return airport_names(requested[:MAX_IDENTS])

@router.get("/{ident}", response_model=AirportRead)
def get_airport(ident: str):
    airport = airport_by_ident(ident)
    if airport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND_DETAIL)
    return AirportRead(ident=airport.ident, name=airport.name, latitude=airport.latitude, longitude=airport.longitude)
