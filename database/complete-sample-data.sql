-- =============================================
-- COMPLETE COMPREHENSIVE SAMPLE DATA FOR CV RECRUITMENT SYSTEM
-- Created with Vietnam timezone: Asia/Ho_Chi_Minh
-- Updated: Fixed emails to .fake domain and added password comments
-- =============================================

-- Set timezone
SET timezone = 'Asia/Ho_Chi_Minh';

-- Clear existing data (if any)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE security_events CASCADE;
TRUNCATE TABLE chat_feedback CASCADE;
TRUNCATE TABLE user_preference_embeddings CASCADE;
TRUNCATE TABLE chat_message_embeddings CASCADE;
TRUNCATE TABLE faq_embeddings CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE email_queue CASCADE;
TRUNCATE TABLE saved_jobs CASCADE;
TRUNCATE TABLE candidate_interests CASCADE;
TRUNCATE TABLE candidate_skills CASCADE;
TRUNCATE TABLE question_answers CASCADE;
TRUNCATE TABLE test_results CASCADE;
TRUNCATE TABLE question_options CASCADE;
TRUNCATE TABLE test_questions CASCADE;
TRUNCATE TABLE job_tests CASCADE;
TRUNCATE TABLE application_status_history CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE vector_matches CASCADE;
TRUNCATE TABLE job_embeddings CASCADE;
TRUNCATE TABLE cv_embeddings CASCADE;
TRUNCATE TABLE cv_content CASCADE;
TRUNCATE TABLE candidate_cvs CASCADE;
TRUNCATE TABLE job_skills CASCADE;
TRUNCATE TABLE jobs CASCADE;
TRUNCATE TABLE recruiter_profiles CASCADE;
TRUNCATE TABLE candidate_profiles CASCADE;
TRUNCATE TABLE user_verification CASCADE;
TRUNCATE TABLE user_profile CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE companies CASCADE;
TRUNCATE TABLE skills CASCADE;
TRUNCATE TABLE districts CASCADE;
TRUNCATE TABLE cities CASCADE;

-- =============================================
-- 1. GEOGRAPHY DATA
-- =============================================
INSERT INTO cities (city_name, region, country_code, is_active) VALUES
('Hồ Chí Minh', 'Miền Nam', 'VN', true),
('Hà Nội', 'Miền Bắc', 'VN', true),
('Đà Nẵng', 'Miền Trung', 'VN', true),
('Cần Thơ', 'Miền Nam', 'VN', true),
('Hải Phòng', 'Miền Bắc', 'VN', true),
('Nha Trang', 'Miền Trung', 'VN', true),
('Vũng Tàu', 'Miền Nam', 'VN', true),
('Huế', 'Miền Trung', 'VN', true),
('Biên Hòa', 'Miền Nam', 'VN', true),
('Thủ Đức', 'Miền Nam', 'VN', true);

-- Get city IDs for districts
DO $$
DECLARE
    hcm_id UUID;
    hanoi_id UUID;
    danang_id UUID;
    cantho_id UUID;
    haiphong_id UUID;
BEGIN
    SELECT city_id INTO hcm_id FROM cities WHERE city_name = 'Hồ Chí Minh';
    SELECT city_id INTO hanoi_id FROM cities WHERE city_name = 'Hà Nội';
    SELECT city_id INTO danang_id FROM cities WHERE city_name = 'Đà Nẵng';
    SELECT city_id INTO cantho_id FROM cities WHERE city_name = 'Cần Thơ';
    SELECT city_id INTO haiphong_id FROM cities WHERE city_name = 'Hải Phòng';

    -- Ho Chi Minh districts
    INSERT INTO districts (city_id, district_name) VALUES
    (hcm_id, 'Quận 1'), (hcm_id, 'Quận 2'), (hcm_id, 'Quận 3'), (hcm_id, 'Quận 4'),
    (hcm_id, 'Quận 5'), (hcm_id, 'Quận 7'), (hcm_id, 'Quận 10'), (hcm_id, 'Quận Bình Thạnh'),
    (hcm_id, 'Quận Tân Bình'), (hcm_id, 'Quận Phú Nhuận'), (hcm_id, 'Thủ Đức');

    -- Hanoi districts
    INSERT INTO districts (city_id, district_name) VALUES
    (hanoi_id, 'Ba Đình'), (hanoi_id, 'Hoàn Kiếm'), (hanoi_id, 'Hai Bà Trưng'),
    (hanoi_id, 'Đống Đa'), (hanoi_id, 'Tây Hồ'), (hanoi_id, 'Cầu Giấy'),
    (hanoi_id, 'Thanh Xuân'), (hanoi_id, 'Hoàng Mai'), (hanoi_id, 'Long Biên');

    -- Da Nang districts
    INSERT INTO districts (city_id, district_name) VALUES
    (danang_id, 'Hải Châu'), (danang_id, 'Thanh Khê'), (danang_id, 'Sơn Trà'),
    (danang_id, 'Ngũ Hành Sơn'), (danang_id, 'Liên Chiểu'), (danang_id, 'Cẩm Lệ');
END $$;

-- =============================================
-- 2. SKILLS DATA
-- =============================================
INSERT INTO skills (skill_name, category, description) VALUES
-- Programming Languages
('JavaScript', 'Programming', 'Ngôn ngữ lập trình phổ biến cho web development'),
('Python', 'Programming', 'Ngôn ngữ lập trình mạnh mẽ cho AI, data science'),
('Java', 'Programming', 'Ngôn ngữ lập trình enterprise phổ biến'),
('TypeScript', 'Programming', 'JavaScript với type safety'),
('C#', 'Programming', 'Ngôn ngữ lập trình của Microsoft'),
('PHP', 'Programming', 'Ngôn ngữ lập trình web server-side'),
('Go', 'Programming', 'Ngôn ngữ lập trình hiệu suất cao của Google'),
('Rust', 'Programming', 'Ngôn ngữ lập trình an toàn và hiệu suất cao'),
('Swift', 'Programming', 'Ngôn ngữ lập trình cho iOS development'),
('Kotlin', 'Programming', 'Ngôn ngữ lập trình hiện đại cho Android'),

