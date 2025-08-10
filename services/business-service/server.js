// Load environment variables from service-specific .env first, then fall back to project root .env
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const { database } = require('./models/Database');

// Import error handling utilities
const { errorHandler, notFoundHandler, asyncHandler } = require('./utils/errorHandler');

require('dotenv').config();

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
    new winston.transports.File({ filename: 'logs/business-service.log' })
  ]
});

// Import modules
const authRoutes = require('./modules/auth');
const userRoutes = require('./modules/user');
const firebaseRoutes = require('./modules/firebase');
const otpRoutes = require('./modules/otp');

// Import controllers
const companyRoutes = require('./controllers/CompanyController');
const cvRoutes = require('./controllers/CVController');
const adminRoutes = require('./controllers/AdminController');
const userControllerRoutes = require('./controllers/UserController');
const jobRoutes = require('./controllers/JobController');
const applicationRoutes = require('./controllers/ApplicationController');
const testRoutes = require('./controllers/TestController');
const notificationRoutes = require('./controllers/NotificationController');


const app = express();
const PORT = process.env.PORT || 5001;

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100000 : 100, // Very high limit for testing
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Always skip rate limiting for test environment
    return process.env.NODE_ENV === 'test';
  }
});

// Swagger configuration
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CV Recruitment API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Development: Allow localhost on any port
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Production: Allow specific domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4000', 
      'http://localhost:5173',  // Vite dev server
      'http://localhost:8000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:5173',  // Vite dev server
      process.env.FRONTEND_URL,
      process.env.DOMAIN_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));

// Swagger JSON endpoint - serve raw OpenAPI specification
/**
 * @swagger
 * /swagger/v1/swagger.json:
 *   get:
 *     summary: Get OpenAPI specification in JSON format
 *     description: Returns the complete OpenAPI 3.0 specification for this API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI 3.0 specification
 */
app.get('/swagger/v1/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpecs);
});

