import apiClient from './api';

// Feedback API Service
export const feedbackApi = {
  // Submit feedback/support ticket
  submitFeedback: async (feedbackData: {
    type: 'feedback' | 'bug' | 'feature_request' | 'support';
    subject: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    attachments?: File[];
  }) => {
    const formData = new FormData();
    
    Object.keys(feedbackData).forEach(key => {
      if (key === 'attachments' && feedbackData.attachments) {
        feedbackData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      } else if (feedbackData[key as keyof typeof feedbackData]) {
        formData.append(key, feedbackData[key as keyof typeof feedbackData] as string);
      }
    });

    const response = await apiClient.post('/feedback', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user's feedback/tickets
  getMyFeedback: async (status?: string, type?: string) => {
    const params: any = {};
    if (status) params.status = status;
    if (type) params.type = type;
    
    const response = await apiClient.get('/feedback/my-feedback', { params });
    return response.data;
  },

  // Get feedback by ID
  getFeedbackById: async (feedbackId: string) => {
    const response = await apiClient.get(`/feedback/${feedbackId}`);
    return response.data;
  },

  // Update feedback (for users to add more info)
  updateFeedback: async (feedbackId: string, updates: any) => {
    const response = await apiClient.put(`/feedback/${feedbackId}`, updates);
    return response.data;
  },

  // Close feedback ticket
  closeFeedback: async (feedbackId: string) => {
    const response = await apiClient.put(`/feedback/${feedbackId}/close`);
    return response.data;
  },

  // Admin: Get all feedback
  getAllFeedback: async (filters?: {
    status?: string;
    type?: string;
    priority?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/admin/feedback', { params: filters });
    return response.data;
  },

  // Admin: Assign feedback to staff
  assignFeedback: async (feedbackId: string, assignedTo: string) => {
    const response = await apiClient.put(`/admin/feedback/${feedbackId}/assign`, { assignedTo });
    return response.data;
  },

  // Admin: Update feedback status
  updateFeedbackStatus: async (feedbackId: string, status: string, note?: string) => {
    const response = await apiClient.put(`/admin/feedback/${feedbackId}/status`, { status, note });
    return response.data;
  },

  // Admin: Add response to feedback
  addResponse: async (feedbackId: string, response: string, isPublic = true) => {
    const responseData = await apiClient.post(`/admin/feedback/${feedbackId}/responses`, {
      response,
      isPublic
    });
    return responseData.data;
  },

  // FAQ Management
  getFAQs: async (category?: string) => {
    const params = category ? { category } : {};
    const response = await apiClient.get('/feedback/faqs', { params });
    return response.data;
  },

  // Admin: Manage FAQs
  createFAQ: async (faqData: any) => {
    const response = await apiClient.post('/admin/feedback/faqs', faqData);
    return response.data;
  },

  updateFAQ: async (faqId: string, faqData: any) => {
    const response = await apiClient.put(`/admin/feedback/faqs/${faqId}`, faqData);
    return response.data;
  },

  deleteFAQ: async (faqId: string) => {
    const response = await apiClient.delete(`/admin/feedback/faqs/${faqId}`);
    return response.data;
  },

  // Feedback Analytics
  getFeedbackStats: async (period?: string) => {
    const params = period ? { period } : {};
    const response = await apiClient.get('/admin/feedback/stats', { params });
    return response.data;
  }
};

export default feedbackApi; 