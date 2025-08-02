const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticateToken, requireRole } = require('../modules/auth');
const winston = require('winston');

const router = express.Router();

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
    new winston.transports.File({ filename: 'logs/admin-controller.log' })
  ]
});

// Initialize models
const userModel = new User();
const companyModel = new Company();

// Validation schemas
const updateUserStatusSchema = Joi.object({
  is_active: Joi.boolean().required().messages({
    'any.required': 'Active status is required'
  }),
  reason: Joi.string().max(500).optional()
});

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('CANDIDATE', 'RECRUITER', 'HR', 'ADMIN').required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow(''),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).optional()
});

const bulkActionSchema = Joi.object({
  user_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
  action: Joi.string().valid('activate', 'deactivate', 'delete').required(),
  reason: Joi.string().max(500).optional()
});

const searchUsersSchema = Joi.object({
  search: Joi.string().optional(),
  role: Joi.string().valid('CANDIDATE', 'RECRUITER', 'HR', 'ADMIN').optional(),
  is_active: Joi.boolean().optional(),
  created_after: Joi.date().optional(),
  created_before: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  order_by: Joi.string().valid('created_at', 'updated_at', 'full_name', 'email').default('created_at'),
  direction: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Routes

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with filtering
 *     description: Get list of all users with advanced filtering options (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *         example: "john"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CANDIDATE, RECRUITER, HR, ADMIN]
 *         description: Filter by user role
 *         example: "CANDIDATE"
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created after this date
 *         example: "2024-01-01"
 *       - in: query
 *         name: created_before
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created before this date
 *         example: "2024-12-31"
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
 *         description: Number of users per page
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, full_name, email]
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
 *         description: Users retrieved successfully
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
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
// Get all users with advanced filtering
router.get('/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error, value } = searchUsersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await userModel.getUsers(value);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USERS_RETRIEVAL_ERROR'
    });
  }
});

// Get user by ID with full details
router.get('/users/:user_id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!userModel.isValidUUID(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }

    const user = await userModel.getUserProfile(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get additional admin data
    const additionalData = {};

    // Get user's companies (if recruiter)
    if (user.role === 'RECRUITER' || user.role === 'HR') {
      try {
        const companiesQuery = `
          SELECT c.company_id, c.company_name, rp.position, rp.is_company_admin
          FROM recruiter_profiles rp
          JOIN companies c ON rp.company_id = c.company_id
          WHERE rp.user_id = $1
        `;
        const companiesResult = await userModel.query(companiesQuery, [user_id], 'get_user_companies');
        additionalData.companies = companiesResult.rows;
      } catch (error) {
        logger.warn('Failed to get user companies:', error);
      }
    }

    // Get user's recent activity
    try {
      const activityQuery = `
        SELECT 
          'login' as activity_type,
          last_login as activity_date,
          'Last login' as description
        FROM users 
        WHERE user_id = $1 AND last_login IS NOT NULL
        
        UNION ALL
        
        SELECT 
          'profile_update' as activity_type,
          updated_at as activity_date,
          'Profile updated' as description
        FROM users 
        WHERE user_id = $1
        
        ORDER BY activity_date DESC
        LIMIT 10
      `;
      const activityResult = await userModel.query(activityQuery, [user_id], 'get_user_activity');
      additionalData.recent_activity = activityResult.rows;
    } catch (error) {
      logger.warn('Failed to get user activity:', error);
    }

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: {
        user,
        ...additionalData
      }
    });

  } catch (error) {
    logger.error('Failed to get user details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USER_DETAIL_ERROR'
    });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:user_id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!userModel.isValidUUID(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }

    const { error, value } = updateUserStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { is_active, reason } = value;

    // Prevent admin from deactivating themselves
    if (user_id === req.user.user_id && !is_active) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
        code: 'SELF_DEACTIVATION_ERROR'
      });
    }

    const updatedUser = await userModel.update(user_id, { is_active });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Log admin action
    logger.info('User status updated by admin', {
      target_user_id: user_id,
      admin_id: req.user.user_id,
      is_active,
      reason
    });

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        user_id: updatedUser.user_id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        is_active: updatedUser.is_active,
        updated_at: updatedUser.updated_at
      }
    });

  } catch (error) {
    logger.error('Failed to update user status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'STATUS_UPDATE_ERROR'
    });
  }
});

// Create user (admin only)
router.post('/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const userData = {
      ...value,
      // If no password provided, user will need to set it via password reset
      password: value.password || crypto.randomBytes(16).toString('hex'),
      is_email_verified: true, // Admin-created users are pre-verified
      created_by_admin: true
    };

    const user = await userModel.createUser(userData);

    logger.info('User created by admin', {
      new_user_id: user.user_id,
      admin_id: req.user.user_id,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    logger.error('Failed to create user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USER_CREATION_ERROR'
    });
  }
});

