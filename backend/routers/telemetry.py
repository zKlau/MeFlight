from datetime import timedelta
from typing import Any, Dict, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from database import get_session
from models.flight_telemetry import FlightTelemetry
from schemas.telemetry import TrackResponse
from security import verify_api_key
from services.telemetry_payload import parse_telemetry
from services.track_service import get_current_track

router = APIRouter(tags=["Telemetry"])

DEFAULT_MAX_GAP_MINUTES = 10
DEFAULT_MIN_DISTANCE_M = 25
DEFAULT_MAX_RECORDS = 50_000
MAX_RECORDS_LIMIT = 200_000
MAX_GAP_DESCRIPTION = "A pause longer than this starts a new flight"
MIN_DISTANCE_DESCRIPTION = "Drop points closer than this to the previous one"

@router.post(
    "/live",
    response_model=FlightTelemetry,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_api_key)],
)
@router.post(
    "/telemetry",
    response_model=FlightTelemetry,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_api_key)],
)
def write_telemetry(
    payload: Dict[str, Any] = Body(...),
    session: Session = Depends(get_session),
):
    record = parse_telemetry(payload)
    if not record.status:
        record.status = "success"
    session.add(record)
    session.commit()
    session.refresh(record)
    return record

@router.get("/live", response_model=FlightTelemetry)
def get_latest_telemetry(
    session: Session = Depends(get_session),
):
    statement = select(FlightTelemetry).order_by(FlightTelemetry.created_at.desc()).limit(1)
    latest = session.exec(statement).first()
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data recorded yet",
        )
    return latest

@router.get("/track", response_model=TrackResponse)
def get_track(
    max_gap_minutes: float = Query(default=DEFAULT_MAX_GAP_MINUTES, gt=0, description=MAX_GAP_DESCRIPTION),
    min_distance_m: float = Query(default=DEFAULT_MIN_DISTANCE_M, ge=0, description=MIN_DISTANCE_DESCRIPTION),
    max_records: int = Query(default=DEFAULT_MAX_RECORDS, gt=0, le=MAX_RECORDS_LIMIT),
    session: Session = Depends(get_session),
):
    return get_current_track(
        session,
        max_gap=timedelta(minutes=max_gap_minutes),
        min_distance_m=min_distance_m,
        max_records=max_records,
    )

