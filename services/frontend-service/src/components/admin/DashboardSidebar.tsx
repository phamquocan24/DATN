import React from 'react';
import DashboardIcon from '../../assets/dashboard.png';
import JDIcon from '../../assets/jd.png';
import AccountIcon from '../../assets/account.png';
import QuestionIcon from '../../assets/document.png';
import StatIcon from '../../assets/statitics.png';
import LogIcon from '../../assets/log.png';
import SettingsIcon from '../../assets/settings.png';
import FeedbackIcon from '../../assets/feedback.png';

interface DashboardSidebarProps {
  activeTab: string;
  isCollapsed: boolean;
  onDashboardClick?: () => void;
  onJobListingsClick?: () => void;
  onCandidatesClick?: () => void;
  onQuestionsClick?: () => void;
  onStatisticsClick?: () => void;
  onActivityLogClick?: () => void;
  onSettingsClick?: () => void;
  onFeedbackClick?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  isCollapsed,
  onDashboardClick,
  onJobListingsClick,
  onCandidatesClick,
  onQuestionsClick,
  onStatisticsClick,
  onActivityLogClick,
  onSettingsClick,
  onFeedbackClick,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'accounts', label: 'Accounts', icon: AccountIcon },
    { id: 'job-listings', label: 'Job Listings', icon: JDIcon },
    { id: 'questions', label: 'Questions', icon: QuestionIcon },
    { id: 'statistics', label: 'Statistics', icon: StatIcon },
    { id: 'activity-log', label: 'Activity Log', icon: LogIcon },
  ];

  const handleMenuClick = (itemId: string) => {
    switch(itemId) {
      case 'dashboard':
        onDashboardClick?.();
        break;
      case 'job-listings':
        onJobListingsClick?.();
        break;
      case 'accounts':
        onCandidatesClick?.();
        break;
      case 'questions':
        onQuestionsClick?.();
        break;
      case 'statistics':
        onStatisticsClick?.();
        break;
      case 'activity-log':
        onActivityLogClick?.();
        break;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Menu Items */}
      <nav className={`${isCollapsed ? 'p-2' : 'p-4'} transition-all duration-300`}>
        {menuItems.map((item) => (
          <div key={item.id} className="relative group">
            <button
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left mb-2 transition-all ${isCollapsed ? '' : 'whitespace-nowrap'} ${
                activeTab === item.id
                  ? 'bg-[#007BFF] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <img 
                src={item.icon} 
                alt="icon" 
                className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 transition-all duration-300 ${activeTab === item.id ? 'filter brightness-0 invert' : ''}`} 
              />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className={`mt-6 ${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 bg-white transition-all duration-300`}>
        {!isCollapsed && (
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 text-left">
            SETTINGS
          </h3>
        )}
        <div className="relative group">
          <button 
            onClick={onSettingsClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left transition-all ${
              activeTab === 'settings'
                ? 'bg-[#007BFF] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <img 
              src={SettingsIcon} 
              alt="settings" 
              className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} transition-all duration-300 ${activeTab==='settings' ? 'filter brightness-0 invert' : ''}`} 
            />
            {!isCollapsed && <span>Settings</span>}
          </button>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </div>
        <div className="relative group">
          <button 
            onClick={onFeedbackClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left transition-all ${
              activeTab === 'feedback'
                ? 'bg-[#007BFF] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <img 
              src={FeedbackIcon} 
              alt="feedback" 
              className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} transition-all duration-300 ${activeTab==='feedback' ? 'filter brightness-0 invert' : ''}`} 
            />
            {!isCollapsed && <span>Feedback</span>}
          </button>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Feedback
            </div>
          )}
        </div>
        
        {/* User Info - Removed here */}
      </div>
      {/* Logout at very bottom */}
      {false && (
        <div className="p-4 mt-auto border-t border-gray-200">
          <button 
            onClick={onLogoutClick}
            className="w-full flex items-center space-x-2 text-red-600 hover:text-red-700 py-2 text-left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardSidebar; 