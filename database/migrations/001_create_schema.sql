-- =============================================
-- MIGRATION 001: CREATE SCHEMA
-- Created: 2024-01-01
-- Description: Initial schema creation for CV Recruitment System
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Set timezone
SET timezone = 'Asia/Ho_Chi_Minh';

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('CANDIDATE', 'RECRUITER', 'ADMIN')) DEFAULT 'CANDIDATE',
    auth_provider VARCHAR(20) DEFAULT 'LOCAL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profile (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    profile_image_url VARCHAR(500),
    bio TEXT,
    website_url VARCHAR(500),
    languages TEXT[],
    profile_completed BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'PENDING',
    last_login_at TIMESTAMP,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_verification (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    verification_type VARCHAR(20) CHECK (verification_type IN ('EMAIL', 'PHONE', 'PASSWORD_RESET')),
    verification_code VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- GEOGRAPHY & LOCATIONS
-- =============================================
CREATE TABLE cities (
    city_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(100) NOT NULL UNIQUE,
    region VARCHAR(50),
    country_code VARCHAR(3) DEFAULT 'VN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE districts (
    district_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(city_id) ON DELETE CASCADE,
    district_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SKILLS & CATEGORIES
-- =============================================
CREATE TABLE skills (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- COMPANIES
-- =============================================
CREATE TABLE companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    tax_code VARCHAR(50) UNIQUE,
    description TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(20) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    address TEXT,
    city_id UUID REFERENCES cities(city_id),
    district_id UUID REFERENCES districts(district_id),
    website VARCHAR(500),
    logo_url VARCHAR(500),
    company_status VARCHAR(20) DEFAULT 'PENDING' CHECK (company_status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE')),
    is_verified BOOLEAN DEFAULT FALSE,
    founded_year INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- CANDIDATE PROFILES
-- =============================================
CREATE TABLE candidate_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
    address TEXT,
    city_id UUID REFERENCES cities(city_id),
    district_id UUID REFERENCES districts(district_id),
    education_level VARCHAR(20) CHECK (education_level IN ('HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD')),
    years_experience INT CHECK (years_experience >= 0),
    current_job_title VARCHAR(200),
    current_company VARCHAR(200),
    current_salary DECIMAL(12,2),
    expected_salary DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'VND',
    notice_period_days INT DEFAULT 30,
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    remote_work_preference VARCHAR(20) CHECK (remote_work_preference IN ('ONSITE', 'REMOTE', 'HYBRID', 'FLEXIBLE')),
    primary_cv_id UUID,
    profile_completion_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE candidate_skills (
    candidate_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    years_experience INT CHECK (years_experience >= 0),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, skill_id)
);

CREATE TABLE candidate_interests (
    candidate_interests_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
    interest_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- RECRUITER PROFILES
-- =============================================
CREATE TABLE recruiter_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    position VARCHAR(100),
    department VARCHAR(100),
    employee_id VARCHAR(50),
    hire_date DATE,
    permissions TEXT[] DEFAULT ARRAY['VIEW_JOBS', 'CREATE_JOBS', 'MANAGE_APPLICATIONS'],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- JOBS
-- =============================================
CREATE TABLE jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES recruiter_profiles(profile_id),
    employment_type VARCHAR(20) CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE')),
    experience_level VARCHAR(20) CHECK (experience_level IN ('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE')),
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'VND',
    city_id UUID REFERENCES cities(city_id),
    district_id UUID REFERENCES districts(district_id),
    address TEXT,
    remote_work_option VARCHAR(20) CHECK (remote_work_option IN ('ONSITE', 'REMOTE', 'HYBRID')),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'CLOSED', 'REJECTED')),
    application_deadline DATE,
    max_applications INT,
    published_at TIMESTAMP,
    closed_at TIMESTAMP,
    view_count INT DEFAULT 0,
    application_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_skills (
    job_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, skill_id)
);

CREATE TABLE saved_jobs (
    saved_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(candidate_id, job_id)
);

-- =============================================
-- CV MANAGEMENT
-- =============================================
CREATE TABLE candidate_cvs (
    cv_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(20),
    file_path VARCHAR(500),
    parsing_status VARCHAR(20) DEFAULT 'PENDING' CHECK (parsing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cv_content (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID UNIQUE REFERENCES candidate_cvs(cv_id) ON DELETE CASCADE,
    extracted_text TEXT,
    structured_data JSONB,
    skills_detected TEXT[],
    experience_years INT,
    education_level VARCHAR(50),
    last_position VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- APPLICATIONS
-- =============================================
CREATE TABLE applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
    cv_id UUID REFERENCES candidate_cvs(cv_id),
    cover_letter TEXT,
    current_status VARCHAR(20) DEFAULT 'SUBMITTED' CHECK (current_status IN ('SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN')),
    match_score DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT NOW(),
    last_updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

CREATE TABLE application_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID REFERENCES users(user_id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TESTING SYSTEM
-- =============================================
CREATE TABLE job_tests (
    test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    total_questions INT NOT NULL,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES job_tests(test_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY', 'CODE')),
    points DECIMAL(5,2) DEFAULT 1.00,
    correct_answer TEXT,
    explanation TEXT,
    order_index INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE question_options (
    option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES test_questions(question_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES job_tests(test_id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidate_profiles(profile_id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
    total_score DECIMAL(5,2),
    max_possible_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    assigned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE question_answers (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID REFERENCES test_results(result_id) ON DELETE CASCADE,
    question_id UUID REFERENCES test_questions(question_id) ON DELETE CASCADE,
    answer_text TEXT,
    selected_options UUID[],
    points_earned DECIMAL(5,2) DEFAULT 0,
    is_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_verification_user_id ON user_verification(user_id);
CREATE INDEX idx_user_verification_code ON user_verification(verification_code);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_published_at ON jobs(published_at);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_city_id ON jobs(city_id);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_application_deadline ON jobs(application_deadline);

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(current_status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);

CREATE INDEX idx_candidate_cvs_candidate_id ON candidate_cvs(candidate_id);
CREATE INDEX idx_candidate_cvs_parsing_status ON candidate_cvs(parsing_status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON user_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recruiter_profiles_updated_at BEFORE UPDATE ON recruiter_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_cvs_updated_at BEFORE UPDATE ON candidate_cvs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cv_content_updated_at BEFORE UPDATE ON cv_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_tests_updated_at BEFORE UPDATE ON job_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_questions_updated_at BEFORE UPDATE ON test_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT; 