-- Frontend Technologies
('React', 'Frontend', 'Thư viện JavaScript để xây dựng UI'),
('Vue.js', 'Frontend', 'Progressive framework cho JavaScript'),
('Angular', 'Frontend', 'Platform để xây dựng mobile và desktop web apps'),
('Next.js', 'Frontend', 'React framework với server-side rendering'),
('Nuxt.js', 'Frontend', 'Vue.js framework với server-side rendering'),
('HTML5', 'Frontend', 'Markup language cho web'),
('CSS3', 'Frontend', 'Styling language cho web'),
('SASS/SCSS', 'Frontend', 'CSS preprocessor'),
('Tailwind CSS', 'Frontend', 'Utility-first CSS framework'),
('Bootstrap', 'Frontend', 'CSS framework cho responsive design'),

-- Backend Technologies
('Node.js', 'Backend', 'JavaScript runtime cho server-side'),
('Express.js', 'Backend', 'Web framework cho Node.js'),
('Django', 'Backend', 'Python web framework'),
('Flask', 'Backend', 'Lightweight Python web framework'),
('Spring Boot', 'Backend', 'Java framework cho enterprise applications'),
('ASP.NET Core', 'Backend', 'Cross-platform framework của Microsoft'),
('Laravel', 'Backend', 'PHP web framework'),
('FastAPI', 'Backend', 'Modern Python web framework'),
('NestJS', 'Backend', 'Node.js framework với TypeScript'),
('Ruby on Rails', 'Backend', 'Web framework cho Ruby'),

-- Databases
('PostgreSQL', 'Database', 'Advanced open-source relational database'),
('MySQL', 'Database', 'Popular open-source relational database'),
('MongoDB', 'Database', 'NoSQL document database'),
('Redis', 'Database', 'In-memory data store'),
('Elasticsearch', 'Database', 'Search and analytics engine'),
('Firebase', 'Database', 'Google cloud database platform'),
('SQLite', 'Database', 'Lightweight embedded database'),
('Oracle Database', 'Database', 'Enterprise relational database'),
('Microsoft SQL Server', 'Database', 'Microsoft enterprise database'),
('Cassandra', 'Database', 'Distributed NoSQL database'),

-- Cloud & DevOps
('AWS', 'Cloud', 'Amazon Web Services cloud platform'),
('Azure', 'Cloud', 'Microsoft cloud platform'),
('Google Cloud', 'Cloud', 'Google cloud platform'),
('Docker', 'DevOps', 'Containerization platform'),
('Kubernetes', 'DevOps', 'Container orchestration platform'),
('Jenkins', 'DevOps', 'Automation server cho CI/CD'),
('GitLab CI', 'DevOps', 'Continuous integration platform'),
('GitHub Actions', 'DevOps', 'Automation platform từ GitHub'),
('Terraform', 'DevOps', 'Infrastructure as code tool'),
('Ansible', 'DevOps', 'Configuration management tool'),

-- AI & Data Science
('Machine Learning', 'AI', 'Artificial intelligence và machine learning'),
('Deep Learning', 'AI', 'Neural networks và deep learning'),
('TensorFlow', 'AI', 'Machine learning framework'),
('PyTorch', 'AI', 'Machine learning framework'),
('Scikit-learn', 'AI', 'Machine learning library cho Python'),
('Pandas', 'Data Science', 'Data manipulation library'),
('NumPy', 'Data Science', 'Numerical computing library'),
('Data Analysis', 'Data Science', 'Phân tích dữ liệu'),
('Data Visualization', 'Data Science', 'Trực quan hóa dữ liệu'),
('Natural Language Processing', 'AI', 'Xử lý ngôn ngữ tự nhiên'),

-- Mobile Development
('React Native', 'Mobile', 'Cross-platform mobile development'),
('Flutter', 'Mobile', 'Google mobile UI framework'),
('iOS Development', 'Mobile', 'Native iOS app development'),
('Android Development', 'Mobile', 'Native Android app development'),
('Xamarin', 'Mobile', 'Microsoft cross-platform mobile framework'),

-- Tools & Methodologies
('Git', 'Version Control', 'Distributed version control system'),
('GitHub', 'Version Control', 'Git repository hosting service'),
('GitLab', 'Version Control', 'DevOps platform với Git repository'),
('Agile', 'Methodology', 'Agile software development methodology'),
('Scrum', 'Methodology', 'Agile framework cho project management'),
('Kanban', 'Methodology', 'Visual workflow management method'),
('Project Management', 'Management', 'Quản lý dự án'),
('Team Leadership', 'Management', 'Lãnh đạo nhóm'),
('Communication', 'Soft Skills', 'Kỹ năng giao tiếp'),
('Problem Solving', 'Soft Skills', 'Giải quyết vấn đề'),

-- Testing
('Unit Testing', 'Testing', 'Kiểm thử đơn vị'),
('Integration Testing', 'Testing', 'Kiểm thử tích hợp'),
('Jest', 'Testing', 'JavaScript testing framework'),
('Pytest', 'Testing', 'Python testing framework'),
('Selenium', 'Testing', 'Web application testing framework'),
('Cypress', 'Testing', 'End-to-end testing framework'),

