from typing import Optional
from pydantic import BaseModel, ConfigDict

class RunwayEndRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ident: str
    latitude: float
    longitude: float

class RunwayRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    airport: str
    low: RunwayEndRead
    high: RunwayEndRead
    length_ft: Optional[int] = None
    width_ft: Optional[int] = None
    surface: str
    lighted: bool
