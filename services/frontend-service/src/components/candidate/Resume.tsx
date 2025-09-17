import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import { EnhanceResumeModal } from './EnhanceResumeModal';
import CVPreviewModal from './CVPreviewModal';
import CVDetailModal from './CVDetailModal';
import { ResumeCardSkeleton } from '../common/SkeletonLoader';

import cvApi, { CVExtractResponse } from '../../services/cvApi';
// Removed matchingApi import - using aiMatchingApi instead
import candidateApi from '../../services/candidateApi';
// AI matching imports removed - now handled by Business Service automatically
// import api from '../../services/api'; // Commented out business service

interface Job {
  id: string;
  title: string;
  company_name: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
}

interface MatchScore {
  job_id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  match_grade: string;
  detailed_scores?: {
    skill_match: number;
    experience_match: number;
    education_match: number;
    description_match: number;
    overall_match: number;
  };
}

interface Resume {
  id: string;
  cv_id?: string; // Add CV ID for AI matching
  candidate_id?: string; // Add candidate ID for AI matching
  full_name: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  file?: File;
  fileName?: string; // Store original file name
  fileType?: string; // Store original file type
  filePath?: string; // Server file path (stored in database)
  extractedData?: CVExtractResponse;
  uploadedAt: Date;
  matchingScore?: number; // Điểm matching với JD mẫu (deprecated)
  isCalculatingMatch?: boolean; // Loading state cho matching
  jobMatchScores?: MatchScore[]; // Match scores với các jobs hiện có
  bestMatchScore?: number; // Điểm match cao nhất
  bestMatchJob?: string; // Tên job có điểm match cao nhất
  hasJobMatches?: boolean; // Có match scores với jobs không
  is_primary?: boolean; // Whether this is the primary CV
}

// Helper functions for file persistence

// Removed base64ToFile function - files now stored on server

// Helper function to save resumes to localStorage (excluding File objects)
const saveResumesToLocalStorage = (resumes: Resume[]) => {
  const resumesToSave = resumes.map(resume => ({
    ...resume,
    file: undefined, // Remove File object for localStorage storage
    // Keep essential data for offline access
    id: resume.id,
    cv_id: resume.cv_id,
    candidate_id: resume.candidate_id,
    full_name: resume.full_name,
    email: resume.email,
    phone: resume.phone,
    address: resume.address,
    objective: resume.objective,
    fileName: resume.fileName,
    fileType: resume.fileType,
    filePath: resume.filePath,
    uploadedAt: resume.uploadedAt,
    is_primary: resume.is_primary,
    // Keep extracted data for preview and enhancement
    extractedData: resume.extractedData,
    // Keep match scores for fallback when API fails
    hasJobMatches: resume.hasJobMatches,
    bestMatchScore: resume.bestMatchScore,
    bestMatchJob: resume.bestMatchJob,
    jobMatchScores: resume.jobMatchScores,
    isCalculatingMatch: resume.isCalculatingMatch,
    matchingScore: resume.matchingScore
  }));
  
  console.log('💾 Saving resumes to localStorage:', resumesToSave.length, 'items');
  localStorage.setItem('userResumes', JSON.stringify(resumesToSave));
};

