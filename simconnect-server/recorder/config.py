import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
DEFAULT_API_BASE_URL = "http://localhost:8000"
LEGACY_LIVE_SUFFIX = "/live"
DEFAULT_INTERVAL_SECONDS = "1.0"
DEFAULT_LOCAL_HOST = "127.0.0.1"
DEFAULT_LOCAL_PORT = "5050"

@dataclass(frozen=True)
class Config:
    api_base_url: str
    api_key: str | None
    interval_seconds: float
    local_host: str
    local_port: int

def _api_base_url() -> str:
    base_url = os.getenv("API_BASE_URL")
    if base_url:
        return base_url.rstrip("/")

    legacy_endpoint = os.getenv("API_ENDPOINT")
    if legacy_endpoint:
        return legacy_endpoint.rstrip("/").removesuffix(LEGACY_LIVE_SUFFIX)

    return DEFAULT_API_BASE_URL

def load_config() -> Config:
    load_dotenv(dotenv_path=ENV_PATH)
    return Config(
        api_base_url=_api_base_url(),
        api_key=os.getenv("API_KEY"),
        interval_seconds=float(os.getenv("INTERVAL", DEFAULT_INTERVAL_SECONDS)),
        local_host=os.getenv("LOCAL_HOST", DEFAULT_LOCAL_HOST),
        local_port=int(os.getenv("LOCAL_PORT", DEFAULT_LOCAL_PORT)),
    )
