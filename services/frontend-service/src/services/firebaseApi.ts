import apiClient from './api';

// Firebase API Service  
export const firebaseApi = {
  // Get Firebase config for client
  getConfig: async () => {
    const response = await apiClient.get('/firebase/config');
    return response.data;
  },

  // Get Firebase service status
  getStatus: async () => {
    const response = await apiClient.get('/firebase/status');
    return response.data;
  },

  // Verify Firebase ID token
  verifyToken: async (idToken: string) => {
    const response = await apiClient.post('/firebase/verify-token', { idToken });
    return response.data;
  },

  // Social authentication (Google, Facebook, etc.)
  socialAuth: async (provider: string, idToken: string, userData?: any) => {
    const response = await apiClient.post('/firebase/social-auth', { 
      provider, 
      idToken, 
      userData 
    });
    return response.data;
  },

  // Link Firebase account to existing account
  linkAccount: async (idToken: string) => {
    const response = await apiClient.post('/firebase/link-account', { idToken });
    return response.data;
  },

  // Unlink Firebase account
  unlinkAccount: async (provider: string) => {
    const response = await apiClient.post('/firebase/unlink-account', { provider });
    return response.data;
  },

  // Get linked accounts
  getLinkedAccounts: async () => {
    const response = await apiClient.get('/firebase/linked-accounts');
    return response.data;
  },

  // Update custom claims (Admin only)
  updateCustomClaims: async (userId: string, claims: any) => {
    const response = await apiClient.put('/firebase/custom-claims', { userId, claims });
    return response.data;
  }
};

export default firebaseApi; 