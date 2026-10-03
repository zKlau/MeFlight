from flask import Flask, jsonify
from SimConnect import *

app = Flask(__name__)

sm = SimConnect()
ae = AircraftEvents(sm)
aq = AircraftRequests(sm, _time=10)

def thousandify(x):
	return f"{x:,}"

@app.route('/ui')
def output_ui_variables():

	ui_friendly_dictionary = {}
	ui_friendly_dictionary["STATUS"] = "success"

	fuel_percentage = (aq.get("FUEL_TOTAL_QUANTITY") / aq.get("FUEL_TOTAL_CAPACITY")) * 100
	ui_friendly_dictionary["FUEL_PERCENTAGE"] = round(fuel_percentage)

	ui_friendly_dictionary["AIRSPEED_INDICATE"] = round(aq.get("AIRSPEED_INDICATED"))
	ui_friendly_dictionary["ALTITUDE"] = thousandify(round(aq.get("PLANE_ALTITUDE")))

	if aq.get("GEAR_HANDLE_POSITION") == 1:
		ui_friendly_dictionary["GEAR_HANDLE_POSITION"] = "DOWN"
	else:
		ui_friendly_dictionary["GEAR_HANDLE_POSITION"] = "UP"
	ui_friendly_dictionary["FLAPS_HANDLE_PERCENT"] = round(aq.get("FLAPS_HANDLE_PERCENT") * 100)

	ui_friendly_dictionary["ELEVATOR_TRIM_PCT"] = round(aq.get("ELEVATOR_TRIM_PCT") * 100)
	ui_friendly_dictionary["RUDDER_TRIM_PCT"] = round(aq.get("RUDDER_TRIM_PCT") * 100)

	ui_friendly_dictionary["LATITUDE"] = aq.get("PLANE_LATITUDE")
	ui_friendly_dictionary["LONGITUDE"] = aq.get("PLANE_LONGITUDE")
	ui_friendly_dictionary["MAGNETIC_COMPASS"] = round(aq.get("MAGNETIC_COMPASS"))
	ui_friendly_dictionary["MAGVAR"] = round(aq.get("MAGVAR"))
	ui_friendly_dictionary["VERTICAL_SPEED"] = round(aq.get("VERTICAL_SPEED"))

	ui_friendly_dictionary["AUTOPILOT_MASTER"] = aq.get("AUTOPILOT_MASTER")
	ui_friendly_dictionary["AUTOPILOT_NAV_SELECTED"] = aq.get("AUTOPILOT_NAV_SELECTED")
	ui_friendly_dictionary["AUTOPILOT_WING_LEVELER"] = aq.get("AUTOPILOT_WING_LEVELER")
	ui_friendly_dictionary["AUTOPILOT_HEADING_LOCK"] = aq.get("AUTOPILOT_HEADING_LOCK")
	ui_friendly_dictionary["AUTOPILOT_HEADING_LOCK_DIR"] = round(aq.get("AUTOPILOT_HEADING_LOCK_DIR"))
	ui_friendly_dictionary["AUTOPILOT_ALTITUDE_LOCK"] = aq.get("AUTOPILOT_ALTITUDE_LOCK")
	ui_friendly_dictionary["AUTOPILOT_ALTITUDE_LOCK_VAR"] = thousandify(round(aq.get("AUTOPILOT_ALTITUDE_LOCK_VAR")))
	ui_friendly_dictionary["AUTOPILOT_ATTITUDE_HOLD"] = aq.get("AUTOPILOT_ATTITUDE_HOLD")
	ui_friendly_dictionary["AUTOPILOT_GLIDESLOPE_HOLD"] = aq.get("AUTOPILOT_GLIDESLOPE_HOLD")
	ui_friendly_dictionary["AUTOPILOT_APPROACH_HOLD"] = aq.get("AUTOPILOT_APPROACH_HOLD")
	ui_friendly_dictionary["AUTOPILOT_BACKCOURSE_HOLD"] = aq.get("AUTOPILOT_BACKCOURSE_HOLD")
	ui_friendly_dictionary["AUTOPILOT_VERTICAL_HOLD"] = aq.get("AUTOPILOT_VERTICAL_HOLD")
	ui_friendly_dictionary["AUTOPILOT_VERTICAL_HOLD_VAR"] = aq.get("AUTOPILOT_VERTICAL_HOLD_VAR")
	ui_friendly_dictionary["AUTOPILOT_PITCH_HOLD"] = aq.get("AUTOPILOT_PITCH_HOLD")
	ui_friendly_dictionary["AUTOPILOT_PITCH_HOLD_REF"] = aq.get("AUTOPILOT_PITCH_HOLD_REF")
	ui_friendly_dictionary["AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE"] = aq.get("AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE")
	ui_friendly_dictionary["AUTOPILOT_AIRSPEED_HOLD"] = aq.get("AUTOPILOT_AIRSPEED_HOLD")
	ui_friendly_dictionary["AUTOPILOT_AIRSPEED_HOLD_VAR"] = round(aq.get("AUTOPILOT_AIRSPEED_HOLD_VAR"))

	ui_friendly_dictionary["CABIN_SEATBELTS_ALERT_SWITCH"] = aq.get("CABIN_SEATBELTS_ALERT_SWITCH")
	ui_friendly_dictionary["CABIN_NO_SMOKING_ALERT_SWITCH"] = aq.get("CABIN_NO_SMOKING_ALERT_SWITCH")

	return jsonify(ui_friendly_dictionary)

app.run(host='0.0.0.0', port=5000, debug=True)
