-- =============================================
-- MIGRATION 006: ADD ADDRESS COLUMN FOR BACKEND COMPATIBILITY
-- Created: 2024-12-20
-- Description: Add address column to jobs table to match backend expectations
-- =============================================

-- Add address column that backend expects
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index for address column for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_address ON jobs(address);

COMMIT;
