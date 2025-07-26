import React from 'react';
import Avatar from '../../assets/Avatar17.png';
import DashboardIcon from '../../assets/dashboard.png';
import AIIcon from '../../assets/ai.png';
import DocIcon from '../../assets/document.png';
import TestIcon from '../../assets/test.png';
import GlassIcon from '../../assets/glass1.png';
import CompanyIcon from '../../assets/company.png';
import AccountIcon from '../../assets/account1.png';
import SettingsIcon from '../../assets/settings.png';
import FeedbackIcon from '../../assets/feedback.png';

interface DashboardSidebarProps {
  activeTab: string;
  onDashboardClick?: () => void;
  onAgentAIClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onFindJobsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
  showLogout?: boolean;
  onLogoutClick?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onDashboardClick,
  onAgentAIClick,
  onMyApplicationsClick,
  onTestManagementClick,
  onFindJobsClick,
  onBrowseCompaniesClick,
  onProfileClick,
  onSettingsClick,
  onHelpCenterClick,
  showLogout = false,
  onLogoutClick
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'agent-ai', label: 'Agent AI', icon: AIIcon },
    { id: 'applications', label: 'My Applications', icon: DocIcon },
    { id: 'test-management', label: 'Test Management', icon: TestIcon },
    { id: 'find-jobs', label: 'Find Jobs', icon: GlassIcon },
    { id: 'browse-companies', label: 'Browse Companies', icon: CompanyIcon },
    { id: 'public-profile', label: 'My Public Profile', icon: AccountIcon },
  ];

  const handleMenuClick = (itemId: string) => {
    if (itemId === 'dashboard' && onDashboardClick) {
      onDashboardClick();
    } else if (itemId === 'agent-ai' && onAgentAIClick) {
      onAgentAIClick();
    } else if (itemId === 'applications' && onMyApplicationsClick) {
      onMyApplicationsClick();
    } else if (itemId === 'test-management' && onTestManagementClick) {
      onTestManagementClick();
    } else if (itemId === 'find-jobs' && onFindJobsClick) {
      onFindJobsClick();
    } else if (itemId === 'browse-companies' && onBrowseCompaniesClick) {
      onBrowseCompaniesClick();
    } else if (itemId === 'public-profile' && onProfileClick) {
      onProfileClick();
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      {/* Menu Items */}
      <nav className="p-4 pt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left mb-1 transition-all ${
              activeTab === item.id
                ? 'bg-[#007BFF] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <img src={item.icon} alt="icon" className={`w-5 h-5 flex-shrink-0 ${activeTab===item.id? 'filter brightness-0 invert': ''}`} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
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
          onClick={onHelpCenterClick}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'help-center'
              ? 'bg-[#007BFF] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <img src={FeedbackIcon} alt="feedback" className={`w-4 h-4 ${activeTab==='help-center' ? 'filter brightness-0 invert' : ''}`} />
          <span>Help Center</span>
        </button>
        
        {/* User Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Logout Button - Only show if showLogout is true */}
          {showLogout && (
            <button 
              onClick={onLogoutClick}
              className="w-full flex items-center space-x-2 text-red-600 hover:text-red-700 py-2 mb-3 text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          )}
          
          <div className="flex items-center space-x-3 text-left">
            <img src={Avatar} alt="User" className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium text-sm">Jake Gyll</p>
              <p className="text-gray-500 text-xs">jakegyll@email.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar; 