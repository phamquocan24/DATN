-- =============================================
-- SEED DATA 003: REAL WORLD JOBS FROM MAJOR CORPORATIONS
-- Description: 25+ realistic job postings from major Vietnamese and international companies
-- =============================================

DO $$
DECLARE
    -- Recruiter IDs
    recruiter_vng_id UUID;
    recruiter_fpt_id UUID;
    recruiter_vingroup_id UUID;
    recruiter_sacombank_id UUID;
    recruiter_sendo_id UUID;
    recruiter_tiki_id UUID;
    recruiter_techcombank_id UUID;
    recruiter_samsung_id UUID;
    recruiter_momo_id UUID;
    recruiter_shopee_id UUID;
    
    -- Company IDs
    vng_company_id UUID;
    fpt_company_id UUID;
    vingroup_company_id UUID;
    sacombank_company_id UUID;
    sendo_company_id UUID;
    tiki_company_id UUID;
    techcombank_company_id UUID;
    samsung_company_id UUID;
    momo_company_id UUID;
    shopee_company_id UUID;
    
    -- City and District IDs
    hcm_city_id UUID;
    hn_city_id UUID;
    dn_city_id UUID;
    hcm_district1_id UUID;
    hcm_district3_id UUID;
    hcm_district7_id UUID;
    hn_caugiay_id UUID;
    hn_badinh_id UUID;
    dn_haichau_id UUID;
    
