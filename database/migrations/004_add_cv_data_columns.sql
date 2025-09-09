-- Migration: Add CV extracted data columns to user_profile table
-- This allows storing detailed education and experience data from CV extraction

-- Add columns to user_profile table
ALTER TABLE user_profile 
ADD COLUMN cv_education JSONB,
ADD COLUMN cv_experience JSONB;

-- Add indexes for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_user_profile_cv_education ON user_profile USING GIN (cv_education);
CREATE INDEX IF NOT EXISTS idx_user_profile_cv_experience ON user_profile USING GIN (cv_experience);

-- Add comments for documentation
COMMENT ON COLUMN user_profile.cv_education IS 'JSON array of education details extracted from CV';
COMMENT ON COLUMN user_profile.cv_experience IS 'JSON array of work experience details extracted from CV';
