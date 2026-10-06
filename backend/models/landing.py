from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlmodel import Field, SQLModel

class Landing(SQLModel, table=True):
    __tablename__ = "landing"

    id: Optional[int] = Field(default=None, primary_key=True)
    flightplan_id: Optional[uuid.UUID] = Field(default=None, foreign_key="flight_plan.id", index=True)
    session_id: Optional[uuid.UUID] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    rate_fpm: float = Field(nullable=False)
    latitude: float = Field(nullable=False)
    longitude: float = Field(nullable=False)
    airport_ident: Optional[str] = Field(default=None)
    airport_name: Optional[str] = Field(default=None)
