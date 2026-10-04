from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel

class TrackPoint(BaseModel):
    lat: float
    lon: float
    altitude: float
    airspeed: float
    heading: float
    timestamp: datetime

class TrackResponse(BaseModel):
    flightplan_id: Optional[uuid.UUID] = None
    started_at: Optional[datetime] = None
    total_points: int
    distance_nm: float
    points: List[TrackPoint]
