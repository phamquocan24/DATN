import psycopg2
from psycopg2.extras import Json
import numpy as np
from dotenv import load_dotenv
import os
import json

# pgvector adapter
try:
    from pgvector.psycopg2 import register_vector
except Exception:
    register_vector = None

# SentenceTransformer kept for 384-dim embeddings (MiniLM)
from sentence_transformers import SentenceTransformer

load_dotenv()

DB_NAME = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME")
DB_USER = os.getenv("POSTGRES_USER") or os.getenv("DB_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST")
DB_PORT = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT")

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# Initialize SBERT model (384 dims)
model = SentenceTransformer(MODEL_NAME)


def get_db_connection():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )
    # Register pgvector adapter if available
    if register_vector is not None:
        register_vector(conn)
    return conn


def _ensure_list_of_floats(raw):
    if raw is None:
        return None
    if isinstance(raw, (tuple, list)) and raw and isinstance(raw[0], str):
        try:
            raw = json.loads(raw[0])
        except Exception:
            return None
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return None
    try:
        return [float(x) for x in raw]
    except Exception:
        return None


# Unified write into Business DB tables with UUID keys and 384-dim columns

def save_cv_embedding(cv_id_uuid: str, candidate_profile_id_uuid: str, text: str, column_suffix: str = "full_text"):
    """Save a 384-dim embedding into business.cv_embeddings 384 columns.
    column_suffix in {full_text, skills, experience, education}
    Maps to columns: <suffix>_embedding_384
    """
    embedding = model.encode(text, normalize_embeddings=True).tolist()
    column = f"{column_suffix}_embedding_384"
    conn = get_db_connection()
    cur = conn.cursor()
    # Upsert by (cv_id, candidate_id) unique key
    cur.execute(
        f"""
        INSERT INTO cv_embeddings (cv_id, candidate_id, {column}, model_version, created_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (cv_id, candidate_id) DO UPDATE
        SET {column} = EXCLUDED.{column},
            model_version = EXCLUDED.model_version,
            updated_at = NOW()
        RETURNING embedding_id
        """,
        (cv_id_uuid, candidate_profile_id_uuid, embedding, MODEL_NAME),
    )
    embedding_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return embedding_id


def save_job_embedding(job_id_uuid: str, text: str, column_suffix: str = "full_jd"):
    """Save a 384-dim embedding into business.job_embeddings 384 columns.
    column_suffix in {full_jd, requirements, skills, responsibilities}
    Maps to columns: <suffix>_embedding_384
    """
    embedding = model.encode(text, normalize_embeddings=True).tolist()
    column = f"{column_suffix}_embedding_384"
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        f"""
        INSERT INTO job_embeddings (job_id, {column}, model_version, created_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (job_id) DO UPDATE
        SET {column} = EXCLUDED.{column},
            model_version = EXCLUDED.model_version,
            updated_at = NOW()
        RETURNING embedding_id
        """,
        (job_id_uuid, embedding, MODEL_NAME),
    )
    embedding_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return embedding_id


def get_embedding(table: str, id_column: str, id_value: str, embedding_column: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(f"SELECT {embedding_column} FROM {table} WHERE {id_column} = %s", (id_value,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    if not result:
        return None
    return _ensure_list_of_floats(result[0])