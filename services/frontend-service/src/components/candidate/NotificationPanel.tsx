import React, { useState } from 'react';
import Avatar from '../../assets/Avatar17.png';
import man1 from '../../assets/man1.png';
import man2 from '../../assets/man2.png';

interface Notification {
  id: number;
  type: 'interview' | 'status' | 'message';
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

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'header' | 'dashboard'; // New prop to determine positioning
  onMarkAllAsRead?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, position = 'header', onMarkAllAsRead }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'interview',
      avatar: man1,
      name: 'Jan Mayer',
      message: 'invited you to interview with Nomad',
      time: '12 mins ago',
      status: 'New',
      isRead: false,
      interviewDetails: {
        position: 'Social Media Manager Role',
        date: 'Mon, 20 July 2021',
        time: '12 PM - 12:30 PM',
        email: 'jakegyll@email.com'
      }
    },
    {
      id: 2,
      type: 'status',
      avatar: man2,
      name: 'Jana Alicia',
      message: 'from Udacity updated your job applications status',
      time: '3 days ago',
      status: 'Shortlisted',
      isRead: false
    },
    {
      id: 3,
      type: 'interview',
      avatar: Avatar,
      name: 'Ally Wales',
      message: 'from Digital Ocean sent you an interview invitation',
      time: '14 July 2021 • 3:26 PM',
      isRead: true,
      interviewDetails: {
        position: 'Frontend Developer Role',
        date: 'Thu, 22 July 2021',
        time: '2 PM - 2:30 PM',
        email: 'ally.wales@digitalocean.com'
      }
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    onMarkAllAsRead?.(); // Call parent callback to hide red dot
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  if (!isOpen) return null;

  // Different positioning based on where it's used
  const positionClasses = position === 'header' 
    ? 'absolute top-full left-0 mt-2 -translate-x-full' // Shift panel fully to the left of the bell icon
    : 'fixed top-16 right-4'; // Fixed positioning for dashboard

  return (
    <>
      {/* Backdrop - for both modes to handle outside clicks */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Notification Panel */}
      <div className={`${positionClasses} w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[480px] overflow-hidden overflow-x-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={markAllAsRead}
            className="text-[#007BFF] hover:text-[#0056b3] text-sm font-medium"
          >
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto overflow-x-hidden">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <img
                  src={notification.avatar}
                  alt={notification.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0 overflow-hidden text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.name}
                    </p>
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
                  <p className="text-sm text-gray-600 mb-1 break-words">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {notification.time}
                  </p>
                  
                  {/* Interview Details Card */}
                  {notification.interviewDetails && (
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg text-left">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-[#007BFF] rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m5 0a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12zM9 7h6" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          Interview - Jake Gyll
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {notification.interviewDetails.position}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m5 0a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12zM9 7h6" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {notification.interviewDetails.date}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="text-sm font-medium text-gray-900">
                              {notification.interviewDetails.time}
                            </p>
                          </div>
                        </div>
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
                
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-[#007BFF] rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-left">
          <button className="text-[#007BFF] hover:text-[#0056b3] text-sm font-medium">
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel; 