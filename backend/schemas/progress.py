from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel

class VisitedAirport(BaseModel):
    order_index: int
    identifier: str
    visited_at: datetime

class FlightPlanProgressResponse(BaseModel):
    flightplan_id: uuid.UUID
    planned_distance_nm: float
    flown_distance_nm: float
    completion_percent: float
    current_leg_index: int
    total_legs: int
    average_deviation_nm: float
    max_deviation_nm: float
    airborne_seconds: int
    recorded_seconds: int
    sessions: int
    airports_total: int
    airports_visited: List[VisitedAirport]
    first_flown_at: Optional[datetime] = None
    last_flown_at: Optional[datetime] = None
