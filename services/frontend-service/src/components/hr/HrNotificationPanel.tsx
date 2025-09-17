import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Briefcase, FileText, Users, X, Calendar, CheckCircle } from 'lucide-react';
import hrApi from '../../services/hrApi';

interface HrNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllAsRead?: () => void;
}

interface Notification {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  action_url?: string;
  action_type?: string;
  data?: any;
}

const HrNotificationPanel: React.FC<HrNotificationPanelProps> = ({ 
  isOpen, 
  onClose, 
  onMarkAllAsRead 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications on component mount
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await hrApi.getNotifications({
        limit: 20,
        orderBy: 'created_at',
        direction: 'DESC'
      });
      
      // Handle different response structures
      const notificationData = response.data ?? response;
      setNotifications(Array.isArray(notificationData) ? notificationData : []);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await hrApi.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif.notification_id === notificationId ? { 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        } : notif
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await hrApi.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(notif => ({ 
        ...notif, 
        is_read: true, 
        read_at: new Date().toISOString() 
      })));
      onMarkAllAsRead?.();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await hrApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Helper function to get notification icon (HR-focused)
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'APPLICATION_UPDATE':
      case 'NEW_APPLICATION':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'JOB_ALERT':
      case 'JOB_UPDATE':
        return <Briefcase className="w-5 h-5 text-orange-500" />;
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_UPDATE':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'CANDIDATE_UPDATE':
        return <Users className="w-5 h-5 text-teal-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500';
      case 'MEDIUM':
        return 'border-l-yellow-500';
      case 'LOW':
        return 'border-l-green-500';
      case 'URGENT':
        return 'border-l-red-600';
      case 'NORMAL':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Notification Panel */}
      <div className="absolute top-full right-0 mt-2 translate-x-20 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[480px] overflow-hidden overflow-x-hidden">
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
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF] mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={loadNotifications}
                className="text-[#007BFF] hover:text-[#0056b3] text-sm font-medium mt-2"
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">We'll notify you about new applications and updates</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.notification_id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        {notification.priority === 'HIGH' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            Priority
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.notification_id);
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Delete notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 break-words">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {formatTime(notification.created_at)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notification.type === 'ERROR' ? 'bg-red-100 text-red-700' :
                        notification.type === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                        notification.type === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        notification.type === 'INFO' ? 'bg-blue-100 text-blue-700' :
                        notification.type === 'NEW_APPLICATION' ? 'bg-purple-100 text-purple-700' :
                        notification.type === 'APPLICATION_UPDATE' ? 'bg-purple-100 text-purple-700' :
                        notification.type === 'JOB_ALERT' ? 'bg-orange-100 text-orange-700' :
                        notification.type === 'JOB_UPDATE' ? 'bg-orange-100 text-orange-700' :
                        notification.type === 'INTERVIEW_SCHEDULED' ? 'bg-indigo-100 text-indigo-700' :
                        notification.type === 'INTERVIEW_UPDATE' ? 'bg-indigo-100 text-indigo-700' :
                        notification.type === 'CANDIDATE_UPDATE' ? 'bg-teal-100 text-teal-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Enhanced Details for HR-specific notifications */}
                    {notification.data && notification.type === 'NEW_APPLICATION' && (
                      <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                        <span className="text-purple-600">New application for: </span>
                        <span className="font-medium text-purple-800">
                          {notification.data.job_title || 'Position'}
                        </span>
                        {notification.data.candidate_name && (
                          <div className="text-purple-600">
                            Candidate: <span className="font-medium text-purple-800">{notification.data.candidate_name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {notification.data && notification.type === 'INTERVIEW_SCHEDULED' && (
                      <div className="mt-2 p-2 bg-indigo-50 rounded text-sm">
                        <span className="text-indigo-600">Interview scheduled for: </span>
                        <span className="font-medium text-indigo-800">
                          {notification.data.candidate_name || 'Candidate'}
                        </span>
                        {notification.data.interview_date && (
                          <div className="text-indigo-600">
                            Date: <span className="font-medium text-indigo-800">
                              {new Date(notification.data.interview_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {notification.data && notification.type === 'APPLICATION_UPDATE' && (
                      <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                        <span className="text-purple-600">Status update: </span>
                        <span className="font-medium text-purple-800">
                          {notification.data.status || 'Updated'}
                        </span>
                        {notification.data.candidate_name && (
                          <div className="text-purple-600">
                            Candidate: <span className="font-medium text-purple-800">{notification.data.candidate_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-[#007BFF] rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HrNotificationPanel;