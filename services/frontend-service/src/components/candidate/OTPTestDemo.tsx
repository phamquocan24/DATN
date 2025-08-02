import React, { useState } from 'react';
import OTPVerifyModal from './OTPVerifyModal';
import { OTPType } from '../../services/otpApi';

const OTPTestDemo: React.FC = () => {
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [otpType, setOtpType] = useState<OTPType>('EMAIL_VERIFICATION');
  const [result, setResult] = useState<any>(null);

  const handleOpenOTP = () => {
    if (!email) {
      alert('Please enter an email');
      return;
    }
    setShowOTPModal(true);
  };

  const handleOTPVerified = (data: any) => {
    console.log('OTP Verified successfully:', data);
    setResult(data);
    setShowOTPModal(false);
  };

  const handleCloseOTP = () => {
    setShowOTPModal(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">OTP Test Demo</h2>
      
      {/* Email Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter email address"
        />
      </div>

      {/* OTP Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OTP Type
        </label>
        <select
          value={otpType}
          onChange={(e) => setOtpType(e.target.value as OTPType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="EMAIL_VERIFICATION">Email Verification</option>
          <option value="REGISTRATION">Registration</option>
          <option value="LOGIN">Login</option>
          <option value="PASSWORD_RESET">Password Reset</option>
        </select>
      </div>

      {/* Test Button */}
      <button
        onClick={handleOpenOTP}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Test OTP Verification
      </button>

      {/* Result Display */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            OTP Verification Result:
          </h3>
          <pre className="text-xs text-green-700 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Instructions:
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use an existing registered email (like test@example.com)</li>
          <li>• Click "Test OTP Verification" to open the modal</li>
          <li>• The OTP will be sent automatically when modal opens</li>
          <li>• Enter the 6-digit code you received</li>
          <li>• The result will show here when verification succeeds</li>
        </ul>
      </div>

      {/* OTP Modal */}
      <OTPVerifyModal
        isOpen={showOTPModal}
        onClose={handleCloseOTP}
        onVerified={handleOTPVerified}
        email={email}
        type={otpType}
        title={`${otpType.replace('_', ' ')} - OTP Verification`}
        description={`Please enter the verification code sent to ${email}`}
      />
    </div>
  );
};

export default OTPTestDemo; 