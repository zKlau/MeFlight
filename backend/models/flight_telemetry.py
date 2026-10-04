from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlmodel import Field, SQLModel

class FlightTelemetry(SQLModel, table=True):
    __tablename__ = "flight_telemetry"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: uuid.UUID = Field(default_factory=uuid.uuid4, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )

    airspeed_indicate: float = Field(sa_column_kwargs={"name": "AIRSPEED_INDICATE"})
    altitude: str = Field(sa_column_kwargs={"name": "ALTITUDE"})  # e.g. "23,624"
    vertical_speed: float = Field(sa_column_kwargs={"name": "VERTICAL_SPEED"})
    latitude: float = Field(sa_column_kwargs={"name": "LATITUDE"})
    longitude: float = Field(sa_column_kwargs={"name": "LONGITUDE"})
    magnetic_compass: float = Field(sa_column_kwargs={"name": "MAGNETIC_COMPASS"})
    magvar: float = Field(sa_column_kwargs={"name": "MAGVAR"})

    autopilot_master: float = Field(sa_column_kwargs={"name": "AUTOPILOT_MASTER"})
    autopilot_airspeed_hold: float = Field(sa_column_kwargs={"name": "AUTOPILOT_AIRSPEED_HOLD"})
    autopilot_airspeed_hold_var: float = Field(sa_column_kwargs={"name": "AUTOPILOT_AIRSPEED_HOLD_VAR"})
    autopilot_altitude_lock: float = Field(sa_column_kwargs={"name": "AUTOPILOT_ALTITUDE_LOCK"})
    autopilot_altitude_lock_var: str = Field(sa_column_kwargs={"name": "AUTOPILOT_ALTITUDE_LOCK_VAR"})
    autopilot_approach_hold: float = Field(sa_column_kwargs={"name": "AUTOPILOT_APPROACH_HOLD"})
    autopilot_attitude_hold: float = Field(sa_column_kwargs={"name": "AUTOPILOT_ATTITUDE_HOLD"})
    autopilot_backcourse_hold: float = Field(sa_column_kwargs={"name": "AUTOPILOT_BACKCOURSE_HOLD"})
    autopilot_flight_director_active: float = Field(sa_column_kwargs={"name": "AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE"})
    autopilot_glideslope_hold: float = Field(sa_column_kwargs={"name": "AUTOPILOT_GLIDESLOPE_HOLD"})
    autopilot_heading_lock: float = Field(sa_column_kwargs={"name": "AUTOPILOT_HEADING_LOCK"})
    autopilot_heading_lock_dir: float = Field(sa_column_kwargs={"name": "AUTOPILOT_HEADING_LOCK_DIR"})
    autopilot_nav_selected: float = Field(sa_column_kwargs={"name": "AUTOPILOT_NAV_SELECTED"})
    autopilot_pitch_hold: float = Field(sa_column_kwargs={"name": "AUTOPILOT_PITCH_HOLD"})
    autopilot_pitch_hold_ref: float = Field(sa_column_kwargs={"name": "AUTOPILOT_PITCH_HOLD_REF"})
    autopilot_vertical_hold: float = Field(sa_column_kwargs={"name": "AUTOPILOT_VERTICAL_HOLD"})
    autopilot_vertical_hold_var: float = Field(sa_column_kwargs={"name": "AUTOPILOT_VERTICAL_HOLD_VAR"})
    autopilot_wing_leveler: float = Field(sa_column_kwargs={"name": "AUTOPILOT_WING_LEVELER"})

    elevator_trim_pct: float = Field(sa_column_kwargs={"name": "ELEVATOR_TRIM_PCT"})
    rudder_trim_pct: float = Field(sa_column_kwargs={"name": "RUDDER_TRIM_PCT"})
    flaps_handle_percent: float = Field(sa_column_kwargs={"name": "FLAPS_HANDLE_PERCENT"})
    gear_handle_position: str = Field(sa_column_kwargs={"name": "GEAR_HANDLE_POSITION"})
    fuel_percentage: float = Field(sa_column_kwargs={"name": "FUEL_PERCENTAGE"})

    cabin_no_smoking_alert_switch: float = Field(sa_column_kwargs={"name": "CABIN_NO_SMOKING_ALERT_SWITCH"})
    cabin_seatbelts_alert_switch: float = Field(sa_column_kwargs={"name": "CABIN_SEATBELTS_ALERT_SWITCH"})
    status: str = Field(sa_column_kwargs={"name": "STATUS"})