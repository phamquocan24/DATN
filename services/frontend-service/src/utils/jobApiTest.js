// Job API Integration Test Script
// Usage: Run this in browser console or Node.js environment

import adminApi from '../services/adminApi';
import candidateApi from '../services/candidateApi';
import hrApi from '../services/hrApi';

/**
 * Test all job management API endpoints according to specification:
 * GET /api/v1/jobs: Lấy danh sách tin tuyển dụng.
 * GET /api/v1/jobs/search: Tìm kiếm tin tuyển dụng.
 * GET /api/v1/jobs/latest: Lấy các tin tuyển dụng mới nhất.
 * GET /api/v1/jobs/stats: Lấy thống kê tin tuyển dụng.
 * GET /api/v1/jobs/my-jobs: Lấy các tin tuyển dụng của tôi.
 * GET /api/v1/jobs/pending: Lấy các tin tuyển dụng đang chờ duyệt.
 * GET /api/v1/jobs/recommendations: Lấy các tin tuyển dụng được đề xuất.
 * GET /api/v1/jobs/bookmarked: Lấy các tin tuyển dụng đã lưu.
 * GET /api/v1/jobs/:id: Lấy chi tiết tin tuyển dụng.
 * POST /api/v1/jobs: Tạo tin tuyển dụng mới.
 * PUT /api/v1/jobs/:id: Cập nhật tin tuyển dụng.
 * PATCH /api/v1/jobs/:id/status: Cập nhật trạng thái tin tuyển dụng.
 * DELETE /api/v1/jobs/:id: Xóa tin tuyển dụng.
 * GET /api/v1/jobs/company/:companyId: Lấy tin tuyển dụng theo công ty.
 * POST /api/v1/jobs/:id/bookmark: Lưu tin tuyển dụng.
 * DELETE /api/v1/jobs/:id/bookmark: Bỏ lưu tin tuyển dụng.
 * POST /api/v1/jobs/:id/approve: Phê duyệt tin tuyển dụng (Admin).
 * POST /api/v1/jobs/:id/reject: Từ chối tin tuyển dụng (Admin).
 */

