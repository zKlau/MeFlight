from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel
from schemas.telemetry import NearestAirportRead

class CountryRead(BaseModel):
    code: str
    name: str

class LocationResponse(BaseModel):
    country: Optional[CountryRead] = None
    nearest_airport: Optional[NearestAirportRead] = None

class LandingCreate(BaseModel):
    rate_fpm: float
    latitude: float
    longitude: float
    flightplan_id: Optional[uuid.UUID] = None
    session_id: Optional[uuid.UUID] = None

class LandingRead(BaseModel):
    id: int
    flightplan_id: Optional[uuid.UUID] = None
    created_at: datetime
    rate_fpm: float
    airport_ident: Optional[str] = None
    airport_name: Optional[str] = None

class LandingsResponse(BaseModel):
    count: int
    last: Optional[LandingRead] = None
    best: Optional[LandingRead] = None
    landings: List[LandingRead]

class SessionResponse(BaseModel):
    active: bool
    flightplan_id: Optional[uuid.UUID] = None
    started_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    distance_nm: float
    airborne_seconds: int

class MetarResponse(BaseModel):
    ident: str
    name: Optional[str] = None
    raw: str
    observed_at: Optional[datetime] = None
    wind_direction: Optional[str] = None
    wind_speed_kt: Optional[float] = None
    wind_gust_kt: Optional[float] = None
    visibility: Optional[str] = None
    temperature_c: Optional[float] = None
    dewpoint_c: Optional[float] = None
    altimeter_hpa: Optional[float] = None
    cover: Optional[str] = None
    flight_category: Optional[str] = None
