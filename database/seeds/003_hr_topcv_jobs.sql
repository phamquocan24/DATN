-- =============================================
-- SEED DATA 003: JOBS FOR HR@TOPCV.COM
-- Description: Sample jobs for HR Manager account hr@topcv.com
-- =============================================

DO $$
DECLARE
    hr_user_id UUID;
    topcv_company_id UUID;
    hcm_city_id UUID;
    hn_city_id UUID;
    dn_city_id UUID;
    hcm_district1_id UUID;
    hcm_district3_id UUID;
    hn_district_id UUID;
    dn_district_id UUID;
    job1_id UUID;
    job2_id UUID;
    job3_id UUID;
    job4_id UUID;
    job5_id UUID;
    job6_id UUID;
BEGIN
    -- Get HR user ID
    SELECT user_id INTO hr_user_id FROM users WHERE email = 'hr@topcv.com';
    
    IF hr_user_id IS NULL THEN
        RAISE NOTICE 'HR user hr@topcv.com not found! Please run create-admin-userdb.js first.';
        RETURN;
    END IF;

    -- Get city and district IDs
    SELECT city_id INTO hcm_city_id FROM cities WHERE city_name = 'Hồ Chí Minh';
    SELECT city_id INTO hn_city_id FROM cities WHERE city_name = 'Hà Nội';
    SELECT city_id INTO dn_city_id FROM cities WHERE city_name = 'Đà Nẵng';
    
    SELECT district_id INTO hcm_district1_id FROM districts WHERE district_name = 'Quận 1' AND city_id = hcm_city_id;
    SELECT district_id INTO hcm_district3_id FROM districts WHERE district_name = 'Quận 7' AND city_id = hcm_city_id;
    SELECT district_id INTO hn_district_id FROM districts WHERE district_name = 'Quận Ba Đình' AND city_id = hn_city_id;
    SELECT district_id INTO dn_district_id FROM districts WHERE district_name = 'Quận Hải Châu' AND city_id = dn_city_id;

    -- Create TopCV company for HR manager
    INSERT INTO companies (
        company_id, company_name, tax_code, description, industry, company_size, 
        address, city_id, district_id, website, logo_url, company_status, 
        is_verified, founded_year
    ) VALUES (
        gen_random_uuid(),
        'TopCV Technology',
        '0999888777',
        'TopCV is Vietnam''s leading recruitment technology platform, connecting talented candidates with top employers. We provide innovative HR solutions including AI-powered CV matching, assessment tools, and recruitment analytics.',
        'Human Resources Technology',
        '201-500',
        '123 Nguyen Hue Street, District 1',
        hcm_city_id,
        hcm_district1_id,
        'https://www.topcv.vn',
        'https://www.topcv.vn/images/logo-topcv.png',
        'ACTIVE',
        true,
        2014
    ) ON CONFLICT (tax_code) DO NOTHING;

    -- Get company ID
    SELECT company_id INTO topcv_company_id FROM companies WHERE tax_code = '0999888777';

    -- Create user profile for HR if not exists
    INSERT INTO user_profile (user_id, profile_completed, account_status)
    VALUES (hr_user_id, true, 'ACTIVE')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create recruiter profile for HR
    INSERT INTO recruiter_profiles (user_id, company_id, position, department, hire_authority_level)
    VALUES (hr_user_id, topcv_company_id, 'HR Manager', 'Human Resources', 'MANAGER')
    ON CONFLICT (user_id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        position = EXCLUDED.position,
        department = EXCLUDED.department,
        hire_authority_level = EXCLUDED.hire_authority_level;

    -- Insert jobs for HR@TopCV
    INSERT INTO jobs (
        job_id, recruiter_id, company_id, title, description, requirements, 
        responsibilities, benefits, experience_level, employment_type, 
        salary_min, salary_max, currency, city_id, district_id, work_arrangement,
        min_experience_years, max_experience_years, category, education_requirements,
        language_requirements, application_deadline, status, published_at, view_count
    ) VALUES 
        
        -- Job 1: AI/ML Engineer
        (
            gen_random_uuid(),
            hr_user_id,
            topcv_company_id,
            'AI/ML Engineer - CV Matching Technology',
            'Join TopCV''s AI team to build cutting-edge machine learning models for CV-Job matching. You will work on natural language processing, recommendation systems, and AI-powered recruitment tools that help millions of candidates find their dream jobs.',
            'Master''s degree in Computer Science, AI, or related field; 3+ years of experience in ML/AI development; Strong proficiency in Python, TensorFlow, PyTorch; Experience with NLP, text processing, and embedding techniques; Knowledge of recommendation systems and ranking algorithms; Experience with cloud platforms (AWS, GCP) and MLOps; Strong mathematical background in statistics and linear algebra.',
            'Design and implement ML models for CV-Job matching and candidate ranking; Develop NLP pipelines for text processing and semantic understanding; Build and maintain recommendation systems for job suggestions; Optimize model performance and implement A/B testing; Collaborate with data science team to improve algorithms; Deploy models to production using MLOps best practices; Research and implement latest AI techniques in recruitment domain.',
            'Competitive salary 35-50M VND; Stock options in leading HR tech company; Premium health insurance for family; 16 days annual leave + flexible PTO; AI/ML conference and training budget 20M VND/year; MacBook Pro M3 and cloud computing credits; Innovation time 20% for research projects; Modern office in District 1 with AI labs.',
            'SENIOR',
            'FULL_TIME',
            35000000,
            50000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            3,
            7,
            'Artificial Intelligence',
            'Master''s degree in Computer Science, Artificial Intelligence, Machine Learning, or related technical field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'ACTIVE',
            NOW(),
            245
        ),

        -- Job 2: Senior Frontend Developer
        (
            gen_random_uuid(),
            hr_user_id,
            topcv_company_id,
            'Senior Frontend Developer - React Specialist',
            'Build the next generation of TopCV''s user interface. You will create responsive, accessible, and performant web applications that serve millions of users. Join us in revolutionizing the job search experience with modern frontend technologies.',
            'Bachelor''s degree in Computer Science or equivalent; 4+ years of React.js development experience; Expert knowledge of JavaScript, TypeScript, HTML5, CSS3; Experience with state management (Redux, Zustand); Proficiency in testing frameworks (Jest, RTL, Cypress); Understanding of performance optimization and SEO; Experience with build tools (Webpack, Vite) and CI/CD.',
            'Develop and maintain TopCV''s main web application using React.js; Implement responsive designs and ensure cross-browser compatibility; Optimize application performance and improve user experience; Write comprehensive unit and integration tests; Collaborate with UX/UI designers to implement pixel-perfect interfaces; Mentor junior developers and conduct code reviews; Participate in architecture decisions and technical planning.',
            'Salary range 28-40M VND based on experience; Annual performance bonus up to 3 months salary; Health insurance for employee and family; 15 days annual leave + birthday leave; Frontend development courses and conference budget; MacBook Pro and latest development tools; Flexible working hours and WFH options; Modern office with ergonomic workspace.',
            'SENIOR',
            'FULL_TIME',
            28000000,
            40000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            4,
            8,
            'Frontend Development',
            'Bachelor''s degree in Computer Science, Software Engineering, or related field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'ACTIVE',
            NOW(),
            189
        ),

        -- Job 3: Product Manager
        (
            gen_random_uuid(),
            hr_user_id,
            topcv_company_id,
            'Senior Product Manager - Recruitment Platform',
            'Lead product strategy and development for TopCV''s recruitment platform. You will define product roadmaps, work with cross-functional teams, and drive innovation in HR technology. Perfect opportunity to impact millions of users across Vietnam.',
            'Bachelor''s degree in Business, Engineering, or related field; 5+ years of product management experience, preferably in tech/SaaS; Strong analytical skills with experience in data-driven decision making; Understanding of agile methodologies and product development lifecycle; Experience with user research, A/B testing, and analytics tools; Excellent communication and stakeholder management skills; Knowledge of HR/recruitment domain is a plus.',
            'Define and execute product strategy and roadmap for recruitment features; Conduct market research and competitive analysis; Gather and prioritize product requirements from stakeholders; Work closely with engineering, design, and data teams; Manage product backlog and sprint planning; Monitor product metrics and user feedback; Drive product launches and go-to-market strategies; Communicate product vision to leadership and stakeholders.',
            'Competitive salary 40-60M VND; Equity participation in growing company; Premium health insurance package; 18 days annual leave + company holidays; Product management training and certification budget; MacBook Pro and productivity tools; Product strategy workshops and conferences; Leadership development programs.',
            'SENIOR',
            'FULL_TIME',
            40000000,
            60000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            5,
            10,
            'Product Management',
            'Bachelor''s degree in Business Administration, Engineering, Computer Science, or related field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'ACTIVE',
            NOW(),
            167
        ),

        -- Job 4: DevOps Engineer
        (
            gen_random_uuid(),
            hr_user_id,
            topcv_company_id,
            'DevOps Engineer - Cloud Infrastructure',
            'Scale TopCV''s infrastructure to serve millions of users. You will design and maintain cloud architecture, implement CI/CD pipelines, and ensure high availability of our recruitment platform. Join our platform team to build robust, scalable systems.',
            'Bachelor''s degree in Computer Science or related field; 3+ years of DevOps/Infrastructure experience; Strong experience with AWS services (EC2, RDS, S3, CloudFormation); Proficiency in containerization (Docker, Kubernetes); Experience with Infrastructure as Code (Terraform, Ansible); Knowledge of monitoring tools (Prometheus, Grafana, ELK); Scripting skills in Python, Bash, or Go; Understanding of security best practices.',
            'Design and maintain cloud infrastructure on AWS; Implement and optimize CI/CD pipelines using GitLab CI or Jenkins; Monitor system performance and ensure 99.9% uptime; Automate deployment processes and infrastructure provisioning; Implement security best practices and compliance requirements; Troubleshoot production issues and perform root cause analysis; Collaborate with development teams on infrastructure requirements; Optimize costs and resource utilization.',
            'Salary range 30-45M VND; Cloud certification bonus and training support; Health insurance with dental coverage; 15 days annual leave + sick leave; AWS/DevOps training and certification budget 15M VND/year; MacBook Pro and cloud platform credits; 24/7 support rotation bonus; Team building and tech conference attendance.',
            'MIDDLE',
            'FULL_TIME',
            30000000,
            45000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'ONSITE',
            3,
            6,
            'DevOps',
            'Bachelor''s degree in Computer Science, Information Technology, or related field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'ACTIVE',
            NOW(),
            134
        ),

        -- Job 5: UX/UI Designer
        (
            gen_random_uuid(),
            hr_user_id,
            topcv_company_id,
            'Senior UX/UI Designer - User Experience Lead',
            'Design intuitive and engaging experiences for TopCV''s recruitment platform. You will lead user research, create design systems, and work closely with product and engineering teams to deliver exceptional user experiences for both candidates and recruiters.',
            'Bachelor''s degree in Design, HCI, or related field; 4+ years of UX/UI design experience; Expert proficiency in Figma, Sketch, Adobe Creative Suite; Strong portfolio demonstrating user-centered design process; Experience with user research methods and usability testing; Knowledge of design systems and component libraries; Understanding of front-end technologies and design handoff processes; Mobile-first and responsive design experience.',
            'Lead user research and define user personas and journey maps; Create wireframes, prototypes, and high-fidelity designs; Design and maintain design system and component library; Conduct usability testing and iterate based on user feedback; Collaborate with product managers to define requirements; Work closely with developers to ensure design implementation; Present design concepts to stakeholders and leadership; Mentor junior designers and establish design best practices.',
            'Salary range 25-38M VND; Design tools and software licenses covered; Health insurance for employee and family; 16 days annual leave + creative days off; Design conference and workshop budget 12M VND/year; MacBook Pro and external monitors; Flexible working arrangements; Modern design studio with latest equipment.',
            'SENIOR',
            'FULL_TIME',
            25000000,
            38000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            4,
            8,
            'UX/UI Design',
            'Bachelor''s degree in Design, Human-Computer Interaction, Visual Arts, or related field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'ACTIVE',
            NOW(),
            156
        ),

        -- Job 6: Backend Developer (Node.js)
        (
            gen_random_uuid(),
            hr_user_id,
            topcv_company_id,
            'Backend Developer - Node.js & Microservices',
            'Build scalable backend systems for TopCV''s recruitment platform. You will develop APIs, implement microservices architecture, and optimize database performance. Join our backend team to handle millions of job applications and CV processing.',
            'Bachelor''s degree in Computer Science or equivalent; 3+ years of Node.js development experience; Strong knowledge of Express.js, NestJS, or similar frameworks; Experience with PostgreSQL, MongoDB, or similar databases; Understanding of microservices architecture and RESTful APIs; Knowledge of message queues (Redis, RabbitMQ) and caching strategies; Experience with testing frameworks and TDD/BDD practices; Familiarity with containerization and cloud deployment.',
            'Develop and maintain RESTful APIs and microservices; Design database schemas and optimize query performance; Implement real-time features using WebSockets; Write comprehensive unit and integration tests; Participate in code reviews and maintain code quality; Optimize application performance and scalability; Collaborate with frontend and mobile teams; Debug production issues and implement monitoring solutions.',
            'Salary range 22-32M VND; Annual performance review and salary adjustment; Health insurance with family coverage; 14 days annual leave + public holidays; Technical training and certification budget 10M VND/year; MacBook Pro and development tools; Code quality bonus and performance incentives; Flexible working hours and remote options.',
            'MIDDLE',
            'FULL_TIME',
            22000000,
            32000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            3,
            6,
            'Backend Development',
            'Bachelor''s degree in Computer Science, Software Engineering, or related field',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'ACTIVE',
            NOW(),
            201
        );

    -- Get job IDs for skill assignment
    SELECT job_id INTO job1_id FROM jobs WHERE title = 'AI/ML Engineer - CV Matching Technology' AND recruiter_id = hr_user_id;
    SELECT job_id INTO job2_id FROM jobs WHERE title = 'Senior Frontend Developer - React Specialist' AND recruiter_id = hr_user_id;
    SELECT job_id INTO job3_id FROM jobs WHERE title = 'Senior Product Manager - Recruitment Platform' AND recruiter_id = hr_user_id;
    SELECT job_id INTO job4_id FROM jobs WHERE title = 'DevOps Engineer - Cloud Infrastructure' AND recruiter_id = hr_user_id;
    SELECT job_id INTO job5_id FROM jobs WHERE title = 'Senior UX/UI Designer - User Experience Lead' AND recruiter_id = hr_user_id;
    SELECT job_id INTO job6_id FROM jobs WHERE title = 'Backend Developer - Node.js & Microservices' AND recruiter_id = hr_user_id;

    -- Insert job skills for AI/ML Engineer
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required)
    SELECT job1_id, skill_id, 'ADVANCED', true
    FROM skills WHERE skill_name IN ('Python', 'Machine Learning', 'TensorFlow')
    UNION ALL
    SELECT job1_id, skill_id, 'INTERMEDIATE', true
    FROM skills WHERE skill_name IN ('AWS', 'Docker')
    UNION ALL
    SELECT job1_id, skill_id, 'INTERMEDIATE', false
    FROM skills WHERE skill_name IN ('PostgreSQL', 'MongoDB');

    -- Insert job skills for Frontend Developer
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required)
    SELECT job2_id, skill_id, 'ADVANCED', true
    FROM skills WHERE skill_name IN ('React.js', 'JavaScript', 'TypeScript')
    UNION ALL
    SELECT job2_id, skill_id, 'INTERMEDIATE', true
    FROM skills WHERE skill_name IN ('HTML/CSS', 'Redux')
    UNION ALL
    SELECT job2_id, skill_id, 'INTERMEDIATE', false
    FROM skills WHERE skill_name IN ('Jest', 'Webpack');

    -- Insert job skills for Product Manager
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required)
    SELECT job3_id, skill_id, 'INTERMEDIATE', true
    FROM skills WHERE skill_name IN ('Google Analytics', 'SQL')
    UNION ALL
    SELECT job3_id, skill_id, 'BEGINNER', false
    FROM skills WHERE skill_name IN ('Figma', 'JIRA');

    -- Insert job skills for DevOps Engineer
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required)
    SELECT job4_id, skill_id, 'ADVANCED', true
    FROM skills WHERE skill_name IN ('AWS', 'Docker', 'Kubernetes')
    UNION ALL
    SELECT job4_id, skill_id, 'INTERMEDIATE', true
    FROM skills WHERE skill_name IN ('Python', 'Linux', 'Jenkins')
    UNION ALL
    SELECT job4_id, skill_id, 'INTERMEDIATE', false
    FROM skills WHERE skill_name IN ('Terraform', 'Ansible');

    -- Insert job skills for UX/UI Designer
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required)
    SELECT job5_id, skill_id, 'ADVANCED', true
    FROM skills WHERE skill_name IN ('Figma', 'Adobe Photoshop')
    UNION ALL
    SELECT job5_id, skill_id, 'INTERMEDIATE', false
    FROM skills WHERE skill_name IN ('HTML/CSS', 'Sketch');

    -- Insert job skills for Backend Developer
    INSERT INTO job_skills (job_id, skill_id, required_level, is_required)
    SELECT job6_id, skill_id, 'ADVANCED', true
    FROM skills WHERE skill_name IN ('Node.js', 'Express.js', 'PostgreSQL')
    UNION ALL
    SELECT job6_id, skill_id, 'INTERMEDIATE', true
    FROM skills WHERE skill_name IN ('MongoDB', 'Redis', 'Docker')
    UNION ALL
    SELECT job6_id, skill_id, 'INTERMEDIATE', false
    FROM skills WHERE skill_name IN ('Jest', 'AWS');

    RAISE NOTICE 'Successfully created 6 jobs for HR@TopCV.com:';
    RAISE NOTICE '1. AI/ML Engineer - CV Matching Technology';
    RAISE NOTICE '2. Senior Frontend Developer - React Specialist';
    RAISE NOTICE '3. Senior Product Manager - Recruitment Platform';
    RAISE NOTICE '4. DevOps Engineer - Cloud Infrastructure';
    RAISE NOTICE '5. Senior UX/UI Designer - User Experience Lead';
    RAISE NOTICE '6. Backend Developer - Node.js & Microservices';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating jobs for HR@TopCV.com: %', SQLERRM;
        
END $$;
