import apiClient from './api';

// Settings API Service
export const settingsApi = {
  // User Settings
  getUserSettings: async () => {
    const response = await apiClient.get('/user/settings');
    return response.data;
  },

  updateUserSettings: async (settings: any) => {
    const response = await apiClient.put('/user/settings', settings);
    return response.data;
  },

  // Notification Settings
  getNotificationSettings: async () => {
    const response = await apiClient.get('/user/notification-settings');
    return response.data;
  },

  updateNotificationSettings: async (settings: any) => {
    const response = await apiClient.put('/user/notification-settings', settings);
    return response.data;
  },

  // Privacy Settings
  getPrivacySettings: async () => {
    const response = await apiClient.get('/user/privacy-settings');
    return response.data;
  },

  updatePrivacySettings: async (settings: any) => {
    const response = await apiClient.put('/user/privacy-settings', settings);
    return response.data;
  },

  // System Settings (Admin only)
  getSystemSettings: async () => {
    const response = await apiClient.get('/admin/system-settings');
    return response.data;
  },

  updateSystemSettings: async (settings: any) => {
    const response = await apiClient.put('/admin/system-settings', settings);
    return response.data;
  },

  // Email Templates (Admin only)
  getEmailTemplates: async () => {
    const response = await apiClient.get('/admin/email-templates');
    return response.data;
  },

  updateEmailTemplate: async (templateId: string, template: any) => {
    const response = await apiClient.put(`/admin/email-templates/${templateId}`, template);
    return response.data;
  },

  // Feature Flags
  getFeatureFlags: async () => {
    const response = await apiClient.get('/settings/feature-flags');
    return response.data;
  },

  // Theme Settings
  getUserTheme: async () => {
    const response = await apiClient.get('/user/theme');
    return response.data;
  },

  updateUserTheme: async (theme: 'light' | 'dark' | 'auto') => {
    const response = await apiClient.put('/user/theme', { theme });
    return response.data;
  },

  // Language Settings
  getUserLanguage: async () => {
    const response = await apiClient.get('/user/language');
    return response.data;
  },

  updateUserLanguage: async (language: string) => {
    const response = await apiClient.put('/user/language', { language });
    return response.data;
  }
};

export default settingsApi; 