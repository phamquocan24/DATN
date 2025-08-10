import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import dashboardIcon from '../../assets/dashboard.png';
import messageIcon from '../../assets/message.png';
import companyIcon from '../../assets/company.png';
import applicantsIcon from '../../assets/account.png';
import listingIcon from '../../assets/jd.png';
import testIcon from '../../assets/test.png';
import scheduleIcon from '../../assets/schedule.png';
import settingsIcon from '../../assets/settings.png';
import helpIcon from '../../assets/feedback.png';

interface DashboardSidebarProps {
  activeTab?: string;
  isCollapsed: boolean;
  hasUnreadMessages: boolean;
  onNavigate: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ activeTab = 'dashboard', isCollapsed, hasUnreadMessages, onNavigate }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string, id: string) => {
    if (id === 'messages') {
        onNavigate();
    }
    navigate(path);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon, path: '/hr/dashboard' },
    { id: 'messages', label: 'Messages', icon: messageIcon, badge: 1, path: '/hr/messages' },
    { id: 'profile', label: 'Company Profile', icon: companyIcon, path: '/hr/company-profile' },
    { id: 'applicants', label: 'All Applicants', icon: applicantsIcon, path: '/hr/job-applications' },
    { id: 'listing', label: 'Job Listing', icon: listingIcon, path: '/hr/job-management' },
    { id: 'test', label: 'Test Management', icon: testIcon, path: '/hr/test-management' },
    { id: 'schedule', label: 'My Schedule', icon: scheduleIcon, path: '/hr/my-schedule' },
  ];

  const settingsNavItems = [
    { name: 'Settings', path: '/hr/settings', icon: settingsIcon, tab: 'settings' },
    { name: 'Help Center', path: '/hr/help-center', icon: helpIcon, tab: 'help' },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Menu Items */}
      <div className="flex-1">
        <nav className={`${isCollapsed ? 'p-2' : 'p-4'} transition-all duration-300`}>
          {menuItems.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleNavigate(item.path, item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left mb-2 transition-all ${isCollapsed ? '' : 'whitespace-nowrap'} ${
                  activeTab === item.id
                    ? 'bg-[#007BFF] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <img 
                  src={item.icon} 
                  alt={item.label} 
                  className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 transition-all duration-300 ${activeTab === item.id ? 'filter brightness-0 invert' : ''}`} 
                />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
                {!isCollapsed && item.id === 'messages' && hasUnreadMessages && item.badge && (
                  <span className="ml-2 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  {item.id === 'messages' && hasUnreadMessages && item.badge && (
                    <span className="ml-1 w-3 h-3 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Settings Section */}
        <div className={`mt-6 ${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 transition-all duration-300`}>
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 text-left">
              SETTINGS
            </h3>
          )}
          {settingsNavItems.map((item) => (
            <div key={item.name} className="relative group">
              <button
                onClick={() => handleNavigate(item.path, item.tab)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left transition-all ${
                  activeTab === item.tab
                    ? 'bg-[#007BFF] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <img 
                  src={item.icon} 
                  alt={item.name} 
                  className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 transition-all duration-300 ${activeTab === item.tab ? 'filter brightness-0 invert' : ''}`} 
                />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </button>
              {isCollapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default DashboardSidebar; 