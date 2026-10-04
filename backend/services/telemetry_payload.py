from typing import Any, Dict
from fastapi import HTTPException, status
from pydantic import ValidationError
from models.flight_telemetry import FlightTelemetry

def parse_telemetry(payload: Dict[str, Any]) -> FlightTelemetry:
    try:
        return FlightTelemetry.model_validate(payload)
    except (ValidationError, ValueError) as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
