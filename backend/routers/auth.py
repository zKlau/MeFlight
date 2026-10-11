from fastapi import APIRouter, Depends
from security import verify_api_key

router = APIRouter(tags=["Auth"])

@router.get("/auth/check", dependencies=[Depends(verify_api_key)])
def check_api_key():
    return {"valid": True}
