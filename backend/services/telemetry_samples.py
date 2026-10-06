from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
import uuid
from sqlmodel import Session, select
from models.flight_telemetry import FlightTelemetry
from services.geo import Coordinate

THOUSANDS_SEPARATOR = ","
MISSING_COORDINATE = 0.0

@dataclass(frozen=True)
class TelemetrySample:
    session_id: uuid.UUID
    flightplan_id: Optional[uuid.UUID]
    created_at: datetime
    latitude: float
    longitude: float
    altitude: str
    airspeed: float
    heading: float
    on_ground: bool

    @property
    def position(self) -> Coordinate:
        return (self.latitude, self.longitude)

    @property
    def is_placed(self) -> bool:
        return self.latitude != MISSING_COORDINATE and self.longitude != MISSING_COORDINATE

def parse_altitude(value: str | float | None) -> float:
    if value is None:
        return 0.0
    try:
        return float(str(value).replace(THOUSANDS_SEPARATOR, ""))
    except ValueError:
        return 0.0

def _sample_statement():
    return select(
        FlightTelemetry.session_id,
        FlightTelemetry.flightplan_id,
        FlightTelemetry.created_at,
        FlightTelemetry.latitude,
        FlightTelemetry.longitude,
        FlightTelemetry.altitude,
        FlightTelemetry.airspeed_indicate,
        FlightTelemetry.magnetic_compass,
        FlightTelemetry.sim_on_ground,
    )

def _to_samples(rows) -> List[TelemetrySample]:
    return [TelemetrySample(*row) for row in rows]

def latest_samples_newest_first(session: Session, max_records: int) -> List[TelemetrySample]:
    statement = (
        _sample_statement()
        .order_by(FlightTelemetry.created_at.desc(), FlightTelemetry.id.desc())
        .limit(max_records)
    )
    return _to_samples(session.exec(statement).all())

def flight_plan_samples(session: Session, flightplan_id: uuid.UUID) -> List[TelemetrySample]:
    statement = (
        _sample_statement()
        .where(FlightTelemetry.flightplan_id == flightplan_id)
        .order_by(FlightTelemetry.created_at.asc(), FlightTelemetry.id.asc())
    )
    return [sample for sample in _to_samples(session.exec(statement).all()) if sample.is_placed]

def all_samples(session: Session) -> List[TelemetrySample]:
    statement = _sample_statement().order_by(FlightTelemetry.created_at.asc(), FlightTelemetry.id.asc())
    return [sample for sample in _to_samples(session.exec(statement).all()) if sample.is_placed]
