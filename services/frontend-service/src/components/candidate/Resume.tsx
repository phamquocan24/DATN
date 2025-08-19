import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import { EnhanceResumeModal } from './EnhanceResumeModal';
import CVPreviewModal from './CVPreviewModal';
<<<<<<< HEAD
import CVDetailModal from './CVDetailModal';
=======
import MatchScoreDisplay from './MatchScoreDisplay';
import CVDetailedModal from './CVDetailedModal';
>>>>>>> 3b2191a10c95847661a38073210137d1649fef30

import cvApi, { CVExtractResponse } from '../../services/cvApi';
// Removed matchingApi import - using aiMatchingApi instead
import candidateApi from '../../services/candidateApi';
import { batchCalculateAIMatchScores } from '../../services/aiMatchingApi';
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
  full_name: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  file?: File;
  extractedData?: CVExtractResponse;
  uploadedAt: Date;
  is_primary?: boolean; // CV chính
  matchingScore?: number; // Điểm matching với JD mẫu (deprecated)
  isCalculatingMatch?: boolean; // Loading state cho matching
  jobMatchScores?: MatchScore[]; // Match scores với các jobs hiện có
  bestMatchScore?: number; // Điểm match cao nhất
  bestMatchJob?: string; // Tên job có điểm match cao nhất
  hasJobMatches?: boolean; // Có match scores với jobs không
  totalJobsAnalyzed?: number; // Tổng số jobs đã phân tích
  matchingJobsCount?: number; // Số jobs có match score > 0%
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
  
  // State for detailed CV modal
  const [isDetailedModalOpen, setIsDetailedModalOpen] = useState(false);
  const [selectedCVDetails, setSelectedCVDetails] = useState<Resume | null>(null);

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
    if (window.confirm('Are you sure you want to delete this CV?')) {
      const updatedResumes = resumes.filter(resume => resume.id !== resumeId);
      setResumes(updatedResumes);
      
      // Update localStorage
      localStorage.setItem('userResumes', JSON.stringify(updatedResumes));
      
      // Reset file upload state to allow new uploads
      setUploadedFile(null);
      setError(null);
      setExtractedInfo(null);
      setIsLoading(false);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Close dropdown
      setOpenDropdownId(null);
      
      console.log('Resume deleted and upload state reset:', resumeId);
    }
  };

  // Function to set CV as primary
  const handleSetPrimaryCV = async (resumeId: string) => {
    try {
      console.log('Setting CV as primary:', resumeId);
      await candidateApi.setPrimaryCV(resumeId);
      
      // Update resumes state - set only the selected CV as primary
      setResumes(prevResumes => {
        const updatedList = prevResumes.map(resume => ({
          ...resume,
          is_primary: resume.id === resumeId
        }));
        
        // Update localStorage with updated list
        localStorage.setItem('userResumes', JSON.stringify(updatedList));
        return updatedList;
      });
      
      setOpenDropdownId(null);
      console.log(`CV ${resumeId} set as primary successfully`);
    } catch (error: any) {
      console.error('Failed to set primary CV:', error);
      setError(`Failed to set CV as primary: ${error.message || 'Please try again.'}`);
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

  // Simple text-based matching fallback function
  const calculateSimpleTextMatch = async (cvText: string, jobDescription: string): Promise<{
    success: boolean;
    data?: {
      match_score: number;
    };
    error?: string;
  }> => {
    try {
      // Simple keyword matching algorithm
      const cvWords = cvText.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      const jobWords = jobDescription.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      
      const commonWords = cvWords.filter(word => jobWords.includes(word));
      const uniqueCommonWords = [...new Set(commonWords)];
      
      // Calculate match score based on common words
      const totalUniqueWords = new Set([...cvWords, ...jobWords]).size;
      const matchScore = Math.min((uniqueCommonWords.length / totalUniqueWords) * 200, 100);
      

      
              return {
          success: true,
          data: {
            match_score: matchScore
          }
        };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to calculate simple text match'
      };
    }
  };

  // Function to calculate matching scores with available jobs using AI service directly
  const calculateJobMatchScores = async (resumeId: string, limitJobs = false): Promise<MatchScore[]> => {
    if (availableJobs.length === 0) {
      console.warn('No available jobs to calculate match scores');
      return [];
    }

    const matchScores: MatchScore[] = [];
    
    // Get the resume data
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume?.extractedData) {
      console.warn('No extracted CV data found for matching');
      return [];
    }

    // Calculate match score with limited jobs (for quick preview) or all jobs (for comprehensive analysis)
    const jobsToMatch = limitJobs ? availableJobs.slice(0, 5) : availableJobs;
    console.log(`Analyzing ${jobsToMatch.length} jobs for ${limitJobs ? 'quick preview' : 'comprehensive analysis'}`);


    
    // Check if we have a valid CV ID from database (UUID format)
    const cvId = resume.id;
    const isValidUUID = cvId && cvId.length >= 32; // Basic UUID length check
    
    if (isValidUUID) {
      try {
        console.log('Using AI service direct CV-Job matching with database IDs');
        
        // Extract job IDs for batch calculation
        const jobIds = jobsToMatch.map(job => job.id);
        
        // Use batch AI matching for better performance
        const batchResult = await batchCalculateAIMatchScores(cvId, jobIds);
        
        if (batchResult.success && batchResult.data) {
          batchResult.data.forEach((result, index) => {
            const job = jobsToMatch[index];
            matchScores.push({
              job_id: result.job_id,
              job_title: job.title,
              company_name: job.company_name,
              match_score: result.match_score,
              detailed_scores: {
                skill_match: result.match_score * 0.9, // AI provides more accurate skill matching
                experience_match: result.match_score * 0.85,
                education_match: result.match_score * 0.8,
                location_match: 50, // Default location match
                salary_match: 60 // Default salary match
              }
            });
          });
          
          console.log(`AI service calculated ${matchScores.length} match scores successfully`);
          return matchScores.sort((a, b) => b.match_score - a.match_score);
        }
      } catch (aiError) {
        console.warn('AI service matching failed, falling back to text-based matching:', aiError);
      }
    }
    
    // Fallback to text-based matching if AI service fails or CV not in database
    console.log('Using fallback text-based matching');

    // Create CV text for matching
    const cvText = `
      Name: ${resume.extractedData.full_name}
      Email: ${resume.extractedData.email}
      Phone: ${resume.extractedData.phone}
      Address: ${resume.extractedData.address}
      Objective: ${resume.extractedData.objective}
      Skills: ${resume.extractedData.skills?.map(s => s.skill_name).join(', ') || ''}
      Education: ${resume.extractedData.education?.map(e => `${e.degree} in ${e.field} from ${e.school}`).join(', ') || ''}
      Experience: ${resume.extractedData.experience?.map(e => `${e.position} at ${e.company}: ${e.description}`).join(', ') || ''}
      Projects: ${resume.extractedData.projects?.map(p => `${p.name}: ${p.description}`).join(', ') || ''}
      Certifications: ${resume.extractedData.certifications?.map(c => c.name).join(', ') || ''}
      Languages: ${resume.extractedData.languages?.map(l => `${l.language} (${l.proficiency})`).join(', ') || ''}
    `;
    
    for (const job of jobsToMatch) {
      try {
        // Create job description text
        const jobDescription = `
          Title: ${job.title}
          Company: ${job.company_name}
          Location: ${job.location || 'Not specified'}
          Employment Type: ${job.employment_type || 'Not specified'}
          Salary: ${job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}` : 'Not specified'}
        `;
        
        // Use simple text-based matching as fallback
        const response = await calculateSimpleTextMatch(cvText, jobDescription);
        
        if (response.success && response.data) {
          matchScores.push({
            job_id: job.id,
            job_title: job.title,
            company_name: job.company_name,
            match_score: response.data.match_score || 0,
            detailed_scores: {
              skill_match: response.data.match_score * 0.8,
              experience_match: response.data.match_score * 0.9,
              education_match: response.data.match_score * 0.7,
              location_match: 50,
              salary_match: 60
            }
          });
        }
      } catch (error: any) {
        console.warn(`Failed to calculate match score for job ${job.id}:`, error);
        
        // Add a default low score for errors
        matchScores.push({
          job_id: job.id,
          job_title: job.title,
          company_name: job.company_name,
          match_score: 0
        });
      }
    }
    
    // Sort by match score descending
    return matchScores.sort((a, b) => b.match_score - a.match_score);
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
        const newResume: Resume = {
          id: resumeId,
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

        // Calculate match scores with ALL available jobs in background
        if (availableJobs.length > 0) {
          setTimeout(async () => {
            try {
              // Calculate match scores for ALL jobs (not limited)
              const jobMatchScores = await calculateJobMatchScores(resumeId, false);
              const bestMatch = jobMatchScores.length > 0 ? jobMatchScores[0] : null;
              
              // Count jobs with match score > 0%
              const matchingJobsCount = jobMatchScores.filter((score: MatchScore) => score.match_score > 0).length;
              
              // Update resume with job match scores
              const updatedResumeWithMatches: Resume = {
                ...newResume,
                isCalculatingMatch: false,
                jobMatchScores: jobMatchScores,
                bestMatchScore: bestMatch?.match_score,
                bestMatchJob: bestMatch ? `${bestMatch.job_title} at ${bestMatch.company_name}` : undefined,
                hasJobMatches: jobMatchScores.length > 0 && jobMatchScores.some((score: MatchScore) => score.match_score > 0),
                totalJobsAnalyzed: availableJobs.length,
                matchingJobsCount: matchingJobsCount
              };
              
              // Update resumes list
              setResumes(prevResumes => {
                const updatedList = prevResumes.map(r => 
                  r.id === resumeId ? updatedResumeWithMatches : r
                );
                localStorage.setItem('userResumes', JSON.stringify(updatedList));
                return updatedList;
              });
              
              console.log('Job match scores calculated:', jobMatchScores);
            } catch (error) {
              console.error('Failed to calculate job match scores:', error);
              // Update to stop loading state even if calculation failed
              setResumes(prevResumes => {
                const updatedList = prevResumes.map(r => 
                  r.id === resumeId ? { ...r, isCalculatingMatch: false } : r
                );
                localStorage.setItem('userResumes', JSON.stringify(updatedList));
                return updatedList;
              });
            }
          }, 1000);
        } else {
          // No jobs available, stop calculating
          setResumes(prevResumes => {
            const updatedList = prevResumes.map(r => 
              r.id === resumeId ? { ...r, isCalculatingMatch: false } : r
            );
            localStorage.setItem('userResumes', JSON.stringify(updatedList));
            return updatedList;
          });
        }

        // Show preview modal for viewing (but data is already saved)
      setPreviewData(extractedData);
      setIsPreviewModalOpen(true);

        // Reset upload state to allow new uploads after successful save
        setTimeout(() => {
          setUploadedFile(null);
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        }, 2000); // Reset after 2 seconds to show success state briefly

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

  // Function to handle CV card click
  const handleCardClick = (resume: Resume) => {
    setSelectedCVDetails(resume);
    setIsDetailedModalOpen(true);
  };

  const ResumeCard = ({ resume }: { resume: Resume }) => (
    <div 
<<<<<<< HEAD
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group text-left cursor-pointer hover:shadow-md"
      onClick={() => handleOpenDetailModal(resume)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
=======
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group text-left cursor-pointer transform"
      onClick={() => handleCardClick(resume)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium relative flex-shrink-0">
>>>>>>> 3b2191a10c95847661a38073210137d1649fef30
            {resume.full_name.charAt(0).toUpperCase()}
            {resume.is_primary && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
          </div>
<<<<<<< HEAD
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{resume.full_name || 'Unknown'}</h3>
=======
            )}
          </div>
          <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 truncate">{resume.full_name || 'Unknown'}</h3>
              {resume.is_primary && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium flex-shrink-0">
                  Primary
                </span>
              )}
            </div>
>>>>>>> 3b2191a10c95847661a38073210137d1649fef30
            <p className="text-sm text-gray-500 truncate">{resume.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
<<<<<<< HEAD
          <span className="text-[#007BFF] text-xs font-medium whitespace-nowrap">
            {new Date(resume.uploadedAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
=======
          <span className="text-[#007BFF] text-xs font-medium whitespace-nowrap max-w-[80px] truncate">
            {new Date(resume.uploadedAt).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: '2-digit' 
>>>>>>> 3b2191a10c95847661a38073210137d1649fef30
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
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                {!resume.is_primary && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      console.log('Attempting to set CV as primary:', resume.id);
                      await handleSetPrimaryCV(resume.id);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Set as Primary
                  </button>
                )}
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
        {resume.objective || (
          resume.matchingJobsCount !== undefined 
            ? `${resume.matchingJobsCount} job${resume.matchingJobsCount !== 1 ? 's' : ''}`
            : `Ready to analyze ${availableJobs.length} available job${availableJobs.length !== 1 ? 's' : ''}`
        )}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            {resume.isCalculatingMatch ? (
              <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600 animate-pulse">
                🔄 Calculating job matches...
              </span>
            ) : resume.hasJobMatches && resume.bestMatchScore !== undefined ? (
              <MatchScoreDisplay 
                score={resume.bestMatchScore} 
                size="small"
              />
            ) : resume.matchingScore !== undefined ? (
              <MatchScoreDisplay 
                score={resume.matchingScore} 
                size="small"
              />
            ) : (
              <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600">
                {availableJobs.length === 0 ? '⚠️ Profile setup needed' : '📊 No matches calculated'}
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

<<<<<<< HEAD
      {/* CV Detail Modal */}
      <CVDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        resume={detailResume}
      />
=======
      {/* Detailed CV Modal */}
      {isDetailedModalOpen && selectedCVDetails && (
        <CVDetailedModal
          resume={selectedCVDetails}
          onClose={() => {
            setIsDetailedModalOpen(false);
            setSelectedCVDetails(null);
          }}
        />
      )}
>>>>>>> 3b2191a10c95847661a38073210137d1649fef30
    </>
  );
};

export default Resume;
