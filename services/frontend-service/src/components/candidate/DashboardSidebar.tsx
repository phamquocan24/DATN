import React from 'react';
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
  isCollapsed: boolean;
  onToggleSidebar: () => void;
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
  isCollapsed,
  onToggleSidebar,
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
  onLogoutClick,
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
    <div className="flex flex-col h-full bg-white">
      {/* Hamburger button when collapsed */}
      {isCollapsed && (
        <div className="p-2 pt-6">
          <div className="relative group">
            <button
              onClick={onToggleSidebar}
              className="w-full flex items-center justify-center px-2 py-3 rounded-lg mb-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {/* Tooltip for collapsed hamburger */}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Expand Menu
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className={`${isCollapsed ? 'p-2' : 'p-4'} ${isCollapsed ? 'pt-0' : 'pt-6'} transition-all duration-300`}>
        {menuItems.map((item) => (
          <div key={item.id} className="relative group">
            {item.id === 'dashboard' ? (
              <div className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'} rounded-lg mb-1 transition-all ${
                activeTab === item.id
                  ? 'bg-[#007BFF] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`flex items-center ${isCollapsed ? '' : 'flex-1 space-x-3'} transition-all`}
                >
                  <img 
                    src={item.icon} 
                    alt="icon" 
                    className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 transition-all duration-300 ${activeTab === item.id ? 'filter brightness-0 invert' : ''}`} 
                  />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
                {!isCollapsed && (
                  <button
                    onClick={onToggleSidebar}
                    className={`p-1 rounded transition-colors ${
                      activeTab === item.id
                        ? 'hover:bg-blue-600'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left mb-1 transition-all ${isCollapsed ? '' : 'whitespace-nowrap'} ${
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
            )}
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
      <div className={`mt-6 ${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 transition-all duration-300`}>
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
              className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} transition-all duration-300 ${activeTab === 'settings' ? 'filter brightness-0 invert' : ''}`} 
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
            onClick={onHelpCenterClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left transition-all ${
              activeTab === 'help-center'
                ? 'bg-[#007BFF] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <img 
              src={FeedbackIcon} 
              alt="feedback" 
              className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4'} transition-all duration-300 ${activeTab === 'help-center' ? 'filter brightness-0 invert' : ''}`} 
            />
            {!isCollapsed && <span>Help Center</span>}
          </button>
          {isCollapsed && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Help Center
            </div>
          )}
        </div>
        
        {/* Logout Button - Only show if showLogout is true */}
        {showLogout && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="relative group">
              <button 
                onClick={onLogoutClick}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-2 px-3 py-2'} text-red-600 hover:text-red-700 transition-all`}
              >
                <svg className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} transition-all duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!isCollapsed && <span className="font-medium">Logout</span>}
              </button>
              {isCollapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Logout
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSidebar; 