// Bulk actions on users
router.post('/users/bulk-action', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error, value } = bulkActionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { user_ids, action, reason } = value;

    // Prevent admin from performing bulk actions on themselves
    if (user_ids.includes(req.user.user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot perform bulk actions on your own account',
        code: 'SELF_ACTION_ERROR'
      });
    }

    const results = [];
    const errors = [];

    for (const userId of user_ids) {
      try {
        let result;
        switch (action) {
          case 'activate':
            result = await userModel.update(userId, { is_active: true });
            break;
          case 'deactivate':
            result = await userModel.update(userId, { is_active: false });
            break;
          case 'delete':
            // Soft delete
            result = await userModel.update(userId, { is_active: false, deleted_at: new Date() });
            break;
          default:
            throw new Error('Invalid action');
        }

        if (result) {
          results.push({
            user_id: userId,
            success: true,
            action
          });
        } else {
          errors.push({
            user_id: userId,
            error: 'User not found'
          });
        }
      } catch (error) {
        errors.push({
          user_id: userId,
          error: error.message
        });
      }
    }

    logger.info('Bulk action performed by admin', {
      admin_id: req.user.user_id,
      action,
      target_count: user_ids.length,
      success_count: results.length,
      error_count: errors.length,
      reason
    });

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: {
        successful: results,
        failed: errors,
        total_processed: user_ids.length,
        success_count: results.length,
        error_count: errors.length
      }
    });

  } catch (error) {
    logger.error('Failed to perform bulk action:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'BULK_ACTION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/statistics:
 *   get:
 *     summary: Get system statistics
 *     description: Get comprehensive system statistics including users, companies, and trends (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
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
 *                   example: "System statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total_users:
 *                           type: number
 *                           example: 1250
 *                         active_users:
 *                           type: number
 *                           example: 1180
 *                         candidates:
 *                           type: number
 *                           example: 950
 *                         recruiters:
 *                           type: number
 *                           example: 180
 *                         hr_users:
 *                           type: number
 *                           example: 110
 *                         admins:
 *                           type: number
 *                           example: 10
 *                     companies:
 *                       type: object
 *                       properties:
 *                         total_companies:
 *                           type: number
 *                           example: 150
 *                         active_companies:
 *                           type: number
 *                           example: 140
 *                     registration_trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-15"
 *                           registrations:
 *                             type: number
 *                             example: 25
 *                           candidate_registrations:
 *                             type: number
 *                             example: 20
 *                           recruiter_registrations:
 *                             type: number
 *                             example: 5
 *                     recent_activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           activity_type:
 *                             type: string
 *                             example: "user_registration"
 *                           activity_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                           user_name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "john.doe@example.com"
 *                           role:
 *                             type: string
 *                             example: "CANDIDATE"
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T14:30:00Z"
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get system statistics
router.get('/statistics', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Get user statistics
    const userStats = {
      total_users: await userModel.count(),
      active_users: await userModel.count({ is_active: true }),
      candidates: await userModel.count({ role: 'CANDIDATE' }),
      recruiters: await userModel.count({ role: 'RECRUITER' }),
      hr_users: await userModel.count({ role: 'HR' }),
      admins: await userModel.count({ role: 'ADMIN' })
    };

    // Get company statistics
    const companyStats = {
      total_companies: await companyModel.count(),
      active_companies: await companyModel.count({ is_active: true })
    };

    // Get registration trends (last 30 days)
    const trendQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations,
        COUNT(*) FILTER (WHERE role = 'CANDIDATE') as candidate_registrations,
        COUNT(*) FILTER (WHERE role = 'RECRUITER') as recruiter_registrations
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const trendResult = await userModel.query(trendQuery, [], 'get_registration_trends');

    // Get recent activities
    const recentActivitiesQuery = `
      SELECT 
        'user_registration' as activity_type,
        u.created_at as activity_date,
        u.full_name as user_name,
        u.email,
        u.role
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY u.created_at DESC
      LIMIT 10
    `;

    const recentActivitiesResult = await userModel.query(recentActivitiesQuery, [], 'get_recent_activities');

    const statistics = {
      users: userStats,
      companies: companyStats,
      registration_trends: trendResult.rows,
      recent_activities: recentActivitiesResult.rows,
      generated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    logger.error('Failed to get system statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'STATISTICS_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/logs:
 *   get:
 *     summary: Get system logs
 *     description: Get system logs with filtering options (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *           default: info
 *         description: Log level filter
 *         example: "error"
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for log filtering
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for log filtering
 *         example: "2024-01-31T23:59:59Z"
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
 *           default: 50
 *         description: Number of log entries per page
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
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
 *                   example: "Logs retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T14:30:00Z"
 *                           level:
 *                             type: string
 *                             example: "info"
 *                           message:
 *                             type: string
 *                             example: "User logged in successfully"
 *                           metadata:
 *                             type: object
 *                             example: {"user_id": "123e4567-e89b-12d3-a456-426614174000"}
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     note:
 *                       type: string
 *                       example: "Log integration not implemented yet. Please check log files or use external logging service."
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get system logs (admin only)
router.get('/logs', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {
      level = 'info',
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    // This is a simplified implementation
    // In production, you'd want to integrate with a proper logging system
    res.json({
      success: true,
      message: 'Logs retrieved successfully',
      data: {
        logs: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        },
        note: 'Log integration not implemented yet. Please check log files or use external logging service.'
      }
    });

  } catch (error) {
    logger.error('Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'LOGS_ERROR'
    });
  }
});

// Export user data (admin only)
router.get('/users/export', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { format = 'json', role, is_active } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (is_active !== undefined) filters.is_active = is_active === 'true';

    const users = await userModel.getUsers({
      ...filters,
      page: 1,
      limit: 10000 // Large limit for export
    });

    if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = 'User ID,Email,Full Name,Role,Active,Created At,Last Login\n';
      const csvData = users.data.map(user => 
        `${user.user_id},${user.email},${user.full_name},${user.role},${user.is_active},${user.created_at},${user.last_login || ''}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
      res.send(csvHeaders + csvData);
    } else {
      // Return JSON
      res.json({
        success: true,
        message: 'User data exported successfully',
        data: users.data,
        total_exported: users.data.length,
        exported_at: new Date().toISOString()
      });
    }

    logger.info('User data exported by admin', {
      admin_id: req.user.user_id,
      format,
      filters,
      total_exported: users.data.length
    });

  } catch (error) {
    logger.error('Failed to export user data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EXPORT_ERROR'
    });
  }
});

module.exports = router; 