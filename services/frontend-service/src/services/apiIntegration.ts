import React from 'react';
import { adminApi, hrApi, candidateApi } from './index';

// Role-based API access
export const getApiForRole = (role: 'admin' | 'hr' | 'candidate') => {
  switch (role) {
    case 'admin':
      return adminApi;
    case 'hr':
      return hrApi;
    case 'candidate':
      return candidateApi;
    default:
      return candidateApi;
  }
};

// Common data transformers
export const transformJobData = (job: any) => ({
  id: job.id || job._id,
  title: job.title,
  company: job.company?.name || job.companyName || 'Company',
  location: job.location || 'Location',
  type: job.type || job.jobType || 'Full Time',
  status: job.status || 'Active',
  description: job.description || '',
  requirements: job.requirements || [],
  skills: job.skills || [],
  salary: job.salary || job.salaryRange,
  createdAt: job.createdAt || job.datePosted,
  applicationsCount: job.applicationsCount || 0,
  openPositions: job.openPositions || job.positions || 1
});

export const transformUserData = (user: any) => ({
  id: user.id || user._id,
  name: user.name || `${user.firstName} ${user.lastName}`,
  email: user.email,
  role: user.role,
  status: user.status || 'active',
  avatar: user.avatar || user.profilePicture,
  company: user.company,
  skills: user.skills || [],
  createdAt: user.createdAt || user.joinDate
});

export const transformApplicationData = (application: any) => ({
  id: application.id || application._id,
  jobId: application.jobId || application.job?.id,
  candidateId: application.candidateId || application.candidate?.id,
  jobTitle: application.job?.title || application.jobTitle,
  candidateName: application.candidate?.name || application.candidateName,
  status: application.status || 'pending',
  appliedAt: application.appliedAt || application.createdAt,
  coverLetter: application.coverLetter,
  resumeUrl: application.resumeUrl
});

// Error handling utilities
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'Server error occurred';
    const status = error.response.status;
    
    switch (status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        return message;
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// Loading state management
export const createLoadingState = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const execute = async (apiCall: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, execute, setError };
};

// Pagination utilities
export const createPaginationState = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = React.useState(initialPage);
  const [limit, setLimit] = React.useState(initialLimit);
  const [total, setTotal] = React.useState(0);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const nextPage = () => hasNext && setPage(p => p + 1);
  const prevPage = () => hasPrev && setPage(p => p - 1);
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    goToPage
  };
};

// Component-specific API hooks
export const useJobsApi = (role: 'admin' | 'hr' | 'candidate') => {
  // const api = getApiForRole(role); // Currently unused
  
  return {
    getAllJobs: () => {
      switch (role) {
        case 'admin':
          return adminApi.getAllJobs();
        case 'hr':
          return hrApi.getMyJobs();
        case 'candidate':
          return candidateApi.getAllJobs();
      }
    },
    
    getJobById: (id: string) => {
      switch (role) {
        case 'admin':
          return adminApi.getJobById(id);
        case 'hr':
          return hrApi.getJobById(id);
        case 'candidate':
          return candidateApi.getJobById(id);
      }
    },
    
    searchJobs: (params: any) => {
      if (role === 'candidate') {
        return candidateApi.searchJobs(params);
      }
      return candidateApi.getAllJobs(); // Fallback
    }
  };
};

export const useApplicationsApi = (role: 'admin' | 'hr' | 'candidate') => {
  return {
    getApplications: () => {
      switch (role) {
        case 'admin':
          return adminApi.getAllApplications();
        case 'hr':
          return hrApi.getApplicationStats();
        case 'candidate':
          return candidateApi.getMyApplications();
      }
    },
    
    createApplication: (data: any) => {
      if (role === 'candidate') {
        return candidateApi.createApplication(data);
      }
      throw new Error('Only candidates can create applications');
    },
    
    updateApplicationStatus: (id: string, status: string) => {
      if (role === 'hr') {
        return hrApi.updateApplicationStatus(id, status);
      }
      throw new Error('Only HR can update application status');
    }
  };
}; 