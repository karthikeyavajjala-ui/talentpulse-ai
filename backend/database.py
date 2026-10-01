import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

active_db_url = settings.DATABASE_URL
if active_db_url.startswith("postgresql://"):
    active_db_url = active_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
active_db_engine_name = "PostgreSQL 17"

try:
    test_engine = create_engine(active_db_url, pool_pre_ping=True)
    with test_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = test_engine
except Exception as e:
    logger.warning(f"PostgreSQL connection failed ({e}), falling back to persistent SQLite.")
    active_db_url = settings.FALLBACK_DATABASE_URL
    active_db_engine_name = "SQLite (Persistent Fallback)"
    engine = create_engine(
        active_db_url,
        connect_args={"check_same_thread": False} if "sqlite" in active_db_url else {},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
