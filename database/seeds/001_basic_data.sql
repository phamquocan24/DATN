-- =============================================
-- SEED DATA 001: BASIC LOOKUP DATA
-- Description: Cities, districts, skills and other lookup data
-- =============================================

-- Insert Vietnamese cities
INSERT INTO cities (city_name, region, country_code) VALUES
('Hồ Chí Minh', 'Miền Nam', 'VN'),
('Hà Nội', 'Miền Bắc', 'VN'),
('Đà Nẵng', 'Miền Trung', 'VN'),
('Cần Thơ', 'Miền Nam', 'VN'),
('Hải Phòng', 'Miền Bắc', 'VN'),
('Biên Hòa', 'Miền Nam', 'VN'),
('Nha Trang', 'Miền Trung', 'VN'),
('Huế', 'Miền Trung', 'VN'),
('Quy Nhon', 'Miền Trung', 'VN'),
('Vũng Tàu', 'Miền Nam', 'VN'),
('Thái Nguyên', 'Miền Bắc', 'VN'),
('Vinh', 'Miền Trung', 'VN'),
('Đà Lạt', 'Miền Nam', 'VN'),
('Buôn Ma Thuột', 'Miền Trung', 'VN'),
('Phan Thiết', 'Miền Nam', 'VN')
ON CONFLICT (city_name) DO NOTHING;

-- Get city IDs for districts
DO $$
DECLARE
    hcm_id UUID;
    hn_id UUID;
    dn_id UUID;
BEGIN
    SELECT city_id INTO hcm_id FROM cities WHERE city_name = 'Hồ Chí Minh';
    SELECT city_id INTO hn_id FROM cities WHERE city_name = 'Hà Nội';
    SELECT city_id INTO dn_id FROM cities WHERE city_name = 'Đà Nẵng';
    
    -- Insert HCM districts
    INSERT INTO districts (city_id, district_name) VALUES
    (hcm_id, 'Quận 1'),
    (hcm_id, 'Quận 2'),
    (hcm_id, 'Quận 3'),
    (hcm_id, 'Quận 4'),
    (hcm_id, 'Quận 5'),
    (hcm_id, 'Quận 6'),
    (hcm_id, 'Quận 7'),
    (hcm_id, 'Quận 8'),
    (hcm_id, 'Quận 9'),
    (hcm_id, 'Quận 10'),
    (hcm_id, 'Quận 11'),
    (hcm_id, 'Quận 12'),
    (hcm_id, 'Quận Bình Thạnh'),
    (hcm_id, 'Quận Tân Bình'),
    (hcm_id, 'Quận Tân Phú'),
    (hcm_id, 'Quận Phú Nhuận'),
    (hcm_id, 'Quận Gò Vấp'),
    (hcm_id, 'Thành phố Thủ Đức'),
    (hcm_id, 'Huyện Bình Chánh'),
    (hcm_id, 'Huyện Hóc Môn'),
    (hcm_id, 'Huyện Củ Chi'),
    (hcm_id, 'Huyện Nhà Bè'),
    (hcm_id, 'Huyện Cần Giờ');
    
    -- Insert Hanoi districts
    INSERT INTO districts (city_id, district_name) VALUES
    (hn_id, 'Quận Ba Đình'),
    (hn_id, 'Quận Hoàn Kiếm'),
    (hn_id, 'Quận Hai Bà Trưng'),
    (hn_id, 'Quận Đống Đa'),
    (hn_id, 'Quận Tây Hồ'),
    (hn_id, 'Quận Cầu Giấy'),
    (hn_id, 'Quận Thanh Xuân'),
    (hn_id, 'Quận Hoàng Mai'),
    (hn_id, 'Quận Long Biên'),
    (hn_id, 'Quận Nam Từ Liêm'),
    (hn_id, 'Quận Bắc Từ Liêm'),
    (hn_id, 'Quận Hà Đông'),
    (hn_id, 'Huyện Sóc Sơn'),
    (hn_id, 'Huyện Đông Anh'),
    (hn_id, 'Huyện Gia Lâm'),
    (hn_id, 'Huyện Thanh Trì');
    
    -- Insert Da Nang districts
    INSERT INTO districts (city_id, district_name) VALUES
    (dn_id, 'Quận Hải Châu'),
    (dn_id, 'Quận Thanh Khê'),
    (dn_id, 'Quận Sơn Trà'),
    (dn_id, 'Quận Ngũ Hành Sơn'),
    (dn_id, 'Quận Liên Chiểu'),
    (dn_id, 'Quận Cẩm Lệ'),
    (dn_id, 'Huyện Hòa Vang'),
    (dn_id, 'Huyện Hoàng Sa');
