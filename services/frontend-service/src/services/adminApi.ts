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
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data; // Return the actual users array
    }
    return response.data;
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
  getSystemStatistics: async () => {
    const response = await apiClient.get('/admin/statistics');
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getUserStatistics: async () => {
    const response = await apiClient.get('/admin/user-statistics');
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Job Management  
  getAllJobs: async () => {
    const response = await apiClient.get('/jobs');
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data;
    }
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
    const response = await apiClient.get('/tests');
    return response.data;
  },

  getTestStats: async (testId: string) => {
    const response = await apiClient.get(`/tests/${testId}/stats`);
    return response.data;
  },

  // Questions Management (for admin test management)
  createQuestion: async (questionData: any) => {
    const response = await apiClient.post('/tests/questions', questionData);
    return response.data;
  },

  updateQuestion: async (questionId: string, questionData: any) => {
    const response = await apiClient.put(`/tests/questions/${questionId}`, questionData);
    return response.data;
  },

  deleteQuestion: async (questionId: string) => {
    const response = await apiClient.delete(`/tests/questions/${questionId}`);
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
  }
};

export default adminApi; 