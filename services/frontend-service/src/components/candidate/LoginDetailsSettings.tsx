import React, { useState } from 'react';
import candidateApi from '../../services/candidateApi';

interface LoginDetailsSettingsProps {
  currentUser?: any;
}

const LoginDetailsSettings: React.FC<LoginDetailsSettingsProps> = ({ currentUser }) => {
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivateReason, setDeactivateReason] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }
        
        if (passwordData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }
        
        setIsLoading(true);
        try {
            await candidateApi.changePassword({
                current_password: passwordData.oldPassword,
                new_password: passwordData.newPassword,
                confirm_password: passwordData.confirmPassword,
            });
            setSuccess('Password changed successfully!');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' }); // Clear fields
        } catch (err: any) {
            console.error('Change password error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to change password.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateAccount = async () => {
        if (!deactivateReason.trim()) {
            setError('Please provide a reason for deactivating your account.');
            return;
        }
        
        setIsLoading(true);
        try {
            await candidateApi.deactivateAccount(deactivateReason);
            setSuccess('Account deactivated successfully. You will be logged out shortly.');
            setShowDeactivateModal(false);
            // Optionally redirect or logout user
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err: any) {
            console.error('Deactivate account error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to deactivate account.');
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="space-y-8 text-[14px]">
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="font-semibold text-gray-900 mb-1 text-left">Basic Information</h2>
        <p className="text-gray-500 text-left">This is login information that you can update anytime.</p>
      </div>



      {/* New Password Section */}
      <div className="border-b border-gray-200 pb-6">
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-6">
            {/* Label column */}
            <div>
                <h3 className="font-medium text-gray-900 mb-2 text-left">New Password</h3>
                <p className="text-gray-500 text-left">Manage your password to<br />make sure it is safe</p>
            </div>

            {/* Form column */}
            <div className="col-span-2 space-y-4">
                <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">Old Password</label>
                <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handleChange} placeholder="Enter your old password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" required/>
                <p className="text-xs text-gray-500 mt-1 text-left">Minimum 8 characters</p>
                </div>
                <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">New Password</label>
                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handleChange} placeholder="Enter your new password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" required/>
                <p className="text-xs text-gray-500 mt-1 text-left">Minimum 8 characters</p>
                </div>
                <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">Confirm New Password</label>
                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handleChange} placeholder="Confirm your new password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" required/>
                <p className="text-xs text-gray-500 mt-1 text-left">Must match new password</p>
                </div>
                {error && <div className="text-red-500 text-left text-sm">{error}</div>}
                {success && <div className="text-green-500 text-left text-sm">{success}</div>}
                <div className="flex justify-start">
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-[#007BFF] text-white rounded-md font-medium hover:bg-[#0056b3] disabled:bg-gray-400">
                    {isLoading ? 'Changing...' : 'Change Password'}
                </button>
                </div>
            </div>
            </div>
        </form>
      </div>

      {/* Close Account */}
      <div className="pt-6">
        <div className="flex justify-end">
          <button 
            onClick={() => setShowDeactivateModal(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
          >
            <span>Close Account</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deactivate Account</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Are you sure you want to deactivate your account? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-2 text-left">
                Reason for deactivation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]"
                rows={3}
                placeholder="Please provide a reason..."
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            {success && <div className="text-green-500 text-sm mb-4">{success}</div>}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateReason('');
                  setError(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                disabled={isLoading}
              >
                {isLoading ? 'Deactivating...' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDetailsSettings; 