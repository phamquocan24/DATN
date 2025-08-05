import React from 'react';

interface NotificationsSettingsProps {
  currentUser?: any;
}

const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({ currentUser }) => {
  return (
    <div className="space-y-8 text-[14px]">
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="font-semibold text-gray-900 mb-1 text-left">Basic Information</h2>
        <p className="text-gray-500 text-left">This is notifications preferences that you can update anytime.</p>
      </div>

      {/* Notifications Section */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Label column */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">Notifications</h3>
            <p className="text-gray-500 text-left">Customize your preferred<br />notification settings</p>
          </div>

          {/* Options column */}
          <div className="col-span-2 space-y-6">
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
                <p className="text-gray-500 text-left">These are notifications for jobs that you<br />have applied to</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="jobs"
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="jobs" className="block font-medium text-gray-900 text-left">
                  Jobs
                </label>
                <p className="text-gray-500 text-left">These are notifications for job openings<br />that suit your profile</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="recommendations"
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF] focus:ring-2 rounded"
              />
              <div>
                <label htmlFor="recommendations" className="block font-medium text-gray-900 text-left">
                  Recommendations
                </label>
                <p className="text-gray-500 text-left">These are notifications for personalized<br />recommendations from our recruiters</p>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-start pt-2">
              <button className="px-6 py-2 bg-[#007BFF] text-white rounded-md font-medium hover:bg-[#0056b3]">Update Email</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings; 