-- Security
('Cybersecurity', 'Security', 'An ninh mạng'),
('Penetration Testing', 'Security', 'Kiểm thử xâm nhập'),
('OAuth', 'Security', 'Open standard cho authorization'),
('JWT', 'Security', 'JSON Web Tokens'),
('SSL/TLS', 'Security', 'Transport Layer Security'),

-- Design
('UI/UX Design', 'Design', 'User Interface và User Experience design'),
('Figma', 'Design', 'Collaborative design tool'),
('Adobe XD', 'Design', 'User experience design software'),
('Sketch', 'Design', 'Digital design platform'),
('Photoshop', 'Design', 'Image editing software');

-- =============================================
-- 3. COMPANIES DATA
-- =============================================
DO $$
DECLARE
    hcm_id UUID;
    hanoi_id UUID;
    danang_id UUID;
BEGIN
    SELECT city_id INTO hcm_id FROM cities WHERE city_name = 'Hồ Chí Minh';
    SELECT city_id INTO hanoi_id FROM cities WHERE city_name = 'Hà Nội';
    SELECT city_id INTO danang_id FROM cities WHERE city_name = 'Đà Nẵng';

    INSERT INTO companies (company_name, tax_code, description, industry, company_size, address, city_id, website, company_status, is_verified, founded_year) VALUES
    ('FPT Software', 'FPT001', 'Công ty phần mềm hàng đầu Việt Nam, chuyên về outsourcing và digital transformation', 'Information Technology', '1000+', '17 Duy Tân, Cầu Giấy', hanoi_id, 'https://www.fpt-software.com', 'ACTIVE', true, 1999),
    
    ('VNG Corporation', 'VNG001', 'Tập đoàn công nghệ hàng đầu Việt Nam, phát triển game và dịch vụ internet', 'Technology', '1000+', '182 Lê Đại Hành, Quận 11', hcm_id, 'https://www.vng.com.vn', 'ACTIVE', true, 2004),
    
    ('Tiki Corporation', 'TIKI001', 'Sàn thương mại điện tử hàng đầu Việt Nam', 'E-commerce', '501-1000', '52 Út Tịch, Tân Bình', hcm_id, 'https://www.tiki.vn', 'ACTIVE', true, 2010),
    
    ('Grab Vietnam', 'GRAB001', 'Siêu ứng dụng cung cấp dịch vụ di chuyển và giao hàng', 'Technology', '501-1000', 'Lotte Center, 54 Liễu Giai', hanoi_id, 'https://www.grab.com/vn', 'ACTIVE', true, 2014),
    
    ('Shopee Vietnam', 'SHOP001', 'Nền tảng thương mại điện tử di động hàng đầu Đông Nam Á', 'E-commerce', '501-1000', 'Tòa nhà Mapletree Business Centre', hcm_id, 'https://careers.shopee.vn', 'ACTIVE', true, 2015),
    
    ('VinTech', 'VIN001', 'Công ty công nghệ của Tập đoàn Vingroup', 'Technology', '501-1000', 'Tòa Vincom Center, 72 Lê Thánh Tôn', hcm_id, 'https://vintech.vn', 'ACTIVE', true, 2018),
    
    ('Sapo Technology', 'SAPO001', 'Nền tảng quản lý bán hàng đa kênh cho SME', 'SaaS', '201-500', '15 Duy Tân, Cầu Giấy', hanoi_id, 'https://www.sapo.vn', 'ACTIVE', true, 2016),
    
    ('MoMo (M_Service)', 'MOMO001', 'Ví điện tử và siêu ứng dụng thanh toán hàng đầu Việt Nam', 'Fintech', '501-1000', 'Tòa nhà Flemington, 182 Lê Đại Hành', hcm_id, 'https://momo.vn', 'ACTIVE', true, 2007),
    
    ('Zalo (VNG)', 'ZALO001', 'Ứng dụng nhắn tin và mạng xã hội hàng đầu Việt Nam', 'Social Media', '201-500', '182 Lê Đại Hành, Quận 11', hcm_id, 'https://zalo.me', 'ACTIVE', true, 2012),
    
    ('TMA Solutions', 'TMA001', 'Công ty phần mềm chuyên về outsourcing và digital solutions', 'Information Technology', '1000+', 'Tòa nhà TMA, Quận 12', hcm_id, 'https://www.tmasolutions.com', 'ACTIVE', true, 1997),
    
    ('Nashtech', 'NASH001', 'Công ty phần mềm chuyên về digital engineering và cloud', 'Information Technology', '501-1000', 'Tòa nhà Saigon Trade Center', hcm_id, 'https://nashtechglobal.com', 'ACTIVE', true, 2000),
    
    ('KMS Technology', 'KMS001', 'Công ty phần mềm chuyên về product engineering', 'Information Technology', '201-500', '128 Nguyễn Văn Thủ, Đa Kao', hcm_id, 'https://kms-technology.com', 'ACTIVE', true, 2009),
    
    ('Axon Active', 'AXON001', 'Công ty phần mềm Thụy Sĩ có văn phòng tại Việt Nam', 'Information Technology', '201-500', 'Tòa nhà Bitexco Financial Tower', hcm_id, 'https://axonactive.com', 'ACTIVE', true, 2008),
    
    ('Viettel Software', 'VTS001', 'Công ty phần mềm của Tập đoàn Viettel', 'Information Technology', '501-1000', '41 Phạm Văn Bạch, Cầu Giấy', hanoi_id, 'https://viettel-software.vn', 'ACTIVE', true, 2004),
    
    ('CMC Global', 'CMC001', 'Tập đoàn công nghệ hàng đầu Việt Nam', 'Information Technology', '1000+', '11 Duy Tân, Cầu Giấy', hanoi_id, 'https://cmcglobal.com.vn', 'ACTIVE', true, 1993),
    
    ('Techcombank', 'TCB001', 'Ngân hàng thương mại cổ phần Kỹ Thương Việt Nam', 'Banking', '1000+', '191 Ba Tháng Hai, Quận 3', hcm_id, 'https://www.techcombank.com.vn', 'ACTIVE', true, 1993),
    
    ('VPBank', 'VPB001', 'Ngân hàng thương mại cổ phần Việt Nam Thịnh Vượng', 'Banking', '1000+', '89 Láng Hạ, Đống Đa', hanoi_id, 'https://www.vpbank.com.vn', 'ACTIVE', true, 1993),
    
    ('VNPAY', 'VNP001', 'Công ty công nghệ thanh toán hàng đầu Việt Nam', 'Fintech', '501-1000', '22 Láng Hạ, Đống Đa', hanoi_id, 'https://www.vnpay.vn', 'ACTIVE', true, 2007),
    
    ('Base.vn', 'BASE001', 'Công ty phần mềm chuyên về e-commerce solutions', 'Information Technology', '51-200', '68 Nguyễn Huệ, Quận 1', hcm_id, 'https://base.vn', 'ACTIVE', true, 2012),
    
    ('Fossil Vietnam', 'FOSSIL001', 'Văn phòng phát triển phần mềm của Fossil Group', 'Technology', '201-500', 'Tòa nhà Lotte Center', hcm_id, 'https://www.fossil.com', 'ACTIVE', true, 2015);
