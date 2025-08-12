# Fix lỗi Questions không hiển thị và không vào được chi tiết Test

## 🔍 **Vấn đề đã được xác định**

### 1. **API Mapping Issues**
- Backend trả về field `test_id` nhưng frontend mong đợi `id`
- Backend trả về field `description` nhưng frontend mong đợi `test_description` 
- Backend trả về field `duration_minutes` nhưng frontend mong đợi `time_limit`
- Backend trả về field `percentage_score` nhưng frontend mong đợi `score`

### 2. **Test Result Details API Issues**
- Frontend gọi endpoint `/api/v1/tests/{testId}/results/{candidateId}` (không tồn tại)
- Backend chỉ có endpoint `/api/v1/tests/{testId}/result` (cần query params)
- Thiếu `application_id` khi gọi API để lấy chi tiết kết quả test

### 3. **Data Structure Mismatch**
- Questions data không được map đúng từ backend response
- Candidate results không có đủ field mapping

## ✅ **Các lỗi đã được khắc phục**

### 1. **Fixed testApi.ts**
```typescript
// OLD: getCandidateResult gọi sai endpoint
getCandidateResult: async (testId: string, candidateId: string) => {
  const response = await apiClient.get(`/api/v1/tests/${testId}/results/${candidateId}`);
  return response.data;
}

// NEW: getCandidateResult gọi đúng endpoint với query params
getCandidateResult: async (testId: string, candidateId: string, applicationId?: string) => {
  const params = applicationId ? { candidate_id: candidateId, application_id: applicationId } : { candidate_id: candidateId };
  const response = await apiClient.get(`/api/v1/tests/${testId}/result`, { params });
  return response.data;
}
```

### 2. **Fixed TestDetails.tsx**
```typescript
// NEW: Added data mapping in loadTestDetails
const mappedTest = {
  ...response,
  id: response.test_id || response.id,
  test_description: response.description || response.test_description,
  time_limit: response.duration_minutes || response.time_limit,
  questions: response.questions || []
};

// NEW: Added data mapping in loadTestResults  
const mappedCandidates = (response.data || response.results || []).map((candidate: any) => ({
  ...candidate,
  id: candidate.test_result_id || candidate.id,
  candidate_id: candidate.candidate_id,
  candidate_name: candidate.candidate_name || candidate.full_name,
  score: candidate.percentage_score || candidate.score,
  status: candidate.status,
  submitted_at: candidate.completed_at || candidate.submitted_at,
  application_id: candidate.application_id
}));

// NEW: Added application_id to navigation
onClick={() => navigate(`results/${candidate.candidate_id}?application_id=${candidate.application_id || ''}`)}
```

### 3. **Fixed TestResultDetails.tsx**
```typescript
// NEW: Added useSearchParams to get application_id from URL
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
const [searchParams] = useSearchParams();

// NEW: Pass application_id to API call
const loadTestResult = async () => {
  const applicationId = searchParams.get('application_id');
  const response = await testApi.getCandidateResult(testId!, candidateId!, applicationId || undefined);
  
  // NEW: Added data mapping
  const mappedResult = {
    ...response,
    test_id: response.test_id || testId,
    candidate_id: response.candidate_id || candidateId,
    questions: response.questions || [],
    answers: response.answers || {}
  };
}
```

### 4. **Fixed TestManagement.tsx**
```typescript
// NEW: Added data mapping in loadTests
const mappedTests = (response.data || response.tests || []).map((test: any) => ({
  ...test,
  id: test.test_id || test.id,
  test_description: test.description || test.test_description,
  time_limit: test.duration_minutes || test.time_limit,
  questions: test.questions || []
}));
```

### 5. **Updated Interface**
```typescript
// NEW: Added application_id to CandidateResult interface
interface CandidateResult {
  id: string;
  candidate_id: string;
  candidate_name: string;
  score: number;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  submitted_at: string;
  avatar?: string;
  application_id?: string; // Added this field
}
```

## 🔧 **Hướng dẫn test**

### 1. **Test Questions hiển thị trong Test Management**
1. Truy cập `/hr/test-management`
2. Kiểm tra cột "Questions" có hiển thị số câu hỏi chính xác
3. Click "See Details" vào một test bất kỳ

### 2. **Test vào được chi tiết Test**
1. Trong trang Test Management, click "See Details" 
2. Trang `/hr/test-management/{testId}` should load
3. Kiểm tra:
   - Test name hiển thị đúng
   - Duration hiển thị đúng 
   - Questions count hiển thị đúng
   - Test description hiển thị (nếu có)

### 3. **Test vào được chi tiết kết quả Test**
1. Trong trang Test Details, tìm candidate có status "COMPLETED"
2. Click "View Answers" 
3. Trang `/hr/test-management/{testId}/results/{candidateId}` should load
4. Kiểm tra:
   - Candidate name hiển thị đúng
   - Score hiển thị đúng
   - Questions và answers hiển thị đầy đủ
   - Correct/Incorrect status hiển thị chính xác

## 🚀 **Backend requirements**

Để frontend hoạt động tốt, backend cần đảm bảo:

1. **API `/api/v1/tests/{id}`** trả về:
```json
{
  "test_id": "uuid",
  "test_name": "string", 
  "description": "string",
  "duration_minutes": number,
  "passing_score": number,
  "is_active": boolean,
  "questions": [...] // Array of questions
}
```

2. **API `/api/v1/tests/{id}/results`** trả về:
```json
{
  "data": [
    {
      "test_result_id": "uuid",
      "candidate_id": "uuid", 
      "candidate_name": "string",
      "percentage_score": number,
      "status": "COMPLETED|IN_PROGRESS|...",
      "completed_at": "datetime",
      "application_id": "uuid"
    }
  ]
}
```

3. **API `/api/v1/tests/{id}/result`** (với query params `candidate_id` và `application_id`) trả về:
```json
{
  "test_id": "uuid",
  "candidate_id": "uuid",
  "candidate_name": "string", 
  "score": number,
  "questions": [...], // Questions with options và correct answers
  "answers": {...} // Map của question_id -> user_answer
}
```

## 📝 **Files đã thay đổi**

1. ✅ `services/frontend-service/src/services/testApi.ts`
2. ✅ `services/frontend-service/src/components/hr/TestDetails.tsx`
3. ✅ `services/frontend-service/src/components/hr/TestResultDetails.tsx`
4. ✅ `services/frontend-service/src/components/hr/TestManagement.tsx`

## ⚠️ **Lưu ý**

- Tất cả các fix được thực hiện ở **frontend only**, không cần thay đổi backend/database
- Sử dụng fallback mapping để tương thích với cả data structure cũ và mới
- Nếu backend chưa trả về đầy đủ field, sẽ hiển thị default values
- Application_id được pass qua URL query params để đảm bảo API calls hoạt động đúng
