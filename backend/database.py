import os
from sqlmodel import Session, SQLModel, create_engine

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/meflight"
LEGACY_POSTGRES_SCHEME = "postgres://"
POSTGRES_SCHEME = "postgresql://"
SQLITE_SCHEME = "sqlite"
DEFAULT_POOL_SIZE = "10"
DEFAULT_MAX_OVERFLOW = "20"
POOL_RECYCLE_SECONDS = 1800

def _normalized_url(url: str) -> str:
    if url.startswith(LEGACY_POSTGRES_SCHEME):
        return POSTGRES_SCHEME + url.removeprefix(LEGACY_POSTGRES_SCHEME)
    return url

def _engine_options(url: str) -> dict:
    if url.startswith(SQLITE_SCHEME):
        return {"connect_args": {"check_same_thread": False}}
    return {
        "pool_size": int(os.getenv("DB_POOL_SIZE", DEFAULT_POOL_SIZE)),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", DEFAULT_MAX_OVERFLOW)),
        "pool_pre_ping": True,
        "pool_recycle": POOL_RECYCLE_SECONDS,
    }

DATABASE_URL = _normalized_url(os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))
engine = create_engine(DATABASE_URL, echo=False, **_engine_options(DATABASE_URL))

def init_db() -> None:
    import models
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
