const Notification = require('../models/Notification');
const winston = require('winston');
const Joi = require('joi');

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
    new winston.transports.File({ filename: 'logs/notification-controller.log' })
  ]
});

// Validation schemas
const createNotificationSchema = Joi.object({
  title: Joi.string().required().max(200),
  message: Joi.string().required().max(1000),
  type: Joi.string().valid(
    'APPLICATION_UPDATE',
    'INTERVIEW_SCHEDULED', 
    'TEST_ASSIGNED',
    'JOB_MATCH',
    'NEW_APPLICATION',
    'SYSTEM_UPDATE',
    'GENERAL'
  ).required(),
  data: Joi.object().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
  send_email: Joi.boolean().default(false),
  send_sms: Joi.boolean().default(false)
});

const getNotificationsSchema = Joi.object({
  is_read: Joi.boolean().optional(),
  type: Joi.string().valid(
    'APPLICATION_UPDATE',
    'INTERVIEW_SCHEDULED', 
    'TEST_ASSIGNED',
    'JOB_MATCH',
    'NEW_APPLICATION',
    'SYSTEM_UPDATE',
    'GENERAL'
  ).optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  orderBy: Joi.string().valid('created_at', 'read_at', 'priority').default('created_at'),
  direction: Joi.string().valid('ASC', 'DESC').default('DESC')
});

const bulkCreateSchema = Joi.object({
  notifications: Joi.array().items(Joi.object({
    user_id: Joi.string().uuid().required(),
    title: Joi.string().required().max(200),
    message: Joi.string().required().max(1000),
    type: Joi.string().valid(
      'APPLICATION_UPDATE',
      'INTERVIEW_SCHEDULED', 
      'TEST_ASSIGNED',
      'JOB_MATCH',
      'NEW_APPLICATION',
      'SYSTEM_UPDATE',
      'GENERAL'
    ).required(),
    data: Joi.object().optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
    send_email: Joi.boolean().default(false),
    send_sms: Joi.boolean().default(false)
  })).min(1).max(100).required()
});

class NotificationController {
  constructor() {
    this.notificationModel = new Notification();
  }

