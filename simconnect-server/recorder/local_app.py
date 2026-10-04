from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from recorder.api_client import ApiClient, ApiError
from recorder.recorder import Recorder
from recorder.sim import SimNotConnected

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
INDEX_FILE = STATIC_DIR / "index.html"
SIM_NOT_CONNECTED_DETAIL = "MSFS is not connected. Load into a flight first."
NO_SAVED_STATE_DETAIL = "This flight plan has no saved position yet."
NO_FUEL_DETAIL = "The saved state has no fuel tank levels (recorded with an older recorder)."
UPSTREAM_UNREACHABLE = 0

class StartRecordingRequest(BaseModel):
    flightplan_id: str | None = None

def _upstream_error(error: ApiError) -> HTTPException:
    status_code = error.status
    if status_code == UPSTREAM_UNREACHABLE:
        status_code = status.HTTP_502_BAD_GATEWAY
    return HTTPException(status_code=status_code, detail=str(error))

def create_app(recorder: Recorder, api: ApiClient) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI):
        recorder.start_thread()
        yield
        recorder.shutdown()

    app = FastAPI(title="MeFlight Recorder", lifespan=lifespan)
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    def index():
        return FileResponse(INDEX_FILE)

    @app.get("/api/status")
    def get_status():
        return recorder.status()

    @app.get("/api/plans")
    def list_plans():
        return _call(api.list_flight_plans)

    @app.post("/api/plans/upload", status_code=status.HTTP_201_CREATED)
    async def upload_plan(request: Request):
        body = await request.body()
        return _call(lambda: api.upload_flight_plan(body))

    @app.delete("/api/plans/{flightplan_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_plan(flightplan_id: str):
        _call(lambda: api.delete_flight_plan(flightplan_id))

    @app.get("/api/plans/{flightplan_id}/resume")
    def resume_info(flightplan_id: str):
        return {
            "last_state": _call(lambda: api.last_state(flightplan_id)),
            "progress": _call(lambda: api.progress(flightplan_id)),
        }

    @app.post("/api/plans/{flightplan_id}/restore-fuel")
    def restore_fuel(flightplan_id: str):
        last_state = _call(lambda: api.last_state(flightplan_id))
        if last_state is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NO_SAVED_STATE_DETAIL)
        if not last_state["fuel_tank_levels"]:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=NO_FUEL_DETAIL)
        try:
            applied = recorder.restore_fuel(last_state["fuel_tank_levels"])
        except SimNotConnected as error:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=SIM_NOT_CONNECTED_DETAIL) from error
        return {"applied": applied}

    @app.post("/api/recording/start")
    def start_recording(body: StartRecordingRequest):
        recorder.start_recording(body.flightplan_id)
        return recorder.status()

    @app.post("/api/recording/stop")
    def stop_recording():
        recorder.stop_recording()
        return recorder.status()

    return app

def _call(action):
    try:
        return action()
    except ApiError as error:
        raise _upstream_error(error) from error
