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

  let result: any = await response.json();

  // Some backends may return a JSON string instead of an object
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result);
    } catch (e) {
      console.warn('Unable to parse JSON string from extract-cv, returning empty defaults');
    }
  }

  // Normalize keys from Vietnamese -> English (expected by frontend)
  const normalizeArray = (arr: any, mapper: (item: any) => any) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(mapper).filter(Boolean);
  };

  const normalized: CVExtractResponse = {
    full_name: result?.full_name || result?.ho_va_ten || result?.ho_ten || '',
    email: result?.email || result?.thu_dien_tu || '',
    phone: result?.phone || result?.so_dien_thoai || '',
    address: result?.address || result?.dia_chi || '',
    objective: result?.objective || result?.muc_tieu || result?.muc_tieu_nghe_nghiep || '',
    education: normalizeArray(result?.education || result?.hoc_van, (edu: any) => ({
      school: edu?.school || edu?.truong || '',
      degree: edu?.degree || edu?.bang_cap || edu?.trinh_do || '',
      field: edu?.field || edu?.chuyen_nganh || '',
      start_date: edu?.start_date || edu?.ngay_bat_dau || edu?.thoi_gian_bat_dau || '',
      end_date: edu?.end_date || edu?.ngay_ket_thuc || edu?.thoi_gian_ket_thuc || '',
      gpa: edu?.gpa || edu?.diem_trung_binh || edu?.diem || edu?.diem_gpa || undefined,
    })),
    experience: normalizeArray(result?.experience || result?.kinh_nghiem || result?.kinh_nghiem_lam_viec, (exp: any) => ({
      company: exp?.company || exp?.cong_ty || '',
      position: exp?.position || exp?.vi_tri || '',
      start_date: exp?.start_date || exp?.ngay_bat_dau || exp?.thoi_gian_bat_dau || '',
      end_date: exp?.end_date || exp?.ngay_ket_thuc || exp?.thoi_gian_ket_thuc || '',
      description: exp?.description || exp?.mo_ta || exp?.mo_ta_cong_viec || '',
    })),
    skills: (() => {
      const skillsData = result?.skills || result?.ky_nang;
      const allSkills: any[] = [];
      
      if (skillsData && typeof skillsData === 'object') {
        // Handle skills organized by category
        if (skillsData.ky_nang_chuyen_mon) {
          skillsData.ky_nang_chuyen_mon.forEach((skill: string) => {
            allSkills.push({ skill_name: skill, skill_type: 'Technical', proficiency_level: '' });
          });
        }
        if (skillsData.ky_nang_mem) {
          skillsData.ky_nang_mem.forEach((skill: string) => {
            allSkills.push({ skill_name: skill, skill_type: 'Soft Skills', proficiency_level: '' });
          });
        }
        if (skillsData.ngon_ngu_lap_trinh) {
          skillsData.ngon_ngu_lap_trinh.forEach((skill: string) => {
            allSkills.push({ skill_name: skill, skill_type: 'Programming', proficiency_level: '' });
          });
        }
        if (skillsData.cong_cu_va_cong_nghe) {
          skillsData.cong_cu_va_cong_nghe.forEach((skill: string) => {
            allSkills.push({ skill_name: skill, skill_type: 'Tools & Technology', proficiency_level: '' });
          });
        }
        // Note: ngoai_ngu (languages) are now handled in the languages section below
        
        // Handle array format
        if (Array.isArray(skillsData)) {
          skillsData.forEach((sk: any) => {
            if (typeof sk === 'string') {
              allSkills.push({ skill_name: sk, skill_type: '', proficiency_level: '' });
            } else {
              allSkills.push({
                skill_name: sk?.skill_name || sk?.ten_ky_nang || sk?.ten || '',
                skill_type: sk?.skill_type || sk?.loai_ky_nang || sk?.loai || '',
                proficiency_level: sk?.proficiency_level || sk?.muc_do_thanh_thao || sk?.trinh_do || '',
              });
            }
          });
        }
      }
      
      return allSkills;
    })(),
    certifications: normalizeArray(result?.certifications || result?.chung_chi, (c: any) => ({
      name: c?.name || c?.ten || c?.ten_chung_chi || '',
      issuer: c?.issuer || c?.don_vi_cap || c?.to_chuc_cap || '',
      date: c?.date || c?.ngay_cap || c?.thoi_gian_cap || '',
    })),
    projects: normalizeArray(result?.projects || result?.du_an, (p: any) => ({
      name: p?.name || p?.ten || '',
      description: p?.description || p?.mo_ta || '',
      technologies: p?.technologies || p?.cong_nghe || [],
      start_date: p?.start_date || p?.ngay_bat_dau || '',
      end_date: p?.end_date || p?.ngay_ket_thuc || '',
    })),
    languages: (() => {
      const languagesData = result?.languages || result?.ngoai_ngu;
      const skillsData = result?.skills || result?.ky_nang;
      const allLanguages: any[] = [];
      
      // Handle direct languages data
      if (Array.isArray(languagesData)) {
        languagesData.forEach((l: any) => {
          if (typeof l === 'string') {
            allLanguages.push({ language: l, proficiency: '' });
          } else {
            allLanguages.push({
              language: l?.language || l?.ngon_ngu || '',
              proficiency: l?.proficiency || l?.trinh_do || '',
            });
          }
        });
      }
      
      // Handle languages from skills.ngoai_ngu
      if (skillsData && skillsData.ngoai_ngu && Array.isArray(skillsData.ngoai_ngu)) {
        skillsData.ngoai_ngu.forEach((lang: string) => {
          // Avoid duplicates
          if (!allLanguages.find(existing => existing.language.toLowerCase() === lang.toLowerCase())) {
            allLanguages.push({ language: lang, proficiency: '' });
          }
        });
      }
      
      return allLanguages;
    })(),
  };

  return normalized;
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
