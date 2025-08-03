-- =============================================
-- MIGRATION 002: ADD FIREBASE COLUMNS
-- Created: 2025-01-03
-- Description: Add Firebase authentication columns to users table
-- =============================================

-- Add Firebase columns to users table (if they don't exist)
DO $$ 
BEGIN
    -- Add firebase_uid column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'firebase_uid') THEN
        ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE;
    END IF;
    
    -- Add is_email_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_email_verified') THEN
        ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add profile_image_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500);
    END IF;
END
$$;

-- Create indexes for Firebase columns (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_firebase_uid') THEN
        CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_is_email_verified') THEN
        CREATE INDEX idx_users_is_email_verified ON users(is_email_verified);
    END IF;
END
$$;

-- Add comments for documentation
COMMENT ON COLUMN users.firebase_uid IS 'Firebase user UID for authentication';
COMMENT ON COLUMN users.is_email_verified IS 'Whether user email has been verified via Firebase or email verification';
COMMENT ON COLUMN users.profile_image_url IS 'URL to user profile image from social login or upload';