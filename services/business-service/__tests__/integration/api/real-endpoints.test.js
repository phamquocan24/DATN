const axios = require('axios');

describe('Real Server Endpoint Testing', () => {
  const BASE_URL = process.env.TEST_SERVER_URL || 'http://localhost:5001';
  let authToken = null;
  let testUser = null;

  // Test data
  const TEST_USER_DATA = {
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    full_name: 'Test User for Endpoints',
    role: 'CANDIDATE',
    phone: '+84123456789'
  };

  beforeAll(async () => {
    // Check if server is running
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running and accessible');
    } catch (error) {
      console.warn('⚠️  Server may not be running:', error.message);
    }
  });

  describe('Health Check', () => {
    it('should return server health status', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/health`);
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          status: 'OK',
          service: 'Business Service',
          timestamp: expect.any(String)
        });
        
        console.log('✅ Health check passed');
        console.log('   Server:', response.data.service);
        console.log('   Version:', response.data.version);
        console.log('   Environment:', response.data.environment);
        console.log('   Database:', response.data.database?.status);
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
        throw error;
      }
    });
  });

  describe('API Documentation', () => {
    it('should return API documentation at root endpoint', async () => {
      try {
        const response = await axios.get(BASE_URL);
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          message: expect.stringContaining('Business Service API'),
          version: expect.any(String),
          endpoints: expect.any(Object)
        });
        
        console.log('✅ Root endpoint accessible');
        console.log('   Available endpoints:', Object.keys(response.data.endpoints.v1).join(', '));
      } catch (error) {
        console.error('❌ Root endpoint failed:', error.message);
        throw error;
      }
    });

    it('should return detailed API docs', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/docs`);
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          name: 'Business Service API',
          version: expect.any(String),
          baseUrl: '/api/v1',
          endpoints: expect.any(Object)
        });
        
        console.log('✅ API docs accessible');
        console.log('   Base URL:', response.data.baseUrl);
      } catch (error) {
        console.error('❌ API docs failed:', error.message);
        throw error;
      }
    });
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      try {
        const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, TEST_USER_DATA);
        
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          success: true,
          message: 'User registered successfully',
          data: {
            user: expect.objectContaining({
              email: TEST_USER_DATA.email,
              full_name: TEST_USER_DATA.full_name,
              role: TEST_USER_DATA.role
            })
          }
        });
        
        testUser = response.data.data.user;
        console.log('✅ User registration successful');
        console.log('   User ID:', testUser.user_id);
        console.log('   Email:', testUser.email);
        console.log('   Role:', testUser.role);
      } catch (error) {
        console.error('❌ Registration failed:', error.response?.data || error.message);
        
        // If user already exists, try to login instead
        if (error.response?.status === 409) {
          console.log('   User already exists, continuing with login test...');
        } else {
          throw error;
        }
      }
    });

    it('should login with valid credentials', async () => {
      try {
        const loginData = {
          email: TEST_USER_DATA.email,
          password: TEST_USER_DATA.password
        };

        const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, loginData);
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          success: true,
          message: 'Login successful',
          data: {
            user: expect.any(Object),
            access_token: expect.any(String),
            refresh_token: expect.any(String),
            token_type: 'Bearer'
          }
        });
        
        authToken = response.data.data.access_token;
        testUser = response.data.data.user;
        
        console.log('✅ Login successful');
        console.log('   Token received:', authToken.substring(0, 20) + '...');
        console.log('   Token type:', response.data.data.token_type);
        console.log('   Expires in:', response.data.data.expires_in);
      } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should validate current user token', async () => {
      if (!authToken) {
        console.log('⏭️  Skipping token validation - no auth token available');
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              user_id: expect.any(String),
              email: expect.any(String),
              role: expect.any(String)
            })
          }
        });
        
        console.log('✅ Token validation successful');
        console.log('   User ID:', response.data.data.user.user_id);
        console.log('   Email:', response.data.data.user.email);
        console.log('   Role:', response.data.data.user.role);
      } catch (error) {
        console.error('❌ Token validation failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('User Profile Endpoints', () => {
    it('should get user profile', async () => {
      if (!authToken) {
        console.log('⏭️  Skipping profile test - no auth token available');
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/v1/user/profile`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          success: true,
          data: {
            profile: expect.objectContaining({
              user_id: expect.any(String),
              email: expect.any(String),
              full_name: expect.any(String)
            })
          }
        });
        
        console.log('✅ Profile retrieval successful');
        console.log('   Profile:', response.data.data.profile.full_name);
      } catch (error) {
        console.error('❌ Profile retrieval failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should update user profile', async () => {
      if (!authToken) {
        console.log('⏭️  Skipping profile update - no auth token available');
        return;
      }

      try {
        const updateData = {
          bio: 'Updated bio from endpoint test',
          location: 'Ho Chi Minh City'
        };

        const response = await axios.put(`${BASE_URL}/api/v1/user/profile`, updateData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          success: true,
          message: expect.stringContaining('updated')
        });
        
        console.log('✅ Profile update successful');
      } catch (error) {
        console.error('❌ Profile update failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('Jobs Endpoints', () => {
    it('should get public jobs list', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/jobs`);
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          success: true,
          data: expect.objectContaining({
            jobs: expect.any(Array),
            pagination: expect.any(Object)
          })
        });
        
        console.log('✅ Public jobs retrieval successful');
        console.log('   Jobs count:', response.data.data.jobs.length);
        console.log('   Pagination:', response.data.data.pagination);
      } catch (error) {
        console.error('❌ Jobs retrieval failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should get latest jobs', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/jobs/latest`);
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          success: true,
          data: expect.any(Object)
        });
        
        console.log('✅ Latest jobs retrieval successful');
      } catch (error) {
        console.error('❌ Latest jobs failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('Companies Endpoints', () => {
    it('should get companies list', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/companies`);
        
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          success: true,
          data: expect.any(Object)
        });
        
        console.log('✅ Companies retrieval successful');
      } catch (error) {
        console.error('❌ Companies retrieval failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      try {
        await axios.get(`${BASE_URL}/api/v1/non-existent-endpoint`);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response?.status).toBe(404);
        console.log('✅ 404 handling works correctly');
      }
    });

    it('should return 401 for protected endpoints without auth', async () => {
      try {
        await axios.get(`${BASE_URL}/api/v1/user/profile`);
        
        // Should not reach here  
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response?.status).toBe(401);
        console.log('✅ 401 authentication required works correctly');
      }
    });
  });

  describe('Comprehensive Endpoint Discovery', () => {
    it('should test connectivity to all major endpoint categories', async () => {
      const endpointsToTest = [
        { name: 'Health Check', method: 'GET', url: '/health', requiresAuth: false },
        { name: 'Root API', method: 'GET', url: '/', requiresAuth: false },
        { name: 'API Docs', method: 'GET', url: '/api/docs', requiresAuth: false },
        { name: 'Jobs List', method: 'GET', url: '/api/v1/jobs', requiresAuth: false },
        { name: 'Companies List', method: 'GET', url: '/api/v1/companies', requiresAuth: false },
        { name: 'Latest Jobs', method: 'GET', url: '/api/v1/jobs/latest', requiresAuth: false },
        { name: 'User Profile', method: 'GET', url: '/api/v1/user/profile', requiresAuth: true },
        { name: 'Current User', method: 'GET', url: '/api/v1/auth/me', requiresAuth: true }
      ];

      const results = [];

      console.log('\n=== COMPREHENSIVE ENDPOINT TEST ===');
      
      for (const endpoint of endpointsToTest) {
        try {
          const config = {
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.url}`
          };

          if (endpoint.requiresAuth && authToken) {
            config.headers = { Authorization: `Bearer ${authToken}` };
          }

          const response = await axios(config);
          
          results.push({
            name: endpoint.name,
            status: response.status,
            success: true,
            requiresAuth: endpoint.requiresAuth,
            hasAuth: !!authToken
          });
          
          console.log(`✅ ${endpoint.name}: ${response.status}`);
        } catch (error) {
          const status = error.response?.status || 'ERROR';
          results.push({
            name: endpoint.name,
            status: status,
            success: status < 500, // 4xx errors are "successful" for our testing purposes
            requiresAuth: endpoint.requiresAuth,
            hasAuth: !!authToken,
            error: error.message
          });
          
          const icon = status < 500 ? '⚠️' : '❌';
          console.log(`${icon} ${endpoint.name}: ${status} - ${error.message}`);
        }
      }

      console.log('===================================\n');

      // Summary
      const successful = results.filter(r => r.success).length;
      const total = results.length;
      
      console.log(`📊 ENDPOINT TEST SUMMARY: ${successful}/${total} accessible`);
      
      // At least basic endpoints should work
      expect(successful).toBeGreaterThan(total * 0.5); // At least 50% should be accessible
      
      // Health check should always work
      const healthCheck = results.find(r => r.name === 'Health Check');
      expect(healthCheck?.success).toBe(true);
    });
  });
}); 