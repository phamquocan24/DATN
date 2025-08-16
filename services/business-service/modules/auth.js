const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const winston = require('winston');
const userModel = new User();
const emailService = require('../services/EmailService');

// Import standardized error handling
const { sendError, sendSuccess, ERROR_CODES, asyncHandler } = require('../utils/errorHandler');

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
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

// JWT Secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100000 : 5, // Very high limit for testing
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Always skip rate limiting for test environment
    return process.env.NODE_ENV === 'test';
  }
});

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  full_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name must not exceed 100 characters',
    'any.required': 'Full name is required'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  role: Joi.string().valid('CANDIDATE', 'RECRUITER', 'ADMIN').default('CANDIDATE'),
  // Accept both formats for password confirmation
  confirmPassword: Joi.string().valid(Joi.ref('password')).optional().messages({
    'any.only': 'Passwords do not match'
  }),
  password_confirmation: Joi.string().valid(Joi.ref('password')).optional().messages({
    'any.only': 'Passwords do not match'
  })
}).custom((value, helpers) => {
  // Require at least one password confirmation field
  if (!value.confirmPassword && !value.password_confirmation) {
    return helpers.message('Password confirmation is required (use confirmPassword or password_confirmation field)');
  }
  return value;
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'New password is required'
  }),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  })
});

// Utility functions
function generateTokens(user) {
  const payload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };

  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { 
    access_token: accessToken, 
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: process.env.JWT_EXPIRES_IN || '1h'
  };
}