END $$;

-- =============================================
-- 4. USERS DATA
-- =============================================
-- Sample users with various roles
-- Password hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- Corresponds to: "password" (bcrypt hashed)
-- For testing: Use "password" as the actual password
INSERT INTO users (email, password_hash, phone, full_name, role, auth_provider, is_active) VALUES
-- Test user (existing)
('testuser@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234567', 'Nguyễn Test User', 'CANDIDATE', 'LOCAL', true),

-- Candidates
('nguyenvana@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234568', 'Nguyễn Văn A', 'CANDIDATE', 'LOCAL', true),
('tranthib@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234569', 'Trần Thị B', 'CANDIDATE', 'LOCAL', true),
('lequangc@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234570', 'Lê Quang C', 'CANDIDATE', 'LOCAL', true),
('phamminh@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234571', 'Phạm Minh D', 'CANDIDATE', 'LOCAL', true),
('vothie@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234572', 'Võ Thị E', 'CANDIDATE', 'LOCAL', true),
('hoangvanf@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234573', 'Hoàng Văn F', 'CANDIDATE', 'LOCAL', true),
('doanquang@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234574', 'Đoàn Quang G', 'CANDIDATE', 'LOCAL', true),
('ngothih@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234575', 'Ngô Thị H', 'CANDIDATE', 'LOCAL', true),
('buivani@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234576', 'Bùi Văn I', 'CANDIDATE', 'LOCAL', true),
('dangthij@gmailf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234577', 'Đặng Thị J', 'CANDIDATE', 'LOCAL', true),

-- Recruiters
('recruiter.fpt@fpt-softwaref.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234578', 'Nguyễn Tuyển Dụng FPT', 'RECRUITER', 'LOCAL', true),
('hr.vng@vngf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234579', 'Trần HR VNG', 'RECRUITER', 'LOCAL', true),
('talent.tiki@tikif.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234580', 'Lê Talent Tiki', 'RECRUITER', 'LOCAL', true),
('hiring.grab@grabf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234581', 'Phạm Hiring Grab', 'RECRUITER', 'LOCAL', true),
('recruit.shopee@shopeef.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234582', 'Võ Recruit Shopee', 'RECRUITER', 'LOCAL', true),

-- Admins
('admin@cvrecruitmentf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234583', 'Admin System', 'ADMIN', 'LOCAL', true),
('superadmin@cvrecruitmentf.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+84901234584', 'Super Admin', 'ADMIN', 'LOCAL', true);

-- =============================================
-- 5. USER PROFILES
-- =============================================
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Create user profiles for all users
    FOR user_record IN SELECT user_id, email, full_name, role FROM users LOOP
        INSERT INTO user_profile (
            user_id, 
            profile_image_url, 
            bio, 
            languages, 
            profile_completed, 
            account_status,
            last_login_at
        ) VALUES (
            user_record.user_id,
            CASE 
                WHEN user_record.role = 'CANDIDATE' THEN 'https://ui-avatars.com/api/?name=' || REPLACE(user_record.full_name, ' ', '+') || '&background=random'
                WHEN user_record.role = 'RECRUITER' THEN 'https://ui-avatars.com/api/?name=' || REPLACE(user_record.full_name, ' ', '+') || '&background=0066cc'
                ELSE 'https://ui-avatars.com/api/?name=' || REPLACE(user_record.full_name, ' ', '+') || '&background=cc0000'
            END,
            CASE 
                WHEN user_record.role = 'CANDIDATE' THEN 'Tôi là một developer đam mê công nghệ và luôn học hỏi những điều mới.'
                WHEN user_record.role = 'RECRUITER' THEN 'Chuyên viên tuyển dụng với nhiều năm kinh nghiệm trong ngành IT.'
                ELSE 'Quản trị viên hệ thống tuyển dụng.'
            END,
            ARRAY['vi', 'en'],
            CASE WHEN user_record.role = 'ADMIN' THEN true ELSE (random() > 0.3) END,
            'ACTIVE',
            NOW() - INTERVAL '1 day' * (random() * 30)::int
        );
    END LOOP;
END $$;

-- =============================================
-- 6. CANDIDATE PROFILES
-- =============================================
DO $$
DECLARE
    candidate_record RECORD;
    hcm_id UUID;
    hanoi_id UUID;
    danang_id UUID;
    city_ids UUID[];
    random_city_id UUID;
    district_id UUID;
