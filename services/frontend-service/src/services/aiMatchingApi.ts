// AI Matching Service API - Direct connection to AI service
// This service bypasses business-service and connects directly to ai-service

// AI Service endpoints (port 8001 for jd-cv-matching)
const AI_MATCHING_SERVICE_BASE_URL = 'http://localhost:8001';

// Types for AI service requests and responses
export interface AIMatchRequest {
  cv_id: string;
  job_id: string;
}

export interface AIMatchResponse {
  match_id: string;
  job_id: string;
  candidate_id: string;
  cv_id: string;
  overall_similarity: number;
  mo_ta_ban_than_similarity: number;
  ky_nang_similarity: number;
  kinh_nghiem_similarity: number;
  hoc_van_similarity: number;
}

export interface JobRecommendationResponse {
  candidate_id: string;
  cv_id: string;
  top_k: number;
  recommendations: Array<{
    job_id: string;
    title: string;
    group: string;
    overall_similarity: number;
  }>;
}

export interface MatchAnalysisResponse {
  application_id: string;
  analysis: {
    match_reasoning: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    overall_fit: string;
  };
}

export interface SimilarityResponse {
  similarity: number;
}

/**
 * Calculate match score between CV and Job using AI service
 */
export const calculateAIMatchScore = async (cvId: string, jobId: string): Promise<{
  success: boolean;
  data?: {
    match_id: string;
    overall_score: number;
    detailed_scores: {
      skills_similarity: number;
      experience_similarity: number;
      education_similarity: number;
      description_similarity: number;
    };
    match_grade: string;
  };
  error?: string;
}> => {
  try {
    const response = await fetch(`${AI_MATCHING_SERVICE_BASE_URL}/api/v1/ai/calculate-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cv_id: cvId,
        job_id: jobId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result: AIMatchResponse = await response.json();
    
    // Convert similarity scores (0-1) to percentages (0-100)
    const overallScore = Math.round(result.overall_similarity * 100);
    
    // Determine match grade based on overall score
    const getMatchGrade = (score: number): string => {
      if (score >= 85) return 'EXCELLENT';
      if (score >= 75) return 'VERY_GOOD';
      if (score >= 65) return 'GOOD';
      if (score >= 50) return 'FAIR';
      return 'POOR';
    };

    return {
      success: true,
      data: {
        match_id: result.match_id,
        overall_score: overallScore,
        detailed_scores: {
          skills_similarity: Math.round(result.ky_nang_similarity * 100),
          experience_similarity: Math.round(result.kinh_nghiem_similarity * 100),
          education_similarity: Math.round(result.hoc_van_similarity * 100),
          description_similarity: Math.round(result.mo_ta_ban_than_similarity * 100),
        },
        match_grade: getMatchGrade(overallScore)
      }
    };
  } catch (error: any) {
    console.error('Error calling AI matching service:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate AI match score'
    };
  }
};

/**
 * Get job recommendations for a candidate using AI service
 */
export const getAIJobRecommendations = async (candidateId: string, topK: number = 5): Promise<{
  success: boolean;
  data?: JobRecommendationResponse;
  error?: string;
}> => {
  try {
    const response = await fetch(`${AI_MATCHING_SERVICE_BASE_URL}/api/v1/ai/job-recommendations/${candidateId}?top_k=${topK}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result: JobRecommendationResponse = await response.json();
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Error getting AI job recommendations:', error);
    return {
      success: false,
      error: error.message || 'Failed to get job recommendations'
    };
  }
};

/**
 * Get similarity score between CV and Job
 */
export const getAISimilarity = async (cvId: string, jobId: string, sectionType: string = 'full_text'): Promise<{
  success: boolean;
  data?: {
    similarity: number;
  };
  error?: string;
}> => {
  try {
    const response = await fetch(`${AI_MATCHING_SERVICE_BASE_URL}/api/v1/ai/similarity?cv_id=${cvId}&job_id=${jobId}&section_type=${sectionType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result: SimilarityResponse = await response.json();
    
    return {
      success: true,
      data: {
        similarity: Math.round(result.similarity * 100) // Convert to percentage
      }
    };
  } catch (error: any) {
    console.error('Error getting AI similarity:', error);
    return {
      success: false,
      error: error.message || 'Failed to get similarity score'
    };
  }
};

/**
 * Get match analysis for an application using AI service
 */
export const getAIMatchAnalysis = async (applicationId: string): Promise<{
  success: boolean;
  data?: MatchAnalysisResponse;
  error?: string;
}> => {
  try {
    const response = await fetch(`${AI_MATCHING_SERVICE_BASE_URL}/api/v1/ai/match-analysis/${applicationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result: MatchAnalysisResponse = await response.json();
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Error getting AI match analysis:', error);
    return {
      success: false,
      error: error.message || 'Failed to get match analysis'
    };
  }
};

/**
 * Check if AI matching service is healthy
 */
export const checkAIMatchingServiceHealth = async (): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const response = await fetch(`${AI_MATCHING_SERVICE_BASE_URL}/health`, {
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
    console.error('AI matching service health check failed:', error);
    return {
      success: false,
      error: error.message || 'AI matching service is not available'
    };
  }
};

/**
 * Batch calculate match scores for multiple jobs
 * This is useful when calculating matches for multiple jobs at once
 */
export const batchCalculateAIMatchScores = async (
  cvId: string, 
  jobIds: string[]
): Promise<{
  success: boolean;
  data?: Array<{
    job_id: string;
    match_score: number;
    match_grade: string;
    error?: string;
  }>;
  error?: string;
}> => {
  try {
    const results = await Promise.allSettled(
      jobIds.map(jobId => calculateAIMatchScore(cvId, jobId))
    );

    const processedResults = results.map((result, index) => {
      const jobId = jobIds[index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        return {
          job_id: jobId,
          match_score: result.value.data!.overall_score,
          match_grade: result.value.data!.match_grade
        };
      } else {
        const error = result.status === 'rejected' 
          ? result.reason?.message || 'Unknown error'
          : result.value.error || 'Failed to calculate match';
        
        return {
          job_id: jobId,
          match_score: 0,
          match_grade: 'POOR',
          error
        };
      }
    });

    return {
      success: true,
      data: processedResults
    };
  } catch (error: any) {
    console.error('Error in batch AI match calculation:', error);
    return {
      success: false,
      error: error.message || 'Failed to batch calculate match scores'
    };
  }
};

export default {
  calculateAIMatchScore,
  getAIJobRecommendations,
  getAISimilarity,
  getAIMatchAnalysis,
  checkAIMatchingServiceHealth,
  batchCalculateAIMatchScores,
};
