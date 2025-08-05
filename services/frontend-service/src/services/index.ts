// Central API exports
export { default as adminApi } from './adminApi';
export { default as hrApi } from './hrApi';
export { default as candidateApi } from './candidateApi';
export { default as apiClient } from './api';

// Additional API services
export { default as otpApi } from './otpApi';
export { default as companyApi } from './companyApi';
export { default as firebaseApi } from './firebaseApi';
export { default as firebaseService } from './firebase';
export { default as settingsApi } from './settingsApi';
export { default as messageApi } from './messageApi';
export { default as feedbackApi } from './feedbackApi';
export { default as scheduleApi } from './scheduleApi';
export { default as analyticsApi } from './analyticsApi';
export { default as emailApi } from './emailApi';
export { default as testApi } from './testApi';

// API Hooks
export * from './apiHooks';

// Auth API functions
import apiClient from './api';

export const authApi = {
  // Authentication
  register: async (userData: any) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh-token');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  validateToken: async () => {
    const response = await apiClient.get('/auth/validate-token');
    return response.data;
  }
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/mark-all-read');
    return response.data;
  },

  create: async (notificationData: any) => {
    const response = await apiClient.post('/notifications', notificationData);
    return response.data;
  }
};

// Generic API helpers
export const apiHelpers = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // File upload helper
  uploadFile: async (file: File, endpoint: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Generic search helper
  search: async (endpoint: string, params: any) => {
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  }
}; 