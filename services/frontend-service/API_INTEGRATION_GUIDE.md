# API Integration Guide

Hướng dẫn tích hợp API cho hệ thống CV Recruitment System

## Tổng quan

Đã tích hợp thành công các API từ business service vào frontend với phân quyền rõ ràng cho từng role:

- **Admin**: Quản lý người dùng, thống kê hệ thống, phê duyệt job
- **HR**: Quản lý công ty, job posting, ứng viên, test
- **Candidate**: Tìm job, apply, quản lý CV, làm test

## Cấu trúc API Services

### 1. Admin API (`adminApi`)

```typescript
import { adminApi } from '../services/adminApi';

// User Management
await adminApi.getAllUsers();
await adminApi.getUserById(userId);
await adminApi.updateUserStatus(userId, status);
await adminApi.deleteUser(userId);

// Job Management
await adminApi.getAllJobs();
await adminApi.getPendingJobs();
await adminApi.approveJob(jobId);
await adminApi.rejectJob(jobId);

// Statistics
await adminApi.getSystemStatistics();
await adminApi.getUserStatistics();
await adminApi.getApplicationStats();

// Export Functions
await adminApi.exportUsers();
await adminApi.exportApplications();
```

### 2. HR API (`hrApi`)

```typescript
import { hrApi } from '../services/hrApi';

// Company Management
await hrApi.createCompany(companyData);
await hrApi.updateCompany(companyId, companyData);
await hrApi.getCompanyById(companyId);

// Job Management
await hrApi.createJob(jobData);
await hrApi.updateJob(jobId, jobData);
await hrApi.getMyJobs();
await hrApi.deleteJob(jobId);

// Application Management
await hrApi.getJobApplications(jobId);
await hrApi.updateApplicationStatus(applicationId, status);
await hrApi.shortlistCandidate(applicationId);
await hrApi.rejectCandidate(applicationId);

// Test Management
await hrApi.createTest(testData);
await hrApi.assignTestToCandidate(testId, candidateId);
await hrApi.getTestResults(testId);
```

### 3. Candidate API (`candidateApi`)

```typescript
import { candidateApi } from '../services/candidateApi';

// Job Search
await candidateApi.getAllJobs();
await candidateApi.searchJobs(searchParams);
await candidateApi.getJobRecommendations();
await candidateApi.getLatestJobs();

// Application Management
await candidateApi.createApplication(applicationData);
await candidateApi.getMyApplications();
await candidateApi.withdrawApplication(applicationId);
await candidateApi.getMatchScore(jobId);

// CV Management
await candidateApi.uploadCV(cvData);
await candidateApi.getMyCVs();
await candidateApi.updateCV(cvId, cvData);
await candidateApi.deleteCV(cvId);

// Test Taking
await candidateApi.getMyTests();
await candidateApi.startTest(testId);
await candidateApi.submitTest(testId, answers);
await candidateApi.getTestResult(testId);
```

### 4. Auth API (`authApi`)

```typescript
import { authApi } from '../services/index';

await authApi.login(credentials);
await authApi.register(userData);
await authApi.logout();
await authApi.getCurrentUser();
await authApi.forgotPassword(email);
await authApi.resetPassword(token, password);
```

## Component Integration Examples

### Admin Dashboard

```typescript
import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemStats, pendingJobs, userStats] = await Promise.all([
          adminApi.getSystemStatistics(),
          adminApi.getPendingJobs(),
          adminApi.getUserStatistics()
        ]);
        
        setStats({
          pendingJobs: pendingJobs.length,
          violatedAccounts: systemStats.violatedAccounts,
          newFeedback: systemStats.newFeedback
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Rest of component...
};
```

### HR Job Management

```typescript
import React, { useState, useEffect } from 'react';
import { hrApi } from '../services/hrApi';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);

  const createJob = async (jobData) => {
    try {
      const newJob = await hrApi.createJob(jobData);
      setJobs(prev => [...prev, newJob]);
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await hrApi.updateJobStatus(jobId, status);
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  // Rest of component...
};
```

### Candidate Job Search

