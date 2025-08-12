-- =============================================
-- MIGRATION 008: ADD REMOTE_WORK_OPTION COLUMN
-- Created: 2024-12-20
-- Description: Add remote_work_option column to jobs table for backend compatibility
-- =============================================

-- Add remote_work_option column that backend expects
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS remote_work_option VARCHAR(20);

-- Add constraint for valid values
ALTER TABLE jobs
  ADD CONSTRAINT IF NOT EXISTS jobs_remote_work_option_check
  CHECK (remote_work_option IN ('ONSITE', 'REMOTE', 'HYBRID'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_remote_work_option ON jobs(remote_work_option);

COMMIT;
