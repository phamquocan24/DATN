import React from 'react';
import DashboardIcon from '../../assets/dashboard.png';
import JDIcon from '../../assets/jd.png';
import AccountIcon from '../../assets/account.png';
import QuestionIcon from '../../assets/question.png';
import StatIcon from '../../assets/statitics.png';
import LogIcon from '../../assets/log.png';
import SettingsIcon from '../../assets/settings.png';
import FeedbackIcon from '../../assets/feedback.png';

interface DashboardSidebarProps {
  activeTab: string;
  onDashboardClick?: () => void;
  onJobListingsClick?: () => void;
  onCandidatesClick?: () => void;
  onQuestionsClick?: () => void;
  onStatisticsClick?: () => void;
  onActivityLogClick?: () => void;
  onSettingsClick?: () => void;
  onFeedbackClick?: () => void;
  showLogout?: boolean;
  onLogoutClick?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onDashboardClick,
  onJobListingsClick,
  onCandidatesClick,
  onQuestionsClick,
  onStatisticsClick,
  onActivityLogClick,
  onSettingsClick,
  onFeedbackClick,
  showLogout = false,
  onLogoutClick
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
      <nav className="p-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left mb-2 transition-all whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-[#007BFF] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <img src={item.icon} alt="icon" className={`w-5 ${item.id==='job-listings' ? 'h-6' : 'h-5'} flex-shrink-0 ${activeTab===item.id ? 'filter brightness-0 invert' : ''}`} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="mt-6 p-4 border-t border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 text-left">
          SETTINGS
        </h3>
        <button 
          onClick={onSettingsClick}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'settings'
              ? 'bg-[#007BFF] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <img src={SettingsIcon} alt="settings" className={`w-4 h-4 ${activeTab==='settings' ? 'filter brightness-0 invert' : ''}`} />
          <span>Settings</span>
        </button>
        <button 
          onClick={onFeedbackClick}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'feedback'
              ? 'bg-[#007BFF] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <img src={FeedbackIcon} alt="feedback" className={`w-4 h-4 ${activeTab==='feedback' ? 'filter brightness-0 invert' : ''}`} />
          <span>Feedback</span>
        </button>
        
        {/* User Info - Removed here */}
      </div>
      {/* Logout at very bottom */}
      {showLogout && (
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