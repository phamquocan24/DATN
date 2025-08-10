import apiClient from './api';

// Types for Test API
export interface Question {
  question_id?: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'CODING';
  options?: string[];
  correct_answer?: string;
  points: number;
}

export interface Test {
  test_id?: string;
  job_id: string;
  test_name: string;
  test_description: string;
  test_type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'CODING' | 'MIXED';
  time_limit: number; // in minutes
  passing_score: number;
  is_active: boolean;
  questions: Question[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestAssignment {
  assignment_id?: string;
  test_id: string;
  candidate_id: string;
  application_id: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  score?: number;
  passed?: boolean;
}

export interface TestSubmission {
  answers: Record<string, string>; // question_id -> answer
}

export interface TestResult {
  result_id?: string;
  test_id: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  application_id: string;
  score: number;
  passed: boolean;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  started_at?: string;
  completed_at?: string;
  time_taken?: number; // in minutes
  answers?: Record<string, string>;
}

// Test API Service
export const testApi = {
  // Create new test (HR/Recruiter only)
  createTest: async (testData: Test) => {
    const response = await apiClient.post('/api/v1/tests', testData);
    return response.data;
  },

  // Get test by ID
  getTestById: async (testId: string, includeAnswers: boolean = false) => {
    const params = includeAnswers ? { include_answers: includeAnswers } : {};
    const response = await apiClient.get(`/api/v1/tests/${testId}`, { params });
    return response.data;
  },

  // Update test (HR/Recruiter who created or Admin only)
  updateTest: async (testId: string, testData: Partial<Test>) => {
    const response = await apiClient.put(`/api/v1/tests/${testId}`, testData);
    return response.data;
  },

  // Delete test (HR/Recruiter who created or Admin only)
  deleteTest: async (testId: string) => {
    const response = await apiClient.delete(`/api/v1/tests/${testId}`);
    return response.data;
  },

  // Get all tests (Admin/HR only)
  getAllTests: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    test_type?: string;
    is_active?: boolean;
  }) => {
    const response = await apiClient.get('/api/v1/tests', { params });
    return response.data;
  },

  // Assign test to candidate (HR/Recruiter only)
  assignTest: async (testId: string, assignmentData: {
    candidate_id: string;
    application_id: string;
  }) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/assign`, assignmentData);
    return response.data;
  },

  // Submit test answers (Candidates only)
  submitTest: async (testId: string, submission: TestSubmission) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/submit`, submission);
    return response.data;
  },

  // Get assigned tests for current candidate
  getMyTests: async (params?: {
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/api/v1/tests/my-tests', { params });
    return response.data;
  },

  // Get test results (HR/Recruiter who created or Admin only)
  getTestResults: async (testId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  }) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/results`, { params });
    return response.data;
  },

  // Start test (Candidate only)
  startTest: async (testId: string) => {
    const response = await apiClient.post(`/api/v1/tests/${testId}/start`);
    return response.data;
  },

  // Get test statistics (HR/Admin only)
  getTestStats: async (testId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/stats`);
    return response.data;
  },

  // Get candidate test result details
  getCandidateResult: async (testId: string, candidateId: string) => {
    const response = await apiClient.get(`/api/v1/tests/${testId}/results/${candidateId}`);
    return response.data;
  },
};

export default testApi;