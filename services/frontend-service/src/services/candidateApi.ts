import apiClient from './api';

// Candidate API Service
export const candidateApi = {
  // Job Search & Browse
  getAllJobs: async () => {
    const response = await apiClient.get('/api/v1/jobs');
    return response.data;
  },

  getJobById: async (jobId: string, includeStats?: boolean) => {
    const params = includeStats ? { include_stats: includeStats } : {};
    const response = await apiClient.get(`/api/v1/jobs/${jobId}`, { params });
    return response.data;
  },

  searchJobs: async (searchParams: any) => {
    // Clean empty parameters to avoid validation errors
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    
    const response = await apiClient.get('/api/v1/jobs/search', { params: cleanParams });
    return response.data;
  },

  getJobRecommendations: async (params?: { page?: number; limit?: number }) => {
    try {
      const response = await apiClient.get('/api/v1/jobs/recommendations', { params });
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty recommendations
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for recommendations, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  getLatestJobs: async (params?: { limit?: number }) => {
    const response = await apiClient.get('/api/v1/jobs/latest', { params });
    return response.data;
  },

  getFeaturedJobs: async () => {
    // Use regular jobs endpoint since /api/v1/jobs/featured doesn't exist
    const response = await apiClient.get('/api/v1/jobs');
    return response.data;
  },

  // Saved/Bookmarked Jobs Management - using existing saved_jobs table with auth handling
  getFavoriteJobs: async () => {
    try {
      const response = await apiClient.get('/api/v1/jobs/bookmarked');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get bookmarked jobs:', error);
      
      // If user is not authenticated, return empty bookmarks
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for bookmarks, returning empty array');
        return { data: [] };
      }
      
      // For other errors, still return empty array to prevent UI breaks
      return { data: [] };
    }
  },

  addJobToFavorites: async (jobId: string) => {
    try {
      const response = await apiClient.post(`/api/v1/jobs/${jobId}/bookmark`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to bookmark job:', error);
      
      // If user is not authenticated, show appropriate message
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          message: 'Bạn cần đăng nhập để lưu công việc này',
          requiresAuth: true 
        };
      }
      
      throw error;
    }
  },

  removeJobFromFavorites: async (jobId: string) => {
    try {
      const response = await apiClient.delete(`/api/v1/jobs/${jobId}/bookmark`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to remove bookmark:', error);
      
      // If user is not authenticated, show appropriate message
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          message: 'Bạn cần đăng nhập để thực hiện thao tác này',
          requiresAuth: true 
        };
      }
      
      throw error;
    }
  },

  getJobStats: async () => {
    const response = await apiClient.get('/api/v1/jobs/stats');
    return response.data;
  },

  // Application Management - Business Service API
  createApplication: async (applicationData: {
    job_id: string;
    cv_id?: string;
    cover_letter?: string;
    source?: 'DIRECT' | 'SOCIAL_MEDIA' | 'REFERRAL' | 'HEADHUNTER' | 'CAREER_FAIR';
  }) => {
    const response = await apiClient.post('/api/v1/applications', applicationData);
    return response.data;
  },

  getMyApplications: async (params?: {
    status?: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEWING' | 'TESTING' | 'OFFERED' | 'HIRED' | 'REJECTED';
    page?: number;
    limit?: number;
    orderBy?: 'created_at' | 'updated_at';
    direction?: 'ASC' | 'DESC';
  }) => {
    try {
      const response = await apiClient.get('/api/v1/applications/my-applications', { params });
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty applications
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for applications, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  withdrawApplication: async (applicationId: string, reason?: string) => {
    const response = await apiClient.put(`/api/v1/applications/${applicationId}/withdraw`, { reason });
    return response.data;
  },

  getApplicationById: async (applicationId: string, includeDetails?: boolean) => {
    const params = includeDetails ? { include_details: includeDetails } : {};
    const response = await apiClient.get(`/api/v1/applications/${applicationId}`, { params });
    return response.data;
  },

  // Company Information with error handling
  getAllCompanies: async () => {
    try {
      const response = await apiClient.get('/companies');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get companies:', error);
      
      // Return empty array on error to prevent UI breaks
      return { data: [] };
    }
  },

  getCompanyById: async (companyId: string) => {
    const response = await apiClient.get(`/companies/${companyId}`);
    return response.data;
  },

  getCompanyJobs: async (companyId: string, params?: {
    search?: string;
    employment_type?: string;
    work_type?: string;
    salary_min?: number;
    salary_max?: number;
    experience_required?: number;
    page?: number;
    limit?: number;
    orderBy?: string;
    direction?: string;
  }) => {
    const response = await apiClient.get(`/api/v1/jobs/company/${companyId}`, { params });
    return response.data;
  },

  // Profile Management
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty profile
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for profile, returning empty profile');
        // Clear invalid token from storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { data: null };
      }
      throw error;
    }
  },

  updateProfile: async (profileData: any) => {
    const response = await apiClient.put('/api/v1/users/profile', profileData);
    return response.data;
  },

  getProfileSuggestions: async () => {
    const response = await apiClient.get('/users/profile/suggestions');
    return response.data;
  },

  addSkill: async (skillData: { skill_name: string; proficiency_level: string }) => {
    const response = await apiClient.post('/user/skills', skillData);
    return response.data;
  },

  deleteSkill: async (skillId: string) => {
    const response = await apiClient.delete(`/user/skills/${skillId}`);
    return response.data;
  },

  // CV Management
  getMyCVs: async () => {
    try {
      const response = await apiClient.get('/cvs/my-cvs');
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty CVs
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for CVs, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  uploadCV: async (formData: FormData) => {
    const response = await apiClient.post('/cvs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteCV: async (cvId: string) => {
    const response = await apiClient.delete(`/cvs/${cvId}`);
    return response.data;
  },

  // Test Management
  getMyTests: async () => {
    try {
      const response = await apiClient.get('/tests/my-tests');
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty tests
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for tests, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  startTest: async (testId: string) => {
    const response = await apiClient.post(`/tests/${testId}/start`);
    return response.data;
  },

  submitTest: async (testId: string, answers: any) => {
    const response = await apiClient.post(`/tests/${testId}/submit`, { answers });
    return response.data;
  },

  getTestResult: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}/result`);
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty notifications
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for notifications, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Settings
  changePassword: async (passwordData: any) => {
    const response = await apiClient.post('/users/change-password', passwordData);
    return response.data;
  },

  deactivateAccount: async (reason?: string) => {
    const response = await apiClient.put('/users/deactivate', { reason });
    return response.data;
  },

  // ======================
  // TEST MANAGEMENT (Candidate)
  // ======================

  // Get assigned tests for current candidate
  getMyAssignedTests: async (params?: {
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/api/v1/tests/my-tests', { params });
    return response.data;
  },

  // Get test details (without answers for candidates)
  getAssignedTest: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}`, { 
      params: { include_answers: false }
    });
    return response.data;
  },

  // Start a test
  startAssignedTest: async (testId: string) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/start`);
    return response.data;
  },

  // Submit test answers
  submitAssignedTest: async (testId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/submit`, { answers });
    return response.data;
  },

  // Get test result (after completion)
  getMyTestResult: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/my-result`);
    return response.data;
  },

  // Get test time remaining (during test)
  getTestTimeRemaining: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/time-remaining`);
    return response.data;
  },

  // Save test progress (auto-save during test)
  saveTestProgress: async (testId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/save-progress`, { answers });
    return response.data;
  },

  // ======================
  // MATCH SCORE CALCULATION - REMOVED
  // ======================
  // Note: Match score calculation has been moved to matchingApi.ts to call AI service directly
  // This reduces dependency on business service for CV-JD matching

  // Get available jobs for match calculation
  getAvailableJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE';
  }) => {
    try {
      const response = await apiClient.get('/api/v1/jobs', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get available jobs:', error);
      throw error;
    }
  },

  // Create candidate profile if not exists
  ensureCandidateProfile: async () => {
    try {
      const response = await apiClient.post('/api/v1/users/ensure-candidate-profile');
      return response.data;
    } catch (error: any) {
      console.error('Failed to ensure candidate profile:', error);
      throw error;
    }
  }
};

// Export as default to match the import statements in components
export default candidateApi;