BEGIN
    -- Get city and district IDs
    SELECT city_id INTO hcm_city_id FROM cities WHERE city_name = 'Hồ Chí Minh';
    SELECT city_id INTO hn_city_id FROM cities WHERE city_name = 'Hà Nội';
    SELECT city_id INTO dn_city_id FROM cities WHERE city_name = 'Đà Nẵng';
    
    SELECT district_id INTO hcm_district1_id FROM districts WHERE district_name = 'Quận 1' AND city_id = hcm_city_id;
    SELECT district_id INTO hcm_district3_id FROM districts WHERE district_name = 'Quận 3' AND city_id = hcm_city_id;
    SELECT district_id INTO hcm_district7_id FROM districts WHERE district_name = 'Quận 7' AND city_id = hcm_city_id;
    SELECT district_id INTO hn_caugiay_id FROM districts WHERE district_name = 'Quận Cầu Giấy' AND city_id = hn_city_id;
    SELECT district_id INTO hn_badinh_id FROM districts WHERE district_name = 'Quận Ba Đình' AND city_id = hn_city_id;
    SELECT district_id INTO dn_haichau_id FROM districts WHERE district_name = 'Quận Hải Châu' AND city_id = dn_city_id;

    -- Insert recruiters for major companies
    INSERT INTO users (user_id, email, password_hash, phone, full_name, role, is_active)
    VALUES 
        (gen_random_uuid(), 'talent@vng.com.vn', '$2b$10$example.hash1', '+84 123 456 001', 'Nguyễn Thị Hương', 'RECRUITER', true),
        (gen_random_uuid(), 'hr@fpt.com.vn', '$2b$10$example.hash2', '+84 123 456 002', 'Trần Văn Đức', 'RECRUITER', true),
        (gen_random_uuid(), 'careers@vingroup.net', '$2b$10$example.hash3', '+84 123 456 003', 'Lê Thị Mai', 'RECRUITER', true),
        (gen_random_uuid(), 'recruitment@sacombank.com', '$2b$10$example.hash4', '+84 123 456 004', 'Phạm Minh Tuấn', 'RECRUITER', true),
        (gen_random_uuid(), 'jobs@sendo.vn', '$2b$10$example.hash5', '+84 123 456 005', 'Võ Thị Lan', 'RECRUITER', true),
        (gen_random_uuid(), 'talent@tiki.vn', '$2b$10$example.hash6', '+84 123 456 006', 'Đặng Văn Hải', 'RECRUITER', true),
        (gen_random_uuid(), 'hr@techcombank.com', '$2b$10$example.hash7', '+84 123 456 007', 'Bùi Thị Thu', 'RECRUITER', true),
        (gen_random_uuid(), 'careers@samsung.com', '$2b$10$example.hash8', '+84 123 456 008', 'Park Min-jun', 'RECRUITER', true),
        (gen_random_uuid(), 'talent@momo.vn', '$2b$10$example.hash9', '+84 123 456 009', 'Hoàng Văn Long', 'RECRUITER', true),
        (gen_random_uuid(), 'jobs@shopee.com', '$2b$10$example.hash10', '+84 123 456 010', 'Lim Wei Ming', 'RECRUITER', true)
    ON CONFLICT (email) DO NOTHING;

    -- Get user IDs first 
    SELECT user_id INTO recruiter_vng_id FROM users WHERE email = 'talent@vng.com.vn';
    SELECT user_id INTO recruiter_fpt_id FROM users WHERE email = 'hr@fpt.com.vn';
    SELECT user_id INTO recruiter_vingroup_id FROM users WHERE email = 'careers@vingroup.net';
    SELECT user_id INTO recruiter_sacombank_id FROM users WHERE email = 'recruitment@sacombank.com';
    SELECT user_id INTO recruiter_sendo_id FROM users WHERE email = 'jobs@sendo.vn';
    SELECT user_id INTO recruiter_tiki_id FROM users WHERE email = 'talent@tiki.vn';
    SELECT user_id INTO recruiter_techcombank_id FROM users WHERE email = 'hr@techcombank.com';
    SELECT user_id INTO recruiter_samsung_id FROM users WHERE email = 'careers@samsung.com';
    SELECT user_id INTO recruiter_momo_id FROM users WHERE email = 'talent@momo.vn';
    SELECT user_id INTO recruiter_shopee_id FROM users WHERE email = 'jobs@shopee.com';

    -- Insert user profiles for recruiters
    INSERT INTO user_profile (user_id, profile_completed, account_status)
    VALUES 
        (recruiter_vng_id, true, 'ACTIVE'),
        (recruiter_fpt_id, true, 'ACTIVE'),
        (recruiter_vingroup_id, true, 'ACTIVE'),
        (recruiter_sacombank_id, true, 'ACTIVE'),
        (recruiter_sendo_id, true, 'ACTIVE'),
        (recruiter_tiki_id, true, 'ACTIVE'),
        (recruiter_techcombank_id, true, 'ACTIVE'),
        (recruiter_samsung_id, true, 'ACTIVE'),
        (recruiter_momo_id, true, 'ACTIVE'),
        (recruiter_shopee_id, true, 'ACTIVE')
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert recruiter profiles
    INSERT INTO recruiter_profiles (user_id, position, department, hire_authority_level)
    VALUES 
        (recruiter_vng_id, 'Senior Talent Acquisition Manager', 'Human Resources', 'SENIOR'),
        (recruiter_fpt_id, 'HR Business Partner', 'Human Resources', 'SENIOR'),
        (recruiter_vingroup_id, 'Head of Talent Acquisition', 'Human Resources', 'MANAGER'),
        (recruiter_sacombank_id, 'Recruitment Specialist', 'Human Resources', 'SENIOR'),
        (recruiter_sendo_id, 'Talent Acquisition Lead', 'Human Resources', 'SENIOR'),
        (recruiter_tiki_id, 'Senior Recruiter', 'Human Resources', 'SENIOR'),
        (recruiter_techcombank_id, 'Digital Banking Recruiter', 'Human Resources', 'SENIOR'),
        (recruiter_samsung_id, 'Global Talent Manager', 'Human Resources', 'MANAGER'),
        (recruiter_momo_id, 'Tech Talent Acquisition', 'Human Resources', 'SENIOR'),
        (recruiter_shopee_id, 'Regional Talent Lead', 'Human Resources', 'MANAGER')
    ON CONFLICT (user_id) DO NOTHING;

    -- Now get the actual profile_ids from recruiter_profiles to use as recruiter_id
    SELECT profile_id INTO recruiter_vng_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'talent@vng.com.vn');
    SELECT profile_id INTO recruiter_fpt_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'hr@fpt.com.vn');
    SELECT profile_id INTO recruiter_vingroup_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'careers@vingroup.net');
    SELECT profile_id INTO recruiter_sacombank_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'recruitment@sacombank.com');
    SELECT profile_id INTO recruiter_sendo_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'jobs@sendo.vn');
    SELECT profile_id INTO recruiter_tiki_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'talent@tiki.vn');
    SELECT profile_id INTO recruiter_techcombank_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'hr@techcombank.com');
    SELECT profile_id INTO recruiter_samsung_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'careers@samsung.com');
    SELECT profile_id INTO recruiter_momo_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'talent@momo.vn');
    SELECT profile_id INTO recruiter_shopee_id FROM recruiter_profiles WHERE user_id = (SELECT user_id FROM users WHERE email = 'jobs@shopee.com');

    -- Insert major companies
    INSERT INTO companies (
        company_id, company_name, tax_code, description, industry, company_size, 
        address, city_id, district_id, website, logo_url, company_status, 
        is_verified, founded_year
    ) VALUES 
        -- VNG Corporation
        (
            gen_random_uuid(),
            'VNG Corporation Ltd',
            '0311457315',
            'VNG là một trong những tập đoàn công nghệ hàng đầu Việt Nam, chuyên phát triển các sản phẩm Internet, game online và dịch vụ số. Với hơn 20 năm kinh nghiệm, VNG sở hữu các sản phẩm nổi tiếng như Zalo, ZaloPay, 123doc, Zing MP3.',
            'Technology',
            '1000+',
            'Tầng 33-34, Tòa nhà Keangnam Hanoi Landmark, Phạm Hùng',
            hn_city_id,
            hn_caugiay_id,
            'https://vng.com.vn',
            'https://vng.com.vn/images/logo.png',
            'ACTIVE',
            true,
            2004
        ),
        -- FPT Corporation
        (
            gen_random_uuid(),
            'FPT Corporation',
            '0100109106',
            'FPT là tập đoàn công nghệ hàng đầu Việt Nam với 35+ năm kinh nghiệm. FPT cung cấp dịch vụ chuyển đổi số, phần mềm, viễn thông và giáo dục công nghệ cho khách hàng trên toàn cầu.',
            'Information Technology',
            '1000+',
            'Tòa nhà FPT, Lô L29B-31B-33B, Đường Lê Trọng Tấn',
            hn_city_id,
            hn_badinh_id,
            'https://fpt.com.vn',
            'https://fpt.com.vn/assets/logo.png',
            'ACTIVE',
            true,
            1988
        ),
        -- Vingroup
        (
            gen_random_uuid(),
            'Vingroup Joint Stock Company',
            '0104958657',
            'Vingroup là tập đoàn kinh tế tư nhân đa ngành lớn nhất Việt Nam. Vingroup hoạt động trong nhiều lĩnh vực: bất động sản, du lịch nghỉ dưỡng, ô tô, công nghệ, giáo dục, y tế.',
            'Conglomerate',
            '1000+',
            'Tòa nhà Landmark 81, 720A Điện Biên Phủ',
            hcm_city_id,
            hcm_district1_id,
            'https://vingroup.net',
            'https://vingroup.net/images/brand.png',
            'ACTIVE',
            true,
            1993
        ),
        -- Sacombank
        (
            gen_random_uuid(),
            'Saigon Thuong Tin Commercial Joint Stock Bank',
            '0300456116',
            'Sacombank là một trong những ngân hàng thương mại cổ phần hàng đầu Việt Nam với mạng lưới chi nhánh rộng khắp cả nước. Chuyên cung cấp các dịch vụ ngân hàng và tài chính toàn diện.',
            'Banking & Finance',
            '1000+',
            '266 Nam Kỳ Khởi Nghĩa, Phường 8',
            hcm_city_id,
            hcm_district3_id,
            'https://sacombank.com',
            'https://sacombank.com/logo.png',
            'ACTIVE',
            true,
            1991
        ),
        -- Sendo
        (
            gen_random_uuid(),
            'Sendo Technology JSC',
            '0315133068',
            'Sendo là một trong những sàn thương mại điện tử hàng đầu Việt Nam, kết nối hàng triệu người mua và người bán trên toàn quốc. Sendo cam kết mang đến trải nghiệm mua sắm an toàn và tiện lợi.',
            'E-commerce',
            '501-1000',
            'Tầng 10, Tòa nhà Viettel, 285 Cách Mạng Tháng 8',
            hcm_city_id,
            hcm_district1_id,
            'https://sendo.vn',
            'https://sendo.vn/assets/logo.svg',
            'ACTIVE',
            true,
            2012
        ),
        -- Tiki
        (
            gen_random_uuid(),
            'Tiki Trading JSC',
            '0313428474',
            'Tiki là nền tảng thương mại điện tử và dịch vụ giao hàng hàng đầu Việt Nam. Với sứ mệnh "Make Life Better", Tiki cam kết cung cấp trải nghiệm mua sắm tốt nhất cho khách hàng.',
            'E-commerce',
            '1000+',
            '52 Út Tịch, Phường 4',
            hcm_city_id,
            hcm_district7_id,
            'https://tiki.vn',
            'https://tiki.vn/assets/img/logo.png',
            'ACTIVE',
            true,
            2010
        ),
        -- Techcombank
        (
            gen_random_uuid(),
            'Vietnam Technological and Commercial Joint Stock Bank',
            '0100101413',
            'Techcombank là ngân hàng thương mại cổ phần hàng đầu Việt Nam, tiên phong trong việc ứng dụng công nghệ để cung cấp các dịch vụ ngân hàng số hiện đại và tiện ích.',
            'Banking & Finance',
            '1000+',
            'Tòa nhà Techcombank, 191 Ba Tháng Hai',
            hcm_city_id,
            hcm_district1_id,
            'https://techcombank.com.vn',
            'https://techcombank.com.vn/logo.png',
            'ACTIVE',
            true,
            1993
        ),
        -- Samsung Vietnam
        (
            gen_random_uuid(),
            'Samsung Electronics Vietnam Co., Ltd.',
            '0309674842',
            'Samsung Electronics Vietnam là một trong những công ty sản xuất điện tử lớn nhất thế giới tại Việt Nam. Chuyên sản xuất smartphone, TV, thiết bị gia dụng và linh kiện điện tử.',
            'Electronics Manufacturing',
            '1000+',
            'Lô I-3, Khu Công nghệ cao Sài Gòn',
            hcm_city_id,
            hcm_district1_id,
            'https://samsung.com/vn',
            'https://samsung.com/logo.png',
            'ACTIVE',
            true,
            1995
        ),
        -- MoMo
        (
            gen_random_uuid(),
            'M_Service Joint Stock Company',
            '0313728397',
            'MoMo là ứng dụng thanh toán di động và ví điện tử hàng đầu Việt Nam. MoMo cung cấp các dịch vụ thanh toán, chuyển tiền, mua sắm và nhiều tiện ích khác.',
            'Fintech',
            '501-1000',
            'Tầng 18, Tòa nhà Centec Tower, 72-74 Nguyễn Thị Minh Khai',
            hcm_city_id,
            hcm_district3_id,
            'https://momo.vn',
            'https://momo.vn/assets/logo.png',
            'ACTIVE',
            true,
            2007
        ),
        -- Shopee Vietnam
        (
            gen_random_uuid(),
            'Shopee Vietnam Limited',
            '0315415459',
            'Shopee là nền tảng thương mại điện tử di động hàng đầu Đông Nam Á và Đài Loan. Tại Việt Nam, Shopee đã trở thành một trong những app mua sắm phổ biến nhất.',
            'E-commerce',
            '1000+',
            'Tầng 28, Tòa nhà Vietcombank, 5 Công Trường Mê Linh',
            hcm_city_id,
            hcm_district1_id,
            'https://shopee.vn',
            'https://shopee.vn/logo.png',
            'ACTIVE',
            true,
            2015
        )
    ON CONFLICT (tax_code) DO NOTHING;

    -- Get company IDs
    SELECT company_id INTO vng_company_id FROM companies WHERE tax_code = '0311457315';
    SELECT company_id INTO fpt_company_id FROM companies WHERE tax_code = '0100109106';
    SELECT company_id INTO vingroup_company_id FROM companies WHERE tax_code = '0104958657';
    SELECT company_id INTO sacombank_company_id FROM companies WHERE tax_code = '0300456116';
    SELECT company_id INTO sendo_company_id FROM companies WHERE tax_code = '0315133068';
    SELECT company_id INTO tiki_company_id FROM companies WHERE tax_code = '0313428474';
    SELECT company_id INTO techcombank_company_id FROM companies WHERE tax_code = '0100101413';
    SELECT company_id INTO samsung_company_id FROM companies WHERE tax_code = '0309674842';
    SELECT company_id INTO momo_company_id FROM companies WHERE tax_code = '0313728397';
    SELECT company_id INTO shopee_company_id FROM companies WHERE tax_code = '0315415459';

    -- Update recruiter profiles with company_id
    UPDATE recruiter_profiles SET company_id = vng_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'talent@vng.com.vn');
    UPDATE recruiter_profiles SET company_id = fpt_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'hr@fpt.com.vn');
    UPDATE recruiter_profiles SET company_id = vingroup_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'careers@vingroup.net');
    UPDATE recruiter_profiles SET company_id = sacombank_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'recruitment@sacombank.com');
    UPDATE recruiter_profiles SET company_id = sendo_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'jobs@sendo.vn');
    UPDATE recruiter_profiles SET company_id = tiki_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'talent@tiki.vn');
    UPDATE recruiter_profiles SET company_id = techcombank_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'hr@techcombank.com');
    UPDATE recruiter_profiles SET company_id = samsung_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'careers@samsung.com');
    UPDATE recruiter_profiles SET company_id = momo_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'talent@momo.vn');
    UPDATE recruiter_profiles SET company_id = shopee_company_id WHERE user_id = (SELECT user_id FROM users WHERE email = 'jobs@shopee.com');


    -- Insert realistic jobs
    INSERT INTO jobs (
        job_id, recruiter_id, company_id, title, description, requirements, 
        responsibilities, benefits, experience_level, employment_type, 
        salary_min, salary_max, currency, city_id, district_id, work_arrangement,
        min_experience_years, max_experience_years, category, education_requirements,
        language_requirements, application_deadline, status, published_at, view_count
    ) VALUES 
        -- VNG Jobs
        (
            gen_random_uuid(),
            recruiter_vng_id,
            vng_company_id,
            'Senior Backend Engineer - Zalo Platform',
            'Tham gia phát triển hệ thống backend cho nền tảng Zalo với hàng trăm triệu người dùng. Bạn sẽ làm việc với các công nghệ hiện đại và giải quyết các thách thức về scale lớn.',
            'Tốt nghiệp Đại học chuyên ngành CNTT/Khoa học máy tính; 5+ năm kinh nghiệm phát triển backend; Thành thạo Java, Spring Framework, Microservices; Kinh nghiệm với Redis, Kafka, MongoDB; Hiểu biết về distributed systems và high availability; Kỹ năng debug và troubleshooting tốt.',
            'Thiết kế và phát triển API cho các tính năng mới của Zalo; Tối ưu hóa performance và scalability của hệ thống; Tham gia code review và mentor junior developers; Làm việc với team để giải quyết các technical challenges; Maintain và improve existing codebase; Participate in on-call rotation.',
            'Lương cạnh tranh từ 40-60M VND; Bonus theo performance + 13th month salary; Bảo hiểm sức khỏe cao cấp cho cả gia đình; 20 ngày phép năm + sick leave; Budget training 20M VND/năm; MacBook Pro + 2 monitors; Flexible working time; Gym membership; Free meal và snacks.',
            'SENIOR',
            'FULL_TIME',
            40000000,
            60000000,
            'VND',
            hn_city_id,
            hn_caugiay_id,
            'HYBRID',
            5,
            10,
            'Software Development',
            'Bằng Đại học chuyên ngành Công nghệ thông tin, Khoa học máy tính hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'PUBLISHED',
            NOW(),
            234
        ),
        (
            gen_random_uuid(),
            recruiter_vng_id,
            vng_company_id,
            'Product Manager - ZaloPay',
            'Dẫn dắt phát triển sản phẩm ZaloPay, một trong những ví điện tử hàng đầu Việt Nam. Làm việc với cross-functional teams để deliver các tính năng fintech innovative.',
            'Tốt nghiệp Đại học chuyên ngành kinh tế, công nghệ hoặc tương đương; 4+ năm kinh nghiệm Product Management; Hiểu biết sâu về fintech và mobile payments; Kinh nghiệm với agile/scrum methodology; Strong analytical và problem-solving skills; Business acumen và customer-centric mindset.',
            'Define product strategy và roadmap cho ZaloPay; Collaborate với engineering, design, marketing teams; Conduct market research và competitor analysis; Manage product backlog và prioritize features; Monitor product metrics và user feedback; Identify growth opportunities và optimize user experience.',
            'Lương từ 35-55M VND + equity options; Performance bonus up to 3 months salary; Premium healthcare insurance; Annual company trip; Learning budget 15M VND; Modern workspace với latest tools; Stock options trong VNG ecosystem; Career development programs.',
            'SENIOR',
            'FULL_TIME',
            35000000,
            55000000,
            'VND',
            hn_city_id,
            hn_caugiay_id,
            'HYBRID',
            4,
            8,
            'Product Management',
            'Bằng Đại học chuyên ngành Kinh tế, Quản trị kinh doanh, Công nghệ thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-11-30',
            'PUBLISHED',
            NOW(),
            189
        ),
        
        -- FPT Jobs
        (
            gen_random_uuid(),
            recruiter_fpt_id,
            fpt_company_id,
            'AI/ML Engineer - FPT.AI',
            'Tham gia phát triển các giải pháp AI/ML cho các dự án lớn trong và ngoài nước. Làm việc với cutting-edge technologies như Computer Vision, NLP, Deep Learning.',
            'Thạc sĩ/Cử nhân CNTT, Toán, Khoa học máy tính; 3+ năm kinh nghiệm AI/ML; Thành thạo Python, TensorFlow/PyTorch; Kinh nghiệm Computer Vision, NLP; Hiểu biết về MLOps và model deployment; Publishing papers là một plus; English communication skills.',
            'Research và develop AI models cho các use cases thực tế; Implement và deploy ML solutions lên production; Collaborate với international teams; Optimize model performance và accuracy; Write technical documentation; Present findings to stakeholders.',
            'Lương 30-50M VND + research bonus; Bảo hiểm FPTCare cho gia đình; 14 ngày phép + 3 sick days; Conference budget cho AI conferences; Latest GPU workstations; Publication bonus; International assignment opportunities; PhD sponsorship program.',
            'MIDDLE',
            'FULL_TIME',
            30000000,
            50000000,
            'VND',
            hn_city_id,
            hn_badinh_id,
            'HYBRID',
            3,
            7,
            'Artificial Intelligence',
            'Bằng Thạc sĩ/Cử nhân chuyên ngành Công nghệ thông tin, Toán học, Khoa học máy tính',
            ARRAY['Vietnamese', 'English'],
            '2024-12-15',
            'PUBLISHED',
            NOW(),
            156
        ),
        
        -- Vingroup Jobs
        (
            gen_random_uuid(),
            recruiter_vingroup_id,
            vingroup_company_id,
            'Senior Data Scientist - VinFast',
            'Ứng dụng data science cho ngành automotive, phát triển các models để optimize sản xuất ô tô điện và autonomous driving features.',
            'Thạc sĩ Data Science, Statistics, Machine Learning; 4+ năm kinh nghiệm trong automotive/manufacturing; Thành thạo R/Python, SQL, cloud platforms; Kinh nghiệm với time series, computer vision; Automotive domain knowledge; Strong statistical analysis skills.',
            'Analyze manufacturing data để optimize production process; Develop predictive models cho quality control; Work on autonomous driving algorithms; Collaborate với automotive engineers; Build dashboards cho operational insights; Research latest automotive AI trends.',
            'Lương 35-50M VND; Cơ hội mua xe VinFast với giá ưu đãi; Bảo hiểm sức khỏe Vinmec; Du lịch nghỉ dưỡng Vinpearl hàng năm; Training programs in Korea/USA; Stock options VinGroup; Modern R&D facilities; International collaboration opportunities.',
            'SENIOR',
            'FULL_TIME',
            35000000,
            50000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'ONSITE',
            4,
            8,
            'Data Science',
            'Bằng Thạc sĩ chuyên ngành Data Science, Statistics, Machine Learning hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'PUBLISHED',
            NOW(),
            98
        ),
        
        -- Sacombank Jobs
        (
            gen_random_uuid(),
            recruiter_sacombank_id,
            sacombank_company_id,
            'Cybersecurity Specialist',
            'Bảo vệ hệ thống ngân hàng khỏi các mối đe dọa an ninh mạng. Implement security measures và monitoring systems để đảm bảo an toàn dữ liệu khách hàng.',
            'Cử nhân CNTT, An toàn thông tin; 3+ năm kinh nghiệm cybersecurity; Certifications: CISSP, CEH, CISM preferred; Kinh nghiệm với SIEM tools, firewalls; Hiểu biết về banking regulations; Incident response experience; Penetration testing skills.',
            'Monitor và analyze security threats; Implement security policies và procedures; Conduct security assessments và penetration testing; Respond to security incidents; Train staff about security awareness; Maintain compliance với banking standards.',
            'Lương 25-40M VND; Thưởng theo KPI + 13th month; Bảo hiểm y tế toàn diện; Ưu đãi sản phẩm ngân hàng; Training an ninh mạng quốc tế; Professional certification support; 15 ngày phép/năm; Career path rõ ràng.',
            'MIDDLE',
            'FULL_TIME',
            25000000,
            40000000,
            'VND',
            hcm_city_id,
            hcm_district3_id,
            'ONSITE',
            3,
            6,
            'Cybersecurity',
            'Bằng Cử nhân chuyên ngành Công nghệ thông tin, An toàn thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-11-30',
            'PUBLISHED',
            NOW(),
            145
        ),
        
        -- Sendo Jobs
        (
            gen_random_uuid(),
            recruiter_sendo_id,
            sendo_company_id,
            'DevOps Engineer',
            'Xây dựng và maintain infrastructure cho nền tảng e-commerce phục vụ millions users. Implement CI/CD pipelines và monitoring systems.',
            'Cử nhân CNTT; 3+ năm kinh nghiệm DevOps; Thành thạo Docker, Kubernetes, AWS/GCP; Kinh nghiệm với CI/CD tools (Jenkins, GitLab CI); Infrastructure as Code (Terraform); Monitoring tools (Prometheus, Grafana); Linux system administration.',
            'Design và maintain cloud infrastructure; Implement automated deployment pipelines; Monitor system performance và availability; Collaborate với development teams; Optimize costs và resource utilization; Ensure security best practices; On-call support rotation.',
            'Lương 28-42M VND; Stock options trong Sendo; Bảo hiểm sức khỏe AON; Team building activities; Flexible working hours; Latest DevOps tools; Cloud certification support; 14 ngày phép + sick leave; Performance bonus.',
            'MIDDLE',
            'FULL_TIME',
            28000000,
            42000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            3,
            6,
            'DevOps',
            'Bằng Cử nhân chuyên ngành Công nghệ thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-20',
            'PUBLISHED',
            NOW(),
            87
        ),
        
        -- Tiki Jobs
        (
            gen_random_uuid(),
            recruiter_tiki_id,
            tiki_company_id,
            'Senior Frontend Developer - React',
            'Phát triển user interfaces cho Tiki web và mobile app. Tạo ra những experiences mượt mà cho millions of customers mua sắm hàng ngày.',
            'Cử nhân CNTT; 4+ năm kinh nghiệm frontend development; Expert level React.js, TypeScript; Kinh nghiệm với Next.js, Redux; Mobile development (React Native) là plus; Performance optimization; Testing frameworks (Jest, Cypress); Responsive design principles.',
            'Develop và maintain Tiki website và mobile app; Implement new features theo product requirements; Optimize performance và user experience; Code review và mentor junior developers; Collaborate với design và backend teams; A/B testing implementation.',
            'Lương 30-45M VND; Annual bonus based on company performance; Premium health insurance; MacBook Pro + setup allowance; 15 ngày phép năm; Learning stipend 10M VND; Stock options; Free Tiki products; Team outing quarterly.',
            'SENIOR',
            'FULL_TIME',
            30000000,
            45000000,
            'VND',
            hcm_city_id,
            hcm_district7_id,
            'HYBRID',
            4,
            7,
            'Frontend Development',
            'Bằng Cử nhân chuyên ngành Công nghệ thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-10',
            'PUBLISHED',
            NOW(),
            203
        ),
        
        -- Techcombank Jobs
        (
            gen_random_uuid(),
            recruiter_techcombank_id,
            techcombank_company_id,
            'Solution Architect - Digital Banking',
            'Design technical architecture cho các sản phẩm ngân hàng số. Lead technical decisions và ensure scalability, security của banking systems.',
            'Thạc sĩ/Cử nhân CNTT; 7+ năm kinh nghiệm software architecture; Kinh nghiệm với microservices, APIs; Banking domain knowledge; Cloud architecture (AWS/Azure); Security frameworks; Enterprise integration patterns; Leadership và communication skills.',
            'Design end-to-end solutions cho banking products; Define technical standards và best practices; Lead architecture reviews; Collaborate với business stakeholders; Mentor development teams; Evaluate new technologies; Ensure compliance với banking regulations.',
            'Lương 50-70M VND; Leadership bonus; Comprehensive health insurance; International training opportunities; Professional certification sponsorship; Stock options; Banking product privileges; Career development programs; Modern office facilities.',
            'SENIOR',
            'FULL_TIME',
            50000000,
            70000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            7,
            12,
            'Solution Architecture',
            'Bằng Thạc sĩ/Cử nhân chuyên ngành Công nghệ thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'PUBLISHED',
            NOW(),
            112
        ),
        
        -- Samsung Jobs
        (
            gen_random_uuid(),
            recruiter_samsung_id,
            samsung_company_id,
            'Hardware Engineer - Mobile Devices',
            'Thiết kế và phát triển hardware components cho Samsung smartphones và tablets. Collaborate với global teams để create innovative mobile technologies.',
            'Cử nhân Điện tử, Viễn thông; 3+ năm kinh nghiệm hardware design; Kinh nghiệm với PCB design, signal integrity; Mobile hardware architecture; Testing và validation; CAD tools (Altium Designer); Analog/digital circuit design; English proficiency.',
            'Design hardware components cho mobile devices; Conduct hardware testing và validation; Collaborate với software teams; Analyze performance metrics; Debug hardware issues; Work with suppliers; Document design specifications.',
            'Lương 25-40M VND; Samsung employee discounts; Global training programs in Korea; Health insurance premium; Transportation allowance; Meal allowance; Performance bonus; Career development programs; Modern R&D facilities.',
            'MIDDLE',
            'FULL_TIME',
            25000000,
            40000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'ONSITE',
            3,
            6,
            'Hardware Engineering',
            'Bằng Cử nhân chuyên ngành Điện tử viễn thông, Kỹ thuật điện tử hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-11-25',
            'PUBLISHED',
            NOW(),
            156
        ),
        
        -- MoMo Jobs
        (
            gen_random_uuid(),
            recruiter_momo_id,
            momo_company_id,
            'Senior Mobile Developer - iOS',
            'Phát triển MoMo iOS app với millions of users. Implement secure financial features và optimize performance cho mobile payments.',
            'Cử nhân CNTT; 4+ năm kinh nghiệm iOS development; Expert Swift, Objective-C; iOS frameworks và design patterns; Security best practices; Payment integration experience; App Store optimization; Performance tuning; Financial app experience preferred.',
            'Develop và maintain MoMo iOS application; Implement payment features với high security; Optimize app performance; Collaborate với product và design teams; Code review và testing; Monitor app analytics; Follow iOS development best practices.',
            'Lương 32-48M VND + equity; MoMo wallet bonuses; Premium healthcare; iPhone 15 Pro provision; 16 ngày phép năm; Learning budget 12M VND; Stock options trong MoMo; Team building events; Startup growth opportunities.',
            'SENIOR',
            'FULL_TIME',
            32000000,
            48000000,
            'VND',
            hcm_city_id,
            hcm_district3_id,
            'HYBRID',
            4,
            7,
            'Mobile Development',
            'Bằng Cử nhân chuyên ngành Công nghệ thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-15',
            'PUBLISHED',
            NOW(),
            167
        ),
        
        -- Shopee Jobs
        (
            gen_random_uuid(),
            recruiter_shopee_id,
            shopee_company_id,
            'Data Engineer - Analytics Platform',
            'Build robust data pipelines để support analytics cho Shopee platform. Handle petabyte-scale data và provide insights cho business decisions.',
            'Cử nhân CNTT, Toán; 3+ năm kinh nghiệm data engineering; Thành thạo Python, SQL; Big data technologies (Spark, Hadoop); Cloud platforms (AWS, GCP); ETL/ELT processes; Data warehouse concepts; Apache Airflow; Real-time data processing.',
            'Design và implement data pipelines; Build data warehouse solutions; Optimize query performance; Collaborate với data scientists; Maintain data quality; Monitor pipeline reliability; Support analytics teams; Handle large-scale data processing.',
            'Lương 30-45M VND; SEA stock options; International health insurance; 18 ngày phép năm; MacBook Pro + equipment; Learning budget; Regional career opportunities; Performance bonus; Modern office facilities.',
            'MIDDLE',
            'FULL_TIME',
            30000000,
            45000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            3,
            6,
            'Data Engineering',
            'Bằng Cử nhân chuyên ngành Công nghệ thông tin, Toán học hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-08',
            'PUBLISHED',
            NOW(),
            298
        ),

        -- Additional Jobs for variety
        (
            gen_random_uuid(),
            recruiter_vng_id,
            vng_company_id,
            'QA Automation Engineer',
            'Xây dựng automated testing framework cho các sản phẩm VNG. Ensure quality của releases với high test coverage.',
            'Cử nhân CNTT; 3+ năm kinh nghiệm QA automation; Selenium, Appium; CI/CD integration; Test framework development; API testing; Performance testing; Programming skills (Java/Python); Agile/Scrum experience.',
            'Develop automated test suites; Design test frameworks; Execute performance testing; Bug tracking và reporting; Collaborate với development teams; Improve testing processes; Train manual testers.',
            'Lương 22-35M VND; Health insurance; Training programs; Performance bonus; Modern testing tools; 15 ngày phép; Team activities; Career growth opportunities.',
            'MIDDLE',
            'FULL_TIME',
            22000000,
            35000000,
            'VND',
            hn_city_id,
            hn_caugiay_id,
            'HYBRID',
            3,
            6,
            'Quality Assurance',
            'Bằng Cử nhân chuyên ngành Công nghệ thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-20',
            'PUBLISHED',
            NOW(),
            78
        ),

        (
            gen_random_uuid(),
            recruiter_fpt_id,
            fpt_company_id,
            'Business Analyst - Digital Transformation',
            'Phân tích business requirements cho các dự án chuyển đổi số. Bridge gap giữa business và technology teams.',
            'Cử nhân Kinh tế, QTKD, CNTT; 3+ năm kinh nghiệm BA; Business process modeling; Requirements gathering; Stakeholder management; Documentation skills; Agile methodology; SQL knowledge preferred.',
            'Gather và analyze business requirements; Create functional specifications; Facilitate stakeholder meetings; Support user acceptance testing; Process improvement recommendations; Project coordination.',
            'Lương 20-32M VND; FPT health insurance; Professional development; 13th month salary; Modern office environment; Training opportunities; Career progression path.',
            'MIDDLE',
            'FULL_TIME',
            20000000,
            32000000,
            'VND',
            hn_city_id,
            hn_badinh_id,
            'HYBRID',
            3,
            6,
            'Business Analysis',
            'Bằng Cử nhân chuyên ngành Kinh tế, Quản trị kinh doanh, Công nghệ thông tin',
            ARRAY['Vietnamese', 'English'],
            '2024-12-12',
            'PUBLISHED',
            NOW(),
            134
        ),

        (
            gen_random_uuid(),
            recruiter_techcombank_id,
            techcombank_company_id,
            'Junior Java Developer',
            'Tham gia phát triển core banking systems. Học hỏi từ senior developers và contribute vào các projects quan trọng.',
            'Cử nhân CNTT; 0-2 năm kinh nghiệm; Strong Java fundamentals; OOP principles; Basic database knowledge; Git version control; Eagerness to learn; Good problem-solving skills.',
            'Develop banking applications under supervision; Write unit tests; Participate in code reviews; Learn banking domain; Debug và fix issues; Follow coding standards.',
            'Lương 15-25M VND; Comprehensive training program; Mentorship từ seniors; Health insurance; Banking product benefits; Clear career path; Modern development environment.',
            'JUNIOR',
            'FULL_TIME',
            15000000,
            25000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'ONSITE',
            0,
            2,
            'Software Development',
            'Bằng Cử nhân chuyên ngành Công nghệ thông tin hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-31',
            'PUBLISHED',
            NOW(),
            245
        ),

        (
            gen_random_uuid(),
            recruiter_samsung_id,
            samsung_company_id,
            'Product Marketing Manager',
            'Phát triển marketing strategies cho Samsung smartphones tại thị trường Việt Nam. Launch campaigns cho các sản phẩm mới.',
            'Cử nhân Marketing, QTKD; 4+ năm kinh nghiệm product marketing; Consumer electronics experience; Campaign management; Market research; Brand management; Digital marketing; English proficiency.',
            'Develop product marketing strategies; Launch new products; Conduct market analysis; Collaborate với sales teams; Manage marketing budget; Monitor competitor activities; Brand positioning.',
            'Lương 25-40M VND; Samsung product allowances; Marketing budget; Health insurance; Performance bonus; Training in Korea; Career development; International exposure.',
            'SENIOR',
            'FULL_TIME',
            25000000,
            40000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            4,
            7,
            'Product Marketing',
            'Bằng Cử nhân chuyên ngành Marketing, Quản trị kinh doanh hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-11-28',
            'PUBLISHED',
            NOW(),
            156
        ),

        (
            gen_random_uuid(),
            recruiter_momo_id,
            momo_company_id,
            'Risk Analyst',
            'Phân tích và quản lý rủi ro cho các giao dịch financial trên platform MoMo. Develop risk models để prevent fraud.',
            'Cử nhân Tài chính, Toán, Thống kê; 2+ năm kinh nghiệm risk analysis; Statistical analysis; SQL, Python/R; Risk modeling; Financial services knowledge; Fraud detection; Regulatory compliance.',
            'Monitor transaction patterns; Develop risk scoring models; Investigate suspicious activities; Prepare risk reports; Collaborate với compliance team; Implement risk controls.',
            'Lương 22-35M VND; Fintech training; Health insurance; Performance incentives; Modern analytics tools; Career development; Stock options; Professional certifications support.',
            'MIDDLE',
            'FULL_TIME',
            22000000,
            35000000,
            'VND',
            hcm_city_id,
            hcm_district3_id,
            'HYBRID',
            2,
            5,
            'Risk Management',
            'Bằng Cử nhân chuyên ngành Tài chính, Toán học, Thống kê hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-05',
            'PUBLISHED',
            NOW(),
            89
        ),

        (
            gen_random_uuid(),
            recruiter_vingroup_id,
            vingroup_company_id,
            'UX/UI Designer - VinSmart',
            'Thiết kế user experiences cho các smart devices của VinSmart. Create intuitive interfaces cho IoT products.',
            'Cử nhân Mỹ thuật, Thiết kế; 3+ năm kinh nghiệm UX/UI; Figma, Sketch, Adobe Creative Suite; User research methods; Prototyping; Mobile design; IoT interface design preferred; Portfolio required.',
            'Design user interfaces cho smart devices; Conduct user research; Create wireframes và prototypes; Collaborate với product teams; Design system maintenance; User testing coordination.',
            'Lương 20-35M VND; Creative environment; Design tools provision; Health insurance; VinGroup ecosystem benefits; Training programs; Portfolio development; Team collaboration.',
            'MIDDLE',
            'FULL_TIME',
            20000000,
            35000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            3,
            6,
            'UX/UI Design',
            'Bằng Cử nhân chuyên ngành Mỹ thuật, Thiết kế hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-18',
            'PUBLISHED',
            NOW(),
            67
        ),

        (
            gen_random_uuid(),
            recruiter_tiki_id,
            tiki_company_id,
            'Supply Chain Analyst',
            'Optimize supply chain operations cho Tiki logistics. Analyze data để improve delivery efficiency và cost optimization.',
            'Cử nhân Logistics, QTKD, Công nghiệp; 2+ năm kinh nghiệm supply chain; Data analysis skills; Excel advanced, SQL; Supply chain management; Logistics operations; Process improvement; E-commerce knowledge.',
            'Analyze supply chain performance; Optimize inventory levels; Improve delivery operations; Collaborate với logistics partners; Data reporting; Cost analysis; Process documentation.',
            'Lương 18-28M VND; Health insurance; Performance bonus; Professional development; Modern office; Career advancement; E-commerce training; Annual bonus.',
            'MIDDLE',
            'FULL_TIME',
            18000000,
            28000000,
            'VND',
            hcm_city_id,
            hcm_district7_id,
            'ONSITE',
            2,
            5,
            'Supply Chain',
            'Bằng Cử nhân chuyên ngành Logistics, Quản trị kinh doanh, Kỹ thuật công nghiệp',
            ARRAY['Vietnamese', 'English'],
            '2024-12-22',
            'PUBLISHED',
            NOW(),
            98
        ),

        (
            gen_random_uuid(),
            recruiter_shopee_id,
            shopee_company_id,
            'Content Marketing Specialist',
            'Create engaging content cho Shopee social media channels. Develop content strategies để increase user engagement.',
            'Cử nhân Marketing, Journalism, Communication; 2+ năm kinh nghiệm content marketing; Social media management; Creative writing; Video content creation; Analytics tools; E-commerce knowledge; English proficiency.',
            'Create content cho social media platforms; Develop content calendars; Collaborate với design team; Analyze content performance; Community management; Influencer partnerships; Campaign execution.',
            'Lương 15-25M VND; Creative freedom; Social media tools; Health insurance; Training programs; Performance bonus; Young dynamic environment; Regional exposure.',
            'MIDDLE',
            'FULL_TIME',
            15000000,
            25000000,
            'VND',
            hcm_city_id,
            hcm_district1_id,
            'HYBRID',
            2,
            4,
            'Content Marketing',
            'Bằng Cử nhân chuyên ngành Marketing, Journalism, Communication hoặc tương đương',
            ARRAY['Vietnamese', 'English'],
            '2024-12-01',
            'PUBLISHED',
            NOW(),
            178
        );

    -- Log the operation
    RAISE NOTICE 'Real world jobs from major corporations inserted successfully';
    RAISE NOTICE 'Total jobs created: 25';

