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
    const response = await apiClient.post('/api/v1/jobs', jobData);
    return response.data;
  },

  updateJob: async (jobId: string, jobData: any) => {
    const response = await apiClient.put(`/api/v1/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId: string) => {
    const response = await apiClient.delete(`/api/v1/jobs/${jobId}`);
    return response.data;
  },

  // Added missing getAllJobs endpoint for HR with filtering support
  getAllJobs: async (params?: {
    search?: string;
    employment_type?: string;
    work_type?: string;
    status?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    direction?: string;
  }) => {
    const response = await apiClient.get('/api/v1/jobs', { params });
    return response.data;
  },

  getMyJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get('/api/v1/jobs/my-jobs', { params });
    return response.data;
  },

  getJobById: async (jobId: string, includeStats: boolean = false) => {
    const params = includeStats ? { include_stats: includeStats } : {};
    const response = await apiClient.get(`/api/v1/jobs/${jobId}`, { params });
    return response.data;
  },

  updateJobStatus: async (jobId: string, status: string) => {
    const response = await apiClient.patch(`/api/v1/jobs/${jobId}/status`, { status });
    return response.data;
  },

  // Added missing job search endpoint for HR
  searchJobs: async (searchParams: any) => {
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    const response = await apiClient.get('/api/v1/jobs', { params: cleanParams });
    return response.data;
  },

  // Added missing latest jobs endpoint for HR
  getLatestJobs: async (limit: number = 10) => {
    const response = await apiClient.get('/api/v1/jobs', { 
      params: { limit, orderBy: 'created_at', direction: 'DESC' } 
    });
    return response.data;
  },

  // Fixed endpoint path to match API spec
  getCompanyJobs: async (companyId: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`/api/v1/companies/${companyId}/jobs`, { params });
    return response.data;
  },

  // Application Management
  getJobApplications: async (jobId: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`/api/v1/jobs/${jobId}/applications`, { params });
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

  // Dashboard Stats - Calculate from HR's jobs
  getJobStats: async () => {
    try {
      const jobsResponse = await apiClient.get('/api/v1/jobs/my-jobs', { 
        params: { limit: 100 } 
      });
      const jobs = jobsResponse.data?.data || [];
      
      // Calculate basic stats from jobs
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter((job: any) => job.status === 'PUBLISHED').length;
      const totalViews = jobs.reduce((sum: number, job: any) => sum + (job.view_count || 0), 0);
      const totalApplications = jobs.reduce((sum: number, job: any) => sum + (job.applications_count || 0), 0);
      
      return {
        totalJobs,
        activeJobs,
        totalViews,
        totalApplications,
        avgApplicationsPerJob: totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0
      };
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        totalViews: 0,
        totalApplications: 0,
        avgApplicationsPerJob: 0
      };
    }
  },

  getApplicationStats: async () => {
    try {
      // Get applications from HR's jobs
      const jobsResponse = await apiClient.get('/api/v1/jobs/my-jobs', { 
        params: { limit: 100 } 
      });
      const jobs = jobsResponse.data?.data || [];
      
      // Get applications for each job and calculate stats
      let totalApplications = 0;
      let pendingReview = 0;
      let scheduledToday = 0;
      let messagesReceived = 0;
      
      for (const job of jobs) {
        try {
          const appResponse = await apiClient.get(`/api/v1/jobs/${job.job_id}/applications`, {
            params: { limit: 50 }
          });
          const applications = appResponse.data?.data || [];
          
          totalApplications += applications.length;
          pendingReview += applications.filter((app: any) => 
            app.status === 'PENDING' || app.status === 'APPLIED'
          ).length;
          
          // Count interviews scheduled for today
          const today = new Date().toISOString().split('T')[0];
          scheduledToday += applications.filter((app: any) => 
            app.interview_date && app.interview_date.startsWith(today)
          ).length;
        } catch (err) {
          console.error(`Error fetching applications for job ${job.job_id}:`, err);
        }
      }
      
      // Mock messages received for now
      messagesReceived = Math.floor(Math.random() * 10) + 1;
      
      return {
        totalApplications,
        pendingReview,
        scheduledToday,
        messagesReceived
      };
    } catch (error) {
      console.error('Error fetching application stats:', error);
      return {
        totalApplications: 0,
        pendingReview: 0,
        scheduledToday: 0,
        messagesReceived: 0
      };
    }
  },

  // ======================
  // TEST MANAGEMENT (HR/Recruiter)
  // ======================
  
  // Create new test for a job
  createTest: async (testData: any) => {
    const response = await apiClient.post('/api/v1/tests', testData);
    return response.data;
  },

  // Get test details (with answers for HR)
  getTest: async (testId: string, includeAnswers: boolean = true) => {
    const params = includeAnswers ? { include_answers: includeAnswers } : {};
    const response = await apiClient.get(`/api/v1/tests/${testId}`, { params });
    return response.data;
  },

  // Update test (only if HR created it)
  updateTest: async (testId: string, testData: any) => {
    const response = await apiClient.put(`/api/v1/tests/${testId}`, testData);
    return response.data;
  },

  // Delete test (only if HR created it)
  deleteTest: async (testId: string) => {
    const response = await apiClient.delete(`/api/v1/tests/${testId}`);
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
    const response = await apiClient.get('/api/v1/tests', { params });
    return response.data;
  },

  // Assign test to candidate
  assignTestToCandidate: async (testId: string, assignmentData: {
    candidate_id: string;
    application_id: string;
  }) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/assign`, assignmentData);
    return response.data;
  },

  // Get test results for HR's tests
  getTestResults: async (testId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  }) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/results`, { params });
    return response.data;
  },

  // Get test statistics
  getTestStatistics: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/stats`);
    return response.data;
  },

  // Get specific candidate result
  getCandidateTestResult: async (testId: string, candidateId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/results/${candidateId}`);
    return response.data;
  },

  // Get tests for a specific job
  getJobTests: async (jobId: string) => {
    const response = await apiClient.get(`/api/v1/jobs/${jobId}/tests`);
    return response.data;
  }
};

export default hrApi; 