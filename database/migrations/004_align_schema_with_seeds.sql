-- =============================================
-- MIGRATION 004: ALIGN SCHEMA WITH SEED FILES
-- Created: 2025-08-10
-- Description: Add missing constraints/columns used by seeds and
--              relax enums to match seed values without changing seed code
-- =============================================

-- Ensure companies can use ON CONFLICT (company_name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_company_name ON companies (company_name);

-- recruiter_profiles: add missing column used in seeds
ALTER TABLE recruiter_profiles
  ADD COLUMN IF NOT EXISTS hire_authority_level VARCHAR(20);

-- jobs: add columns referenced by seeds
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS work_arrangement VARCHAR(20),
  ADD COLUMN IF NOT EXISTS min_experience_years INT,
  ADD COLUMN IF NOT EXISTS max_experience_years INT,
  ADD COLUMN IF NOT EXISTS education_requirements TEXT,
  ADD COLUMN IF NOT EXISTS language_requirements TEXT[];

-- jobs: relax experience_level and status enums to include seed values
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_experience_level_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_experience_level_check
  CHECK (experience_level IN ('ENTRY', 'JUNIOR', 'MID', 'MIDDLE', 'SENIOR', 'LEAD', 'EXECUTIVE'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'CLOSED', 'REJECTED', 'PUBLISHED'));

-- jobs: add check for work_arrangement values used by seeds
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_work_arrangement_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_work_arrangement_check
  CHECK (work_arrangement IN ('ONSITE', 'REMOTE', 'HYBRID'));

-- skills: add column used by seeds
ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS skill_type VARCHAR(50);

-- job_skills: add column used by seeds
ALTER TABLE job_skills
  ADD COLUMN IF NOT EXISTS required_level VARCHAR(20);


