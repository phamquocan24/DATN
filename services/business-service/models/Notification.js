const { BaseModel } = require('./Database');
const winston = require('winston');

// Setup logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/notification.log' })
  ]
});

class Notification extends BaseModel {
  constructor() {
    super('notifications', 'notification_id');
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData) {
    try {
      const {
        user_id,
        title,
        message,
        type,
        data,
        priority,
        send_email,
        send_sms
      } = notificationData;

      // Validate required fields
      if (!user_id || !title || !message || !type) {
        throw new Error('User ID, title, message, and type are required');
      }

      const query = `
        INSERT INTO notifications (
          user_id, title, message, type, data, priority, send_email, send_sms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        user_id,
        title,
        message,
        type,
        JSON.stringify(data || {}),
        priority || 'MEDIUM',
        send_email || false,
        send_sms || false
      ];

      const result = await this.db.query(query, values, 'create_notification');
      const notification = result.rows[0];

      logger.info('Notification created successfully', {
        notification_id: notification.notification_id,
        user_id,
        type,
        title
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        is_read,
        type,
        priority,
        page = 1,
        limit = 20,
        orderBy = 'created_at',
        direction = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      const conditions = ['user_id = $1'];
      const values = [userId];
      let paramIndex = 2;

      if (is_read !== undefined) {
        conditions.push(`is_read = $${paramIndex}`);
        values.push(is_read);
        paramIndex++;
      }

      if (type) {
        conditions.push(`type = $${paramIndex}`);
        values.push(type);
        paramIndex++;
      }

      if (priority) {
        conditions.push(`priority = $${paramIndex}`);
        values.push(priority);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM notifications
        WHERE ${whereClause}
      `;

      const countResult = await this.db.query(countQuery, values, 'count_user_notifications');
      const total = parseInt(countResult.rows[0].total);

      // Get notifications
      const query = `
        SELECT *
        FROM notifications
        WHERE ${whereClause}
        ORDER BY ${orderBy} ${direction}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.query(query, values, 'get_user_notifications');

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE notification_id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [notificationId, userId], 'mark_notification_read');

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      logger.info('Notification marked as read', {
        notification_id: notificationId,
        user_id: userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      // First get count of unread notifications
      const countQuery = `
        SELECT COUNT(*) as unread_count
        FROM notifications
        WHERE user_id = $1 AND is_read = false
      `;
      
      const countResult = await this.db.query(countQuery, [userId], 'count_unread_notifications');
      const updatedCount = parseInt(countResult.rows[0]?.unread_count || 0);

      // Then update them
      const updateQuery = `
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE user_id = $1 AND is_read = false
      `;

      await this.db.query(updateQuery, [userId], 'mark_all_notifications_read');

      logger.info('All notifications marked as read', {
        user_id: userId,
        updated_count: updatedCount
      });

      return updatedCount;
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE notification_id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [notificationId, userId], 'delete_notification');

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      logger.info('Notification deleted successfully', {
        notification_id: notificationId,
        user_id: userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(*) FILTER (WHERE is_read = false) as unread_count,
          COUNT(*) FILTER (WHERE is_read = true) as read_count,
          COUNT(*) FILTER (WHERE type = 'APPLICATION_UPDATE') as application_updates,
          COUNT(*) FILTER (WHERE type = 'INTERVIEW_SCHEDULED') as interview_notifications,
          COUNT(*) FILTER (WHERE type = 'TEST_ASSIGNED') as test_notifications,
          COUNT(*) FILTER (WHERE type = 'JOB_MATCH') as job_matches,
          COUNT(*) FILTER (WHERE type = 'SYSTEM_UPDATE') as system_updates,
          COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority,
          COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium_priority,
          COUNT(*) FILTER (WHERE priority = 'LOW') as low_priority
        FROM notifications
        WHERE user_id = $1
      `;

      const result = await this.db.query(query, [userId], 'get_notification_stats');
      return result.rows[0] || {};
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * Create application status update notification
   */
  async createApplicationStatusNotification(applicationId, oldStatus, newStatus, candidateId, changedBy, reason = '') {
    try {
      const statusMessages = {
        'PENDING': 'Your application is being reviewed',
        'REVIEWING': 'Your application is under review',
        'SHORTLISTED': 'Congratulations! You have been shortlisted',
        'INTERVIEWING': 'You have been selected for an interview',
        'TESTING': 'You have been assigned a test',
        'OFFERED': 'Congratulations! You have received a job offer',
        'HIRED': 'Congratulations! You have been hired',
        'REJECTED': 'Your application has been rejected',
        'WITHDRAWN': 'Your application has been withdrawn'
      };

      const title = `Application Status Update - ${newStatus}`;
      const message = statusMessages[newStatus] || `Your application status has been updated to ${newStatus}`;

      const notificationData = {
        user_id: candidateId,
        title,
        message: reason ? `${message}. ${reason}` : message,
        type: 'APPLICATION_UPDATE',
        data: {
          application_id: applicationId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: changedBy,
          reason
        },
        priority: ['OFFERED', 'HIRED', 'REJECTED'].includes(newStatus) ? 'HIGH' : 'MEDIUM',
        send_email: true
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Failed to create application status notification:', error);
      throw error;
    }
  }

  /**
   * Create interview scheduled notification
   */
  async createInterviewScheduledNotification(applicationId, candidateId, interviewDate, interviewDetails = {}) {
    try {
      const title = 'Interview Scheduled';
      const message = `You have been scheduled for an interview on ${new Date(interviewDate).toLocaleDateString()}`;

      const notificationData = {
        user_id: candidateId,
        title,
        message,
        type: 'INTERVIEW_SCHEDULED',
        data: {
          application_id: applicationId,
          interview_date: interviewDate,
          ...interviewDetails
        },
        priority: 'HIGH',
        send_email: true,
        send_sms: true
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Failed to create interview scheduled notification:', error);
      throw error;
    }
  }

  /**
   * Create test assigned notification
   */
  async createTestAssignedNotification(testId, candidateId, applicationId, testName, assignedBy) {
    try {
      const title = 'Test Assigned';
      const message = `You have been assigned a test: ${testName}`;

      const notificationData = {
        user_id: candidateId,
        title,
        message,
        type: 'TEST_ASSIGNED',
        data: {
          test_id: testId,
          application_id: applicationId,
          test_name: testName,
          assigned_by: assignedBy
        },
        priority: 'HIGH',
        send_email: true
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Failed to create test assigned notification:', error);
      throw error;
    }
  }

  /**
   * Create job match notification
   */
  async createJobMatchNotification(candidateId, jobId, jobTitle, matchScore, companyName) {
    try {
      const title = 'New Job Match';
      const message = `We found a job that matches your profile: ${jobTitle} at ${companyName} (${matchScore}% match)`;

      const notificationData = {
        user_id: candidateId,
        title,
        message,
        type: 'JOB_MATCH',
        data: {
          job_id: jobId,
          job_title: jobTitle,
          company_name: companyName,
          match_score: matchScore
        },
        priority: matchScore >= 80 ? 'HIGH' : 'MEDIUM',
        send_email: matchScore >= 70
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Failed to create job match notification:', error);
      throw error;
    }
  }

  /**
   * Create new application notification for HR
   */
  async createNewApplicationNotification(applicationId, jobId, candidateId, hrUserId, jobTitle, candidateName) {
    try {
      const title = 'New Application Received';
      const message = `${candidateName} has applied for the position: ${jobTitle}`;

      const notificationData = {
        user_id: hrUserId,
        title,
        message,
        type: 'NEW_APPLICATION',
        data: {
          application_id: applicationId,
          job_id: jobId,
          candidate_id: candidateId,
          job_title: jobTitle,
          candidate_name: candidateName
        },
        priority: 'MEDIUM',
        send_email: true
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Failed to create new application notification:', error);
      throw error;
    }
  }

  /**
   * Create system update notification
   */
  async createSystemUpdateNotification(userIds, title, message, data = {}) {
    try {
      const notifications = [];

      for (const userId of userIds) {
        const notificationData = {
          user_id: userId,
          title,
          message,
          type: 'SYSTEM_UPDATE',
          data,
          priority: 'LOW',
          send_email: false
        };

        const notification = await this.createNotification(notificationData);
        notifications.push(notification);
      }

      logger.info('System update notifications created', {
        count: notifications.length,
        title
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to create system update notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      // First count how many will be deleted
      const countQuery = `
        SELECT COUNT(*) as delete_count
        FROM notifications 
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        AND is_read = true
      `;

      const countResult = await this.db.query(countQuery, [], 'count_old_notifications');
      const deletedCount = parseInt(countResult.rows[0]?.delete_count || 0);

      // Then delete them
      const deleteQuery = `
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        AND is_read = true
      `;

      await this.db.query(deleteQuery, [], 'cleanup_old_notifications');

      logger.info('Old notifications cleaned up', {
        deleted_count: deletedCount,
        days_old: daysOld
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId, userId) {
    try {
      const query = `
        SELECT *
        FROM notifications
        WHERE notification_id = $1 AND user_id = $2
      `;

      const result = await this.db.query(query, [notificationId, userId], 'get_notification_by_id');

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get notification by ID:', error);
      throw error;
    }
  }

  /**
   * Bulk create notifications
   */
  async bulkCreateNotifications(notifications) {
    try {
      const values = [];
      const valueStrings = [];
      
      notifications.forEach((notification, index) => {
        const offset = index * 8;
        valueStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        values.push(
          notification.user_id,
          notification.title,
          notification.message,
          notification.type,
          JSON.stringify(notification.data || {}),
          notification.priority || 'MEDIUM',
          notification.send_email || false,
          notification.send_sms || false
        );
      });

      const query = `
        INSERT INTO notifications (user_id, title, message, type, data, priority, send_email, send_sms)
        VALUES ${valueStrings.join(', ')}
        RETURNING *
      `;

      const result = await this.db.query(query, values, 'bulk_create_notifications');

      logger.info('Bulk notifications created successfully', {
        count: result.rows.length
      });

      return result.rows;
    } catch (error) {
      logger.error('Failed to bulk create notifications:', error);
      throw error;
    }
  }
}

module.exports = Notification; 