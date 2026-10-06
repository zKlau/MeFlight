from contextlib import asynccontextmanager
from pathlib import Path
import sys

current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers.airports import router as airports_router
from routers.countries import router as countries_router
from routers.flight_plans import router as flight_plans_router
from routers.telemetry import router as telemetry_router
from routers.widgets import router as widgets_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception:
        pass
    yield

app = FastAPI(
    title="MeFlight API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(airports_router)
app.include_router(countries_router)
app.include_router(flight_plans_router)
app.include_router(telemetry_router)
app.include_router(widgets_router)

@app.get("/")
async def root():
    return {"message": "MeFlight API is running"}
    return record