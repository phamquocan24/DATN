import React, { useState, useEffect, useRef } from 'react';
import otpApi, { OTPType } from '../../services/otpApi';

interface OTPVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (data: any) => void;
  email: string;
  type: OTPType;
  title?: string;
  description?: string;
}

const OTPVerifyModal: React.FC<OTPVerifyModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  email,
  type,
  title = 'Enter Verification Code',
  description = 'Please enter the 6-digit code sent to your email'
}) => {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, canResend]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtpCode(['', '', '', '', '', '']);
      setError(null);
      setSuccess(null);
      setCountdown(60);
      setCanResend(false);
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Send initial OTP when modal opens
  useEffect(() => {
    if (isOpen && email && type) {
      handleSendOTP();
    }
  }, [isOpen, email, type]);

  const handleSendOTP = async () => {
    setSendingOTP(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await otpApi.sendOTP(email, type);
      if (response.success) {
        setSuccess('OTP sent successfully to your email');
        setCountdown(response.data?.cooldown || 60);
        setCanResend(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setSendingOTP(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await otpApi.resendOTP(email, type);
      if (response.success) {
        setSuccess('OTP sent again to your email');
        setCountdown(response.data?.cooldown || 60);
        setCanResend(false);
        
        // Clear OTP inputs
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('Error resending OTP:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtpCode.every(digit => digit !== '') && newOtpCode.join('').length === 6) {
      setTimeout(() => handleVerifyOTP(newOtpCode.join('')), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (code?: string) => {
    const codeToVerify = code || otpCode.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await otpApi.verifyOTP(email, codeToVerify, type);
      
      if (response.success) {
        setSuccess('OTP verified successfully!');
        onVerified(response.data);
        setTimeout(() => onClose(), 1000);
      } else {
        setError(response.error || 'Invalid OTP code');
        // Clear OTP inputs on error
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Failed to verify OTP. Please try again.');
      // Clear OTP inputs on error
      setOtpCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtpCode(['', '', '', '', '', '']);
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            disabled={loading || sendingOTP}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">{description}</p>
          <p className="text-sm text-gray-500">
            Code sent to: <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center space-x-3 mb-4">
            {otpCode.map((digit, index) => (
                              <input
                 key={index}
                 ref={el => { inputRefs.current[index] = el; }}
                 type="text"
                value={digit}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                maxLength={1}
                disabled={loading || sendingOTP}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerifyOTP()}
            disabled={loading || sendingOTP || otpCode.join('').length !== 6}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </button>
        </div>

        {/* Resend Section */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          
          {canResend ? (
            <button
              onClick={handleResendOTP}
              disabled={sendingOTP}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingOTP ? 'Sending...' : 'Resend Code'}
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Resend in {formatTime(countdown)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyModal; 