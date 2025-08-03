import React, { useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { HrDashboard, Messages, HrCompanyProfile, JobApplications, JobManagement, HrHeader, ApplicantDetail, MySchedule, Settings, TestManagement, HelpCenter } from '.';
import authService from '../../services/authService';
import api from '../../services/api';

interface HrLayoutProps {
  children?: ReactNode;
  activeTab?: string;
}

const HrLayout: React.FC<HrLayoutProps> = ({ children, activeTab = 'dashboard' }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleNotif = () => setNotifOpen(!notifOpen);
  
  const handleMarkMessagesAsRead = () => {
    setHasUnreadMessages(false);
  };

  const handleLogoutClick = () => {
    // Clear auth data immediately
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    
    // Call logout API in background (don't wait for it)
    authService.logout().catch(error => {
      console.error('Logout API error:', error);
    });
    
    // Redirect to home immediately
    navigate('/');
    
    // Reload page to reset all app state
    window.location.reload();
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
        return <Settings />;
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
      <div className="w-64 bg-white shadow-lg min-h-screen border-l border-r-0 border-gray-200 sticky top-0 z-10 flex flex-col overflow-y-auto">
        <DashboardSidebar 
          activeTab={activeTab} 
          hasUnreadMessages={hasUnreadMessages} 
          onNavigate={handleMarkMessagesAsRead}
          onLogoutClick={handleLogoutClick}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-visible bg-white">
        <HrHeader 
          notifOpen={notifOpen} 
          hasUnread={hasUnread} 
          toggleNotif={toggleNotif} 
          onCloseNotif={() => setNotifOpen(false)}
          onMarkAllAsRead={() => setHasUnread(false)}
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