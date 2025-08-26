import React, { useState, useEffect } from 'react';
import { calculateAIMatchScore } from '../../services/aiMatchingApi';
import { useNavigate } from 'react-router-dom';

// Resume interface from Resume.tsx
interface Resume {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  objective?: string;
  skills?: string[];
  uploadedAt: Date;
  upload_date?: string;
  is_primary?: boolean;
  matchingJobsCount?: number;
}

interface CVDetailedModalProps {
  resume: Resume;
  onClose: () => void;
}

interface DetailedMatchScore {
  jobTitle: string;
  company: string;
  job_id?: string;
  overall_similarity: number;
  ky_nang_similarity: number;
  kinh_nghiem_similarity: number;
  hoc_van_similarity: number;
  mo_ta_ban_than_similarity: number;
}

const CVDetailedModal: React.FC<CVDetailedModalProps> = ({ resume, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'match'>('info');
  const [matchScores, setMatchScores] = useState<DetailedMatchScore[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const navigate = useNavigate();

  // Load match scores when modal opens
  useEffect(() => {
    if (activeTab === 'match') {
      loadMatchScores();
    }
  }, [activeTab, resume.id]);

  const loadMatchScores = async () => {
    setIsLoadingMatches(true);
    try {
      // Get available jobs (simplified - you might want to load from context or API)
      const jobsData = localStorage.getItem('availableJobs');
      const jobs = jobsData ? JSON.parse(jobsData) : [];
      
      if (jobs.length > 0) {
        // Shuffle jobs array and take 10 random jobs
        const shuffledJobs = [...jobs].sort(() => Math.random() - 0.5);
        const randomJobs = shuffledJobs.slice(0, Math.min(10, shuffledJobs.length));
        
        console.log('Loading match scores for CV:', resume.id, 'with random jobs:', randomJobs.slice(0, 5).map((j: any) => ({ id: j.job_id, title: j.title })));
        
        const scores = await Promise.all(
          randomJobs.map(async (job: any) => {
            try {
              // Use correct IDs: resume.id (CV ID) and job.job_id (Job UUID)
              const result = await calculateAIMatchScore(resume.id, job.job_id || job.id);
              console.log('Match result for job', job.title, ':', result);
              
              if (result.success && result.data) {
                return {
                  jobTitle: job.title,
                  company: job.company_name || job.company?.name || 'Unknown Company',
                  job_id: job.job_id || job.id,
                  overall_similarity: result.data.overall_score / 100, // Convert percentage to 0-1 scale
                  ky_nang_similarity: result.data.detailed_scores?.skills_similarity / 100 || 0,
                  kinh_nghiem_similarity: result.data.detailed_scores?.experience_similarity / 100 || 0,
                  hoc_van_similarity: result.data.detailed_scores?.education_similarity / 100 || 0,
                  mo_ta_ban_than_similarity: result.data.detailed_scores?.description_similarity / 100 || 0
                };
              } else {
                throw new Error(result.error || 'Failed to get match data');
              }
            } catch (error) {
              console.error(`Failed to calculate match score for job ${job.title}:`, error);
              return {
                jobTitle: job.title,
                company: job.company_name || job.company?.name || 'Unknown Company',
                job_id: job.job_id || job.id,
                overall_similarity: 0,
                ky_nang_similarity: 0,
                kinh_nghiem_similarity: 0,
                hoc_van_similarity: 0,
                mo_ta_ban_than_similarity: 0
              };
            }
          })
        );
        
        // Sort scores from high to low by overall similarity
        const sortedScores = scores.sort((a, b) => b.overall_similarity - a.overall_similarity);
        
        console.log('Final match scores (sorted):', sortedScores);
        setMatchScores(sortedScores);
      }
    } catch (error) {
      console.error('Failed to load match scores:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg font-semibold">
              {resume.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{resume.full_name}</h2>
              <p className="text-sm text-gray-600">{resume.email}</p>
              {resume.is_primary && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Primary CV
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>CV Information</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('match')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'match'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                </svg>
                <span>Match Analysis</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium">{resume.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{resume.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{resume.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{resume.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Professional Summary
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Objective</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">
                        {resume.objective || 'No objective specified'}
                        {resume.matchingJobsCount !== undefined && (
                          <span className="block mt-2 text-blue-600 font-medium">
                            Matching {resume.matchingJobsCount} job{resume.matchingJobsCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Upload Date</p>
                      <p className="font-medium text-sm">{resume.upload_date}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {resume.skills && resume.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                    Skills ({resume.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'match' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Match Analysis with Jobs</h3>
                <button
                  onClick={loadMatchScores}
                  disabled={isLoadingMatches}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMatches ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    'Refresh Analysis'
                  )}
                </button>
              </div>

              {isLoadingMatches ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-gray-600">Calculating match scores...</p>
                </div>
              ) : matchScores.length > 0 ? (
                <div className="space-y-4">
                  {matchScores.map((score, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                      onClick={() => {
                        if (score.job_id) {
                          navigate(`/candidate/job-detail/${score.job_id}`);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-800 font-semibold text-sm px-2 py-1 rounded-full min-w-[24px] text-center">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{score.jobTitle}</h4>
                            <p className="text-sm text-gray-600">{score.company}</p>
                          </div>
                        </div>
                        <div className={`font-semibold rounded-full px-2 py-1 text-xs ${
                          score.overall_similarity >= 0.8 ? 'text-green-600 bg-green-100' :
                          score.overall_similarity >= 0.7 ? 'text-blue-600 bg-blue-100' :
                          score.overall_similarity >= 0.6 ? 'text-yellow-600 bg-yellow-100' :
                          score.overall_similarity >= 0.5 ? 'text-orange-600 bg-orange-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {Math.round(score.overall_similarity * 100)}%
                        </div>
                      </div>
                      
                      {/* Detailed Scores */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Skills</p>
                          <p className="font-medium text-blue-600">{Math.round(score.ky_nang_similarity * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Experience</p>
                          <p className="font-medium text-green-600">{Math.round(score.kinh_nghiem_similarity * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Education</p>
                          <p className="font-medium text-purple-600">{Math.round(score.hoc_van_similarity * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Description</p>
                          <p className="font-medium text-orange-600">{Math.round(score.mo_ta_ban_than_similarity * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600">No match analysis available</p>
                  <p className="text-sm text-gray-500 mt-1">Click "Refresh Analysis" to calculate match scores with available jobs</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVDetailedModal;
