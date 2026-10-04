from datetime import datetime
from typing import Dict, List, Optional
import uuid
from pydantic import BaseModel

class TrackPoint(BaseModel):
    lat: float
    lon: float
    altitude: float
    airspeed: float
    heading: float
    on_ground: bool
    new_segment: bool
    timestamp: datetime

class TrackResponse(BaseModel):
    flightplan_id: Optional[uuid.UUID] = None
    started_at: Optional[datetime] = None
    total_points: int
    distance_nm: float
    points: List[TrackPoint]

class NearestAirportRead(BaseModel):
    ident: str
    name: str
    distance_nm: float

class LastStateResponse(BaseModel):
    flightplan_id: Optional[uuid.UUID] = None
    timestamp: datetime
    lat: float
    lon: float
    altitude: float
    heading: float
    on_ground: bool
    fuel_percentage: float
    fuel_total_quantity: float
    fuel_tank_levels: Dict[str, float]
    nearest_airport: Optional[NearestAirportRead] = None
