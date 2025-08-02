const winston = require('winston');

// Setup logger for error tracking
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/errors.log' })
  ]
});

/**
 * Standardized Error Response Format
 * All API errors should follow this structure
 */
class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Common Error Codes and Messages
 */
const ERROR_CODES = {
  // Authentication & Authorization
  MISSING_TOKEN: { status: 401, message: 'Access token required' },
  INVALID_TOKEN: { status: 401, message: 'Invalid or malformed token' },
  TOKEN_EXPIRED: { status: 401, message: 'Token has expired' },
  INSUFFICIENT_PERMISSIONS: { status: 403, message: 'Insufficient permissions' },
  ACCOUNT_DEACTIVATED: { status: 401, message: 'Account is deactivated' },
  AUTHENTICATION_FAILED: { status: 401, message: 'Authentication failed' },

  // Validation
  VALIDATION_ERROR: { status: 400, message: 'Validation failed' },
  MISSING_REQUIRED_FIELD: { status: 400, message: 'Missing required field' },
  INVALID_FORMAT: { status: 400, message: 'Invalid data format' },
  INVALID_UUID: { status: 400, message: 'Invalid UUID format' },

  // User Management
  USER_NOT_FOUND: { status: 404, message: 'User not found' },
  USER_EXISTS: { status: 409, message: 'User already exists' },
  EMAIL_EXISTS: { status: 409, message: 'Email already registered' },
  REGISTRATION_FAILED: { status: 400, message: 'User registration failed' },
  LOGIN_FAILED: { status: 401, message: 'Invalid email or password' },
  PASSWORD_CHANGE_FAILED: { status: 400, message: 'Password change failed' },
  PROFILE_UPDATE_FAILED: { status: 400, message: 'Profile update failed' },

  // Job Management
  JOB_NOT_FOUND: { status: 404, message: 'Job not found' },
  JOB_CREATE_FAILED: { status: 400, message: 'Failed to create job' },
  JOB_UPDATE_FAILED: { status: 400, message: 'Failed to update job' },
  JOB_DELETE_FAILED: { status: 400, message: 'Failed to delete job' },
  COMPANY_ASSOCIATION_REQUIRED: { status: 403, message: 'Company association required' },

  // Application Management
  APPLICATION_NOT_FOUND: { status: 404, message: 'Application not found' },
  APPLICATION_EXISTS: { status: 409, message: 'Application already exists' },
  APPLICATION_FAILED: { status: 400, message: 'Application submission failed' },

  // Company Management
  COMPANY_NOT_FOUND: { status: 404, message: 'Company not found' },
  COMPANY_CREATE_FAILED: { status: 400, message: 'Failed to create company' },

  // CV Management
  CV_NOT_FOUND: { status: 404, message: 'CV not found' },
  CV_UPLOAD_FAILED: { status: 400, message: 'CV upload failed' },
  FILE_TOO_LARGE: { status: 413, message: 'File size exceeds limit' },
  INVALID_FILE_TYPE: { status: 400, message: 'Invalid file type' },

  // OTP & Verification
  OTP_GENERATION_ERROR: { status: 500, message: 'Failed to generate OTP' },
  OTP_SEND_ERROR: { status: 500, message: 'Failed to send OTP' },
  OTP_VERIFICATION_ERROR: { status: 400, message: 'OTP verification failed' },
  OTP_EXPIRED: { status: 400, message: 'OTP has expired' },
  OTP_INVALID: { status: 400, message: 'Invalid OTP code' },
  OTP_COOLDOWN: { status: 429, message: 'Too many OTP requests' },
  OTP_NOT_FOUND: { status: 404, message: 'OTP not found or already used' },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: { status: 429, message: 'Too many requests' },
  
  // Database
  DATABASE_ERROR: { status: 500, message: 'Database operation failed' },
  CONSTRAINT_VIOLATION: { status: 409, message: 'Data constraint violation' },

  // General
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  BAD_REQUEST: { status: 400, message: 'Bad request' },
  FORBIDDEN: { status: 403, message: 'Access forbidden' },
  CONFLICT: { status: 409, message: 'Resource conflict' },
  METHOD_NOT_ALLOWED: { status: 405, message: 'Method not allowed' }
};

