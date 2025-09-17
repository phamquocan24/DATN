const jwt = require('jsonwebtoken');

// Mock JWT tokens
const mockJwtSecret = 'test-jwt-secret-key';
const mockRefreshSecret = 'test-jwt-refresh-secret-key';

// Mock user data
const mockUsers = {
  candidate: {
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'candidate@test.com',
    full_name: 'Test Candidate',
    role: 'CANDIDATE',
    is_active: true,
    is_verified: true
  },
  recruiter: {
    user_id: '123e4567-e89b-12d3-a456-426614174002', 
    email: 'recruiter@test.com',
    full_name: 'Test Recruiter',
    role: 'RECRUITER',
    is_active: true,
    is_verified: true,
    company_id: '123e4567-e89b-12d3-a456-426614174100'
  },
  hr: {
    user_id: '123e4567-e89b-12d3-a456-426614174003',
    email: 'hr@test.com', 
    full_name: 'Test HR',
    role: 'HR',
    is_active: true,
    is_verified: true,
    company_id: '123e4567-e89b-12d3-a456-426614174100'
  },
  admin: {
    user_id: '123e4567-e89b-12d3-a456-426614174004',
    email: 'admin@test.com',
    full_name: 'Test Admin', 
    role: 'ADMIN',
    is_active: true,
    is_verified: true
  }
};

// Helper functions
const generateMockToken = (user, expiresIn = '1h') => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      type: 'access'
    },
    mockJwtSecret,
    { expiresIn }
  );
};

const generateMockRefreshToken = (user, expiresIn = '7d') => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      type: 'refresh'
    },
    mockRefreshSecret,
    { expiresIn }
  );
};

// Mock middleware functions
const mockAuthenticateToken = (userType = 'candidate') => {
  return (req, res, next) => {
    req.user = mockUsers[userType];
    next();
  };
};

const mockRequireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
  };
};

// Mock auth module
const mockAuthModule = {
  authenticateToken: jest.fn().mockImplementation(mockAuthenticateToken()),
  requireRole: jest.fn().mockImplementation(mockRequireRole),
  generateTokens: jest.fn().mockImplementation((user) => ({
    access_token: generateMockToken(user),
    refresh_token: generateMockRefreshToken(user),
    token_type: 'Bearer',
    expires_in: '1h'
  }))
};

module.exports = {
  mockUsers,
  mockJwtSecret,
  mockRefreshSecret,
  generateMockToken,
  generateMockRefreshToken,
  mockAuthenticateToken,
  mockRequireRole,
  mockAuthModule
}; 