  /**
   * @swagger
   * /api/v1/notifications:
   *   get:
   *     summary: Get user notifications
   *     description: Get list of notifications for authenticated user
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: is_read
   *         schema:
   *           type: boolean
   *         description: Filter by read status
   *         example: false
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [APPLICATION_UPDATE, INTERVIEW_SCHEDULED, TEST_ASSIGNED, JOB_MATCH, NEW_APPLICATION, SYSTEM_UPDATE, GENERAL]
   *         description: Filter by notification type
   *         example: "APPLICATION_UPDATE"
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *           enum: [LOW, MEDIUM, HIGH]
   *         description: Filter by priority level
   *         example: "HIGH"
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of notifications per page
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [created_at, read_at, priority]
   *           default: created_at
   *         description: Sort field
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: Notifications retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Notifications retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getNotifications(req, res) {
    try {
      const { error, value } = getNotificationsSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const result = await this.notificationModel.getUserNotifications(req.user.user_id, value);

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/{id}:
   *   get:
   *     summary: Get notification by ID
   *     description: Get detailed notification information by ID (user can only access their own notifications)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Notification ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Notification retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Notification retrieved successfully"
   *                 data:
   *                   $ref: '#/components/schemas/NotificationDetail'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Notification not found or access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;

      const notification = await this.notificationModel.getNotificationById(id, req.user.user_id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification retrieved successfully',
        data: notification
      });
    } catch (error) {
      logger.error('Failed to get notification by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications:
   *   post:
   *     summary: Create notification
   *     description: Create a new notification (Admin only)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - title
   *               - message
   *               - type
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               title:
   *                 type: string
   *                 maxLength: 200
   *                 example: "Application Status Update"
   *               message:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Your application has been reviewed and moved to the next stage."
   *               type:
   *                 type: string
   *                 enum: [APPLICATION_UPDATE, INTERVIEW_SCHEDULED, TEST_ASSIGNED, JOB_MATCH, NEW_APPLICATION, SYSTEM_UPDATE, GENERAL]
   *                 example: "APPLICATION_UPDATE"
   *               data:
   *                 type: object
   *                 description: Additional notification data
   *                 example: {"application_id": "123e4567-e89b-12d3-a456-426614174001"}
   *               priority:
   *                 type: string
   *                 enum: [LOW, MEDIUM, HIGH]
   *                 default: MEDIUM
   *                 example: "HIGH"
   *               send_email:
   *                 type: boolean
   *                 default: false
   *                 example: true
   *               send_sms:
   *                 type: boolean
   *                 default: false
   *                 example: false
   *     responses:
   *       201:
   *         description: Notification created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Notification created successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Notification'
   *       400:
   *         description: Validation failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async createNotification(req, res) {
    try {
      const { error, value } = createNotificationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const { user_id } = req.body;
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const notificationData = {
        user_id,
        ...value
      };

      const notification = await this.notificationModel.createNotification(notificationData);

      logger.info('Notification created successfully', {
        notification_id: notification.notification_id,
        user_id,
        type: value.type,
        created_by: req.user.user_id
      });

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      logger.error('Failed to create notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/{id}/read:
   *   put:
   *     summary: Mark notification as read
   *     description: Mark a specific notification as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Notification ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Notification marked as read successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Notification marked as read successfully"
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Notification not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await this.notificationModel.markAsRead(id, req.user.user_id);

      logger.info('Notification marked as read', {
        notification_id: id,
        user_id: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/mark-all-read:
   *   put:
   *     summary: Mark all notifications as read
   *     description: Mark all notifications as read for authenticated user
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "All notifications marked as read"
   *                 data:
   *                   type: object
   *                   properties:
   *                     updated_count:
   *                       type: number
   *                       example: 12
   *                       description: "Number of notifications marked as read"
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async markAllAsRead(req, res) {
    try {
      const updatedCount = await this.notificationModel.markAllAsRead(req.user.user_id);

      logger.info('All notifications marked as read', {
        user_id: req.user.user_id,
        updated_count: updatedCount
      });

      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: { updated_count: updatedCount }
      });
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/{id}:
   *   delete:
   *     summary: Delete notification
   *     description: Delete a specific notification (user can only delete their own notifications)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Notification ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Notification deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Notification deleted successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Notification'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Notification not found or access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * DELETE /api/v1/notifications/:id - Delete notification
   * Requires: Any authenticated user (own notifications)
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      const notification = await this.notificationModel.deleteNotification(id, req.user.user_id);

      logger.info('Notification deleted successfully', {
        notification_id: id,
        user_id: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Notification deleted successfully',
        data: notification
      });
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/notifications/stats - Get notification statistics
   * Requires: Any authenticated user (own stats)
   */
  async getNotificationStats(req, res) {
    try {
      const stats = await this.notificationModel.getNotificationStats(req.user.user_id);

      res.json({
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification stats',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/notifications/bulk-create - Create multiple notifications
   * Requires: ADMIN role
   */
  async bulkCreateNotifications(req, res) {
    try {
      const { error, value } = bulkCreateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const notifications = await this.notificationModel.bulkCreateNotifications(value.notifications);

      logger.info('Bulk notifications created successfully', {
        count: notifications.length,
        created_by: req.user.user_id
      });

      res.status(201).json({
        success: true,
        message: 'Notifications created successfully',
        data: notifications
      });
    } catch (error) {
      logger.error('Failed to bulk create notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notifications',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/unread-count:
   *   get:
   *     summary: Get unread notifications count
   *     description: Get count of unread notifications for authenticated user
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Unread count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Unread count retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     unread_count:
   *                       type: number
   *                       example: 5
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getUnreadCount(req, res) {
    try {
      const stats = await this.notificationModel.getNotificationStats(req.user.user_id);

      res.json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: {
          unread_count: stats.unread_count || 0
        }
      });
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/notifications/cleanup - Clean up old notifications
   * Requires: ADMIN role
   */
  async cleanupOldNotifications(req, res) {
    try {
      const { days_old = 30 } = req.body;

      const deletedCount = await this.notificationModel.cleanupOldNotifications(days_old);

      logger.info('Old notifications cleaned up', {
        deleted_count: deletedCount,
        days_old,
        initiated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Old notifications cleaned up successfully',
        data: { deleted_count: deletedCount }
      });
    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old notifications',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/notifications/types - Get notification types
   * Requires: Any authenticated user
   */
  async getNotificationTypes(req, res) {
    try {
      const types = [
        {
          type: 'APPLICATION_UPDATE',
          name: 'Application Updates',
          description: 'Updates about your job applications'
        },
        {
          type: 'INTERVIEW_SCHEDULED',
          name: 'Interview Scheduled',
          description: 'Notifications about scheduled interviews'
        },
        {
          type: 'TEST_ASSIGNED',
          name: 'Test Assigned',
          description: 'Notifications about assigned tests'
        },
        {
          type: 'JOB_MATCH',
          name: 'Job Matches',
          description: 'Notifications about jobs that match your profile'
        },
        {
          type: 'NEW_APPLICATION',
          name: 'New Applications',
          description: 'Notifications about new job applications (HR only)'
        },
        {
          type: 'SYSTEM_UPDATE',
          name: 'System Updates',
          description: 'System updates and announcements'
        },
        {
          type: 'GENERAL',
          name: 'General',
          description: 'General notifications'
        }
      ];

      res.json({
        success: true,
        message: 'Notification types retrieved successfully',
        data: types
      });
    } catch (error) {
      logger.error('Failed to get notification types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification types',
        error: error.message
      });
    }
  }

  /**
   * Helper method to create application status notification
   */
  async createApplicationStatusNotification(applicationId, oldStatus, newStatus, candidateId, changedBy, reason) {
    try {
      return await this.notificationModel.createApplicationStatusNotification(
        applicationId, oldStatus, newStatus, candidateId, changedBy, reason
      );
    } catch (error) {
      logger.error('Failed to create application status notification:', error);
      throw error;
    }
  }

  /**
   * Helper method to create interview scheduled notification
   */
  async createInterviewScheduledNotification(applicationId, candidateId, interviewDate, interviewDetails) {
    try {
      return await this.notificationModel.createInterviewScheduledNotification(
        applicationId, candidateId, interviewDate, interviewDetails
      );
    } catch (error) {
      logger.error('Failed to create interview scheduled notification:', error);
      throw error;
    }
  }

  /**
   * Helper method to create test assigned notification
   */
  async createTestAssignedNotification(testId, candidateId, applicationId, testName, assignedBy) {
    try {
      return await this.notificationModel.createTestAssignedNotification(
        testId, candidateId, applicationId, testName, assignedBy
      );
    } catch (error) {
      logger.error('Failed to create test assigned notification:', error);
      throw error;
    }
  }

  /**
   * Helper method to create job match notification
   */
  async createJobMatchNotification(candidateId, jobId, jobTitle, matchScore, companyName) {
    try {
      return await this.notificationModel.createJobMatchNotification(
        candidateId, jobId, jobTitle, matchScore, companyName
      );
    } catch (error) {
      logger.error('Failed to create job match notification:', error);
      throw error;
    }
  }

  /**
   * Helper method to create new application notification
   */
  async createNewApplicationNotification(applicationId, jobId, candidateId, hrUserId, jobTitle, candidateName) {
    try {
      return await this.notificationModel.createNewApplicationNotification(
        applicationId, jobId, candidateId, hrUserId, jobTitle, candidateName
      );
    } catch (error) {
      logger.error('Failed to create new application notification:', error);
      throw error;
    }
  }
}

// Create Express router
const express = require('express');
const { authenticateToken, requireRole } = require('../modules/auth');
const router = express.Router();
const notificationController = new NotificationController();

// Routes (order matters - more specific routes first)
router.get('/unread/count', authenticateToken, notificationController.getUnreadCount.bind(notificationController));
router.get('/types', authenticateToken, notificationController.getNotificationTypes.bind(notificationController));
router.put('/mark-all-read', authenticateToken, notificationController.markAllAsRead.bind(notificationController));
router.post('/bulk-create', authenticateToken, requireRole(['ADMIN']), notificationController.bulkCreateNotifications.bind(notificationController));
router.get('/stats', authenticateToken, notificationController.getNotificationStats.bind(notificationController));
router.get('/', authenticateToken, notificationController.getNotifications.bind(notificationController));
router.get('/:id', authenticateToken, notificationController.getNotificationById.bind(notificationController));
router.post('/', authenticateToken, requireRole(['ADMIN']), notificationController.createNotification.bind(notificationController));
router.put('/:id/read', authenticateToken, notificationController.markAsRead.bind(notificationController));
router.delete('/:id', authenticateToken, notificationController.deleteNotification.bind(notificationController));

module.exports = router; 