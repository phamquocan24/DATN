const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const User = require('../models/User');
const { database } = require('../models/Database');
const winston = require('winston');

const router = express.Router();
const userModel = new User(); // Create User model instance

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
    new winston.transports.File({ filename: 'logs/otp.log' })
  ]
});

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 OTP requests per windowMs
  message: {
    success: false,
    error: 'Too many OTP requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * components:
 *   schemas:
 *     OTPSendRequest:
 *       type: object
 *       required:
 *         - email
 *         - type
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Valid email address
 *           example: "user@example.com"
 *         type:
 *           type: string
 *           enum: [REGISTRATION, LOGIN, PASSWORD_RESET, EMAIL_VERIFICATION]
 *           description: Type of OTP verification
 *           example: "EMAIL_VERIFICATION"
 *       example:
 *         email: "user@example.com"
 *         type: "EMAIL_VERIFICATION"
 *     
 *     OTPVerifyRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp_code
 *         - type
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address that received the OTP
 *           example: "user@example.com"
 *         otp_code:
 *           type: string
 *           pattern: "^[0-9]{6}$"
 *           description: 6-digit numeric OTP code
 *           example: "123456"
 *         type:
 *           type: string
 *           enum: [REGISTRATION, LOGIN, PASSWORD_RESET, EMAIL_VERIFICATION]
 *           description: Type of OTP verification (must match send request)
 *           example: "EMAIL_VERIFICATION"
 *       example:
 *         email: "user@example.com"
 *         otp_code: "123456"
 *         type: "EMAIL_VERIFICATION"
 * 
 *     OTPResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           description: Response data
 *         error:
 *           type: string
 *           description: Error message (if success is false)
 *         code:
 *           type: string
 *           description: Error code (if success is false)
 */

// Validation schemas
const sendOTPSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  type: Joi.string().valid('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'EMAIL_VERIFICATION').required().messages({
    'any.required': 'OTP type is required',
    'any.only': 'Invalid OTP type. Allowed values: REGISTRATION, LOGIN, PASSWORD_RESET, EMAIL_VERIFICATION'
  })
});

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  otp_code: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'OTP code must be 6 digits',
    'string.pattern.base': 'OTP code must contain only numbers',
    'any.required': 'OTP code is required'
  }),
  type: Joi.string().valid('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'EMAIL_VERIFICATION').required()
});

const resendOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  type: Joi.string().valid('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'EMAIL_VERIFICATION').required()
});

// OTP configuration
const OTP_CONFIG = {
  length: 6,
  expiry: 10 * 60 * 1000, // 10 minutes in milliseconds
  maxAttempts: 5,
  cooldown: 60 * 1000 // 1 minute cooldown between sends
};

/**
 * Generate a random OTP code
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Import EmailService
const emailService = require('../services/EmailService');

/**
 * Send OTP via email using EmailService
 */
