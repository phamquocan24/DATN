import React from 'react';
import { useNavigate } from 'react-router-dom';
import bellIcon from '../../assets/bell-outlined.png';
import { HrNotificationPanel } from '.';
import HrHeaderDropdown from './HrHeaderDropdown';

interface HrHeaderProps {
  notifOpen: boolean;
  hasUnread: boolean;
  toggleNotif: () => void;
  onCloseNotif: () => void;
  onMarkAllAsRead: () => void;
  currentUser?: any;
}

const HrHeader: React.FC<HrHeaderProps> = ({ notifOpen, hasUnread, toggleNotif, onCloseNotif, onMarkAllAsRead, currentUser }) => {
  const navigate = useNavigate();

  return (
    <div className="px-8 pt-7 bg-white" style={{ fontFamily: 'ABeeZee, sans-serif' }}>
      <header className="flex justify-between items-center">
        <div className="flex items-center text-left">
          <HrHeaderDropdown currentUser={currentUser} />
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button onClick={toggleNotif} className="p-2 focus:outline-none">
              <img src={bellIcon} alt="Notifications" className="w-5 h-5" />
              {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
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