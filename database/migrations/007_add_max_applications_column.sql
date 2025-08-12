-- =============================================
-- MIGRATION 007: ADD MAX_APPLICATIONS COLUMN
-- Created: 2024-12-20
-- Description: Add max_applications column to jobs table for backend compatibility
-- =============================================

-- Add max_applications column that backend expects
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS max_applications INT DEFAULT 1;

-- Add constraint to ensure positive values
ALTER TABLE jobs
  ADD CONSTRAINT IF NOT EXISTS jobs_max_applications_positive 
  CHECK (max_applications > 0);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_max_applications ON jobs(max_applications);

COMMIT;
