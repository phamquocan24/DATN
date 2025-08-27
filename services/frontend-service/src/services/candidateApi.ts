import apiClient from './api';

// Candidate API Service
export const candidateApi = {
  // Job Search & Browse
  getAllJobs: async () => {
    const response = await apiClient.get('/api/v1/jobs');
    return response.data;
  },

  getJobById: async (jobId: string, includeStats?: boolean) => {
    const params = includeStats ? { include_stats: includeStats } : {};
    const response = await apiClient.get(`/api/v1/jobs/${jobId}`, { params });
    return response.data;
  },

  searchJobs: async (searchParams: any) => {
    // Clean empty parameters to avoid validation errors
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    
    const response = await apiClient.get('/api/v1/jobs/search', { params: cleanParams });
    return response.data;
  },

  getJobRecommendations: async (params?: { page?: number; limit?: number }) => {
    try {
      const response = await apiClient.get('/api/v1/jobs/recommendations', { params });
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty recommendations
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for recommendations, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  getLatestJobs: async (params?: { limit?: number }) => {
    const response = await apiClient.get('/api/v1/jobs/latest', { params });
    return response.data;
  },

  getFeaturedJobs: async () => {
    // Use regular jobs endpoint since /api/v1/jobs/featured doesn't exist
    const response = await apiClient.get('/api/v1/jobs');
    return response.data;
  },

  // Saved/Bookmarked Jobs Management - using existing saved_jobs table with auth handling
  getFavoriteJobs: async () => {
    try {
      const response = await apiClient.get('/api/v1/jobs/bookmarked');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get bookmarked jobs:', error);
      
      // If user is not authenticated, return empty bookmarks
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for bookmarks, returning empty array');
        return { data: [] };
      }
      
      // For other errors, still return empty array to prevent UI breaks
      return { data: [] };
    }
  },

  addJobToFavorites: async (jobId: string) => {
    try {
      const response = await apiClient.post(`/api/v1/jobs/${jobId}/bookmark`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to bookmark job:', error);
      
      // If user is not authenticated, show appropriate message
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          message: 'Bạn cần đăng nhập để lưu công việc này',
          requiresAuth: true 
        };
      }
      
      throw error;
    }
  },

  removeJobFromFavorites: async (jobId: string) => {
    try {
      const response = await apiClient.delete(`/api/v1/jobs/${jobId}/bookmark`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to remove bookmark:', error);
      
      // If user is not authenticated, show appropriate message
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          message: 'Bạn cần đăng nhập để thực hiện thao tác này',
          requiresAuth: true 
        };
      }
      
      throw error;
    }
  },

  checkJobBookmarkStatus: async (jobId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/jobs/${jobId}/bookmark-status`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to check bookmark status:', error);
      
      // If user is not authenticated, return not bookmarked
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: true, 
          data: { 
            job_id: jobId, 
            is_bookmarked: false 
          } 
        };
      }
      
      throw error;
    }
  },

  getJobStats: async () => {
    const response = await apiClient.get('/api/v1/jobs/stats');
    return response.data;
  },

  getRecommendedJobs: async (options?: {
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await apiClient.get('/api/v1/jobs/recommendations', { params: options });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get recommended jobs:', error);
      
      // If user is not authenticated, return empty recommendations
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for recommendations, returning empty array');
        return { data: [] };
      }
      
      // For other errors, still return empty array to prevent UI breaks
      return { data: [] };
    }
  },

  // Application Management - Business Service API
  createApplication: async (applicationData: {
    job_id: string;
    cv_id?: string;
    cover_letter?: string;
    source?: 'DIRECT' | 'SOCIAL_MEDIA' | 'REFERRAL' | 'HEADHUNTER' | 'CAREER_FAIR';
  }) => {
    const response = await apiClient.post('/api/v1/applications', applicationData);
    return response.data;
  },

  getMyApplications: async (params?: {
    status?: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEWING' | 'TESTING' | 'OFFERED' | 'HIRED' | 'REJECTED';
    page?: number;
    limit?: number;
    orderBy?: 'created_at' | 'updated_at';
    direction?: 'ASC' | 'DESC';
  }) => {
    try {
      const response = await apiClient.get('/api/v1/applications/my-applications', { params });
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty applications
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for applications, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  withdrawApplication: async (applicationId: string, reason?: string) => {
    const response = await apiClient.post(`/api/v1/applications/${applicationId}/withdraw`, { reason });
    return response.data;
  },

  getApplicationById: async (applicationId: string, includeDetails?: boolean) => {
    const params = includeDetails ? { include_details: includeDetails } : {};
    const response = await apiClient.get(`/api/v1/applications/${applicationId}`, { params });
    return response.data;
  },

  // Company Information with error handling
  getAllCompanies: async (params?: {
    search?: string;
    industry?: string;
    city_id?: string;
    company_size?: string;
    page?: number;
    limit?: number;
    order_by?: string;
    direction?: string;
  }) => {
    try {
      const response = await apiClient.get('/api/v1/companies', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get companies:', error);
      
      // Return empty array on error to prevent UI breaks
      return { data: [] };
    }
  },

  getCompanyById: async (companyId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/companies/${companyId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get company by ID:', error);
      throw error;
    }
  },

  getCompanyJobs: async (companyId: string, params?: {
    search?: string;
    employment_type?: string;
    work_type?: string;
    salary_min?: number;
    salary_max?: number;
    experience_required?: number;
    page?: number;
    limit?: number;
    orderBy?: string;
    direction?: string;
  }) => {
    const response = await apiClient.get(`/api/v1/jobs/company/${companyId}`, { params });
    return response.data;
  },

  // Profile Management
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty profile
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for profile, returning empty profile');
        // Clear invalid token from storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { data: null };
      }
      throw error;
    }
  },

  updateProfile: async (profileData: any) => {
    const response = await apiClient.put('/api/v1/users/profile', profileData);
    return response.data;
  },

  getProfileSuggestions: async () => {
    const response = await apiClient.get('/users/profile/suggestions');
    return response.data;
  },

  addSkill: async (skillData: { skill_name: string; proficiency_level: string }) => {
    const response = await apiClient.post('/user/skills', skillData);
    return response.data;
  },

  deleteSkill: async (skillId: string) => {
    const response = await apiClient.delete(`/user/skills/${skillId}`);
    return response.data;
  },

  // CV Management
  getMyCVs: async () => {
    try {
      const response = await apiClient.get('/cvs/my-cvs');
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty CVs
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for CVs, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  uploadCV: async (formData: FormData) => {
    const response = await apiClient.post('/cvs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  saveExtractedCV: async (cvData: {
    cv_title: string;
    cv_file_url: string;
    cv_file_name: string;
    cv_file_size?: number;
    cv_file_type?: 'pdf' | 'doc' | 'docx';
    is_primary?: boolean;
  }) => {
    const response = await apiClient.post('/cvs', cvData);
    return response.data;
  },



  saveCVContent: async (cvId: string, extractedData: any) => {
    // Map education degree to standard level
    const mapEducationLevel = (degree: string): string => {
      if (!degree || typeof degree !== 'string') return '';
      
      const degreeStr = degree.toLowerCase().trim();
      
      // PhD/Doctorate patterns
      if (degreeStr.includes('phd') || degreeStr.includes('doctorate') || degreeStr.includes('ph.d') ||
          degreeStr.includes('tiến sĩ') || degreeStr.includes('ts.')) {
        return 'PHD';
      }
      
      // Master's patterns
      if (degreeStr.includes('master') || degreeStr.includes('mba') || degreeStr.includes('ms') || 
          degreeStr.includes('ma') || degreeStr.includes('m.s') || degreeStr.includes('m.a') ||
          degreeStr.includes('thạc sĩ') || degreeStr.includes('ths.') || degreeStr.includes('msc')) {
        return 'MASTER';
      }
      
      // Bachelor's patterns
      if (degreeStr.includes('bachelor') || degreeStr.includes('bs') || degreeStr.includes('ba') || 
          degreeStr.includes('b.s') || degreeStr.includes('b.a') || degreeStr.includes('bsc') ||
          degreeStr.includes('beng') || degreeStr.includes('btech') || degreeStr.includes('kỹ sư') ||
          degreeStr.includes('cử nhân') || degreeStr.includes('cn.') || degreeStr.includes('engineer')) {
        return 'BACHELOR';
      }
      
      // College/Associate patterns
      if (degreeStr.includes('associate') || degreeStr.includes('diploma') || degreeStr.includes('college') ||
          degreeStr.includes('certificate') || degreeStr.includes('cao đẳng') || degreeStr.includes('cđ') ||
          degreeStr.includes('trung cấp') || degreeStr.includes('tc')) {
        return 'COLLEGE';
      }
      
      // High school patterns
      if (degreeStr.includes('high school') || degreeStr.includes('secondary') || degreeStr.includes('12th') ||
          degreeStr.includes('thpt') || degreeStr.includes('cấp 3') || degreeStr.includes('phổ thông') ||
          degreeStr.includes('lớp 12')) {
        return 'HIGH_SCHOOL';
      }
      
      // Default to BACHELOR if it mentions university/degree but doesn't match above patterns
      if (degreeStr.includes('degree') || degreeStr.includes('university') ||
          degreeStr.includes('học viện') || degreeStr.includes('đại học')) {
        return 'BACHELOR';
      }
      
      // Default to COLLEGE if it mentions school/graduated but not university
      if (degreeStr.includes('graduated') || degreeStr.includes('school') ||
          degreeStr.includes('trường') || degreeStr.includes('khoa')) {
        return 'COLLEGE';
      }
      
      // Default to empty string if no educational keywords found
      return '';
    };

    const originalDegree = extractedData.education?.[0]?.degree || '';
    const educationLevel = mapEducationLevel(originalDegree);
    
    // Helper function to clean array data
    const cleanStringArray = (arr: any[]): string[] => {
      return arr
        .map((item: any) => typeof item === 'string' ? item.trim() : String(item || '').trim())
        .filter((item: string) => item.length > 0);
    };
    
    console.log('CV Data Processing:', {
      education: {
        original: originalDegree,
        mapped: educationLevel,
        willInclude: educationLevel && ['HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD'].includes(educationLevel)
      },
      arrays: {
        skills_before: extractedData.skills?.map((s: any) => s.skill_name),
        skills_after: extractedData.skills ? cleanStringArray(extractedData.skills.map((s: any) => s.skill_name)) : [],
        job_titles_before: extractedData.experience?.map((e: any) => e.position),
        job_titles_after: extractedData.experience ? cleanStringArray(extractedData.experience.map((e: any) => e.position)) : [],
        companies_before: extractedData.experience?.map((e: any) => e.company),
        companies_after: extractedData.experience ? cleanStringArray(extractedData.experience.map((e: any) => e.company)) : []
      }
    });

    // Prepare request data according to actual database schema
    const requestData: any = {
      parsed_content: extractedData,  // JSONB field for complete parsed data
      ai_analysis: extractedData,  // JSONB field for complete analysis
      extracted_skills: extractedData.skills ? cleanStringArray(extractedData.skills.map((s: any) => s.skill_name)) : [],
      extracted_experience: {
        positions: extractedData.experience ? cleanStringArray(extractedData.experience.map((e: any) => e.position)) : [],
        companies: extractedData.experience ? cleanStringArray(extractedData.experience.map((e: any) => e.company)) : [],
        years: extractedData.experience?.length || 0
      },
      extracted_education: {
        level: educationLevel || null,
        degrees: extractedData.education || []
      },
      extracted_contact: {
        email: extractedData.email || '',
        phone: extractedData.phone || '',
        address: extractedData.address || '',
        full_name: extractedData.full_name || ''
      }
    };
    
    const response = await apiClient.post(`/cvs/${cvId}/parse`, requestData);
    return response.data;
  },

  // Set CV as primary
  setPrimaryCV: async (cvId: string) => {
    const response = await apiClient.post(`/cvs/${cvId}/set-primary`);
    return response.data;
  },

  deleteCV: async (cvId: string) => {
    const response = await apiClient.delete(`/cvs/${cvId}`);
    return response.data;
  },

  // Test Management
  getMyTests: async (params?: { page?: number; limit?: number; status?: string }) => {
    try {
      const response = await apiClient.get('/api/v1/tests/my-tests', { params });
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty tests
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for tests, returning empty array');
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      }
      throw error;
    }
  },

  getTestById: async (testId: string, includeAnswers?: boolean) => {
    const params = includeAnswers ? { include_answers: includeAnswers } : {};
    const response = await apiClient.get(`/api/v1/tests/${testId}`, { params });
    return response.data;
  },

  startTest: async (testId: string, applicationId: string) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/start`, { application_id: applicationId });
    return response.data;
  },

  submitTest: async (testId: string, data: { answers: any }, applicationId?: string) => {
    // Backend will get candidate_profile_id from token automatically
    const params = applicationId ? { application_id: applicationId } : {};
    const response = await apiClient.post(`/api/v1/tests/${testId}/submit`, data, { params });
    return response.data;
  },

  getTestResult: async (testId: string, applicationId: string, candidateId?: string) => {
    const params = candidateId ? { application_id: applicationId, candidate_id: candidateId } : { application_id: applicationId };
    const response = await apiClient.get(`/api/v1/tests/${testId}/result`, { params });
    return response.data;
  },

  // Notifications - Complete implementation matching HR API pattern
  getNotifications: async (params?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    direction?: string;
  }) => {
    try {
      const response = await apiClient.get('/api/v1/notifications', { params });
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return empty notifications
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for notifications, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  },

  getNotificationById: async (notificationId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/notifications/${notificationId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting notification by ID:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await apiClient.delete(`/api/v1/notifications/${notificationId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      const response = await apiClient.put(`/api/v1/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await apiClient.put('/api/v1/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  getUnreadNotificationCount: async () => {
    try {
      const response = await apiClient.get('/api/v1/notifications/unread-count');
      return response.data;
    } catch (error: any) {
      // If user is not authenticated, return 0 count
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for notification count, returning 0');
        return { data: { unread_count: 0 } };
      }
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  },

  // Settings
  changePassword: async (passwordData: any) => {
    const response = await apiClient.post('/users/change-password', passwordData);
    return response.data;
  },

  deactivateAccount: async (reason?: string) => {
    const response = await apiClient.put('/users/deactivate', { reason });
    return response.data;
  },

  // ======================
  // TEST MANAGEMENT (Candidate)
  // ======================

  // Get assigned tests for current candidate
  getMyAssignedTests: async (params?: {
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/api/v1/tests/my-tests', { params });
    return response.data;
  },

  // Get test details (without answers for candidates)
  getAssignedTest: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}`, { 
      params: { include_answers: false }
    });
    return response.data;
  },

  // Start a test
  startAssignedTest: async (testId: string) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/start`);
    return response.data;
  },

  // Submit test answers
  submitAssignedTest: async (testId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/submit`, { answers });
    return response.data;
  },

  // Get test result (after completion)
  getMyTestResult: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/my-result`);
    return response.data;
  },

  // Get test time remaining (during test)
  getTestTimeRemaining: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/time-remaining`);
    return response.data;
  },

  // Save test progress (auto-save during test)
  saveTestProgress: async (testId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/save-progress`, { answers });
    return response.data;
  },

  // ======================
  // MATCH SCORE CALCULATION - REMOVED
  // ======================
  // Note: Match score calculation has been moved to aiMatchingApi.ts to call AI service directly
  // This reduces dependency on business service for CV-JD matching

  // Get available jobs for match calculation
  getAvailableJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE';
  }) => {
    try {
      const response = await apiClient.get('/api/v1/jobs', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get available jobs:', error);
      throw error;
    }
  },

  // Create candidate profile if not exists
  ensureCandidateProfile: async () => {
    try {
      const response = await apiClient.post('/api/v1/users/ensure-candidate-profile');
      return response.data;
    } catch (error: any) {
      console.error('Failed to ensure candidate profile:', error);
      throw error;
    }
  }
};

// Export as default to match the import statements in components
export default candidateApi;

