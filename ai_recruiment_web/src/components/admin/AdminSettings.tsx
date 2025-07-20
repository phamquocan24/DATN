import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminMyProfileSettings from './AdminMyProfileSettings';
import AdminLoginDetailsSettings from './AdminLoginDetailsSettings';
import AdminNotificationsSettings from './AdminNotificationsSettings';
import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-profile' | 'login-details' | 'notifications'>('my-profile');
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const navigate = useNavigate();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-profile':
        return <AdminMyProfileSettings />;
      case 'login-details':
        return <AdminLoginDetailsSettings />;
      case 'notifications':
        return <AdminNotificationsSettings />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50"
            >
              Back to homepage
            </button>
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative focus:outline-none">
                <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
                {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={() => setHasUnread(false)} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('my-profile')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'my-profile'
                  ? 'border-[#007BFF] text-[#007BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('login-details')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'login-details'
                  ? 'border-[#007BFF] text-[#007BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Login Details
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'notifications'
                  ? 'border-[#007BFF] text-[#007BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings; 