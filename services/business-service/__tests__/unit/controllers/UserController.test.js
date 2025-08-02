const UserController = require('../../../controllers/UserController');
const User = require('../../../models/User');
const { validationResult } = require('express-validator');
const { mockUsers, mockAuthenticateToken } = require('../../mocks/auth');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('express-validator');
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

describe('UserController', () => {
  let userController;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    userController = new UserController();
    
    mockReq = {
      body: {},
      user: {},
      params: {},
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Default successful validation
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ss123',
        full_name: 'Test User',
        role: 'CANDIDATE',
        phone: '+84123456789'
      };

      const mockCreatedUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        created_at: new Date()
      };

      mockReq.body = userData;
      User.createUser = jest.fn().mockResolvedValue(mockCreatedUser);

      await userController.register(mockReq, mockRes);

      expect(User.createUser).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        full_name: userData.full_name,
        role: userData.role
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            user_id: mockCreatedUser.user_id,
            email: mockCreatedUser.email,
            full_name: mockCreatedUser.full_name,
            role: mockCreatedUser.role,
            created_at: mockCreatedUser.created_at
          }
        }
      });
    });

    it('should return validation errors', async () => {
      const validationErrors = [
        { field: 'email', msg: 'Invalid email format' },
        { field: 'password', msg: 'Password too weak' }
      ];

      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      });

      mockReq.body = {
        email: 'invalid-email',
        password: '123'
      };

      await userController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
      expect(User.createUser).not.toHaveBeenCalled();
    });

    it('should handle email already exists error', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'StrongP@ss123',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      mockReq.body = userData;
      User.createUser = jest.fn().mockRejectedValue(new Error('Email already exists'));

      await userController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
        error_code: 'REGISTRATION_FAILED'
      });
    });

    it('should handle database errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ss123',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      mockReq.body = userData;
      User.createUser = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await userController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed',
        error_code: 'REGISTRATION_FAILED'
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'StrongP@ss123'
      };

      const mockAuthResult = {
        user: {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          email: loginData.email,
          full_name: 'Test User',
          role: 'CANDIDATE'
        },
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_in: '1h'
      };

      mockReq.body = loginData;
      User.authenticate = jest.fn().mockResolvedValue(mockAuthResult);

      await userController.login(mockReq, mockRes);

      expect(User.authenticate).toHaveBeenCalledWith(loginData.email, loginData.password);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockAuthResult
      });
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockReq.body = loginData;
      User.authenticate = jest.fn().mockRejectedValue(new Error('Invalid email or password'));

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed: Invalid email or password',
        error_code: 'AUTHENTICATION_FAILED'
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [
        { field: 'email', msg: 'Email is required' },
        { field: 'password', msg: 'Password is required' }
      ];

      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      });

      mockReq.body = {};

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
      expect(User.authenticate).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid_refresh_token';
      const mockRefreshResult = {
        user: {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'CANDIDATE'
        },
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'Bearer',
        expires_in: '1h'
      };

      mockReq.body = { refresh_token: refreshToken };
      User.refreshToken = jest.fn().mockResolvedValue(mockRefreshResult);

      await userController.refreshToken(mockReq, mockRes);

      expect(User.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: mockRefreshResult
      });
    });

    it('should return error for invalid refresh token', async () => {
      const refreshToken = 'invalid_refresh_token';

      mockReq.body = { refresh_token: refreshToken };
      User.refreshToken = jest.fn().mockRejectedValue(new Error('Invalid token'));

      await userController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token refresh failed: Invalid token',
        error_code: 'TOKEN_REFRESH_FAILED'
      });
    });

    it('should handle missing refresh token', async () => {
      const validationErrors = [
        { field: 'refresh_token', msg: 'Refresh token is required' }
      ];

      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      });

      mockReq.body = {};

      await userController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockProfile = {
        user_id: userId,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'CANDIDATE',
        profile_image_url: 'https://example.com/image.jpg',
        bio: 'Test bio',
        candidate_profile: {
          experience_level: 'JUNIOR',
          skills: ['JavaScript', 'React']
        }
      };

      mockReq.user = { user_id: userId };
      User.getUserProfile = jest.fn().mockResolvedValue(mockProfile);

      await userController.getProfile(mockReq, mockRes);

      expect(User.getUserProfile).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: { profile: mockProfile }
      });
    });

    it('should handle user not found', async () => {
      const userId = 'non-existent-user-id';

      mockReq.user = { user_id: userId };
      User.getUserProfile = jest.fn().mockRejectedValue(new Error('User not found'));

      await userController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get profile: User not found',
        error_code: 'PROFILE_GET_FAILED'
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        full_name: 'Updated Name',
        bio: 'Updated bio',
        website_url: 'https://updated-website.com'
      };

      const mockUpdatedProfile = {
        user_id: userId,
        full_name: updateData.full_name,
        bio: updateData.bio,
        website_url: updateData.website_url
      };

      mockReq.user = { user_id: userId };
      mockReq.body = updateData;
      User.updateProfile = jest.fn().mockResolvedValue(mockUpdatedProfile);

      await userController.updateProfile(mockReq, mockRes);

      expect(User.updateProfile).toHaveBeenCalledWith(userId, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: { profile: mockUpdatedProfile }
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [
        { field: 'email', msg: 'Invalid email format' }
      ];

      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      });

      mockReq.body = { email: 'invalid-email' };

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
      expect(User.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { full_name: 'Updated Name' };

      mockReq.user = { user_id: userId };
      mockReq.body = updateData;
      User.updateProfile = jest.fn().mockRejectedValue(new Error('Database error'));

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update profile: Database error',
        error_code: 'PROFILE_UPDATE_FAILED'
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const passwordData = {
        current_password: 'OldPass123!',
        new_password: 'NewPass123!'
      };

      mockReq.user = { user_id: userId };
      mockReq.body = passwordData;
      User.changePassword = jest.fn().mockResolvedValue({ message: 'Password updated successfully' });

      await userController.changePassword(mockReq, mockRes);

      expect(User.changePassword).toHaveBeenCalledWith(
        userId,
        passwordData.current_password,
        passwordData.new_password
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully'
      });
    });

    it('should handle incorrect current password', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const passwordData = {
        current_password: 'WrongPass123!',
        new_password: 'NewPass123!'
      };

      mockReq.user = { user_id: userId };
      mockReq.body = passwordData;
      User.changePassword = jest.fn().mockRejectedValue(new Error('Current password is incorrect'));

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to change password: Current password is incorrect',
        error_code: 'PASSWORD_CHANGE_FAILED'
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [
        { field: 'current_password', msg: 'Current password is required' },
        { field: 'new_password', msg: 'New password must be strong' }
      ];

      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      });

      mockReq.body = {};

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
      expect(User.changePassword).not.toHaveBeenCalled();
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate account successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockReq.user = { user_id: userId };
      User.deactivateAccount = jest.fn().mockResolvedValue({ message: 'Account deactivated successfully' });

      await userController.deactivateAccount(mockReq, mockRes);

      expect(User.deactivateAccount).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account deactivated successfully'
      });
    });

    it('should handle deactivation errors', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockReq.user = { user_id: userId };
      User.deactivateAccount = jest.fn().mockRejectedValue(new Error('Cannot deactivate account'));

      await userController.deactivateAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to deactivate account: Cannot deactivate account',
        error_code: 'ACCOUNT_DEACTIVATION_FAILED'
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser = {
        user_id: userId,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      mockReq.params = { userId };
      User.getUserProfile = jest.fn().mockResolvedValue(mockUser);

      await userController.getUserById(mockReq, mockRes);

      expect(User.getUserProfile).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved successfully',
        data: { user: mockUser }
      });
    });

    it('should handle user not found', async () => {
      const userId = 'non-existent-user-id';

      mockReq.params = { userId };
      User.getUserProfile = jest.fn().mockRejectedValue(new Error('User not found'));

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get user: User not found',
        error_code: 'USER_GET_FAILED'
      });
    });
  });

  describe('getUsers', () => {
    it('should get users with default pagination', async () => {
      const mockUsers = [
        { user_id: '1', email: 'user1@example.com', role: 'CANDIDATE' },
        { user_id: '2', email: 'user2@example.com', role: 'RECRUITER' }
      ];

      mockReq.query = {};
      User.getUsers = jest.fn().mockResolvedValue(mockUsers);

      await userController.getUsers(mockReq, mockRes);

      expect(User.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'DESC'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: mockUsers,
          pagination: {
            page: 1,
            limit: 20,
            total: mockUsers.length
          }
        }
      });
    });

    it('should get users with custom filters', async () => {
      const queryParams = {
        page: '2',
        limit: '10',
        role: 'CANDIDATE',
        search: 'john',
        is_active: 'true'
      };

      const mockUsers = [
        { user_id: '1', email: 'john@example.com', role: 'CANDIDATE' }
      ];

      mockReq.query = queryParams;
      User.getUsers = jest.fn().mockResolvedValue(mockUsers);

      await userController.getUsers(mockReq, mockRes);

      expect(User.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sort: 'created_at',
        order: 'DESC',
        role: 'CANDIDATE',
        search: 'john',
        is_active: true
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            users: mockUsers
          })
        })
      );
    });

    it('should handle database errors', async () => {
      mockReq.query = {};
      User.getUsers = jest.fn().mockRejectedValue(new Error('Database error'));

      await userController.getUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get users: Database error',
        error_code: 'USERS_GET_FAILED'
      });
    });
  });
}); 