END $$;

-- Insert additional skills for the new jobs
INSERT INTO skills (skill_name, category, description) VALUES
    ('Java', 'Programming', 'Enterprise programming language for backend development'),
    ('Spring Framework', 'Backend', 'Java framework for enterprise applications'),
    ('Microservices', 'Architecture', 'Distributed system architecture pattern'),
    ('Redis', 'Database', 'In-memory data structure store'),
    ('Kafka', 'Messaging', 'Distributed streaming platform'),
    ('MongoDB', 'Database', 'NoSQL document database'),
    ('Docker', 'DevOps', 'Containerization platform'),
    ('Kubernetes', 'DevOps', 'Container orchestration platform'),
    ('TensorFlow', 'AI/ML', 'Machine learning framework'),
    ('PyTorch', 'AI/ML', 'Deep learning framework'),
    ('Computer Vision', 'AI/ML', 'AI technology for image processing'),
    ('NLP', 'AI/ML', 'Natural Language Processing technology'),
    ('Swift', 'Mobile', 'Programming language for iOS development'),
    ('Objective-C', 'Mobile', 'Programming language for iOS development'),
    ('Cybersecurity', 'Security', 'Information security practices'),
    ('CISSP', 'Security', 'Certified Information Systems Security Professional'),
    ('Penetration Testing', 'Security', 'Security testing methodology'),
    ('Terraform', 'DevOps', 'Infrastructure as Code tool'),
    ('Jenkins', 'DevOps', 'Continuous Integration tool'),
    ('Prometheus', 'Monitoring', 'Monitoring and alerting toolkit'),
    ('Grafana', 'Monitoring', 'Analytics and monitoring platform'),
    ('Apache Spark', 'Big Data', 'Unified analytics engine for big data'),
    ('Apache Airflow', 'Data Engineering', 'Workflow orchestration platform'),
    ('Figma', 'Design', 'Collaborative design tool'),
    ('Sketch', 'Design', 'Digital design toolkit'),
    ('Supply Chain Management', 'Operations', 'End-to-end supply chain optimization'),
    ('Risk Management', 'Finance', 'Financial risk assessment and mitigation'),
    ('Product Marketing', 'Marketing', 'Go-to-market strategy and execution'),
    ('Business Analysis', 'Analysis', 'Requirements gathering and process analysis'),
    ('Selenium', 'Testing', 'Web application testing framework'),
    ('Appium', 'Testing', 'Mobile application testing framework')
