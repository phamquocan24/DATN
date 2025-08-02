const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const User = require('../models/User');
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
    new winston.transports.File({ filename: 'logs/firebase.log' })
  ]
});

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Initialize with environment variables (Option 3)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    }, 'business-service');
    
    logger.info('Firebase Admin SDK initialized successfully with environment variables');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Fallback: Initialize with service account key JSON
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    }, 'business-service');
    
    logger.info('Firebase Admin SDK initialized successfully with service account key');
  } else {
    logger.warn('Firebase configuration not found. Please set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID environment variables.');
  }
} catch (error) {
  logger.error('Firebase initialization error:', error);
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const verifyTokenSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'any.required': 'Firebase ID token is required'
  })
});

const socialAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'any.required': 'Firebase ID token is required'
  }),
  provider: Joi.string().valid('google', 'facebook', 'github', 'twitter').required().messages({
    'any.required': 'Provider is required',
    'any.only': 'Provider must be one of: google, facebook, github, twitter'
  }),
  user_info: Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    profile_image_url: Joi.string().uri().optional(),
    phone: Joi.string().optional()
  }).optional()
});

const linkAccountSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'any.required': 'Firebase ID token is required'
  }),
  provider: Joi.string().valid('google', 'facebook', 'github', 'twitter').required()
});

// Helper function to get Firebase Auth instance
function getFirebaseAuth() {
  if (!firebaseApp) {
    throw new Error('Firebase is not initialized');
  }
  return admin.auth(firebaseApp);
}

// Helper function to get Firebase client config
function getFirebaseConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
}

// Helper function to verify Firebase token and get user info
async function verifyFirebaseToken(idToken) {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get additional user info
    const userRecord = await auth.getUser(decodedToken.uid);
    
    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        phoneNumber: userRecord.phoneNumber,
        provider: decodedToken.firebase.sign_in_provider,
        customClaims: decodedToken.custom_claims || {}
      }
    };
  } catch (error) {
    logger.error('Firebase token verification failed:', error);
    return {
      success: false,
      error: error.message,
      code: 'FIREBASE_TOKEN_ERROR'
    };
  }
}

// Helper function to sync Firebase user with local database
async function syncFirebaseUser(firebaseUser, additionalInfo = {}) {
  try {
    // Check if user exists by Firebase UID
    let user = await User.findOne({ firebase_uid: firebaseUser.uid });
    
    if (user) {
      // Update existing user if needed
      const updateData = {};
      
      if (!user.is_email_verified && firebaseUser.emailVerified) {
        updateData.is_email_verified = true;
      }
      
      if (additionalInfo.full_name && additionalInfo.full_name !== user.full_name) {
        updateData.full_name = additionalInfo.full_name;
      }
      
      if (additionalInfo.profile_image_url && additionalInfo.profile_image_url !== user.profile_image_url) {
        updateData.profile_image_url = additionalInfo.profile_image_url;
      }
      
      if (additionalInfo.phone && additionalInfo.phone !== user.phone) {
        updateData.phone = additionalInfo.phone;
      }
      
      if (Object.keys(updateData).length > 0) {
        user = await User.update(user.user_id, updateData);
      }
      
      return {
        success: true,
        user,
        isNewUser: false
      };
    }
    
    // Check if user exists by email
    user = await User.findOne({ email: firebaseUser.email });
    
    if (user) {
      // Link Firebase account to existing user
      await User.update(user.user_id, {
        firebase_uid: firebaseUser.uid,
        is_email_verified: firebaseUser.emailVerified
      });
      
      user = await User.findById(user.user_id);
      
      return {
        success: true,
        user,
        isNewUser: false,
        isLinked: true
      };
    }
    
    // Create new user
    const userData = {
      email: firebaseUser.email,
      full_name: additionalInfo.full_name || firebaseUser.displayName || 'Firebase User',
      firebase_uid: firebaseUser.uid,
      is_email_verified: firebaseUser.emailVerified,
      role: 'CANDIDATE', // Default role
      auth_provider: firebaseUser.provider,
      profile_image_url: additionalInfo.profile_image_url || firebaseUser.photoURL,
      phone: additionalInfo.phone || firebaseUser.phoneNumber
    };
    
    user = await User.createUser(userData);
    
    return {
      success: true,
      user,
      isNewUser: true
    };
    
  } catch (error) {
    logger.error('Firebase user sync failed:', error);
    return {
      success: false,
      error: error.message,
      code: 'FIREBASE_SYNC_ERROR'
    };
  }
}

