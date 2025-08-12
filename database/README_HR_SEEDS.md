# HR@TopCV.com Jobs Seeding Guide

## Tổng quan

File này hướng dẫn cách chèn dữ liệu jobs mẫu cho tài khoản HR `hr@topcv.com` để test tính năng tạo test bằng AI.

## Điều kiện tiên quyết

1. **Database đã setup**: Đảm bảo database và migrations đã chạy
2. **HR account tồn tại**: Account `hr@topcv.com` đã được tạo

## Cách chạy seeds

### Phương pháp 1: Sử dụng script tự động (Khuyến nghị)

```bash
cd database
node run-hr-topcv-seeds.js
```

Script này sẽ:
- ✅ Kiểm tra kết nối database
- ✅ Xác minh tables cần thiết tồn tại
- ✅ Kiểm tra user `hr@topcv.com` đã tồn tại
- ✅ Tạo company "TopCV Technology"
- ✅ Tạo 6 jobs mẫu với skills
- ✅ Hiển thị kết quả chi tiết

### Phương pháp 2: Chạy SQL trực tiếp

```bash
# Kết nối PostgreSQL
psql -h localhost -U postgres -d userdb

# Chạy seed file
\i seeds/003_hr_topcv_jobs.sql
```

## Jobs được tạo

Sau khi chạy seed thành công, account `hr@topcv.com` sẽ có 6 jobs:

### 1. **AI/ML Engineer - CV Matching Technology**
- **Mức lương**: 35-50M VND
- **Level**: SENIOR
- **Skills**: Python, Machine Learning, TensorFlow, AWS, Docker
- **Mô tả**: Xây dựng AI models cho CV-Job matching

### 2. **Senior Frontend Developer - React Specialist**
- **Mức lương**: 28-40M VND  
- **Level**: SENIOR
- **Skills**: React.js, JavaScript, TypeScript, HTML/CSS, Redux
- **Mô tả**: Phát triển giao diện web cho TopCV

### 3. **Senior Product Manager - Recruitment Platform**
- **Mức lương**: 40-60M VND
- **Level**: SENIOR  
- **Skills**: Google Analytics, SQL, Figma, JIRA
- **Mô tả**: Quản lý sản phẩm và chiến lược recruitment

### 4. **DevOps Engineer - Cloud Infrastructure**
- **Mức lương**: 30-45M VND
- **Level**: MIDDLE
- **Skills**: AWS, Docker, Kubernetes, Python, Linux, Jenkins
- **Mô tả**: Quản lý hạ tầng cloud và CI/CD

### 5. **Senior UX/UI Designer - User Experience Lead**
- **Mức lương**: 25-38M VND
- **Level**: SENIOR
- **Skills**: Figma, Adobe Photoshop, HTML/CSS, Sketch
- **Mô tả**: Thiết kế trải nghiệm người dùng

### 6. **Backend Developer - Node.js & Microservices**
- **Mức lương**: 22-32M VND
- **Level**: MIDDLE
- **Skills**: Node.js, Express.js, PostgreSQL, MongoDB, Redis
- **Mô tả**: Phát triển backend APIs và microservices

## Company được tạo

**TopCV Technology**
- **Tax Code**: 0999888777
- **Industry**: Human Resources Technology
- **Size**: 201-500 employees
- **Location**: District 1, Ho Chi Minh City
- **Website**: https://www.topcv.vn

## Kiểm tra kết quả

### 1. Qua database
```sql
-- Kiểm tra jobs của HR
SELECT j.title, j.experience_level, j.salary_min, j.salary_max, c.company_name
FROM jobs j
JOIN companies c ON j.company_id = c.company_id
JOIN users u ON j.recruiter_id = u.user_id
WHERE u.email = 'hr@topcv.com';

-- Kiểm tra skills
SELECT j.title, s.skill_name, js.required_level, js.is_required
FROM job_skills js
JOIN jobs j ON js.job_id = j.job_id
JOIN skills s ON js.skill_id = s.skill_id
JOIN users u ON j.recruiter_id = u.user_id
WHERE u.email = 'hr@topcv.com'
ORDER BY j.title, js.is_required DESC;
```

### 2. Qua HR Dashboard
1. Login vào HR dashboard: `hr@topcv.com` / `hr123!@#`
2. Vào **Test Management**
3. Click **Create Test**
4. Chọn một job từ dropdown - sẽ thấy 6 jobs mới
5. Test tính năng **Generate AI Questions**

## Troubleshooting

### Lỗi: "HR user hr@topcv.com not found"
```bash
cd services/business-service
node create-admin-userdb.js
```

### Lỗi: "Missing required tables"
```bash
cd database
node setup.js
```

### Lỗi: "Cannot connect to database"
- Kiểm tra PostgreSQL đang chạy
- Xem lại file `.env` trong thư mục database
- Đảm bảo credentials đúng

### Lỗi: Job đã tồn tại
Script sẽ bỏ qua nếu jobs đã tồn tại. Để tạo lại:
```sql
-- Xóa jobs cũ (cẩn thận!)
DELETE FROM job_skills WHERE job_id IN (
    SELECT j.job_id FROM jobs j 
    JOIN users u ON j.recruiter_id = u.user_id 
    WHERE u.email = 'hr@topcv.com'
);

DELETE FROM jobs WHERE recruiter_id = (
    SELECT user_id FROM users WHERE email = 'hr@topcv.com'
);
```

## Test AI Integration

Sau khi có jobs, bạn có thể test tính năng AI:

1. **Login HR**: `hr@topcv.com` / `hr123!@#`
2. **Create Test**: Chọn job từ dropdown
3. **Enable AI**: Check "Use AI to generate questions"
4. **Generate**: Click "Generate AI Questions"
5. **Verify**: Kiểm tra câu hỏi AI tạo ra

## Files liên quan

- `seeds/003_hr_topcv_jobs.sql` - SQL seed file
- `run-hr-topcv-seeds.js` - Script runner
- `services/business-service/create-admin-userdb.js` - Tạo HR account
- `services/frontend-service/src/components/hr/CreateTestModal.tsx` - UI test AI

---

🎯 **Mục đích**: Tạo dữ liệu test cho tính năng AI generation trong HR interface
📧 **Contact**: Nếu có vấn đề, kiểm tra logs hoặc liên hệ team phát triển
