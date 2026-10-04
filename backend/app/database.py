import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


connect_args = {}

_ca_path = settings.DB_SSL_CA

if _ca_path and os.path.exists(_ca_path):
    connect_args = {
        "ssl_ca": _ca_path,
        "ssl_verify_cert": True,
        "ssl_verify_identity": True,
    }

    print(f"[fileflow] TiDB SSL enabled: {_ca_path}")
else:
    print("[fileflow] WARNING: TiDB CA certificate not found.")


engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
    future=True,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()