import { useState, useEffect, useCallback } from 'react';
import candidateApi from '../services/candidateApi';

interface UseCandidateNotificationsReturn {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshUnreadCount: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useCandidateNotifications = (): UseCandidateNotificationsReturn => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await candidateApi.getUnreadNotificationCount();
      
      // Handle different response structures
      const count = response.data?.unread_count ?? response.data?.count ?? response.unread_count ?? response.count ?? 0;
      setUnreadCount(count);
      
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
      
      // If API fails, try to get notifications and count unread
      try {
        const notificationsResponse = await candidateApi.getNotifications({ 
          limit: 100 
        });
        
        const notifications = notificationsResponse.data ?? notificationsResponse;
        const unreadNotifications = Array.isArray(notifications) 
          ? notifications.filter(notif => !notif.is_read) 
          : [];
        const count = unreadNotifications.length;
        setUnreadCount(count);
        setError(null);
        
      } catch (fallbackErr: any) {
        console.error('Fallback count fetch failed:', fallbackErr);
        setError('Failed to load notification count');
        setUnreadCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await candidateApi.markAllNotificationsAsRead();
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      // Still refresh count in case some were marked as read
      await fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // Initial load
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    error,
    refreshUnreadCount,
    markAllAsRead
  };
};
