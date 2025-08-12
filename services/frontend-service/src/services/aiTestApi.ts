// AI Test Generation API Service - Direct API calls to AI service

// AI Test Generation API Service
export const aiTestApi = {
  // Generate interview questions for a job using AI
  generateInterviewQuestions: async (jobId: number) => {
    try {
      // Check if AI service is available first
      const healthCheck = await fetch('http://localhost:8002/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(() => null);

      if (!healthCheck || !healthCheck.ok) {
        throw new Error('AI service is not available at localhost:8002. Please ensure the AI service is running.');
      }

      const response = await fetch('http://localhost:8002/api/v1/ai/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI service error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error generating interview questions:', error);
      
      // Enhanced error message
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to AI service. Please check if the AI service is running on port 8002.');
      }
      
      throw error;
    }
  },

  // Bulk generate questions for multiple job IDs
  bulkGenerateQuestions: async (jobIds: number[]) => {
    try {
      const response = await fetch('http://localhost:8002/api/v1/ai/questions/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobIds)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error bulk generating questions:', error);
      throw error;
    }
  },

  // Customize questions for a test
  customizeQuestions: async (testId: number, questionText: string, explanation: string = '') => {
    try {
      const response = await fetch('http://localhost:8002/api/v1/ai/customize-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_id: testId,
          question_text: questionText,
          explanation: explanation
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error customizing questions:', error);
      throw error;
    }
  },

  // Update a specific question
  updateQuestion: async (
    questionId: number, 
    testId: number, 
    questionText: string, 
    explanation: string = ''
  ) => {
    try {
      const url = new URL(`http://localhost:8002/api/v1/ai/questions/${questionId}/customize`);
      url.searchParams.append('test_id', testId.toString());
      url.searchParams.append('question_text', questionText);
      if (explanation) {
        url.searchParams.append('explanation', explanation);
      }

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  // Get question templates
  getQuestionTemplates: async () => {
    try {
      const response = await fetch('http://localhost:8002/api/v1/ai/question-templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching question templates:', error);
      throw error;
    }
  },

  // Evaluate single answer
  evaluateSingleAnswer: async (questionId: number, answerId: number) => {
    try {
      const url = new URL('http://localhost:8002/api/v1/ai/evaluate-single-answer');
      url.searchParams.append('question_id', questionId.toString());
      url.searchParams.append('answer_id', answerId.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error evaluating single answer:', error);
      throw error;
    }
  },

  // Evaluate test result
  evaluateTestResult: async (resultId: number) => {
    try {
      const url = new URL('http://localhost:8002/api/v1/ai/evaluate-test-result');
      url.searchParams.append('result_id', resultId.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error evaluating test result:', error);
      throw error;
    }
  },

  // Get result answers
  getResultAnswers: async (resultId: number) => {
    try {
      const response = await fetch(`http://localhost:8002/api/v1/ai/test-result/${resultId}/answers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching result answers:', error);
      throw error;
    }
  },

  // Health check for AI service
  healthCheck: async () => {
    try {
      const response = await fetch('http://localhost:8002/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error checking AI service health:', error);
      throw error;
    }
  }
};

export default aiTestApi;
