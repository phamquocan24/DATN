import React from 'react';
import AdminLayout from './AdminLayout';
import CompanyProfile from '../candidate/CompanyProfile';

const AdminCompanyProfile: React.FC = () => {
  // In real app we would fetch companyId from params and pass
  return (
    <AdminLayout>
      <CompanyProfile companyId="1" onBack={() => window.history.back()} />
    </AdminLayout>
  );
};

export default AdminCompanyProfile; 