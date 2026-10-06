from math import degrees
from typing import Callable, Dict

FUEL_TANKS = (
    "CENTER",
    "CENTER2",
    "CENTER3",
    "LEFT_MAIN",
    "LEFT_AUX",
    "LEFT_TIP",
    "RIGHT_MAIN",
    "RIGHT_AUX",
    "RIGHT_TIP",
    "EXTERNAL1",
    "EXTERNAL2",
)
PERCENT = 100
FULL_CIRCLE_DEGREES = 360
GEAR_DOWN = 1

Reader = Callable[[str], float | None]

def level_simvar(tank: str) -> str:
    return f"FUEL_TANK_{tank}_LEVEL"

def capacity_simvar(tank: str) -> str:
    return f"FUEL_TANK_{tank}_CAPACITY"

def thousandify(value: float) -> str:
    return f"{value:,}"

def _number(read: Reader, simvar: str) -> float:
    return read(simvar) or 0

def _percent(read: Reader, simvar: str) -> int:
    return round(_number(read, simvar) * PERCENT)

def _fuel_percentage(read: Reader) -> int:
    capacity = _number(read, "FUEL_TOTAL_CAPACITY")
    if capacity <= 0:
        return 0
    return round(_number(read, "FUEL_TOTAL_QUANTITY") / capacity * PERCENT)

def _true_heading(read: Reader) -> float:
    return round(degrees(_number(read, "PLANE_HEADING_DEGREES_TRUE")) % FULL_CIRCLE_DEGREES)

def read_tank_levels(read: Reader, tanks: tuple[str, ...]) -> Dict[str, float]:
    return {level_simvar(tank): _number(read, level_simvar(tank)) for tank in tanks}

def _autopilot(read: Reader) -> dict:
    flags = (
        "AUTOPILOT_MASTER", "AUTOPILOT_NAV_SELECTED", "AUTOPILOT_NAV1_LOCK", "AUTOPILOT_WING_LEVELER", "AUTOPILOT_HEADING_LOCK",
        "AUTOPILOT_ALTITUDE_LOCK", "AUTOPILOT_ATTITUDE_HOLD", "AUTOPILOT_GLIDESLOPE_HOLD", "AUTOPILOT_APPROACH_HOLD",
        "AUTOPILOT_BACKCOURSE_HOLD", "AUTOPILOT_VERTICAL_HOLD", "AUTOPILOT_VERTICAL_HOLD_VAR", "AUTOPILOT_PITCH_HOLD",
        "AUTOPILOT_PITCH_HOLD_REF", "AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE", "AUTOPILOT_AIRSPEED_HOLD",
        "CABIN_SEATBELTS_ALERT_SWITCH", "CABIN_NO_SMOKING_ALERT_SWITCH",
    )
    values = {flag: float(_number(read, flag)) for flag in flags}
    values["AUTOPILOT_HEADING_LOCK_DIR"] = round(_number(read, "AUTOPILOT_HEADING_LOCK_DIR"))
    values["AUTOPILOT_ALTITUDE_LOCK_VAR"] = thousandify(round(_number(read, "AUTOPILOT_ALTITUDE_LOCK_VAR")))
    values["AUTOPILOT_AIRSPEED_HOLD_VAR"] = round(_number(read, "AUTOPILOT_AIRSPEED_HOLD_VAR"))
    return values

MISSING_COORDINATE = 0.0

def has_position(telemetry: dict) -> bool:
    return telemetry["LATITUDE"] != MISSING_COORDINATE and telemetry["LONGITUDE"] != MISSING_COORDINATE

def extract_telemetry(read: Reader, tanks: tuple[str, ...]) -> dict:
    return {
        "STATUS": "success",
        "FUEL_PERCENTAGE": _fuel_percentage(read),
        "FUEL_TOTAL_QUANTITY": _number(read, "FUEL_TOTAL_QUANTITY"),
        "FUEL_TANK_LEVELS": read_tank_levels(read, tanks),
        "AIRSPEED_INDICATE": round(_number(read, "AIRSPEED_INDICATED")),
        "ALTITUDE": thousandify(round(_number(read, "PLANE_ALTITUDE"))),
        "GEAR_HANDLE_POSITION": "DOWN" if read("GEAR_HANDLE_POSITION") == GEAR_DOWN else "UP",
        "FLAPS_HANDLE_PERCENT": _percent(read, "FLAPS_HANDLE_PERCENT"),
        "ELEVATOR_TRIM_PCT": _percent(read, "ELEVATOR_TRIM_PCT"),
        "RUDDER_TRIM_PCT": _percent(read, "RUDDER_TRIM_PCT"),
        "LATITUDE": float(_number(read, "PLANE_LATITUDE")),
        "LONGITUDE": float(_number(read, "PLANE_LONGITUDE")),
        "MAGNETIC_COMPASS": round(_number(read, "MAGNETIC_COMPASS")),
        "PLANE_HEADING_DEGREES_TRUE": _true_heading(read),
        "MAGVAR": round(_number(read, "MAGVAR")),
        "VERTICAL_SPEED": round(_number(read, "VERTICAL_SPEED")),
        "GROUND_VELOCITY": round(_number(read, "GROUND_VELOCITY")),
        "SIM_ON_GROUND": bool(_number(read, "SIM_ON_GROUND")),
        **_autopilot(read),
    }
