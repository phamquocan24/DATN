import apiClient from './api';

// HR API Service
export const hrApi = {
  // Company Management
  createCompany: async (companyData: any) => {
    const response = await apiClient.post('/companies', companyData);
    return response.data;
  },

  updateCompany: async (companyId: string, companyData: any) => {
    const response = await apiClient.put(`/companies/${companyId}`, companyData);
    return response.data;
  },

  getCompanyById: async (companyId: string) => {
    const response = await apiClient.get(`/companies/${companyId}`);
    return response.data;
  },

  getCompanyRecruiters: async (companyId: string) => {
    const response = await apiClient.get(`/companies/${companyId}/recruiters`);
    return response.data;
  },

  // Job Management
  createJob: async (jobData: any) => {
    const response = await apiClient.post('/jobs', jobData);
    return response.data;
  },

  updateJob: async (jobId: string, jobData: any) => {
    const response = await apiClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId: string) => {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Added missing getAllJobs endpoint for HR
  getAllJobs: async () => {
    const response = await apiClient.get('/jobs');
    return response.data;
  },

  getMyJobs: async () => {
    const response = await apiClient.get('/jobs/my-jobs');
    return response.data;
  },

  getJobById: async (jobId: string) => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  updateJobStatus: async (jobId: string, status: string) => {
    const response = await apiClient.patch(`/jobs/${jobId}/status`, { status });
    return response.data;
  },

  // Added missing job search endpoint for HR
  searchJobs: async (searchParams: any) => {
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    const response = await apiClient.get('/jobs/search', { params: cleanParams });
    return response.data;
  },

  // Added missing latest jobs endpoint for HR
  getLatestJobs: async () => {
    const response = await apiClient.get('/jobs/latest');
    return response.data;
  },

  // Fixed endpoint path to match API spec
  getCompanyJobs: async (companyId: string) => {
    const response = await apiClient.get(`/jobs/company/${companyId}`);
    return response.data;
  },

  // Application Management
  getJobApplications: async (jobId: string) => {
    const response = await apiClient.get(`/applications/job/${jobId}`);
    return response.data;
  },

  getApplicationById: async (applicationId: string) => {
    const response = await apiClient.get(`/applications/${applicationId}`);
    return response.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    const response = await apiClient.put(`/applications/${applicationId}/status`, { status });
    return response.data;
  },

  shortlistCandidate: async (applicationId: string) => {
    const response = await apiClient.post(`/applications/${applicationId}/shortlist`);
    return response.data;
  },

  rejectCandidate: async (applicationId: string, reason?: string) => {
    const response = await apiClient.post(`/applications/${applicationId}/reject`, { reason });
    return response.data;
  },

  scheduleInterview: async (applicationId: string, interviewData: any) => {
    const response = await apiClient.post(`/applications/${applicationId}/schedule-interview`, interviewData);
    return response.data;
  },

  bulkUpdateApplications: async (updates: any) => {
    const response = await apiClient.post('/applications/bulk-update', updates);
    return response.data;
  },

  // Test Management
  createTest: async (testData: any) => {
    const response = await apiClient.post('/tests', testData);
    return response.data;
  },

  updateTest: async (testId: string, testData: any) => {
    const response = await apiClient.put(`/tests/${testId}`, testData);
    return response.data;
  },

  deleteTest: async (testId: string) => {
    const response = await apiClient.delete(`/tests/${testId}`);
    return response.data;
  },

  getJobTests: async (jobId: string) => {
    const response = await apiClient.get(`/tests/job/${jobId}`);
    return response.data;
  },

  assignTestToCandidate: async (testId: string, candidateId: string) => {
    const response = await apiClient.post(`/tests/${testId}/assign`, { candidateId });
    return response.data;
  },

  getTestResults: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}/results`);
    return response.data;
  },

  getTestStats: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}/stats`);
    return response.data;
  },

  // CV Search
  searchCVs: async (searchParams: any) => {
    const response = await apiClient.get('/cvs/search', { params: searchParams });
    return response.data;
  },

  getCVById: async (cvId: string) => {
    const response = await apiClient.get(`/cvs/${cvId}`);
    return response.data;
  },

  parseCVContent: async (cvId: string) => {
    const response = await apiClient.get(`/cvs/parse/${cvId}`);
    return response.data;
  },

  downloadCV: async (cvId: string) => {
    const response = await apiClient.get(`/cvs/${cvId}/download`, { responseType: 'blob' });
    return response.data;
  },

  // Profile Management
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await apiClient.put('/user/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: any) => {
    const response = await apiClient.post('/user/change-password', passwordData);
    return response.data;
  },

  // Dashboard Stats
  getJobStats: async () => {
    const response = await apiClient.get('/jobs/stats');
    return response.data;
  },

  getApplicationStats: async () => {
    const response = await apiClient.get('/applications/stats');
    return response.data;
  },

  // ======================
  // TEST MANAGEMENT (HR/Recruiter)
  // ======================
  
  // Create new test for a job
  createTest: async (testData: any) => {
    const response = await apiClient.post('/tests', testData);
    return response.data;
  },

  // Get test details (with answers for HR)
  getTest: async (testId: string, includeAnswers: boolean = true) => {
    const params = includeAnswers ? { include_answers: includeAnswers } : {};
    const response = await apiClient.get(`/tests/${testId}`, { params });
    return response.data;
  },

  // Update test (only if HR created it)
  updateTest: async (testId: string, testData: any) => {
    const response = await apiClient.put(`/tests/${testId}`, testData);
    return response.data;
  },

  // Delete test (only if HR created it)
  deleteTest: async (testId: string) => {
    const response = await apiClient.delete(`/tests/${testId}`);
    return response.data;
  },

  // Get all tests created by HR
  getMyTests: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    test_type?: string;
    is_active?: boolean;
  }) => {
    const response = await apiClient.get('/tests', { params });
    return response.data;
  },

  // Assign test to candidate
  assignTestToCandidate: async (testId: string, assignmentData: {
    candidate_id: string;
    application_id: string;
  }) => {
    const response = await apiClient.post(`/tests/${testId}/assign`, assignmentData);
    return response.data;
  },

  // Get test results for HR's tests
  getTestResults: async (testId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  }) => {
    const response = await apiClient.get(`/tests/${testId}/results`, { params });
    return response.data;
  },

  // Get test statistics
  getTestStatistics: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}/stats`);
    return response.data;
  },

  // Get specific candidate result
  getCandidateTestResult: async (testId: string, candidateId: string) => {
    const response = await apiClient.get(`/tests/${testId}/results/${candidateId}`);
    return response.data;
  },

  // Get tests for a specific job
  getJobTests: async (jobId: string) => {
    const response = await apiClient.get(`/jobs/${jobId}/tests`);
    return response.data;
  }
};

export default hrApi; 