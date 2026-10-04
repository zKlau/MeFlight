import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

API_ENDPOINT = os.getenv("API_ENDPOINT", "http://localhost:8000/live")
API_KEY = os.getenv("API_KEY")
INTERVAL = float(os.getenv("INTERVAL", "1.0"))
FLIGHTPLAN_ID = os.getenv("FLIGHTPLAN_ID") or None

def thousandify(x):
    return f"{x:,}"

def extract_telemetry(aq):
    fuel_total = aq.get("FUEL_TOTAL_QUANTITY")
    fuel_capacity = aq.get("FUEL_TOTAL_CAPACITY")
    fuel_pct = 0
    if fuel_total is not None and fuel_capacity and fuel_capacity > 0:
        fuel_pct = round((fuel_total / fuel_capacity) * 100)

    gear_pos = "DOWN" if aq.get("GEAR_HANDLE_POSITION") == 1 else "UP"

    data = {
        "STATUS": "success",
        "FUEL_PERCENTAGE": fuel_pct,
        "AIRSPEED_INDICATE": round(aq.get("AIRSPEED_INDICATED") or 0),
        "ALTITUDE": thousandify(round(aq.get("PLANE_ALTITUDE") or 0)),
        "GEAR_HANDLE_POSITION": gear_pos,
        "FLAPS_HANDLE_PERCENT": round((aq.get("FLAPS_HANDLE_PERCENT") or 0) * 100),
        "ELEVATOR_TRIM_PCT": round((aq.get("ELEVATOR_TRIM_PCT") or 0) * 100),
        "RUDDER_TRIM_PCT": round((aq.get("RUDDER_TRIM_PCT") or 0) * 100),
        "LATITUDE": float(aq.get("PLANE_LATITUDE") or 0.0),
        "LONGITUDE": float(aq.get("PLANE_LONGITUDE") or 0.0),
        "MAGNETIC_COMPASS": round(aq.get("MAGNETIC_COMPASS") or 0),
        "MAGVAR": round(aq.get("MAGVAR") or 0),
        "VERTICAL_SPEED": round(aq.get("VERTICAL_SPEED") or 0),
        "AUTOPILOT_MASTER": float(aq.get("AUTOPILOT_MASTER") or 0),
        "AUTOPILOT_NAV_SELECTED": float(aq.get("AUTOPILOT_NAV_SELECTED") or 0),
        "AUTOPILOT_WING_LEVELER": float(aq.get("AUTOPILOT_WING_LEVELER") or 0),
        "AUTOPILOT_HEADING_LOCK": float(aq.get("AUTOPILOT_HEADING_LOCK") or 0),
        "AUTOPILOT_HEADING_LOCK_DIR": round(aq.get("AUTOPILOT_HEADING_LOCK_DIR") or 0),
        "AUTOPILOT_ALTITUDE_LOCK": float(aq.get("AUTOPILOT_ALTITUDE_LOCK") or 0),
        "AUTOPILOT_ALTITUDE_LOCK_VAR": thousandify(round(aq.get("AUTOPILOT_ALTITUDE_LOCK_VAR") or 0)),
        "AUTOPILOT_ATTITUDE_HOLD": float(aq.get("AUTOPILOT_ATTITUDE_HOLD") or 0),
        "AUTOPILOT_GLIDESLOPE_HOLD": float(aq.get("AUTOPILOT_GLIDESLOPE_HOLD") or 0),
        "AUTOPILOT_APPROACH_HOLD": float(aq.get("AUTOPILOT_APPROACH_HOLD") or 0),
        "AUTOPILOT_BACKCOURSE_HOLD": float(aq.get("AUTOPILOT_BACKCOURSE_HOLD") or 0),
        "AUTOPILOT_VERTICAL_HOLD": float(aq.get("AUTOPILOT_VERTICAL_HOLD") or 0),
        "AUTOPILOT_VERTICAL_HOLD_VAR": float(aq.get("AUTOPILOT_VERTICAL_HOLD_VAR") or 0),
        "AUTOPILOT_PITCH_HOLD": float(aq.get("AUTOPILOT_PITCH_HOLD") or 0),
        "AUTOPILOT_PITCH_HOLD_REF": float(aq.get("AUTOPILOT_PITCH_HOLD_REF") or 0),
        "AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE": float(aq.get("AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE") or 0),
        "AUTOPILOT_AIRSPEED_HOLD": float(aq.get("AUTOPILOT_AIRSPEED_HOLD") or 0),
        "AUTOPILOT_AIRSPEED_HOLD_VAR": round(aq.get("AUTOPILOT_AIRSPEED_HOLD_VAR") or 0),
        "CABIN_SEATBELTS_ALERT_SWITCH": float(aq.get("CABIN_SEATBELTS_ALERT_SWITCH") or 0),
        "CABIN_NO_SMOKING_ALERT_SWITCH": float(aq.get("CABIN_NO_SMOKING_ALERT_SWITCH") or 0),
    }

    if FLIGHTPLAN_ID:
        data["FLIGHTPLAN_ID"] = FLIGHTPLAN_ID

    return data

def post_telemetry(url, data, api_key=None):
    payload = json.dumps(data).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "MeFlight-SimConnect-Pusher/1.0",
    }
    if api_key:
        headers["X-API-Key"] = api_key

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=5) as response:
        return response.status

def run_pusher():
    from SimConnect import SimConnect, AircraftRequests

    print("Connecting to MSFS SimConnect...", flush=True)
    sm = None
    aq = None

    while sm is None:
        try:
            sm = SimConnect()
            aq = AircraftRequests(sm, _time=10)
            print("Connected to MSFS SimConnect.", flush=True)
        except Exception as e:
            print(f"Waiting for MSFS SimConnect connection: {e}", flush=True)
            time.sleep(3)

    print(f"Starting telemetry push to {API_ENDPOINT} every {INTERVAL}s...", flush=True)
    while True:
        try:
            telemetry_data = extract_telemetry(aq)
            status_code = post_telemetry(API_ENDPOINT, telemetry_data, API_KEY)
            lat = telemetry_data.get("LATITUDE")
            lon = telemetry_data.get("LONGITUDE")
            alt = telemetry_data.get("ALTITUDE")
            print(f"Pushed telemetry -> HTTP {status_code} | Pos: ({lat:.4f}, {lon:.4f}) | Alt: {alt}", flush=True)
        except urllib.error.HTTPError as e:
            print(f"HTTP error pushing telemetry: {e.code} {e.reason}", flush=True)
        except urllib.error.URLError as e:
            print(f"Network error pushing telemetry: {e.reason}", flush=True)
        except Exception as e:
            print(f"Error reading/sending telemetry: {e}", flush=True)
        time.sleep(INTERVAL)

if __name__ == "__main__":
    try:
        run_pusher()
    except KeyboardInterrupt:
        print("\nStopping telemetry pusher.", flush=True)
        sys.exit(0)

