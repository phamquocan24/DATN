import React, { useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { HrDashboard, Messages, HrCompanyProfile, JobApplications, JobManagement, HrHeader, ApplicantDetail, MySchedule, Settings, TestManagement, HelpCenter } from '.';
import authService from '../../services/authService';
import api from '../../services/api';
import Logo from '../../assets/Logo.png';
import LogoTab from '../../assets/Logo_tab.png';

interface HrLayoutProps {
  children?: ReactNode;
  activeTab?: string;
  currentUser?: any;
}

const HrLayout: React.FC<HrLayoutProps> = ({ children, activeTab = 'dashboard', currentUser }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize isCollapsed from localStorage, default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('hr-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Save isCollapsed to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('hr-sidebar-collapsed', JSON.stringify(isCollapsed));
    } catch (error) {
      console.warn('Failed to save HR sidebar state to localStorage:', error);
    }
  }, [isCollapsed]);

  const toggleNotif = () => setNotifOpen(!notifOpen);
  
  const handleMarkMessagesAsRead = () => {
    setHasUnreadMessages(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };



  const renderContent = () => {
    if (children) {
      return children;
    }

    const commonProps = { notifOpen, hasUnread, toggleNotif, setHasUnread, setNotifOpen };
    
    if (location.pathname.includes('/hr/job-applications/')) {
        return <ApplicantDetail />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <HrDashboard {...commonProps} />;
      case 'messages':
        return <Messages onConversationSelect={handleMarkMessagesAsRead} />;
      case 'profile':
        return <HrCompanyProfile />;
      case 'applicants':
        return <JobApplications />;
      case 'listing':
        return <JobManagement />;
      case 'schedule':
        return <MySchedule />;
      case 'settings':
        return <Settings currentUser={currentUser} />;
      case 'test':
        return <TestManagement />;
      case 'help':
        return <HelpCenter />;
      default:
        return <HrDashboard {...commonProps} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg min-h-screen border-l border-r border-gray-200 sticky top-0 z-10 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300`}>
        {/* Logo */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} transition-all duration-300`}>
          {!isCollapsed && (
            <button onClick={() => navigate('/hr/dashboard')} className="flex items-center">
              <img 
                src={Logo} 
                alt="Logo" 
                className="h-8 w-auto transition-all duration-300" 
              />
            </button>
          )}
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
          >
            <svg
              className="w-5 h-5"
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
        </div>

        <DashboardSidebar 
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          hasUnreadMessages={hasUnreadMessages} 
          onNavigate={handleMarkMessagesAsRead}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-visible bg-white">
        <HrHeader 
          notifOpen={notifOpen} 
          hasUnread={hasUnread} 
          toggleNotif={toggleNotif} 
          onCloseNotif={() => setNotifOpen(false)}
          onMarkAllAsRead={() => setHasUnread(false)}
          currentUser={currentUser}
        />
        <div className="px-8 pt-6">
          <div className="border-t border-gray-200"></div>
        </div>
        <main className="flex-1 px-8 py-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default HrLayout; 