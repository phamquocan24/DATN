-- =============================================
-- CV RECRUITMENT SYSTEM - UUID SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS chat_feedback CASCADE;
DROP TABLE IF EXISTS user_preference_embeddings CASCADE;
DROP TABLE IF EXISTS chat_message_embeddings CASCADE;
DROP TABLE IF EXISTS faq_embeddings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS candidate_interests CASCADE;
DROP TABLE IF EXISTS candidate_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS question_answers CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS test_questions CASCADE;
DROP TABLE IF EXISTS job_tests CASCADE;
DROP TABLE IF EXISTS application_status_history CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS vector_matches CASCADE;
DROP TABLE IF EXISTS job_embeddings CASCADE;
DROP TABLE IF EXISTS cv_embeddings CASCADE;
DROP TABLE IF EXISTS cv_content CASCADE;
DROP TABLE IF EXISTS candidate_cvs CASCADE;
DROP TABLE IF EXISTS job_skills CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS recruiter_profiles CASCADE;
DROP TABLE IF EXISTS candidate_profiles CASCADE;
DROP TABLE IF EXISTS user_verification CASCADE;
DROP TABLE IF EXISTS user_profile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
    hire_authority_level VARCHAR(20) CHECK (hire_authority_level IN ('JUNIOR', 'SENIOR', 'MANAGER', 'DIRECTOR')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- JOBS
-- =============================================
CREATE TABLE jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID REFERENCES users(user_id),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    experience_level VARCHAR(20) CHECK (experience_level IN ('ENTRY', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER')),
    employment_type VARCHAR(20) CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE')),
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'VND',
    city_id UUID REFERENCES cities(city_id),
    district_id UUID REFERENCES districts(district_id),
    work_arrangement VARCHAR(20) CHECK (work_arrangement IN ('ONSITE', 'REMOTE', 'HYBRID')),
    min_experience_years INT DEFAULT 0,
    max_experience_years INT,
    category VARCHAR(100),
    education_requirements TEXT,
    language_requirements TEXT[],
    application_deadline DATE,
    auto_review_threshold DECIMAL(3,2) DEFAULT 0.70,
    priority_level VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority_level IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'EXPIRED')),
    published_at TIMESTAMP,
    view_count INT DEFAULT 0,
    application_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(skill_id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT FALSE,
    importance_level VARCHAR(20) CHECK (importance_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    min_years_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, skill_id)
);

CREATE TABLE saved_jobs (
    saved_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    notes TEXT,
    saved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(candidate_id, job_id)
);

-- =============================================
-- CVS & EMBEDDINGS
-- =============================================
CREATE TABLE candidate_cvs (
    cv_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    cv_name VARCHAR(200) NOT NULL,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(20) CHECK (file_type IN ('PDF', 'DOC', 'DOCX', 'TXT')),
    is_primary BOOLEAN DEFAULT FALSE,
    parsing_status VARCHAR(20) DEFAULT 'PENDING' CHECK (parsing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    parsing_error TEXT,
    language VARCHAR(10) DEFAULT 'vi',
    cv_version INT DEFAULT 1,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cv_content (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID REFERENCES candidate_cvs(cv_id) ON DELETE CASCADE,
    raw_text TEXT,
    parsed_content JSONB,
    ai_analysis JSONB,
    extracted_skills TEXT[],
    extracted_experience JSONB,
    extracted_education JSONB,
    extracted_contact JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cv_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID REFERENCES candidate_cvs(cv_id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    full_text_embedding VECTOR(1536),
    skills_embedding VECTOR(1536),
    experience_embedding VECTOR(1536),
    education_embedding VECTOR(1536),
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-small',
    content_hash VARCHAR(64),
    confidence_score DECIMAL(4,3),
    section_type VARCHAR(50) CHECK (section_type IN ('FULL_TEXT', 'SKILLS', 'EXPERIENCE', 'EDUCATION', 'SUMMARY')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    full_jd_embedding VECTOR(1536),
    requirements_embedding VECTOR(1536),
    skills_embedding VECTOR(1536),
    responsibilities_embedding VECTOR(1536),
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-small',
    content_hash VARCHAR(64),
    embedding_created_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vector_matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    cv_id UUID REFERENCES candidate_cvs(cv_id) ON DELETE CASCADE,
    cv_embedding_id UUID REFERENCES cv_embeddings(embedding_id) ON DELETE CASCADE,
    job_embedding_id UUID REFERENCES job_embeddings(embedding_id) ON DELETE CASCADE,
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
    UNIQUE(job_id, candidate_id, cv_id)
);

-- =============================================
-- APPLICATIONS & STATUS TRACKING
-- =============================================
CREATE TABLE applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    cv_id UUID REFERENCES candidate_cvs(cv_id) ON DELETE CASCADE,
    cover_letter TEXT,
    ai_match_score DECIMAL(5,2),
    ai_analysis JSONB,
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    current_status VARCHAR(30) DEFAULT 'APPLIED' CHECK (current_status IN ('APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN')),
    source VARCHAR(30) DEFAULT 'DIRECT' CHECK (source IN ('DIRECT', 'REFERRAL', 'SOCIAL', 'AGENCY', 'JOB_BOARD')),
    submitted_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

CREATE TABLE application_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    changed_by UUID REFERENCES users(user_id),
    change_reason TEXT,
    automated BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TESTING & ASSESSMENTS
-- =============================================
CREATE TABLE job_tests (
    test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    test_type VARCHAR(30) CHECK (test_type IN ('TECHNICAL', 'PERSONALITY', 'COGNITIVE', 'SKILLS', 'CUSTOM')),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')),
    duration_minutes INT DEFAULT 60,
    passing_score DECIMAL(5,2) DEFAULT 60.00,
    description TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES job_tests(test_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) CHECK (question_type IN ('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'ESSAY', 'CODE')),
    points DECIMAL(5,2) DEFAULT 1.00,
    time_limit_seconds INT,
    order_index INT,
    explanation TEXT,
    required BOOLEAN DEFAULT TRUE,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE question_options (
    option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES test_questions(question_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
    test_id UUID REFERENCES job_tests(test_id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMP,
    submit_time TIMESTAMP,
    total_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'TIMEOUT', 'ABANDONED')),
    passed BOOLEAN,
    time_taken_seconds INT,
    graded_by UUID REFERENCES users(user_id),
    graded_at TIMESTAMP,
    feedback TEXT,
    auto_graded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE question_answers (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID REFERENCES test_results(result_id) ON DELETE CASCADE,
    question_id UUID REFERENCES test_questions(question_id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES question_options(option_id),
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),
    time_taken_seconds INT,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- CHAT & AI SUPPORT
-- =============================================
CREATE TABLE chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_type VARCHAR(20) DEFAULT 'GENERAL' CHECK (session_type IN ('GENERAL', 'SUPPORT', 'CAREER_ADVICE', 'JOB_SEARCH')),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    platform VARCHAR(30) DEFAULT 'WEB' CHECK (platform IN ('WEB', 'MOBILE', 'API')),
    ip_address INET,
    user_agent TEXT,
    language VARCHAR(10) DEFAULT 'vi',
    satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5)
);

CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    sender_type VARCHAR(10) CHECK (sender_type IN ('USER', 'BOT', 'AGENT')),
    sender_id UUID REFERENCES users(user_id),
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'QUICK_REPLY', 'CARD')),
    intent VARCHAR(100),
    confidence DECIMAL(4,3),
    response_time_ms INT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    message_id UUID REFERENCES chat_messages(message_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('HELPFUL', 'NOT_HELPFUL', 'REPORT_ISSUE', 'SUGGESTION')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- EMBEDDINGS FOR AI FEATURES
-- =============================================
CREATE TABLE faq_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) CHECK (content_type IN ('FAQ', 'DOC', 'HELP_CENTER', 'POLICY')),
    title VARCHAR(200),
    original_text TEXT NOT NULL,
    embedding VECTOR(1536),
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-small',
    tags TEXT[],
    language VARCHAR(10) DEFAULT 'vi',
    category VARCHAR(50),
    priority INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_message_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(message_id) ON DELETE CASCADE,
    embedding VECTOR(1536),
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-small',
    intent VARCHAR(100),
    confidence_score DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_preference_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    preference_type VARCHAR(50) CHECK (preference_type IN ('JOB_SEARCH', 'CAREER_GOALS', 'SKILLS', 'INTERESTS')),
    preference_summary TEXT,
    embedding VECTOR(1536),
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-small',
    weight DECIMAL(3,2) DEFAULT 1.00,
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS & COMMUNICATIONS
-- =============================================
CREATE TABLE email_queue (
    email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    to_email VARCHAR(255) NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(300) NOT NULL,
    template_name VARCHAR(100),
    template_data JSONB,
    html_content TEXT,
    text_content TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    email_type VARCHAR(30) CHECK (email_type IN ('SYSTEM', 'OTP', 'JOB_ALERT', 'APPLICATION_UPDATE', 'MARKETING')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(30) CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'JOB_ALERT', 'APPLICATION_UPDATE')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    action_type VARCHAR(50),
    data JSONB DEFAULT '{}',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SYSTEM EVENTS & LOGS
-- =============================================
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE security_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY')),
    severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    description TEXT,
    ip_address INET,
    location VARCHAR(255),
    user_agent TEXT,
    device_info JSONB,
    risk_score DECIMAL(3,2),
    metadata JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(user_id),
    resolved_at TIMESTAMP,
    auto_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users and Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_verification_user_id ON user_verification(user_id);
CREATE INDEX idx_user_verification_code ON user_verification(verification_code);

-- Jobs
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_published_at ON jobs(published_at);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_city_id ON jobs(city_id);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_application_deadline ON jobs(application_deadline);

-- Applications
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(current_status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);

-- CVs and Embeddings
CREATE INDEX idx_candidate_cvs_candidate_id ON candidate_cvs(candidate_id);
CREATE INDEX idx_candidate_cvs_parsing_status ON candidate_cvs(parsing_status);
CREATE INDEX idx_cv_embeddings_cv_id ON cv_embeddings(cv_id);
CREATE INDEX idx_cv_embeddings_candidate_id ON cv_embeddings(candidate_id);
CREATE INDEX idx_job_embeddings_job_id ON job_embeddings(job_id);

-- Vector similarity search indexes
CREATE INDEX idx_cv_embeddings_full_text ON cv_embeddings USING ivfflat (full_text_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_cv_embeddings_skills ON cv_embeddings USING ivfflat (skills_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_job_embeddings_full_jd ON job_embeddings USING ivfflat (full_jd_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_job_embeddings_requirements ON job_embeddings USING ivfflat (requirements_embedding vector_cosine_ops) WITH (lists = 100);

-- Vector matches
CREATE INDEX idx_vector_matches_job_id ON vector_matches(job_id);
CREATE INDEX idx_vector_matches_candidate_id ON vector_matches(candidate_id);
CREATE INDEX idx_vector_matches_weighted_score ON vector_matches(weighted_score DESC);

-- Chat and AI
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_faq_embeddings_category ON faq_embeddings(category);
CREATE INDEX idx_faq_embeddings_language ON faq_embeddings(language);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Email queue
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);

-- Audit and Security
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
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
CREATE TRIGGER update_cv_embeddings_updated_at BEFORE UPDATE ON cv_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_embeddings_updated_at BEFORE UPDATE ON job_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_tests_updated_at BEFORE UPDATE ON job_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_questions_updated_at BEFORE UPDATE ON test_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faq_embeddings_updated_at BEFORE UPDATE ON faq_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preference_embeddings_updated_at BEFORE UPDATE ON user_preference_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION generate_sample_data()
RETURNS VOID AS $$
BEGIN
    -- Insert sample cities
    INSERT INTO cities (city_name, region, country_code) VALUES
    ('Hồ Chí Minh', 'Miền Nam', 'VN'),
    ('Hà Nội', 'Miền Bắc', 'VN'),
    ('Đà Nẵng', 'Miền Trung', 'VN'),
    ('Cần Thơ', 'Miền Nam', 'VN'),
    ('Hải Phòng', 'Miền Bắc', 'VN')
    ON CONFLICT (city_name) DO NOTHING;

    -- Insert sample skills
    INSERT INTO skills (skill_name, category) VALUES
    ('JavaScript', 'Programming'),
    ('Python', 'Programming'),
    ('Java', 'Programming'),
    ('Node.js', 'Backend'),
    ('React', 'Frontend'),
    ('Angular', 'Frontend'),
    ('Vue.js', 'Frontend'),
    ('PostgreSQL', 'Database'),
    
    ('Docker', 'DevOps'),
    ('Kubernetes', 'DevOps'),
    ('AWS', 'Cloud'),
    ('Azure', 'Cloud'),
    ('Machine Learning', 'AI'),
    ('Data Analysis', 'Analytics'),
    ('Project Management', 'Management'),
    ('Agile', 'Methodology'),
    ('Scrum', 'Methodology'),
    ('Git', 'Version Control'),
    ('CI/CD', 'DevOps')
    ON CONFLICT (skill_name) DO NOTHING;

    RAISE NOTICE 'Sample data generated successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to calculate CV completion percentage
CREATE OR REPLACE FUNCTION calculate_cv_completion_percentage(cv_id_param UUID)
RETURNS INT AS $$
DECLARE
    completion_percentage INT := 0;
    cv_content_record RECORD;
BEGIN
    SELECT * INTO cv_content_record FROM cv_content WHERE cv_id = cv_id_param;
    
    IF cv_content_record.raw_text IS NOT NULL THEN
        completion_percentage := completion_percentage + 30;
    END IF;
    
    IF cv_content_record.parsed_content IS NOT NULL THEN
        completion_percentage := completion_percentage + 40;
    END IF;
    
    IF cv_content_record.ai_analysis IS NOT NULL THEN
        completion_percentage := completion_percentage + 30;
    END IF;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update job application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs SET application_count = application_count + 1 WHERE job_id = NEW.job_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs SET application_count = application_count - 1 WHERE job_id = OLD.job_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job application count
CREATE TRIGGER trigger_update_job_application_count
    AFTER INSERT OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_job_application_count();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
-- COMMENT ON DATABASE current_database() IS 'CV Recruitment System with AI-powered matching';
COMMENT ON TABLE users IS 'Main users table storing candidates, recruiters, and admins';
COMMENT ON TABLE candidate_cvs IS 'CV files uploaded by candidates';
COMMENT ON TABLE cv_embeddings IS 'Vector embeddings for CV content similarity search';
COMMENT ON TABLE job_embeddings IS 'Vector embeddings for job descriptions';
COMMENT ON TABLE vector_matches IS 'Precomputed similarity scores between CVs and jobs';
COMMENT ON TABLE applications IS 'Job applications with AI matching scores';
COMMENT ON TABLE chat_sessions IS 'Chat sessions for AI-powered career support';
COMMENT ON TABLE audit_logs IS 'System audit trail for all important actions';
COMMENT ON TABLE security_events IS 'Security events and suspicious activities';

-- =============================================
-- PERFORMANCE STATISTICS
-- =============================================
-- Enable query statistics collection
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'CV RECRUITMENT SYSTEM SCHEMA CREATED SUCCESSFULLY';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Total Tables: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Total Indexes: %', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE 'Total Triggers: %', (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public');
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto, vector, pg_stat_statements';
    RAISE NOTICE 'Ready for AI-powered CV matching and recruitment!';
    RAISE NOTICE '================================================';
END $$; 