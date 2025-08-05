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
  hasUnreadMessages: boolean;
  onNavigate: () => void;

}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ activeTab = 'dashboard', hasUnreadMessages, onNavigate }) => {
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
      {/* Logo */}
      <div className="flex items-center h-20 border-b px-4">
        <button onClick={() => navigate('/hr/dashboard')} className="flex items-center">
            <img src={logo} alt="JobHuntly" className="h-8" />
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1">
        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path, item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left mb-2 transition-all whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-[#007BFF] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <img 
                src={item.icon} 
                alt={item.label} 
                className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'filter brightness-0 invert' : ''}`} 
              />
              <span className="font-medium">{item.label}</span>
              {item.id === 'messages' && hasUnreadMessages && item.badge && (
                <span className="ml-2 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Settings Section */}
        <div className="mt-6 p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 text-left">
            SETTINGS
          </h3>
          {settingsNavItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigate(item.path, item.tab)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left mb-2 transition-all ${
                activeTab === item.tab
                  ? 'bg-[#007BFF] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <img 
                src={item.icon} 
                alt={item.name} 
                className={`w-5 h-5 flex-shrink-0 ${activeTab === item.tab ? 'filter brightness-0 invert' : ''}`} 
              />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </div>


    </div>
  );
};

export default DashboardSidebar; 