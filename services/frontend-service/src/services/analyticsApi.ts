import apiClient from './api';

// Analytics API Service
export const analyticsApi = {
  // Dashboard Analytics
  getDashboardStats: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    const response = await apiClient.get(`/analytics/dashboard`, { params: { period } });
    return response.data;
  },

  // Job Analytics
  getJobAnalytics: async (jobId?: string, period: string = 'month') => {
    const params: any = { period };
    if (jobId) params.jobId = jobId;
    
    const response = await apiClient.get('/analytics/jobs', { params });
    return response.data;
  },

  // Application Analytics
  getApplicationAnalytics: async (period: string = 'month') => {
    const response = await apiClient.get('/analytics/applications', { params: { period } });
    return response.data;
  },

  // User Analytics (Admin)
  getUserAnalytics: async (period: string = 'month') => {
    const response = await apiClient.get('/analytics/users', { params: { period } });
    return response.data;
  },

  // Company Analytics (HR)
  getCompanyAnalytics: async (companyId?: string, period: string = 'month') => {
    const params: any = { period };
    if (companyId) params.companyId = companyId;
    
    const response = await apiClient.get('/analytics/companies', { params });
    return response.data;
  },

  // Test Analytics
  getTestAnalytics: async (testId?: string, period: string = 'month') => {
    const params: any = { period };
    if (testId) params.testId = testId;
    
    const response = await apiClient.get('/analytics/tests', { params });
    return response.data;
  },

  // Recruitment Funnel
  getRecruitmentFunnel: async (period: string = 'month', jobId?: string) => {
    const params: any = { period };
    if (jobId) params.jobId = jobId;
    
    const response = await apiClient.get('/analytics/recruitment-funnel', { params });
    return response.data;
  },

  // Performance Metrics
  getPerformanceMetrics: async (period: string = 'month') => {
    const response = await apiClient.get('/analytics/performance', { params: { period } });
    return response.data;
  },

  // Geographic Analytics
  getGeographicData: async (period: string = 'month') => {
    const response = await apiClient.get('/analytics/geographic', { params: { period } });
    return response.data;
  },

  // Top Performers
  getTopPerformers: async (type: 'jobs' | 'companies' | 'recruiters', period: string = 'month') => {
    const response = await apiClient.get(`/analytics/top-performers/${type}`, { params: { period } });
    return response.data;
  },

  // Trends
  getTrends: async (metric: string, period: string = 'month') => {
    const response = await apiClient.get('/analytics/trends', { params: { metric, period } });
    return response.data;
  },

  // Custom Reports
  generateReport: async (reportConfig: {
    type: string;
    period: string;
    filters?: any;
    format?: 'json' | 'csv' | 'pdf';
  }) => {
    const response = await apiClient.post('/analytics/reports', reportConfig);
    return response.data;
  },

  // Export Data
  exportData: async (dataType: string, format: 'csv' | 'excel' | 'pdf', filters?: any) => {
    const response = await apiClient.post('/analytics/export', {
      dataType,
      format,
      filters
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Real-time Analytics
  getRealTimeStats: async () => {
    const response = await apiClient.get('/analytics/realtime');
    return response.data;
  },

  // Conversion Rates
  getConversionRates: async (period: string = 'month') => {
    const response = await apiClient.get('/analytics/conversion-rates', { params: { period } });
    return response.data;
  },

  // Skills Analysis
  getSkillsAnalytics: async (period: string = 'month') => {
    const response = await apiClient.get('/analytics/skills', { params: { period } });
    return response.data;
  },

  // Salary Analytics
  getSalaryAnalytics: async (period: string = 'month', location?: string, jobTitle?: string) => {
    const params: any = { period };
    if (location) params.location = location;
    if (jobTitle) params.jobTitle = jobTitle;
    
    const response = await apiClient.get('/analytics/salary', { params });
    return response.data;
  },

  // Track Event (for custom analytics)
  trackEvent: async (eventName: string, properties?: any) => {
    const response = await apiClient.post('/analytics/track', {
      eventName,
      properties,
      timestamp: new Date().toISOString()
    });
    return response.data;
  }
};

export default analyticsApi; 