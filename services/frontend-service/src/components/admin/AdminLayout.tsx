import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import Logo from '../../assets/Logo.png';
import LogoTab from '../../assets/Logo_tab.png';


interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize isCollapsed from localStorage, default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Save isCollapsed to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isCollapsed));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [isCollapsed]);
  
  // Get active tab from current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/candidates') || path.startsWith('/admin/hr') || path.startsWith('/admin/accounts')) return 'accounts';
    if (path.startsWith('/admin/job-listings')) return 'job-listings';
    if (path.startsWith('/admin/questions')) return 'questions';
    if (path.startsWith('/admin/statistics')) return 'statistics';
    if (path.startsWith('/admin/activity-log')) return 'activity-log';
    if (path.startsWith('/admin/settings')) return 'settings';
    if (path.startsWith('/admin/feedback')) return 'feedback';
    return 'dashboard';
  };

  // Navigation handlers
  const handleDashboardClick = () => navigate('/admin/dashboard');
  const handleJobListingsClick = () => navigate('/admin/job-listings');
  const handleCandidatesClick = () => navigate('/admin/accounts');
  const handleQuestionsClick = () => navigate('/admin/questions');
  const handleStatisticsClick = () => navigate('/admin/statistics');
  const handleActivityLogClick = () => navigate('/admin/activity-log');
  const handleSettingsClick = () => navigate('/admin/settings');
  const handleFeedbackClick = () => navigate('/admin/feedback');

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg min-h-screen border-l border-r border-gray-200 sticky top-0 z-10 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300`}>
        {/* Logo */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} transition-all duration-300`}>
          {!isCollapsed && (
            <button onClick={handleDashboardClick} className="flex items-center">
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

        {/* Sidebar */}
        <DashboardSidebar
          activeTab={getActiveTab()}
          isCollapsed={isCollapsed}
          onDashboardClick={handleDashboardClick}
          onJobListingsClick={handleJobListingsClick}
          onCandidatesClick={handleCandidatesClick}
          onQuestionsClick={handleQuestionsClick}
          onStatisticsClick={handleStatisticsClick}
          onActivityLogClick={handleActivityLogClick}
          onSettingsClick={handleSettingsClick}
          onFeedbackClick={handleFeedbackClick}
        />
      </div>
      <div className="flex-1 overflow-visible bg-white">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout; 