-- Optimize search performance with strategic indexes
-- Run this after setting up the main database schema

-- Index for job title search (most common search)
CREATE INDEX IF NOT EXISTS idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title));

-- Index for company name search
CREATE INDEX IF NOT EXISTS idx_jobs_company_search ON jobs (company_id);

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs (status, created_at DESC);

-- Index for location-based search
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs (city_id) WHERE city_id IS NOT NULL;

-- Index for employment type filter
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs (employment_type) WHERE employment_type IS NOT NULL;

-- Index for salary range search
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs (salary_min, salary_max) WHERE salary_min IS NOT NULL OR salary_max IS NOT NULL;

-- Index for featured jobs
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs (featured, created_at DESC) WHERE featured = true;

-- Composite index for active jobs with common sorting
CREATE INDEX IF NOT EXISTS idx_jobs_active_search ON jobs (status, featured DESC, created_at DESC) 
WHERE status IN ('ACTIVE', 'PUBLISHED');

-- Index for application count joins (optimize the most common join)
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications (job_id);

-- Index for company name search in joins
CREATE INDEX IF NOT EXISTS idx_companies_name_search ON companies USING gin(to_tsvector('english', company_name));

-- Index for city name search
CREATE INDEX IF NOT EXISTS idx_cities_name_search ON cities USING gin(to_tsvector('english', city_name));

-- Analyze tables to update statistics
ANALYZE jobs;
ANALYZE companies;
ANALYZE applications;
ANALYZE cities;