BEGIN
    SELECT city_id INTO hcm_id FROM cities WHERE city_name = 'Hồ Chí Minh';
    SELECT city_id INTO hanoi_id FROM cities WHERE city_name = 'Hà Nội';
    SELECT city_id INTO danang_id FROM cities WHERE city_name = 'Đà Nẵng';
    
    city_ids := ARRAY[hcm_id, hanoi_id, danang_id];

    FOR candidate_record IN SELECT user_id, full_name FROM users WHERE role = 'CANDIDATE' LOOP
        -- Pick random city
        random_city_id := city_ids[1 + (random() * (array_length(city_ids, 1) - 1))::int];
        
        -- Get a random district from that city
        SELECT d.district_id INTO district_id FROM districts d WHERE d.city_id = random_city_id ORDER BY random() LIMIT 1;

        INSERT INTO candidate_profiles (
            user_id,
            date_of_birth,
            gender,
            address,
            city_id,
            district_id,
            education_level,
            school_name,
            years_experience,
            current_job_title,
            current_company,
            current_salary,
            expected_salary,
            currency,
            notice_period_days,
            willing_to_relocate,
            remote_work_preference,
            profile_completion_percentage
        ) VALUES (
            candidate_record.user_id,
            DATE '1990-01-01' + (random() * 10 * 365)::int,
            (ARRAY['MALE', 'FEMALE', 'OTHER'])[1 + (random() * 2)::int],
            '123 Đường ABC, Phường XYZ',
            random_city_id,
            district_id,
            (ARRAY['BACHELOR', 'MASTER', 'COLLEGE', 'PHD'])[1 + (random() * 3)::int],
            CASE 
                WHEN random() < 0.3 THEN 'Đại học Bách khoa'
                WHEN random() < 0.6 THEN 'Đại học Công nghệ Thông tin'
                WHEN random() < 0.8 THEN 'Đại học Kinh tế'
                ELSE 'Đại học Khoa học Tự nhiên'
            END,
            (random() * 8)::int,
            CASE 
                WHEN random() < 0.2 THEN 'Software Developer'
                WHEN random() < 0.4 THEN 'Frontend Developer'
                WHEN random() < 0.6 THEN 'Backend Developer'
                WHEN random() < 0.8 THEN 'Full Stack Developer'
                ELSE 'DevOps Engineer'
            END,
            CASE 
                WHEN random() < 0.2 THEN 'FPT Software'
                WHEN random() < 0.4 THEN 'VNG Corporation'
                WHEN random() < 0.6 THEN 'TMA Solutions'
                WHEN random() < 0.8 THEN 'KMS Technology'
                ELSE 'Startup Company'
            END,
            (5000000 + random() * 45000000)::decimal(12,2),
            (8000000 + random() * 52000000)::decimal(12,2),
            'VND',
            (15 + random() * 45)::int,
            random() > 0.7,
            (ARRAY['ONSITE', 'REMOTE', 'HYBRID', 'FLEXIBLE'])[1 + (random() * 3)::int],
            (60 + random() * 40)::int
        );
    END LOOP;
END $$;

-- =============================================
-- 7. RECRUITER PROFILES
-- =============================================
DO $$
DECLARE
    recruiter_record RECORD;
    company_record RECORD;
    company_ids UUID[];
BEGIN
    -- Get company IDs
    SELECT ARRAY(SELECT company_id FROM companies ORDER BY random()) INTO company_ids;

    FOR recruiter_record IN SELECT user_id, full_name FROM users WHERE role = 'RECRUITER' LOOP
        -- Assign random company
        SELECT * INTO company_record FROM companies WHERE company_id = company_ids[1 + (random() * (array_length(company_ids, 1) - 1))::int];

        INSERT INTO recruiter_profiles (
            user_id,
            company_id,
            position,
            department,
            hire_authority_level
        ) VALUES (
            recruiter_record.user_id,
            company_record.company_id,
            CASE 
                WHEN random() < 0.3 THEN 'HR Manager'
                WHEN random() < 0.6 THEN 'Talent Acquisition Specialist'
                WHEN random() < 0.8 THEN 'Technical Recruiter'
                ELSE 'HR Director'
            END,
            'Human Resources',
            (ARRAY['JUNIOR', 'SENIOR', 'MANAGER', 'DIRECTOR'])[1 + (random() * 3)::int]
        );
    END LOOP;
END $$;

-- =============================================
-- 8. JOBS DATA (FIXED)
-- =============================================
DO $$
DECLARE
    recruiter_record RECORD;
    company_record RECORD;
    city_ids UUID[];
    skill_ids UUID[];
    random_city_id UUID;
    selected_district_id UUID;
    job_id_var UUID;
    i INT;
    skill_count INT;
    random_skill_id UUID;
    j INT;