/**
 * Create standardized error response
 */
function createErrorResponse(errorCode, customMessage = null, details = null, statusCode = null) {
  const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_ERROR;
  
  return {
    success: false,
    error: {
      code: errorCode,
      message: customMessage || errorInfo.message,
      details: details,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Create validation error response
 */
function createValidationErrorResponse(validationErrors) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        fields: validationErrors.map(err => ({
          field: err.path ? err.path.join('.') : err.field,
          message: err.message,
          value: err.value
        }))
      },
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Create success response
 */
function createSuccessResponse(data = null, message = 'Operation successful', pagination = null) {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

/**
 * Handle Joi validation errors
 */
function handleJoiError(joiError) {
  const validationErrors = joiError.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));

  return createValidationErrorResponse(validationErrors);
}

/**
 * Handle database errors
 */
function handleDatabaseError(error) {
  logger.error('Database error:', error);

  // PostgreSQL specific error codes
  switch (error.code) {
    case '23505': // Unique constraint violation
      return createErrorResponse('CONSTRAINT_VIOLATION', 'Duplicate entry detected');
    case '23503': // Foreign key constraint violation
      return createErrorResponse('CONSTRAINT_VIOLATION', 'Referenced record not found');
    case '23502': // Not null constraint violation
      return createErrorResponse('VALIDATION_ERROR', 'Required field is missing');
    case '42P01': // Table does not exist
      return createErrorResponse('DATABASE_ERROR', 'Database table not found');
    case '42703': // Column does not exist
      return createErrorResponse('DATABASE_ERROR', 'Database column not found');
    default:
      return createErrorResponse('DATABASE_ERROR', 'Database operation failed');
  }
}

/**
 * Handle different types of errors
 */
function handleError(error, req = null) {
  // Log error details
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req?.originalUrl,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error instanceof APIError) {
    return {
      statusCode: error.statusCode,
      response: createErrorResponse(error.errorCode, error.message, error.details)
    };
  }

  // Handle Joi validation errors
  if (error.isJoi) {
    return {
      statusCode: 400,
      response: handleJoiError(error)
    };
  }

  // Handle database errors
  if (error.code && typeof error.code === 'string') {
    const dbError = handleDatabaseError(error);
    return {
      statusCode: dbError.error?.code === 'DATABASE_ERROR' ? 500 : 400,
      response: dbError
    };
  }

  // Handle JWT errors
  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      response: createErrorResponse('TOKEN_EXPIRED')
    };
  }

  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      response: createErrorResponse('INVALID_TOKEN')
    };
  }

  // Handle multer (file upload) errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return {
      statusCode: 413,
      response: createErrorResponse('FILE_TOO_LARGE')
    };
  }

  // Default to internal server error
  return {
    statusCode: 500,
    response: createErrorResponse('INTERNAL_ERROR', error.message)
  };
}

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
  const { statusCode, response } = handleError(err, req);
  res.status(statusCode).json(response);
}

/**
 * Express 404 handler
 */
function notFoundHandler(req, res, next) {
  const error = createErrorResponse('NOT_FOUND', `Route ${req.originalUrl} not found`);
  res.status(404).json(error);
}

/**
 * Async error wrapper for controllers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Send error response utility
 */
function sendError(res, errorCode, customMessage = null, details = null, statusCode = null) {
  const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_ERROR;
  const status = statusCode || errorInfo.status;
  const response = createErrorResponse(errorCode, customMessage, details);
  
  res.status(status).json(response);
}

/**
 * Send success response utility
 */
function sendSuccess(res, data = null, message = 'Operation successful', statusCode = 200, pagination = null) {
  const response = createSuccessResponse(data, message, pagination);
  res.status(statusCode).json(response);
}

module.exports = {
  APIError,
  ERROR_CODES,
  createErrorResponse,
  createValidationErrorResponse,
  createSuccessResponse,
  handleJoiError,
  handleDatabaseError,
  handleError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sendError,
  sendSuccess
}; 