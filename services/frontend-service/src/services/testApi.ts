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
  id?: string; // Backend may return this field name
  job_id: string;
  test_name: string;
  test_description?: string;
  description?: string; // Backend might return this field name
  test_type?: 'TECHNICAL' | 'PERSONALITY' | 'COGNITIVE' | 'SKILLS' | 'CUSTOM';
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  time_limit?: number; // in minutes (mapped from duration_minutes)
  duration_minutes?: number; // Backend field name
  passing_score: number;
  is_active: boolean;
  is_mandatory?: boolean;
  instructions?: string;
  questions?: Question[];
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
    const params = includeAnswers ? { 
      include_answers: includeAnswers,
      _t: Date.now() // Cache busting
    } : { 
      _t: Date.now() // Cache busting
    };
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

  // AI Test Generation Endpoints (Port 8002)
  generateInterviewQuestions: async (data: {
    job_id: string;
  }) => {
    try {
      // Check if AI service is available first
      const healthResponse = await fetch('http://localhost:8002/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(() => null);

      if (!healthResponse || !healthResponse.ok) {
        throw new Error('AI service is not available. Please make sure the AI service is running on port 8002.');
      }

      // Use direct fetch for AI service as it's on different port
      const response = await fetch('http://localhost:8002/api/v1/ai/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Remove auth token as AI service may not need it
        },
        body: JSON.stringify({ job_id: data.job_id }) // Only send job_id
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Error generating interview questions:', error);
      
      // Provide specific error messages
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('AI service is not available. Please make sure the AI service is running on port 8002.');
      } else if (error.message?.includes('CORS')) {
        throw new Error('CORS error: AI service configuration issue. Please check AI service CORS settings.');
      } else {
        throw new Error(error.message || 'Failed to generate interview questions');
      }
    }
  },

  bulkGenerateQuestions: async (data: {
    job_id: string;
    question_types: string[];
    count_per_type: number;
    difficulty_level?: string;
  }) => {
    const response = await apiClient.post('http://localhost:8002/api/v1/ai/questions/bulk-generate', data);
    return response.data;
  },

  customizeQuestions: async (data: {
    questions: any[];
    customization_request: string;
  }) => {
    const response = await apiClient.post('http://localhost:8002/api/v1/ai/customize-questions', data);
    return response.data;
  },

  updateQuestion: async (questionId: string, data: {
    question_text?: string;
    options?: string[];
    correct_answer?: string;
  }) => {
    const response = await apiClient.put(`http://localhost:8002/api/v1/ai/questions/${questionId}/customize`, data);
    return response.data;
  },

  getQuestionTemplates: async () => {
    const response = await apiClient.get('http://localhost:8002/api/v1/ai/question-templates');
    return response.data;
  },

  evaluateSingleAnswer: async (data: {
    question_text: string;
    correct_answer: string;
    candidate_answer: string;
  }) => {
    const response = await apiClient.post('http://localhost:8002/api/v1/ai/evaluate-single-answer', data);
    return response.data;
  },

  evaluateTestResult: async (resultId: string) => {
    const response = await apiClient.post(`http://localhost:8002/api/v1/ai/evaluate-test-result`, { result_id: resultId });
    return response.data;
  },

  getResultAnswers: async (resultId: string) => {
    const response = await apiClient.get(`http://localhost:8002/api/v1/ai/test-result/${resultId}/answers`);
    return response.data;
  },
};

export default testApi;