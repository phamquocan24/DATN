import React, { useState } from 'react';
import MyProfileSettings from './MyProfileSettings';
import LoginDetailsSettings from './LoginDetailsSettings';
import NotificationsSettings from './NotificationsSettings';
import DashboardSidebar from './DashboardSidebar';

interface SettingsProps {
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onProfileClick?: () => void;
  onAgentAIClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onFindJobsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onSettingsClick?: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  onHomeClick,
  onDashboardClick,
  onProfileClick,
  onAgentAIClick,
  onMyApplicationsClick,
  onTestManagementClick,
  onFindJobsClick,
  onBrowseCompaniesClick
}) => {
  const [activeTab, setActiveTab] = useState('my-profile');





  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-profile':
        return <MyProfileSettings />;
      case 'login-details':
        return <LoginDetailsSettings />;
      case 'notifications':
        return <NotificationsSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab="settings"
        onDashboardClick={onDashboardClick}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={onTestManagementClick}
        onFindJobsClick={onFindJobsClick}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
        onProfileClick={onProfileClick}
        onSettingsClick={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <button 
            onClick={onHomeClick}
            className="px-4 py-2 text-[#007BFF] hover:text-white font-medium border border-[#007BFF] rounded-lg hover:bg-[#007BFF] transition-colors"
          >
            Back to homepage
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my-profile')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'my-profile'
                  ? 'border-[#007BFF] text-[#007BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('login-details')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'login-details'
                  ? 'border-[#007BFF] text-[#007BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Login Details
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'notifications'
                  ? 'border-[#007BFF] text-[#007BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}


      </div>
    </div>
  );
};

export default Settings; 