import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { isTokenValid, clearAuthData } from './tokenUtils';
import AuthService from './authService'; // Import AuthService

const apiClient = axios.create({
  baseURL: 'http://localhost:5001', // TEMPORARY: Direct to Business Service to bypass API Gateway timeout
  timeout: 10000,
  withCredentials: false,
});

// Request interceptor to add auth token and handle API paths
apiClient.interceptors.request.use((config: any) => {
  // Get access token from localStorage
  const accessToken = localStorage.getItem('token') || '';
  
  // Add API prefix for endpoints that don't have it
  if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('/health')) {
    // Add /api/v1/ prefix for business endpoints
    config.url = `/api/v1${config.url}`;
  }
  
  // Check token validity before adding to headers
  const headers: any = { ...config.headers };
  
  // Don't add auth header for login/register requests
  const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/forgot-password') ||
                          config.url?.includes('/auth/reset-password');
  
  if (!isAuthEndpoint && accessToken && accessToken.length > 0) {
    if (isTokenValid(accessToken)) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      // Token is expired or invalid, clear it
      console.warn('Token expired, clearing auth data');
      clearAuthData();
      // Don't add Authorization header for expired token
    }
  }
  
  return {
    ...config,
    headers,
  };
});

// Flag to prevent multiple token refresh requests
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't try to refresh token for auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/forgot-password') ||
                           originalRequest.url?.includes('/auth/reset-password');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = AuthService.getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post('http://localhost:5001/api/v1/auth/refresh-token', {
            refresh_token: refreshToken,
          });

          const { access_token: newAccessToken, refresh_token: newRefreshToken, user } = data.data;
          AuthService.setAuthData(newAccessToken, newRefreshToken, user);
          
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          AuthService.clearAuthData();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        AuthService.clearAuthData();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;