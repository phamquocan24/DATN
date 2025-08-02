const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
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
app.use(morgan('combined'));
app.use(express.json());

// Service URLs - Use IPv4 addresses to avoid IPv6 connection issues
const BUSINESS_SERVICE_URL = process.env.BUSINESS_SERVICE_URL || 'http://127.0.0.1:5001';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5003';

// Proxy configurations
const createProxy = (target, pathRewrite = {}) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite,
  onError: (err, req, res) => {
    console.error(`Proxy error for ${req.url}:`, err.message);
    res.status(500).json({ error: 'Service temporarily unavailable' });
  }
});

// Business Service Routes (User + Product + Firebase)
app.use('/auth', createProxy(BUSINESS_SERVICE_URL, { '^/auth': '/auth' }));
app.use('/user', createProxy(BUSINESS_SERVICE_URL, { '^/user': '/user' }));
app.use('/users', createProxy(BUSINESS_SERVICE_URL, { '^/users': '' }));
app.use('/product', createProxy(BUSINESS_SERVICE_URL, { '^/product': '/product' }));
app.use('/products', createProxy(BUSINESS_SERVICE_URL, { '^/products': '/product/products' }));
app.use('/firebase', createProxy(BUSINESS_SERVICE_URL, { '^/firebase': '/firebase' }));
app.use('/graphql', createProxy(BUSINESS_SERVICE_URL, { '^/graphql': '/product/graphql' }));

// Legacy routes for backward compatibility
app.use('/login', createProxy(BUSINESS_SERVICE_URL, { '^/login': '/login' }));
app.use('/register', createProxy(BUSINESS_SERVICE_URL, { '^/register': '/register' }));
app.use('/logout', createProxy(BUSINESS_SERVICE_URL, { '^/logout': '/logout' }));
app.use('/refresh-token', createProxy(BUSINESS_SERVICE_URL, { '^/refresh-token': '/refresh-token' }));
app.use('/profile', createProxy(BUSINESS_SERVICE_URL, { '^/profile': '/user/profile' }));
app.use('/verify-token', createProxy(BUSINESS_SERVICE_URL, { '^/verify-token': '/verify-token' }));
app.use('/social-auth', createProxy(BUSINESS_SERVICE_URL, { '^/social-auth': '/social-auth' }));

// API Documentation and Versioned Routes (Specific routes FIRST)
app.use('/api/docs', createProxy(BUSINESS_SERVICE_URL, { '^/api/docs': '/api/docs' }));
app.use('/api-docs', createProxy(BUSINESS_SERVICE_URL, { '^/api-docs': '/api-docs' }));

// Swagger JSON endpoints
app.use('/swagger/v1/swagger.json', createProxy(BUSINESS_SERVICE_URL, { '^/swagger/v1/swagger.json': '/swagger/v1/swagger.json' }));
app.use('/api/swagger.json', createProxy(BUSINESS_SERVICE_URL, { '^/api/swagger.json': '/api/swagger.json' }));
app.use('/swagger.json', createProxy(BUSINESS_SERVICE_URL, { '^/swagger.json': '/swagger.json' }));

app.use('/api/v1', createProxy(BUSINESS_SERVICE_URL, { '^/api/v1': '/api/v1' }));
// Generic /api route LAST to avoid catching specific routes above
app.use('/api', createProxy(BUSINESS_SERVICE_URL, { '^/api': '/api' }));

// New Business Service Routes (CV Recruitment specific)
app.use('/companies', createProxy(BUSINESS_SERVICE_URL, { '^/companies': '/companies' }));
app.use('/cvs', createProxy(BUSINESS_SERVICE_URL, { '^/cvs': '/cvs' }));
app.use('/jobs', createProxy(BUSINESS_SERVICE_URL, { '^/jobs': '/jobs' }));
app.use('/applications', createProxy(BUSINESS_SERVICE_URL, { '^/applications': '/applications' }));
app.use('/tests', createProxy(BUSINESS_SERVICE_URL, { '^/tests': '/tests' }));
app.use('/notifications', createProxy(BUSINESS_SERVICE_URL, { '^/notifications': '/notifications' }));
app.use('/admin', createProxy(BUSINESS_SERVICE_URL, { '^/admin': '/admin' }));
app.use('/otp', createProxy(BUSINESS_SERVICE_URL, { '^/otp': '/otp' }));

// AI Service Routes - TEMPORARILY DISABLED
// app.use('/ai', createProxy(AI_SERVICE_URL, { '^/ai': '' }));
// app.use('/recommendations', createProxy(AI_SERVICE_URL, { '^/recommendations': '/recommendations' }));
// app.use('/analytics', createProxy(AI_SERVICE_URL, { '^/analytics': '/analytics' }));
// app.use('/predict', createProxy(AI_SERVICE_URL, { '^/predict': '/predict' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const axios = require('axios');
    
    // Check business service health
    let businessServiceHealth = 'unknown';
    try {
      const businessResponse = await axios.get(`${BUSINESS_SERVICE_URL}/health`, { timeout: 5000 });
      businessServiceHealth = businessResponse.status === 200 ? 'healthy' : 'unhealthy';
    } catch (error) {
      businessServiceHealth = 'unhealthy';
    }
    
    // Check AI service health - DISABLED
    // let aiServiceHealth = 'unknown';
    // try {
    //   const aiResponse = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    //   aiServiceHealth = aiResponse.status === 200 ? 'healthy' : 'unhealthy';
    // } catch (error) {
    //   aiServiceHealth = 'unhealthy';
    // }
    
    const overallHealth = businessServiceHealth === 'healthy' ? 'healthy' : 'degraded';
    
    res.json({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      services: {
        businessService: {
          url: BUSINESS_SERVICE_URL,
          status: businessServiceHealth,
          description: 'Handles user management, products, and Firebase authentication'
        }
        // aiService: {
        //   url: AI_SERVICE_URL,
        //   status: 'disabled',
        //   description: 'AI service temporarily disabled'
        // }
      },
      architecture: '1-service (business only)',
      version: '2.0.0',
      note: 'AI service temporarily disabled'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway v2.0 is running',
    version: '2.0.0',
    architecture: '1-service (business only)',
    services: {
      businessService: {
        url: BUSINESS_SERVICE_URL,
        endpoints: [
          '/auth/* - Authentication endpoints',
          '/user/* - User management',
          '/product/* - Product management',
          '/firebase/* - Firebase authentication',
          '/graphql - GraphQL API'
        ]
      }
      // aiService: {
      //   url: AI_SERVICE_URL,
      //   endpoints: [
      //     '/ai/* - AI service endpoints',
      //     '/recommendations - Product recommendations',
      //     '/analytics - User analytics',
      //     '/predict - ML predictions'
      //   ]
      // }
    },
    endpoints: {
      // Business Service
      auth: '/auth',
      user: '/user',
      users: '/users',
      product: '/product',
      products: '/products',
      firebase: '/firebase',
      graphql: '/graphql',
      // Legacy endpoints
      login: '/login',
      register: '/register',
      logout: '/logout',
      profile: '/profile',
      // AI Service
      // ai: '/ai',
      // recommendations: '/recommendations',
      // analytics: '/analytics',
      // predict: '/predict',
      // System
      health: '/health'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: 'Please check the API documentation at GET /',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway v2.0 running on port ${PORT}`);
  console.log(`📍 Services:`);
  console.log(`   - Business Service: ${BUSINESS_SERVICE_URL}`);
  // console.log(`   - AI Service: ${AI_SERVICE_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 