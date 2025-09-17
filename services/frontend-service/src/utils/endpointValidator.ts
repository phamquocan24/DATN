/**
 * Endpoint Validator Utility
 * Validates that all frontend services are using the correct API endpoints
 * according to the business service specification
 */

import { candidateApi } from '../services/candidateApi';
import { companyApi } from '../services/companyApi';
import { hrApi } from '../services/hrApi';
import { adminApi } from '../services/adminApi';

interface ValidationResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  message: string;
  response?: any;
}

export class EndpointValidator {
  private results: ValidationResult[] = [];

  async validateCompanyEndpoints(): Promise<ValidationResult[]> {
    console.log('🔍 Validating Company Endpoints...');
    
    try {
      // Test 1: GET /api/v1/companies (Company list)
      const companiesResponse = await companyApi.getAllCompanies({
        page: 1,
        limit: 5
      });
      
      this.addResult(
        'GET /api/v1/companies',
        'GET',
        companiesResponse.success ? 'success' : 'error',
        companiesResponse.success 
          ? `✅ Companies list retrieved: ${companiesResponse.data?.length || 0} companies`
          : '❌ Failed to get companies list',
        companiesResponse
      );

      // Test 2: GET /api/v1/companies/{company_id} (Company detail)
      if (companiesResponse.success && companiesResponse.data?.length > 0) {
        const firstCompany = companiesResponse.data[0];
        const companyDetailResponse = await companyApi.getCompanyById(firstCompany.company_id);
        
        this.addResult(
          `GET /api/v1/companies/${firstCompany.company_id}`,
          'GET',
          companyDetailResponse.success ? 'success' : 'error',
          companyDetailResponse.success 
            ? `✅ Company detail retrieved: ${companyDetailResponse.data?.company?.company_name || 'N/A'}`
            : '❌ Failed to get company detail',
          companyDetailResponse
        );
      }

    } catch (error: any) {
      this.addResult(
        'Company Endpoints',
        'VALIDATION',
        'error',
        `❌ Error during validation: ${error.message}`,
        error
      );
    }

    return this.results;
  }

  async validateJobEndpoints(): Promise<ValidationResult[]> {
    console.log('🔍 Validating Job Endpoints...');
    
    try {
      // Test 1: GET /api/v1/jobs/latest (Latest jobs)
      const latestJobsResponse = await candidateApi.getLatestJobs({ limit: 5 });
      
      this.addResult(
        'GET /api/v1/jobs/latest',
        'GET',
        latestJobsResponse.success ? 'success' : 'error',
        latestJobsResponse.success 
          ? `✅ Latest jobs retrieved: ${latestJobsResponse.data?.length || 0} jobs`
          : '❌ Failed to get latest jobs',
        latestJobsResponse
      );

      // Test 2: GET /api/v1/jobs/search (Job search)
      const searchJobsResponse = await candidateApi.searchJobs({
        search: 'developer',
        page: 1,
        limit: 5
      });
      
      this.addResult(
        'GET /api/v1/jobs/search',
        'GET',
        searchJobsResponse.success ? 'success' : 'error',
        searchJobsResponse.success 
          ? `✅ Job search completed: ${searchJobsResponse.data?.length || 0} jobs found`
          : '❌ Failed to search jobs',
        searchJobsResponse
      );

      // Test 3: GET /api/v1/jobs/{id} (Job detail)
      if (latestJobsResponse.success && latestJobsResponse.data?.length > 0) {
        const firstJob = latestJobsResponse.data[0];
        const jobDetailResponse = await candidateApi.getJobById(firstJob.job_id);
        
        this.addResult(
          `GET /api/v1/jobs/${firstJob.job_id}`,
          'GET',
          jobDetailResponse.success ? 'success' : 'error',
          jobDetailResponse.success 
            ? `✅ Job detail retrieved: ${jobDetailResponse.data?.title || 'N/A'}`
            : '❌ Failed to get job detail',
          jobDetailResponse
        );
      }

      // Test 4: GET /api/v1/jobs/recommendations (Requires authentication)
      try {
        const recommendationsResponse = await candidateApi.getJobRecommendations({ 
          page: 1, 
          limit: 5 
        });
        
        this.addResult(
          'GET /api/v1/jobs/recommendations',
          'GET',
          recommendationsResponse.success ? 'success' : 'error',
          recommendationsResponse.success 
            ? `✅ Job recommendations retrieved: ${recommendationsResponse.data?.length || 0} jobs`
            : '❌ Failed to get job recommendations (might require authentication)',
          recommendationsResponse
        );
      } catch (error: any) {
        this.addResult(
          'GET /api/v1/jobs/recommendations',
          'GET',
          'error',
          `⚠️  Job recommendations failed: ${error.message} (expected if not authenticated)`,
          error
        );
      }

      // Test 5: GET /api/v1/jobs/company/{companyId} (Company jobs)
      if (latestJobsResponse.success && latestJobsResponse.data?.length > 0) {
        const firstJob = latestJobsResponse.data[0];
        if (firstJob.company_id) {
          const companyJobsResponse = await candidateApi.getCompanyJobs(firstJob.company_id, {
            page: 1,
            limit: 5
          });
          
          this.addResult(
            `GET /api/v1/jobs/company/${firstJob.company_id}`,
            'GET',
            companyJobsResponse.success ? 'success' : 'error',
            companyJobsResponse.success 
              ? `✅ Company jobs retrieved: ${companyJobsResponse.data?.length || 0} jobs`
              : '❌ Failed to get company jobs',
            companyJobsResponse
          );
        }
      }

    } catch (error: any) {
      this.addResult(
        'Job Endpoints',
        'VALIDATION',
        'error',
        `❌ Error during validation: ${error.message}`,
        error
      );
    }

    return this.results;
  }

  async validateAllEndpoints(): Promise<ValidationResult[]> {
    console.log('🚀 Starting comprehensive endpoint validation...');
    this.results = [];
    
    await this.validateCompanyEndpoints();
    await this.validateJobEndpoints();
    
    console.log('📊 Validation Summary:');
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${this.results.length}`);
    
    return this.results;
  }

  private addResult(endpoint: string, method: string, status: 'success' | 'error', message: string, response?: any) {
    const result: ValidationResult = {
      endpoint,
      method,
      status,
      message,
      response
    };
    
    this.results.push(result);
    console.log(`${status === 'success' ? '✅' : '❌'} ${method} ${endpoint}: ${message}`);
  }

  getResults(): ValidationResult[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'error').length;
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0'
    };
  }
}

// Export singleton instance
export const endpointValidator = new EndpointValidator();