class JobApiTester {
  constructor() {
    this.results = {
      admin: {},
      candidate: {},
      hr: {},
      overall: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
  }

  async testEndpoint(api, method, description, ...args) {
    try {
      console.log(`Testing: ${description}`);
      const result = await api[method](...args);
      console.log(`✅ PASS: ${description}`, result);
      this.results.overall.passed++;
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ FAIL: ${description}`, error.message);
      this.results.overall.failed++;
      return { success: false, error: error.message };
    } finally {
      this.results.overall.total++;
    }
  }

  async testAdminJobEndpoints() {
    console.log('\n🔧 Testing Admin Job API Endpoints...');
    
    this.results.admin.getAllJobs = await this.testEndpoint(
      adminApi, 'getAllJobs', 'Admin - Get all jobs'
    );

    this.results.admin.searchJobs = await this.testEndpoint(
      adminApi, 'searchJobs', 'Admin - Search jobs', { keyword: 'developer' }
    );

    this.results.admin.getLatestJobs = await this.testEndpoint(
      adminApi, 'getLatestJobs', 'Admin - Get latest jobs'
    );

    this.results.admin.getJobStats = await this.testEndpoint(
      adminApi, 'getJobStats', 'Admin - Get job statistics'
    );

    this.results.admin.getPendingJobs = await this.testEndpoint(
      adminApi, 'getPendingJobs', 'Admin - Get pending jobs'
    );

    // Test with mock job ID (skip if no jobs available)
    if (this.results.admin.getAllJobs.success && this.results.admin.getAllJobs.data?.data?.length > 0) {
      const jobId = this.results.admin.getAllJobs.data.data[0].id;
      
      this.results.admin.getJobById = await this.testEndpoint(
        adminApi, 'getJobById', 'Admin - Get job by ID', jobId
      );

      this.results.admin.approveJob = await this.testEndpoint(
        adminApi, 'approveJob', 'Admin - Approve job', jobId
      );

      this.results.admin.rejectJob = await this.testEndpoint(
        adminApi, 'rejectJob', 'Admin - Reject job', jobId
      );
    }
  }

  async testCandidateJobEndpoints() {
    console.log('\n👤 Testing Candidate Job API Endpoints...');
    
    this.results.candidate.getAllJobs = await this.testEndpoint(
      candidateApi, 'getAllJobs', 'Candidate - Get all jobs'
    );

    this.results.candidate.searchJobs = await this.testEndpoint(
      candidateApi, 'searchJobs', 'Candidate - Search jobs', { keyword: 'react' }
    );

    this.results.candidate.getLatestJobs = await this.testEndpoint(
      candidateApi, 'getLatestJobs', 'Candidate - Get latest jobs'
    );

    this.results.candidate.getJobStats = await this.testEndpoint(
      candidateApi, 'getJobStats', 'Candidate - Get job statistics'
    );

    this.results.candidate.getJobRecommendations = await this.testEndpoint(
      candidateApi, 'getJobRecommendations', 'Candidate - Get job recommendations'
    );

    this.results.candidate.getFavoriteJobs = await this.testEndpoint(
      candidateApi, 'getFavoriteJobs', 'Candidate - Get bookmarked jobs'
    );

    // Test with mock job ID and company ID
    if (this.results.candidate.getAllJobs.success && this.results.candidate.getAllJobs.data?.data?.length > 0) {
      const job = this.results.candidate.getAllJobs.data.data[0];
      const jobId = job.id;
      const companyId = job.company_id || job.companyId || '1';
      
      this.results.candidate.getJobById = await this.testEndpoint(
        candidateApi, 'getJobById', 'Candidate - Get job by ID', jobId
      );

      this.results.candidate.addJobToFavorites = await this.testEndpoint(
        candidateApi, 'addJobToFavorites', 'Candidate - Bookmark job', jobId
      );

      this.results.candidate.removeJobFromFavorites = await this.testEndpoint(
        candidateApi, 'removeJobFromFavorites', 'Candidate - Remove bookmark', jobId
      );

      this.results.candidate.getCompanyJobs = await this.testEndpoint(
        candidateApi, 'getCompanyJobs', 'Candidate - Get company jobs', companyId
      );
    }
  }

  async testHrJobEndpoints() {
    console.log('\n🏢 Testing HR Job API Endpoints...');
    
    this.results.hr.getAllJobs = await this.testEndpoint(
      hrApi, 'getAllJobs', 'HR - Get all jobs'
    );

    this.results.hr.getMyJobs = await this.testEndpoint(
      hrApi, 'getMyJobs', 'HR - Get my jobs'
    );

    this.results.hr.searchJobs = await this.testEndpoint(
      hrApi, 'searchJobs', 'HR - Search jobs', { keyword: 'manager' }
    );

    this.results.hr.getLatestJobs = await this.testEndpoint(
      hrApi, 'getLatestJobs', 'HR - Get latest jobs'
    );

    this.results.hr.getJobStats = await this.testEndpoint(
      hrApi, 'getJobStats', 'HR - Get job statistics'
    );

    // Test job CRUD operations (skip if user doesn't have permissions)
    const mockJobData = {
      title: 'Test Job',
      description: 'Test job description',
      requirements: 'Test requirements',
      location: 'Test Location',
      salary_min: 1000,
      salary_max: 2000,
      type: 'full-time'
    };

    this.results.hr.createJob = await this.testEndpoint(
      hrApi, 'createJob', 'HR - Create job', mockJobData
    );

    // Test with existing job ID
    if (this.results.hr.getMyJobs.success && this.results.hr.getMyJobs.data?.data?.length > 0) {
      const job = this.results.hr.getMyJobs.data.data[0];
      const jobId = job.id;
      const companyId = job.company_id || job.companyId || '1';
      
      this.results.hr.getJobById = await this.testEndpoint(
        hrApi, 'getJobById', 'HR - Get job by ID', jobId
      );

      this.results.hr.updateJob = await this.testEndpoint(
        hrApi, 'updateJob', 'HR - Update job', jobId, { ...mockJobData, title: 'Updated Test Job' }
      );

      this.results.hr.updateJobStatus = await this.testEndpoint(
        hrApi, 'updateJobStatus', 'HR - Update job status', jobId, 'active'
      );

      this.results.hr.getCompanyJobs = await this.testEndpoint(
        hrApi, 'getCompanyJobs', 'HR - Get company jobs', companyId
      );

      // Test delete last (cleanup)
      this.results.hr.deleteJob = await this.testEndpoint(
        hrApi, 'deleteJob', 'HR - Delete job', jobId
      );
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Job API Integration Tests...\n');
    
    await this.testAdminJobEndpoints();
    await this.testCandidateJobEndpoints();
    await this.testHrJobEndpoints();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Total Tests: ${this.results.overall.total}`);
    console.log(`Passed: ${this.results.overall.passed}`);
    console.log(`Failed: ${this.results.overall.failed}`);
    console.log(`Success Rate: ${((this.results.overall.passed / this.results.overall.total) * 100).toFixed(2)}%`);
    
    if (this.results.overall.failed > 0) {
      console.log('\n⚠️  Failed Tests:');
      Object.entries(this.results).forEach(([role, tests]) => {
        if (role !== 'overall') {
          Object.entries(tests).forEach(([test, result]) => {
            if (!result.success) {
              console.log(`  - ${role}.${test}: ${result.error}`);
            }
          });
        }
      });
    }

    console.log('\n🔍 Detailed Results:', this.results);
  }
}

// Export for use
export default JobApiTester;

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  window.JobApiTester = JobApiTester;
  console.log('Job API Tester loaded. Run: new JobApiTester().runAllTests()');
} 