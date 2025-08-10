-- =============================================
-- SEED DATA 002: SAMPLE COMPANIES AND JOBS
-- Description: Sample data for 3 companies and their corresponding jobs
-- =============================================

-- Insert sample users for recruiters first
DO $$
DECLARE
    recruiter1_id UUID;
    recruiter2_id UUID;
    recruiter3_id UUID;
    company1_id UUID;
    company2_id UUID;
    company3_id UUID;
    hcm_city_id UUID;
    hcm_district1_id UUID;
    hcm_district2_id UUID;
    hcm_district3_id UUID;
    hn_city_id UUID;
    dn_city_id UUID;
    hn_district_id UUID;
    dn_district_id UUID;
BEGIN
    -- Get city and district IDs
    SELECT city_id INTO hcm_city_id FROM cities WHERE city_name = 'Hồ Chí Minh';
    SELECT city_id INTO hn_city_id FROM cities WHERE city_name = 'Hà Nội';
    SELECT city_id INTO dn_city_id FROM cities WHERE city_name = 'Đà Nẵng';
    
    SELECT district_id INTO hcm_district1_id FROM districts WHERE district_name = 'Quận 1' AND city_id = hcm_city_id;
    SELECT district_id INTO hcm_district2_id FROM districts WHERE district_name = 'Quận 2' AND city_id = hcm_city_id;
    SELECT district_id INTO hcm_district3_id FROM districts WHERE district_name = 'Quận 7' AND city_id = hcm_city_id;
    SELECT district_id INTO hn_district_id FROM districts WHERE district_name = 'Quận Ba Đình' AND city_id = hn_city_id;
    SELECT district_id INTO dn_district_id FROM districts WHERE district_name = 'Quận Hải Châu' AND city_id = dn_city_id;

    -- Insert sample recruiters
    INSERT INTO users (user_id, email, password_hash, phone, full_name, role, is_active)
    VALUES 
        (gen_random_uuid(), 'hr@techsolutions.com', '$2b$10$example.hash1', '+84 123 456 789', 'Nguyễn Thị Mai', 'RECRUITER', true),
        (gen_random_uuid(), 'recruiter@innovatetech.com', '$2b$10$example.hash2', '+84 987 654 321', 'Trần Văn Nam', 'RECRUITER', true),
        (gen_random_uuid(), 'hiring@digitalcorp.com', '$2b$10$example.hash3', '+84 555 123 456', 'Lê Thị Hoa', 'RECRUITER', true)
    ON CONFLICT (email) DO NOTHING;

    -- Get the recruiter IDs
    SELECT user_id INTO recruiter1_id FROM users WHERE email = 'hr@techsolutions.com';
    SELECT user_id INTO recruiter2_id FROM users WHERE email = 'recruiter@innovatetech.com';
    SELECT user_id INTO recruiter3_id FROM users WHERE email = 'hiring@digitalcorp.com';

    -- Insert user profiles for recruiters
    INSERT INTO user_profile (user_id, profile_completed, account_status)
    VALUES 
        (recruiter1_id, true, 'ACTIVE'),
        (recruiter2_id, true, 'ACTIVE'),
        (recruiter3_id, true, 'ACTIVE')
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert sample companies
    INSERT INTO companies (
        company_id, company_name, tax_code, description, industry, company_size, 
        address, city_id, district_id, website, logo_url, company_status, 
        is_verified, founded_year
    ) VALUES 
        (
            gen_random_uuid(),
            'Tech Solutions Inc.',
            '0123456789',
            'A leading technology solutions provider specializing in software development, cloud services, and digital transformation for enterprises across Vietnam.',
            'Information Technology',
            '201-500',
            '123 Tech Street, District 1',
            hcm_city_id,
            hcm_district1_id,
            'https://techsolutions.com',
            'https://techsolutions.com/logo.png',
            'ACTIVE',
            true,
            2010
        ),
        (
            gen_random_uuid(),
            'Innovate Tech Vietnam',
            '0234567890',
            'Innovative startup focused on AI/ML solutions, mobile app development, and IoT technologies. We create cutting-edge products for the Vietnamese market.',
            'Software Development',
            '51-200',
            '456 Innovation Hub, District 2',
            hcm_city_id,
            hcm_district2_id,
            'https://innovatetech.vn',
            'https://innovatetech.vn/assets/logo.png',
            'ACTIVE',
            true,
            2018
        ),
        (
            gen_random_uuid(),
            'Digital Corp Asia',
            '0345678901',
            'Digital marketing and e-commerce solutions company. We help businesses transform their digital presence and grow their online revenue.',
            'Digital Marketing',
            '11-50',
            '789 Digital Plaza, District 7',
            hcm_city_id,
            hcm_district3_id,
            'https://digitalcorp.asia',
            'https://digitalcorp.asia/img/brand.png',
            'ACTIVE',
            true,
            2020
        )
    ON CONFLICT (tax_code) DO NOTHING;

    -- Get company IDs
    SELECT company_id INTO company1_id FROM companies WHERE tax_code = '0123456789';
    SELECT company_id INTO company2_id FROM companies WHERE tax_code = '0234567890';
    SELECT company_id INTO company3_id FROM companies WHERE tax_code = '0345678901';

    -- Insert recruiter profiles
    INSERT INTO recruiter_profiles (user_id, company_id, position, department, hire_authority_level)
    VALUES 
        (recruiter1_id, company1_id, 'Senior HR Manager', 'Human Resources', 'SENIOR'),
        (recruiter2_id, company2_id, 'Technical Recruiter', 'Engineering', 'MANAGER'),
        (recruiter3_id, company3_id, 'Talent Acquisition Lead', 'HR & Talent', 'DIRECTOR')
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert sample jobs
    INSERT INTO jobs (
        job_id, recruiter_id, company_id, title, description, requirements, 
        responsibilities, benefits, experience_level, employment_type, 
        salary_min, salary_max, currency, city_id, district_id, work_arrangement,
        min_experience_years, max_experience_years, category, education_requirements,
        language_requirements, application_deadline, status, published_at, view_count
    ) VALUES 
        -- Job 1: Senior Full Stack Developer at Tech Solutions Inc.
        (
            gen_random_uuid(),
            recruiter1_id,
            company1_id,
            'Senior Full Stack Developer',
            'We are seeking a highly skilled Senior Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies and frameworks. This role offers excellent opportunities for growth and innovation in a collaborative environment.',
            'Bachelor''s degree in Computer Science or related field; 4+ years of experience in full-stack development; Proficiency in React.js, Node.js, PostgreSQL; Experience with cloud platforms (AWS/Azure); Strong understanding of RESTful APIs and microservices architecture; Excellent problem-solving skills and attention to detail.',
            'Develop and maintain scalable web applications; Collaborate with cross-functional teams to define and implement new features; Write clean, maintainable, and well-documented code; Participate in code reviews and technical discussions; Optimize application performance and ensure security best practices; Mentor junior developers and contribute to team knowledge sharing.',
            'Competitive salary range 25-35M VND; Annual performance bonus; Health insurance for employee and family; 15 days annual leave + public holidays; Professional development budget 10M VND/year; Modern office with latest technology; Flexible working hours and remote work options; Team building activities and company trips.',
            'SENIOR',
            'FULL_TIME',
            25000000,
            35000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            4,
            8,
            'Software Development',
            'Bachelor''s degree in Computer Science, Software Engineering, or related technical field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'PUBLISHED',
            NOW(),
            150
        ),
        -- Job 2: Mobile App Developer (React Native) at Innovate Tech Vietnam
        (
            gen_random_uuid(),
            recruiter2_id,
            company2_id,
            'Mobile App Developer (React Native)',
            'Join our innovative team as a Mobile App Developer specializing in React Native. You will create amazing mobile experiences for our users and contribute to cutting-edge mobile solutions. We''re looking for passionate developers who love building beautiful, performant mobile applications.',
            'Bachelor''s degree in Computer Science or equivalent experience; 2+ years of React Native development experience; Strong knowledge of JavaScript/TypeScript; Experience with native iOS/Android development is a plus; Familiarity with Redux, MobX, or similar state management; Understanding of mobile UI/UX principles; Experience with API integration and third-party libraries.',
            'Design and develop mobile applications using React Native; Implement pixel-perfect UIs that match designs and specifications; Integrate with backend APIs and third-party services; Optimize app performance and ensure smooth user experience; Debug and resolve technical issues across different devices; Collaborate with designers and backend developers; Stay updated with latest mobile development trends and technologies.',
            'Salary range 18-28M VND based on experience; Stock options in growing startup; Premium health insurance; 12 days annual leave + sick leave; Learning and development opportunities; Latest MacBook Pro and development tools; Startup environment with rapid growth potential; Regular team events and hackathons.',
            'MIDDLE',
            'FULL_TIME',
            18000000,
            28000000,
            'VND',
            hcm_city_id,
            hcm_district2_id,
            'ONSITE',
            2,
            5,
            'Mobile Development',
            'Bachelor''s degree in Computer Science, Information Technology, or related field',
            ARRAY['Vietnamese', 'English'],
            '2024-11-30',
            'PUBLISHED',
            NOW(),
            89
        ),
        -- Job 3: Digital Marketing Specialist at Digital Corp Asia
        (
            gen_random_uuid(),
            recruiter3_id,
            company3_id,
            'Digital Marketing Specialist',
            'We are looking for a creative and data-driven Digital Marketing Specialist to join our growing marketing team. You will be responsible for developing and executing digital marketing campaigns across multiple channels to drive brand awareness and customer acquisition for our clients.',
            'Bachelor''s degree in Marketing, Communications, or related field; 2+ years of digital marketing experience; Proficiency in Google Ads, Facebook Ads, and other advertising platforms; Experience with Google Analytics, SEO/SEM tools; Knowledge of content marketing and social media management; Strong analytical skills and data interpretation; Excellent written and verbal communication skills in Vietnamese and English.',
            'Develop and execute comprehensive digital marketing strategies; Manage and optimize paid advertising campaigns across Google, Facebook, and other platforms; Create engaging content for social media, blogs, and email campaigns; Analyze campaign performance and provide actionable insights; Conduct market research and competitor analysis; Collaborate with design team to create marketing materials; Report on campaign performance and ROI to clients and management.',
            'Competitive salary 15-22M VND; Performance-based bonuses; Health and dental insurance; Professional development courses and certifications; 13th month salary; Modern office in District 7; Flexible working arrangements; Annual company retreat; Career advancement opportunities.',
            'MIDDLE',
            'FULL_TIME',
            15000000,
            22000000,
            'VND',
            hcm_city_id,
            hcm_district3_id,
            'HYBRID',
            2,
            4,
            'Digital Marketing',
            'Bachelor''s degree in Marketing, Business Administration, Communications, or related field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-15',
            'PUBLISHED',
            NOW(),
            67
        );

    -- Log the operation
    RAISE NOTICE 'Sample companies and jobs inserted successfully';
    RAISE NOTICE 'Company IDs: %, %, %', company1_id, company2_id, company3_id;

