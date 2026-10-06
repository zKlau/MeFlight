from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel

class CountryVisit(BaseModel):
    code: str
    name: str
    landed: bool
    first_visited_at: datetime

class CountriesResponse(BaseModel):
    flightplan_id: Optional[uuid.UUID] = None
    total: int
    landed: int
    flown_over: int
    countries: List[CountryVisit]
