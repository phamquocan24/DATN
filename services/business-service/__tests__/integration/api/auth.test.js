const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { testDatabase } = require('../../helpers/database');

// Mock Firebase before importing modules
jest.mock('../../../modules/firebase', () => require('../../mocks/firebase').mockFirebaseModule);

// Import after mocking
const UserController = require('../../../controllers/UserController');
const { authenticateToken } = require('../../../modules/auth');

describe('Authentication API Integration Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Setup test database
    await testDatabase.connect();
    
    // Create Express app for testing
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Setup auth routes
    const userController = new UserController();
    
    app.post('/api/v1/users/register', userController.register.bind(userController));
    app.post('/api/v1/users/login', userController.login.bind(userController));
    app.post('/api/v1/users/refresh-token', userController.refreshToken.bind(userController));
    app.get('/api/v1/users/profile', authenticateToken, userController.getProfile.bind(userController));
    app.put('/api/v1/users/profile', authenticateToken, userController.updateProfile.bind(userController));
    app.post('/api/v1/users/change-password', authenticateToken, userController.changePassword.bind(userController));

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    });
  });

  afterAll(async () => {
    await testDatabase.cleanup();
    await testDatabase.disconnect();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await testDatabase.cleanup();
  });

  describe('POST /api/v1/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Integration Test User',
        role: 'CANDIDATE',
        phone: '+84123456789'
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            user_id: expect.any(String)
          }
        }
      });

      // Verify user was created in database
      const createdUser = await testDatabase.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(createdUser.rows).toHaveLength(1);
      expect(createdUser.rows[0].email).toBe(userData.email);
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'StrongP@ss123',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      // First registration
      await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Email already exists')
      });
    });

    it('should return validation error for weak password', async () => {
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: '123',
        full_name: 'Test User',
        role: 'CANDIDATE'
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return validation error for invalid role', async () => {
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Test User',
        role: 'INVALID_ROLE'
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation failed')
      });
    });
  });

  describe('POST /api/v1/users/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Login Test User',
        role: 'CANDIDATE'
      };

      const registerResponse = await request(app)
        .post('/api/v1/users/register')
        .send(userData);

      testUser = {
        ...userData,
        user_id: registerResponse.body.data.user.user_id
      };
    });

    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            user_id: testUser.user_id,
            email: testUser.email,
            full_name: testUser.full_name,
            role: testUser.role
          },
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          token_type: 'Bearer',
          expires_in: expect.any(String)
        }
      });
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'WrongPassword123'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authentication failed'),
        error_code: 'AUTHENTICATION_FAILED'
      });
    });

    it('should return error for non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'StrongP@ss123'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authentication failed'),
        error_code: 'AUTHENTICATION_FAILED'
      });
    });

    it('should return validation error for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation failed')
      });
    });
  });

  describe('POST /api/v1/users/refresh-token', () => {
    let testUser;
    let refreshToken;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Refresh Test User',
        role: 'CANDIDATE'
      };

      await request(app)
        .post('/api/v1/users/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      testUser = loginResponse.body.data.user;
      refreshToken = loginResponse.body.data.refresh_token;
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/users/refresh-token')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: {
            user_id: testUser.user_id,
            email: testUser.email,
            role: testUser.role
          },
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          token_type: 'Bearer',
          expires_in: expect.any(String)
        }
      });

      // New tokens should be different from old ones
      expect(response.body.data.access_token).not.toBe(refreshToken);
      expect(response.body.data.refresh_token).not.toBe(refreshToken);
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/users/refresh-token')
        .send({ refresh_token: 'invalid_refresh_token' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Token refresh failed'),
        error_code: 'TOKEN_REFRESH_FAILED'
      });
    });

    it('should return validation error for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/users/refresh-token')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation failed')
      });
    });
  });

  describe('GET /api/v1/users/profile', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Profile Test User',
        role: 'CANDIDATE'
      };

      await request(app)
        .post('/api/v1/users/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      testUser = loginResponse.body.data.user;
      accessToken = loginResponse.body.data.access_token;
    });

    it('should get user profile successfully with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          profile: {
            user_id: testUser.user_id,
            email: testUser.email,
            full_name: testUser.full_name,
            role: testUser.role
          }
        }
      });
    });

    it('should return error for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Access denied'),
        error_code: 'NO_TOKEN'
      });
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid token'),
        error_code: 'INVALID_TOKEN'
      });
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Update Profile Test User',
        role: 'CANDIDATE'
      };

      await request(app)
        .post('/api/v1/users/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      testUser = loginResponse.body.data.user;
      accessToken = loginResponse.body.data.access_token;
    });

    it('should update profile successfully', async () => {
      const updateData = {
        full_name: 'Updated Full Name',
        bio: 'Updated bio information',
        website_url: 'https://updated-website.com'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile: expect.objectContaining({
            user_id: testUser.user_id,
            full_name: updateData.full_name
          })
        }
      });

      // Verify update in database
      const updatedUser = await testDatabase.query(
        'SELECT full_name FROM users WHERE user_id = $1',
        [testUser.user_id]
      );
      expect(updatedUser.rows[0].full_name).toBe(updateData.full_name);
    });

    it('should return validation error for invalid update data', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return error for unauthorized access', async () => {
      const updateData = {
        full_name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .send(updateData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Access denied')
      });
    });
  });

  describe('POST /api/v1/users/change-password', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: global.testUtils.generateUniqueEmail(),
        password: 'StrongP@ss123',
        full_name: 'Change Password Test User',
        role: 'CANDIDATE'
      };

      await request(app)
        .post('/api/v1/users/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      testUser = loginResponse.body.data.user;
      accessToken = loginResponse.body.data.access_token;
    });

    it('should change password successfully', async () => {
      const passwordData = {
        current_password: 'StrongP@ss123',
        new_password: 'NewStrongP@ss456'
      };

      const response = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password changed successfully'
      });

      // Verify new password works by logging in
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUser.email,
          password: passwordData.new_password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should return error for incorrect current password', async () => {
      const passwordData = {
        current_password: 'WrongCurrentPassword',
        new_password: 'NewStrongP@ss456'
      };

      const response = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Current password is incorrect')
      });
    });

    it('should return validation error for weak new password', async () => {
      const passwordData = {
        current_password: 'StrongP@ss123',
        new_password: '123'
      };

      const response = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return error for unauthorized access', async () => {
      const passwordData = {
        current_password: 'StrongP@ss123',
        new_password: 'NewStrongP@ss456'
      };

      const response = await request(app)
        .post('/api/v1/users/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Access denied')
      });
    });
  });
}); 