END $$;

-- Insert programming languages and technologies
INSERT INTO skills (skill_name, category, description) VALUES
-- Programming Languages
('JavaScript', 'Programming', 'Dynamic programming language for web development'),
('TypeScript', 'Programming', 'Typed superset of JavaScript'),
('Python', 'Programming', 'High-level programming language'),
('Java', 'Programming', 'Object-oriented programming language'),
('C#', 'Programming', 'Microsoft .NET programming language'),
('C++', 'Programming', 'General-purpose programming language'),
('Go', 'Programming', 'Open source programming language by Google'),
('Rust', 'Programming', 'Systems programming language'),
('Swift', 'Programming', 'Programming language for iOS development'),
('Kotlin', 'Programming', 'Programming language for Android development'),
('PHP', 'Programming', 'Server-side scripting language'),
('Ruby', 'Programming', 'Dynamic programming language'),
('Scala', 'Programming', 'Functional programming language'),
('R', 'Programming', 'Statistical computing language'),
('MATLAB', 'Programming', 'Technical computing language'),

-- Frontend Technologies
('React', 'Frontend', 'JavaScript library for building user interfaces'),
('Angular', 'Frontend', 'TypeScript-based web application framework'),
('Vue.js', 'Frontend', 'Progressive JavaScript framework'),
('Next.js', 'Frontend', 'React framework for production'),
('Nuxt.js', 'Frontend', 'Vue.js framework'),
('Svelte', 'Frontend', 'Cybernetically enhanced web apps'),
('HTML5', 'Frontend', 'Latest HTML standard'),
('CSS3', 'Frontend', 'Latest CSS standard'),
('SASS/SCSS', 'Frontend', 'CSS preprocessor'),
('Tailwind CSS', 'Frontend', 'Utility-first CSS framework'),
('Bootstrap', 'Frontend', 'CSS framework'),
('Material-UI', 'Frontend', 'React UI components'),
('jQuery', 'Frontend', 'JavaScript library'),

-- Backend Technologies
('Node.js', 'Backend', 'JavaScript runtime for server-side development'),
('Express.js', 'Backend', 'Web framework for Node.js'),
('NestJS', 'Backend', 'TypeScript framework for Node.js'),
('Django', 'Backend', 'Python web framework'),
('Flask', 'Backend', 'Lightweight Python web framework'),
('FastAPI', 'Backend', 'Modern Python web framework'),
('Spring Boot', 'Backend', 'Java framework'),
('ASP.NET Core', 'Backend', '.NET web framework'),
('.NET', 'Backend', 'Microsoft development platform'),
('Laravel', 'Backend', 'PHP web framework'),
('Ruby on Rails', 'Backend', 'Ruby web framework'),
('Gin', 'Backend', 'Go web framework'),

-- Databases
('PostgreSQL', 'Database', 'Advanced relational database'),
('MySQL', 'Database', 'Popular relational database'),

('Redis', 'Database', 'In-memory data store'),
('Elasticsearch', 'Database', 'Search and analytics engine'),
('Cassandra', 'Database', 'NoSQL distributed database'),
('Oracle', 'Database', 'Enterprise relational database'),
('SQL Server', 'Database', 'Microsoft relational database'),
('SQLite', 'Database', 'Lightweight relational database'),
('DynamoDB', 'Database', 'AWS NoSQL database'),
('Firebase', 'Database', 'Google cloud database'),

