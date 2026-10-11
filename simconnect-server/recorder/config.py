import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv
from recorder.paths import is_frozen
from recorder.settings import Settings, make_settings

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
LEGACY_LIVE_SUFFIX = "/live"
DEFAULT_INTERVAL_SECONDS = "1.0"
DEFAULT_LOCAL_HOST = "127.0.0.1"
DEFAULT_LOCAL_PORT = "5050"

@dataclass(frozen=True)
class Config:
    interval_seconds: float
    local_host: str
    local_port: int

def _env_server_url() -> str | None:
    base_url = os.getenv("API_BASE_URL")
    if base_url:
        return base_url

    legacy_endpoint = os.getenv("API_ENDPOINT")
    if legacy_endpoint:
        return legacy_endpoint.rstrip("/").removesuffix(LEGACY_LIVE_SUFFIX)

    return None

def env_settings() -> Settings:
    if is_frozen():
        return Settings()
    return make_settings(_env_server_url(), os.getenv("API_KEY"))

def load_config() -> Config:
    load_dotenv(dotenv_path=ENV_PATH)
    return Config(
        interval_seconds=float(os.getenv("INTERVAL", DEFAULT_INTERVAL_SECONDS)),
        local_host=os.getenv("LOCAL_HOST", DEFAULT_LOCAL_HOST),
        local_port=int(os.getenv("LOCAL_PORT", DEFAULT_LOCAL_PORT)),
    )
