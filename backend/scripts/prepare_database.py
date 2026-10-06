import sys
import time
from pathlib import Path
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from database import engine

ALEMBIC_INI = BACKEND_DIR / "alembic.ini"
CONNECT_ATTEMPTS = 30
CONNECT_RETRY_SECONDS = 2
VERSION_TABLE = "alembic_version"
TELEMETRY_TABLE = "flight_telemetry"
BASELINE_REVISION = "7639d6c804ce"
HEAD_REVISION = "head"
REVISION_MARKER_COLUMNS = (
    ("AUTOPILOT_NAV1_LOCK", HEAD_REVISION),
    ("FUEL_TANK_LEVELS", "a1f3c2d4e5b6"),
)

def wait_for_database() -> None:
    for attempt in range(1, CONNECT_ATTEMPTS + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return
        except OperationalError as error:
            print(f"Waiting for database ({attempt}/{CONNECT_ATTEMPTS}): {error.orig}", flush=True)
            time.sleep(CONNECT_RETRY_SECONDS)
    raise SystemExit("Database is not reachable, giving up.")

def _unversioned_revision() -> str | None:
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if VERSION_TABLE in tables or TELEMETRY_TABLE not in tables:
        return None

    columns = {column["name"] for column in inspector.get_columns(TELEMETRY_TABLE)}
    for marker_column, revision in REVISION_MARKER_COLUMNS:
        if marker_column in columns:
            return revision
    return BASELINE_REVISION

def migrate() -> None:
    config = Config(str(ALEMBIC_INI))
    revision = _unversioned_revision()

    if revision is not None:
        print(f"Existing schema without migration history found, stamping {revision}.", flush=True)
        command.stamp(config, revision)

    command.upgrade(config, HEAD_REVISION)
    print("Database is up to date.", flush=True)

if __name__ == "__main__":
    wait_for_database()
    migrate()
