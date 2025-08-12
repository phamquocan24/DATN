import api from './api';

export interface CV {
  cv_id: string;
  cv_title: string;
  cv_file_url: string;
  cv_file_name: string;
  cv_file_size: number;
  cv_file_type: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface CVCreateData {
  cv_title: string;
  cv_file_url: string;
  cv_file_name: string;
  cv_file_size: number;
  cv_file_type: string;
  is_primary?: boolean;
}

export interface CVUpdateData {
  cv_title?: string;
  cv_file_url?: string;
  cv_file_name?: string;
  cv_file_size?: number;
  cv_file_type?: string;
  is_primary?: boolean;
}

export interface CVListParams {
  page?: number;
  limit?: number;
  search?: string;
  skills?: string;
  experience_min?: number;
  education_level?: 'BACHELOR' | 'HIGH_SCHOOL' | 'COLLEGE' | 'MASTER' | 'PHD';
}

export interface CVListResponse {
  data: CV[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const cvApi = {
  // Get list of CVs (with filters for HR/Recruiters)
  getCVs: async (params: CVListParams = {}): Promise<CVListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.skills) searchParams.append('skills', params.skills);
    if (params.experience_min) searchParams.append('experience_min', params.experience_min.toString());
    if (params.education_level) searchParams.append('education_level', params.education_level);

    const response = await api.get(`/cvs?${searchParams.toString()}`);
    return response.data;
  },

  // Get current candidate's CVs
  getMyCVs: async (params: { page?: number; limit?: number } = {}): Promise<CVListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get(`/cvs/my-cvs?${searchParams.toString()}`);
    return response.data;
  },

  // Get CV by ID
  getCVById: async (cvId: string): Promise<{ data: CV }> => {
    const response = await api.get(`/cvs/${cvId}`);
    return response.data;
  },

  // Create a new CV
  createCV: async (cvData: CVCreateData): Promise<{ data: CV }> => {
    const response = await api.post('/cvs', cvData);
    return response.data;
  },

  // Update an existing CV
  updateCV: async (cvId: string, cvData: CVUpdateData): Promise<{ data: CV }> => {
    const response = await api.put(`/cvs/${cvId}`, cvData);
    return response.data;
  },

  // Delete a CV
  deleteCV: async (cvId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/cvs/${cvId}`);
    return response.data;
  },

  // Upload file helper (if you have a separate file upload endpoint)
  uploadFile: async (file: File): Promise<{ data: { url: string; fileName: string; fileSize: number; fileType: string } }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default cvApi;
