-- =============================================
-- MIGRATION 004: FIX MATCH SCORE COLUMN COMPATIBILITY
-- Created: 2024-12-20
-- Description: Fix match_score column issue in applications table
--              Add ai_match_score column if it doesn't exist
--              Ensure backward compatibility
-- =============================================

BEGIN;

-- 1. Check if ai_match_score column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'ai_match_score'
  ) THEN
    -- Add ai_match_score column
    ALTER TABLE applications ADD COLUMN ai_match_score DECIMAL(5,2);
    
    -- Copy existing match_score values to ai_match_score if match_score exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'applications' 
      AND column_name = 'match_score'
    ) THEN
      UPDATE applications SET ai_match_score = match_score WHERE match_score IS NOT NULL;
    END IF;
    
    RAISE NOTICE 'Added ai_match_score column to applications table';
  ELSE
    RAISE NOTICE 'ai_match_score column already exists';
  END IF;
END
$$;

-- 2. Ensure match_score column exists (for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'match_score'
  ) THEN
    -- Add match_score column if it doesn't exist
    ALTER TABLE applications ADD COLUMN match_score DECIMAL(5,2);
    
    -- Copy existing ai_match_score values to match_score if ai_match_score exists
    UPDATE applications SET match_score = ai_match_score WHERE ai_match_score IS NOT NULL;
    
    RAISE NOTICE 'Added match_score column to applications table';
  ELSE
    RAISE NOTICE 'match_score column already exists';
  END IF;
END
$$;

-- 3. Update current_status values to match the correct enum values
DO $$
BEGIN
  -- Update any legacy status values
  UPDATE applications 
  SET current_status = CASE 
    WHEN current_status = 'SUBMITTED' THEN 'PENDING'
    WHEN current_status = 'REVIEWING' THEN 'PENDING' 
    WHEN current_status = 'SHORTLISTED' THEN 'PENDING'
    WHEN current_status = 'INTERVIEWED' THEN 'PENDING'
    WHEN current_status = 'OFFERED' THEN 'PENDING'
    ELSE current_status
  END
  WHERE current_status IN ('SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED');
  
  RAISE NOTICE 'Updated status values in applications table';
END
$$;

-- 4. Add indexes for performance if they don't exist
DO $$
BEGIN
  -- Index on ai_match_score
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_applications_ai_match_score'
  ) THEN
    CREATE INDEX idx_applications_ai_match_score ON applications(ai_match_score DESC) WHERE ai_match_score IS NOT NULL;
    RAISE NOTICE 'Created index on ai_match_score';
  END IF;
  
  -- Index on match_score
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_applications_match_score'
  ) THEN
    CREATE INDEX idx_applications_match_score ON applications(match_score DESC) WHERE match_score IS NOT NULL;
    RAISE NOTICE 'Created index on match_score';
  END IF;
END
$$;

-- 5. Add comments for documentation
COMMENT ON COLUMN applications.ai_match_score IS 'AI-calculated match score between candidate and job (0-100)';
COMMENT ON COLUMN applications.match_score IS 'Legacy match score column for backward compatibility';

COMMIT;

-- Display final status
DO $$
BEGIN
  RAISE NOTICE 'Migration 004 completed successfully';
  RAISE NOTICE 'Both match_score and ai_match_score columns are now available';
  RAISE NOTICE 'Application.js COALESCE queries should work properly';
END
$$;
