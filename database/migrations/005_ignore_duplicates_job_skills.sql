-- =============================================
-- MIGRATION 005: IGNORE DUPLICATE INSERTS INTO job_skills
-- Created: 2025-08-10
-- Description: Add BEFORE INSERT trigger to silently skip duplicates
--              for (job_id, skill_id) pairs to make seeds idempotent
-- =============================================

-- Create helper function
CREATE OR REPLACE FUNCTION job_skills_ignore_duplicates()
RETURNS TRIGGER AS $$
BEGIN
  -- If a row with same (job_id, skill_id) already exists, skip insert
  IF EXISTS (
    SELECT 1 FROM job_skills
    WHERE job_id = NEW.job_id AND skill_id = NEW.skill_id
  ) THEN
    RETURN NULL; -- skip this insert
  END IF;
  RETURN NEW; -- proceed with insert
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_job_skills_ignore_duplicates ON job_skills;
CREATE TRIGGER trg_job_skills_ignore_duplicates
BEFORE INSERT ON job_skills
FOR EACH ROW EXECUTE FUNCTION job_skills_ignore_duplicates();

COMMIT;


