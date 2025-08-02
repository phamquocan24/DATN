const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const { testDatabase } = require('../../helpers/database');

// Mock bcrypt with proper async function mocks
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('mocked_hash'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

describe('User Model', () => {
  let userModel;
  let mockDb;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock database
    mockDb = {
      query: jest.fn()
    };
    
    // Create User instance
    userModel = new User();
    userModel.db = mockDb;
    
    // Setup default environment variables
    process.env.BCRYPT_SALT_ROUNDS = '4';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      const hashedPassword = 'hashed_password_123';
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock bcrypt.hash
      bcrypt.hash.mockResolvedValue(hashedPassword);

      // Mock database queries
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // findOne - no existing user
        .mockResolvedValueOnce({ // create user
          rows: [{
            user_id: mockUserId,
            email: userData.email,
            password_hash: hashedPassword,
            full_name: userData.full_name,
            role: userData.role,
            auth_provider: 'LOCAL',
            is_active: true,
            created_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // create user profile

      const result = await userModel.createUser(userData);

      // Verify bcrypt was called
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 4);

      // Verify database queries
      expect(mockDb.query).toHaveBeenCalledTimes(3);
      
      // Verify user profile creation
      expect(mockDb.query).toHaveBeenCalledWith(
        'INSERT INTO user_profile (user_id) VALUES ($1)',
        [mockUserId],
        'create_user_profile'
      );

      // Verify result doesn't contain password
      expect(result).toEqual({
        user_id: mockUserId,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        auth_provider: 'LOCAL',
        is_active: true,
        created_at: expect.any(Date)
      });
      expect(result.password_hash).toBeUndefined();
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123'
      };

      // Mock existing user found
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          email: userData.email
        }]
      });

      await expect(userModel.createUser(userData)).rejects.toThrow('Failed to create user: Email already exists');
    });

    it('should create user without password for social auth', async () => {
      const userData = {
        email: 'social@example.com',
        full_name: 'Social User',
        role: 'CANDIDATE',
        auth_provider: 'GOOGLE'
      };

      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // no existing user
        .mockResolvedValueOnce({ // create user
          rows: [{
            user_id: mockUserId,
            email: userData.email,
            password_hash: null,
            full_name: userData.full_name,
            role: userData.role,
            auth_provider: 'GOOGLE',
            is_active: true,
            created_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // create user profile

      const result = await userModel.createUser(userData);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(result.password_hash).toBeUndefined();
      expect(result.auth_provider).toBe('GOOGLE');
    });
  });

  describe('authenticate', () => {
    it('should authenticate user successfully with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email,
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'CANDIDATE',
        auth_provider: 'LOCAL'
      };

      const mockTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_in: '1h'
      };

      // Mock database queries
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // findOne
        .mockResolvedValueOnce({ rows: [] }); // update last login

      // Mock bcrypt compare
      bcrypt.compare.mockResolvedValue(true);

      // Mock token generation
      userModel.generateTokens = jest.fn().mockReturnValue(mockTokens);

      const result = await userModel.authenticate(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password_hash);
      expect(userModel.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: {
          user_id: mockUser.user_id,
          email: mockUser.email,
          full_name: mockUser.full_name,
          role: mockUser.role,
          auth_provider: mockUser.auth_provider
        },
        ...mockTokens
      });
    });

    it('should throw error for invalid password', async () => {
      const email = 'test@example.com';
      const password = 'wrong_password';
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email,
        password_hash: 'hashed_password',
        auth_provider: 'LOCAL'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(false);

      await expect(userModel.authenticate(email, password)).rejects.toThrow('Authentication failed: Invalid email or password');
    });

    it('should throw error for non-existent user', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(userModel.authenticate(email, password)).rejects.toThrow('Authentication failed: Invalid email or password');
    });

    it('should throw error for social auth user trying local login', async () => {
      const email = 'social@example.com';
      const password = 'password123';
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email,
        password_hash: null,
        auth_provider: 'GOOGLE'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      await expect(userModel.authenticate(email, password)).rejects.toThrow('Authentication failed: Please use social login or reset your password');
    });
  });

  describe('generateTokens', () => {
    it('should generate valid JWT tokens', () => {
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      const mockAccessToken = 'mock_access_token';
      const mockRefreshToken = 'mock_refresh_token';

      jwt.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = userModel.generateTokens(mockUser);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      
      // Check access token generation
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          role: mockUser.role,
          full_name: mockUser.full_name,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Check refresh token generation
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          role: mockUser.role,
          full_name: mockUser.full_name,
          type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      expect(result).toEqual({
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        token_type: 'Bearer',
        expires_in: '1h'
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      const refreshToken = 'valid_refresh_token';
      const decodedToken = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'CANDIDATE'
      };
      const mockUser = {
        user_id: decodedToken.user_id,
        email: decodedToken.email,
        full_name: 'Test User',
        role: decodedToken.role,
        is_active: true
      };
      const mockTokens = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'Bearer',
        expires_in: '1h'
      };

      jwt.verify.mockReturnValue(decodedToken);
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      userModel.generateTokens = jest.fn().mockReturnValue(mockTokens);

      const result = await userModel.refreshToken(refreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(userModel.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: mockUser,
        ...mockTokens
      });
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid_refresh_token';

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(userModel.refreshToken(refreshToken)).rejects.toThrow('Token refresh failed: Invalid token');
    });

    it('should throw error for inactive user', async () => {
      const refreshToken = 'valid_refresh_token';
      const decodedToken = {
        user_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      const mockUser = {
        user_id: decodedToken.user_id,
        is_active: false
      };

      jwt.verify.mockReturnValue(decodedToken);
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      await expect(userModel.refreshToken(refreshToken)).rejects.toThrow('Token refresh failed: User not found or inactive');
    });
  });

  describe('getUserProfile', () => {
    it('should get complete user profile for candidate', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockProfile = {
        user_id: userId,
        email: 'candidate@example.com',
        full_name: 'Test Candidate',
        role: 'CANDIDATE',
        role_profile_id: 'profile_123',
        profile_image_url: 'https://example.com/image.jpg',
        bio: 'Test bio'
      };

      const mockCandidateProfile = {
        profile_id: 'profile_123',
        experience_level: 'JUNIOR',
        skills: ['JavaScript', 'React']
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockProfile] });
      userModel.getCandidateProfile = jest.fn().mockResolvedValue(mockCandidateProfile);

      const result = await userModel.getUserProfile(userId);

      expect(result).toEqual({
        ...mockProfile,
        candidate_profile: mockCandidateProfile
      });
      expect(userModel.getCandidateProfile).toHaveBeenCalledWith(userId);
    });

    it('should get basic user profile for user without role profile', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockProfile = {
        user_id: userId,
        email: 'user@example.com',
        full_name: 'Test User',
        role: 'CANDIDATE',
        role_profile_id: null
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockProfile] });

      const result = await userModel.getUserProfile(userId);

      expect(result).toEqual(mockProfile);
    });

    it('should throw error for non-existent user', async () => {
      const userId = 'non-existent-id';

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(userModel.getUserProfile(userId)).rejects.toThrow('Failed to get user profile: User not found');
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      // Mock findById method
      userModel.findById = jest.fn();
      userModel.update = jest.fn();
    });

    it('should change password successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const currentPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const mockUser = {
        user_id: userId,
        password_hash: 'old_hashed_password',
        auth_provider: 'LOCAL'
      };

      userModel.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new_hashed_password');
      userModel.update.mockResolvedValue({ user_id: userId });

      const result = await userModel.changePassword(userId, currentPassword, newPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password_hash);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 4);
      expect(userModel.update).toHaveBeenCalledWith(userId, { password_hash: 'new_hashed_password' });
      expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('should throw error for wrong current password', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const currentPassword = 'wrongpassword';
      const newPassword = 'newpassword123';
      const mockUser = {
        user_id: userId,
        password_hash: 'hashed_password',
        auth_provider: 'LOCAL'
      };

      userModel.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(userModel.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('Failed to change password: Current password is incorrect');
    });

    it('should throw error for social auth user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser = {
        user_id: userId,
        auth_provider: 'GOOGLE'
      };

      userModel.findById.mockResolvedValue(mockUser);

      await expect(userModel.changePassword(userId, 'current', 'new')).rejects.toThrow('Failed to change password: Cannot change password for social login accounts');
    });
  });
}); 