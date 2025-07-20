import React from 'react';
import { useLocation } from 'react-router-dom';
import HrDashboardSidebar from './DashboardSidebar';

interface HrLayoutProps {
  children: React.ReactNode;
}

const HrLayout: React.FC<HrLayoutProps> = ({ children }) => {
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/hr/job-management')) return 'job-management';
    if (path.startsWith('/hr/job-applications')) return 'job-applications';
    if (path.startsWith('/hr/company-profile')) return 'company-profile';
    if (path.startsWith('/hr/settings')) return 'settings';
    return 'dashboard';
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <HrDashboardSidebar activeTab={getActiveTab()} />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default HrLayout; 