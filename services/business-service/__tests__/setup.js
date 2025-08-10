const { config } = require('dotenv');

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Set test database URL if not set
if (!process.env.TEST_DATABASE_URL) {
  process.env.TEST_DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5432/cv_test_db';
}

// Set JWT secrets for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';

// Set other test configurations
process.env.LOG_LEVEL = 'error'; // Reduce logging during tests
process.env.BCRYPT_SALT_ROUNDS = '4'; // Faster bcrypt for tests
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper function to create test user data
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'TestPass123!',
    full_name: 'Test User',
    role: 'CANDIDATE',
    ...overrides
  }),

  // Helper function to create test job data
  createTestJob: (overrides = {}) => ({
    job_title: 'Test Job Title',
    job_description: 'Test job description',
    requirements: 'Test requirements',
    benefits: 'Test benefits',
    salary_min: 1000,
    salary_max: 2000,
    location: 'Test Location',
    job_type: 'FULL_TIME',
    experience_required: 'JUNIOR',
    ...overrides
  }),

  // Helper function to create test company data
  createTestCompany: (overrides = {}) => ({
    company_name: 'Test Company',
    company_description: 'Test company description',
    company_website: 'https://testcompany.com',
    company_email: 'contact@testcompany.com',
    company_phone: '+84123456789',
    industry: 'Information Technology',
    company_size: 'MEDIUM',
    ...overrides
  }),

  // Helper function to create test application data
  createTestApplication: (overrides = {}) => ({
    cover_letter: 'Test cover letter',
    status: 'PENDING',
    ...overrides
  }),

  // Helper function to wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper function to generate unique email
  generateUniqueEmail: () => `test${Date.now()}${Math.random().toString(36).substr(2, 9)}@example.com`
};

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
}

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
  if (global.testDatabase) {
    await global.testDatabase.cleanup();
  }
}); 