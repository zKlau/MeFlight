from fastapi import Depends, FastAPI
from sqlmodel import Session

from backend.models.flight_telemetry import FlightTelemetry

app = FastAPI(title="MeFlight API")


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post('/live', response_model=FlightTelemetry, status_code=status.HTTP_201_CREATED)
def write_telemetry(
    record: FlightTelemetry,
    session: Session = Depends(get_session),
):
    session.add(record)
    session.commit()
    session.refresh(record)
    return record