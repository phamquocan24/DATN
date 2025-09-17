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
    // Prevent multiple concurrent calls for the same job_id
    const callKey = `generate_${data.job_id}`;
    if ((testApi as any)._activeCalls?.has(callKey)) {
      throw new Error('Question generation is already in progress for this job');
    }
    
    // Initialize active calls tracking
    if (!(testApi as any)._activeCalls) {
      (testApi as any)._activeCalls = new Set();
    }
    (testApi as any)._activeCalls.add(callKey);
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
      console.log('🔄 Calling AI service with job_id:', data.job_id);
      
      // Add retry mechanism with exponential backoff
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Attempt ${attempt}/3 calling AI service`);
          
          // Add delay between attempts (except first attempt)
          if (attempt > 1) {
            const delay = Math.pow(2, attempt - 1) * 1000; // 2s, 4s
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          // Generate fresh timestamp for each attempt to avoid caching
          const attemptTimestamp = Date.now();
          const response = await fetch(`http://localhost:8002/api/v1/ai/generate-interview-questions?t=${attemptTimestamp}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              // Remove auth token as AI service may not need it
            },
            body: JSON.stringify({ job_id: data.job_id }), // Only send job_id
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log('📊 AI service response status:', response.status);

          if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              // If response is not JSON, use status text
              errorMessage = response.statusText || errorMessage;
            }
            
            // If it's a rate limit or server error, continue to retry
            if (response.status === 429 || response.status >= 500) {
              throw new Error(`Retryable error: ${errorMessage}`);
            } else {
              // For client errors (4xx except 429), don't retry
              throw new Error(errorMessage);
            }
          }

          const result = await response.json();
          console.log(`✅ Successfully generated questions on attempt ${attempt}`);
          
          // If successful, break out of retry loop immediately
          if (result && (result.questions_saved || result.job_id)) {
            return result;
          } else {
            throw new Error('Invalid response: No questions were generated');
          }
          
        } catch (error: any) {
          lastError = error;
          console.error(`❌ Attempt ${attempt} failed:`, error.message);
          
          // If it's an abort error or non-retryable error, break immediately
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - AI service took too long to respond');
          }
          
          // If it's the last attempt or a non-retryable error, throw
          if (attempt === 3 || (!error.message?.includes('Retryable error') && !error.message?.includes('Failed to fetch'))) {
            throw error;
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('All retry attempts failed');
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
    } finally {
      // Always clean up active call tracking
      (testApi as any)._activeCalls?.delete(callKey);
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