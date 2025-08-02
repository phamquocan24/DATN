import apiClient from './api';

// Email API Service
export const emailApi = {
  // Send email
  sendEmail: async (emailData: {
    to: string | string[];
    subject: string;
    content: string;
    contentType?: 'text' | 'html';
    attachments?: File[];
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
  }) => {
    const formData = new FormData();
    
    // Add basic email data
    if (Array.isArray(emailData.to)) {
      emailData.to.forEach(email => formData.append('to[]', email));
    } else {
      formData.append('to', emailData.to);
    }
    
    formData.append('subject', emailData.subject);
    formData.append('content', emailData.content);
    
    if (emailData.contentType) formData.append('contentType', emailData.contentType);
    if (emailData.replyTo) formData.append('replyTo', emailData.replyTo);
    
    // Add CC and BCC
    if (emailData.cc) {
      emailData.cc.forEach(email => formData.append('cc[]', email));
    }
    if (emailData.bcc) {
      emailData.bcc.forEach(email => formData.append('bcc[]', email));
    }
    
    // Add attachments
    if (emailData.attachments) {
      emailData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await apiClient.post('/email/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Send templated email
  sendTemplatedEmail: async (templateData: {
    to: string | string[];
    templateId: string;
    variables?: Record<string, any>;
    cc?: string[];
    bcc?: string[];
  }) => {
    const response = await apiClient.post('/email/send-template', templateData);
    return response.data;
  },

  // Send bulk email
  sendBulkEmail: async (bulkData: {
    recipients: Array<{
      email: string;
      variables?: Record<string, any>;
    }>;
    templateId: string;
    subject?: string;
  }) => {
    const response = await apiClient.post('/email/send-bulk', bulkData);
    return response.data;
  },

  // Get email templates
  getTemplates: async () => {
    const response = await apiClient.get('/email/templates');
    return response.data;
  },

  // Get email template by ID
  getTemplate: async (templateId: string) => {
    const response = await apiClient.get(`/email/templates/${templateId}`);
    return response.data;
  },

  // Create email template (Admin)
  createTemplate: async (templateData: {
    name: string;
    subject: string;
    content: string;
    description?: string;
    variables?: string[];
  }) => {
    const response = await apiClient.post('/admin/email/templates', templateData);
    return response.data;
  },

  // Update email template (Admin)
  updateTemplate: async (templateId: string, templateData: any) => {
    const response = await apiClient.put(`/admin/email/templates/${templateId}`, templateData);
    return response.data;
  },

  // Delete email template (Admin)
  deleteTemplate: async (templateId: string) => {
    const response = await apiClient.delete(`/admin/email/templates/${templateId}`);
    return response.data;
  },

  // Get email history
  getEmailHistory: async (filters?: {
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/email/history', { params: filters });
    return response.data;
  },

  // Get email status
  getEmailStatus: async (emailId: string) => {
    const response = await apiClient.get(`/email/status/${emailId}`);
    return response.data;
  },

  // Email analytics
  getEmailAnalytics: async (period: string = 'month') => {
    const response = await apiClient.get('/admin/email/analytics', { params: { period } });
    return response.data;
  },

  // Subscribe to newsletter
  subscribe: async (email: string, preferences?: string[]) => {
    const response = await apiClient.post('/email/subscribe', { email, preferences });
    return response.data;
  },

  // Unsubscribe from newsletter
  unsubscribe: async (email: string, token?: string) => {
    const response = await apiClient.post('/email/unsubscribe', { email, token });
    return response.data;
  },

  // Update email preferences
  updatePreferences: async (email: string, preferences: string[]) => {
    const response = await apiClient.put('/email/preferences', { email, preferences });
    return response.data;
  }
};

export default emailApi; 