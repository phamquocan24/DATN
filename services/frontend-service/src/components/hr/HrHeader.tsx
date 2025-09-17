import React from 'react';
import { useNavigate } from 'react-router-dom';
import bellIcon from '../../assets/bell-outlined.png';
import { HrNotificationPanel } from '.';
import HrHeaderDropdown from './HrHeaderDropdown';

interface HrHeaderProps {
  notifOpen: boolean;
  hasUnread: boolean;
  unreadCount?: number;
  toggleNotif: () => void;
  onCloseNotif: () => void;
  onMarkAllAsRead: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

const HrHeader: React.FC<HrHeaderProps> = ({ notifOpen, hasUnread, unreadCount = 0, toggleNotif, onCloseNotif, onMarkAllAsRead, currentUser, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="px-8 pt-7 bg-white" style={{ fontFamily: 'ABeeZee, sans-serif' }}>
      <header className="flex justify-between items-center">
        <div className="flex items-center text-left">
          <HrHeaderDropdown currentUser={currentUser} onLogout={onLogout} />
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button onClick={toggleNotif} className="p-2 focus:outline-none relative">
              <img src={bellIcon} alt="Notifications" className="w-5 h-5" />
              {hasUnread && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <HrNotificationPanel isOpen={notifOpen} onClose={onCloseNotif} onMarkAllAsRead={onMarkAllAsRead} />
          </div>
          <button onClick={() => navigate('/hr/post-job')} className="bg-[#007BFF] text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center">
            <span className="mr-2 text-lg leading-none">+</span>
            Post a job
          </button>
        </div>
      </header>
    </div>
  );
};

export default HrHeader; 