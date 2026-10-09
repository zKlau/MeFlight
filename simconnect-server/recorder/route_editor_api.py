from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
from recorder.api_client import ApiClient

class EditedWaypoint(BaseModel):
    identifier: str
    waypoint_type: Optional[str] = None
    latitude: float
    longitude: float
    altitude: Optional[float] = None

class EditedRoute(BaseModel):
    waypoints: List[EditedWaypoint]

def add_route_editor_routes(app: FastAPI, api: ApiClient, call) -> None:
    @app.get("/api/plans/{flightplan_id}")
    def get_plan(flightplan_id: str):
        return call(lambda: api.flight_plan(flightplan_id))

    @app.put("/api/plans/{flightplan_id}/waypoints")
    def save_waypoints(flightplan_id: str, route: EditedRoute):
        return call(lambda: api.update_waypoints(flightplan_id, route.model_dump()))

    @app.get("/api/airports/{ident}")
    def find_airport(ident: str):
        return call(lambda: api.airport(ident))