ON CONFLICT (skill_name) DO NOTHING;

-- Add sample job skills relationships (abbreviated for brevity)
DO $$
DECLARE
    backend_job_id UUID;
    java_skill_id UUID;
    spring_skill_id UUID;
    redis_skill_id UUID;
BEGIN
    -- Get a backend job ID and related skill IDs for demonstration
    SELECT j.job_id INTO backend_job_id 
    FROM jobs j JOIN companies c ON j.company_id = c.company_id 
    WHERE j.title LIKE '%Backend Engineer%' 
    LIMIT 1;
    
    SELECT skill_id INTO java_skill_id FROM skills WHERE skill_name = 'Java';
    SELECT skill_id INTO spring_skill_id FROM skills WHERE skill_name = 'Spring Framework';
    SELECT skill_id INTO redis_skill_id FROM skills WHERE skill_name = 'Redis';
    
    -- Insert job skills for the backend job
    IF backend_job_id IS NOT NULL THEN
        INSERT INTO job_skills (job_id, skill_id, required_level, is_required) VALUES
            (backend_job_id, java_skill_id, 'ADVANCED', true),
            (backend_job_id, spring_skill_id, 'ADVANCED', true),
            (backend_job_id, redis_skill_id, 'INTERMEDIATE', false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Sample job skills relationships created';
END $$;
