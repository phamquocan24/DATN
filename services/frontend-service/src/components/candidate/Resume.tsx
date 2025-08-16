import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import { EnhanceResumeModal } from './EnhanceResumeModal';
import CVPreviewModal from './CVPreviewModal';
import ProfileSuggestionsModal from './ProfileSuggestionsModal';
import cvApi, { CVExtractResponse } from '../../services/cvApi';
// import matchingApi from '../../services/matchingApi'; // Removed - using real API instead
import candidateApi from '../../services/candidateApi';
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
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState<CVExtractResponse | null>(null);
  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesError] = useState<string | null>(null); // Removed unused setters
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

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
        setIsLoadingJobs(true);
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
      } finally {
        setIsLoadingJobs(false);
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

  const handleOpenSuggestionsModal = (data: CVExtractResponse) => {
    setSuggestionsData(data);
    setIsSuggestionsModalOpen(true);
  };

  const handleCloseSuggestionsModal = () => {
    setIsSuggestionsModalOpen(false);
    setSuggestionsData(null);
  };

  const handleSaveExtractedData = (editedData: CVExtractResponse) => {
    setExtractedInfo(editedData);
    setPreviewData(editedData);
    
    // Create new resume object after editing
    const resumeId = Date.now().toString();
    const newResume: Resume = {
      id: resumeId,
      full_name: editedData.full_name || 'Unknown',
      email: editedData.email || '',
      phone: editedData.phone || '',
      address: editedData.address || '',
      objective: editedData.objective || '',
      file: uploadedFile || undefined,
      extractedData: editedData,
      uploadedAt: new Date(),
      matchingScore: 0,
      isCalculatingMatch: true, // Start calculating match scores
      jobMatchScores: [],
      hasJobMatches: false
    };

    // Add to resumes list
    const updatedResumes = [...resumes, newResume];
    setResumes(updatedResumes);

    // Save to localStorage (in real app, save to backend)
    localStorage.setItem('userResumes', JSON.stringify(updatedResumes));

    console.log('CV saved successfully:', editedData);
    
    // Calculate match scores with available jobs in background
    if (availableJobs.length > 0) {
      setTimeout(async () => {
        try {
          const jobMatchScores = await calculateJobMatchScores(resumeId);
          const bestMatch = jobMatchScores.length > 0 ? jobMatchScores[0] : null;
          
          // Update resume with job match scores
          const updatedResumeWithMatches: Resume = {
            ...newResume,
            isCalculatingMatch: false,
            jobMatchScores: jobMatchScores,
            bestMatchScore: bestMatch?.match_score,
            bestMatchJob: bestMatch ? `${bestMatch.job_title} at ${bestMatch.company_name}` : undefined,
            hasJobMatches: jobMatchScores.length > 0 && jobMatchScores.some((score: MatchScore) => score.match_score > 0)
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
      }, 1000); // Small delay to let UI update first
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

  const handleApplySuggestedChanges = async (selectedFields: string[]) => {
    if (!suggestionsData) return;
    
    try {
      const updateData: any = {};
      
      // Map selected fields to API format
      selectedFields.forEach(field => {
        switch (field) {
          case 'full_name':
            updateData.full_name = suggestionsData.full_name;
            break;
          case 'phone':
            updateData.phone = suggestionsData.phone;
            break;
          case 'bio':
            updateData.bio = suggestionsData.objective;
            break;
          case 'current_job_title':
            if (suggestionsData.experience && suggestionsData.experience.length > 0) {
              const latestJob = suggestionsData.experience.sort((a, b) => 
                new Date(b.end_date || '9999-12-31').getTime() - new Date(a.end_date || '9999-12-31').getTime()
              )[0];
              updateData.current_job_title = latestJob.position;
            }
            break;
          case 'current_company':
            if (suggestionsData.experience && suggestionsData.experience.length > 0) {
              const latestJob = suggestionsData.experience.sort((a, b) => 
                new Date(b.end_date || '9999-12-31').getTime() - new Date(a.end_date || '9999-12-31').getTime()
              )[0];
              updateData.current_company = latestJob.company;
            }
            break;
          case 'education_level':
            if (suggestionsData.education && suggestionsData.education.length > 0) {
              const highestEducation = suggestionsData.education.reduce((highest, current) => {
                const educationLevels = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Doctorate'];
                const currentLevel = educationLevels.findIndex(level => 
                  current.degree.toLowerCase().includes(level.toLowerCase())
                );
                const highestLevel = educationLevels.findIndex(level => 
                  highest.degree.toLowerCase().includes(level.toLowerCase())
                );
                return currentLevel > highestLevel ? current : highest;
              });
              updateData.education_level = highestEducation.degree;
            }
            break;
          case 'years_experience':
            if (suggestionsData.experience && suggestionsData.experience.length > 0) {
              let totalMonths = 0;
              suggestionsData.experience.forEach(exp => {
                const startDate = new Date(exp.start_date);
                const endDate = exp.end_date && exp.end_date.toLowerCase() !== 'present' 
                  ? new Date(exp.end_date) 
                  : new Date();
                
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                (endDate.getMonth() - startDate.getMonth());
                  totalMonths += Math.max(0, months);
                }
              });
              updateData.years_experience = Math.round(totalMonths / 12);
            }
            break;
        }
      });
      
      console.log('Applying suggested changes:', updateData);
      const response = await candidateApi.updateProfile(updateData);
      console.log('Profile updated from suggestions:', response);
      
      // Show success message
      alert(`Successfully updated ${selectedFields.length} profile field${selectedFields.length > 1 ? 's' : ''}!`);
      
      // Close modals
      handleCloseSuggestionsModal();
      handleClosePreviewModal();
      
    } catch (error) {
      console.error('Failed to apply suggested changes:', error);
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
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      setUploadedFile(file);
      setError(null);
      // Automatically submit after a file is selected
      handleSubmit(file);
    } else {
      alert('Please select a PDF file under 10MB');
      setError('Please select a PDF file under 10MB');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      setUploadedFile(file);
       setError(null);
      // Automatically submit after a file is dropped
      handleSubmit(file);
    } else {
      alert('Please select a PDF file under 10MB');
      setError('Please select a PDF file under 10MB');
    }
  };

  // Function to calculate matching scores with available jobs
  const calculateJobMatchScores = async (_resumeId: string): Promise<MatchScore[]> => {
    if (availableJobs.length === 0) {
      console.warn('No available jobs to calculate match scores');
      return [];
    }

    const matchScores: MatchScore[] = [];
    
    // Calculate match score with top 5 jobs to avoid too many API calls
    const jobsToMatch = availableJobs.slice(0, 5);
    
    for (const job of jobsToMatch) {
      try {
        const response = await candidateApi.calculateMatchScore(job.id);
        
        if (response.success && response.data) {
          matchScores.push({
            job_id: job.id,
            job_title: job.title,
            company_name: job.company_name,
            match_score: response.data.match_score || 0,
            match_grade: response.data.match_grade || 'POOR',
            detailed_scores: response.data.detailed_scores
          });
        }
      } catch (error: any) {
        console.warn(`Failed to calculate match score for job ${job.id}:`, error);
        // Skip adding job if candidate profile not found
        if (error.response?.status === 403 || error.response?.data?.message?.includes('Candidate profile not found')) {
          console.warn('Skipping match calculation - candidate profile not found');
          continue;
        }
        // Add a default low score for other errors
        matchScores.push({
          job_id: job.id,
          job_title: job.title,
          company_name: job.company_name,
          match_score: 0,
          match_grade: 'POOR'
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

      // Show preview modal for editing
      setPreviewData(extractedData);
      setIsPreviewModalOpen(true);

      // Create CV text for matching
      const cvText = `
        Name: ${extractedData.full_name}
        Email: ${extractedData.email}
        Phone: ${extractedData.phone}
        Address: ${extractedData.address}
        Objective: ${extractedData.objective}
        Skills: ${extractedData.skills?.map(s => s.skill_name).join(', ') || ''}
        Education: ${extractedData.education?.map(e => `${e.degree} in ${e.field} from ${e.school}`).join(', ') || ''}
        Experience: ${extractedData.experience?.map(e => `${e.position} at ${e.company}: ${e.description}`).join(', ') || ''}
        Projects: ${extractedData.projects?.map(p => `${p.name}: ${p.description}`).join(', ') || ''}
        Certifications: ${extractedData.certifications?.map(c => c.name).join(', ') || ''}
        Languages: ${extractedData.languages?.map(l => `${l.language} (${l.proficiency})`).join(', ') || ''}
      `;

      console.log('CV Text for matching:', cvText);

      // Don't create resume immediately, wait for user to save from preview modal
      console.log('CV extracted successfully, showing preview modal');
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while processing the CV.';
      setError(errorMessage);
      console.error('CV Processing Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const ResumeCard = ({ resume }: { resume: Resume }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
            {resume.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{resume.full_name || 'Unknown'}</h3>
            <p className="text-sm text-gray-500">{resume.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[#007BFF] text-sm font-medium">
            {new Date(resume.uploadedAt).toLocaleDateString()}
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
              onClick={() => handleOpenEnhanceModal(resume)}
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
              onClick={() => handleOpenEnhanceModal(resume)}
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
                    PDF file max size 10MB
                  </p>
                </div>
              )}
               {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
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
        onSuggestProfileUpdates={handleOpenSuggestionsModal}
      />

      {/* Profile Suggestions Modal */}
      {suggestionsData && (
        <ProfileSuggestionsModal
          isOpen={isSuggestionsModalOpen}
          onClose={handleCloseSuggestionsModal}
          extractedData={suggestionsData}
          onApplyChanges={handleApplySuggestedChanges}
        />
      )}
    </>
  );
};

export default Resume;
