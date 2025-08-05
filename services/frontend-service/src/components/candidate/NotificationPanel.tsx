import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Calendar, Clock, User, AlertCircle, Briefcase, FileText, Users, X } from 'lucide-react';
import { notificationApi, type Notification, type NotificationType } from '../../services/notificationApi';
import Avatar from '../../assets/Avatar17.png';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'header' | 'dashboard';
  onMarkAllAsRead?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, position = 'header', onMarkAllAsRead }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications on component mount
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationApi.getNotifications({
        limit: 20,
        orderBy: 'created_at',
        direction: 'DESC'
      });
      setNotifications(response.data);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif.notification_id === notificationId ? { ...notif, is_read: true, read_at: new Date().toISOString() } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ 
        ...notif, 
        is_read: true, 
        read_at: new Date().toISOString() 
      })));
      setUnreadCount(0);
      onMarkAllAsRead?.();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationId));
      loadUnreadCount(); // Refresh unread count
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Helper function to get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'APPLICATION_UPDATE':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'TEST_ASSIGNED':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'JOB_MATCH':
        return <Briefcase className="w-5 h-5 text-orange-500" />;
      case 'SYSTEM_UPDATE':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'GENERAL':
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
      default:
        return 'border-l-green-500';
    }
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
              <p className="text-xs text-gray-400 mt-1">We'll notify you when there's something new</p>
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
                            High Priority
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
                        notification.type === 'APPLICATION_UPDATE' ? 'bg-blue-100 text-blue-700' :
                        notification.type === 'INTERVIEW_SCHEDULED' ? 'bg-green-100 text-green-700' :
                        notification.type === 'TEST_ASSIGNED' ? 'bg-purple-100 text-purple-700' :
                        notification.type === 'JOB_MATCH' ? 'bg-orange-100 text-orange-700' :
                        notification.type === 'SYSTEM_UPDATE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Enhanced Details based on notification type */}
                    {notification.data && notification.type === 'INTERVIEW_SCHEDULED' && notification.data.interview_date && (
                      <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg text-left">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-5 h-5 text-green-500" />
                          <h4 className="font-semibold text-gray-900 text-sm">
                            Interview Details
                          </h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(notification.data.interview_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {notification.data.interview_time && (
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Time</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.data.interview_time}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {notification.data && notification.type === 'APPLICATION_UPDATE' && notification.data.new_status && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-600">Status: </span>
                        <span className={`font-medium ${
                          notification.data.new_status === 'HIRED' || notification.data.new_status === 'OFFERED' ? 'text-green-600' :
                          notification.data.new_status === 'REJECTED' ? 'text-red-600' :
                          notification.data.new_status === 'SHORTLISTED' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {notification.data.new_status}
                        </span>
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