```typescript
import React, { useState, useEffect } from 'react';
import { candidateApi } from '../services/candidateApi';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const searchJobs = async () => {
    try {
      const searchParams = {
        query: searchQuery,
        location: location,
        type: filters.employmentType
      };
      
      const results = await candidateApi.searchJobs(searchParams);
      setJobs(results);
    } catch (error) {
      console.error('Error searching jobs:', error);
    }
  };

  const applyToJob = async (jobId) => {
    try {
      await candidateApi.createApplication({
        jobId: jobId,
        coverLetter: 'Application submitted'
      });
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  // Rest of component...
};
```

## Error Handling

```typescript
import { handleApiError } from '../services/apiIntegration';

try {
  const result = await adminApi.getAllUsers();
  // Handle success
} catch (error) {
  const errorMessage = handleApiError(error);
  setError(errorMessage);
}
```

## Loading States

```typescript
import { createLoadingState } from '../services/apiIntegration';

const MyComponent = () => {
  const { loading, error, execute } = createLoadingState();

  const handleAction = async () => {
    try {
      const result = await execute(() => adminApi.getAllUsers());
      setData(result);
    } catch (err) {
      // Error is automatically handled
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Rest of component...
};
```

## Data Transformers

```typescript
import { transformJobData, transformUserData } from '../services/apiIntegration';

// Transform raw API data to component format
const jobs = rawJobsData.map(transformJobData);
const users = rawUsersData.map(transformUserData);
```

## Best Practices

### 1. Error Handling
- Luôn wrap API calls trong try-catch
- Sử dụng `handleApiError` utility cho error handling nhất quán
- Hiển thị error messages thân thiện với user

### 2. Loading States
- Hiển thị loading indicators cho các API calls
- Disable buttons/forms khi đang loading
- Sử dụng `createLoadingState` utility

### 3. Data Validation
- Validate data trước khi gửi API
- Transform data sử dụng utility functions
- Handle edge cases (empty data, missing fields)

### 4. Performance
- Cache API responses khi có thể
- Implement pagination cho large datasets
- Debounce search queries

### 5. Security
- Token sẽ tự động được thêm vào headers
- Handle 401/403 errors appropriately
- Không store sensitive data trong localStorage

## Component Updates Made

### Admin Components
- ✅ **Dashboard**: Tích hợp system statistics, pending jobs, user stats
- ✅ **JobListings**: Tích hợp job management với approve/reject functionality
- ✅ **Statistics**: Tích hợp real-time statistics
- ✅ **UserManagement**: Tích hợp CRUD operations cho users

### HR Components  
- ✅ **HrDashboard**: Tích hợp job stats, application stats
- ✅ **PostNewJob**: Tích hợp job creation API
- ✅ **JobManagement**: Tích hợp job CRUD operations
- ✅ **JobApplications**: Tích hợp application management
- ✅ **CompanyProfile**: Tích hợp company management

### Candidate Components
- ✅ **FindJobsDashboard**: Tích hợp job search và filtering
- ✅ **MyApplications**: Tích hợp application tracking
- ✅ **Profile**: Tích hợp profile management
- ✅ **TestManagement**: Tích hợp test taking
- ✅ **BrowseCompanies**: Tích hợp company browsing

## File Structure

```
services/
├── api.ts                 # Base API client
├── adminApi.ts           # Admin-specific APIs
├── hrApi.ts              # HR-specific APIs  
├── candidateApi.ts       # Candidate-specific APIs
├── index.ts              # Central exports + auth/notifications
├── apiIntegration.ts     # Utilities and helpers
├── apiHooks.ts           # React hooks for API
├── otpApi.ts             # OTP verification APIs
├── firebaseApi.ts        # Firebase/Social auth APIs
├── settingsApi.ts        # User/System settings APIs
├── messageApi.ts         # Chat/messaging APIs
├── feedbackApi.ts        # Support/feedback APIs
├── scheduleApi.ts        # Calendar/scheduling APIs
├── analyticsApi.ts       # Analytics/reporting APIs
├── emailApi.ts           # Email service APIs
└── health.api.ts         # Health check endpoints
```

