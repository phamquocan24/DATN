import apiClient from './api';

// Candidate API Service
export const candidateApi = {
  // Job Search & Browse
  getAllJobs: async () => {
    const response = await apiClient.get('/jobs');
    return response.data;
  },

  getJobById: async (jobId: string) => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  searchJobs: async (searchParams: any) => {
    // Clean empty parameters to avoid validation errors
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    
    const response = await apiClient.get('/jobs/search', { params: cleanParams });
    return response.data;
  },

  getJobRecommendations: async () => {
    try {
      const response = await apiClient.get('/jobs/recommendations');
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

  getLatestJobs: async () => {
    const response = await apiClient.get('/jobs/latest');
    return response.data;
  },

  getFeaturedJobs: async () => {
    // Use regular jobs endpoint since /jobs/featured doesn't exist
    const response = await apiClient.get('/jobs');
    return response.data;
  },

  // Saved/Bookmarked Jobs Management - using existing saved_jobs table with auth handling
  getFavoriteJobs: async () => {
    try {
      const response = await apiClient.get('/jobs/bookmarked');
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
      const response = await apiClient.post(`/jobs/${jobId}/bookmark`);
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
      const response = await apiClient.delete(`/jobs/${jobId}/bookmark`);
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
    const response = await apiClient.get('/jobs/stats');
    return response.data;
  },

  // Application Management
  createApplication: async (applicationData: any) => {
    const response = await apiClient.post('/applications', applicationData);
    return response.data;
  },

  getMyApplications: async () => {
    try {
      const response = await apiClient.get('/applications/my-applications');
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

  withdrawApplication: async (applicationId: string) => {
    const response = await apiClient.post(`/applications/${applicationId}/withdraw`);
    return response.data;
  },

  getApplicationById: async (applicationId: string) => {
    const response = await apiClient.get(`/applications/${applicationId}`);
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

  getCompanyJobs: async (companyId: string) => {
    const response = await apiClient.get(`/jobs/company/${companyId}`);
    return response.data;
  },

  // Profile Management
  getProfile: async () => {
    try {
      const response = await apiClient.get('/user/profile');
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
    const response = await apiClient.put('/user/profile', profileData);
    return response.data;
  },

  getProfileSuggestions: async () => {
    const response = await apiClient.get('/user/profile/suggestions');
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
    const response = await apiClient.post('/user/change-password', passwordData);
    return response.data;
  },

  deactivateAccount: async () => {
    const response = await apiClient.delete('/user/account');
    return response.data;
  },

  // ======================
  // TEST MANAGEMENT (Candidate)
  // ======================

  // Get assigned tests for current candidate
  getMyTests: async (params?: {
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/tests/my-tests', { params });
    return response.data;
  },

  // Get test details (without answers for candidates)
  getAssignedTest: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}`, { 
      params: { include_answers: false }
    });
    return response.data;
  },

  // Start a test
  startTest: async (testId: string) => {
    const response = await apiClient.post(`/tests/${testId}/start`);
    return response.data;
  },

  // Submit test answers
  submitTest: async (testId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/tests/${testId}/submit`, { answers });
    return response.data;
  },

  // Get test result (after completion)
  getMyTestResult: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}/my-result`);
    return response.data;
  },

  // Get test time remaining (during test)
  getTestTimeRemaining: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}/time-remaining`);
    return response.data;
  },

  // Save test progress (auto-save during test)
  saveTestProgress: async (testId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/tests/${testId}/save-progress`, { answers });
    return response.data;
  }
};

// Export as default to match the import statements in components
export default candidateApi;