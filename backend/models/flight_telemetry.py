from datetime import datetime, timezone
from typing import Optional, Any
import uuid
from pydantic import ConfigDict, model_validator
from sqlmodel import Field, SQLModel

class FlightTelemetry(SQLModel, table=True):
    __tablename__ = "flight_telemetry"
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: uuid.UUID = Field(default_factory=uuid.uuid4, index=True)
    flightplan_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="flight_plan.id",
        index=True,
        alias="FLIGHTPLAN_ID",
        sa_column_kwargs={"name": "flightplan_id"},
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )

    airspeed_indicate: float = Field(
        default=0.0,
        alias="AIRSPEED_INDICATE",
        sa_column_kwargs={"name": "AIRSPEED_INDICATE"},
    )
    altitude: str = Field(
        default="0",
        alias="ALTITUDE",
        sa_column_kwargs={"name": "ALTITUDE"},
    )
    vertical_speed: float = Field(
        default=0.0,
        alias="VERTICAL_SPEED",
        sa_column_kwargs={"name": "VERTICAL_SPEED"},
    )
    latitude: float = Field(
        default=0.0,
        alias="LATITUDE",
        sa_column_kwargs={"name": "LATITUDE"},
    )
    longitude: float = Field(
        default=0.0,
        alias="LONGITUDE",
        sa_column_kwargs={"name": "LONGITUDE"},
    )
    magnetic_compass: float = Field(
        default=0.0,
        alias="MAGNETIC_COMPASS",
        sa_column_kwargs={"name": "MAGNETIC_COMPASS"},
    )
    magvar: float = Field(
        default=0.0,
        alias="MAGVAR",
        sa_column_kwargs={"name": "MAGVAR"},
    )

    autopilot_master: float = Field(
        default=0.0,
        alias="AUTOPILOT_MASTER",
        sa_column_kwargs={"name": "AUTOPILOT_MASTER"},
    )
    autopilot_airspeed_hold: float = Field(
        default=0.0,
        alias="AUTOPILOT_AIRSPEED_HOLD",
        sa_column_kwargs={"name": "AUTOPILOT_AIRSPEED_HOLD"},
    )
    autopilot_airspeed_hold_var: float = Field(
        default=0.0,
        alias="AUTOPILOT_AIRSPEED_HOLD_VAR",
        sa_column_kwargs={"name": "AUTOPILOT_AIRSPEED_HOLD_VAR"},
    )
    autopilot_altitude_lock: float = Field(
        default=0.0,
        alias="AUTOPILOT_ALTITUDE_LOCK",
        sa_column_kwargs={"name": "AUTOPILOT_ALTITUDE_LOCK"},
    )
    autopilot_altitude_lock_var: str = Field(
        default="0",
        alias="AUTOPILOT_ALTITUDE_LOCK_VAR",
        sa_column_kwargs={"name": "AUTOPILOT_ALTITUDE_LOCK_VAR"},
    )
    autopilot_approach_hold: float = Field(
        default=0.0,
        alias="AUTOPILOT_APPROACH_HOLD",
        sa_column_kwargs={"name": "AUTOPILOT_APPROACH_HOLD"},
    )
    autopilot_attitude_hold: float = Field(
        default=0.0,
        alias="AUTOPILOT_ATTITUDE_HOLD",
        sa_column_kwargs={"name": "AUTOPILOT_ATTITUDE_HOLD"},
    )
    autopilot_backcourse_hold: float = Field(
        default=0.0,
        alias="AUTOPILOT_BACKCOURSE_HOLD",
        sa_column_kwargs={"name": "AUTOPILOT_BACKCOURSE_HOLD"},
    )
    autopilot_flight_director_active: float = Field(
        default=0.0,
        alias="AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE",
        sa_column_kwargs={"name": "AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE"},
    )
    autopilot_glideslope_hold: float = Field(
        default=0.0,
        alias="AUTOPILOT_GLIDESLOPE_HOLD",
        sa_column_kwargs={"name": "AUTOPILOT_GLIDESLOPE_HOLD"},
    )
    autopilot_heading_lock: float = Field(
        default=0.0,
        alias="AUTOPILOT_HEADING_LOCK",
        sa_column_kwargs={"name": "AUTOPILOT_HEADING_LOCK"},
    )
    autopilot_heading_lock_dir: float = Field(
        default=0.0,
        alias="AUTOPILOT_HEADING_LOCK_DIR",
        sa_column_kwargs={"name": "AUTOPILOT_HEADING_LOCK_DIR"},
    )
    autopilot_nav_selected: float = Field(
        default=0.0,
        alias="AUTOPILOT_NAV_SELECTED",
        sa_column_kwargs={"name": "AUTOPILOT_NAV_SELECTED"},
    )
    autopilot_pitch_hold: float = Field(
        default=0.0,
        alias="AUTOPILOT_PITCH_HOLD",
        sa_column_kwargs={"name": "AUTOPILOT_PITCH_HOLD"},
    )
    autopilot_pitch_hold_ref: float = Field(
        default=0.0,
        alias="AUTOPILOT_PITCH_HOLD_REF",
        sa_column_kwargs={"name": "AUTOPILOT_PITCH_HOLD_REF"},
    )
    autopilot_vertical_hold: float = Field(
        default=0.0,
        alias="AUTOPILOT_VERTICAL_HOLD",
        sa_column_kwargs={"name": "AUTOPILOT_VERTICAL_HOLD"},
    )
    autopilot_vertical_hold_var: float = Field(
        default=0.0,
        alias="AUTOPILOT_VERTICAL_HOLD_VAR",
        sa_column_kwargs={"name": "AUTOPILOT_VERTICAL_HOLD_VAR"},
    )
    autopilot_wing_leveler: float = Field(
        default=0.0,
        alias="AUTOPILOT_WING_LEVELER",
        sa_column_kwargs={"name": "AUTOPILOT_WING_LEVELER"},
    )

    elevator_trim_pct: float = Field(
        default=0.0,
        alias="ELEVATOR_TRIM_PCT",
        sa_column_kwargs={"name": "ELEVATOR_TRIM_PCT"},
    )
    rudder_trim_pct: float = Field(
        default=0.0,
        alias="RUDDER_TRIM_PCT",
        sa_column_kwargs={"name": "RUDDER_TRIM_PCT"},
    )
    flaps_handle_percent: float = Field(
        default=0.0,
        alias="FLAPS_HANDLE_PERCENT",
        sa_column_kwargs={"name": "FLAPS_HANDLE_PERCENT"},
    )
    gear_handle_position: str = Field(
        default="UP",
        alias="GEAR_HANDLE_POSITION",
        sa_column_kwargs={"name": "GEAR_HANDLE_POSITION"},
    )
    fuel_percentage: float = Field(
        default=100.0,
        alias="FUEL_PERCENTAGE",
        sa_column_kwargs={"name": "FUEL_PERCENTAGE"},
    )

    cabin_no_smoking_alert_switch: float = Field(
        default=0.0,
        alias="CABIN_NO_SMOKING_ALERT_SWITCH",
        sa_column_kwargs={"name": "CABIN_NO_SMOKING_ALERT_SWITCH"},
    )
    cabin_seatbelts_alert_switch: float = Field(
        default=0.0,
        alias="CABIN_SEATBELTS_ALERT_SWITCH",
        sa_column_kwargs={"name": "CABIN_SEATBELTS_ALERT_SWITCH"},
    )
    status: str = Field(
        default="success",
        alias="STATUS",
        sa_column_kwargs={"name": "STATUS"},
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {k.lower(): v for k, v in data.items()}
        return data
    status: str = Field(sa_column_kwargs={"name": "STATUS"})