const axios = require('axios');

describe('Comprehensive Endpoint Discovery', () => {
  const BASE_URL = process.env.TEST_SERVER_URL || 'http://localhost:5001';
  const timeout = 5000;

  // Define all possible endpoints to test
  const ENDPOINTS_TO_TEST = [
    // System endpoints
    { name: 'Health Check', method: 'GET', path: '/health', auth: false, category: 'system' },
    { name: 'Root', method: 'GET', path: '/', auth: false, category: 'system' },
    { name: 'API Docs', method: 'GET', path: '/api/docs', auth: false, category: 'system' },
    { name: 'Swagger UI', method: 'GET', path: '/api-docs', auth: false, category: 'system' },

    // Auth endpoints (v1)
    { name: 'Register V1', method: 'POST', path: '/api/v1/auth/register', auth: false, category: 'auth-v1' },
    { name: 'Login V1', method: 'POST', path: '/api/v1/auth/login', auth: false, category: 'auth-v1' },
    { name: 'Refresh Token V1', method: 'POST', path: '/api/v1/auth/refresh-token', auth: false, category: 'auth-v1' },
    { name: 'Logout V1', method: 'POST', path: '/api/v1/auth/logout', auth: true, category: 'auth-v1' },
    { name: 'Current User V1', method: 'GET', path: '/api/v1/auth/me', auth: true, category: 'auth-v1' },
    { name: 'Validate Token V1', method: 'GET', path: '/api/v1/auth/validate-token', auth: true, category: 'auth-v1' },

    // Auth endpoints (legacy)
    { name: 'Register Legacy', method: 'POST', path: '/api/auth/register', auth: false, category: 'auth-legacy' },
    { name: 'Login Legacy', method: 'POST', path: '/api/auth/login', auth: false, category: 'auth-legacy' },
    { name: 'Current User Legacy', method: 'GET', path: '/api/auth/me', auth: true, category: 'auth-legacy' },

    // User endpoints (v1)
    { name: 'User Profile V1', method: 'GET', path: '/api/v1/user/profile', auth: true, category: 'user-v1' },
    { name: 'Update Profile V1', method: 'PUT', path: '/api/v1/user/profile', auth: true, category: 'user-v1' },
    { name: 'Change Password V1', method: 'POST', path: '/api/v1/user/change-password', auth: true, category: 'user-v1' },

    // Jobs endpoints (v1)
    { name: 'Jobs List V1', method: 'GET', path: '/api/v1/jobs', auth: false, category: 'jobs-v1' },
    { name: 'Job By ID V1', method: 'GET', path: '/api/v1/jobs/test-job-id', auth: false, category: 'jobs-v1' },
    { name: 'Create Job V1', method: 'POST', path: '/api/v1/jobs', auth: true, category: 'jobs-v1' },
    { name: 'Latest Jobs V1', method: 'GET', path: '/api/v1/jobs/latest', auth: false, category: 'jobs-v1' },
    { name: 'Job Search V1', method: 'GET', path: '/api/v1/jobs/search', auth: false, category: 'jobs-v1' },
    { name: 'Job Stats V1', method: 'GET', path: '/api/v1/jobs/stats', auth: false, category: 'jobs-v1' },

    // Companies endpoints (v1)
    { name: 'Companies List V1', method: 'GET', path: '/api/v1/companies', auth: false, category: 'companies-v1' },
    { name: 'Company By ID V1', method: 'GET', path: '/api/v1/companies/test-company-id', auth: false, category: 'companies-v1' },
    { name: 'Create Company V1', method: 'POST', path: '/api/v1/companies', auth: true, category: 'companies-v1' },

    // Applications endpoints (v1)
    { name: 'Applications V1', method: 'GET', path: '/api/v1/applications', auth: true, category: 'applications-v1' },
    { name: 'Create Application V1', method: 'POST', path: '/api/v1/applications', auth: true, category: 'applications-v1' },
    { name: 'My Applications V1', method: 'GET', path: '/api/v1/applications/my-applications', auth: true, category: 'applications-v1' },

    // Admin endpoints (v1)
    { name: 'Admin Users V1', method: 'GET', path: '/api/v1/admin/users', auth: true, category: 'admin-v1' },
    { name: 'Admin Stats V1', method: 'GET', path: '/api/v1/admin/statistics', auth: true, category: 'admin-v1' },

    // Firebase endpoints (v1)
    { name: 'Firebase Config V1', method: 'GET', path: '/api/v1/firebase/config', auth: false, category: 'firebase-v1' },
    { name: 'Firebase Status V1', method: 'GET', path: '/api/v1/firebase/status', auth: false, category: 'firebase-v1' },

    // OTP endpoints (v1)
    { name: 'Send OTP V1', method: 'POST', path: '/api/v1/otp/send', auth: false, category: 'otp-v1' },
    { name: 'Verify OTP V1', method: 'POST', path: '/api/v1/otp/verify', auth: false, category: 'otp-v1' },
    { name: 'OTP Status V1', method: 'GET', path: '/api/v1/otp/status', auth: false, category: 'otp-v1' },

    // Test endpoints
    { name: 'Tests V1', method: 'GET', path: '/api/v1/tests/test-id', auth: true, category: 'tests-v1' },
    { name: 'Create Test V1', method: 'POST', path: '/api/v1/tests', auth: true, category: 'tests-v1' },

    // CVs endpoints (v1)
    { name: 'CVs List V1', method: 'GET', path: '/api/v1/cvs', auth: true, category: 'cvs-v1' },
    { name: 'Upload CV V1', method: 'POST', path: '/api/v1/cvs', auth: true, category: 'cvs-v1' },
    { name: 'My CVs V1', method: 'GET', path: '/api/v1/cvs/my-cvs', auth: true, category: 'cvs-v1' },

    // Notifications endpoints (v1)
    { name: 'Notifications V1', method: 'GET', path: '/api/v1/notifications', auth: true, category: 'notifications-v1' }
  ];

  beforeAll(async () => {
    // Check if server is running
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout });
      console.log('✅ Server is running:', healthResponse.data.service);
      console.log('   Database status:', healthResponse.data.database?.status);
      console.log('   Version:', healthResponse.data.version);
    } catch (error) {
      console.error('❌ Server health check failed:', error.message);
      throw new Error('Server is not accessible for testing');
    }
  });

  describe('System Endpoints', () => {
    it('should test all system endpoints', async () => {
      const systemEndpoints = ENDPOINTS_TO_TEST.filter(e => e.category === 'system');
      const results = [];

      for (const endpoint of systemEndpoints) {
        try {
          const response = await axios({
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.path}`,
            timeout
          });

          results.push({
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            status: response.status,
            accessible: true,
            responseType: typeof response.data,
            hasData: !!response.data
          });

          console.log(`✅ ${endpoint.name}: ${response.status}`);
        } catch (error) {
          const status = error.response?.status || 'ERROR';
          results.push({
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            status: status,
            accessible: status < 500,
            error: error.message
          });

          const icon = status < 500 ? '⚠️' : '❌';
          console.log(`${icon} ${endpoint.name}: ${status}`);
        }
      }

      // At least health should work
      const healthResult = results.find(r => r.name === 'Health Check');
      expect(healthResult?.accessible).toBe(true);
      expect(healthResult?.status).toBe(200);

      console.log(`\n📊 System Endpoints: ${results.filter(r => r.accessible).length}/${results.length} accessible\n`);
    });
  });

  describe('Authentication Endpoints Discovery', () => {
    it('should discover working auth endpoints', async () => {
      const authEndpoints = ENDPOINTS_TO_TEST.filter(e => e.category.startsWith('auth'));
      const results = [];

      for (const endpoint of authEndpoints) {
        try {
          let requestData = {};
          
          // Add sample data for POST requests
          if (endpoint.method === 'POST') {
            if (endpoint.path.includes('register')) {
              requestData = {
                email: 'test@example.com',
                password: 'Test123!',
                password_confirmation: 'Test123!',
                full_name: 'Test User',
                role: 'CANDIDATE'
              };
            } else if (endpoint.path.includes('login')) {
              requestData = {
                email: 'test@example.com',
                password: 'Test123!'
              };
            } else if (endpoint.path.includes('refresh-token')) {
              requestData = {
                refresh_token: 'sample-token'
              };
            }
          }

          const config = {
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.path}`,
            timeout,
            ...(endpoint.method !== 'GET' && { data: requestData })
          };

          if (endpoint.auth) {
            config.headers = { Authorization: 'Bearer sample-token' };
          }

          const response = await axios(config);

          results.push({
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            status: response.status,
            accessible: true,
            requiresAuth: endpoint.auth,
            responseKeys: Object.keys(response.data || {})
          });

          console.log(`✅ ${endpoint.name}: ${response.status}`);
        } catch (error) {
          const status = error.response?.status || 'ERROR';
          results.push({
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            status: status,
            accessible: status !== 'ERROR' && status < 500,
            requiresAuth: endpoint.auth,
            error: error.response?.data?.error || error.message
          });

          const icon = status < 500 ? '⚠️' : '❌';
          console.log(`${icon} ${endpoint.name}: ${status} - ${error.response?.data?.error || error.message}`);
        }
      }

      const accessibleCount = results.filter(r => r.accessible).length;
      console.log(`\n📊 Auth Endpoints: ${accessibleCount}/${results.length} accessible\n`);

      // Should have some working auth endpoints
      expect(accessibleCount).toBeGreaterThan(0);
    });
  });

  describe('Public Endpoints Discovery', () => {
    it('should test all public endpoints (no auth required)', async () => {
      const publicEndpoints = ENDPOINTS_TO_TEST.filter(e => !e.auth);
      const results = [];

      for (const endpoint of publicEndpoints) {
        try {
          let requestData = {};
          
          if (endpoint.method === 'POST') {
            // Add minimal data for POST endpoints
            requestData = { test: 'data' };
          }

          const response = await axios({
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.path}`,
            timeout,
            ...(endpoint.method !== 'GET' && { data: requestData })
          });

          results.push({
            name: endpoint.name,
            category: endpoint.category,
            path: endpoint.path,
            status: response.status,
            accessible: true,
            hasData: !!response.data,
            dataSize: JSON.stringify(response.data || {}).length
          });

          console.log(`✅ ${endpoint.name}: ${response.status} (${endpoint.category})`);
        } catch (error) {
          const status = error.response?.status || 'ERROR';
          results.push({
            name: endpoint.name,
            category: endpoint.category,
            path: endpoint.path,
            status: status,
            accessible: status < 500,
            error: error.response?.data?.error || error.message
          });

          const icon = status < 500 ? '⚠️' : '❌';
          console.log(`${icon} ${endpoint.name}: ${status} - ${error.response?.data?.error || error.message}`);
        }
      }

      // Group by category
      const byCategory = results.reduce((acc, result) => {
        if (!acc[result.category]) acc[result.category] = [];
        acc[result.category].push(result);
        return acc;
      }, {});

      console.log('\n📊 PUBLIC ENDPOINTS SUMMARY:');
      Object.entries(byCategory).forEach(([category, endpoints]) => {
        const accessible = endpoints.filter(e => e.accessible).length;
        console.log(`   ${category}: ${accessible}/${endpoints.length} accessible`);
      });

      const totalAccessible = results.filter(r => r.accessible).length;
      expect(totalAccessible).toBeGreaterThan(0);
    });
  });

  describe('Generate Endpoint Report', () => {
    it('should generate comprehensive endpoint accessibility report', async () => {
      const report = {
        timestamp: new Date().toISOString(),
        server_info: {},
        categories: {},
        summary: {
          total_tested: 0,
          accessible: 0,
          authentication_required: 0,
          public_endpoints: 0,
          error_endpoints: 0
        }
      };

      // Get server info
      try {
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        report.server_info = {
          service: healthResponse.data.service,
          version: healthResponse.data.version,
          status: healthResponse.data.status,
          database_status: healthResponse.data.database?.status,
          uptime: healthResponse.data.uptime
        };
      } catch (error) {
        report.server_info = { error: 'Health check failed' };
      }

      // Test all endpoints
      for (const endpoint of ENDPOINTS_TO_TEST) {
        const category = endpoint.category;
        if (!report.categories[category]) {
          report.categories[category] = {
            total: 0,
            accessible: 0,
            endpoints: []
          };
        }

        try {
          let requestData = {};
          if (endpoint.method === 'POST') {
            requestData = { test: 'data' };
          }

          const config = {
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.path}`,
            timeout: 3000,
            ...(endpoint.method !== 'GET' && { data: requestData })
          };

          if (endpoint.auth) {
            config.headers = { Authorization: 'Bearer test-token' };
          }

          const response = await axios(config);

          const endpointResult = {
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            status: response.status,
            accessible: true,
            requires_auth: endpoint.auth,
            response_size: JSON.stringify(response.data || {}).length
          };

          report.categories[category].endpoints.push(endpointResult);
          report.categories[category].accessible++;
          report.summary.accessible++;

          if (endpoint.auth) {
            report.summary.authentication_required++;
          } else {
            report.summary.public_endpoints++;
          }

        } catch (error) {
          const status = error.response?.status || 'ERROR';
          const endpointResult = {
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            status: status,
            accessible: status < 500,
            requires_auth: endpoint.auth,
            error: error.response?.data?.error || error.message
          };

          report.categories[category].endpoints.push(endpointResult);
          
          if (status < 500) {
            report.summary.accessible++;
          } else {
            report.summary.error_endpoints++;
          }
        }

        report.categories[category].total++;
        report.summary.total_tested++;
      }

      // Log comprehensive report
      console.log('\n='.repeat(60));
      console.log('📋 COMPREHENSIVE ENDPOINT ACCESSIBILITY REPORT');
      console.log('='.repeat(60));
      console.log(`🕐 Timestamp: ${report.timestamp}`);
      console.log(`🏢 Service: ${report.server_info.service} v${report.server_info.version}`);
      console.log(`📊 Database: ${report.server_info.database_status}`);
      console.log(`⏱️  Uptime: ${report.server_info.uptime}s`);
      console.log('');
      console.log('📈 SUMMARY:');
      console.log(`   Total Tested: ${report.summary.total_tested}`);
      console.log(`   Accessible: ${report.summary.accessible}`);
      console.log(`   Public: ${report.summary.public_endpoints}`);
      console.log(`   Auth Required: ${report.summary.authentication_required}`);
      console.log(`   Errors: ${report.summary.error_endpoints}`);
      console.log('');

      Object.entries(report.categories).forEach(([category, data]) => {
        console.log(`📂 ${category.toUpperCase()}: ${data.accessible}/${data.total}`);
        data.endpoints.forEach(endpoint => {
          const icon = endpoint.accessible ? '✅' : '❌';
          const authIcon = endpoint.requires_auth ? '🔒' : '🔓';
          console.log(`   ${icon} ${authIcon} ${endpoint.method} ${endpoint.path} (${endpoint.status})`);
        });
        console.log('');
      });

      console.log('='.repeat(60));

      // Basic validation
      expect(report.summary.total_tested).toBeGreaterThan(0);
      expect(report.summary.accessible).toBeGreaterThan(0);
      expect(report.server_info.service).toBeDefined();
    });
  });
}); 