// Routes

/**
 * @swagger
 * /api/v1/firebase/config:
 *   get:
 *     summary: Get Firebase client configuration
 *     description: Retrieve Firebase configuration for client-side initialization
 *     tags: [Firebase Integration]
 *     responses:
 *       200:
 *         description: Firebase configuration retrieved successfully
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
 *                   example: "Firebase configuration retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     firebaseConfig:
 *                       type: object
 *                       properties:
 *                         apiKey:
 *                           type: string
 *                           example: "AIzaSyC..."
 *                         authDomain:
 *                           type: string
 *                           example: "your-project.firebaseapp.com"
 *                         projectId:
 *                           type: string
 *                           example: "your-project-id"
 *                         storageBucket:
 *                           type: string
 *                           example: "your-project.appspot.com"
 *                         messagingSenderId:
 *                           type: string
 *                           example: "123456789"
 *                         appId:
 *                           type: string
 *                           example: "1:123456789:web:abcdef"
 *                     isEnabled:
 *                       type: boolean
 *                       example: true
 *       503:
 *         description: Firebase is not configured
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
// Get Firebase client configuration
router.get('/config', (req, res) => {
  try {
    if (!firebaseApp) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    const config = getFirebaseConfig();
    
    // Remove sensitive information and only return client config
    const clientConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    };
    
    res.json({
      success: true,
      message: 'Firebase configuration retrieved successfully',
      data: {
        firebaseConfig: clientConfig,
        isEnabled: true
      }
    });
    
  } catch (error) {
    logger.error('Failed to get Firebase config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Firebase configuration',
      code: 'CONFIG_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/firebase/status:
 *   get:
 *     summary: Check Firebase service status
 *     description: Check if Firebase is initialized and configured properly
 *     tags: [Firebase Integration]
 *     responses:
 *       200:
 *         description: Firebase status retrieved successfully
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
 *                   example: "Firebase status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: object
 *                       properties:
 *                         initialized:
 *                           type: boolean
 *                           example: true
 *                           description: "Whether Firebase Admin SDK is initialized"
 *                         hasProjectId:
 *                           type: boolean
 *                           example: true
 *                           description: "Whether Firebase project ID is configured"
 *                         hasApiKey:
 *                           type: boolean
 *                           example: true
 *                           description: "Whether Firebase API key is configured"
 *                         hasAuthDomain:
 *                           type: boolean
 *                           example: true
 *                           description: "Whether Firebase auth domain is configured"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *                           description: "Timestamp when status was checked"
 *                     isReady:
 *                       type: boolean
 *                       example: true
 *                       description: "Overall Firebase readiness status"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Check Firebase service status
router.get('/status', (req, res) => {
  try {
    const isInitialized = !!firebaseApp;
    const config = getFirebaseConfig();
    
    const status = {
      initialized: isInitialized,
      hasProjectId: !!config.projectId,
      hasApiKey: !!config.apiKey,
      hasAuthDomain: !!config.authDomain,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Firebase status retrieved successfully',
      data: {
        status,
        isReady: status.initialized && status.hasProjectId && status.hasApiKey
      }
    });
    
  } catch (error) {
    logger.error('Failed to get Firebase status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Firebase status',
      code: 'STATUS_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/firebase/verify-token:
 *   post:
 *     summary: Verify Firebase ID Token
 *     description: Verify Firebase ID token and sync user with database
 *     tags: [Firebase Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlM..."
 *                 description: "Firebase ID token received from client"
 *     responses:
 *       200:
 *         description: Firebase token verified successfully
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
 *                   example: "Firebase token verified successfully"
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
 *                         firebase_uid:
 *                           type: string
 *                           example: "firebase_uid_123"
 *                         auth_provider:
 *                           type: string
 *                           enum: [FIREBASE_GOOGLE, FIREBASE_FACEBOOK, FIREBASE_EMAIL]
 *                           example: "FIREBASE_GOOGLE"
 *                     access_token:
 *                       type: string
 *                       description: "JWT access token for API authentication"
 *                     refresh_token:
 *                       type: string
 *                       description: "JWT refresh token"
 *                     expires_in:
 *                       type: number
 *                       example: 3600
 *                       description: "Token expiration time in seconds"
 *                     isNewUser:
 *                       type: boolean
 *                       example: false
 *                       description: "Whether this is a new user registration"
 *       400:
 *         description: Validation error or invalid token format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired Firebase token
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
 *       503:
 *         description: Firebase is not configured
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
// Verify Firebase ID Token
router.post('/verify-token', authLimiter, async (req, res) => {
  try {
    if (!firebaseApp) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    const { error, value } = verifyTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { idToken } = value;
    
    // Verify Firebase token
    const tokenResult = await verifyFirebaseToken(idToken);
    
    if (!tokenResult.success) {
      return res.status(401).json({
        success: false,
        error: tokenResult.error,
        code: tokenResult.code
      });
    }
    
    // Sync user with database
    const syncResult = await syncFirebaseUser(tokenResult.user);
    
    if (!syncResult.success) {
      return res.status(500).json({
        success: false,
        error: syncResult.error,
        code: syncResult.code
      });
    }
    
    logger.info('Firebase token verified successfully', {
      user_id: syncResult.user.user_id,
      email: syncResult.user.email,
      firebase_uid: syncResult.user.firebase_uid,
      isNewUser: syncResult.isNewUser
    });
    
    res.json({
      success: true,
      message: 'Firebase token verified successfully',
      data: {
        user: {
          user_id: syncResult.user.user_id,
          email: syncResult.user.email,
          full_name: syncResult.user.full_name,
          role: syncResult.user.role,
          profile_image_url: syncResult.user.profile_image_url,
          is_email_verified: syncResult.user.is_email_verified,
          created_at: syncResult.user.created_at
        },
        firebase: {
          uid: tokenResult.user.uid,
          provider: tokenResult.user.provider,
          emailVerified: tokenResult.user.emailVerified
        },
        isNewUser: syncResult.isNewUser,
        isLinked: syncResult.isLinked || false
      }
    });
    
  } catch (error) {
    logger.error('Firebase token verification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_ERROR'
    });
  }
});

// Social authentication (Google, Facebook, etc.)
router.post('/social-auth', authLimiter, async (req, res) => {
  try {
    if (!firebaseApp) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    const { error, value } = socialAuthSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { idToken, provider, user_info } = value;
    
    // Verify Firebase token
    const tokenResult = await verifyFirebaseToken(idToken);
    
    if (!tokenResult.success) {
      return res.status(401).json({
        success: false,
        error: tokenResult.error,
        code: tokenResult.code
      });
    }
    
    // Validate provider matches token provider
    if (tokenResult.user.provider !== provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider mismatch',
        code: 'PROVIDER_MISMATCH'
      });
    }
    
    // Sync user with database
    const syncResult = await syncFirebaseUser(tokenResult.user, user_info);
    
    if (!syncResult.success) {
      return res.status(500).json({
        success: false,
        error: syncResult.error,
        code: syncResult.code
      });
    }
    
    // Generate JWT tokens
    const { generateTokens } = require('./auth');
    const tokens = generateTokens(syncResult.user);
    
    logger.info('Social authentication successful', {
      user_id: syncResult.user.user_id,
      email: syncResult.user.email,
      provider,
      isNewUser: syncResult.isNewUser
    });
    
    res.json({
      success: true,
      message: 'Social authentication successful',
      data: {
        user: {
          user_id: syncResult.user.user_id,
          email: syncResult.user.email,
          full_name: syncResult.user.full_name,
          role: syncResult.user.role,
          profile_image_url: syncResult.user.profile_image_url,
          is_email_verified: syncResult.user.is_email_verified,
          created_at: syncResult.user.created_at
        },
        ...tokens,
        isNewUser: syncResult.isNewUser,
        isLinked: syncResult.isLinked || false
      }
    });
    
  } catch (error) {
    logger.error('Social authentication failed:', error);
    res.status(500).json({
      success: false,
      error: 'Social authentication failed',
      code: 'SOCIAL_AUTH_ERROR'
    });
  }
});

// Link Firebase account to existing user
router.post('/link-account', authLimiter, async (req, res) => {
  try {
    if (!firebaseApp) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    const { error, value } = linkAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { idToken, provider } = value;
    
    // Verify Firebase token
    const tokenResult = await verifyFirebaseToken(idToken);
    
    if (!tokenResult.success) {
      return res.status(401).json({
        success: false,
        error: tokenResult.error,
        code: tokenResult.code
      });
    }
    
    // Check if Firebase account is already linked
    const existingFirebaseUser = await User.findOne({ firebase_uid: tokenResult.user.uid });
    
    if (existingFirebaseUser) {
      return res.status(400).json({
        success: false,
        error: 'Firebase account is already linked to another user',
        code: 'FIREBASE_ACCOUNT_ALREADY_LINKED'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: tokenResult.user.email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Link Firebase account
    const updatedUser = await User.update(user.user_id, {
      firebase_uid: tokenResult.user.uid,
      auth_provider: provider,
      is_email_verified: tokenResult.user.emailVerified
    });
    
    logger.info('Firebase account linked successfully', {
      user_id: user.user_id,
      email: user.email,
      firebase_uid: tokenResult.user.uid,
      provider
    });
    
    res.json({
      success: true,
      message: 'Firebase account linked successfully',
      data: {
        user: {
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: updatedUser.role,
          firebase_uid: updatedUser.firebase_uid,
          auth_provider: updatedUser.auth_provider,
          is_email_verified: updatedUser.is_email_verified
        }
      }
    });
    
  } catch (error) {
    logger.error('Firebase account linking failed:', error);
    res.status(500).json({
      success: false,
      error: 'Account linking failed',
      code: 'ACCOUNT_LINKING_ERROR'
    });
  }
});

// Unlink Firebase account
router.delete('/unlink-account/:user_id', async (req, res) => {
  try {
    if (!firebaseApp) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    const { user_id } = req.params;
    
    if (!User.db.isValidUUID(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }
    
    // Find user
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.firebase_uid) {
      return res.status(400).json({
        success: false,
        error: 'Firebase account is not linked',
        code: 'FIREBASE_NOT_LINKED'
      });
    }
    
    // Unlink Firebase account
    await User.update(user_id, {
      firebase_uid: null,
      auth_provider: null
    });
    
    logger.info('Firebase account unlinked successfully', {
      user_id,
      email: user.email,
      firebase_uid: user.firebase_uid
    });
    
    res.json({
      success: true,
      message: 'Firebase account unlinked successfully'
    });
    
  } catch (error) {
    logger.error('Firebase account unlinking failed:', error);
    res.status(500).json({
      success: false,
      error: 'Account unlinking failed',
      code: 'ACCOUNT_UNLINKING_ERROR'
    });
  }
});

// Get user's linked accounts
router.get('/linked-accounts/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (!User.db.isValidUUID(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }
    
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const linkedAccounts = [];
    
    if (user.firebase_uid) {
      try {
        const auth = getFirebaseAuth();
        const userRecord = await auth.getUser(user.firebase_uid);
        
        userRecord.providerData.forEach(provider => {
          linkedAccounts.push({
            provider: provider.providerId,
            uid: provider.uid,
            email: provider.email,
            displayName: provider.displayName,
            photoURL: provider.photoURL
          });
        });
      } catch (error) {
        logger.error('Failed to get Firebase user providers:', error);
      }
    }
    
    res.json({
      success: true,
      message: 'Linked accounts retrieved successfully',
      data: {
        linked_accounts: linkedAccounts,
        total_accounts: linkedAccounts.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get linked accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get linked accounts',
      code: 'LINKED_ACCOUNTS_ERROR'
    });
  }
});

// Set custom claims for Firebase user
router.post('/custom-claims/:user_id', async (req, res) => {
  try {
    if (!firebaseApp) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured',
        code: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    const { user_id } = req.params;
    const { claims } = req.body;
    
    if (!User.db.isValidUUID(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }
    
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.firebase_uid) {
      return res.status(400).json({
        success: false,
        error: 'Firebase account is not linked',
        code: 'FIREBASE_NOT_LINKED'
      });
    }
    
    // Set custom claims
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(user.firebase_uid, claims);
    
    logger.info('Custom claims set successfully', {
      user_id,
      firebase_uid: user.firebase_uid,
      claims
    });
    
    res.json({
      success: true,
      message: 'Custom claims set successfully',
      data: {
        user_id,
        firebase_uid: user.firebase_uid,
        claims
      }
    });
    
  } catch (error) {
    logger.error('Failed to set custom claims:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set custom claims',
      code: 'CUSTOM_CLAIMS_ERROR'
    });
  }
});

module.exports = router; 