BEGIN
    SELECT ARRAY(SELECT city_id FROM cities) INTO city_ids;
    SELECT ARRAY(SELECT skill_id FROM skills) INTO skill_ids;

    FOR recruiter_record IN SELECT rp.user_id, rp.company_id FROM recruiter_profiles rp LIMIT 5 LOOP
        SELECT * INTO company_record FROM companies WHERE company_id = recruiter_record.company_id;
        
        -- Create 3-5 jobs per recruiter
        FOR i IN 1..(3 + (random() * 2)::int) LOOP
            random_city_id := city_ids[1 + (random() * (array_length(city_ids, 1) - 1))::int];
            SELECT d.district_id INTO selected_district_id FROM districts d WHERE d.city_id = random_city_id ORDER BY random() LIMIT 1;

            INSERT INTO jobs (
                recruiter_id,
                company_id,
                title,
                description,
                requirements,
                responsibilities,
                benefits,
                experience_level,
                employment_type,
                salary_min,
                salary_max,
                currency,
                city_id,
                district_id,
                work_arrangement,
                min_experience_years,
                max_experience_years,
                category,
                education_requirements,
                language_requirements,
                application_deadline,
                priority_level,
                featured,
                status,
                published_at,
                view_count,
                application_count
            ) VALUES (
                recruiter_record.user_id,
                company_record.company_id,
                CASE 
                    WHEN random() < 0.15 THEN 'Senior Full Stack Developer'
                    WHEN random() < 0.25 THEN 'Frontend Developer (React/Vue)'
                    WHEN random() < 0.35 THEN 'Backend Developer (Node.js/Python)'
                    WHEN random() < 0.45 THEN 'DevOps Engineer'
                    WHEN random() < 0.55 THEN 'Mobile Developer (React Native/Flutter)'
                    WHEN random() < 0.65 THEN 'Data Scientist'
                    WHEN random() < 0.75 THEN 'Product Manager'
                    WHEN random() < 0.85 THEN 'UI/UX Designer'
                    WHEN random() < 0.95 THEN 'QA Engineer'
                    ELSE 'Tech Lead'
                END,
                'Chúng tôi đang tìm kiếm một developer tài năng để tham gia vào đội ngũ phát triển sản phẩm. Bạn sẽ có cơ hội làm việc với các công nghệ hiện đại và tham gia vào các dự án thú vị.',
                '- Có kinh nghiệm từ 2-5 năm trong lĩnh vực phát triển phần mềm
- Thành thạo ít nhất một ngôn ngữ lập trình hiện đại
- Có kinh nghiệm làm việc với database
- Kỹ năng giao tiếp tốt và làm việc nhóm hiệu quả',
                '- Phát triển và duy trì các ứng dụng web/mobile
- Tham gia vào quá trình thiết kế và review code
- Làm việc chặt chẽ với team product và design
- Tối ưu hóa hiệu suất ứng dụng',
                '- Lương cạnh tranh, thưởng theo hiệu suất
- Bảo hiểm sức khỏe cao cấp
- Môi trường làm việc hiện đại, năng động
- Cơ hội đào tạo và phát triển nghề nghiệp
- Team building và các hoạt động vui chơi',
                (ARRAY['JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD'])[1 + (random() * 3)::int],
                (ARRAY['FULL_TIME', 'PART_TIME', 'CONTRACT'])[1 + (random() * 2)::int],
                (8000000 + random() * 20000000)::decimal(12,2),
                (15000000 + random() * 35000000)::decimal(12,2),
                'VND',
                random_city_id,
                selected_district_id,
                (ARRAY['ONSITE', 'REMOTE', 'HYBRID'])[1 + (random() * 2)::int],
                (random() * 3)::int,
                (3 + random() * 5)::int,
                CASE 
                    WHEN random() < 0.4 THEN 'Software Development'
                    WHEN random() < 0.6 THEN 'Web Development'
                    WHEN random() < 0.8 THEN 'Mobile Development'
                    ELSE 'DevOps'
                END,
                'Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương',
                ARRAY['vi', 'en'],
                CURRENT_DATE + INTERVAL '30 days',
                (ARRAY['NORMAL', 'HIGH', 'URGENT'])[1 + (random() * 2)::int],
                random() > 0.7,
                'PUBLISHED',
                NOW() - INTERVAL '1 day' * (random() * 10)::int,
                (random() * 1000)::int,
                (random() * 50)::int
            ) RETURNING job_id INTO job_id_var;

            -- Add 3-6 skills per job
            skill_count := 3 + (random() * 3)::int;
            FOR j IN 1..skill_count LOOP
                random_skill_id := skill_ids[1 + (random() * (array_length(skill_ids, 1) - 1))::int];
                
                INSERT INTO job_skills (job_id, skill_id, is_required, importance_level, min_years_experience)
                VALUES (
                    job_id_var,
                    random_skill_id,
                    random() > 0.5,
                    (ARRAY['MEDIUM', 'HIGH', 'CRITICAL'])[1 + (random() * 2)::int],
                    (random() * 3)::int
                ) ON CONFLICT (job_id, skill_id) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- 9. CANDIDATE SKILLS
-- =============================================
DO $$
DECLARE
    candidate_record RECORD;
    skill_ids UUID[];
    skill_count INT;
    random_skill_id UUID;
    i INT;
