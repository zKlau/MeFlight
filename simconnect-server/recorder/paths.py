import os
import sys
from pathlib import Path

APP_DIR_NAME = "MeFlight"
SETTINGS_FILE_NAME = "settings.json"
LOG_FILE_NAME = "meflight.log"
WEBVIEW_DIR_NAME = "webview"
ROAMING_ENV = "APPDATA"
LOCAL_ENV = "LOCALAPPDATA"
BUNDLE_ATTRIBUTE = "_MEIPASS"

def is_frozen() -> bool:
    return hasattr(sys, BUNDLE_ATTRIBUTE)

def resource_dir() -> Path:
    if is_frozen():
        return Path(getattr(sys, BUNDLE_ATTRIBUTE))
    return Path(__file__).resolve().parent.parent

def _user_dir(env_name: str) -> Path:
    directory = Path(os.environ.get(env_name, Path.home())) / APP_DIR_NAME
    directory.mkdir(parents=True, exist_ok=True)
    return directory

def settings_path() -> Path:
    return _user_dir(ROAMING_ENV) / SETTINGS_FILE_NAME

def log_path() -> Path:
    return _user_dir(LOCAL_ENV) / LOG_FILE_NAME

def webview_storage_dir() -> Path:
    return _user_dir(LOCAL_ENV) / WEBVIEW_DIR_NAME
