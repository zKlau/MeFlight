import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from fastapi import Header, HTTPException, Security, status
from fastapi.security import APIKeyHeader, APIKeyQuery

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)

def verify_api_key(
    header_key: Optional[str] = Security(api_key_header),
    query_key: Optional[str] = Security(api_key_query),
    authorization: Optional[str] = Header(default=None),
) -> str:
    expected_key = os.getenv("API_KEY")

    bearer_key = None
    if authorization and authorization.lower().startswith("bearer "):
        bearer_key = authorization.split(" ", 1)[1].strip()

    provided_key = header_key or query_key or bearer_key

    if not expected_key or not provided_key or provided_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return provided_key