END $$;

-- Insert some sample skills related to the jobs
INSERT INTO skills (skill_name, skill_type, description) VALUES
    ('React.js', 'TECHNICAL', 'Frontend JavaScript library for building user interfaces'),
    ('Node.js', 'TECHNICAL', 'JavaScript runtime for server-side development'),
    ('PostgreSQL', 'TECHNICAL', 'Advanced open-source relational database'),
    ('React Native', 'TECHNICAL', 'Framework for building native mobile apps using React'),
    ('Google Ads', 'MARKETING', 'Google advertising platform for paid search and display ads'),
    ('Facebook Ads', 'MARKETING', 'Facebook advertising platform for social media marketing'),
    ('SEO', 'MARKETING', 'Search Engine Optimization techniques and strategies'),
    ('Google Analytics', 'ANALYTICS', 'Web analytics service for tracking website traffic'),
    ('TypeScript', 'TECHNICAL', 'Strongly typed programming language built on JavaScript'),
    ('AWS', 'CLOUD', 'Amazon Web Services cloud computing platform')
ON CONFLICT (skill_name) DO NOTHING;

-- Add job skills relationships
DO $$
DECLARE
    job1_id UUID;
    job2_id UUID;
    job3_id UUID;
    react_skill_id UUID;
    node_skill_id UUID;
    postgres_skill_id UUID;
    rn_skill_id UUID;
    ts_skill_id UUID;
    ga_skill_id UUID;
    gads_skill_id UUID;
    seo_skill_id UUID;
    aws_skill_id UUID;
