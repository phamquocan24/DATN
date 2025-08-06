import apiClient from './api';

// Company API Types
export interface Company {
  company_id: string;
  company_name: string;
  company_description?: string;
  company_website?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  city_id?: string;
  district_id?: string;
  industry?: string;
  company_size?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  company_logo_url?: string;
  tax_code?: string;
  founded_year?: number;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyData {
  company_name: string;
  company_description?: string;
  company_website?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  city_id?: string;
  district_id?: string;
  industry?: string;
  company_size?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  company_logo_url?: string;
  tax_code?: string;
  founded_year?: number;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {}

export interface CompanySearchParams {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  company_size?: string;
  city_id?: string;
  verified_only?: boolean;
}

export interface CompanyStats {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  pending_applications: number;
  total_employees: number;
  recent_activity: any[];
}

// Company API Service
export const companyApi = {
  // Company CRUD Operations
  
  /**
   * Create a new company (HR/Recruiter only)
   */
  createCompany: async (companyData: CreateCompanyData) => {
    const response = await apiClient.post('/api/v1/api/v1/companies', companyData);
    return response.data;
  },

  /**
   * Get all companies with pagination and filtering
   */
  getAllCompanies: async (params?: CompanySearchParams) => {
    const response = await apiClient.get('/api/v1/api/v1/companies', { params });
    return response.data;
  },

  /**
   * Get company by ID
   */
  getCompanyById: async (companyId: string) => {
    const response = await apiClient.get(`/api/v1/api/v1/companies/${companyId}`);
    return response.data;
  },

  /**
   * Update company information (HR/Recruiter only)
   */
  updateCompany: async (companyId: string, companyData: UpdateCompanyData) => {
    const response = await apiClient.put(`/api/v1/api/v1/companies/${companyId}`, companyData);
    return response.data;
  },

  /**
   * Delete company (HR/Recruiter/Admin only)
   */
  deleteCompany: async (companyId: string) => {
    const response = await apiClient.delete(`/api/v1/api/v1/companies/${companyId}`);
    return response.data;
  },

  // Company Relationships

  /**
   * Get company recruiters/HR staff
   */
  getCompanyRecruiters: async (companyId: string) => {
    const response = await apiClient.get(`/api/v1/companies/${companyId}/recruiters`);
    return response.data;
  },

  /**
   * Get company statistics
   */
  getCompanyStats: async (companyId: string): Promise<{ success: boolean; data: CompanyStats }> => {
    const response = await apiClient.get(`/api/v1/companies/${companyId}/stats`);
    return response.data;
  },

  /**
   * Get jobs posted by company
   */
  getCompanyJobs: async (companyId: string, params?: { page?: number; limit?: number; status?: string }) => {
    const response = await apiClient.get(`/api/v1/companies/${companyId}/jobs`, { params });
    return response.data;
  },

  // Search and Discovery

  /**
   * Search companies by various criteria
   */
  searchCompanies: async (searchParams: CompanySearchParams) => {
    const response = await apiClient.get('/api/v1/companies/search', { params: searchParams });
    return response.data;
  },

  /**
   * Get featured/popular companies
   */
  getFeaturedCompanies: async (limit: number = 10) => {
    const response = await apiClient.get('/api/v1/companies/featured', { params: { limit } });
    return response.data;
  },

  /**
   * Get companies by industry
   */
  getCompaniesByIndustry: async (industry: string, params?: CompanySearchParams) => {
    const response = await apiClient.get('/api/v1/companies/by-industry', { 
      params: { industry, ...params } 
    });
    return response.data;
  },

  // Admin Functions

  /**
   * Verify company (Admin only)
   */
  verifyCompany: async (companyId: string, verified: boolean = true) => {
    try {
      const response = await apiClient.patch(`/api/v1/companies/${companyId}/verify`, { verified });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback to admin endpoint if direct endpoint doesn't exist
        const response = await apiClient.post(`/admin/api/v1/companies/${companyId}/verify`, { verified });
        return response.data;
      }
      throw error;
    }
  },

  /**
   * Get company analytics (Admin/HR only)
   */
  getCompanyAnalytics: async (companyId: string, period: string = 'month') => {
    try {
      const response = await apiClient.get(`/api/v1/companies/${companyId}/analytics`, { 
        params: { period } 
      });
      return response.data;
    } catch (error: any) {
      // Fallback to analytics service
      if (error.response?.status === 404) {
        const response = await apiClient.get('/analytics/api/v1/companies', { 
          params: { companyId, period } 
        });
        return response.data;
      }
      throw error;
    }
  },

  // Utility Functions

  /**
   * Upload company logo
   */
  uploadCompanyLogo: async (companyId: string, logoFile: File) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await apiClient.post(`/api/v1/companies/${companyId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get company industries list
   */
  getIndustries: async () => {
    try {
      const response = await apiClient.get('/api/v1/companies/industries');
      return response.data;
    } catch (error: any) {
      // Fallback with default industries
      if (error.response?.status === 404) {
        return {
          success: true,
          data: [
            'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
            'Retail', 'Real Estate', 'Transportation', 'Media', 'Hospitality',
            'Consulting', 'Energy', 'Government', 'Non-profit', 'Other'
          ]
        };
      }
      throw error;
    }
  },

  /**
   * Get company size options
   */
  getCompanySizes: () => {
    return {
      success: true,
      data: [
        { value: 'STARTUP', label: 'Startup (1-10 employees)' },
        { value: 'SMALL', label: 'Small (11-50 employees)' },
        { value: 'MEDIUM', label: 'Medium (51-200 employees)' },
        { value: 'LARGE', label: 'Large (201-1000 employees)' },
        { value: 'ENTERPRISE', label: 'Enterprise (1000+ employees)' }
      ]
    };
  }
};

export default companyApi; 