-- Cloud & DevOps
('AWS', 'Cloud', 'Amazon Web Services'),
('Azure', 'Cloud', 'Microsoft cloud platform'),
('Google Cloud', 'Cloud', 'Google cloud platform'),
('Docker', 'DevOps', 'Containerization platform'),
('Kubernetes', 'DevOps', 'Container orchestration'),
('Jenkins', 'DevOps', 'Continuous integration tool'),
('GitLab CI/CD', 'DevOps', 'Continuous integration/deployment'),
('GitHub Actions', 'DevOps', 'GitHub automation'),
('Terraform', 'DevOps', 'Infrastructure as code'),
('Ansible', 'DevOps', 'Configuration management'),
('Nginx', 'DevOps', 'Web server and reverse proxy'),
('Apache', 'DevOps', 'Web server'),

-- Mobile Development
('React Native', 'Mobile', 'Cross-platform mobile development'),
('Flutter', 'Mobile', 'Google mobile development framework'),
('iOS Development', 'Mobile', 'Native iOS app development'),
('Android Development', 'Mobile', 'Native Android app development'),
('Xamarin', 'Mobile', 'Microsoft mobile development'),
('Ionic', 'Mobile', 'Hybrid mobile development'),

-- Data Science & AI
('Machine Learning', 'AI/ML', 'Algorithms for pattern recognition'),
('Deep Learning', 'AI/ML', 'Neural networks and AI'),
('TensorFlow', 'AI/ML', 'Machine learning framework'),
('PyTorch', 'AI/ML', 'Machine learning framework'),
('Scikit-learn', 'AI/ML', 'Machine learning library'),
('Pandas', 'Data Science', 'Data manipulation library'),
('NumPy', 'Data Science', 'Numerical computing library'),
('Data Analysis', 'Data Science', 'Data exploration and analysis'),
('Data Visualization', 'Data Science', 'Visual representation of data'),
('Big Data', 'Data Science', 'Large dataset processing'),
('Apache Spark', 'Data Science', 'Distributed computing'),
('Hadoop', 'Data Science', 'Big data processing framework'),
('Power BI', 'Analytics', 'Business intelligence tool'),
('Tableau', 'Analytics', 'Data visualization tool'),
('SQL', 'Data Science', 'Structured Query Language'),

-- Testing
('Jest', 'Testing', 'JavaScript testing framework'),
('Cypress', 'Testing', 'End-to-end testing'),
('Selenium', 'Testing', 'Web application testing'),
('JUnit', 'Testing', 'Java testing framework'),
('PyTest', 'Testing', 'Python testing framework'),
('Postman', 'Testing', 'API testing tool'),

-- Version Control & Tools
('Git', 'Tools', 'Version control system'),
('GitHub', 'Tools', 'Git repository hosting'),
('GitLab', 'Tools', 'Git repository and CI/CD'),
('Bitbucket', 'Tools', 'Git repository hosting'),
('JIRA', 'Tools', 'Issue tracking and project management'),
('Confluence', 'Tools', 'Team collaboration tool'),
('Slack', 'Tools', 'Team communication'),
('Trello', 'Tools', 'Project management'),

-- Design & UI/UX
('Figma', 'Design', 'UI/UX design tool'),
('Adobe XD', 'Design', 'UI/UX design tool'),
('Sketch', 'Design', 'UI design tool'),
('Adobe Photoshop', 'Design', 'Image editing software'),
('Adobe Illustrator', 'Design', 'Vector graphics editor'),
('UI/UX Design', 'Design', 'User interface and experience design'),
('Wireframing', 'Design', 'UI planning and layout'),
('Prototyping', 'Design', 'Interactive design mockups'),

