import React, { useState } from 'react';
import api from '../../services/api';

const LoginDetailsSettings: React.FC = () => {
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            await api.post('/api/v1/user/change-password', passwordData);
            setSuccess('Password changed successfully!');
            setPasswordData({ oldPassword: '', newPassword: '' }); // Clear fields
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password.');
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

      {/* Update Email Section */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Label column */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">Update Email</h3>
            <p className="text-gray-500 text-left">Update your email address to<br />make sure it is safe</p>
          </div>

          {/* Current email & form */}
          <div className="col-span-2 space-y-4 text-left">
            <div className="flex items-center space-x-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">jakegyll@email.com</p>
                <p className="text-xs text-gray-500">Your email address is verified.</p>
              </div>
              <svg className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1 text-left">Update Email</label>
              <input type="email" placeholder="Enter your new email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
            </div>
            <button className="px-6 py-2 bg-[#007BFF] text-white rounded-md font-medium hover:bg-[#0056b3]">Update Email</button>
          </div>
        </div>
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
          <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium">
            <span>Close Account</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginDetailsSettings; 