import React from 'react';
import { useNavigate } from 'react-router-dom';
import bellIcon from '../../assets/bell-outlined.png';
import nomadIcon from '../../assets/Nomad.png';
import { HrNotificationPanel } from '.';

interface HrHeaderProps {
  notifOpen: boolean;
  hasUnread: boolean;
  toggleNotif: () => void;
  onCloseNotif: () => void;
  onMarkAllAsRead: () => void;
}

const HrHeader: React.FC<HrHeaderProps> = ({ notifOpen, hasUnread, toggleNotif, onCloseNotif, onMarkAllAsRead }) => {
  const navigate = useNavigate();

  return (
    <div className="px-8 pt-7 bg-white" style={{ fontFamily: 'ABeeZee, sans-serif' }}>
      <header className="flex justify-between items-center">
        <div className="flex items-center text-left">
          <img src={nomadIcon} alt="Company Logo" className="h-10 w-10 mr-3" />
          <div className="flex items-center">
            <div>
              <p className="text-gray-500 text-sm">Company</p>
              <h1 className="text-lg font-medium">Nomad</h1>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
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