-- Soft Skills
('Project Management', 'Management', 'Planning and executing projects'),
('Team Leadership', 'Management', 'Leading and managing teams'),
('Agile', 'Methodology', 'Agile software development'),
('Scrum', 'Methodology', 'Agile framework'),
('Kanban', 'Methodology', 'Visual workflow management'),
('Communication', 'Soft Skills', 'Effective communication skills'),
('Problem Solving', 'Soft Skills', 'Analytical thinking and solutions'),
('Critical Thinking', 'Soft Skills', 'Objective analysis and evaluation'),
('Time Management', 'Soft Skills', 'Efficient time utilization'),
('Teamwork', 'Soft Skills', 'Collaborative work skills'),

-- Security
('Cybersecurity', 'Security', 'Information security practices'),
('Penetration Testing', 'Security', 'Security vulnerability testing'),
('OAuth', 'Security', 'Authentication protocol'),
('JWT', 'Security', 'JSON Web Tokens'),
('SSL/TLS', 'Security', 'Secure communication protocols'),
('OWASP', 'Security', 'Web application security'),

-- Business & Domain
('Business Analysis', 'Business', 'Analyzing business requirements'),
('Financial Analysis', 'Business', 'Financial data analysis'),
('Marketing', 'Business', 'Product and service promotion'),
('Sales', 'Business', 'Revenue generation activities'),
('Customer Service', 'Business', 'Customer support and relations'),
('E-commerce', 'Business', 'Online business operations'),
('FinTech', 'Domain', 'Financial technology'),
('HealthTech', 'Domain', 'Healthcare technology'),
('EdTech', 'Domain', 'Educational technology'),
('Blockchain', 'Technology', 'Distributed ledger technology'),
('Cryptocurrency', 'Technology', 'Digital currency systems'),
('IoT', 'Technology', 'Internet of Things'),
('AR/VR', 'Technology', 'Augmented/Virtual Reality')

ON CONFLICT (skill_name) DO NOTHING;

-- Insert sample companies for testing
INSERT INTO companies (company_name, description, industry, company_size, website, company_status, is_verified) VALUES
('FPT Software', 'Leading software development company in Vietnam', 'Information Technology', '1000+', 'https://www.fpt-software.com', 'ACTIVE', true),
('VNG Corporation', 'Technology company developing online games and services', 'Information Technology', '501-1000', 'https://www.vng.com.vn', 'ACTIVE', true),
('Tiki Corporation', 'E-commerce platform in Vietnam', 'E-commerce', '501-1000', 'https://www.tiki.vn', 'ACTIVE', true),
('Grab Vietnam', 'Southeast Asian technology company', 'Transportation Technology', '1000+', 'https://www.grab.com', 'ACTIVE', true),
('Shopee Vietnam', 'E-commerce platform', 'E-commerce', '1000+', 'https://shopee.vn', 'ACTIVE', true),
('VinGroup Technology', 'Technology arm of VinGroup', 'Conglomerate Technology', '1000+', 'https://www.vingroup.net', 'ACTIVE', true),
('TechcomBank', 'Leading commercial bank with strong digital focus', 'Banking & Finance', '1000+', 'https://www.techcombank.com.vn', 'ACTIVE', true),
('VNPT Technology', 'Technology solutions provider', 'Information Technology', '1000+', 'https://www.vnpt-technology.vn', 'ACTIVE', true),
('Saigon Technology', 'Software development outsourcing company', 'Information Technology', '201-500', 'https://saigontechnology.com', 'ACTIVE', true),
('KMS Technology', 'Software development and consulting', 'Information Technology', '501-1000', 'https://www.kms-technology.com', 'ACTIVE', true)
ON CONFLICT (company_name) DO NOTHING;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Basic seed data inserted successfully:';
    RAISE NOTICE '- Cities: %', (SELECT COUNT(*) FROM cities);
    RAISE NOTICE '- Districts: %', (SELECT COUNT(*) FROM districts);
    RAISE NOTICE '- Skills: %', (SELECT COUNT(*) FROM skills);
    RAISE NOTICE '- Companies: %', (SELECT COUNT(*) FROM companies);
END $$; 