from typing import List
from fastapi import APIRouter, Query
from schemas.runways import RunwayRead
from services.runways import Bounds, runways_in_bounds

router = APIRouter(prefix="/runways", tags=["Runways"])

MAX_RUNWAYS = 2000

@router.get("", response_model=List[RunwayRead])
def get_runways(
    south: float = Query(ge=-90, le=90),
    west: float = Query(ge=-180, le=180),
    north: float = Query(ge=-90, le=90),
    east: float = Query(ge=-180, le=180),
):
    return runways_in_bounds(Bounds(south=south, west=west, north=north, east=east), MAX_RUNWAYS)
