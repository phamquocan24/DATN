import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import { EnhanceResumeModal } from './EnhanceResumeModal';
import CVPreviewModal from './CVPreviewModal';
import CVDetailModal from './CVDetailModal';

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
    location_match: number;
    salary_match: number;
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
  extractedData?: CVExtractResponse;
  uploadedAt: Date;
  matchingScore?: number; // Điểm matching với JD mẫu (deprecated)
  isCalculatingMatch?: boolean; // Loading state cho matching
  jobMatchScores?: MatchScore[]; // Match scores với các jobs hiện có
  bestMatchScore?: number; // Điểm match cao nhất
  bestMatchJob?: string; // Tên job có điểm match cao nhất
  hasJobMatches?: boolean; // Có match scores với jobs không
}

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

  // Load saved resumes and available jobs
  useEffect(() => {
    const loadSavedResumes = () => {
      try {
        const savedResumes = localStorage.getItem('userResumes');
        if (savedResumes) {
          setResumes(JSON.parse(savedResumes));
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

  const handleOpenEnhanceModal = (resume: Resume) => {
    if (resume.file) {
      setSelectedResume(resume);
      setIsEnhanceModalOpen(true);
    } else {
      alert("No file associated with this resume. Please re-upload the file.");
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
              
              // Update the resume with match data
              setResumes(prevResumes => 
                prevResumes.map(resume => {
                  if (resume.cv_id === cvId) {
                    return {
                      ...resume,
                      hasJobMatches: true,
                      bestMatchScore: bestMatch.match_score,
                      jobMatchScores: validMatches.map(match => ({
                        job_id: match.job_id,
                        match_score: match.match_score,
                        match_grade: getMatchGrade(match.match_score),
                        job_title: recommendationsResult.data!.recommendations.find(rec => rec.job_id === match.job_id)?.title || 'Unknown Job',
                        company_name: recommendationsResult.data!.recommendations.find(rec => rec.job_id === match.job_id)?.group || 'Unknown Company',
                        detailed_scores: {
                          skill_match: match.match_score * 0.9 + Math.random() * 10, // Simulated detailed scores
                          experience_match: match.match_score * 0.8 + Math.random() * 15,
                          education_match: match.match_score * 0.7 + Math.random() * 20,
                          location_match: match.match_score * 0.6 + Math.random() * 25,
                          salary_match: match.match_score * 0.5 + Math.random() * 30
                        }
                      })),
                      bestMatchJob: recommendationsResult.data!.recommendations.find(rec => rec.job_id === bestMatch.job_id)?.title || 'Unknown Job'
                    };
                  }
                  return resume;
                })
              );
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
      localStorage.setItem('userResumes', JSON.stringify(updatedList));
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
      alert('Profile updated successfully with CV data!');
      
      // Close modal
      handleClosePreviewModal();
    } catch (error) {
      console.error('Failed to update profile from CV data:', error);
      alert('Failed to update profile. Please try again.');
    }
  };



  const handleDeleteResume = (resumeId: string) => {
    const updatedResumes = resumes.filter(resume => resume.id !== resumeId);
    setResumes(updatedResumes);
    
    // Update localStorage
    localStorage.setItem('userResumes', JSON.stringify(updatedResumes));
    
    // Close dropdown
    setOpenDropdownId(null);
    
    console.log('Resume deleted:', resumeId);
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
        alert(`File ${file.name}: Please select a PDF file under 5MB`);
        setError(`File ${file.name}: Please select a PDF file under 5MB`);
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
        alert(`File ${file.name}: Please select a PDF file under 5MB`);
        setError(`File ${file.name}: Please select a PDF file under 5MB`);
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

      // Automatically save CV data to database
      const cvTitle = extractedData.full_name 
        ? `${extractedData.full_name}'s CV - ${new Date().toLocaleDateString()}`
        : `CV - ${new Date().toLocaleDateString()}`;
      
      // Create a temporary file URL (in production, this should be uploaded to a file storage service)
      const fileUrl = URL.createObjectURL(file);
      
      // Determine file type based on file extension and MIME type
      const getFileType = (file: File): 'pdf' | 'doc' | 'docx' => {
        const fileName = file.name.toLowerCase();
        const mimeType = file.type.toLowerCase();
        
        if (fileName.endsWith('.pdf') || mimeType.includes('pdf')) {
          return 'pdf';
        } else if (fileName.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
          return 'docx';
        } else if (fileName.endsWith('.doc') || mimeType.includes('msword')) {
          return 'doc';
        } else {
          // Default to pdf if unknown
          return 'pdf';
        }
      };

      const cvData = {
        cv_title: cvTitle,
        cv_file_url: fileUrl, // In production, upload file and get real URL
        cv_file_name: file.name,
        cv_file_size: file.size,
        cv_file_type: getFileType(file),
        is_primary: false
      };

      try {
        const savedCV = await candidateApi.saveExtractedCV(cvData);
        console.log('CV saved to database:', savedCV);
        
        // Get the CV ID from the response
        const cvId = savedCV.data?.cv?.cv_id || Date.now().toString();
        
        // Save CV content (parsed data) to database for AI service
        try {
          await candidateApi.saveCVContent(cvId, extractedData);
          console.log('CV content saved to database for AI service');
        } catch (contentError) {
          console.warn('Failed to save CV content, but CV file was saved:', contentError);
        }
        
        // Create resume object with saved CV data
        const resumeId = cvId;
        const candidateId = savedCV.data?.cv?.candidate_id;
        const newResume: Resume = {
          id: resumeId,
          cv_id: cvId,
          candidate_id: candidateId,
          full_name: extractedData.full_name || 'Unknown',
          email: extractedData.email || '',
          phone: extractedData.phone || '',
          address: extractedData.address || '',
          objective: extractedData.objective || '',
          file: file,
          extractedData: extractedData,
          uploadedAt: new Date(),
          matchingScore: 0,
          isCalculatingMatch: true,
          jobMatchScores: [],
          hasJobMatches: false
        };

        // Add to resumes list and save to localStorage
        const updatedResumes = [...resumes, newResume];
        setResumes(updatedResumes);
        localStorage.setItem('userResumes', JSON.stringify(updatedResumes));

        // Calculate AI match scores with all available jobs in background
        setTimeout(async () => {
          try {
            // Get candidate_id from the saved CV response
            const candidateId = savedCV.data?.cv?.candidate_id;
            
            if (candidateId) {
              console.log('Starting AI match calculation for candidate:', candidateId);
              await calculateAIMatchScoresForCV(cvId, candidateId);
            } else {
              console.warn('No candidate_id found in CV response');
            }
            
            // Update to stop loading state
            setResumes(prevResumes => {
              const updatedList = prevResumes.map(r => 
                r.id === resumeId ? { ...r, isCalculatingMatch: false } : r
              );
              localStorage.setItem('userResumes', JSON.stringify(updatedList));
              return updatedList;
            });
            
          } catch (error) {
            console.error('Failed to calculate AI match scores:', error);
            // Update to stop loading state even if calculation failed
            setResumes(prevResumes => {
              const updatedList = prevResumes.map(r => 
                r.id === resumeId ? { ...r, isCalculatingMatch: false } : r
              );
              localStorage.setItem('userResumes', JSON.stringify(updatedList));
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

  const ResumeCard = ({ resume }: { resume: Resume }) => (
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
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteResume(resume.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
        {resume.objective || 'No objective specified'}
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
          
          {/* Show best matching job if available */}
          {resume.bestMatchJob && (
            <p className="text-xs text-gray-500 truncate max-w-xs">
              Best for: {resume.bestMatchJob}
            </p>
          )}
          
          {/* Show job match count */}
          {resume.jobMatchScores && resume.jobMatchScores.length > 0 && (
            <p className="text-xs text-blue-600">
              {resume.jobMatchScores.length} job{resume.jobMatchScores.length > 1 ? 's' : ''} analyzed
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
            >
              View resume
            </button>
          )}

        </div>
      </div>
    </div>
  );

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

            {resumes.length === 0 && !isLoading ? (
              <div className="text-center text-gray-500">
                <p>No resumes uploaded yet. Upload your first CV below!</p>
                {availableJobs.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-2">
                    ⚠️ Note: Job matching may not be available. Please ensure your profile is complete.
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
                    PDF files max size 5MB each. Multiple files supported.
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
        resume={detailResume}
      />
    </>
  );
};

export default Resume;
