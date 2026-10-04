from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models.flight_telemetry import FlightTelemetry
from security import verify_api_key

router = APIRouter(tags=["Telemetry"])

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
    record: FlightTelemetry,
    session: Session = Depends(get_session),
):
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

