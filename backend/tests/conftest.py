import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_BROKER_URL", "memory://")
os.environ.setdefault("CELERY_RESULT_BACKEND", "cache+memory://")
os.environ.setdefault("S3_BUCKET", "test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.storage import get_storage


@pytest.fixture(scope="session")
def engine():
    eng = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(eng)
    return eng


@pytest.fixture
def db_session(engine):
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


class _InMemoryStorage:
    def __init__(self):
        self.store: dict[str, bytes] = {}

    def upload_bytes(self, key, data, content_type):
        self.store[key] = data

    def download_bytes(self, key):
        return self.store[key]

    def delete(self, key):
        self.store.pop(key, None)

    def generate_signed_url(self, key):
        return f"memory://{key}"


@pytest.fixture
def storage():
    s = _InMemoryStorage()
    get_storage.cache_clear()
    app.dependency_overrides[get_storage] = lambda: s
    yield s


@pytest.fixture
def client(db_session, storage, monkeypatch):
    def override_db():
        yield db_session

    app.dependency_overrides[get_db] = override_db

    # Prevent real Celery enqueue in tests
    monkeypatch.setattr("app.services.job_service.process_file_task.delay",
                        lambda *a, **k: None)

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()