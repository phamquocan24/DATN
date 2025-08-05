import apiClient from './api';

// Admin API Service
export const adminApi = {
  // User Management
  getAllUsers: async (params?: {
    search?: string;
    role?: string;
    is_active?: boolean;
    created_after?: string;
    created_before?: string;
    page?: number;
    limit?: number;
    order_by?: string;
    direction?: string;
  }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined && value !== 'all'
      )
    );
    
    const response = await apiClient.get('/admin/users', { params: cleanParams });
    // Return both data and pagination info
    if (response.data && response.data.data) {
      return {
        data: response.data.data,
        pagination: response.data.pagination || null
      };
    }
    return {
      data: response.data,
      pagination: null
    };
  },

  getUserById: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, is_active: boolean, reason?: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { is_active, reason });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  deactivateUser: async (userId: string, reason: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, {
      is_active: false,
      reason: reason
    });
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  },

  // Statistics
  getSystemStatistics: async (params?: { start_date?: string; end_date?: string; period?: string }) => {
    const response = await apiClient.get('/admin/statistics', { params });
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getUserStatistics: async () => {
    const response = await apiClient.get('/users/admin/statistics');
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Job Management  
  getAllJobs: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },

  getPendingJobs: async () => {
    const response = await apiClient.get('/jobs/pending');
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Added missing job search endpoint for admin
  searchJobs: async (searchParams: any) => {
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    const response = await apiClient.get('/jobs/search', { params: cleanParams });
    return response.data;
  },

  // Added missing job stats endpoint for admin
  getJobStats: async () => {
    const response = await apiClient.get('/jobs/stats');
    return response.data;
  },

  // Added missing latest jobs endpoint for admin
  getLatestJobs: async () => {
    const response = await apiClient.get('/jobs/latest');
    return response.data;
  },

  approveJob: async (jobId: string) => {
    const response = await apiClient.post(`/jobs/${jobId}/approve`);
    return response.data;
  },

  rejectJob: async (jobId: string) => {
    const response = await apiClient.post(`/jobs/${jobId}/reject`);
    return response.data;
  },

  getJobById: async (jobId: string) => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Applications Management
  getAllApplications: async () => {
    const response = await apiClient.get('/applications');
    return response.data;
  },

  getApplicationStats: async () => {
    const response = await apiClient.get('/applications/stats');
    return response.data;
  },

  // Export Functions
  exportUsers: async () => {
    const response = await apiClient.get('/admin/export/users');
    return response.data;
  },

  exportApplications: async () => {
    const response = await apiClient.get('/admin/export/applications');
    return response.data;
  },

  // Bulk Actions
  performBulkActions: async (actions: any) => {
    const response = await apiClient.post('/admin/bulk-actions', actions);
    return response.data;
  },

  // Company Management
  getAllCompanies: async () => {
    const response = await apiClient.get('/companies');
    return response.data;
  },

  getCompanyById: async (companyId: string) => {
    const response = await apiClient.get(`/companies/${companyId}`);
    return response.data;
  },

  // Test Management
  getAllTests: async () => {
    const response = await apiClient.get('/api/v1/tests');
    return response.data;
  },

  getTestStats: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/stats`);
    return response.data;
  },

  // Questions Management (for admin test management)
  createQuestion: async (questionData: any) => {
    const response = await apiClient.post('/api/v1/tests/questions', questionData);
    return response.data;
  },

  updateQuestion: async (questionId: string, questionData: any) => {
    const response = await apiClient.put(`/api/v1/tests/questions/${questionId}`, questionData);
    return response.data;
  },

  deleteQuestion: async (questionId: string) => {
    const response = await apiClient.delete(`/api/v1/tests/questions/${questionId}`);
    return response.data;
  },

  // Feedback Management (placeholder - adjust based on actual backend endpoints)
  getAllFeedback: async () => {
    // This might need to be adjusted based on actual feedback endpoints
    const response = await apiClient.get('/feedback').catch(() => ({ data: [] }));
    return response.data;
  },

  getFeedbackStats: async () => {
    const response = await apiClient.get('/feedback/stats').catch(() => ({ data: {} }));
    return response.data;
  },

  // Activity Logs Management
  getLogs: async (params?: { 
    page?: number; 
    limit?: number; 
    level?: string; 
    start_date?: string; 
    end_date?: string 
  }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined && value !== 'all'
      )
    );
    
    const response = await apiClient.get('/admin/logs', { params: cleanParams });
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getLogById: async (logId: string) => {
    const response = await apiClient.get(`/admin/logs/${logId}`);
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  // ======================
  // TEST MANAGEMENT (Admin)
  // ======================

  // Get all tests in system (Admin override - use standard tests endpoint with admin token)
  getAllTestsAdmin: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    test_type?: string;
    is_active?: boolean;
    created_by?: string;
  }) => {
    const response = await apiClient.get('/api/v1/tests', { params });
    return response.data;
  },

  // Get test details (with full access for admin)
  getTestDetails: async (testId: string, includeAnswers: boolean = true) => {
    const params = includeAnswers ? { include_answers: includeAnswers } : {};
    const response = await apiClient.get(`/api/v1/tests/${testId}`, { params });
    return response.data;
  },

  // Update any test (admin override)
  updateTest: async (testId: string, testData: any) => {
    const response = await apiClient.put(`/api/v1/tests/${testId}`, testData);
    return response.data;
  },

  // Delete any test (admin override)
  deleteTest: async (testId: string) => {
    const response = await apiClient.delete(`/api/v1/tests/${testId}`);
    return response.data;
  },

  // Get test results for any test
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

  // Get system-wide test analytics (placeholder - may need backend implementation)
  getTestAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
    test_type?: string;
  }) => {
    // Note: This endpoint may not exist yet in backend
    const response = await apiClient.get('/api/v1/tests/analytics', { params }).catch(() => ({ data: [] }));
    return response.data;
  },

  // Get candidate test result details
  getCandidateTestResult: async (testId: string, candidateId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/results/${candidateId}`);
    return response.data;
  },

  // Bulk test operations (placeholder - may need backend implementation)
  bulkTestAction: async (action: 'activate' | 'deactivate' | 'delete', testIds: string[]) => {
    // Note: This endpoint may not exist yet in backend
    const response = await apiClient.post('/api/v1/tests/bulk-action', {
      action,
      test_ids: testIds
    }).catch(() => ({ data: { message: 'Bulk action not implemented yet' } }));
    return response.data;
  },

  // Override test assignment (placeholder - may need backend implementation)
  overrideTestAssignment: async (testId: string, candidateId: string, action: 'reset' | 'extend' | 'complete') => {
    // Note: This endpoint may not exist yet in backend
    const response = await apiClient.post(`/api/v1/tests/${testId}/override`, {
      candidate_id: candidateId,
      action
    }).catch(() => ({ data: { message: 'Override action not implemented yet' } }));
    return response.data;
  }
};

export default adminApi; 