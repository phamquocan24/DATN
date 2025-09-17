/**
 * API service for AI Question Generation
 */

// Get API URL from environment or use default
const getBaseUrl = () => {
  try {
    return import.meta.env.VITE_QUESTION_GENERATION_API_URL || 'http://localhost:8002';
  } catch (error) {
    return 'http://localhost:8002';
  }
};

const QUESTION_GENERATION_BASE_URL = getBaseUrl();

export interface GenerateQuestionsRequest {
  job_id: string;
}

export interface GeneratedQuestion {
  question_text: string;
  question_type: string;
}

export interface GenerateQuestionsResponse {
  job_id: string;
  test_id: string;
  questions_saved: GeneratedQuestion[];
}

export interface QuestionTemplate {
  templates: string[];
}

/**
 * Generate interview questions from job description using AI
 */
export const generateInterviewQuestions = async (jobId: string): Promise<{
  success: boolean;
  data?: GenerateQuestionsResponse;
  error?: string;
}> => {
  try {
    const response = await fetch(`${QUESTION_GENERATION_BASE_URL}/api/v1/ai/generate-interview-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result: GenerateQuestionsResponse = await response.json();
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Error generating interview questions:', error);
    
    // Handle specific error cases
    if (error.message?.includes('Job not found')) {
      return {
        success: false,
        error: 'Job not found. Please select a valid job.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to generate interview questions'
    };
  }
};

/**
 * Get question templates for reference
 */
export const getQuestionTemplates = async (): Promise<{
  success: boolean;
  data?: QuestionTemplate;
  error?: string;
}> => {
  try {
    const response = await fetch(`${QUESTION_GENERATION_BASE_URL}/api/v1/ai/question-templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: QuestionTemplate = await response.json();
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Error getting question templates:', error);
    return {
      success: false,
      error: error.message || 'Failed to get question templates'
    };
  }
};

/**
 * Generate questions for multiple jobs in bulk
 */
export const bulkGenerateQuestions = async (jobIds: string[]): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const response = await fetch(`${QUESTION_GENERATION_BASE_URL}/api/v1/ai/questions/bulk-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobIds),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Error in bulk question generation:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate questions for multiple jobs'
    };
  }
};

/**
 * Check if question generation service is healthy
 */
export const checkQuestionGenerationServiceHealth = async (): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const response = await fetch(`${QUESTION_GENERATION_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Question generation service health check failed:', error);
    return {
      success: false,
      error: error.message || 'Question generation service is not available'
    };
  }
};
