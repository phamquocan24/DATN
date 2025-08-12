# AI Test Generation Integration

## Tổng quan

Tích hợp tính năng tạo bài test bằng AI vào giao diện HR, cho phép HR Manager tạo câu hỏi tự động dựa trên Job Description.

## Các file đã thêm/chỉnh sửa

### 1. Service API mới
- **`services/aiTestApi.ts`**: Service API để giao tiếp với AI service tại port 8002
  - `generateInterviewQuestions()`: Tạo câu hỏi phỏng vấn cho job_id
  - `bulkGenerateQuestions()`: Tạo câu hỏi hàng loạt
  - `customizeQuestions()`: Tùy chỉnh câu hỏi
  - `updateQuestion()`: Cập nhật câu hỏi
  - `getQuestionTemplates()`: Lấy mẫu câu hỏi
  - `evaluateSingleAnswer()`: Đánh giá một câu trả lời
  - `evaluateTestResult()`: Đánh giá kết quả bài test
  - `getResultAnswers()`: Lấy câu trả lời của test
  - `healthCheck()`: Kiểm tra health AI service

### 2. UI Component đã cập nhật
- **`components/hr/CreateTestModal.tsx`**: Đã tích hợp AI generation
  - Thêm checkbox "Use AI to generate questions"
  - Nút "Generate AI Questions" với icon lightning
  - Ẩn form thêm câu hỏi thủ công khi chọn AI
  - Loading states cho AI generation
  - Parse AI response linh hoạt với nhiều format khác nhau

### 3. Service exports
- **`services/index.ts`**: Đã export aiTestApi

## Cách sử dụng

1. **Chọn Job**: Trước tiên phải chọn job từ dropdown
2. **Bật AI Mode**: Check vào "Use AI to generate questions"
3. **Generate**: Click "Generate AI Questions" để tạo câu hỏi tự động
4. **Review**: Xem lại các câu hỏi được tạo, có thể xóa hoặc chỉnh sửa
5. **Submit**: Tạo test như bình thường

## API Endpoints

AI Service (http://localhost:8002):
- `POST /api/v1/ai/generate-interview-questions` - Tạo câu hỏi cho job
- `POST /api/v1/ai/questions/bulk-generate` - Tạo hàng loạt
- `POST /api/v1/ai/customize-questions` - Tùy chỉnh câu hỏi
- `PUT /api/v1/ai/questions/{id}/customize` - Cập nhật câu hỏi
- `GET /api/v1/ai/question-templates` - Lấy mẫu
- `POST /api/v1/ai/evaluate-single-answer` - Đánh giá đơn
- `POST /api/v1/ai/evaluate-test-result` - Đánh giá toàn bộ
- `GET /api/v1/ai/test-result/{id}/answers` - Lấy câu trả lời
- `GET /health` - Health check

## Features

### ✅ Đã implement
- Tích hợp UI toggle AI/Manual
- Generate questions từ job_id
- Parse flexible AI response formats
- Loading states và error handling
- Maintain existing manual flow

### 🚀 Có thể mở rộng
- Bulk generate cho nhiều jobs
- Customize questions trước khi add
- Question templates selection
- AI evaluation integration
- Real-time question refinement

## Error Handling

- Kiểm tra job selection trước khi generate
- Handle các format response khác nhau từ AI
- Fallback cho parse errors
- User-friendly error messages
- Graceful degradation khi AI service down

## Performance

- Direct API calls đến AI service (không qua business-service)
- Async operations với proper loading states
- No impact to existing manual flow
- Caching có thể thêm sau

## Security

- Validation input job_id
- Sanitize AI response data
- No sensitive data logged
- Same authentication flow với existing APIs

## Testing

Để test tích hợp:
1. Đảm bảo AI service chạy tại port 8002
2. Tạo job trong HR interface
3. Chọn job và bật AI mode
4. Click generate và verify câu hỏi được tạo
5. Submit test và verify trong database
