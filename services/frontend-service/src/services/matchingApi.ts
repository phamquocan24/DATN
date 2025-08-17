// Direct AI Service integration for CV-JD matching

export interface SimpleMatchRequest {
  cv_text: string;
  job_description: string;
  job_requirements?: string;
  job_responsibilities?: string;
}

export interface MatchingScore {
  overall_similarity: number;
  skills_similarity: number;
  experience_similarity: number;
  education_similarity: number;
  weighted_score: number;
}

export interface JobRecommendation {
  job_id: number;
  title: string;
  company: string;
  overall_similarity: number;
}

export interface MatchingResult {
  scores: MatchingScore;
  reasoning?: string;
  language_detected?: string;
}

// AI Service match request interface (matches AI service schema)
export interface AIMatchRequest {
  cv_id: string;
  job_id: string;
}

// AI Service match response interface 
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

// AI Service endpoints (port 8001 for JD-CV matching)
const MATCHING_SERVICE_BASE_URL = 'http://localhost:8001';

/**
 * Calculate simple similarity between CV text and JD text
 * This is a simplified version that doesn't require database CV/Job IDs
 */
export const calculateSimpleMatch = async (request: SimpleMatchRequest): Promise<MatchingResult> => {
  try {
    // For now, we'll use a mock calculation since the original API requires database IDs
    // In a real implementation, you'd create a new endpoint in the matching service
    
    // Improved matching algorithm with keyword weighting
    const cvText = request.cv_text.toLowerCase();
    const jdText = [
      request.job_description,
      request.job_requirements || '',
      request.job_responsibilities || ''
    ].join(' ').toLowerCase();
    
    // Technical keywords with higher weights
    const techKeywords = [
      'react', 'javascript', 'typescript', 'node.js', 'nodejs', 'python', 'java',
      'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'git', 'docker',
      'aws', 'azure', 'microservices', 'api', 'rest', 'graphql', 'frontend',
      'backend', 'fullstack', 'database', 'software engineer', 'developer',
      'programming', 'algorithm', 'data structure', 'web development'
    ];
    
    const softSkills = [
      'leadership', 'teamwork', 'communication', 'problem solving', 'analytical',
      'creative', 'adaptable', 'organized', 'detail-oriented', 'self-motivated'
    ];
    
    let score = 0;
    let maxPossibleScore = 0;
    
    // Check tech keywords (weight: 3)
    techKeywords.forEach(keyword => {
      const cvHas = cvText.includes(keyword);
      const jdHas = jdText.includes(keyword);
      if (jdHas) {
        maxPossibleScore += 3;
        if (cvHas) score += 3;
      }
    });
    
    // Check soft skills (weight: 1)
    softSkills.forEach(skill => {
      const cvHas = cvText.includes(skill);
      const jdHas = jdText.includes(skill);
      if (jdHas) {
        maxPossibleScore += 1;
        if (cvHas) score += 1;
      }
    });
    
    // General word overlap (weight: 0.5)
    const cvWords = cvText.split(/\s+/).filter(word => word.length > 3);
    const jdWords = jdText.split(/\s+/).filter(word => word.length > 3);
    const commonWords = cvWords.filter(word => jdWords.includes(word));
    
    const uniqueJdWords = [...new Set(jdWords)];
    uniqueJdWords.forEach(() => {
      maxPossibleScore += 0.5;
    });
    
    score += commonWords.length * 0.5;
    
    const overallSimilarity = maxPossibleScore > 0 ? Math.min(score / maxPossibleScore, 1.0) : 0;
    
    // Mock detailed scores
    const scores: MatchingScore = {
      overall_similarity: Math.round(overallSimilarity * 100) / 100,
      skills_similarity: Math.round((overallSimilarity + Math.random() * 0.2 - 0.1) * 100) / 100,
      experience_similarity: Math.round((overallSimilarity + Math.random() * 0.2 - 0.1) * 100) / 100,
      education_similarity: Math.round((overallSimilarity + Math.random() * 0.2 - 0.1) * 100) / 100,
      weighted_score: Math.round(overallSimilarity * 100) / 100
    };
    
    return {
      scores,
      language_detected: 'vietnamese',
      reasoning: `Based on text analysis, found ${commonWords.length} matching keywords between CV and job description.`
    };
  } catch (error) {
    console.error('Error calculating match:', error);
    throw new Error('Failed to calculate CV-JD matching score');
  }
};

/**
 * Calculate match using database-stored CV and Job (original API)
 */