BEGIN
    -- Get job IDs
    SELECT j.job_id INTO job1_id FROM jobs j 
    JOIN companies c ON j.company_id = c.company_id 
    WHERE c.tax_code = '0123456789' AND j.title = 'Senior Full Stack Developer';
    
    SELECT j.job_id INTO job2_id FROM jobs j 
    JOIN companies c ON j.company_id = c.company_id 
    WHERE c.tax_code = '0234567890' AND j.title = 'Mobile App Developer (React Native)';
    
    SELECT j.job_id INTO job3_id FROM jobs j 
    JOIN companies c ON j.company_id = c.company_id 
    WHERE c.tax_code = '0345678901' AND j.title = 'Digital Marketing Specialist';

    -- Get skill IDs
    SELECT skill_id INTO react_skill_id FROM skills WHERE skill_name = 'React.js';
    SELECT skill_id INTO node_skill_id FROM skills WHERE skill_name = 'Node.js';
    SELECT skill_id INTO postgres_skill_id FROM skills WHERE skill_name = 'PostgreSQL';
    SELECT skill_id INTO rn_skill_id FROM skills WHERE skill_name = 'React Native';
    SELECT skill_id INTO ts_skill_id FROM skills WHERE skill_name = 'TypeScript';
    SELECT skill_id INTO ga_skill_id FROM skills WHERE skill_name = 'Google Analytics';
    SELECT skill_id INTO gads_skill_id FROM skills WHERE skill_name = 'Google Ads';
    SELECT skill_id INTO seo_skill_id FROM skills WHERE skill_name = 'SEO';
    SELECT skill_id INTO aws_skill_id FROM skills WHERE skill_name = 'AWS';

    -- Insert job skills for Job 1 (Full Stack Developer)
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required) VALUES
        (job1_id, react_skill_id, 'ADVANCED', true),
        (job1_id, node_skill_id, 'ADVANCED', true),
        (job1_id, postgres_skill_id, 'INTERMEDIATE', true),
        (job1_id, ts_skill_id, 'INTERMEDIATE', false),
        (job1_id, aws_skill_id, 'INTERMEDIATE', false);

    -- Insert job skills for Job 2 (Mobile Developer)
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required) VALUES
        (job2_id, rn_skill_id, 'ADVANCED', true),
        (job2_id, ts_skill_id, 'INTERMEDIATE', true),
        (job2_id, react_skill_id, 'ADVANCED', true);

    -- Insert job skills for Job 3 (Digital Marketing)
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required) VALUES
        (job3_id, gads_skill_id, 'INTERMEDIATE', true),
        (job3_id, ga_skill_id, 'INTERMEDIATE', true),
        (job3_id, seo_skill_id, 'INTERMEDIATE', true);

    RAISE NOTICE 'Job skills relationships created successfully';

END $$;