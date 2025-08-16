import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Support both POSTGRES_* and DB_* environment variables
DB_NAME = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME")
DB_USER = os.getenv("POSTGRES_USER") or os.getenv("DB_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST")
DB_PORT = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