export const Resume: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [matchScore, setMatchScore] = useState('');
  const [searchResults, setSearchResults] = useState<Resume[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showClearSearch, setShowClearSearch] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<CVExtractResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailResume, setDetailResume] = useState<Resume | null>(null);

  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesError] = useState<string | null>(null); // Removed unused setters
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);

  // States from EnhanceResume
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<CVExtractResponse | null>(null);
  
  // State for dropdown menu
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Toast notification states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [showToast, setShowToast] = useState(false);

  // Action loading states
  const [loadingActions, setLoadingActions] = useState<{[key: string]: boolean}>({});

  // Delete confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);

  // Profile update confirmation modal states
  const [showProfileUpdateConfirm, setShowProfileUpdateConfirm] = useState(false);
  const [resumeForProfileUpdate, setResumeForProfileUpdate] = useState<Resume | null>(null);

  // Toast notification function
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Loading action helper
  const setActionLoading = (action: string, loading: boolean) => {
    setLoadingActions(prev => ({ ...prev, [action]: loading }));
  };

  // Load saved resumes and available jobs
  useEffect(() => {
    const loadSavedResumes = async () => {
      try {
        // First, try to load from API to get latest data including is_primary
        try {
          const apiResponse = await candidateApi.getMyCVs();
          if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
            // Transform API data to Resume format and load match scores
            const apiResumes = await Promise.all(
              apiResponse.data.map(async (cv: any) => {
                // Extract data from parsed_data or ai_analysis or extracted_contact
                const extractedData = cv.parsed_data || cv.ai_analysis || {};
                const contactData = cv.extracted_contact || {};
                
                const resumeBase = {
                  id: cv.cv_id,
                  cv_id: cv.cv_id,
                  candidate_id: cv.candidate_id,
                  full_name: cv.original_name || extractedData.full_name || extractedData.ho_va_ten || contactData.full_name || 'Untitled CV',
                  email: extractedData.email || contactData.email || 'N/A',
                  phone: extractedData.phone || extractedData.so_dien_thoai || contactData.phone || 'N/A',
                  address: extractedData.address || extractedData.dia_chi || contactData.address || 'N/A',
                  objective: extractedData.objective || extractedData.tom_tat_ban_than || extractedData.mo_ta_ban_than || extractedData.muc_tieu_nghe_nghiep || '',
                  fileName: cv.file_name,
                  fileType: cv.file_type,
                  filePath: cv.file_path,
                  uploadedAt: (() => {
                    const dateStr = cv.created_at || cv.updated_at;
                    if (dateStr) {
                      // Handle UTC timestamp from database - add 'Z' if missing timezone info
                      const utcDateStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
                      const date = new Date(utcDateStr);
                      return isNaN(date.getTime()) ? new Date() : date;
                    }
                    return new Date();
                  })(),
                  is_primary: cv.is_primary || false,
                  // Add extracted data for preview and enhancement
                  extractedData: (extractedData.full_name || extractedData.ho_va_ten) ? {
                    full_name: extractedData.full_name || extractedData.ho_va_ten || cv.original_name,
                    email: extractedData.email || contactData.email,
                    phone: extractedData.phone || extractedData.so_dien_thoai || contactData.phone,
                    address: extractedData.address || extractedData.dia_chi || contactData.address,
                    objective: extractedData.objective || extractedData.tom_tat_ban_than || extractedData.mo_ta_ban_than || extractedData.muc_tieu_nghe_nghiep,
                    skills: cv.skills_extracted?.map((skill: string) => ({ skill_name: skill })) || 
                           extractedData.ky_nang?.ky_nang_chuyen_mon?.map((skill: string) => ({ skill_name: skill })) || 
                           extractedData.ky_nang?.ngon_ngu_lap_trinh?.map((skill: string) => ({ skill_name: skill })) || 
                           extractedData.ky_nang?.cong_cu_va_cong_nghe?.map((skill: string) => ({ skill_name: skill })) || [],
                    experience: extractedData.experience || extractedData.kinh_nghiem_lam_viec || cv.extracted_experience,
                    education: extractedData.education || extractedData.hoc_van || cv.extracted_education,
                    languages: extractedData.languages || extractedData.ky_nang?.ngoai_ngu?.map((lang: string) => ({ language: lang, proficiency: 'Intermediate' })) || [],
                    certifications: extractedData.certifications || extractedData.chung_chi || [],
                    projects: extractedData.projects || extractedData.du_an || []
                  } : undefined
                };

                // Load match scores from database
                try {
                  const matchScoresResponse = await candidateApi.getCVMatchScores(cv.cv_id);
                  if (matchScoresResponse.success && matchScoresResponse.data) {
                    const scores = matchScoresResponse.data;
                    return {
                      ...resumeBase,
                      hasJobMatches: scores.has_job_matches || false,
                      bestMatchScore: scores.best_match_score || undefined,
                      bestMatchJob: scores.best_match_job || undefined,
                      jobMatchScores: scores.job_match_scores || []
                    };
                  }
                } catch (error) {
                  console.warn(`Failed to load match scores for CV ${cv.cv_id}:`, error);
                }

                // Return resume without match scores if loading fails
                return {
                  ...resumeBase,
                  hasJobMatches: false,
                  bestMatchScore: undefined,
                  bestMatchJob: undefined,
                  jobMatchScores: []
                };
              })
            );
            
            console.log('✅ API CVs loaded successfully:', apiResumes.length, 'items');
            console.log('📄 First CV sample:', apiResumes[0]);
            
            setResumes(apiResumes);
            // Save to localStorage for offline access
            saveResumesToLocalStorage(apiResumes);
            return;
          }
        } catch (apiError) {
          console.log('API failed, falling back to localStorage:', apiError);
        }
        
        // Fallback to localStorage if API fails
        const savedResumes = localStorage.getItem('userResumes');
        if (savedResumes) {
          const parsedResumes = JSON.parse(savedResumes);
          console.log('📱 Loading resumes from localStorage:', parsedResumes.length, 'items');
          // Ensure proper date parsing from localStorage
          const processedResumes = parsedResumes.map((resume: any) => ({
            ...resume,
            uploadedAt: (() => {
              // Handle UTC timestamp from localStorage - add 'Z' if missing timezone info
              const dateStr = String(resume.uploadedAt);
              const utcDateStr = dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-', 10) ? dateStr : dateStr + 'Z';
              return new Date(utcDateStr);
            })()
          }));
          setResumes(processedResumes);
        }
      } catch (err) {
        console.error('Error loading saved resumes:', err);
      }
    };

    const loadAvailableJobs = async () => {
      try {

        const response = await candidateApi.getAvailableJobs({
          page: 1,
          limit: 20,
          status: 'ACTIVE'
        });
        
        const jobsArray = Array.isArray(response) ? response : (response?.data || []);
        const formattedJobs = jobsArray.map((job: any) => ({
          id: job.job_id || job.id,
          title: job.title || job.job_title,
          company_name: job.company?.name || job.company_name || 'Unknown Company',
          location: job.location || job.city_name,
          employment_type: job.employment_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max
        }));
        
        setAvailableJobs(formattedJobs);
      } catch (err: any) {
        console.error('Error loading available jobs:', err);
        if (err.response?.status === 403 || err.response?.data?.message?.includes('Candidate profile not found')) {
          console.warn('Candidate profile not found - attempting to create one');
          try {
            await candidateApi.ensureCandidateProfile();
            console.log('Candidate profile created successfully');
            // Retry loading jobs
            const retryResponse = await candidateApi.getAvailableJobs({
              page: 1,
              limit: 20,
              status: 'ACTIVE'
            });
            const retryJobsArray = Array.isArray(retryResponse) ? retryResponse : (retryResponse?.data || []);
            const retryFormattedJobs = retryJobsArray.map((job: any) => ({
              id: job.job_id || job.id,
              title: job.title || job.job_title,
              company_name: job.company?.name || job.company_name || 'Unknown Company',
              location: job.location || job.city_name,
              employment_type: job.employment_type,
              salary_min: job.salary_min,
              salary_max: job.salary_max
            }));
            setAvailableJobs(retryFormattedJobs);
            console.log(`Loaded ${retryFormattedJobs.length} available jobs after profile creation`);
            return;
          } catch (profileError) {
            console.error('Failed to create candidate profile:', profileError);
          }
        }
        setAvailableJobs([]); // Set empty array on error
      }
    };

    loadSavedResumes();
    loadAvailableJobs();
  }, []);

  const handleOpenEnhanceModal = async (resume: Resume) => {
    // Check if we have a valid File object
    if (resume.file && resume.file instanceof File) {
      setSelectedResume(resume);
      setIsEnhanceModalOpen(true);
    } else if (resume.cv_id && resume.fileName && resume.fileType && resume.filePath) {
      // For CVs stored on server, download the actual file
      try {
        showToastMessage("Downloading CV for enhancement...", 'info');
        
        // Download the actual file from server
        const downloadedFile = await candidateApi.downloadCVFile(resume.cv_id);
        
        // Create resume with downloaded file
        const resumeWithFile = { ...resume, file: downloadedFile };
        setSelectedResume(resumeWithFile);
        setIsEnhanceModalOpen(true);
        
        console.log('✅ CV downloaded and ready for enhancement:', {
          cv_id: resume.cv_id,
          filename: downloadedFile.name,
          size: downloadedFile.size
        });
        
      } catch (error: any) {
        console.error('❌ Failed to download CV for enhancement:', error);
        showToastMessage(`Unable to download CV for enhancement: ${error.message}`, 'error');
      }
    } else {
      showToastMessage("CV file information is not available for enhancement. Please re-upload your CV to use the enhancement feature.", 'error');
    }
  };

  const handleCloseEnhanceModal = () => {
    setIsEnhanceModalOpen(false);
    setSelectedResume(null);
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewData(null);
  };

  const handleOpenDetailModal = (resume: Resume) => {
    setDetailResume(resume);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailResume(null);
  };

  // Auto match calculation is now handled by the Business Service after CV extraction
  // Frontend only needs to fetch the calculated results

  // Match grade helper removed - not needed for auto calculation



  const handleSaveExtractedData = (editedData: CVExtractResponse) => {
    // CV is already saved to database automatically after extraction
    // This function now just updates the local data and closes the modal
    setExtractedInfo(editedData);
    setPreviewData(editedData);
    
    // Update the existing resume with edited data
    setResumes(prevResumes => {
      const updatedList = prevResumes.map(r => {
        if (r.extractedData && r.full_name === editedData.full_name) {
          return {
            ...r,
            full_name: editedData.full_name || 'Unknown',
            email: editedData.email || '',
            phone: editedData.phone || '',
            address: editedData.address || '',
            objective: editedData.objective || '',
            extractedData: editedData
          };
        }
        return r;
      });
      saveResumesToLocalStorage(updatedList);
      return updatedList;
    });

    console.log('CV data updated successfully:', editedData);
    
    // Close preview modal
    handleClosePreviewModal();
  };

  const handleApplyToProfile = async (data: CVExtractResponse) => {
    try {
      await updateProfileFromCV(data);
      
      // Show success message
      showToastMessage(
        `Profile updated successfully from CV data!`, 
        'success'
      );
      
      // Clear extracted data after successful apply
      setPreviewData(null);
      
      // Close modal
      handleClosePreviewModal();
    } catch (error: any) {
      console.error('Failed to update profile from CV data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      showToastMessage(`Failed to update profile: ${errorMessage}`, 'error');
    }
  };



  const handleDeleteResume = async (resumeId: string, confirmed = false) => {
    // Show confirmation modal if not confirmed yet
    if (!confirmed) {
      const resume = resumes.find(r => r.id === resumeId);
      if (resume) {
        setResumeToDelete(resume);
        setShowDeleteConfirm(true);
      }
      return;
    }

    // Close dropdown first
    setOpenDropdownId(null);

    const actionKey = `delete_${resumeId}`;
    setActionLoading(actionKey, true);

    try {
      // Find the resume to get the CV ID
      const resume = resumes.find(r => r.id === resumeId);
      if (!resume || !resume.cv_id) {
        // If no CV ID, just remove from localStorage (legacy data)
        const updatedResumes = resumes.filter(resume => resume.id !== resumeId);
        setResumes(updatedResumes);
        saveResumesToLocalStorage(updatedResumes);
        showToastMessage('Resume deleted successfully', 'success');
        console.log('Resume deleted from localStorage:', resumeId);
        return;
      }

      // Call API to delete CV from database
      const result = await candidateApi.deleteCV(resume.cv_id);
      
      if (result.success) {
        // Remove from local state and localStorage
        const updatedResumes = resumes.filter(resume => resume.id !== resumeId);
        setResumes(updatedResumes);
        saveResumesToLocalStorage(updatedResumes);
        
        showToastMessage('CV deleted successfully', 'success');
        console.log('CV deleted from database:', resume.cv_id);
      } else {
        showToastMessage(result.message || 'Failed to delete CV', 'error');
        console.error('Failed to delete CV:', result.message);
      }
    } catch (error) {
      console.error('Error deleting CV:', error);
      showToastMessage('An error occurred while deleting the CV', 'error');
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return;
    
    setShowDeleteConfirm(false);
    const resumeId = resumeToDelete.id;
    setResumeToDelete(null);
    
    // Proceed with actual deletion
    await handleDeleteResume(resumeId, true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setResumeToDelete(null);
  };

  // Handle profile update confirmation
  const handleConfirmProfileUpdate = async () => {
    if (!resumeForProfileUpdate?.extractedData) return;
    
    setShowProfileUpdateConfirm(false);
    const resume = resumeForProfileUpdate;
    setResumeForProfileUpdate(null);
    
    try {
      await updateProfileFromCV(resume.extractedData!);
      showToastMessage(`"${resume.full_name}" has been set as your primary CV and profile updated automatically.`, 'success');
    } catch (profileError) {
      console.warn('Failed to auto-update profile from CV:', profileError);
      showToastMessage(`"${resume.full_name}" has been set as your primary CV. Profile auto-update failed - you can manually update it later.`, 'info');
    }
  };

  const handleCancelProfileUpdate = () => {
    const resume = resumeForProfileUpdate;
    setShowProfileUpdateConfirm(false);
    setResumeForProfileUpdate(null);
    
    if (resume) {
      showToastMessage(`"${resume.full_name}" has been set as your primary CV. Profile was not updated.`, 'success');
    }
  };

  // Auto match calculation is handled by Business Service after CV upload - no manual button needed

  // Utility function to update profile from CV data
  const updateProfileFromCV = async (data: CVExtractResponse) => {
    // Comprehensive mapping from CV data to profile fields
    const profileUpdateData: any = {};
    
    // Basic profile fields
    if (data.full_name) profileUpdateData.full_name = data.full_name;
    if (data.phone) profileUpdateData.phone = data.phone;
    if (data.objective) profileUpdateData.bio = data.objective;
    if (data.address) profileUpdateData.address = data.address;
    
    // Candidate-specific fields - extract from experience and education
    if (data.experience && data.experience.length > 0) {
      const latestExperience = data.experience[0]; // Assuming first is most recent
      if (latestExperience.position) profileUpdateData.current_job_title = latestExperience.position;
      if (latestExperience.company) profileUpdateData.current_company = latestExperience.company;
      
      // Calculate years of experience
      const totalYears = data.experience.length; // Simple calculation
      profileUpdateData.years_experience = totalYears;
    }
    
    // Education level from highest education
    if (data.education && data.education.length > 0) {
      const highestEducation = data.education[0]; // Assuming first is highest
      if (highestEducation.degree) {
        // Map degree to education level (matching database enum values)
        const degree = highestEducation.degree.toLowerCase();
        if (degree.includes('phd') || degree.includes('tiến sĩ')) {
          profileUpdateData.education_level = 'PHD';
        } else if (degree.includes('master') || degree.includes('thạc sĩ')) {
          profileUpdateData.education_level = 'MASTER';
        } else if (degree.includes('bachelor') || degree.includes('cử nhân') || degree.includes('đại học')) {
          profileUpdateData.education_level = 'BACHELOR';
        } else {
          profileUpdateData.education_level = 'COLLEGE';
        }
      }
    }
    
    // Languages - convert to JSON array format expected by backend
    if (data.languages && data.languages.length > 0) {
      profileUpdateData.languages = data.languages.map(lang => ({
        language: lang.language,
        proficiency: lang.proficiency || 'Intermediate'
      }));
    }
    
    // Skills - send to backend for processing
    if (data.skills && data.skills.length > 0) {
      profileUpdateData.cv_skills = data.skills.map(skill => ({
        skill_name: skill.skill_name,
        skill_type: skill.skill_type || 'TECHNICAL',
        proficiency_level: skill.proficiency_level || 'INTERMEDIATE'
      }));
    }
    
    // Education data for detailed display
    if (data.education && data.education.length > 0) {
      profileUpdateData.cv_education = data.education;
    }
    
    // Experience data for detailed display
    if (data.experience && data.experience.length > 0) {
      profileUpdateData.cv_experience = data.experience;
    }
    
    console.log('Auto-updating profile from primary CV:', profileUpdateData);
    
    const response = await candidateApi.updateProfile(profileUpdateData);
    console.log('Profile auto-updated from primary CV:', response);
    
    return response;
  };

  const handleSetPrimaryCV = async (resume: Resume) => {
    if (!resume.cv_id) {
      showToastMessage('CV ID not found. Please re-upload the CV.', 'error');
      return;
    }

    // Close dropdown
    setOpenDropdownId(null);

    const actionKey = `setPrimary_${resume.id}`;
    setActionLoading(actionKey, true);

    try {
      await candidateApi.setPrimaryCV(resume.cv_id);
      
      // Update local state - mark this CV as primary and others as not primary
      setResumes(prevResumes => 
        prevResumes.map(r => ({
          ...r,
          is_primary: r.id === resume.id
        }))
      );

      // Update localStorage
      const updatedResumes = resumes.map(r => ({
        ...r,
        is_primary: r.id === resume.id
      }));
      saveResumesToLocalStorage(updatedResumes);

      // Ask user if they want to auto-update profile with primary CV data
      if (resume.extractedData) {
        setResumeForProfileUpdate(resume);
        setShowProfileUpdateConfirm(true);
      } else {
      showToastMessage(`"${resume.full_name}" has been set as your primary CV.`, 'success');
      }
    } catch (error: any) {
      console.error('Failed to set primary CV:', error);
      showToastMessage('Failed to set primary CV. Please try again.', 'error');
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const toggleDropdown = (resumeId: string) => {
    setOpenDropdownId(openDropdownId === resumeId ? null : resumeId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Debounced search functionality
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchKeyword.trim() || matchScore.trim()) {
        setIsSearching(true);
        setShowClearSearch(true);
        
        const filtered = resumes.filter(resume => {
          // Filter by search keyword (name, email, skills, experience)
          const keyword = searchKeyword.toLowerCase();
          const keywordMatch = !keyword || (
            resume.full_name?.toLowerCase().includes(keyword) ||
            resume.email?.toLowerCase().includes(keyword) ||
            resume.extractedData?.skills?.some((skill: any) => skill.skill_name?.toLowerCase().includes(keyword)) ||
            resume.extractedData?.experience?.some((exp: any) => 
              exp.position?.toLowerCase().includes(keyword) ||
              exp.company?.toLowerCase().includes(keyword)
            ) ||
            resume.extractedData?.objective?.toLowerCase().includes(keyword)
          );
          
          // Filter by match score if specified
          const scoreThreshold = matchScore ? parseInt(matchScore) : 0;
          const scoreMatch = !matchScore || (
            (resume.bestMatchScore && resume.bestMatchScore >= scoreThreshold) ||
            (resume.matchingScore && resume.matchingScore >= scoreThreshold)
          );
          
          return keywordMatch && scoreMatch;
        });
        
        setSearchResults(filtered);
        setIsSearching(false);
      } else {
        setSearchResults(resumes);
        setShowClearSearch(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayedSearch);
  }, [searchKeyword, matchScore, resumes]);

  // Initialize search results
  useEffect(() => {
    if (!searchKeyword.trim() && !matchScore.trim()) {
      setSearchResults(resumes);
    }
  }, [resumes]);

  // Clear search function
  const handleClearSearch = () => {
    setSearchKeyword('');
    setMatchScore('');
    setSearchResults(resumes);
    setShowClearSearch(false);
  };

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('cv-search-input')?.focus();
      }
      // Escape to clear search
      if (event.key === 'Escape' && (searchKeyword || matchScore)) {
        handleClearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchKeyword, matchScore]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process multiple files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
        // Process each file with a delay to avoid overwhelming the server
        setTimeout(() => {
          setUploadedFile(file);
          setError(null);
          handleSubmit(file);
        }, i * 1000); // 1 second delay between each upload
      } else {
        showToastMessage(`File ${file.name}: Please select a PDF file under 10MB`, 'error');
        setError(`File ${file.name}: Please select a PDF file under 10MB`);
      }
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Process multiple files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
        // Process each file with a delay to avoid overwhelming the server
        setTimeout(() => {
          setUploadedFile(file);
          setError(null);
          handleSubmit(file);
        }, i * 1000); // 1 second delay between each upload
      } else {
        showToastMessage(`File ${file.name}: Please select a PDF file under 10MB`, 'error');
        setError(`File ${file.name}: Please select a PDF file under 10MB`);
      }
    }
  };





  // Removed mock calculateMatchingScore function - using real API instead

  const handleSubmit = async (file: File) => {
    if (!file) {
      setError('Please upload your CV.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedInfo(null);

    // Show initial upload notification
    showToastMessage(`🚀 Starting CV upload process for "${file.name}"...`, 'info');

    try {
      // Step 1: Upload file to server and get file path
        const uploadResult = await candidateApi.uploadCVFile(file);
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Failed to upload file');
        }

        // File uploaded - will show consolidated success message later

        // Debug: Log upload result
        console.log('📁 Upload result:', uploadResult);

      // Step 2: Create CV record in database with file path
      // This will trigger auto-extraction in business service
        const cvData = {
        cv_title: file.name.replace(/\.[^/.]+$/, '') || 'CV', // Remove file extension
          cv_file_url: uploadResult.file_path!,
          cv_file_name: uploadResult.file_name || file.name,
          cv_file_size: uploadResult.file_size || file.size,
          cv_file_type: (uploadResult.file_type as 'pdf' | 'doc' | 'docx') || 
                       (file.name.toLowerCase().endsWith('.pdf') ? 'pdf' as const : 
                        file.name.toLowerCase().endsWith('.docx') ? 'docx' as const :
                        file.name.toLowerCase().endsWith('.doc') ? 'doc' as const : 'pdf' as const),
          is_primary: false
        };

        // Debug: Log cvData being sent to API
        console.log('💾 CV data to save:', cvData);
      
      // Debug: Check authentication state
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('🔐 Auth state:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        hasUser: !!user,
        userRole: user ? JSON.parse(user).role : 'none'
      });

        const createResult = await candidateApi.saveExtractedCV(cvData);
        if (!createResult.success) {
          console.error('❌ Failed to save CV:', createResult);
          throw new Error('Failed to save CV to database');
        }

        // CV saved - will show consolidated success message later

        // Use the CV ID from database response
        const dbCvId = createResult.data?.cv?.cv_id || Date.now().toString();
        const candidateId = createResult.data?.cv?.candidate_id;

      // Step 3: Wait a moment for auto-extraction, then try to get extracted data
      console.log('⏳ Waiting for auto-extraction to complete...');
      setTimeout(async () => {
        try {
          // Try to extract CV data using AI service with cv_id for preview
          const extractedData = await cvApi.extractCVWithId(file, dbCvId);
          if (extractedData.success && extractedData.database_saved) {
            setExtractedInfo(extractedData.extracted_data);
            // Show extraction success notification
            showToastMessage(`CV information extracted successfully for !`, 'success');
            console.log('✅ CV extracted and saved to database');
          } else if (extractedData.success) {
            setExtractedInfo(extractedData.extracted_data);
            // Show partial success notification
            showToastMessage(`CV information extracted (preview only)`, 'info');
            console.log('⚠️ CV extracted but not saved to database');
          }
        } catch (extractError) {
          console.warn('⚠️ Could not extract CV for preview, but CV was uploaded successfully');
          // Don't fail the entire process if extraction fails
        }
      }, 2000); // Wait 2 seconds for business service to complete auto-extraction

      // Create initial resume object for UI (will be updated when extraction completes)
        const newResume: Resume = {
          id: dbCvId,
          cv_id: dbCvId,
          candidate_id: candidateId,
        full_name: file.name.replace(/\.[^/.]+$/, '') || 'Processing...',
        email: '',
        phone: '',
        address: '',
        objective: '',
          file: file,
          fileName: file.name,
          fileType: file.type,
          filePath: uploadResult.file_path,
        extractedData: undefined, // Will be updated when extraction completes
        uploadedAt: (() => {
          const dateStr = createResult.data?.cv?.created_at;
          if (dateStr) {
            // Handle UTC timestamp from database - add 'Z' if missing timezone info
            const utcDateStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
            const date = new Date(utcDateStr);
            return isNaN(date.getTime()) ? new Date() : date;
          }
          return new Date();
        })(),
          matchingScore: 0,
        isCalculatingMatch: false,
          jobMatchScores: [],
          hasJobMatches: false
        };

      // Add to resumes list
        const updatedResumes = [...resumes, newResume];
        setResumes(updatedResumes);
        
      // Save to localStorage for UI persistence
        saveResumesToLocalStorage(updatedResumes);

      // Calculate AI match scores in background after extraction completes
        setTimeout(async () => {
          try {
            if (candidateId) {
              console.log('Starting AI match calculation for candidate:', candidateId);
            // The business service should auto-calculate match scores after extraction
            // But as fallback, also manually trigger calculation and then fetch results
            setTimeout(async () => {
              try {
                // First, try to manually trigger match calculation as fallback
                try {
                  console.log('🔄 Manually triggering match calculation for CV:', dbCvId);
                  await candidateApi.triggerMatchCalculation(dbCvId);
                  console.log('✅ Match calculation triggered successfully');
                } catch (triggerError) {
                  console.warn('⚠️ Failed to trigger match calculation (may already be in progress):', triggerError);
                }
                
                // Wait a bit more for calculation to complete, then fetch results
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const matchScoresResult = await candidateApi.getCVMatchScores(dbCvId);
                if (matchScoresResult.success && matchScoresResult.data.has_job_matches) {
                  console.log('✅ Match scores calculated:', {
                    best_score: matchScoresResult.data.best_match_score,
                    total_matches: matchScoresResult.data.total_matches
                  });
                  
                  // Show job matching success notification
                  showToastMessage(
                    `🎯 Job matching completed! Best match: ${matchScoresResult.data.best_match_score}% (${matchScoresResult.data.total_matches || 'Several'} jobs analyzed)`, 
                    'success'
                  );
                  
                  // Update resume with match scores
                  setResumes(prevResumes => {
                    const updatedList = prevResumes.map(r => 
                      r.id === dbCvId ? { 
                        ...r, 
                        matchingScore: matchScoresResult.data.best_match_score || 0,
                        jobMatchScores: matchScoresResult.data.job_match_scores || [],
                        hasJobMatches: matchScoresResult.data.has_job_matches,
                        isCalculatingMatch: false
                      } : r
                    );
                    saveResumesToLocalStorage(updatedList);
                    return updatedList;
                  });
                } else {
                  console.log('⏳ Match scores still calculating or no matches found');
                }
              } catch (matchFetchError) {
                console.warn('Failed to fetch match scores:', matchFetchError);
              }
            }, 5000); // Wait additional 5 seconds for match calculation to complete
            } else {
              console.warn('No candidate_id found in CV response');
            }
            
            // Update to stop loading state
            setResumes(prevResumes => {
              const updatedList = prevResumes.map(r => 
                r.id === dbCvId ? { ...r, isCalculatingMatch: false } : r
              );
              saveResumesToLocalStorage(updatedList);
              return updatedList;
            });
            
          } catch (error) {
            console.error('Failed to calculate AI match scores:', error);
            // Update to stop loading state even if calculation failed
            setResumes(prevResumes => {
              const updatedList = prevResumes.map(r => 
                r.id === dbCvId ? { ...r, isCalculatingMatch: false } : r
              );
              saveResumesToLocalStorage(updatedList);
              return updatedList;
            });
          }
        }, 5000); // Wait 5 seconds to allow auto-extraction to complete

      // File successfully uploaded, clear uploaded file state if needed
      setUploadedFile(file);
      setIsLoading(false);
      
      // Show comprehensive success notification
      showToastMessage(`✅ CV "${file.name}" uploaded and saved successfully!`, 'success');
      console.log('✅ CV upload completed successfully. Auto-extraction in progress...');

    } catch (error: any) {
      console.error('❌ Failed to process CV:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to process CV';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.status === 400) {
        errorMessage = `Validation error: ${error.response?.data?.error || 'Invalid data'}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
        setError(errorMessage);
      setIsLoading(false);
    }
  };

  const ResumeCard = ({ resume }: { resume: Resume }) => {
    // Debug logging for resume data
    console.log('🎴 Rendering ResumeCard for:', resume.full_name, {
      id: resume.id,
      cv_id: resume.cv_id,
      objective: resume.objective,
      extractedData: resume.extractedData,
      hasJobMatches: resume.hasJobMatches,
      bestMatchScore: resume.bestMatchScore
    });
    
    return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group text-left cursor-pointer hover:shadow-md"
      onClick={() => handleOpenDetailModal(resume)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
            {resume.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{resume.full_name || 'Unknown'}</h3>
            <p className="text-sm text-gray-500 truncate">{resume.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-[#007BFF] text-xs font-medium whitespace-nowrap">
            {(() => {
              // Ensure we have a proper Date object
              let uploadDate;
              if (resume.uploadedAt instanceof Date) {
                uploadDate = resume.uploadedAt;
              } else {
                // Handle string timestamp from API - assume UTC if no timezone info
                const dateStr = String(resume.uploadedAt);
                const utcDateStr = dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-', 10) ? dateStr : dateStr + 'Z';
                uploadDate = new Date(utcDateStr);
              }
              
              const now = new Date();
              const diffInMinutes = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60));
              const diffInHours = Math.floor(diffInMinutes / 60);
              
              // Debug logging for timezone issues
              console.log('🕒 Time calculation debug:', {
                cv_name: resume.full_name,
                rawUploadedAt: resume.uploadedAt,
                uploadDate: uploadDate.toISOString(),
                uploadDateLocal: uploadDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                now: now.toISOString(),
                nowLocal: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                diffInMinutes,
                diffInHours
              });
              
              if (diffInMinutes < 1) {
                return 'Just now';
              } else if (diffInMinutes < 60) {
                return `${diffInMinutes}m ago`;
              } else if (diffInHours < 24) {
                return `${diffInHours}h ago`;
              } else if (diffInHours < 24 * 7) {
                const days = Math.floor(diffInHours / 24);
                return `${days}d ago`;
              } else {
                return uploadDate.toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
                  year: 'numeric',
                  timeZone: 'Asia/Ho_Chi_Minh'
                });
              }
            })()}
          </span>
          {resume.is_primary && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
              Primary
            </span>
          )}
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown(resume.id);
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {openDropdownId === resume.id && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
                {/* Calculate Job Matches button removed - now auto-calculated after CV upload */}
                {!resume.is_primary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimaryCV(resume);
                    }}
                    disabled={loadingActions[`setPrimary_${resume.id}`]}
                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingActions[`setPrimary_${resume.id}`] ? (
                      <div className="w-4 h-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Set as Primary CV
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteResume(resume.id);
                  }}
                  disabled={loadingActions[`delete_${resume.id}`]}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingActions[`delete_${resume.id}`] ? (
                    <div className="w-4 h-4 mr-2 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  Delete CV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
        {resume.isCalculatingMatch ? (
          <span className="text-blue-600 italic">
            Analyzing job matches...
          </span>
        ) : resume.hasJobMatches && resume.bestMatchJob ? (
          <span className="text-blue-600 font-medium">
            Best for: {resume.bestMatchJob}
          </span>
        ) : resume.objective || resume.extractedData?.objective ? (
          resume.objective || resume.extractedData?.objective
        ) : (
          <span className="text-gray-400 italic">
            No job matches calculated yet
          </span>
        )}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            {resume.isCalculatingMatch ? (
              <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600 animate-pulse">
                Calculating job matches...
              </span>
            ) : resume.hasJobMatches && resume.bestMatchScore !== undefined ? (
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                resume.bestMatchScore >= 80 ? 'bg-green-100 text-green-700' :
                resume.bestMatchScore >= 60 ? 'bg-blue-100 text-blue-700' :
                resume.bestMatchScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                Best Match: {resume.bestMatchScore}%
              </span>
            ) : resume.matchingScore !== undefined ? (
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                resume.matchingScore >= 70 ? 'bg-green-100 text-green-700' :
                resume.matchingScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                Sample Match: {resume.matchingScore}%
              </span>
            ) : (
              <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600">
                {availableJobs.length === 0 ? 'Profile setup needed' : 'No matches calculated'}
              </span>
            )}
                      </div>
            
            {/* Show job match count */}
          {resume.jobMatchScores && resume.jobMatchScores.length > 0 && (
            <p className="text-xs text-blue-600">
              {Math.min(resume.jobMatchScores.length, 10)} job{Math.min(resume.jobMatchScores.length, 10) > 1 ? 's' : ''} analyzed
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {/* Show Enhance button only if there are job matches with low scores or no matches */}
          {(resume.hasJobMatches && resume.bestMatchScore !== undefined && resume.bestMatchScore < 80) || 
           (!resume.hasJobMatches && resume.matchingScore !== undefined && resume.matchingScore < 70) ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEnhanceModal(resume);
              }}
              className="bg-[#007BFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0056b3] transition-colors"
              title={
                (resume.file instanceof File) || (resume.fileName && resume.filePath) 
                  ? "Enhance this resume with AI" 
                  : "Re-upload CV to enable enhancement"
              }
            >
              Enhance resume
            </button>
          ) : resume.hasJobMatches && resume.bestMatchScore !== undefined && resume.bestMatchScore >= 80 ? (
            <div className="flex items-center text-green-600 text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Great match!
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEnhanceModal(resume);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              title={
                (resume.file instanceof File) || (resume.fileName && resume.filePath) 
                  ? "Enhance this resume with AI" 
                  : "Re-upload CV to enable enhancement"
              }
            >
              Enhance resume
            </button>
          )}

        </div>
      </div>
    </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Build your <span className="text-[#007BFF] relative inline-block">
                  dream resume
                  <img 
                    src={GroupUnderline} 
                    alt="underline" 
                    className="absolute -bottom-6 left-0 w-full h-6 object-contain transform scale-125"
                  />
                </span>
              </h1>
              <p className="text-gray-600 mt-4">
                Custom the dream resumes you dream work for
              </p>
            </div>

            {/* Enhanced Search Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
              <div className="flex flex-col md:flex-row gap-2">
                {/* Search Input with Clear Button */}
                <div className="flex-1 flex items-center px-4 py-3 relative">
                  <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    id="cv-search-input"
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search by name, email, skills, company, position..."
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400 pr-8"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                  )}
                  {showClearSearch && !isSearching && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search (Esc)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="w-px bg-gray-200 hidden md:block"></div>
                
                {/* Match Score Filter */}
                <div className="flex-1 flex items-center px-4 py-3 relative">
                  <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <input
                    type="number"
                    value={matchScore}
                    onChange={(e) => setMatchScore(e.target.value)}
                    placeholder="Min match score (e.g. 70)"
                    min="0"
                    max="100"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                  {matchScore && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                      %
                    </span>
                  )}
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMatchScore('80')}
                    className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                      matchScore === '80' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    High Match (80%+)
                  </button>
                  <button
                    onClick={() => setMatchScore('60')}
                    className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                      matchScore === '60' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Good Match (60%+)
                </button>
                </div>
              </div>
              
              {/* Search Tips */}
              <div className="px-4 pb-2 pt-1">
                <p className="text-xs text-gray-500 flex items-center gap-4">
                  <span>💡 Tips: Search by name, skills, company, or position</span>
                </p>
              </div>
            </div>

            {/* Popular Suggestions */}
            <div className="text-left text-sm text-gray-600">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">Twitter, Microsoft, Apple, Facebook</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
          {/* All Your Resumes Section */}
          <div className="mb-16">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {(searchKeyword || matchScore) ? 'Search Results' : 'All Your Resumes'}
                  </h2>
              <p className="text-gray-600">
                    {(searchKeyword || matchScore) 
                      ? `Found ${searchResults.length} CV${searchResults.length !== 1 ? 's' : ''} matching your criteria`
                      : 'Based on your profile, company preferences, and recent activity'
                    }
                  </p>
                </div>
                {(searchKeyword || matchScore) && (
                  <div className="text-right">
                    <button
                      onClick={handleClearSearch}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear search
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      {searchKeyword && `Keyword: "${searchKeyword}"`}
                      {searchKeyword && matchScore && ' • '}
                      {matchScore && `Min score: ${matchScore}%`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <ResumeCardSkeleton key={i} />
                ))}
              </div>
            ) : searchResults.length === 0 && (searchKeyword || matchScore) ? (
              <div className="text-center text-gray-500 py-12">
                <div className="max-w-md mx-auto">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No CVs found</h3>
                  <p className="text-gray-500 mb-4">
                    No CVs match your search criteria. Try adjusting your search terms.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search to see all CVs
                  </button>
                </div>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center text-gray-500">
                <p>No professional profiles uploaded yet. Add your first career document below!</p>
                {availableJobs.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Note: AI matching may not be available. Please ensure your profile is complete.
                  </p>
                )}
              </div>
            ) : resumesError ? (
              <div className="text-center text-red-500">
                <p>{resumesError}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} />
                ))}
              </div>
            )}
          </div>

          {/* Add Your Resumes Section */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your Resumes</h2>
              <p className="text-gray-600">
                Based on your profile, company preferences, and recent activity
              </p>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#007BFF]/40 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="mx-auto w-16 h-16 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              {isLoading ? (
                 <div>
                   <p className="text-blue-600 font-medium mb-2">Processing CV...</p>
                   <p className="text-gray-500 text-sm">Extracting information using AI</p>
                 </div>
              ) : uploadedFile ? (
                <div>
                  <p className="text-green-600 font-medium mb-2">
                    CV processed successfully!
                  </p>
                  <p className="text-gray-600 text-sm">
                    {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  {extractedInfo && (
                    <p className="text-blue-600 text-sm mt-2">
                      ✓ Information extracted for {extractedInfo.full_name}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-gray-500 text-sm">
                    PDF files max size 10MB each. Multiple files supported.
                  </p>
                </div>
              )}
               {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {extractedInfo && (
                <div className="mt-10 p-6 bg-blue-50 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4 text-blue-800">CV Information Extracted</h2>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                        <p><strong>Name:</strong> {extractedInfo.full_name}</p>
                        <p><strong>Email:</strong> {extractedInfo.email}</p>
                        <p><strong>Phone:</strong> {extractedInfo.phone}</p>
                        <p><strong>Address:</strong> {extractedInfo.address}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
                        {extractedInfo.skills && extractedInfo.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {extractedInfo.skills.slice(0, 5).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {skill.skill_name}
                              </span>
                            ))}
                            {extractedInfo.skills.length > 5 && (
                              <span className="text-gray-500 text-xs">+{extractedInfo.skills.length - 5} more</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">No skills extracted</p>
                        )}
                      </div>
                    </div>
                    {extractedInfo.objective && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Objective</h3>
                        <p className="text-gray-700">{extractedInfo.objective}</p>
                      </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />

      {selectedResume && (
        <EnhanceResumeModal
          isOpen={isEnhanceModalOpen}
          onClose={handleCloseEnhanceModal}
          resume={selectedResume}
        />
      )}

      {/* CV Preview Modal */}
      <CVPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreviewModal}
        extractedData={previewData}
        onSave={handleSaveExtractedData}
        onApplyToProfile={handleApplyToProfile}
      />

      {/* CV Detail Modal */}
      <CVDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        resume={detailResume as Resume}
      />

      {/* Profile Update Confirmation Modal */}
      {showProfileUpdateConfirm && resumeForProfileUpdate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCancelProfileUpdate}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Update Profile from Primary CV
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Would you like to automatically update your profile with information from "<span className="font-medium text-gray-900">{resumeForProfileUpdate.full_name}</span>"? 
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      This will update: basic info, work experience, education, skills, and languages. You can still edit your profile manually later.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleConfirmProfileUpdate}
                >
                  Yes, Update Profile
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={handleCancelProfileUpdate}
                >
                  No, Keep Current Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && resumeToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCancelDelete}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete CV
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete "<span className="font-medium text-gray-900">{resumeToDelete.full_name}</span>"? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
          toastType === 'success' ? 'bg-green-500 text-white' :
          toastType === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {toastType === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toastType === 'info' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="ml-4 inline-flex text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Resume;