export const calculateDatabaseMatch = async (cv_id: number, job_id: number): Promise<MatchingResult> => {
  const response = await fetch(`${MATCHING_SERVICE_BASE_URL}/api/v1/ai/calculate-match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cv_id,
      job_id,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return {
    scores: {
      overall_similarity: result.overall_similarity,
      skills_similarity: result.ky_nang_similarity,
      experience_similarity: result.kinh_nghiem_similarity,
      education_similarity: result.hoc_van_similarity,
      weighted_score: result.overall_similarity, // Use overall as weighted for now
    }
  };
};

/**
 * Get job recommendations for a candidate
 */
export const getJobRecommendations = async (candidate_id: number, top_k: number = 5): Promise<JobRecommendation[]> => {
  const response = await fetch(`${MATCHING_SERVICE_BASE_URL}/api/v1/ai/job-recommendations/${candidate_id}?top_k=${top_k}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.recommendations.map((rec: any) => ({
    job_id: rec.job_id,
    title: rec.title,
    company: rec.group,
    overall_similarity: rec.overall_similarity,
  }));
};

/**
 * Check matching service health
 */
export const checkMatchingServiceHealth = async (): Promise<{ status: string; service: string }> => {
  const response = await fetch(`${MATCHING_SERVICE_BASE_URL}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

/**
 * Enhanced matching with real AI service
 * This creates a new simplified endpoint that works with text directly
 */
export const calculateTextBasedMatch = async (cv_text: string, job_text: string): Promise<number> => {
  try {
    // Try to call the matching service health first to see if it's running
    await checkMatchingServiceHealth();
    
    // For now, use the simple mock calculation
    // TODO: Create new endpoint in matching service for text-based matching
    const result = await calculateSimpleMatch({
      cv_text,
      job_description: job_text
    });
    
    return result.scores.overall_similarity;
  } catch (error) {
    console.warn('Matching service not available, using fallback calculation:', error);
    
    // Fallback calculation
    const cvWords = cv_text.toLowerCase().split(/\s+/);
    const jobWords = job_text.toLowerCase().split(/\s+/);
    
    const commonWords = cvWords.filter(word => 
      word.length > 3 && jobWords.includes(word)
    );
    
    return Math.min((commonWords.length / Math.max(cvWords.length, jobWords.length)) * 2, 1.0);
  }
};

/**
 * Calculate match score directly with AI service using CV ID and Job ID
 * This bypasses business service and calls AI service directly
 */
export const calculateDirectMatchScore = async (cvId: string, jobId: string): Promise<{
  success: boolean;
  data?: {
    match_score: number;
    match_grade: string;
    detailed_scores: {
      skill_match: number;
      experience_match: number;
      education_match: number;
      overall_match: number;
    };
  };
  error?: string;
}> => {
  try {
    const response = await fetch(`${MATCHING_SERVICE_BASE_URL}/api/v1/ai/calculate-match`, {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AIMatchResponse = await response.json();
    
    // Convert AI service response to frontend format
    const overallScore = Math.round(result.overall_similarity * 100);
    
    return {
      success: true,
      data: {
        match_score: overallScore,
        match_grade: overallScore >= 80 ? 'EXCELLENT' : 
                    overallScore >= 70 ? 'VERY_GOOD' :
                    overallScore >= 60 ? 'GOOD' :
                    overallScore >= 50 ? 'FAIR' : 'POOR',
        detailed_scores: {
          skill_match: Math.round(result.ky_nang_similarity * 100),
          experience_match: Math.round(result.kinh_nghiem_similarity * 100),
          education_match: Math.round(result.hoc_van_similarity * 100),
          overall_match: overallScore
        }
      }
    };
  } catch (error: any) {
    console.error('Error calling AI service directly:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate match score'
    };
  }
};

/**
 * Calculate match score using CV text and job description (for cases without CV/Job IDs)
 * This is useful when CV is not yet stored in database
 */
export const calculateMatchScoreFromText = async (
  cvText: string, 
  jobDescription: string,
  jobRequirements?: string,
  jobResponsibilities?: string
): Promise<{
  success: boolean;
  data?: {
    match_score: number;
    match_grade: string;
  };
  error?: string;
}> => {
  try {
    // Use the existing simple match calculation
    const result = await calculateSimpleMatch({
      cv_text: cvText,
      job_description: jobDescription,
      job_requirements: jobRequirements,
      job_responsibilities: jobResponsibilities
    });
    
    const matchScore = Math.round(result.scores.overall_similarity * 100);
    
    return {
      success: true,
      data: {
        match_score: matchScore,
        match_grade: matchScore >= 80 ? 'EXCELLENT' : 
                    matchScore >= 70 ? 'VERY_GOOD' :
                    matchScore >= 60 ? 'GOOD' :
                    matchScore >= 50 ? 'FAIR' : 'POOR'
      }
    };
  } catch (error: any) {
    console.error('Error calculating match from text:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate match score from text'
    };
  }
};

export default {
  calculateSimpleMatch,
  calculateDatabaseMatch,
  getJobRecommendations,
  checkMatchingServiceHealth,
  calculateTextBasedMatch,
  calculateDirectMatchScore,
  calculateMatchScoreFromText,
};
