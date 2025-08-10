import React from 'react';

interface AdminNotificationsSettingsProps {
  currentUser?: any;
}

const AdminNotificationsSettings: React.FC<AdminNotificationsSettingsProps> = ({ currentUser }) => {
  return (
    <div className="space-y-8 text-[14px]">
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="font-semibold text-gray-900 mb-1 text-left">Basic Information</h2>
        <p className="text-gray-500 text-left">This is notifications preferences that you can update anytime.</p>
      </div>

      {/* System Notifications Section */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Label column */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">System Notifications</h3>
            <p className="text-gray-500 text-left">Customize your preferred<br />notification settings</p>
          </div>

          {/* Options column */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="user-activities"
                defaultChecked
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="user-activities" className="block font-medium text-gray-900 text-left">
                  User Activities
                </label>
                <p className="text-gray-500 text-left">Notifications about user registrations,<br />profile updates, and account activities</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="job-postings"
                defaultChecked
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="job-postings" className="block font-medium text-gray-900 text-left">
                  Job Postings
                </label>
                <p className="text-gray-500 text-left">Notifications about new job postings,<br />updates, and expirations</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="applications"
                defaultChecked
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="applications" className="block font-medium text-gray-900 text-left">
                  Applications
                </label>
                <p className="text-gray-500 text-left">Notifications about new job applications<br />and candidate updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts Section */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Label column */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">Security Alerts</h3>
            <p className="text-gray-500 text-left">Configure security-related<br />notifications</p>
          </div>

          {/* Options column */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="login-attempts"
                defaultChecked
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="login-attempts" className="block font-medium text-gray-900 text-left">
                  Login Attempts
                </label>
                <p className="text-gray-500 text-left">Get notified about suspicious login<br />attempts and account access</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="system-updates"
                defaultChecked
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="system-updates" className="block font-medium text-gray-900 text-left">
                  System Updates
                </label>
                <p className="text-gray-500 text-left">Notifications about system updates,<br />maintenance, and security patches</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="error-alerts"
                defaultChecked
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="error-alerts" className="block font-medium text-gray-900 text-left">
                  Error Alerts
                </label>
                <p className="text-gray-500 text-left">Get notified about system errors<br />and critical issues</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">Email Preferences</h3>
            <p className="text-gray-500 text-left">Configure how you receive<br />email notifications</p>
          </div>
          <div className="col-span-2 space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-left">
                Notification Frequency
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]">
                <option>Real-time</option>
                <option>Hourly Digest</option>
                <option>Daily Summary</option>
                <option>Weekly Report</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="urgent-only"
                className="w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] rounded"
              />
              <label htmlFor="urgent-only" className="text-gray-700">
                Send emails only for urgent notifications
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-4">
        <button className="px-6 py-2 bg-[#007BFF] text-white rounded-md font-medium hover:bg-[#0056b3]">
          Update Preferences
        </button>
      </div>
    </div>
  );
};

export default AdminNotificationsSettings; 