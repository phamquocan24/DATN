const User = require('../models/User');
const { validationResult } = require('express-validator');
const winston = require('winston');

class UserController {
  constructor() {
    this.userModel = new User();
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/user-controller.log' })
      ]
    });
  }

  /**
   * @swagger
   * /api/v1/users/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account with email verification
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - full_name
   *               - role
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "john.doe@example.com"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
   *                 example: "StrongP@ss123"
   *                 description: "Must contain uppercase, lowercase, number and special character"
   *               phone:
   *                 type: string
   *                 pattern: "^[0-9+\\-\\s()]+$"
   *                 example: "+84 123 456 789"
   *               full_name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *                 example: "John Doe"
   *               role:
   *                 type: string
   *                 enum: [CANDIDATE, RECRUITER, HR, ADMIN]
   *                 example: "CANDIDATE"
   *     responses:
   *       201:
   *         description: User registered successfully
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
   *                   example: "User registered successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                       properties:
   *                         user_id:
   *                           type: string
   *                           format: uuid
   *                         email:
   *                           type: string
   *                         full_name:
   *                           type: string
   *                         role:
   *                           type: string
   *                         created_at:
   *                           type: string
   *                           format: date-time
   *       400:
   *         description: Validation failed or email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, phone, full_name, role } = req.body;

      const user = await this.userModel.createUser({
        email,
        password,
        phone,
        full_name,
        role
      });

      this.logger.info('User registered successfully', {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            created_at: user.created_at
          }
        }
      });
    } catch (error) {
      this.logger.error('Registration failed', { error: error.message, email: req.body.email });
      
      res.status(400).json({
        success: false,
        message: error.message,
        error_code: 'REGISTRATION_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/login:
   *   post:
   *     summary: User login
   *     description: Authenticate user and return access tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "john.doe@example.com"
   *               password:
   *                 type: string
   *                 example: "StrongP@ss123"
   *     responses:
   *       200:
   *         description: Login successful
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
   *                   example: "Login successful"
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     access_token:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     refresh_token:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     expires_in:
   *                       type: number
   *                       example: 3600
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      const result = await this.userModel.authenticate(email, password);

      this.logger.info('User logged in successfully', {
        user_id: result.user.user_id,
        email: result.user.email,
        role: result.user.role
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      this.logger.error('Login failed', { error: error.message, email: req.body.email });
      
      res.status(401).json({
        success: false,
        message: error.message,
        error_code: 'AUTHENTICATION_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/refresh-token:
   *   post:
   *     summary: Refresh access token
   *     description: Get a new access token using refresh token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refresh_token
   *             properties:
   *               refresh_token:
   *                 type: string
   *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Token refreshed successfully
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
   *                   example: "Token refreshed successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     access_token:
   *                       type: string
   *                     expires_in:
   *                       type: number
   *       401:
   *         description: Invalid or expired refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error_code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const result = await this.userModel.refreshToken(refresh_token);

      this.logger.info('Token refreshed successfully', {
        user_id: result.user.user_id,
        email: result.user.email
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      this.logger.error('Token refresh failed', { error: error.message });
      
      res.status(401).json({
        success: false,
        message: error.message,
        error_code: 'TOKEN_REFRESH_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/profile:
   *   get:
   *     summary: Get current user profile
   *     description: Retrieve authenticated user's complete profile information
   *     tags: [User Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
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
   *                   example: "Profile retrieved successfully"
   *                 data:
   *                   $ref: '#/components/schemas/UserProfile'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.user_id;

      const profile = await this.userModel.getUserProfile(userId);

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      this.logger.error('Failed to get profile', { 
        error: error.message,
        user_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'PROFILE_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/profile:
   *   put:
   *     summary: Update user profile
   *     description: Update authenticated user's profile information
   *     tags: [User Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               full_name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *                 example: "John Updated Doe"
   *               phone:
   *                 type: string
   *                 pattern: "^[0-9+\\-\\s()]+$"
   *                 example: "+84 987 654 321"
   *               date_of_birth:
   *                 type: string
   *                 format: date
   *                 example: "1990-05-15"
   *               gender:
   *                 type: string
   *                 enum: [MALE, FEMALE, OTHER]
   *                 example: "MALE"
   *               avatar_url:
   *                 type: string
   *                 format: uri
   *                 example: "https://example.com/avatar.jpg"
   *               address:
   *                 type: string
   *                 maxLength: 500
   *                 example: "123 Main St, City"
   *               city_id:
   *                 type: string
   *                 format: uuid
   *               district_id:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       200:
   *         description: Profile updated successfully
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
   *                   example: "Profile updated successfully"
   *                 data:
   *                   $ref: '#/components/schemas/UserProfile'
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
   */
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.user_id;
      const profileData = req.body;

      const updatedProfile = await this.userModel.updateProfile(userId, profileData);

      this.logger.info('Profile updated successfully', {
        user_id: userId,
        updated_fields: Object.keys(profileData)
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      this.logger.error('Failed to update profile', { 
        error: error.message,
        user_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'PROFILE_UPDATE_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/change-password:
   *   post:
   *     summary: Change user password
   *     description: Change authenticated user's password by providing current and new password
   *     tags: [User Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - current_password
   *               - new_password
   *               - confirm_password
   *             properties:
   *               current_password:
   *                 type: string
   *                 example: "CurrentPass123!"
   *                 description: "User's current password"
   *               new_password:
   *                 type: string
   *                 minLength: 8
   *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
   *                 example: "NewPassword123!"
   *                 description: "New password (must contain uppercase, lowercase, number and special character)"
   *               confirm_password:
   *                 type: string
   *                 example: "NewPassword123!"
   *                 description: "Confirm new password (must match new_password)"
   *     responses:
   *       200:
   *         description: Password changed successfully
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
   *                   example: "Password changed successfully"
   *       400:
   *         description: Validation failed or incorrect current password
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
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.user_id;
      const { current_password, new_password, confirm_password } = req.body;

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirm password do not match',
          error_code: 'PASSWORD_CONFIRMATION_FAILED'
        });
      }

      await this.userModel.changePassword(userId, current_password, new_password);

      this.logger.info('Password changed successfully', { user_id: userId });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      this.logger.error('Failed to change password', { 
        error: error.message,
        user_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'PASSWORD_CHANGE_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/deactivate:
   *   put:
   *     summary: Deactivate user account
   *     description: Deactivate authenticated user's account
   *     tags: [User Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *                 maxLength: 500
   *                 example: "No longer need the account"
   *     responses:
   *       200:
   *         description: Account deactivated successfully
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
   *                   example: "Account deactivated successfully"
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
   */
  async deactivateAccount(req, res) {
    try {
      const userId = req.user.user_id;

      await this.userModel.deactivateAccount(userId);

      this.logger.info('Account deactivated successfully', { user_id: userId });

      res.json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      this.logger.error('Failed to deactivate account', { 
        error: error.message,
        user_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'ACCOUNT_DEACTIVATION_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/{userId}:
   *   get:
   *     summary: Get user by ID
   *     description: Get user information by user ID (Admin only)
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: User retrieved successfully
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
   *                   example: "User retrieved successfully"
   *                 data:
   *                   $ref: '#/components/schemas/UserProfile'
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
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await this.userModel.getUserProfile(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error_code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      this.logger.error('Failed to get user by ID', { 
        error: error.message,
        requested_id: req.params.id,
        admin_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'USER_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users:
   *   get:
   *     summary: Get all users with filtering
   *     description: Get list of users with filtering and pagination (Admin only)
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name, email, or phone
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
   *                     $ref: '#/components/schemas/User'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
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
  async getUsers(req, res) {
    try {
      const {
        role,
        is_active,
        search,
        page = 1,
        limit = 10,
        order_by = 'created_at',
        direction = 'DESC'
      } = req.query;

      const options = {
        role,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: order_by,
        direction: direction.toUpperCase()
      };

      const result = await this.userModel.getUsers(options);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      this.logger.error('Failed to get users list', { 
        error: error.message,
        admin_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'USERS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/statistics:
   *   get:
   *     summary: Get user statistics
   *     description: Get comprehensive user statistics (Admin only)
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User statistics retrieved successfully
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
   *                   example: "User statistics retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     total_users:
   *                       type: number
   *                       example: 1250
   *                     active_users:
   *                       type: number
   *                       example: 1100
   *                     users_by_role:
   *                       type: object
   *                       properties:
   *                         CANDIDATE:
   *                           type: number
   *                           example: 800
   *                         RECRUITER:
   *                           type: number
   *                           example: 200
   *                         HR:
   *                           type: number
   *                           example: 180
   *                         ADMIN:
   *                           type: number
   *                           example: 70
   *                     recent_registrations:
   *                       type: object
   *                       properties:
   *                         last_7_days:
   *                           type: number
   *                           example: 45
   *                         last_30_days:
   *                           type: number
   *                           example: 180
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
  async getUserStatistics(req, res) {
    try {
      const stats = await this.userModel.count();
      const activeUsers = await this.userModel.count({ is_active: true });
      const candidateCount = await this.userModel.count({ role: 'CANDIDATE' });
      const recruiterCount = await this.userModel.count({ role: 'RECRUITER' });
      const adminCount = await this.userModel.count({ role: 'ADMIN' });

      // Get registration stats for the last 30 days
      const registrationStatsQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as registrations
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const registrationStats = await this.userModel.db.query(registrationStatsQuery, [], 'get_registration_stats');

      const statistics = {
        total_users: stats,
        active_users: activeUsers,
        inactive_users: stats - activeUsers,
        candidates: candidateCount,
        recruiters: recruiterCount,
        admins: adminCount,
        registration_trend: registrationStats.rows
      };

      res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      this.logger.error('Failed to get user statistics', { 
        error: error.message,
        admin_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'STATISTICS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/{userId}/status:
   *   put:
   *     summary: Update user status
   *     description: Update user active/inactive status (Admin only)
   *     tags: [User Management]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - is_active
   *             properties:
   *               is_active:
   *                 type: boolean
   *                 example: false
   *               reason:
   *                 type: string
   *                 maxLength: 500
   *                 example: "Violation of terms of service"
   *     responses:
   *       200:
   *         description: User status updated successfully
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
   *                   example: "User status updated successfully"
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
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async updateUserStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { is_active } = req.body;

      const updatedUser = await this.userModel.update(id, { is_active });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error_code: 'USER_NOT_FOUND'
        });
      }

      this.logger.info('User status updated successfully', {
        user_id: id,
        is_active,
        admin_id: req.user.user_id
      });

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: {
          user_id: updatedUser.user_id,
          is_active: updatedUser.is_active,
          updated_at: updatedUser.updated_at
        }
      });
    } catch (error) {
      this.logger.error('Failed to update user status', { 
        error: error.message,
        user_id: req.params.id,
        admin_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'USER_STATUS_UPDATE_FAILED'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/profile/suggestions:
   *   get:
   *     summary: Get profile completion suggestions
   *     description: Get suggestions to improve profile completeness
   *     tags: [User Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile suggestions retrieved successfully
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
   *                   example: "Profile suggestions retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     completion_percentage:
   *                       type: number
   *                       example: 75
   *                     missing_fields:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["avatar_url", "skills", "education"]
   *                     suggestions:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           field:
   *                             type: string
   *                           message:
   *                             type: string
   *                           priority:
   *                             type: string
   *                             enum: [LOW, MEDIUM, HIGH]
   *                       example:
   *                         - field: "avatar_url"
   *                           message: "Add a profile picture to increase visibility"
   *                           priority: "MEDIUM"
   *                         - field: "skills"
   *                           message: "Add skills to improve job matching"
   *                           priority: "HIGH"
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getProfileSuggestions(req, res) {
    try {
      const userId = req.user.user_id;

      const profile = await this.userModel.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error_code: 'PROFILE_NOT_FOUND'
        });
      }

      const suggestions = [];

      // Basic profile suggestions
      if (!profile.profile_image_url) {
        suggestions.push({
          category: 'basic',
          field: 'profile_image_url',
          title: 'Add Profile Picture',
          description: 'Upload a professional photo to make your profile more engaging',
          priority: 'high'
        });
      }

      if (!profile.bio) {
        suggestions.push({
          category: 'basic',
          field: 'bio',
          title: 'Write Bio',
          description: 'Tell employers about yourself and your career goals',
          priority: 'high'
        });
      }

      if (!profile.phone) {
        suggestions.push({
          category: 'contact',
          field: 'phone',
          title: 'Add Phone Number',
          description: 'Help recruiters contact you easily',
          priority: 'medium'
        });
      }

      // Role-specific suggestions
      if (profile.role === 'CANDIDATE') {
        if (!profile.candidate_profile?.years_experience) {
          suggestions.push({
            category: 'experience',
            field: 'years_experience',
            title: 'Add Experience Level',
            description: 'Specify your years of experience to match with relevant jobs',
            priority: 'high'
          });
        }

        if (!profile.candidate_profile?.skills || profile.candidate_profile.skills.length === 0) {
          suggestions.push({
            category: 'skills',
            field: 'skills',
            title: 'Add Skills',
            description: 'List your technical and professional skills',
            priority: 'high'
          });
        }

        if (!profile.candidate_profile?.expected_salary) {
          suggestions.push({
            category: 'salary',
            field: 'expected_salary',
            title: 'Set Salary Expectation',
            description: 'Help recruiters understand your salary requirements',
            priority: 'medium'
          });
        }
      }

      res.json({
        success: true,
        message: 'Profile suggestions retrieved successfully',
        data: {
          suggestions,
          completion_percentage: this.calculateCompletionPercentage(profile),
          total_suggestions: suggestions.length
        }
      });
    } catch (error) {
      this.logger.error('Failed to get profile suggestions', { 
        error: error.message,
        user_id: req.user?.user_id
      });
      
      res.status(500).json({
        success: false,
        message: error.message,
        error_code: 'SUGGESTIONS_RETRIEVAL_FAILED'
      });
    }
  }

  /**
   * Calculate profile completion percentage
   * @param {Object} profile - User profile
   * @returns {number}
   */
  calculateCompletionPercentage(profile) {
    const requiredFields = [
      'full_name', 'email', 'phone', 'profile_image_url', 'bio'
    ];

    const roleSpecificFields = {
      'CANDIDATE': ['years_experience', 'current_job_title', 'expected_salary'],
      'RECRUITER': ['position', 'company_name']
    };

    const allFields = [
      ...requiredFields,
      ...(roleSpecificFields[profile.role] || [])
    ];

    const completedFields = allFields.filter(field => {
      if (field === 'company_name' && profile.recruiter_profile) {
        return !!profile.recruiter_profile.company_name;
      }
      if (field === 'position' && profile.recruiter_profile) {
        return !!profile.recruiter_profile.position;
      }
      if (profile.candidate_profile && ['years_experience', 'current_job_title', 'expected_salary'].includes(field)) {
        return !!profile.candidate_profile[field];
      }
      return !!profile[field];
    });

    return Math.round((completedFields.length / allFields.length) * 100);
  }
}

// Create Express router
const express = require('express');
const router = express.Router();
const userController = new UserController();

// Define routes
router.post('/register', userController.register.bind(userController));
router.post('/login', userController.login.bind(userController));
router.post('/refresh-token', userController.refreshToken.bind(userController));
router.get('/profile', userController.getProfile.bind(userController));
router.put('/profile', userController.updateProfile.bind(userController));
router.post('/change-password', userController.changePassword.bind(userController));
router.delete('/account', userController.deactivateAccount.bind(userController));
router.get('/profile/suggestions', userController.getProfileSuggestions.bind(userController));

// Admin routes
router.get('/:id', userController.getUserById.bind(userController));
router.get('/', userController.getUsers.bind(userController));
router.put('/:id/status', userController.updateUserStatus.bind(userController));
router.get('/admin/statistics', userController.getUserStatistics.bind(userController));

module.exports = router; 