import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiMessageSquare, FiCheck, FiX, FiMoreHorizontal, FiPlus, FiChevronDown } from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import { BiWorld } from 'react-icons/bi';
import DashboardSidebar from './DashboardSidebar';
import hrApi from '../../services/hrApi';

interface CandidateDetails {
  application_id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  education: string;
  experience: string[];
  skills: string[];
  resumeUrl: string;
  gender: string;
  dateOfBirth: string;
  languages: string[];
  aboutMe: string;
  currentJob: {
    title: string;
    years: string;
  };
  professionalInfo: {
    aboutMe: string;
    experience: string;
    currentJob: {
      title: string;
      years: string;
    };
    education: string;
    skills: string[];
  };
  matchPercentage: number;
  // API fields
  candidate_name: string;
  candidate_email: string;
  phone_number: string;
  current_status: string;
  match_score: number;
  submitted_at: string;
  job_title: string;
  candidate_id: string;
  job_id: string;
}

const ApplicantDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'progress' | 'schedule'>('profile');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [relatedApplications, setRelatedApplications] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // API state management
  const [candidateDetails, setCandidateDetails] = useState<CandidateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interview scheduling state (for future implementation)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: '',
    interview_type: 'PHONE',
    location: '',
    notes: ''
  });



  // Fetch application details
  const fetchApplicationDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Debug authentication
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('Current user:', user ? JSON.parse(user) : null);
      console.log('Has token:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      console.log('Fetching application details for ID:', id);
      
      // Try alternative approach: get all applications and filter by ID
      let response;
      let apiData;
      
      try {
        // First try the direct API
        response = await hrApi.getApplicationById(id, true);
        console.log('Direct API Response:', response);
        
        if (response.success && response.data) {
          apiData = response.data;
        } else {
          throw new Error('Direct API failed');
        }
      } catch (directApiError) {
        console.log('Direct API failed, trying alternative approach:', directApiError);
        
        // Try getting all applications with pagination
        let allApplications = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore && page <= 5) { // Max 5 pages (500 records)
          try {
            const allApplicationsResponse = await hrApi.getApplications({ 
              limit: 100, 
              page: page 
            });
            
            if (allApplicationsResponse.success && allApplicationsResponse.data) {
              allApplications.push(...allApplicationsResponse.data);
              
              // Check if we found the application
              const foundApp = allApplicationsResponse.data.find((app: any) => app.application_id === id);
              if (foundApp) {
                apiData = foundApp;
                break;
              }
              
              // Check if there are more pages
              hasMore = allApplicationsResponse.data.length === 100;
              page++;
            } else {
              hasMore = false;
            }
          } catch (paginationError) {
            console.log(`Error fetching page ${page}:`, paginationError);
            hasMore = false;
          }
        }
        
        if (!apiData) {
          throw new Error('Application not found in applications list');
        }
      }
      
      if (apiData) {
        
        // Transform API data to match interface
        const transformedData: CandidateDetails = {
          application_id: apiData.application_id,
          fullName: apiData.candidate_name || 'Unknown Candidate',
          email: apiData.candidate_email || '',
          phone: apiData.phone_number || '',
          address: apiData.location || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiData.candidate_name || 'User')}&background=random`,
          education: apiData.education || 'No education information',
          experience: apiData.experience ? [apiData.experience] : [],
          skills: apiData.skills || [],
          resumeUrl: apiData.resume_url || '',
          gender: apiData.gender || '',
          dateOfBirth: apiData.date_of_birth || '',
          languages: apiData.languages || [],
          aboutMe: apiData.about_me || 'No additional information provided.',
          currentJob: {
            title: apiData.current_job_title || 'Not specified',
            years: apiData.years_experience || '0'
          },
          professionalInfo: {
            aboutMe: apiData.about_me || 'No additional information provided.',
            experience: apiData.experience || 'No experience information',
            currentJob: {
              title: apiData.current_job_title || 'Not specified',
              years: apiData.years_experience || '0'
            },
            education: apiData.education || 'No education information',
            skills: apiData.skills || []
          },
          matchPercentage: apiData.match_score ? Math.round(apiData.match_score) : 0,
          // Direct API fields
          candidate_name: apiData.candidate_name,
          candidate_email: apiData.candidate_email,
          phone_number: apiData.phone_number,
          current_status: apiData.current_status,
          match_score: apiData.match_score,
          submitted_at: apiData.submitted_at,
          job_title: apiData.job_title,
          candidate_id: apiData.candidate_id,
          job_id: apiData.job_id
        };
        
        setCandidateDetails(transformedData);
        
        // Fetch related applications for the same job
        if (apiData.job_id) {
          fetchRelatedApplications(apiData.job_id);
        }
      } else {
        setError('Failed to load application details');
      }
    } catch (err: any) {
      console.error('Error fetching application details:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      if (err.response?.status === 403) {
        setError('Access denied. You may not have permission to view this application.');
      } else if (err.response?.status === 404) {
        setError('Application not found.');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError(`Failed to load application details: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch related applications for the same job
  const fetchRelatedApplications = async (jobId: string) => {
    try {
      setLoadingRelated(true);
      const response = await hrApi.getApplicationsByJobId(jobId, {
        limit: 10,
        page: 1
      });
      
      const applicationsData = response.data || response || [];
      // Filter out current application
      const filtered = applicationsData.filter((app: any) => app.application_id !== id);
      setRelatedApplications(filtered);
    } catch (err: any) {
      console.error('Error fetching related applications:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);





  const handleRejectConfirm = async () => {
    if (!candidateDetails?.application_id || !rejectionReason.trim()) return;
    
    try {
      await hrApi.rejectCandidate(candidateDetails.application_id, rejectionReason.trim());
    setIsRejectModalOpen(false);
      setRejectionReason('');
      // Refresh data to show updated status
      fetchApplicationDetails();
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      alert('Failed to reject candidate. Please try again.');
    }
  };

  const handleAcceptCandidate = async () => {
    if (!candidateDetails?.application_id) return;
    
    try {
      await hrApi.shortlistCandidate(candidateDetails.application_id, 'Candidate approved for next stage');
      // Refresh data to show updated status
      fetchApplicationDetails();
    } catch (error) {
      console.error('Error accepting candidate:', error);
      alert('Failed to accept candidate. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-64 bg-white shadow-lg min-h-screen border-l border-r-0 border-gray-200 sticky top-0 z-10 flex flex-col overflow-y-auto">
        <DashboardSidebar activeTab="applicants" hasUnreadMessages={false} onNavigate={() => {}} isCollapsed={false} />
      </div>
      <div className="flex-1 flex flex-col overflow-visible bg-white">
        <main className="flex-1 p-8">
          <div style={{fontFamily:'ABeeZee, sans-serif'}}>
            {/* Back + Title */}
            <div className="flex justify-between items-center pb-6">
              <div className="flex items-center">
                <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 mr-4">
                  <FiArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-normal text-gray-800">Applicant Details</h1>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="bg-white border border-red-500 text-red-500 px-4 py-1 rounded-lg image.png flex items-center gap-2 hover:bg-red-50"
                >
                  <FiX /> Reject
                </button>
                <button 
                  onClick={handleAcceptCandidate}
                  className="bg-white border border-green-500 text-green-500 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-green-50"
                >
                  <FiCheck /> Accept
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-gray-500">Loading application details...</div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex justify-center items-center py-20">
                <div className="text-red-500">{error}</div>
              </div>
            )}

            {/* Content - only show when data is loaded */}
            {!loading && !error && candidateDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-6">
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-4 mb-6">
                  <img src={candidateDetails.avatar} alt={candidateDetails.fullName} className="w-24 h-24 rounded-full object-cover" />
                  <div className="h-24 flex flex-col justify-between text-left">
                    <h2 className="text-lg font-semibold text-gray-900">{candidateDetails.fullName}</h2>
                    <p className="text-sm text-gray-500">{candidateDetails.job_title || 'Job Position'}</p>
                    <p className="text-sm font-semibold">
                      <span className="text-gray-800">Match: </span>
                      <span className="text-green-500">{candidateDetails.matchPercentage}%</span>
                    </p>
                  </div>
                </div>

                {/* Applied Job Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Applied Job</span>
                    <span>{new Date(candidateDetails.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="h-px bg-gray-200 mb-2" />
                  <h3 className="font-semibold text-gray-800 text-sm">{candidateDetails.job_title || 'Job Position'}</h3>
                  <p className="text-xs text-gray-500">{candidateDetails.current_status ? candidateDetails.current_status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Applied'}</p>
                </div>

                {/* Stage Progress */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Stage</span>
                    <span className="text-[#007BFF]">{candidateDetails.current_status ? candidateDetails.current_status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Applied'}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, idx) => {
                      const getStageProgress = (status: string) => {
                        switch (status) {
                          case 'SUBMITTED': return 1;
                          case 'REVIEWING': return 2;
                          case 'SHORTLISTED': return 3;
                          case 'INTERVIEWED': return 4;
                          case 'OFFERED': case 'HIRED': return 5;
                          default: return 1;
                        }
                      };
                      const progress = getStageProgress(candidateDetails.current_status || 'SUBMITTED');
                      return (
                        <div
                          key={idx}
                          className={`flex-1 h-2 rounded-full ${idx < progress ? 'bg-[#007BFF]' : 'bg-gray-200'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Schedule Interview */}
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 text-[#007BFF] border border-[#007BFF] rounded-lg text-sm font-semibold hover:bg-blue-50">Schedule Interview</button>
                  <button className="p-2 border border-[#007BFF] rounded-lg hover:bg-blue-50">
                    <FiMessageSquare className="h-5 w-5 text-[#007BFF]" />
                  </button>
                </div>

                {/* Contact */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h4 className="text-gray-800 font-semibold mb-4 text-left">Contact</h4>
                  <div className="space-y-4 text-sm">
                    {/* Email */}
                    <div className="flex items-start gap-3 text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007BFF] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="text-gray-900">{candidateDetails.email}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3 text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007BFF] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="text-gray-900">{candidateDetails.phone}</p>
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="flex items-start gap-3 text-left">
                      <FaInstagram className="h-5 w-5 text-[#007BFF] mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Instagram</p>
                        <a href="https://instagram.com/jeromebell" target="_blank" rel="noopener noreferrer" className="text-[#007BFF] hover:underline">instagram.com/jeromebell</a>
                      </div>
                    </div>

                    {/* Twitter */}
                    <div className="flex items-start gap-3 text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007BFF] mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.564-2.005.974-3.127 1.195-.896-.954-2.173-1.55-3.591-1.55-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.247-2.228-.616v.06c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.419-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.022-1.17-.065 2.189 1.402 4.768 2.22 7.557 2.22 9.054 0 14.002-7.496 14.002-13.986 0-.21 0-.423-.015-.636.961-.694 1.8-1.562 2.46-2.549z" />
                      </svg>
                      <div>
                        <p className="text-gray-500 text-xs">Twitter</p>
                        <a href="https://twitter.com/jeromebell" target="_blank" rel="noopener noreferrer" className="text-[#007BFF] hover:underline">twitter.com/jeromebell</a>
                      </div>
                    </div>

                    {/* Website */}
                    <div className="flex items-start gap-3 text-left">
                      <BiWorld className="h-5 w-5 text-[#007BFF] mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Website</p>
                        <a href="https://www.jeromebell.com" target="_blank" rel="noopener noreferrer" className="text-[#007BFF] hover:underline">www.jeromebell.com</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
                {/* Tabs */}
                <div className="flex gap-6 border-b mb-6">
                  {[
                    {key:'profile',label:'Applicant Profile'},
                    {key:'resume',label:'Resume'},
                    {key:'progress',label:'Hiring Progress'},
                    {key:'schedule',label:'Interview Schedule'},
                  ].map(t => (
                    <button 
                      key={t.key} 
                      className={`relative pb-3 text-sm font-medium ${activeTab===t.key ? 'text-blue-600' : 'text-gray-600'}`} 
                      onClick={()=>setActiveTab(t.key as any)}
                    >
                      {t.label}
                      {activeTab===t.key && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"/>}
                    </button>
                  ))}
                </div>

                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    {/* Personal Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Personal Info</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-left">
                        <div>
                          <p className="text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-900">{candidateDetails.fullName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Gender</p>
                          <p className="font-medium text-gray-900">{candidateDetails.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date of Birth</p>
                          <p className="font-medium text-gray-900">{candidateDetails.dateOfBirth} (26 y.o)</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Language</p>
                          <p className="font-medium text-gray-900">{candidateDetails.languages.join(', ')}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{candidateDetails.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Professional Info</h3>
                      <div className="space-y-6 text-left">
                        <div>
                          <p className="text-gray-500">About Me</p>
                          <p className="mt-1 text-gray-900">{candidateDetails.professionalInfo.aboutMe}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Experience</p>
                          <p className="mt-1 text-gray-900">{candidateDetails.professionalInfo.experience}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-gray-500">Current Job</p>
                            <p className="mt-1 text-gray-900">{candidateDetails.currentJob.title}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Experience in Years</p>
                            <p className="mt-1 text-gray-900">{candidateDetails.currentJob.years}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-gray-500">Highest Qualification Held</p>
                            <p className="mt-1 text-gray-900">{candidateDetails.education}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Skill set</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {candidateDetails.skills.map((skill, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-50 text-[#007BFF] rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'resume' && (
                  <div className="p-6 bg-white rounded-lg shadow-md text-left border border-gray-300">
                    {candidateDetails.resumeUrl ? (
                      // If resume URL exists, show iframe or download link
                      <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
                        <iframe 
                          src={candidateDetails.resumeUrl} 
                          className="w-full h-full"
                          title="Resume"
                        />
                      </div>
                    ) : (
                      // Show parsed candidate information
                      <div className="grid grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="col-span-2">
                          <h2 className="text-4xl font-bold">{candidateDetails.fullName}</h2>
                          <p className="text-xl text-gray-600 mb-6">{candidateDetails.currentJob.title}</p>

                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Experience</h3>
                          <div className="space-y-6">
                            {candidateDetails.experience.length > 0 ? (
                              candidateDetails.experience.map((exp, index) => (
                                <div key={index}>
                                  <p className="font-semibold">{exp}</p>
                                  <p className="text-gray-600">{candidateDetails.currentJob.years} experience</p>
                                </div>
                              ))
                            ) : (
                              <div>
                                <p className="font-semibold">{candidateDetails.currentJob.title}</p>
                                <p className="text-gray-600">{candidateDetails.currentJob.years} experience</p>
                                <p className="mt-2">{candidateDetails.professionalInfo.experience}</p>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-8 mb-4">Education</h3>
                          <div className="space-y-4">
                            <div>
                              <p className="font-semibold">{candidateDetails.education || 'Education not specified'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div>
                          <img src={candidateDetails.avatar} alt={candidateDetails.fullName} className="w-24 h-24 rounded-full mb-4" />
                          <div>
                            <p>{candidateDetails.email}</p>
                            <p>{candidateDetails.phone}</p>
                            <p>{candidateDetails.address || 'Address not provided'}</p>
                          </div>
                          <div className="mt-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Skills</h3>
                            {candidateDetails.skills.length > 0 ? (
                              candidateDetails.skills.map((skill, index) => (
                                <p key={index}>{skill}</p>
                              ))
                            ) : (
                              <p>No skills listed</p>
                            )}

                            {candidateDetails.languages.length > 0 && (
                              <>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4">Languages</h3>
                                {candidateDetails.languages.map((lang, index) => (
                                  <p key={index}>{lang}</p>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'progress' && (
                  <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">Current Stage</h3>
                      <button className="flex items-center border border-gray-300 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-50" style={{ color: '#007BFF' }}>
                        <FiChevronDown className="mr-2" /> Give Rating
                      </button>
                    </div>
                    
                    <div className="flex items-center bg-gray-100 rounded-full p-1">
                      {['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'HIRED'].map((stage, index) => {
                        const isActive = candidateDetails.current_status === stage;
                        const isPassed = ['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'HIRED'].indexOf(candidateDetails.current_status || 'SUBMITTED') > index;
                        const stageLabels = ['Applied', 'In-Review', 'Shortlisted', 'Interview', 'Hired'];
                        
                        return (
                          <div 
                            key={stage}
                            className={`flex-1 py-2 text-center text-sm font-semibold rounded-full ${
                              isActive 
                                ? 'text-white shadow-md' 
                                : isPassed 
                                  ? 'text-[#007BFF]' 
                                  : 'text-gray-400'
                            }`}
                            style={{ 
                              backgroundColor: isActive ? '#007BFF' : 'transparent'
                            }}
                          >
                            {stageLabels[index]}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-300">
                      <h4 className="font-semibold mb-4 text-left">Application Info</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                        <div>
                          <p className="text-sm text-gray-500">Application Date</p>
                          <p>{new Date(candidateDetails.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Current Status</p>
                          <p className="font-semibold">
                            <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${
                              candidateDetails.current_status === 'SUBMITTED' ? 'bg-gray-100 text-gray-800' :
                              candidateDetails.current_status === 'REVIEWING' ? 'bg-yellow-100 text-yellow-800' :
                              candidateDetails.current_status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                              candidateDetails.current_status === 'INTERVIEWED' ? 'bg-purple-100 text-purple-800' :
                              candidateDetails.current_status === 'HIRED' ? 'bg-green-100 text-green-800' :
                              candidateDetails.current_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {candidateDetails.current_status ? candidateDetails.current_status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Applied'}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Match Score</p>
                          <p className="font-semibold text-green-600">{candidateDetails.matchPercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Job Position</p>
                          <p>{candidateDetails.job_title || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="text-left mt-6">
                        <button 
                          onClick={() => setIsScheduleModalOpen(true)}
                          className="border px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-semibold mr-4" 
                          style={{ borderColor: '#007BFF', color: '#007BFF' }}
                        >
                          Schedule Interview
                        </button>
                        <button 
                          onClick={handleAcceptCandidate}
                          className="border px-4 py-2 rounded-md hover:bg-green-50 text-sm font-semibold mr-4 border-green-500 text-green-600"
                        >
                          Move To Next Step
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-left">Notes</h4>
                        <button className="flex items-center text-sm font-semibold" style={{ color: '#007BFF' }}>
                          <FiPlus className="mr-1" /> Add Notes
                        </button>
                      </div>
                      <div className="space-y-4 text-left">
                        <div className="p-4 border rounded-md">
                          <div className="flex items-start">
                            <img src="https://i.pravatar.cc/50?u=maria" alt="Maria Kelly" className="w-10 h-10 rounded-full mr-4" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold">Maria Kelly</p>
                                <p className="text-xs text-gray-500">10 July, 2021 • 11:30 AM</p>
                              </div>
                              <p className="text-sm mt-1">Please, do an interview stage immediately. The design division needs more new employee now</p>
                              <button className="text-sm font-semibold mt-2" style={{ color: '#007BFF' }}>2 Replies</button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-md">
                          <div className="flex items-start">
                            <img src="https://i.pravatar.cc/50?u=maria" alt="Maria Kelly" className="w-10 h-10 rounded-full mr-4" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold">Maria Kelly</p>
                                <p className="text-xs text-gray-500">10 July, 2021 • 10:30 AM</p>
                              </div>
                              <p className="text-sm mt-1">Please, do an interview stage immediately.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-300">
                    <div className="flex justify-between items-center mb-4 text-left">
                      <h3 className="text-lg font-semibold">Interview List</h3>
                      <button className="flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white rounded-lg"><FiPlus /> Add Schedule Interview</button>
                    </div>
                    <div className="space-y-4 text-left">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Tomorrow - 10 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=d" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Kathryn Murphy</p>
                              <p className="text-sm text-gray-500">Written Test</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:30 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">11 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=e" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Jenny Wilson</p>
                              <p className="text-sm text-gray-500">Written Test 2</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:00 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">12 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=f" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Thad Eddings</p>
                              <p className="text-sm text-gray-500">Skill Test</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:00 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">13 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=g" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Thad Eddings</p>
                              <p className="text-sm text-gray-500">Final Test</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:00 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Related Applications Section */}
            {candidateDetails?.job_id && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Other Applications for "{candidateDetails.job_title}"
                </h3>
                
                {loadingRelated ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF] mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading related applications...</p>
                  </div>
                ) : relatedApplications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No other applications for this job.</p>
                ) : (
                  <div className="space-y-3">
                    {relatedApplications.map((app: any) => (
                      <div 
                        key={app.application_id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/hr/job-applications/${app.application_id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {app.candidate_name ? app.candidate_name.charAt(0).toUpperCase() : 'C'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{app.candidate_name || 'Unknown Candidate'}</h4>
                            <p className="text-sm text-gray-500">{app.candidate_email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              app.current_status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                              app.current_status === 'INTERVIEWED' ? 'bg-blue-100 text-blue-600' :
                              app.current_status === 'SHORTLISTED' ? 'bg-green-100 text-green-600' :
                              app.current_status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {app.current_status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Match: {app.match_score || 0}%
                            </p>
                          </div>
                          <FiMoreHorizontal className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl relative text-left">
            <button
                onClick={() => setIsRejectModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Confirm Rejection</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to reject this applicant? This action cannot be undone.</p>
            <div className="mb-6">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection
              </label>
              <textarea
                id="rejectionReason"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl relative text-left">
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Schedule Interview</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_date"
                  value={scheduleData.scheduled_date}
                  onChange={(e) => setScheduleData({...scheduleData, scheduled_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="interview_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type
                </label>
                <select
                  id="interview_type"
                  value={scheduleData.interview_type}
                  onChange={(e) => setScheduleData({...scheduleData, interview_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PHONE">Phone Call</option>
                  <option value="VIDEO">Video Call</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Link
                </label>
                <input
                  type="text"
                  id="location"
                  value={scheduleData.location}
                  onChange={(e) => setScheduleData({...scheduleData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Meeting room or video call link"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Interview notes or instructions"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!candidateDetails?.application_id || !scheduleData.scheduled_date) return;
                  
                  try {
                    await hrApi.updateApplicationStatus(
                      candidateDetails.application_id, 
                      'INTERVIEWED', 
                      scheduleData.notes || 'Interview scheduled',
                      scheduleData.scheduled_date
                    );
                    setIsScheduleModalOpen(false);
                    setScheduleData({ scheduled_date: '', interview_type: 'PHONE', location: '', notes: '' });
                    fetchApplicationDetails(); // Refresh data
                  } catch (error) {
                    console.error('Error scheduling interview:', error);
                    alert('Failed to schedule interview. Please try again.');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDetail; 