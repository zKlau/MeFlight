from datetime import datetime
from typing import Optional, List
import uuid
from pydantic import BaseModel, ConfigDict, Field
from models.flight_telemetry import FlightTelemetry

class WaypointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_index: int
    identifier: str
    waypoint_type: Optional[str] = None
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    world_position: Optional[str] = None

class FlightPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: Optional[str] = None
    description: Optional[str] = None
    flight_plan_type: Optional[str] = None
    route_type: Optional[str] = None
    cruising_altitude: Optional[float] = None
    departure_id: Optional[str] = None
    departure_name: Optional[str] = None
    destination_id: Optional[str] = None
    destination_name: Optional[str] = None
    total_waypoints: int = 0
    created_at: datetime
    updated_at: datetime
    waypoints: Optional[List[WaypointRead]] = None

class FlightPlanRouteResponse(BaseModel):
    flightplan_id: uuid.UUID
    title: Optional[str] = None
    departure_id: Optional[str] = None
    destination_id: Optional[str] = None
    total_points: int
    coordinates: List[List[float]]
    points: List[WaypointRead]

class FlightPlanPathResponse(BaseModel):
    flightplan_id: uuid.UUID
    total_points: int
    coordinates: List[List[float]]
    telemetry: List[FlightTelemetry]


class WaypointWrite(BaseModel):
    identifier: str = Field(min_length=1, max_length=16)
    waypoint_type: Optional[str] = Field(default=None, max_length=32)
    latitude: float = Field(ge=-90, le=90)
    longitude: float
    altitude: Optional[float] = None

class WaypointsUpdate(BaseModel):
    waypoints: List[WaypointWrite] = Field(min_length=2)

class AirportRead(BaseModel):
    ident: str
    name: str
    latitude: float
    longitude: float