// Middleware for authentication
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'MISSING_TOKEN');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return sendError(res, 'INVALID_TOKEN', 'Invalid token type');
    }

    // Get user from database using UUID (get full profile to access company_id)
    const user = await userModel.getUserProfile(decoded.user_id);

    if (!user) {
      return sendError(res, 'USER_NOT_FOUND');
    }
    
    if (!user.is_active) {
      return sendError(res, 'ACCOUNT_DEACTIVATED');
    }

    // Add company_id for RECRUITER users
    if (user.role === 'RECRUITER' && user.recruiter_profile && user.recruiter_profile.company_id) {
      user.company_id = user.recruiter_profile.company_id;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'TOKEN_EXPIRED');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'INVALID_TOKEN');
    }
    
    return sendError(res, 'AUTHENTICATION_FAILED');
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      req.user = null;
      return next();
    }

    const user = await userModel.findById(decoded.user_id, 'user_id, email, full_name, role, is_active');
    
    if (!user || !user.is_active) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // For optional auth, don't fail - just continue without user
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'MISSING_TOKEN');
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'INSUFFICIENT_PERMISSIONS', 
        `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

// Routes

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account in the system
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
 *                 example: user@example.com
 *                 description: User email address (must be unique)
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Password123!
 *                 description: User password (minimum 6 characters)
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *                 description: User full name
 *               phone:
 *                 type: string
 *                 example: "+84901234567"
 *                 description: User phone number (optional)
 *               role:
 *                 type: string
 *                 enum: [CANDIDATE, RECRUITER, HR]
 *                 example: CANDIDATE
 *                 description: User role in the system
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
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     access_token:
 *                       type: string
 *                       description: JWT access token
 *                     refresh_token:
 *                       type: string
 *                       description: JWT refresh token
 *                     expires_in:
 *                       type: number
 *                       example: 3600
 *                       description: Token expiration time in seconds
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Register endpoint
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await userModel.register(value);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(result.user.email, result.user.full_name);
      logger.info('Welcome email sent', { 
        user_id: result.user.user_id,
        email: result.user.email 
      });
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    logger.info('User registered successfully', {
      user_id: result.user.user_id,
      email: result.user.email,
      role: result.user.role
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    });

  } catch (error) {
    logger.error('Registration failed:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
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
 *                 example: user@example.com
 *                 description: User email address
 *               password:
 *                 type: string
 *                 example: Password123!
 *                 description: User password
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     access_token:
 *                       type: string
 *                       description: JWT access token for API authentication
 *                     refresh_token:
 *                       type: string
 *                       description: JWT refresh token
 *                     expires_in:
 *                       type: number
 *                       example: 3600
 *                       description: Token expiration time in seconds
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Login failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = value;

    // Authenticate user
    const result = await userModel.authenticate(email, password);

    logger.info('User logged in successfully', {
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
    logger.error('Login failed:', error);
    
    res.status(401).json({
      success: false,
      error: error.message,
      code: 'LOGIN_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh-token:
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
 *                 description: "Valid refresh token received during login"
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
 *                       description: "New JWT access token"
 *                     token_type:
 *                       type: string
 *                       example: "Bearer"
 *                     expires_in:
 *                       type: number
 *                       example: 3600
 *                       description: "Token expiration time in seconds"
 *       400:
 *         description: Validation error or missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired refresh token
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
// Refresh token endpoint
router.post('/refresh-token', authLimiter, async (req, res) => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { refresh_token } = value;

    // Refresh token using User model
    const result = await userModel.refreshToken(refresh_token);

    logger.info('Token refreshed successfully', {
      user_id: result.user.user_id,
      email: result.user.email
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    res.status(401).json({
      success: false,
      error: error.message,
      code: 'TOKEN_REFRESH_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout the authenticated user and invalidate the current session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: "Logged out successfully"
 *       401:
 *         description: Unauthorized - invalid or missing token
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
// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a full implementation, you might want to blacklist the token
    // For now, we'll just respond with success
    
    logger.info('User logged out', {
      user_id: req.user.user_id,
      email: req.user.email
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                   example: "User profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
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
// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await userModel.getUserProfile(req.user.user_id);

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: profile
      }
    });

  } catch (error) {
    logger.error('Failed to get user profile:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'PROFILE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset token to user's email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: "Email address of the user requesting password reset"
 *     responses:
 *       200:
 *         description: Password reset request processed
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
 *                   example: "If an account with that email exists, a password reset link has been sent"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
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
// Forgot password endpoint
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email } = value;

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token (6 digits)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing password reset tokens for this user
    await userModel.db.query(
      `DELETE FROM user_verification 
       WHERE user_id = $1 AND verification_type = 'PASSWORD_RESET'`,
      [user.user_id],
      'delete_existing_reset_token'
    );

    // Save verification token
    await userModel.db.query(
      `INSERT INTO user_verification (user_id, verification_type, verification_code, expires_at)
       VALUES ($1, 'PASSWORD_RESET', $2, $3)`,
      [user.user_id, resetToken, expiresAt],
      'save_password_reset_token'
    );

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.full_name
    );

    if (!emailResult.success) {
      logger.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send password reset email',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    logger.info('Password reset token generated and email sent', {
      user_id: user.user_id,
      email: user.email,
      messageId: emailResult.messageId
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    logger.error('Forgot password failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset user password using the token received via email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - new_password
 *               - confirm_password
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *                 description: "6-digit reset token received via email"
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
 *         description: Password reset successful
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
 *                   example: "Password reset successfully"
 *       400:
 *         description: Validation error or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired reset token"
 *                 code:
 *                   type: string
 *                   example: "INVALID_TOKEN"
 *       429:
 *         description: Too many requests
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
// Reset password endpoint
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { token, new_password } = value;

    // Verify reset token
    const verificationResult = await userModel.db.query(
      `SELECT uv.user_id, u.email 
       FROM user_verification uv
       JOIN users u ON uv.user_id = u.user_id
       WHERE uv.verification_code = $1 
         AND uv.verification_type = 'PASSWORD_RESET'
         AND uv.expires_at > NOW()`,
      [token],
      'verify_reset_token'
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    const userData = verificationResult.rows[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await userModel.update(userData.user_id, { password_hash: hashedPassword });

    // Delete used verification token
    await userModel.db.query(
      `DELETE FROM user_verification 
       WHERE user_id = $1 AND verification_type = 'PASSWORD_RESET'`,
      [userData.user_id],
      'delete_used_reset_token'
    );

    logger.info('Password reset successfully', {
      user_id: userData.user_id,
      email: userData.email
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('Reset password failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/validate-token:
 *   get:
 *     summary: Validate access token
 *     description: Check if the current access token is valid and return user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                   example: "Token is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@example.com"
 *                         full_name:
 *                           type: string
 *                           example: "John Doe"
 *                         role:
 *                           type: string
 *                           enum: [CANDIDATE, RECRUITER, HR, ADMIN]
 *                           example: "CANDIDATE"
 *       401:
 *         description: Invalid or expired token
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
// Validate token endpoint (for frontend to check if token is still valid)
router.get('/validate-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        user_id: req.user.user_id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role
      }
    }
  });
});

module.exports = {
  router,
  authenticateToken,
  optionalAuth,
  requireRole,
  generateTokens
}; 
module.exports.authenticateToken = authenticateToken; 