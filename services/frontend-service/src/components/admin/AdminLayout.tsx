import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import Logo from '../../assets/Logo.png';


interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
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


  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-64 bg-white shadow-lg min-h-screen border-l border-r border-gray-200 sticky top-0 z-10 flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <button onClick={handleDashboardClick} className="flex items-center">
            <img src={Logo} alt="Logo" className="h-8 w-auto" />
          </button>
        </div>

        {/* Sidebar */}
        <DashboardSidebar
          activeTab={getActiveTab()}
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