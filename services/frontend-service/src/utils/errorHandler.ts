/**
 * Utility functions for handling API errors consistently across the application
 */

export interface ApiError {
  message: string;
  status?: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Parse and format error messages from API responses
 */
export const parseApiError = (error: any): string => {
  // Handle network/connection errors
  if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
    return 'Connection failed. Please check your internet connection and try again.';
  }

  // Handle CORS errors
  if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
    return 'Service configuration error. Please contact support.';
  }

  // Handle axios/fetch response errors
  if (error.response) {
    const { status, data } = error.response;

    // Handle validation errors
    if (data?.errors && Array.isArray(data.errors)) {
      const validationErrors = data.errors
        .map((err: any) => `${err.field}: ${err.message}`)
        .join('\n');
      return `Validation failed:\n${validationErrors}`;
    }

    // Handle specific error messages from API
    if (data?.message) {
      return data.message;
    }

    // Handle HTTP status codes
    switch (status) {
      case 400:
        return 'Bad request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found. Please check if the item still exists.';
      case 409:
        return 'Conflict. The resource already exists or is in use.';
      case 422:
        return 'Invalid data provided. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later or contact support.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `Request failed with status ${status}. Please try again.`;
    }
  }

  // Handle error objects with message
  if (error.message) {
    return error.message;
  }

  // Fallback error message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if an error is a network/connection error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error.name === 'TypeError' ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('Network Error') ||
    error.code === 'NETWORK_ERROR'
  );
};

/**
 * Check if an error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return (
    error.response?.status === 401 ||
    error.message?.includes('Unauthorized') ||
    error.message?.includes('Authentication failed')
  );
};

/**
 * Check if an error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  return (
    error.response?.status === 400 ||
    (error.response?.data?.errors && Array.isArray(error.response.data.errors))
  );
};

/**
 * Format error for user display (shorter, user-friendly)
 */
export const formatUserError = (error: any): string => {
  const fullError = parseApiError(error);
  
  // For validation errors, show only the first error to keep it concise
  if (isValidationError(error) && error.response?.data?.errors?.[0]) {
    const firstError = error.response.data.errors[0];
    return `${firstError.field}: ${firstError.message}`;
  }
  
  return fullError;
};

/**
 * Log error for debugging (includes full details)
 */
export const logError = (context: string, error: any): void => {
  console.group(`🚨 Error in ${context}`);
  console.error('Full error object:', error);
  console.error('Parsed message:', parseApiError(error));
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
  console.groupEnd();
};

/**
 * Handle common API errors with user notifications
 */
export const handleApiError = (context: string, error: any, showAlert: boolean = true): string => {
  const errorMessage = parseApiError(error);
  
  // Log for debugging
  logError(context, error);
  
  // Show user notification if requested
  if (showAlert) {
    alert(errorMessage);
  }
  
  return errorMessage;
};
