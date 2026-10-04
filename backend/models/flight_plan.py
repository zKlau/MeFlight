from datetime import datetime, timezone
from typing import Optional, List
import uuid
from sqlmodel import Field, Relationship, SQLModel

class FlightPlan(SQLModel, table=True):
    __tablename__ = "flight_plan"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: Optional[str] = Field(default=None, index=True)
    description: Optional[str] = Field(default=None)
    flight_plan_type: Optional[str] = Field(default=None)
    route_type: Optional[str] = Field(default=None)
    cruising_altitude: Optional[float] = Field(default=None)
    departure_id: Optional[str] = Field(default=None, index=True)
    departure_name: Optional[str] = Field(default=None)
    destination_id: Optional[str] = Field(default=None, index=True)
    destination_name: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )

    waypoints: List["FlightPlanWaypoint"] = Relationship(
        back_populates="flight_plan",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "FlightPlanWaypoint.order_index"},
    )

class FlightPlanWaypoint(SQLModel, table=True):
    __tablename__ = "flight_plan_waypoint"

    id: Optional[int] = Field(default=None, primary_key=True)
    flight_plan_id: uuid.UUID = Field(foreign_key="flight_plan.id", index=True, nullable=False)
    order_index: int = Field(index=True, nullable=False)
    identifier: str = Field(nullable=False)
    waypoint_type: Optional[str] = Field(default=None)
    latitude: float = Field(nullable=False)
    longitude: float = Field(nullable=False)
    altitude: Optional[float] = Field(default=None)
    world_position: Optional[str] = Field(default=None)

    flight_plan: Optional[FlightPlan] = Relationship(back_populates="waypoints")

