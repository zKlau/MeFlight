import os
from sqlmodel import Session, SQLModel, create_engine

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/meflight"
LEGACY_POSTGRES_SCHEME = "postgres://"
POSTGRES_SCHEME = "postgresql://"

def _normalized_url(url: str) -> str:
    if url.startswith(LEGACY_POSTGRES_SCHEME):
        return POSTGRES_SCHEME + url.removeprefix(LEGACY_POSTGRES_SCHEME)
    return url

DATABASE_URL = _normalized_url(os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL))

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def init_db() -> None:
    import models
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session