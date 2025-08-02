import apiClient from './api';

// Message/Chat API Service
export const messageApi = {
  // Get conversations
  getConversations: async () => {
    const response = await apiClient.get('/messages/conversations');
    return response.data;
  },

  // Get messages in a conversation
  getMessages: async (conversationId: string, page = 1, limit = 50) => {
    const response = await apiClient.get(`/messages/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Send message
  sendMessage: async (conversationId: string, content: string, type: 'text' | 'file' = 'text') => {
    const response = await apiClient.post(`/messages/conversations/${conversationId}/messages`, {
      content,
      type
    });
    return response.data;
  },

  // Create new conversation
  createConversation: async (participants: string[], subject?: string) => {
    const response = await apiClient.post('/messages/conversations', {
      participants,
      subject
    });
    return response.data;
  },

  // Mark conversation as read
  markAsRead: async (conversationId: string) => {
    const response = await apiClient.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId: string) => {
    const response = await apiClient.delete(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  // Search messages
  searchMessages: async (query: string, conversationId?: string) => {
    const params: any = { query };
    if (conversationId) params.conversationId = conversationId;
    
    const response = await apiClient.get('/messages/search', { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await apiClient.get('/messages/unread-count');
    return response.data;
  },

  // Upload file for message
  uploadMessageFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Block/Unblock user
  blockUser: async (userId: string) => {
    const response = await apiClient.post('/messages/block', { userId });
    return response.data;
  },

  unblockUser: async (userId: string) => {
    const response = await apiClient.post('/messages/unblock', { userId });
    return response.data;
  },

  // Get blocked users
  getBlockedUsers: async () => {
    const response = await apiClient.get('/messages/blocked-users');
    return response.data;
  }
};

export default messageApi; 