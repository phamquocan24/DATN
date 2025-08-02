# Job API Integration Guide

Hướng dẫn này mô tả việc tích hợp và sử dụng các Job API endpoints trong ứng dụng CV2.

## 📋 Danh sách API Endpoints

### Quản lý Tin tuyển dụng (/api/v1/jobs)

| Method | Endpoint | Mô tả | Vai trò |
|--------|----------|--------|---------|
| GET | `/api/v1/jobs` | Lấy danh sách tin tuyển dụng | Admin, HR, Candidate |
| GET | `/api/v1/jobs/search` | Tìm kiếm tin tuyển dụng | Admin, HR, Candidate |
| GET | `/api/v1/jobs/latest` | Lấy các tin tuyển dụng mới nhất | Admin, HR, Candidate |
| GET | `/api/v1/jobs/stats` | Lấy thống kê tin tuyển dụng | Admin, HR, Candidate |
| GET | `/api/v1/jobs/my-jobs` | Lấy các tin tuyển dụng của tôi | HR |
| GET | `/api/v1/jobs/pending` | Lấy các tin tuyển dụng đang chờ duyệt | Admin |
| GET | `/api/v1/jobs/recommendations` | Lấy các tin tuyển dụng được đề xuất | Candidate |
| GET | `/api/v1/jobs/bookmarked` | Lấy các tin tuyển dụng đã lưu | Candidate |
| GET | `/api/v1/jobs/:id` | Lấy chi tiết tin tuyển dụng | Admin, HR, Candidate |
| POST | `/api/v1/jobs` | Tạo tin tuyển dụng mới | HR |
| PUT | `/api/v1/jobs/:id` | Cập nhật tin tuyển dụng | HR |
| PATCH | `/api/v1/jobs/:id/status` | Cập nhật trạng thái tin tuyển dụng | HR |
| DELETE | `/api/v1/jobs/:id` | Xóa tin tuyển dụng | HR |
| GET | `/api/v1/jobs/company/:companyId` | Lấy tin tuyển dụng theo công ty | Admin, HR, Candidate |
| POST | `/api/v1/jobs/:id/bookmark` | Lưu tin tuyển dụng | Candidate |
| DELETE | `/api/v1/jobs/:id/bookmark` | Bỏ lưu tin tuyển dụng | Candidate |
| POST | `/api/v1/jobs/:id/approve` | Phê duyệt tin tuyển dụng | Admin |
| POST | `/api/v1/jobs/:id/reject` | Từ chối tin tuyển dụng | Admin |

## 🏗️ Cấu trúc API Services

### 1. Admin API (`adminApi.ts`)
```javascript
import adminApi from '../services/adminApi';

// Lấy tất cả jobs
const jobs = await adminApi.getAllJobs();

// Tìm kiếm jobs
const searchResults = await adminApi.searchJobs({ keyword: 'developer' });

// Lấy jobs đang chờ duyệt
const pendingJobs = await adminApi.getPendingJobs();

// Phê duyệt job
await adminApi.approveJob(jobId);

// Từ chối job
await adminApi.rejectJob(jobId);
```

### 2. HR API (`hrApi.ts`)
```javascript
import hrApi from '../services/hrApi';

// Tạo job mới
const newJob = await hrApi.createJob({
  title: 'Frontend Developer',
  description: 'Job description',
  requirements: 'Requirements',
  location: 'Ho Chi Minh City',
  salary_min: 1000,
  salary_max: 2000,
  type: 'full-time'
});

// Lấy jobs của tôi
const myJobs = await hrApi.getMyJobs();

// Cập nhật job
await hrApi.updateJob(jobId, updatedData);

// Cập nhật trạng thái job
await hrApi.updateJobStatus(jobId, 'active');

// Xóa job
await hrApi.deleteJob(jobId);
```

### 3. Candidate API (`candidateApi.ts`)
```javascript
import candidateApi from '../services/candidateApi';

// Lấy tất cả jobs
const jobs = await candidateApi.getAllJobs();

// Tìm kiếm jobs
const searchResults = await candidateApi.searchJobs({ 
  keyword: 'react',
  location: 'Ho Chi Minh City'
});

// Lấy jobs được đề xuất
const recommendations = await candidateApi.getJobRecommendations();

// Lưu job vào bookmark
await candidateApi.addJobToFavorites(jobId);

// Lấy jobs đã bookmark
const favoriteJobs = await candidateApi.getFavoriteJobs();

// Bỏ bookmark
await candidateApi.removeJobFromFavorites(jobId);
```

## 🧪 Testing

### Chạy Integration Test

```javascript
// Import test class
import JobApiTester from './src/utils/jobApiTest.js';

// Tạo instance và chạy test
const tester = new JobApiTester();
await tester.runAllTests();
```

### Test trong Browser Console

```javascript
// Tải class vào window
new JobApiTester().runAllTests();
```

## 📝 Sử dụng trong Components

### Admin Components
```javascript
// services/frontend-service/src/components/admin/JobListings.tsx
import adminApi from '../../services/adminApi';

const fetchJobs = async () => {
  const jobsData = await adminApi.getAllJobs();
  setJobs(jobsData);
};

const handleApprove = async (jobId) => {
  await adminApi.approveJob(jobId);
  // Refresh jobs list
};
```

### HR Components
```javascript
// services/frontend-service/src/components/hr/PostNewJob.tsx
import hrApi from '../../services/hrApi';

const handleSubmit = async (jobData) => {
  await hrApi.createJob(jobData);
  // Redirect or show success
};
```

### Candidate Components
```javascript
// services/frontend-service/src/components/candidate/FindJobs.tsx
import candidateApi from '../../services/candidateApi';

const handleSearch = async (searchParams) => {
  const results = await candidateApi.searchJobs(searchParams);
  setSearchResults(results);
};

const handleBookmark = async (jobId) => {
  await candidateApi.addJobToFavorites(jobId);
  // Update UI
};
```

## 🔧 Error Handling

Tất cả API methods đều có error handling tích hợp:

```javascript
try {
  const jobs = await candidateApi.getAllJobs();
  // Handle success
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

### Authentication Errors
Các endpoint yêu cầu authentication sẽ tự động xử lý lỗi 401/403:

```javascript
// candidateApi automatically handles auth errors
const favorites = await candidateApi.getFavoriteJobs(); 
// Returns { data: [] } if not authenticated
```

## 🌐 API Client Configuration

Base API client được cấu hình trong `services/api.ts`:

```javascript
// Tự động thêm prefix /api/v1
// Tự động xử lý authentication headers
// Tự động refresh token khi cần
```

## 📊 Response Format

Tất cả API responses đều tuân theo format:

```javascript
{
  success: boolean,
  message: string,
  data: any,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

## 🚀 Best Practices

1. **Always handle errors**: Sử dụng try-catch cho tất cả API calls
2. **Check authentication**: Đảm bảo user đã đăng nhập cho protected endpoints
3. **Use loading states**: Show loading indicators khi gọi API
4. **Validate data**: Validate dữ liệu trước khi gửi API
5. **Cache wisely**: Implement caching cho data ít thay đổi

## 🔍 Debugging

Để debug API calls:

1. Check browser Network tab
2. Check console logs
3. Use the test script for endpoint validation
4. Verify authentication tokens

---

*Cập nhật lần cuối: [Date]* 