// Alternative endpoints for swagger.json (for flexibility)
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpecs);
});

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpecs);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check the health status of the Business Service including database connectivity
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 service:
 *                   type: string
 *                   example: Business Service
 *                 version:
 *                   type: string
 *                   example: 2.0.0
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     stats:
 *                       type: object
 *                 modules:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: active
 *                     user:
 *                       type: string
 *                       example: active
 *                     firebase:
 *                       type: string
 *                       example: active
 *                     jobs:
 *                       type: string
 *                       example: active
 *                     applications:
 *                       type: string
 *                       example: active
 *                     tests:
 *                       type: string
 *                       example: active
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: string
 *                       example: 45MB
 *                     total:
 *                       type: string
 *                       example: 128MB
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 service:
 *                   type: string
 *                   example: Business Service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbConnected = await database.testConnection();
    
    const health = {
      status: 'OK',
      service: 'Business Service',
      version: process.env.npm_package_version || '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbConnected ? 'connected' : 'disconnected',
        stats: database.getStats()
      },
      modules: {
        auth: 'active',
        user: 'active',
        firebase: 'active',
        jobs: 'active',
        applications: 'active',
        tests: 'active'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      service: 'Business Service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes v1 (New Standard)
app.use('/api/v1/auth', authRoutes.router);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/firebase', firebaseRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/cvs', cvRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userControllerRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/notifications', notificationRoutes);



// API Routes (Current - maintained for backward compatibility)
app.use('/api/auth', authRoutes.router);
app.use('/api/user', userRoutes);
app.use('/api/firebase', firebaseRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userControllerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/notifications', notificationRoutes);

// Legacy endpoints for backward compatibility
app.use('/auth', authRoutes.router);
app.use('/user', userRoutes);
app.use('/firebase', firebaseRoutes);
app.use('/otp', otpRoutes);
app.use('/companies', companyRoutes);
app.use('/cvs', cvRoutes);
app.use('/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Business Service API - CV Recruitment System',
    version: process.env.npm_package_version || '2.0.0',
    documentation: '/api-docs',
    swagger_ui: '/api-docs',
    health: '/health',
    endpoints: {
      'v1 (recommended)': {
        auth: '/api/v1/auth',
        user: '/api/v1/user',
        firebase: '/api/v1/firebase',
        otp: '/api/v1/otp',
        companies: '/api/v1/companies',
        cvs: '/api/v1/cvs',
        admin: '/api/v1/admin',
        users: '/api/v1/users',
        jobs: '/api/v1/jobs',
        applications: '/api/v1/applications',
        tests: '/api/v1/tests',
        notifications: '/api/v1/notifications'
      },
      'legacy (backward compatibility)': {
        auth: ['/api/auth', '/auth'],
        user: ['/api/user', '/user'],
        firebase: ['/api/firebase', '/firebase'],
        otp: ['/api/otp', '/otp'],
        companies: ['/api/companies', '/companies'],
        cvs: ['/api/cvs', '/cvs'],
        admin: ['/api/admin', '/admin'],
        users: ['/api/users'],
        jobs: ['/api/jobs'],
        applications: ['/api/applications'],
        tests: ['/api/tests'],
        notifications: ['/api/notifications']
      }
    },
    links: {
      'Interactive API Documentation': 'http://localhost:5001/api-docs',
      'Health Check': 'http://localhost:5001/health',
      'API Documentation (Legacy)': 'http://localhost:5001/api/docs'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Business Service API',
    version: process.env.npm_package_version || '2.0.0',
    description: 'CV Recruitment System - Business Service API',
    baseUrl: '/api/v1',
    endpoints: {
      auth: {
        'POST /api/v1/auth/register': 'Register new user',
        'POST /api/v1/auth/login': 'User login',
        'POST /api/v1/auth/refresh-token': 'Refresh access token',
        'POST /api/v1/auth/logout': 'User logout',
        'GET /api/v1/auth/me': 'Get current user',
        'POST /api/v1/auth/forgot-password': 'Request password reset',
        'POST /api/v1/auth/reset-password': 'Reset password',
        'GET /api/v1/auth/validate-token': 'Validate token'
      },
      user: {
        'GET /api/v1/user/profile': 'Get user profile',
        'PUT /api/v1/user/profile': 'Update user profile',
        'POST /api/v1/user/change-password': 'Change password',
        'GET /api/v1/user/profile/suggestions': 'Get profile completion suggestions',
        'POST /api/v1/user/skills': 'Add skill to candidate profile',
        'DELETE /api/v1/user/skills/:skill_id': 'Remove skill from profile',
        'DELETE /api/v1/user/account': 'Deactivate account',
        'GET /api/v1/user/:user_id': 'Get user by ID (Admin)',
        'GET /api/v1/user/': 'Get users list (Admin)',
        'PUT /api/v1/user/:user_id/status': 'Update user status (Admin)',
        'GET /api/v1/user/admin/statistics': 'Get user statistics (Admin)'
      },
      firebase: {
        'GET /api/v1/firebase/config': 'Get Firebase client config',
        'GET /api/v1/firebase/status': 'Get Firebase service status',
        'POST /api/v1/firebase/verify-token': 'Verify Firebase ID token',
        'POST /api/v1/firebase/social-auth': 'Social authentication',
        'POST /api/v1/firebase/link-account': 'Link Firebase account',
        'POST /api/v1/firebase/unlink-account': 'Unlink Firebase account',
        'GET /api/v1/firebase/linked-accounts': 'Get linked accounts',
        'PUT /api/v1/firebase/custom-claims': 'Update custom claims (Admin)'
      },
      otp: {
        'POST /api/v1/otp/send': 'Send OTP code',
        'POST /api/v1/otp/verify': 'Verify OTP code',
        'GET /api/v1/otp/status': 'Check OTP status'
      },
      companies: {
        'GET /api/v1/companies': 'Get companies list',
        'GET /api/v1/companies/:id': 'Get company by ID',
        'POST /api/v1/companies': 'Create company (HR)',
        'PUT /api/v1/companies/:id': 'Update company (HR)',
        'DELETE /api/v1/companies/:id': 'Delete company (HR)',
        'GET /api/v1/companies/:id/jobs': 'Get company jobs',
        'GET /api/v1/companies/:id/recruiters': 'Get company recruiters (HR/Admin)'
      },
      cvs: {
        'GET /api/v1/cvs': 'Get CVs list (Candidate own / HR search)',
        'GET /api/v1/cvs/:id': 'Get CV by ID',
        'POST /api/v1/cvs': 'Upload CV (Candidate)',
        'PUT /api/v1/cvs/:id': 'Update CV (Candidate)',
        'DELETE /api/v1/cvs/:id': 'Delete CV (Candidate)',
        'GET /api/v1/cvs/search': 'Search CVs (HR/Recruiter)',
        'GET /api/v1/cvs/parse/:id': 'Parse CV content',
        'GET /api/v1/cvs/:id/download': 'Download CV file',
        'GET /api/v1/cvs/my-cvs': 'Get candidate own CVs'
      },
      jobs: {
        'GET /api/v1/jobs': 'Get jobs list (Public)',
        'GET /api/v1/jobs/:id': 'Get job by ID',
        'POST /api/v1/jobs': 'Create job (HR/Recruiter)',
        'PUT /api/v1/jobs/:id': 'Update job (HR/Recruiter)',
        'DELETE /api/v1/jobs/:id': 'Delete job (HR/Recruiter)',
        'PATCH /api/v1/jobs/:id/status': 'Update job status',
        'GET /api/v1/jobs/my-jobs': 'Get my posted jobs (HR/Recruiter)',
        'GET /api/v1/jobs/company/:companyId': 'Get company jobs',
        'GET /api/v1/jobs/recommendations': 'Get job recommendations (Candidate)',
        'GET /api/v1/jobs/latest': 'Get latest jobs',
        'GET /api/v1/jobs/search': 'Advanced job search',
        'GET /api/v1/jobs/stats': 'Get job statistics',
        'GET /api/v1/jobs/pending': 'Get pending jobs (Admin)',
        'POST /api/v1/jobs/:id/approve': 'Approve job (Admin)',
        'POST /api/v1/jobs/:id/reject': 'Reject job (Admin)'
      },
      applications: {
        'GET /api/v1/applications': 'Get applications (HR/Admin)',
        'GET /api/v1/applications/:id': 'Get application by ID',
        'POST /api/v1/applications': 'Create application (Candidate)',
        'PUT /api/v1/applications/:id/status': 'Update application status (HR)',
        'GET /api/v1/applications/my-applications': 'Get my applications (Candidate)',
        'GET /api/v1/applications/job/:jobId': 'Get job applications (HR)',
        'POST /api/v1/applications/bulk-update': 'Bulk update applications (HR)',
        'POST /api/v1/applications/:id/withdraw': 'Withdraw application (Candidate)',
        'GET /api/v1/applications/stats': 'Get application statistics',
        'POST /api/v1/applications/:id/shortlist': 'Shortlist candidate (HR)',
        'POST /api/v1/applications/:id/reject': 'Reject candidate (HR)',
        'POST /api/v1/applications/:id/schedule-interview': 'Schedule interview (HR)',
        'GET /api/v1/applications/match-score/:jobId': 'Get match score (Candidate)'
      },
      tests: {
        'GET /api/v1/tests/:id': 'Get test by ID',
        'POST /api/v1/tests': 'Create test (HR/Recruiter)',
        'PUT /api/v1/tests/:id': 'Update test (HR/Recruiter)',
        'DELETE /api/v1/tests/:id': 'Delete test (HR/Recruiter)',
        'GET /api/v1/tests/job/:jobId': 'Get job tests',
        'POST /api/v1/tests/:id/assign': 'Assign test to candidate (HR)',
        'POST /api/v1/tests/:id/start': 'Start test (Candidate)',
        'POST /api/v1/tests/:id/submit': 'Submit test (Candidate)',
        'GET /api/v1/tests/:id/result': 'Get test result',
        'GET /api/v1/tests/my-tests': 'Get my tests (Candidate)',
        'GET /api/v1/tests/:id/stats': 'Get test statistics (HR)',
        'GET /api/v1/tests/:id/results': 'Get all test results (HR)'
      },
      admin: {
        'GET /api/v1/admin/users': 'Get all users',
        'GET /api/v1/admin/users/:id': 'Get user by ID',
        'PUT /api/v1/admin/users/:id/status': 'Update user status',
        'DELETE /api/v1/admin/users/:id': 'Delete user',
        'GET /api/v1/admin/statistics': 'Get system statistics',
        'GET /api/v1/admin/export/users': 'Export users data',
        'GET /api/v1/admin/export/applications': 'Export applications data',
        'POST /api/v1/admin/bulk-actions': 'Perform bulk actions'
      },

    }
  });
});

// 404 handler - Replace old handler with standardized one
app.use('*', notFoundHandler);

// Global error handling middleware - Replace old handler with standardized one
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await database.testConnection();
    logger.info('Database connection verified');
    
    app.listen(PORT, () => {
      logger.info(`Business Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 