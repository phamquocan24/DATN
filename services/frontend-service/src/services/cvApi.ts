// import api from './api'; // Commented out - using direct fetch for AI service

export interface CVExtractResponse {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    gpa?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
  }>;
  skills: Array<{
    skill_name: string;
    skill_type: string;
    proficiency_level: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    start_date: string;
    end_date: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
}

export interface CVImproveRequest {
  cv: File;
  cong_ty_ung_tuyen: string;
  vi_tri_ung_tuyen: string;
  linh_vuc: string;
}

export interface CVUploadRequest {
  cv: File;
  company_name?: string;
  position?: string;
  field?: string;
}

// AI Service endpoints (port 8003)
const AI_SERVICE_BASE_URL = 'http://localhost:8003';

// Business Service endpoints (port 3001) - commented out
// const BUSINESS_SERVICE_BASE_URL = 'http://localhost:3001';

/**
 * Extract CV information using AI service
 */
export const extractCV = async (file: File): Promise<CVExtractResponse> => {
  const formData = new FormData();
  formData.append('cv', file);

  const response = await fetch(`${AI_SERVICE_BASE_URL}/extract-cv`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

/**
 * Improve CV with AI suggestions
 */
export const improveCV = async (request: CVImproveRequest): Promise<string> => {
  const formData = new FormData();
  formData.append('cv', request.cv);
  formData.append('cong_ty_ung_tuyen', request.cong_ty_ung_tuyen);
  formData.append('vi_tri_ung_tuyen', request.vi_tri_ung_tuyen);
  formData.append('linh_vuc', request.linh_vuc);

  const response = await fetch(`${AI_SERVICE_BASE_URL}/improve-cv`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.text();
  return result;
};

/**
 * Save feedback for CV improvement
 */
export const saveFeedback = async (rating: number, comment: string = ''): Promise<{ message: string; id: string }> => {
  const response = await fetch(`${AI_SERVICE_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rating,
      comment,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

/**
 * Check AI service health
 */
export const checkAIServiceHealth = async (): Promise<{ status: string; service: string }> => {
  const response = await fetch(`${AI_SERVICE_BASE_URL}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

// Business Service CV operations (commented out)
/*
export const uploadCVToBusinessService = async (request: CVUploadRequest): Promise<any> => {
  const formData = new FormData();
  formData.append('cv', request.cv);
  formData.append('company_name', request.company_name || '');
  formData.append('position', request.position || '');
  formData.append('field', request.field || '');

  const response = await api.post('/api/v1/cvs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getCVsFromBusinessService = async (): Promise<any> => {
  const response = await api.get('/api/v1/cvs');
  return response.data;
};
*/

export default {
  extractCV,
  improveCV,
  saveFeedback,
  checkAIServiceHealth,
  // uploadCVToBusinessService,
  // getCVsFromBusinessService,
};
