from typing import Dict
from fastapi import APIRouter, Query
from services.airports import airport_names

router = APIRouter(prefix="/airports", tags=["Airports"])

IDENT_SEPARATOR = ","
MAX_IDENTS = 500

@router.get("/names", response_model=Dict[str, str])
def get_airport_names(idents: str = Query(default="", description="Comma separated ICAO codes")):
    requested = [ident.strip().upper() for ident in idents.split(IDENT_SEPARATOR) if ident.strip()]
    return airport_names(requested[:MAX_IDENTS])
