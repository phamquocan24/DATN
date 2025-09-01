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
import { 
  batchCalculateAIMatchScores, 
  getAIJobRecommendations
} from '../../services/aiMatchingApi';
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
                  full_name: cv.original_name || extractedData.full_name || contactData.full_name || 'Untitled CV',
                  email: extractedData.email || contactData.email || 'N/A',
                  phone: extractedData.phone || contactData.phone || 'N/A',
                  address: extractedData.address || contactData.address || 'N/A',
                  objective: extractedData.objective || extractedData.mo_ta_ban_than || '',
                  fileName: cv.file_name,
                  fileType: cv.file_type,
                  filePath: cv.file_path,
                  uploadedAt: new Date(cv.created_at || cv.updated_at || Date.now()),
                  is_primary: cv.is_primary || false,
                  // Add extracted data for preview and enhancement
                  extractedData: extractedData.full_name ? {
                    full_name: extractedData.full_name || cv.original_name,
                    email: extractedData.email || contactData.email,
                    phone: extractedData.phone || contactData.phone,
                    address: extractedData.address || contactData.address,
                    objective: extractedData.objective || extractedData.mo_ta_ban_than,
                    skills: cv.skills_extracted?.map((skill: string) => ({ skill_name: skill })) || [],
                    experience: extractedData.experience || cv.extracted_experience,
                    education: extractedData.education || cv.extracted_education,
                    languages: extractedData.languages || [],
                    certifications: extractedData.certifications || [],
                    projects: extractedData.projects || []
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
            uploadedAt: new Date(resume.uploadedAt)
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

  // Function to calculate AI match scores for a CV with all available jobs
  const calculateAIMatchScoresForCV = async (cvId: string, candidateId: string) => {
    try {
      console.log('Starting AI match calculation for CV:', cvId);
      
      // First, get job recommendations for this candidate
      const recommendationsResult = await getAIJobRecommendations(candidateId, 20);
      
      if (!recommendationsResult.success) {
        if (recommendationsResult.error?.includes('CV is still being processed')) {
          showToastMessage('CV is still being processed. Please try again in a few moments.', 'info');
          return;
        } else {
          console.error('Failed to get job recommendations:', recommendationsResult.error);
          showToastMessage('Failed to calculate job matches. Please try again later.', 'error');
          return;
        }
      }
      
      if (recommendationsResult.success && recommendationsResult.data) {
        const jobIds = recommendationsResult.data.recommendations.map(rec => rec.job_id);
        
        if (jobIds.length > 0) {
          console.log(`Calculating match scores for ${jobIds.length} jobs`);
          
          // Calculate batch match scores
          const batchResult = await batchCalculateAIMatchScores(cvId, jobIds);
          
          if (batchResult.success && batchResult.data) {
            // Find the best match
            const validMatches = batchResult.data.filter(match => !match.error && match.match_score > 0);
            
            if (validMatches.length > 0) {
              const bestMatch = validMatches.reduce((prev, current) => 
                (prev.match_score > current.match_score) ? prev : current
              );
              
              console.log(`Best match found: ${bestMatch.match_score}% for job ${bestMatch.job_id}`);
              
              // Prepare match scores data for saving
              const matchScoresData = {
                best_match_score: bestMatch.match_score,
                best_match_job: recommendationsResult.data!.recommendations.find(rec => rec.job_id === bestMatch.job_id)?.title || 'Unknown Job',
                has_job_matches: true,
                job_match_scores: validMatches.map(match => ({
                  job_id: match.job_id,
                  job_title: recommendationsResult.data!.recommendations.find(rec => rec.job_id === match.job_id)?.title || 'Unknown Job',
                  company_name: recommendationsResult.data!.recommendations.find(rec => rec.job_id === match.job_id)?.group || 'Unknown Company',
                  match_score: match.match_score,
                  match_grade: getMatchGrade(match.match_score),
                  detailed_scores: {
                    skill_match: match.ky_nang_similarity ? Math.round(match.ky_nang_similarity * 100) : 0,
                    experience_match: match.kinh_nghiem_similarity ? Math.round(match.kinh_nghiem_similarity * 100) : 0,
                    education_match: match.hoc_van_similarity ? Math.round(match.hoc_van_similarity * 100) : 0,
                    description_match: match.mo_ta_ban_than_similarity ? Math.round(match.mo_ta_ban_than_similarity * 100) : 0,
                    overall_match: match.match_score
                  }
                }))
              };

              // Save match scores to database for persistence
              try {
                await candidateApi.saveCVMatchScores(cvId, matchScoresData);
                console.log('✅ Match scores saved to database successfully');
              } catch (saveError) {
                console.warn('⚠️ Failed to save match scores to database:', saveError);
                // Continue with UI update even if save fails
              }

              // Update the resume with match data in UI and localStorage
              setResumes(prevResumes => {
                const updatedResumes = prevResumes.map(resume => {
                  if (resume.cv_id === cvId) {
                    const updatedResume = {
                      ...resume,
                      hasJobMatches: matchScoresData.has_job_matches,
                      bestMatchScore: matchScoresData.best_match_score,
                      bestMatchJob: matchScoresData.best_match_job,
                      isCalculatingMatch: false, // Stop loading state
                      jobMatchScores: matchScoresData.job_match_scores.map(score => ({
                        job_id: score.job_id,
                        job_title: score.job_title,
                        company_name: score.company_name,
                        match_score: score.match_score,
                        match_grade: score.match_grade,
                        detailed_scores: score.detailed_scores
                      }))
                    };
                    console.log('💾 Updated resume with match scores:', updatedResume.full_name, {
                      hasJobMatches: updatedResume.hasJobMatches,
                      bestMatchScore: updatedResume.bestMatchScore,
                      bestMatchJob: updatedResume.bestMatchJob,
                      jobMatchCount: updatedResume.jobMatchScores?.length || 0
                    });
                    return updatedResume;
                  }
                  return resume;
                });
                
                // Save updated data to localStorage
                console.log('💾 Saving match scores to localStorage...');
                saveResumesToLocalStorage(updatedResumes);
                return updatedResumes;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calculating AI match scores:', error);
    }
  };

  // Helper function to determine match grade
  const getMatchGrade = (score: number): string => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 70) return 'VERY_GOOD';
    if (score >= 60) return 'GOOD';
    if (score >= 50) return 'FAIR';
    return 'POOR';
  };



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
      // Apply selected data to user profile
      const profileUpdateData = {
        full_name: data.full_name,
        phone: data.phone,
        bio: data.objective,
        // Map other fields as needed
      };
      
      const response = await candidateApi.updateProfile(profileUpdateData);
      console.log('Profile updated from CV data:', response);
      
      // Show success message
      showToastMessage('Profile updated successfully with CV data!', 'success');
      
      // Close modal
      handleClosePreviewModal();
    } catch (error) {
      console.error('Failed to update profile from CV data:', error);
      showToastMessage('Failed to update profile. Please try again.', 'error');
    }
  };



  const handleDeleteResume = async (resumeId: string, skipConfirm = false) => {
    // Show confirmation state in UI instead of alert
    if (!skipConfirm) {
      const actionKey = `confirmDelete_${resumeId}`;
      setActionLoading(actionKey, true);
      
      // Set a short timeout to show the confirmation state
      setTimeout(() => {
        setActionLoading(actionKey, false);
        // You can add a confirmation modal here instead of browser confirm
        handleDeleteResume(resumeId, true);
      }, 1000);
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

  const handleCalculateJobMatches = async (resume: Resume) => {
    console.log('🎯 Starting Calculate Job Matches for:', resume.full_name, {
      cv_id: resume.cv_id,
      candidate_id: resume.candidate_id,
      hasJobMatches: resume.hasJobMatches,
      bestMatchScore: resume.bestMatchScore
    });

    if (!resume.cv_id || !resume.candidate_id) {
      showToastMessage('CV ID or Candidate ID not found. Please re-upload the CV.', 'error');
      return;
    }

    // Close dropdown
    setOpenDropdownId(null);

    const actionKey = `calculateMatch_${resume.id}`;
    setActionLoading(actionKey, true);

    try {
      // Set loading state for this specific resume
      setResumes(prevResumes => 
        prevResumes.map(r => 
          r.id === resume.id ? { ...r, isCalculatingMatch: true } : r
        )
      );

      // Calculate AI match scores directly
      await calculateAIMatchScoresForCV(resume.cv_id, resume.candidate_id);
      
      // Set selected CV for job matching in localStorage
      const cvForMatching = {
        cv_id: resume.cv_id,
        candidate_id: resume.candidate_id,
        full_name: resume.full_name,
        uploadedAt: resume.uploadedAt
      };
      localStorage.setItem('selectedCVForMatching', JSON.stringify(cvForMatching));
      console.log('💾 Saved selectedCVForMatching to localStorage:', cvForMatching);

      // Trigger calculation in other components
      const triggerTime = Date.now().toString();
      localStorage.setItem('triggerJobMatching', triggerTime);
      console.log('💾 Set triggerJobMatching:', triggerTime);

      showToastMessage(`Job matches calculated for ${resume.full_name}. Results available in Find Jobs section.`, 'success');
      
      console.log('✅ Completed job matching calculation for CV:', resume.cv_id);
    } catch (error) {
      console.error('❌ Error calculating job matches:', error);
      showToastMessage('Failed to calculate job matches. Please try again.', 'error');
    } finally {
      setActionLoading(actionKey, false);
      // Remove loading state only if not already updated by calculateAIMatchScoresForCV
      setResumes(prevResumes => 
        prevResumes.map(r => 
          r.id === resume.id && r.isCalculatingMatch ? { ...r, isCalculatingMatch: false } : r
        )
      );
    }
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

      showToastMessage(`"${resume.full_name}" has been set as your primary CV.`, 'success');
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

    try {
      // Extract CV information using AI service
      const extractedData = await cvApi.extractCV(file);
      setExtractedInfo(extractedData);

      try {
        // Upload file to server and get file path
        const uploadResult = await candidateApi.uploadCVFile(file);
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Failed to upload file');
        }

        // Debug: Log upload result
        console.log('📁 Upload result:', uploadResult);

        // Create CV record in database with file path
        const cvData = {
          cv_title: extractedData.full_name || 'CV',
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

        const createResult = await candidateApi.saveExtractedCV(cvData);
        if (!createResult.success) {
          console.error('❌ Failed to save CV:', createResult);
          throw new Error('Failed to save CV to database');
        }

        // Use the CV ID from database response
        const dbCvId = createResult.data?.cv?.cv_id || Date.now().toString();
        const candidateId = createResult.data?.cv?.candidate_id;

        // Save CV content (parsed data) to database for AI service
        try {
          await candidateApi.saveCVContent(dbCvId, extractedData);
          console.log('CV content saved to database for AI service');
        } catch (contentError) {
          console.warn('Failed to save CV content, but CV file was saved:', contentError);
        }
        
        const newResume: Resume = {
          id: dbCvId,
          cv_id: dbCvId,
          candidate_id: candidateId,
          full_name: extractedData.full_name || 'Unknown',
          email: extractedData.email || '',
          phone: extractedData.phone || '',
          address: extractedData.address || '',
          objective: extractedData.objective || '',
          file: file,
          fileName: file.name,
          fileType: file.type,
          filePath: uploadResult.file_path,
          extractedData: extractedData,
          uploadedAt: new Date(),
          matchingScore: 0,
          isCalculatingMatch: true,
          jobMatchScores: [],
          hasJobMatches: false
        };

        // Add to resumes list (still keep in memory for UI)
        const updatedResumes = [...resumes, newResume];
        setResumes(updatedResumes);
        
        // Still save to localStorage for UI persistence (file is now stored on server, not as base64)
        // localStorage is used only for resume metadata and UI state
        saveResumesToLocalStorage(updatedResumes);

        // Calculate AI match scores with all available jobs in background
        setTimeout(async () => {
          try {
            // Use candidateId from the create result
            
            if (candidateId) {
              console.log('Starting AI match calculation for candidate:', candidateId);
              await calculateAIMatchScoresForCV(dbCvId, candidateId);
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
        }, 2000); // Increased delay to allow CV content to be saved

        // Show preview modal for viewing (but data is already saved)
        setPreviewData(extractedData);
        setIsPreviewModalOpen(true);
        
        console.log('CV extracted and automatically saved to database');
        
      } catch (saveError: any) {
        console.error('Failed to save CV to database:', saveError);
        
        // Check if it's a validation error
        let errorMessage = 'CV extracted successfully, but failed to save to database. You can still view and edit the data.';
        if (saveError.response?.data?.error) {
          errorMessage = `Save failed: ${saveError.response.data.error}`;
        } else if (saveError.message) {
          errorMessage = `Save failed: ${saveError.message}`;
        }
        
        // Still show the preview modal even if database save fails
        setPreviewData(extractedData);
        setIsPreviewModalOpen(true);
        setError(errorMessage);
      }

    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while processing the CV.';
      setError(errorMessage);
      console.error('CV Processing Error:', err);
    } finally {
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
            {new Date(resume.uploadedAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCalculateJobMatches(resume);
                  }}
                  disabled={loadingActions[`calculateMatch_${resume.id}`]}
                  className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingActions[`calculateMatch_${resume.id}`] ? (
                    <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  Calculate Job Matches
                </button>
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
                  disabled={loadingActions[`delete_${resume.id}`] || loadingActions[`confirmDelete_${resume.id}`]}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(loadingActions[`delete_${resume.id}`] || loadingActions[`confirmDelete_${resume.id}`]) ? (
                    <div className="w-4 h-4 mr-2 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  {loadingActions[`confirmDelete_${resume.id}`] ? 'Confirming...' : 'Delete'}
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

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Resume name or keyword"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <div className="w-px bg-gray-200 hidden md:block"></div>
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <input
                    type="text"
                    value={matchScore}
                    onChange={(e) => setMatchScore(e.target.value)}
                    placeholder="Match score"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button className="bg-[#007BFF] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#0056b3] transition-colors">
                  Search
                </button>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Your Resumes</h2>
              <p className="text-gray-600">
                Based on your profile, company preferences, and recent activity
              </p>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <ResumeCardSkeleton key={i} />
                ))}
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
                {resumes.map((resume) => (
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
