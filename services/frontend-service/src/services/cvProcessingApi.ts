import apiClient from './apiClient';

export interface CVProcessingData {
  match_scores?: Record<string, any>;
  extracted_data?: Record<string, any>;
  preview_data?: Record<string, any>;
  ai_analysis?: Record<string, any>;
}

export interface CVProcessingResponse {
  cv_info: {
    cv_id: string;
    cv_title: string;
    cv_file_url: string;
    created_at: string;
    updated_at: string;
  };
  match_scores: Record<string, any>;
  extracted_data: Record<string, any>;
  preview_data: Record<string, any>;
  ai_analysis: Record<string, any>;
  embeddings: {
    has_embeddings: boolean;
    confidence_score?: number;
    model_version?: string;
    created_at?: string;
  };
}

export interface MatchScore {
  job_id: string;
  job_title: string;
  company_name: string;
  location: string;
  match_scores: {
    overall_similarity: number;
    skills_similarity: number;
    experience_similarity: number;
    education_similarity: number;
    weighted_score: number;
  };
  match_type: string;
  last_calculated: string;
}

class CVProcessingAPI {
  /**
   * Save CV processing data to database
   */
  async saveCVProcessingData(cvId: string, data: CVProcessingData): Promise<void> {
    try {
      await apiClient.post('/cv-processing/save-data', {
        cv_id: cvId,
        data
      });
    } catch (error) {
      console.error('Failed to save CV processing data:', error);
      throw error;
    }
  }

  /**
   * Get CV processing data from database
   */
  async getCVProcessingData(cvId: string): Promise<CVProcessingResponse> {
    try {
      const response = await apiClient.get(`/cv-processing/get-data/${cvId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get CV processing data:', error);
      throw error;
    }
  }

  /**
   * Get CV match scores
   */
  async getCVMatchScores(cvId: string, limit: number = 20): Promise<MatchScore[]> {
    try {
      const response = await apiClient.get(`/cv-processing/get-match-scores/${cvId}?limit=${limit}`);
      return response.data.data.match_scores;
    } catch (error) {
      console.error('Failed to get CV match scores:', error);
      return [];
    }
  }

  /**
   * Save CV processing data with localStorage fallback for immediate access
   */
  async saveCVProcessingDataHybrid(cvId: string, data: CVProcessingData): Promise<void> {
    try {
      // Save to localStorage immediately for fast access
      const localStorageKey = `cv_processing_${cvId}`;
      localStorage.setItem(localStorageKey, JSON.stringify({
        ...data,
        saved_at: new Date().toISOString()
      }));

      // Save to database asynchronously 
      this.saveCVProcessingData(cvId, data).catch(error => {
        console.warn('Failed to save to database, but data saved to localStorage:', error);
      });
    } catch (error) {
      console.error('Failed to save CV processing data:', error);
      throw error;
    }
  }

  /**
   * Get CV processing data with localStorage fallback
   */
  async getCVProcessingDataHybrid(cvId: string): Promise<CVProcessingResponse | null> {
    try {
      // Try localStorage first for immediate response
      const localStorageKey = `cv_processing_${cvId}`;
      const localData = localStorage.getItem(localStorageKey);

      if (localData) {
        try {
          const parsedLocalData = JSON.parse(localData);
          // If local data is recent (within 1 hour), use it
          const savedAt = new Date(parsedLocalData.saved_at);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (savedAt > oneHourAgo) {
            // Return formatted data similar to API response
            return {
              cv_info: {
                cv_id: cvId,
                cv_title: 'Local CV',
                cv_file_url: '',
                created_at: parsedLocalData.saved_at,
                updated_at: parsedLocalData.saved_at
              },
              match_scores: parsedLocalData.match_scores || {},
              extracted_data: parsedLocalData.extracted_data || {},
              preview_data: parsedLocalData.preview_data || {},
              ai_analysis: parsedLocalData.ai_analysis || {},
              embeddings: { has_embeddings: false }
            };
          }
        } catch (e) {
          console.warn('Failed to parse localStorage data:', e);
        }
      }

      // Try database as fallback
      try {
        return await this.getCVProcessingData(cvId);
      } catch (dbError) {
        console.warn('Database fetch failed, using localStorage if available:', dbError);
        
        // If database fails but we have localStorage data, use it even if old
        if (localData) {
          try {
            const parsedLocalData = JSON.parse(localData);
            return {
              cv_info: {
                cv_id: cvId,
                cv_title: 'Local CV (Offline)',
                cv_file_url: '',
                created_at: parsedLocalData.saved_at,
                updated_at: parsedLocalData.saved_at
              },
              match_scores: parsedLocalData.match_scores || {},
              extracted_data: parsedLocalData.extracted_data || {},
              preview_data: parsedLocalData.preview_data || {},
              ai_analysis: parsedLocalData.ai_analysis || {},
              embeddings: { has_embeddings: false }
            };
          } catch (e) {
            console.warn('Failed to parse localStorage fallback data:', e);
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error('Failed to get CV processing data:', error);
      return null;
    }
  }
}

export const cvProcessingApi = new CVProcessingAPI();
export default cvProcessingApi;
