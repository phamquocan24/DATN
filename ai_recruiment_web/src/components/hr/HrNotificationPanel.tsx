import React, { useState } from 'react';
import man1 from '../../assets/man1.png';
import man2 from '../../assets/man2.png';

interface Notification {
  id: number;
  type: 'interview' | 'status';
  avatar: string;
  name: string;
  message: string;
  time: string;
  status?: 'New' | 'Shortlisted';
  isRead: boolean;
  interviewDetails?: {
    position: string;
    date: string;
    time: string;
    email: string;
  };
}

interface HrNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllAsRead?: () => void;
}

const HrNotificationPanel: React.FC<HrNotificationPanelProps> = ({ isOpen, onClose, onMarkAllAsRead }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'interview',
      avatar: man1,
      name: 'John Doe',
      message: 'invited you to an interview for the Frontend Developer role.',
      time: '10 mins ago',
      status: 'New',
      isRead: false,
      interviewDetails: {
        position: 'Frontend Developer',
        date: 'Mon, 21 July 2021',
        time: '10 AM - 11 AM',
        email: 'john.doe@example.com'
      }
    },
    {
      id: 2,
      type: 'status',
      avatar: man2,
      name: 'Jane Smith',
      message: 'updated your application status for the UI/UX Designer role.',
      time: '2 days ago',
      status: 'Shortlisted',
      isRead: true,
    }
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[480px] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button onClick={handleMarkAllAsRead} className="text-sm text-[#007BFF] hover:text-[#0056b3] font-medium">
            Mark all as read
          </button>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <img src={notification.avatar} alt="avatar" className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{notification.name}</p>
                    {notification.status && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        notification.status === 'New' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {notification.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1 break-words">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                  
                  {notification.interviewDetails && (
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-[#007BFF] rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m5 0a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12zM9 7h6" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          Interview Details
                        </h4>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <img
                            src={notification.avatar}
                            alt={notification.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {notification.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {notification.interviewDetails.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {!notification.isRead && <div className="w-2 h-2 bg-[#007BFF] rounded-full flex-shrink-0 mt-1"></div>}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 text-center border-t border-gray-200">
          <a href="#" className="text-sm text-[#007BFF] hover:text-[#0056b3] font-medium">
            View all notifications
          </a>
        </div>
      </div>
    </>
  );
};

export default HrNotificationPanel; 