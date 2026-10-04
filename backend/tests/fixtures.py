from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import create_engine

SAMPLE_PLN = """<?xml version="1.0" encoding="UTF-8"?>
<SimBase.Document Type="AceXML" version="1,0">
    <Descr>AceXML Document</Descr>
    <FlightPlan.FlightPlan>
        <Title>EHAM to EGLL</Title>
        <FPType>IFR</FPType>
        <RouteType>Direct</RouteType>
        <CruisingAlt>24000</CruisingAlt>
        <DepartureID>EHAM</DepartureID>
        <DepartureLLA>N52° 18' 31.00",E4° 45' 50.00",-000011.00</DepartureLLA>
        <DestinationID>EGLL</DestinationID>
        <DestinationLLA>N51° 28' 14.00",W0° 27' 42.00",+000083.00</DestinationLLA>
        <DepartureName>Schiphol</DepartureName>
        <DestinationName>Heathrow</DestinationName>
        <ATCWaypoint id="EHAM">
            <ATCWaypointType>Airport</ATCWaypointType>
            <WorldPosition>N52° 18' 31.00",E4° 45' 50.00",-000011.00</WorldPosition>
            <ICAO>
                <ICAOIdent>EHAM</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
        <ATCWaypoint id="GORLO">
            <ATCWaypointType>Intersection</ATCWaypointType>
            <WorldPosition>N52° 10' 24.00",E3° 40' 12.00",+005000.00</WorldPosition>
            <ICAO>
                <ICAOIdent>GORLO</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
        <ATCWaypoint id="EGLL">
            <ATCWaypointType>Airport</ATCWaypointType>
            <WorldPosition>N51° 28' 14.00",W0° 27' 42.00",+000083.00</WorldPosition>
            <ICAO>
                <ICAOIdent>EGLL</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
    </FlightPlan.FlightPlan>
</SimBase.Document>"""

VALID_API_KEY = "test-api-key"
AUTH_HEADERS = {"X-API-Key": VALID_API_KEY}

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(test_engine, "connect")
def _enforce_foreign_keys(connection, _):
    connection.execute("PRAGMA foreign_keys=ON")
