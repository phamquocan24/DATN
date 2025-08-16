import apiClient from './api';

// Notification types
export type NotificationType = 
  | 'APPLICATION_UPDATE'
  | 'INTERVIEW_SCHEDULED'
  | 'TEST_ASSIGNED'
  | 'JOB_MATCH'
  | 'NEW_APPLICATION'
  | 'SYSTEM_UPDATE'
  | 'GENERAL';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  data?: any;
}

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  read_count: number;
  application_updates: number;
  interview_notifications: number;
  test_notifications: number;
  job_matches: number;
  system_updates: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

export interface GetNotificationsParams {
  is_read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
  orderBy?: 'created_at' | 'read_at' | 'priority';
  direction?: 'ASC' | 'DESC';
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  priority?: NotificationPriority;
  send_email?: boolean;
  send_sms?: boolean;
}

export interface NotificationResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkCreateNotificationData {
  notifications: CreateNotificationData[];
}

class NotificationAPI {
  private readonly basePath = '/api/v1/notifications';

  /**
   * Get list of notifications for authenticated user
   */
  async getNotifications(params?: GetNotificationsParams): Promise<NotificationResponse<Notification[]>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    const url = query ? `${this.basePath}?${query}` : this.basePath;
    
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get detailed notification information by ID
   */
  async getNotificationById(id: string): Promise<NotificationResponse<Notification>> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create a new notification (Admin only)
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationResponse<Notification>> {
    const response = await apiClient.post(this.basePath, data);
    return response.data;
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(id: string): Promise<NotificationResponse<Notification>> {
    const response = await apiClient.delete(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id: string): Promise<NotificationResponse<void>> {
    const response = await apiClient.put(`${this.basePath}/${id}/read`);
    return response.data;
  }

  /**
   * Mark all notifications as read for authenticated user
   */
  async markAllAsRead(): Promise<NotificationResponse<{ updated_count: number }>> {
    const response = await apiClient.put(`${this.basePath}/mark-all-read`);
    return response.data;
  }

  /**
   * Get count of unread notifications for authenticated user
   */
  async getUnreadCount(): Promise<NotificationResponse<{ unread_count: number }>> {
    const response = await apiClient.get(`${this.basePath}/unread/count`);
    return response.data;
  }

  /**
   * Get notification statistics for authenticated user
   */
  async getNotificationStats(): Promise<NotificationResponse<NotificationStats>> {
    const response = await apiClient.get(`${this.basePath}/stats`);
    return response.data;
  }

  /**
   * Get available notification types
   */
  async getNotificationTypes(): Promise<NotificationResponse<Array<{
    type: NotificationType;
    name: string;
    description: string;
  }>>> {
    const response = await apiClient.get(`${this.basePath}/types`);
    return response.data;
  }

  /**
   * Bulk create notifications (Admin only)
   */
  async bulkCreateNotifications(data: BulkCreateNotificationData): Promise<NotificationResponse<Notification[]>> {
    const response = await apiClient.post(`${this.basePath}/bulk-create`, data);
    return response.data;
  }

  /**
   * Clean up old notifications (Admin only)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<NotificationResponse<{ deleted_count: number }>> {
    const response = await apiClient.post(`${this.basePath}/cleanup`, { days_old: daysOld });
    return response.data;
  }

  // Helper methods for different notification types

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotifications({
      is_read: false,
      limit,
      orderBy: 'created_at',
      direction: 'DESC'
    });
  }

  /**
   * Get high priority notifications
   */
  async getHighPriorityNotifications(limit: number = 10): Promise<NotificationResponse<Notification[]>> {
    return this.getNotifications({
      priority: 'HIGH',
      limit,
      orderBy: 'created_at',
      direction: 'DESC'
    });
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(type: NotificationType, limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotifications({
      type,
      limit,
      orderBy: 'created_at',
      direction: 'DESC'
    });
  }

  /**
   * Get application update notifications
   */
  async getApplicationUpdates(limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotificationsByType('APPLICATION_UPDATE', limit);
  }

  /**
   * Get interview notifications 
   */
  async getInterviewNotifications(limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotificationsByType('INTERVIEW_SCHEDULED', limit);
  }

  /**
   * Get test notifications
   */
  async getTestNotifications(limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotificationsByType('TEST_ASSIGNED', limit);
  }

  /**
   * Get job match notifications
   */
  async getJobMatchNotifications(limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotificationsByType('JOB_MATCH', limit);
  }

  /**
   * Get new application notifications (HR)
   */
  async getNewApplicationNotifications(limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotificationsByType('NEW_APPLICATION', limit);
  }

  /**
   * Get system update notifications
   */
  async getSystemUpdateNotifications(limit: number = 20): Promise<NotificationResponse<Notification[]>> {
    return this.getNotificationsByType('SYSTEM_UPDATE', limit);
  }
}

// Export singleton instance
export const notificationApi = new NotificationAPI();
export default notificationApi;