BEGIN
    SELECT ARRAY(SELECT skill_id FROM skills) INTO skill_ids;

    FOR candidate_record IN SELECT profile_id FROM candidate_profiles LOOP
        -- Add 5-12 skills per candidate
        skill_count := 5 + (random() * 7)::int;
        
        FOR i IN 1..skill_count LOOP
            random_skill_id := skill_ids[1 + (random() * (array_length(skill_ids, 1) - 1))::int];
            
            INSERT INTO candidate_skills (
                profile_id,
                skill_id,
                proficiency_level,
                years_experience,
                is_primary
            ) VALUES (
                candidate_record.profile_id,
                random_skill_id,
                (ARRAY['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])[1 + (random() * 3)::int],
                (random() * 5)::int,
                CASE WHEN i <= 3 THEN random() > 0.7 ELSE false END
            ) ON CONFLICT (profile_id, skill_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- 10. CANDIDATE CVS
-- =============================================
DO $$
DECLARE
    candidate_record RECORD;
    cv_id_var UUID;
    i INT;
BEGIN
    FOR candidate_record IN SELECT user_id, full_name FROM users WHERE role = 'CANDIDATE' LOOP
        -- Create 1-2 CVs per candidate
        FOR i IN 1..(1 + (random())::int) LOOP
            INSERT INTO candidate_cvs (
                candidate_id,
                cv_name,
                file_name,
                file_path,
                file_size,
                file_type,
                is_primary,
                parsing_status,
                language,
                cv_version,
                download_count
            ) VALUES (
                candidate_record.user_id,
                candidate_record.full_name || ' - CV ' || i,
                'cv_' || REPLACE(LOWER(candidate_record.full_name), ' ', '_') || '_v' || i || '.pdf',
                '/uploads/cvs/' || candidate_record.user_id || '/cv_v' || i || '.pdf',
                (50000 + random() * 500000)::bigint,
                'PDF',
                i = 1, -- First CV is primary
                'COMPLETED',
                'vi',
                i,
                (random() * 20)::int
            ) RETURNING cv_id INTO cv_id_var;

            -- Create CV content
            INSERT INTO cv_content (
                cv_id,
                raw_text,
                parsed_content,
                ai_analysis,
                extracted_skills,
                extracted_experience,
                extracted_education,
                extracted_contact
            ) VALUES (
                cv_id_var,
                'Đây là nội dung text được trích xuất từ CV của ' || candidate_record.full_name || '. 
                Kinh nghiệm làm việc với các công nghệ hiện đại như React, Node.js, Python.
                Có khả năng làm việc độc lập và theo nhóm. Giao tiếp tiếng Anh tốt.',
                jsonb_build_object(
                    'personal_info', jsonb_build_object(
                        'name', candidate_record.full_name,
                        'email', (SELECT email FROM users WHERE user_id = candidate_record.user_id),
                        'phone', (SELECT phone FROM users WHERE user_id = candidate_record.user_id)
                    ),
                    'summary', 'Developer với ' || (random() * 5 + 1)::int || ' năm kinh nghiệm',
                    'skills', jsonb_build_array('JavaScript', 'Python', 'React', 'Node.js')
                ),
                jsonb_build_object(
                    'overall_score', (70 + random() * 30)::int,
                    'strengths', jsonb_build_array('Technical skills', 'Problem solving', 'Communication'),
                    'recommendations', 'Suitable for mid-level positions'
                ),
                ARRAY['JavaScript', 'Python', 'React', 'Node.js', 'Git'],
                jsonb_build_array(
                    jsonb_build_object(
                        'company', 'Tech Company ABC',
                        'position', 'Software Developer',
                        'duration', '2020-2023',
                        'description', 'Developed web applications using modern technologies'
                    )
                ),
                jsonb_build_array(
                    jsonb_build_object(
                        'school', 'University of Technology',
                        'degree', 'Bachelor of Computer Science',
                        'year', '2020'
                    )
                ),
                jsonb_build_object(
                    'name', candidate_record.full_name,
                    'email', (SELECT email FROM users WHERE user_id = candidate_record.user_id),
                    'phone', (SELECT phone FROM users WHERE user_id = candidate_record.user_id),
                    'address', '123 ABC Street, Ho Chi Minh City'
                )
            );
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- 11. APPLICATIONS (FIXED)
-- =============================================
DO $$
DECLARE
    job_record RECORD;
    candidate_user_id UUID;
    candidate_cv_id UUID;
    application_count INT;
    i INT;
BEGIN
    -- Create applications for each job
    FOR job_record IN SELECT job_id FROM jobs WHERE status = 'PUBLISHED' ORDER BY random() LIMIT 15 LOOP
        application_count := 2 + (random() * 8)::int; -- 2-10 applications per job
        
        FOR i IN 1..application_count LOOP
            -- Get random candidate and their primary CV
            SELECT u.user_id, cv.cv_id INTO candidate_user_id, candidate_cv_id
            FROM users u 
            JOIN candidate_cvs cv ON u.user_id = cv.candidate_id 
            WHERE u.role = 'CANDIDATE' AND cv.is_primary = true
            ORDER BY random() 
            LIMIT 1;

            INSERT INTO applications (
                job_id,
                candidate_id,
                cv_id,
                cover_letter,
                ai_match_score,
                ai_analysis,
                priority,
                current_status,
                source,
                submitted_at
            ) VALUES (
                job_record.job_id,
                candidate_user_id,
                candidate_cv_id,
                'Tôi rất quan tâm đến vị trí này và tin rằng kinh nghiệm của tôi phù hợp với yêu cầu công việc. Tôi mong muốn có cơ hội trao đổi thêm.',
                (60 + random() * 40)::decimal(5,2),
                jsonb_build_object(
                    'skills_match', (70 + random() * 30)::int,
                    'experience_match', (60 + random() * 40)::int,
                    'education_match', (80 + random() * 20)::int,
                    'overall_recommendation', CASE 
                        WHEN random() > 0.7 THEN 'STRONG_MATCH'
                        WHEN random() > 0.4 THEN 'GOOD_MATCH'
                        ELSE 'MODERATE_MATCH'
                    END
                ),
                (ARRAY['NORMAL', 'HIGH'])[1 + (random())::int],
                CASE 
                    WHEN random() < 0.4 THEN 'APPLIED'
                    WHEN random() < 0.6 THEN 'SCREENING'
                    WHEN random() < 0.8 THEN 'INTERVIEW'
                    WHEN random() < 0.9 THEN 'ASSESSMENT'
                    ELSE 'OFFER'
                END,
                (ARRAY['DIRECT', 'REFERRAL', 'SOCIAL'])[1 + (random() * 2)::int],
                NOW() - INTERVAL '1 day' * (random() * 20)::int
            ) ON CONFLICT (job_id, candidate_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- 12. NOTIFICATIONS
-- =============================================
DO $$
DECLARE
    user_record RECORD;
    i INT;
BEGIN
    FOR user_record IN SELECT user_id, role FROM users LOOP
        -- Create 3-7 notifications per user
        FOR i IN 1..(3 + (random() * 4)::int) LOOP
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                priority,
                is_read,
                read_at,
                action_url,
                data,
                expires_at
            ) VALUES (
                user_record.user_id,
                CASE user_record.role
                    WHEN 'CANDIDATE' THEN 
                        (ARRAY[
                            'Có job mới phù hợp với bạn!',
                            'CV của bạn đã được xem',
                            'Ứng tuyển thành công',
                            'Lời mời phỏng vấn',
                            'Cập nhật trạng thái ứng tuyển'
                        ])[1 + (random() * 4)::int]
                    WHEN 'RECRUITER' THEN
                        (ARRAY[
                            'Có ứng viên mới ứng tuyển',
                            'CV phù hợp với job posting',
                            'Deadline sắp hết hạn',
                            'Báo cáo tuyển dụng hàng tuần',
                            'Ứng viên đã accept offer'
                        ])[1 + (random() * 4)::int]
                    ELSE 'System notification'
                END,
                'Đây là nội dung chi tiết của thông báo...',
                (ARRAY['INFO', 'SUCCESS', 'JOB_ALERT', 'APPLICATION_UPDATE'])[1 + (random() * 3)::int],
                (ARRAY['NORMAL', 'HIGH'])[1 + (random())::int],
                random() > 0.4,
                CASE WHEN random() > 0.4 THEN NOW() - INTERVAL '1 day' * (random() * 5)::int ELSE NULL END,
                '/dashboard',
                jsonb_build_object('source', 'system', 'category', 'general'),
                NOW() + INTERVAL '7 days'
            );
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- 13. FAQ EMBEDDINGS (Sample AI content)
-- =============================================
INSERT INTO faq_embeddings (content_type, title, original_text, tags, language, category, priority) VALUES
('FAQ', 'Làm thế nào để tạo CV hiệu quả?', 
'Để tạo một CV hiệu quả, bạn nên: 1) Sử dụng format rõ ràng, dễ đọc 2) Tập trung vào kỹ năng và kinh nghiệm liên quan 3) Sử dụng từ khóa phù hợp với job description 4) Đảm bảo thông tin chính xác và cập nhật',
ARRAY['cv', 'tips', 'job-search'], 'vi', 'career-advice', 1),

('FAQ', 'Cách chuẩn bị cho phỏng vấn IT?',
'Chuẩn bị phỏng vấn IT: 1) Ôn tập kiến thức technical 2) Chuẩn bị câu hỏi về công ty 3) Luyện tập coding problems 4) Chuẩn bị câu chuyện về projects đã làm 5) Tìm hiểu về team và culture',
ARRAY['interview', 'preparation', 'it'], 'vi', 'interview-tips', 1),

('FAQ', 'Mức lương IT tại Việt Nam hiện tại?',
'Mức lương IT tại VN: Fresher: 8-15M, Junior (1-2 năm): 12-25M, Middle (3-5 năm): 20-40M, Senior (5+ năm): 35-80M, Lead/Manager: 50-120M. Lương phụ thuộc vào công nghệ, công ty, và location.',
ARRAY['salary', 'it-market', 'vietnam'], 'vi', 'salary-info', 1),

('FAQ', 'Xu hướng công nghệ IT 2024?',
'Xu hướng IT 2024: 1) AI/ML và GenAI 2) Cloud-native development 3) DevOps và automation 4) Cybersecurity 5) Mobile development 6) Blockchain 7) IoT 8) Data Science & Analytics',
ARRAY['trends', 'technology', '2024'], 'vi', 'tech-trends', 1),

('FAQ', 'Cách chuyển đổi career sang IT?',
'Chuyển đổi career sang IT: 1) Xác định lĩnh vực muốn chuyển (web dev, mobile, data, etc.) 2) Học online courses/bootcamp 3) Làm projects thực tế 4) Tham gia community 5) Tìm mentor 6) Apply intern/fresher positions',
ARRAY['career-change', 'it-transition', 'learning'], 'vi', 'career-advice', 1);

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
DECLARE
    stats_message TEXT;
BEGIN
    SELECT format('
🎉 COMPLETE COMPREHENSIVE SAMPLE DATA CREATED SUCCESSFULLY!
=========================================================
📊 DATABASE STATISTICS:
• Users: %s (Candidates: %s, Recruiters: %s, Admins: %s)
• Companies: %s
• Cities: %s with %s districts  
• Skills: %s across multiple categories
• Jobs: %s published positions
• CVs: %s candidate CVs
• Applications: %s job applications
• Notifications: %s system notifications
• FAQ Content: %s AI-powered entries

🔐 AUTHENTICATION INFO:
• All emails use .com domain (valid format for API)
• Password hash: bcrypt("password")
• Test account: testuser@example.com / password
• All other accounts use "password" as well

🌏 TIMEZONE: All timestamps in Asia/Ho_Chi_Minh (UTC+7)
⚡ READY FOR: AI matching, vector search, full recruitment workflow
=========================================================',
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM users WHERE role = 'CANDIDATE'),
        (SELECT COUNT(*) FROM users WHERE role = 'RECRUITER'),
        (SELECT COUNT(*) FROM users WHERE role = 'ADMIN'),
        (SELECT COUNT(*) FROM companies),
        (SELECT COUNT(*) FROM cities),
        (SELECT COUNT(*) FROM districts),
        (SELECT COUNT(*) FROM skills),
        (SELECT COUNT(*) FROM jobs WHERE status = 'PUBLISHED'),
        (SELECT COUNT(*) FROM candidate_cvs),
        (SELECT COUNT(*) FROM applications),
        (SELECT COUNT(*) FROM notifications),
        (SELECT COUNT(*) FROM faq_embeddings)
    ) INTO stats_message;
    
    RAISE NOTICE '%', stats_message;
END $$;
