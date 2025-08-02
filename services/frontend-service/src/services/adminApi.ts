import apiClient from './api';

// Admin API Service
export const adminApi = {
  // User Management
  getAllUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, status: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  },

  // Statistics
  getSystemStatistics: async () => {
    const response = await apiClient.get('/admin/statistics');
    return response.data;
  },

  getUserStatistics: async () => {
    const response = await apiClient.get('/user/admin/statistics');
    return response.data;
  },

  // Job Management  
  getAllJobs: async () => {
    const response = await apiClient.get('/jobs');
    return response.data;
  },

  getPendingJobs: async () => {
    const response = await apiClient.get('/jobs/pending');
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
    const response = await apiClient.get('/admin/users/export');
    return response.data;
  },

  exportApplications: async () => {
    const response = await apiClient.get('/admin/export/applications');
    return response.data;
  },

  // Bulk Actions
  performBulkActions: async (actions: any) => {
    const response = await apiClient.post('/admin/users/bulk-action', actions);
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
  }
};

export default adminApi; 