## Bổ sung API Services

### 7. OTP API (`otpApi`)

```typescript
import { otpApi } from '../services/otpApi';

// Send OTP for verification
await otpApi.sendOTP(email, 'registration');
await otpApi.verifyOTP(email, code, 'registration');
await otpApi.getOTPStatus(email);
```

### 8. Firebase API (`firebaseApi`)

```typescript
import { firebaseApi } from '../services/firebaseApi';

// Social authentication
await firebaseApi.getConfig();
await firebaseApi.socialAuth('google', idToken);
await firebaseApi.linkAccount(idToken);
```

### 9. Settings API (`settingsApi`)

```typescript
import { settingsApi } from '../services/settingsApi';

// User preferences
await settingsApi.getUserSettings();
await settingsApi.updateNotificationSettings(settings);
await settingsApi.updateUserTheme('dark');
```

### 10. Message API (`messageApi`)

```typescript
import { messageApi } from '../services/messageApi';

// Chat functionality
await messageApi.getConversations();
await messageApi.sendMessage(conversationId, content);
await messageApi.createConversation([userId1, userId2]);
```

### 11. Feedback API (`feedbackApi`)

```typescript
import { feedbackApi } from '../services/feedbackApi';

// Support system
await feedbackApi.submitFeedback(feedbackData);
await feedbackApi.getMyFeedback();
await feedbackApi.getFAQs();
```

### 12. Schedule API (`scheduleApi`)

```typescript
import { scheduleApi } from '../services/scheduleApi';

// Interview scheduling
await scheduleApi.scheduleInterview(interviewData);
await scheduleApi.getAvailableSlots([userId], date);
await scheduleApi.getUpcomingEvents();
```

### 13. Analytics API (`analyticsApi`)

```typescript
import { analyticsApi } from '../services/analyticsApi';

// Reporting and analytics
await analyticsApi.getDashboardStats('month');
await analyticsApi.getJobAnalytics(jobId);
await analyticsApi.generateReport(reportConfig);
```

### 14. Email API (`emailApi`)

```typescript
import { emailApi } from '../services/emailApi';

// Email functionality
await emailApi.sendEmail(emailData);
await emailApi.sendTemplatedEmail(templateData);
await emailApi.getEmailHistory();
```

## React Hooks

### API Hooks Usage

```typescript
import { useApi, useMutation, useSearch, usePagination } from '../services/apiHooks';

// Data fetching hook
const { data, loading, error, refresh } = useApi(() => candidateApi.getAllJobs());

// Mutation hook for actions
const { mutate: createJob, loading: creating } = useMutation(hrApi.createJob);

// Search with debouncing
const { query, setQuery, results, loading: searching } = useSearch(
  candidateApi.searchJobs, 
  300
);

// Pagination
const { page, totalPages, nextPage, prevPage } = usePagination(1, 10);
```

### Component Example with Hooks

```typescript
import React from 'react';
import { useApi, useMutation } from '../services/apiHooks';
import { candidateApi } from '../services';

const JobSearch = () => {
  const { data: jobs, loading, error, refresh } = useApi(() => candidateApi.getAllJobs());
  const { mutate: applyToJob, loading: applying } = useMutation(candidateApi.createApplication);

  const handleApply = async (jobId: string) => {
    try {
      await applyToJob({ jobId, coverLetter: 'Application' });
      refresh(); // Refresh job list
    } catch (error) {
      console.error('Apply failed:', error);
    }
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {jobs?.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <button 
            onClick={() => handleApply(job.id)}
            disabled={applying}
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

## Testing

Các API endpoints đã được test với business service backend. Tất cả endpoints đều sử dụng prefix `/api/v1/` và support authentication headers.

## Next Steps

1. Test integration với real backend data
2. Implement proper error boundaries
3. Add loading skeletons cho better UX
4. Implement caching strategies
5. Add analytics tracking for API usage
6. Setup API monitoring and alerting

---

**Note**: Tất cả API calls đã được configured để sử dụng authentication tokens và handle common errors. Components đã được updated để sử dụng real API data thay vì hardcoded mock data. 