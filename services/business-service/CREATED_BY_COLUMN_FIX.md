# Created_By Column Fix Documentation

## Vấn đề

Backend Test model đang cố gắng insert vào column `created_by` không tồn tại trong database:

❌ **Lỗi**:
```
column "created_by" of relation "job_tests" does not exist
```

## Nguyên nhân

Database hiện tại đang sử dụng **schema-uuid.sql** thay vì **migration 001**:

### Schema Migration 001 (Không được sử dụng):
```sql
CREATE TABLE job_tests (
    test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    total_questions INT NOT NULL,           -- ✅ Có
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(user_id),  -- ✅ Có created_by
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Schema-UUID (Đang được sử dụng):
```sql
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
    -- ❌ KHÔNG có created_by column
    -- ❌ KHÔNG có total_questions column
);
```

## Giải pháp đã implement

### 1. ✅ **Fixed createTest method** (`models/Test.js`)

#### A. **Removed created_by from INSERT**:
```javascript
// TRƯỚC (Lỗi)
INSERT INTO job_tests (
  job_id, test_name, description, duration_minutes, passing_score, is_active, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7)

// SAU (Đã sửa)
INSERT INTO job_tests (
  job_id, test_name, description, duration_minutes, passing_score, is_active
) VALUES ($1, $2, $3, $4, $5, $6)
```

#### B. **Removed created_by from validation**:
```javascript
// TRƯỚC
if (!job_id || !test_name || !created_by) {
  throw new Error('Job ID, test name, and creator are required');
}

// SAU
if (!job_id || !test_name) {
  throw new Error('Job ID and test name are required');
}
```

#### C. **Removed created_by from destructuring**:
```javascript
// TRƯỚC
const {
  job_id, test_name, test_description, test_type, time_limit,
  passing_score, is_active, created_by, questions  // ❌ created_by
} = testData;

// SAU
const {
  job_id, test_name, test_description, test_type, time_limit,
  passing_score, is_active, questions  // ✅ Bỏ created_by
} = testData;
```

### 2. ✅ **Fixed SELECT queries**

#### A. **Removed created_by JOINs**:
```javascript
// TRƯỚC (Lỗi)
SELECT 
  t.*,
  j.title as job_title,
  j.company_id,
  c.company_name,
  u.full_name as created_by_name    -- ❌ Dựa vào created_by column
FROM job_tests t
JOIN jobs j ON t.job_id = j.job_id
JOIN companies c ON j.company_id = c.company_id
LEFT JOIN users u ON t.created_by = u.user_id  -- ❌ created_by không tồn tại

// SAU (Đã sửa)
SELECT 
  t.*,
  j.title as job_title,
  j.company_id,
  c.company_name                    -- ✅ Bỏ created_by_name
FROM job_tests t
JOIN jobs j ON t.job_id = j.job_id
JOIN companies c ON j.company_id = c.company_id
-- ✅ Bỏ JOIN với users table
```

#### B. **Fixed GROUP BY clauses**:
```javascript
// TRƯỚC (Lỗi)
GROUP BY t.test_id, u.full_name  -- ❌ u.full_name không tồn tại

// SAU (Đã sửa)
GROUP BY t.test_id               -- ✅ Chỉ group theo test_id
```

### 3. ✅ **Updated logging**:
```javascript
// TRƯỚC
logger.info('Test created successfully', {
  test_id: test.test_id,
  test_name: test.test_name,
  job_id,
  created_by  // ❌ Field không tồn tại
});

// SAU
logger.info('Test created successfully', {
  test_id: test.test_id,
  test_name: test.test_name,
  job_id      // ✅ Bỏ created_by
});
```

## Impact Assessment

### ✅ **Không mất tính năng**:
- Test creation vẫn hoạt động đầy đủ
- Questions vẫn được tạo và lưu đúng
- Test assignment và grading không bị ảnh hưởng
- UI frontend vẫn hoạt động bình thường

### ⚠️ **Mất thông tin audit**:
- Không track được ai tạo test (do không có created_by)
- Tuy nhiên có thể infer từ session hoặc permissions

### 🔧 **Alternative solutions** (nếu cần created_by):

#### Option 1: Thêm column vào database
```sql
ALTER TABLE job_tests ADD COLUMN created_by UUID REFERENCES users(user_id);
```

#### Option 2: Dùng audit table riêng
```sql
CREATE TABLE test_audit (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES job_tests(test_id),
  action VARCHAR(20),
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Option 3: Lưu metadata trong JSON field
```sql
ALTER TABLE job_tests ADD COLUMN metadata JSONB;
-- Store: {"created_by": "user_id", "created_by_name": "User Name"}
```

## Database Schema Reference

### **Actual Columns** (schema-uuid.sql):
```
test_id              UUID PRIMARY KEY
job_id               UUID REFERENCES jobs(job_id)
test_name            VARCHAR(200) NOT NULL
test_type            VARCHAR(30) CHECK (...)
difficulty_level     VARCHAR(20) CHECK (...)
duration_minutes     INT DEFAULT 60
passing_score        DECIMAL(5,2) DEFAULT 60.00
description          TEXT
instructions         TEXT
is_active           BOOLEAN DEFAULT TRUE
is_mandatory        BOOLEAN DEFAULT FALSE
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### **Missing Columns**:
```
❌ created_by         UUID REFERENCES users(user_id)
❌ total_questions    INT NOT NULL
```

## Test Cases

### ✅ **Test 1: Tạo test cơ bản**
```bash
POST /api/v1/tests
{
  "job_id": "uuid",
  "test_name": "Sample Test", 
  "test_description": "This is a test",
  "time_limit": 90,
  "passing_score": 75,
  "is_active": true,
  "questions": [...]
}
```
**Kết quả mong đợi**: ✅ Test được tạo thành công

### ✅ **Test 2: Get test details**
```bash
GET /api/v1/tests/{id}
```
**Kết quả mong đợi**: ✅ Response không có lỗi JOIN

### ✅ **Test 3: Get tests by job**
```bash
GET /api/v1/tests/job/{jobId}
```
**Kết quả mong đợi**: ✅ No GROUP BY errors

## Files đã thay đổi

### 📝 **services/business-service/models/Test.js**
- ✅ Removed `created_by` from INSERT query
- ✅ Removed `created_by` from validation
- ✅ Removed `created_by` JOINs in SELECT queries
- ✅ Fixed GROUP BY clauses
- ✅ Updated logging

### 📝 **services/business-service/controllers/TestController.js**
- ✅ Không cần thay đổi (vẫn có thể nhận created_by từ frontend)
- ✅ Model sẽ ignore field không tồn tại

## Rollback Plan

Nếu cần rollback:

1. **Restore created_by references** trong Test model
2. **Add database migration** để tạo created_by column:
   ```sql
   ALTER TABLE job_tests ADD COLUMN created_by UUID REFERENCES users(user_id);
   ```
3. **Update existing records** với default user

Nhưng giải pháp hiện tại (bỏ created_by) là ổn để tập trung vào functionality chính.

---

🎯 **Summary**: Loại bỏ hoàn toàn created_by references để match với database schema thực tế, đảm bảo test creation hoạt động mà không cần thay đổi database.
