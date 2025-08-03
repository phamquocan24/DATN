import apiClient from './api';
import { isTokenValid } from './tokenUtils';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'candidate';
  name: string;
  profile?: any;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    access_token?: string;
    tokens?: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
  };
  message?: string;
}

class AuthService {
  private tokenKey = 'token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Store auth data
  setAuthData(token: string, refreshToken: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear auth data
  clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    // Also clear any legacy keys
    localStorage.removeItem('refreshToken');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token || token.length === 0) {
      return false;
    }
    
    // Use the token validation utility
    try {
      return isTokenValid(token);
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  // Login
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Clear any existing auth data before login attempt
      this.clearAuthData();
      
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data) {
        const { user, access_token, tokens } = response.data.data;
        // Handle both token formats - direct access_token or tokens object
        const accessToken = access_token || tokens?.access_token;
        const refreshToken = tokens?.refresh_token || '';
        this.setAuthData(accessToken, refreshToken, user);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  // Register
  async register(userData: any): Promise<AuthResponse> {
    try {
      // Convert role to uppercase format expected by backend
      const processedUserData = {
        ...userData,
        role: userData.role?.toUpperCase() || 'CANDIDATE',
        // Add confirmPassword if it exists as confirmPassword
        ...(userData.confirmPassword && { confirmPassword: userData.confirmPassword })
      };
      
      const response = await apiClient.post('/auth/register', processedUserData);
      
      if (response.data.success && response.data.data) {
        const { user, tokens } = response.data.data;
        const accessToken = tokens?.access_token;
        const refreshToken = tokens?.refresh_token;
        this.setAuthData(accessToken, refreshToken, user);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Registration failed');
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.data.success && response.data.data) {
        const user = response.data.data;
        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(user));
        return user;
      }
      
      throw new Error('Failed to get user profile');
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      // If 401 or token invalid, clear auth data and try to refresh
      if (error.response?.status === 401 || error.response?.data?.error?.code === 'INVALID_TOKEN') {
        console.warn('Token invalid, clearing auth data');
        this.clearAuthData();
        // Redirect to login or refresh page
        window.location.reload();
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to get user profile');
    }
  }

  // Validate token
  async validateToken(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/validate-token');
      return response.data.success === true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearAuthData();
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      if (this.isAuthenticated()) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data
      this.clearAuthData();
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to send reset email');
    }
  }

  // Reset password  
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/auth/reset-password', { 
        token, 
        new_password: newPassword,
        confirm_password: confirmPassword 
      });
      return response.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to reset password');
    }
  }
}

export default new AuthService(); 