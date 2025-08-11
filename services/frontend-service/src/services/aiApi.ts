import axios from 'axios';

// Dedicated client for AI service (no /api/v1 prefix)
// Configure via VITE_AI_SERVICE_URL, default to local dev port used by the service
const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8003';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 60000,
});

const aiApi = {
  // Health check
  health: async () => {
    const res = await aiClient.get('/health');
    return res.data;
  },

  // Extract CV to JSON
  extractCv: async (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);
    const res = await aiClient.post('/extract-cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Improve CV for specific target
  improveCv: async (
    file: File,
    params: { company: string; position: string; field: string }
  ) => {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('cong_ty_ung_tuyen', params.company);
    formData.append('vi_tri_ung_tuyen', params.position);
    formData.append('linh_vuc', params.field);
    const res = await aiClient.post('/improve-cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Save feedback to AI service's MongoDB
  saveFeedback: async (rating: number, comment: string) => {
    const res = await aiClient.post('/feedback', { rating, comment });
    return res.data;
  },
};

export default aiApi;



