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
    try:
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
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        raise


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


# FIXED: Use correct column names with _384 suffix and proper error handling
def save_cv_embedding(cv_id_uuid: str, candidate_profile_id_uuid: str, text: str, column_suffix: str = "full_text"):
    """Save a 384-dim embedding into cv_embeddings table.
    column_suffix in {full_text, skills, experience, education}
    Maps to columns: <suffix>_embedding_384
    """
    if not text or not text.strip():
        print(f"Warning: Empty text for CV embedding {cv_id_uuid}, column {column_suffix}")
        return None
        
    try:
        embedding = model.encode(text.strip(), normalize_embeddings=True).tolist()
        column = f"{column_suffix}_embedding_384"
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # FIXED: Use proper upsert with correct column names
        cur.execute(
            f"""
            INSERT INTO cv_embeddings (cv_id, candidate_id, {column}, model_version, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (cv_id, candidate_id) DO UPDATE
            SET {column} = EXCLUDED.{column},
                model_version = EXCLUDED.model_version,
                updated_at = NOW()
            RETURNING embedding_id
            """,
            (cv_id_uuid, candidate_profile_id_uuid, embedding, MODEL_NAME),
        )
        
        result = cur.fetchone()
        if result:
            embedding_id = result[0]
        else:
            print(f"Warning: No embedding_id returned for CV {cv_id_uuid}")
            embedding_id = None
            
        conn.commit()
        cur.close()
        conn.close()
        return embedding_id
        
    except Exception as e:
        print(f"Error saving CV embedding for {cv_id_uuid}: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            cur.close()
            conn.close()
        return None


def save_job_embedding(job_id_uuid: str, text: str, column_suffix: str = "full_jd"):
    """Save a 384-dim embedding into job_embeddings table.
    column_suffix in {full_jd, requirements, skills, responsibilities}  
    Maps to columns: <suffix>_embedding_384
    """
    if not text or not text.strip():
        print(f"Warning: Empty text for Job embedding {job_id_uuid}, column {column_suffix}")
        return None
        
    try:
        embedding = model.encode(text.strip(), normalize_embeddings=True).tolist()
        column = f"{column_suffix}_embedding_384"
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # FIXED: Use proper upsert with correct column names  
        cur.execute(
            f"""
            INSERT INTO job_embeddings (job_id, {column}, model_version, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            ON CONFLICT (job_id) DO UPDATE
            SET {column} = EXCLUDED.{column},
                model_version = EXCLUDED.model_version,
                updated_at = NOW()
            RETURNING embedding_id
            """,
            (job_id_uuid, embedding, MODEL_NAME),
        )
        
        result = cur.fetchone()
        if result:
            embedding_id = result[0]
        else:
            print(f"Warning: No embedding_id returned for Job {job_id_uuid}")
            embedding_id = None
            
        conn.commit()
        cur.close()
        conn.close()
        return embedding_id
        
    except Exception as e:
        print(f"Error saving Job embedding for {job_id_uuid}: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            cur.close()
            conn.close()
        return None


def get_embedding(table: str, id_column: str, id_value: str, embedding_column: str):
    """Get embedding from database with proper error handling"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(f"SELECT {embedding_column} FROM {table} WHERE {id_column} = %s", (id_value,))
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not result or result[0] is None:
            return None
            
        return _ensure_list_of_floats(result[0])
        
    except Exception as e:
        print(f"Error getting embedding from {table}: {str(e)}")
        if 'conn' in locals():
            cur.close()
            conn.close()
        return None


def test_database_connection():
    """Test database connection and required tables"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Test basic connection
        cur.execute("SELECT 1")
        
        # Test required tables exist
        required_tables = [
            'candidate_cvs', 'jobs', 'cv_content', 'cv_embeddings', 
            'job_embeddings', 'vector_matches', 'skills', 'job_skills',
            'candidate_skills', 'candidate_profiles'
        ]
        
        for table in required_tables:
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = %s
                )
            """, (table,))
            exists = cur.fetchone()[0]
            if not exists:
                print(f"WARNING: Table {table} does not exist")
            else:
                print(f"✓ Table {table} exists")
        
        # Test pgvector extension
        cur.execute("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')")
        vector_exists = cur.fetchone()[0]
        if vector_exists:
            print("✓ pgvector extension is installed")
        else:
            print("WARNING: pgvector extension is not installed")
        
        cur.close()
        conn.close()
        print("✓ Database connection test successful")
        return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {str(e)}")
        if 'conn' in locals():
            cur.close()
            conn.close()
        return False


if __name__ == "__main__":
    print("Testing database connection...")
    test_database_connection()
