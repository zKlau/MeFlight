import json
from dataclasses import asdict, dataclass
from recorder.paths import settings_path

DEFAULT_SERVER_URL = ""
ENCODING = "utf-8"
JSON_INDENT = 2

@dataclass(frozen=True)
class Settings:
    server_url: str = DEFAULT_SERVER_URL
    api_key: str = ""

    @property
    def configured(self) -> bool:
        return bool(self.server_url and self.api_key)

def make_settings(server_url: str | None, api_key: str | None) -> Settings:
    return Settings(
        server_url=(server_url or DEFAULT_SERVER_URL).strip().rstrip("/"),
        api_key=(api_key or "").strip(),
    )

def load_settings(fallback: Settings) -> Settings:
    path = settings_path()
    if not path.exists():
        return fallback
    try:
        data = json.loads(path.read_text(ENCODING))
    except (OSError, ValueError):
        return fallback
    return make_settings(data.get("server_url"), data.get("api_key"))

def save_settings(settings: Settings) -> None:
    settings_path().write_text(json.dumps(asdict(settings), indent=JSON_INDENT), ENCODING)
