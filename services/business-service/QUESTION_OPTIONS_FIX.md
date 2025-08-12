# Question Options Schema Fix Documentation

## Vấn đề

Backend Test model đang cố gắng insert vào column `options` và `correct_answer` không tồn tại trong bảng `test_questions`:

❌ **Lỗi**:
```
column "options" of relation "test_questions" does not exist
```

## Nguyên nhân

Database hiện tại sử dụng **normalized schema** với separate tables:

### Schema Migration 001 (Không được sử dụng):
```sql
CREATE TABLE test_questions (
    question_id UUID PRIMARY KEY,
    test_id UUID REFERENCES job_tests(test_id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20),
    points DECIMAL(5,2),
    options TEXT,                    -- ✅ JSON column cho options
    correct_answer TEXT,             -- ✅ Trực tiếp lưu correct answer
    explanation TEXT,
    order_index INT,
    created_at TIMESTAMP
);
```

### Schema-UUID (Đang được sử dụng - Normalized):
```sql
CREATE TABLE test_questions (
    question_id UUID PRIMARY KEY,
    test_id UUID REFERENCES job_tests(test_id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(30),
    points DECIMAL(5,2),
    -- ❌ KHÔNG có options column
    -- ❌ KHÔNG có correct_answer column
    time_limit_seconds INT,
    order_index INT,
    explanation TEXT,
    required BOOLEAN,
    difficulty_level VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE question_options (
    option_id UUID PRIMARY KEY,
    question_id UUID REFERENCES test_questions(question_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,  -- ✅ Đánh dấu option nào đúng
    order_index INT,
    explanation TEXT,
    created_at TIMESTAMP
);
```

## Giải pháp đã implement

### 1. ✅ **Rewrite addTestQuestions method**

#### A. **OLD approach** (Lỗi - Single table):
```javascript
// Cố insert options và correct_answer vào test_questions
INSERT INTO test_questions (
  test_id, question_text, question_type, options, correct_answer, points
) VALUES ($1, $2, $3, $4, $5, $6)
```

#### B. **NEW approach** (Fixed - Normalized):
```javascript
// 1. Insert question vào test_questions (không có options)
INSERT INTO test_questions (
  test_id, question_text, question_type, points, order_index
) VALUES ($1, $2, $3, $4, $5)

// 2. Insert từng option vào question_options
for each option in question.options:
  INSERT INTO question_options (
    question_id, option_text, is_correct, order_index
  ) VALUES ($1, $2, $3, $4)
```

### 2. ✅ **Updated getTestById method**

#### A. **OLD approach** (Lỗi):
```javascript
// Cố lấy options và correct_answer trực tiếp từ test_questions
SELECT question_id, question_text, question_type, options, correct_answer, points
FROM test_questions
WHERE test_id = $1
```

#### B. **NEW approach** (Fixed):
```javascript
// 1. Lấy questions
SELECT question_id, question_text, question_type, points, order_index
FROM test_questions
WHERE test_id = $1

// 2. Lấy options cho từng question
for each question:
  SELECT option_text, is_correct, order_index
  FROM question_options
  WHERE question_id = $1
  
// 3. Format lại cho frontend compatibility
question.options = options.map(opt => opt.option_text)
question.correct_answer = options.find(opt => opt.is_correct)?.option_text
```

### 3. ✅ **Updated submitTestAnswers method**

#### A. **OLD approach** (Lỗi):
```javascript
// Cố lấy correct_answer từ test_questions
SELECT question_id, correct_answer, points
FROM test_questions
WHERE test_id = $1
```

#### B. **NEW approach** (Fixed):
```javascript
// JOIN với question_options để lấy correct answer
SELECT q.question_id, q.points, q.question_type,
       o.option_text as correct_answer
FROM test_questions q
LEFT JOIN question_options o ON q.question_id = o.question_id AND o.is_correct = true
WHERE q.test_id = $1
```

### 4. ✅ **Updated delete method**

Questions deletion vẫn hoạt động vì question_options có CASCADE constraint:
```sql
-- Khi xóa question, options tự động xóa theo
DELETE FROM test_questions WHERE test_id = $1
-- question_options will be deleted automatically by CASCADE
```

## Database Schema Reference

### **test_questions table** (schema-uuid):
```
question_id          UUID PRIMARY KEY
test_id              UUID REFERENCES job_tests(test_id)
question_text        TEXT NOT NULL
question_type        VARCHAR(30) CHECK (...)
points               DECIMAL(5,2) DEFAULT 1.00
time_limit_seconds   INT
order_index          INT
explanation          TEXT
required             BOOLEAN DEFAULT TRUE
difficulty_level     VARCHAR(20) CHECK (...)
created_at           TIMESTAMP DEFAULT NOW()
updated_at           TIMESTAMP DEFAULT NOW()
```

