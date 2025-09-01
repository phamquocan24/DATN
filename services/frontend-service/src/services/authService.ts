import apiClient from './api';
import { isTokenValid } from './tokenUtils';

export interface User {
  user_id: string; // Changed from 'id' to 'user_id' to match backend
  email: string;
  role: 'ADMIN' | 'CANDIDATE' | 'RECRUITER';
  full_name: string; // Changed from 'name' to 'full_name' to match backend
  profile_image_url?: string;
  bio?: string;
  website_url?: string;
  languages?: string[];
  profile?: any;
  candidate_profile?: any;
  candidate_profile_id?: string;
  company_id?: string;
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
    console.log('🔑 Setting auth data:', {
      tokenKey: this.tokenKey,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasRefreshToken: !!refreshToken,
      userId: user?.user_id
    });
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
        
        console.log('🚀 Login successful, storing auth data:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUser: !!user,
          responseStructure: {
            hasDirectAccessToken: !!access_token,
            hasTokensObject: !!tokens,
            tokensKeys: tokens ? Object.keys(tokens) : []
          }
        });
        
        this.setAuthData(accessToken, refreshToken, user);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific status codes with user-friendly messages
      if (error.response?.status === 401) {
        throw new Error('Incorrect email or password. Please check your credentials and try again.');
      } else if (error.response?.status === 400) {
        throw new Error('Please enter a valid email and password.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please wait a few minutes and try again.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server is temporarily unavailable. Please try again later.');
      }
      
      // Use server message if available, otherwise friendly fallback
      const serverMessage = error.response?.data?.message;
      if (serverMessage && !serverMessage.includes('status code')) {
        throw new Error(serverMessage);
      }
      
      throw new Error('Unable to log in. Please check your connection and try again.');
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
        let user = response.data.data;
        
        // If user is CANDIDATE, also fetch full profile to get profile_image_url
        if (user.role === 'CANDIDATE') {
          try {
            const profileResponse = await apiClient.get('/api/v1/users/profile');
            if (profileResponse.data.success && profileResponse.data.data) {
              // Merge profile data into user object
              const profileData = profileResponse.data.data;
              user = {
                ...user,
                profile_image_url: profileData.profile_image_url,
                bio: profileData.bio,
                website_url: profileData.website_url,
                languages: profileData.languages,
                candidate_profile: profileData.candidate_profile
              };
            }
          } catch (profileError) {
            console.warn('Failed to fetch full profile, using basic user data:', profileError);
            // Continue with basic user data if profile fetch fails
          }
        }
        
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