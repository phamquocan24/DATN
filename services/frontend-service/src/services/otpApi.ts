import apiClient from './api';

// OTP Types matching backend enum
export type OTPType = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION';

// OTP API Service
export const otpApi = {
  // Send OTP
  sendOTP: async (email: string, type: OTPType = 'EMAIL_VERIFICATION') => {
    const response = await apiClient.post('/otp/send', { email, type });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email: string, otp_code: string, type: OTPType = 'EMAIL_VERIFICATION') => {
    const response = await apiClient.post('/otp/verify', { email, otp_code, type });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email: string, type: OTPType = 'EMAIL_VERIFICATION') => {
    const response = await apiClient.post('/otp/resend', { email, type });
    return response.data;
  },

  // Check OTP status (if this endpoint exists)
  getOTPStatus: async (email: string) => {
    try {
      const response = await apiClient.get('/otp/status', { params: { email } });
      return response.data;
    } catch (error: any) {
      // This endpoint might not exist, return null
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
};

export default otpApi; 