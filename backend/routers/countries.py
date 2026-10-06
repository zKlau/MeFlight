from fastapi import APIRouter, Depends
from sqlmodel import Session
from database import get_session
from schemas.countries import CountriesResponse
from services.countries_service import get_all_countries

router = APIRouter(prefix="/countries", tags=["Countries"])

@router.get("", response_model=CountriesResponse)
def fetch_all_countries(session: Session = Depends(get_session)):
    return get_all_countries(session)