async function sendOTPEmail(email, otpCode, type) {
  try {
    logger.info('Sending OTP email', {
      email,
      type,
      message: `Sending OTP code. This code will expire in ${OTP_CONFIG.expiry / 60000} minutes.`
    });

    // Send OTP email using EmailService
    const result = await emailService.sendOTPEmail(email, otpCode, type);

    if (result.success) {
      logger.info('OTP email sent successfully', {
        email,
        type,
        messageId: result.messageId
      });
      return { success: true, messageId: result.messageId };
    } else {
      logger.error('Failed to send OTP email:', result.error);
      return { success: false, error: result.error };
    }

  } catch (error) {
    logger.error('Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get email subject based on OTP type
 */
function getOTPSubject(type) {
  const subjects = {
    REGISTRATION: 'Verify Your Registration - OTP Code',
    LOGIN: 'Login Verification - OTP Code',
    PASSWORD_RESET: 'Password Reset - OTP Code',
    EMAIL_VERIFICATION: 'Email Verification - OTP Code'
  };
  return subjects[type] || 'Verification Code';
}

/**
 * Store OTP in database - fixed for table constraints
 */
async function storeOTP(email, otpCode, type) {
  try {
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expiry);

    // Find user (required for this table design)
    let user = null;
    try {
      user = await userModel.findOne({ email });
    } catch (error) {
      // For registration, user might not exist yet
      if (type === 'REGISTRATION') {
        // Create a temporary verification record without user_id
        // This will need to be linked later during actual registration
      } else {
        throw new Error('User not found');
      }
    }

    // Map OTP types to database verification types
    const typeMapping = {
      'REGISTRATION': 'EMAIL',
      'EMAIL_VERIFICATION': 'EMAIL', 
      'LOGIN': 'EMAIL',
      'PASSWORD_RESET': 'PASSWORD_RESET'
    };

    const dbType = typeMapping[type] || 'EMAIL';

    // Delete any existing verification for this user and type
    if (user?.user_id) {
      await database.query(
        `DELETE FROM user_verification WHERE user_id = $1 AND verification_type = $2`,
        [user.user_id, dbType],
        'delete_existing_otp'
      );
    }

    // Insert new verification record  
    const query = `
      INSERT INTO user_verification (user_id, verification_type, verification_code, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING verification_id
    `;

    const values = [user?.user_id || null, dbType, otpCode, expiresAt];
    const result = await database.query(query, values, 'store_otp');

    return { success: true, verification_id: result.rows[0].verification_id };
  } catch (error) {
    logger.error('Failed to store OTP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify OTP from database - updated to match actual table schema
 */
async function verifyOTPFromDB(email, otpCode, type) {
  try {
    // Find user first
    const user = await userModel.findOne({ email });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Map OTP types to database verification types
    const typeMapping = {
      'REGISTRATION': 'EMAIL',
      'EMAIL_VERIFICATION': 'EMAIL',
      'LOGIN': 'EMAIL', 
      'PASSWORD_RESET': 'PASSWORD_RESET'
    };

    const dbType = typeMapping[type] || 'EMAIL';

    // Get OTP record
    const query = `
      SELECT verification_id, verification_code, expires_at, verified_at
      FROM user_verification
      WHERE user_id = $1 AND verification_type = $2
      AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await database.query(query, [user.user_id, dbType], 'get_otp');

    if (result.rows.length === 0) {
      return { success: false, error: 'OTP not found or already used' };
    }

    const otpRecord = result.rows[0];

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return { success: false, error: 'OTP has expired' };
    }

    // Verify OTP code
    if (otpRecord.verification_code !== otpCode) {
      return { success: false, error: 'Invalid OTP code' };
    }

    // Mark as verified
    await database.query(
      `UPDATE user_verification SET verified_at = NOW() WHERE verification_id = $1`,
      [otpRecord.verification_id],
      'mark_otp_verified'
    );

    // Update user verification status based on type
    if (dbType === 'EMAIL') {
      await database.query(
        `UPDATE user_verification SET email_verified = true WHERE verification_id = $1`,
        [otpRecord.verification_id],
        'mark_email_verified'
      );
    }

    return { success: true, user_id: user.user_id };
  } catch (error) {
    logger.error('Failed to verify OTP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check OTP cooldown - updated to match actual table schema
 */
async function checkOTPCooldown(email, type) {
  try {
    // Find user first
    const user = await userModel.findOne({ email });
    if (!user && type !== 'REGISTRATION') {
      return { canSend: false, error: 'User not found' };
    }

    // For registration, allow if no user exists
    if (!user && type === 'REGISTRATION') {
      return { canSend: true };
    }

    const typeMapping = {
      'REGISTRATION': 'EMAIL',
      'EMAIL_VERIFICATION': 'EMAIL',
      'LOGIN': 'EMAIL',
      'PASSWORD_RESET': 'PASSWORD_RESET'
    };

    const dbType = typeMapping[type] || 'EMAIL';

    const query = `
      SELECT created_at
      FROM user_verification
      WHERE user_id = $1 AND verification_type = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await database.query(query, [user.user_id, dbType], 'check_otp_cooldown');

    if (result.rows.length === 0) {
      return { canSend: true };
    }

    const lastSent = new Date(result.rows[0].created_at);
    const now = new Date();
    const timeDiff = now - lastSent;

    if (timeDiff < OTP_CONFIG.cooldown) {
      const remainingTime = Math.ceil((OTP_CONFIG.cooldown - timeDiff) / 1000);
      return { 
        canSend: false, 
        remainingTime,
        error: `Please wait ${remainingTime} seconds before requesting another OTP`
      };
    }

    return { canSend: true };
  } catch (error) {
    logger.error('Failed to check OTP cooldown:', error);
    return { canSend: false, error: 'Failed to check cooldown' };
  }
}

// Routes

/**
 * @swagger
 * /api/v1/otp/send:
 *   post:
 *     summary: Send OTP code via email
 *     description: |
 *       Sends a 6-digit OTP code to the specified email address.
 *       
 *       **Rate Limiting**: Maximum 5 requests per 15 minutes per IP
 *       **Cooldown**: 1 minute between consecutive requests for same email/type
 *       **Expiry**: OTP codes expire after 10 minutes
 *       
 *       **Usage Examples:**
 *       - Registration: Verify new user email before account creation
 *       - Login: Additional security for sensitive accounts
 *       - Password Reset: Verify identity before allowing password change
 *       - Email Verification: Verify email ownership
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPSendRequest'
 *           examples:
 *             registration:
 *               summary: Registration OTP
 *               value:
 *                 email: "newuser@example.com"
 *                 type: "REGISTRATION"
 *             login:
 *               summary: Login OTP
 *               value:
 *                 email: "user@example.com"
 *                 type: "LOGIN"
 *             password_reset:
 *               summary: Password Reset OTP
 *               value:
 *                 email: "user@example.com"
 *                 type: "PASSWORD_RESET"
 *             email_verification:
 *               summary: Email Verification OTP
 *               value:
 *                 email: "user@example.com"
 *                 type: "EMAIL_VERIFICATION"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             example:
 *               success: true
 *               message: "OTP sent successfully"
 *               data:
 *                 email: "user@example.com"
 *                 type: "EMAIL_VERIFICATION"
 *                 expires_in: 600
 *                 cooldown: 60
 *       400:
 *         description: Validation error or user already exists (for registration)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             examples:
 *               validation_error:
 *                 summary: Invalid email format
 *                 value:
 *                   success: false
 *                   error: "Please provide a valid email address"
 *                   code: "VALIDATION_ERROR"
 *               user_exists:
 *                 summary: User already exists (registration)
 *                 value:
 *                   success: false
 *                   error: "User with this email already exists"
 *                   code: "USER_EXISTS"
 *       404:
 *         description: User not found (for non-registration types)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             example:
 *               success: false
 *               error: "User not found"
 *               code: "USER_NOT_FOUND"
 *       429:
 *         description: Rate limit exceeded or cooldown active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             examples:
 *               rate_limit:
 *                 summary: Too many requests
 *                 value:
 *                   success: false
 *                   error: "Too many OTP requests, please try again later"
 *               cooldown:
 *                 summary: Cooldown active
 *                 value:
 *                   success: false
 *                   error: "Please wait 45 seconds before requesting another OTP"
 *                   code: "OTP_COOLDOWN"
 *                   remaining_time: 45
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             example:
 *               success: false
 *               error: "Failed to generate OTP"
 *               code: "OTP_GENERATION_ERROR"
 */
// Send OTP
router.post('/send', otpLimiter, async (req, res) => {
  try {
    const { error, value } = sendOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, type } = value;

    // Check cooldown
    const cooldownCheck = await checkOTPCooldown(email, type);
    if (!cooldownCheck.canSend) {
      return res.status(429).json({
        success: false,
        error: cooldownCheck.error,
        code: 'OTP_COOLDOWN',
        remaining_time: cooldownCheck.remainingTime
      });
    }

    // For registration, check if user already exists
    if (type === 'REGISTRATION') {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        });
      }
    }

    // For other types, check if user exists
    if (['LOGIN', 'PASSWORD_RESET', 'EMAIL_VERIFICATION'].includes(type)) {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
    }

    // Generate and store OTP
    const otpCode = generateOTP();
    const storeResult = await storeOTP(email, otpCode, type);

    if (!storeResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate OTP',
        code: 'OTP_GENERATION_ERROR'
      });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otpCode, type);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    logger.info('OTP sent successfully', {
      email,
      type,
      verification_id: storeResult.verification_id
    });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        email,
        type,
        expires_in: Math.floor(OTP_CONFIG.expiry / 1000), // seconds
        cooldown: Math.floor(OTP_CONFIG.cooldown / 1000) // seconds
      }
    });

  } catch (error) {
    logger.error('Failed to send OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      code: 'OTP_SEND_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/otp/verify:
 *   post:
 *     summary: Verify OTP code
 *     description: |
 *       Verifies a 6-digit OTP code against the one sent to the email address.
 *       
 *       **Important Notes:**
 *       - OTP codes can only be used once
 *       - Expired OTP codes cannot be verified
 *       - Type parameter must match the one used when sending OTP
 *       - Successful verification marks the OTP as used
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerifyRequest'
 *           examples:
 *             valid_otp:
 *               summary: Valid OTP verification
 *               value:
 *                 email: "user@example.com"
 *                 otp_code: "123456"
 *                 type: "EMAIL_VERIFICATION"
 *             password_reset:
 *               summary: Password reset verification
 *               value:
 *                 email: "user@example.com"
 *                 otp_code: "987654"
 *                 type: "PASSWORD_RESET"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             example:
 *               success: true
 *               message: "OTP verified successfully"
 *               data:
 *                 email: "user@example.com"
 *                 type: "EMAIL_VERIFICATION"
 *                 verified_at: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Validation error or invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             examples:
 *               validation_error:
 *                 summary: Invalid OTP format
 *                 value:
 *                   success: false
 *                   error: "OTP code must be 6 digits"
 *                   code: "VALIDATION_ERROR"
 *               invalid_otp:
 *                 summary: Wrong OTP code
 *                 value:
 *                   success: false
 *                   error: "Invalid OTP code"
 *                   code: "INVALID_OTP"
 *               expired_otp:
 *                 summary: Expired OTP
 *                 value:
 *                   success: false
 *                   error: "OTP has expired"
 *                   code: "OTP_EXPIRED"
 *               already_used:
 *                 summary: OTP already used
 *                 value:
 *                   success: false
 *                   error: "OTP not found or already used"
 *                   code: "OTP_NOT_FOUND"
 *       404:
 *         description: User or OTP not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             example:
 *               success: false
 *               error: "User not found"
 *               code: "USER_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *             example:
 *               success: false
 *               error: "Failed to verify OTP"
 *               code: "OTP_VERIFICATION_ERROR"
 */
// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, otp_code, type } = value;

    const verifyResult = await verifyOTPFromDB(email, otp_code, type);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        error: verifyResult.error,
        code: 'OTP_VERIFICATION_FAILED'
      });
    }

    logger.info('OTP verified successfully', {
      email,
      type
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email,
        type,
        verified_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to verify OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
      code: 'OTP_VERIFY_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/otp/resend:
 *   post:
 *     summary: Resend OTP code
 *     description: Resend a new 6-digit OTP code to user's email
 *     tags: [OTP & Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: "Email address to resend OTP to"
 *               type:
 *                 type: string
 *                 enum: [REGISTRATION, LOGIN, PASSWORD_RESET, EMAIL_VERIFICATION]
 *                 example: "PASSWORD_RESET"
 *                 description: "Type of OTP verification"
 *     responses:
 *       200:
 *         description: OTP resent successfully
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
 *                   example: "OTP resent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     type:
 *                       type: string
 *                       example: "PASSWORD_RESET"
 *                     expires_in:
 *                       type: number
 *                       example: 600
 *                       description: "OTP expiration time in seconds"
 *                     cooldown:
 *                       type: number
 *                       example: 60
 *                       description: "Cooldown before next OTP request in seconds"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded or cooldown active
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
 *                   example: "Please wait 30 seconds before requesting another OTP"
 *                 code:
 *                   type: string
 *                   example: "OTP_COOLDOWN"
 *                 remaining_time:
 *                   type: number
 *                   example: 30
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Resend OTP
router.post('/resend', otpLimiter, async (req, res) => {
  try {
    const { error, value } = resendOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, type } = value;

    // Check cooldown
    const cooldownCheck = await checkOTPCooldown(email, type);
    if (!cooldownCheck.canSend) {
      return res.status(429).json({
        success: false,
        error: cooldownCheck.error,
        code: 'OTP_COOLDOWN',
        remaining_time: cooldownCheck.remainingTime
      });
    }

    // Generate and store new OTP
    const otpCode = generateOTP();
    const storeResult = await storeOTP(email, otpCode, type);

    if (!storeResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate OTP',
        code: 'OTP_GENERATION_ERROR'
      });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otpCode, type);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    logger.info('OTP resent successfully', {
      email,
      type,
      verification_id: storeResult.verification_id
    });

    res.json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        email,
        type,
        expires_in: Math.floor(OTP_CONFIG.expiry / 1000),
        cooldown: Math.floor(OTP_CONFIG.cooldown / 1000)
      }
    });

  } catch (error) {
    logger.error('Failed to resend OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend OTP',
      code: 'OTP_RESEND_ERROR'
    });
  }
});

module.exports = router; 