### **question_options table** (schema-uuid):
```
option_id            UUID PRIMARY KEY
question_id          UUID REFERENCES test_questions(question_id) ON DELETE CASCADE
option_text          TEXT NOT NULL
is_correct           BOOLEAN DEFAULT FALSE
order_index          INT
explanation          TEXT
created_at           TIMESTAMP DEFAULT NOW()
```

## Data Flow Example

### **Frontend sends**:
```json
{
  "question_text": "What is React?",
  "question_type": "MULTIPLE_CHOICE",
  "options": ["Library", "Framework", "Language", "Database"],
  "correct_answer": "Library",
  "points": 5
}
```

### **Backend stores**:

**test_questions table**:
```sql
INSERT INTO test_questions (test_id, question_text, question_type, points, order_index)
VALUES ('test-uuid', 'What is React?', 'MULTIPLE_CHOICE', 5, 1)
```

**question_options table**:
```sql
INSERT INTO question_options (question_id, option_text, is_correct, order_index) VALUES
('question-uuid', 'Library', true, 1),     -- ✅ is_correct = true
('question-uuid', 'Framework', false, 2),
('question-uuid', 'Language', false, 3),
('question-uuid', 'Database', false, 4)
```

### **Frontend receives** (via getTestById):
```json
{
  "question_id": "question-uuid",
  "question_text": "What is React?",
  "question_type": "MULTIPLE_CHOICE",
  "options": ["Library", "Framework", "Language", "Database"],
  "correct_answer": "Library",
  "points": 5
}
```

## Benefits of Normalized Schema

### ✅ **Advantages**:
1. **Data integrity**: No JSON parsing errors
2. **Flexibility**: Easy to add option metadata (explanation, etc.)
3. **Performance**: Can index and query options efficiently
4. **Scalability**: Better for complex question types

### ⚠️ **Tradeoffs**:
1. **Complexity**: More queries needed
2. **Performance**: Multiple DB calls per question
3. **Migration**: Existing data needs migration

## Optimization Opportunities

### **Future improvements**:

#### A. **Batch option insertion**:
```javascript
// Instead of individual INSERTs, use VALUES with multiple rows
INSERT INTO question_options (question_id, option_text, is_correct, order_index)
VALUES 
  ('q1', 'Option 1', true, 1),
  ('q1', 'Option 2', false, 2),
  ('q1', 'Option 3', false, 3)
```

#### B. **Single query for questions + options**:
```sql
SELECT 
  q.question_id, q.question_text, q.question_type, q.points,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'text', o.option_text,
      'is_correct', o.is_correct,
      'order', o.order_index
    ) ORDER BY o.order_index
  ) as options
FROM test_questions q
LEFT JOIN question_options o ON q.question_id = o.question_id
WHERE q.test_id = $1
GROUP BY q.question_id, q.question_text, q.question_type, q.points
ORDER BY q.order_index
```

## Test Cases

### ✅ **Test 1: Create test với multiple choice questions**
```javascript
{
  "job_id": "job-uuid",
  "test_name": "JavaScript Test",
  "questions": [
    {
      "question_text": "What is a closure?",
      "question_type": "MULTIPLE_CHOICE",
      "options": ["Function", "Variable", "Object", "Array"],
      "correct_answer": "Function",
      "points": 10
    }
  ]
}
```
**Kết quả mong đợi**: ✅ Question và options được lưu đúng vào 2 tables

### ✅ **Test 2: Get test details**
```javascript
GET /api/v1/tests/{testId}
```
**Kết quả mong đợi**: ✅ Response có đầy đủ questions với options và correct_answer

### ✅ **Test 3: Submit test answers**
```javascript
POST /api/v1/tests/{testId}/submit
{
  "answers": {
    "question-uuid": "Function"
  }
}
```
**Kết quả mong đợi**: ✅ Scoring hoạt động đúng với correct answers từ question_options

## Files đã thay đổi

### 📝 **services/business-service/models/Test.js**
- ✅ Rewrite `addTestQuestions()` - Insert vào 2 tables
- ✅ Update `getTestById()` - Load từ 2 tables với JOIN
- ✅ Update `submitTestAnswers()` - Score với JOIN query
- ✅ Update delete logic - CASCADE sẽ handle options

---

🎯 **Summary**: Chuyển từ denormalized schema (single table) sang normalized schema (separate tables) để match với database thực tế, đảm bảo test creation và management hoạt động đầy đủ.
