-- =============================================
-- MIGRATION 003: ADD AI EMBEDDINGS AND VECTOR TABLES
-- Created: 2025-08-10
-- Description: Add pgvector extension and AI-related embedding tables
--              using UUID keys to unify Business DB and AI services
-- =============================================

-- Enable pgvector extension for vector similarity search
-- Note: Extension should be created by superuser first
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- Ensure update_updated_at_column() trigger function exists (created in 001)
-- If not, create it here defensively
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END
$$;

-- =============================================
-- CV EMBEDDINGS (UUID, supports 384d and 1536d)
-- =============================================
CREATE TABLE IF NOT EXISTS cv_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID NOT NULL REFERENCES candidate_cvs(cv_id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
  -- SBERT-size vectors (384 dims)
  full_text_embedding_384 VECTOR(384),
  skills_embedding_384 VECTOR(384),
  experience_embedding_384 VECTOR(384),
  education_embedding_384 VECTOR(384),
  -- Larger embedding vectors (1536 dims)
  full_text_embedding_1536 VECTOR(1536),
  skills_embedding_1536 VECTOR(1536),
  experience_embedding_1536 VECTOR(1536),
  education_embedding_1536 VECTOR(1536),
  model_version VARCHAR(100),
  content_hash VARCHAR(64),
  confidence_score DECIMAL(4,3),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (cv_id, candidate_id)
);

-- TRIGGER: updated_at
DROP TRIGGER IF EXISTS update_cv_embeddings_updated_at ON cv_embeddings;
CREATE TRIGGER update_cv_embeddings_updated_at
BEFORE UPDATE ON cv_embeddings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- JOB EMBEDDINGS (UUID, supports 384d and 1536d)
-- =============================================
CREATE TABLE IF NOT EXISTS job_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  -- SBERT-size vectors (384 dims)
  full_jd_embedding_384 VECTOR(384),
  requirements_embedding_384 VECTOR(384),
  skills_embedding_384 VECTOR(384),
  responsibilities_embedding_384 VECTOR(384),
  -- Larger embedding vectors (1536 dims)
  full_jd_embedding_1536 VECTOR(1536),
  requirements_embedding_1536 VECTOR(1536),
  skills_embedding_1536 VECTOR(1536),
  responsibilities_embedding_1536 VECTOR(1536),
  model_version VARCHAR(100),
  content_hash VARCHAR(64),
  embedding_created_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (job_id)
);

-- TRIGGER: updated_at
DROP TRIGGER IF EXISTS update_job_embeddings_updated_at ON job_embeddings;
CREATE TRIGGER update_job_embeddings_updated_at
BEFORE UPDATE ON job_embeddings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VECTOR MATCHES (UUID)
-- =============================================
CREATE TABLE IF NOT EXISTS vector_matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
  cv_id UUID REFERENCES candidate_cvs(cv_id) ON DELETE CASCADE,
  cv_embedding_id UUID REFERENCES cv_embeddings(embedding_id) ON DELETE SET NULL,
  job_embedding_id UUID REFERENCES job_embeddings(embedding_id) ON DELETE SET NULL,
  overall_similarity DECIMAL(5,4),
  skills_similarity DECIMAL(5,4),
  experience_similarity DECIMAL(5,4),
  education_similarity DECIMAL(5,4),
  weighted_score DECIMAL(5,4),
  match_type VARCHAR(30) CHECK (match_type IN ('AUTO', 'MANUAL', 'AI_SUGGEST')),
  last_calculated TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  computed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (job_id, candidate_id, cv_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE (create if not exists pattern)
-- =============================================
DO $$
BEGIN
  -- CV Embeddings 384d
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cv_emb_full_text_384') THEN
    CREATE INDEX idx_cv_emb_full_text_384 ON cv_embeddings USING ivfflat (full_text_embedding_384 vector_cosine_ops) WITH (lists = 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cv_emb_skills_384') THEN
    CREATE INDEX idx_cv_emb_skills_384 ON cv_embeddings USING ivfflat (skills_embedding_384 vector_cosine_ops) WITH (lists = 100);
  END IF;
  -- JOB Embeddings 384d
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_job_emb_full_jd_384') THEN
    CREATE INDEX idx_job_emb_full_jd_384 ON job_embeddings USING ivfflat (full_jd_embedding_384 vector_cosine_ops) WITH (lists = 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_job_emb_requirements_384') THEN
    CREATE INDEX idx_job_emb_requirements_384 ON job_embeddings USING ivfflat (requirements_embedding_384 vector_cosine_ops) WITH (lists = 100);
  END IF;

  -- Optionally prepare 1536d indexes (kept commented for environments lacking 1536)
  -- CREATE INDEX idx_cv_emb_full_text_1536 ON cv_embeddings USING ivfflat (full_text_embedding_1536 vector_cosine_ops) WITH (lists = 100);
  -- CREATE INDEX idx_job_emb_full_jd_1536 ON job_embeddings USING ivfflat (full_jd_embedding_1536 vector_cosine_ops) WITH (lists = 100);

  -- Vector matches helpers
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vector_matches_job_id') THEN
    CREATE INDEX idx_vector_matches_job_id ON vector_matches(job_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vector_matches_candidate_id') THEN
    CREATE INDEX idx_vector_matches_candidate_id ON vector_matches(candidate_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vector_matches_weighted_score_desc') THEN
    CREATE INDEX idx_vector_matches_weighted_score_desc ON vector_matches(weighted_score DESC);
  END IF;
END
$$;

COMMIT; 