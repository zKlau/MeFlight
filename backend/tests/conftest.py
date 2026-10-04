import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel
from database import get_session
from main import app
from fixtures import VALID_API_KEY, test_engine

def override_get_session():
    with Session(test_engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(autouse=True)
def setup_database():
    os.environ["API_KEY"] = VALID_API_KEY
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)

@pytest.fixture
def client():
    return TestClient(app)
