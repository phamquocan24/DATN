import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheckCircle, FiBookmark, FiArrowRight, FiShare2, FiEye } from 'react-icons/fi';
import JobApplication from './JobApplication';
import candidateApi from '../../services/candidateApi';
import { isTokenValid } from '../../services/tokenUtils';
import { batchCalculateAIMatchScores } from '../../services/aiMatchingApi';
import bookmarkCache from '../../services/bookmarkCache';
import work1 from '../../assets/work1.png';
import work2 from '../../assets/work2.png';
import work3 from '../../assets/work3.png';

interface Job {
  job_id: string; // Primary ID (UUID from database)
  id?: number;    // Fallback for legacy data
  company_id?: string; // Company ID for API calls
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  logo: string;
  logoColor: string;
  match: number;
  applied: number;
  capacity: number;
  salary?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  whoYouAre?: string[];
  niceToHaves?: string[];
  view_count?: number; // View count from database
  // AI Matching fields
  aiMatchScore?: number;
  matchGrade?: string;
  isCalculatingMatch?: boolean;
}



interface JobDetailProps {
  job: Job;
  onBack: () => void;
  onJobClick?: (jobId: string) => void;
  onCompanyClick?: (companyId: string) => void;
  onResumeClick?: () => void;
  applicationStatus?: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEWING' | 'TESTING' | 'OFFERED' | 'HIRED' | 'REJECTED';
}

const JobDetail: React.FC<JobDetailProps> = ({ job, onBack, onJobClick, onCompanyClick, onResumeClick, applicationStatus: initialStatus }) => {
    const [isApplicationOpen, setIsApplicationOpen] = useState(false);
    

    const [isFavorited, setIsFavorited] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<string | undefined>(initialStatus);
    const [checkingApplication, setCheckingApplication] = useState(false);
    const [companyData, setCompanyData] = useState<any>(null);
    const [similarJobs, setSimilarJobs] = useState<any[]>([]);
    const [showShareToast, setShowShareToast] = useState(false);
    const [viewCount, setViewCount] = useState<number>(0);
    
    // AI Matching states
    const [aiMatchScore, setAiMatchScore] = useState<number | null>(null);
    const [isCalculatingMatch, setIsCalculatingMatch] = useState(false);
    const [selectedCVId, setSelectedCVId] = useState<string | null>(null);



    // Load selected CV from localStorage
    const loadSelectedCV = () => {
        try {
            const selectedCV = localStorage.getItem('selectedCVForMatching');
            if (selectedCV) {
                const cvData = JSON.parse(selectedCV);
                setSelectedCVId(cvData.cv_id);
                console.log('Loaded selected CV for matching:', cvData.full_name);
            }
        } catch (error) {
            console.error('Error loading selected CV:', error);
        }
    };

    // Calculate AI match score for this specific job
    const calculateAIMatchScore = async (cvId: string) => {
        if (!cvId || !job.job_id) return;

        console.log(`Calculating AI match score for job ${job.job_id} with CV: ${cvId}`);

        try {
            setIsCalculatingMatch(true);

            // Calculate match score for this job
            const batchResult = await batchCalculateAIMatchScores(cvId, [job.job_id]);
            
            if (batchResult.success && batchResult.data && batchResult.data.length > 0) {
                const matchResult = batchResult.data[0];
                
                if (matchResult && !matchResult.error) {
                    const score = matchResult.match_score;
                    setAiMatchScore(score);
                    console.log(`Successfully calculated match score: ${score}%`);
                } else {
                    console.error('Match calculation error:', matchResult?.error);
                }
            }
        } catch (error) {
            console.error('Error calculating AI match score:', error);
        } finally {
            setIsCalculatingMatch(false);
        }
    };

    // Initialize view count from job data and increment it
    useEffect(() => {
        // Set initial view count from job data
        setViewCount(job.view_count || 0);

        // Increment view count when job detail is viewed
        const incrementViewCount = async () => {
            if (job.job_id) {
                const result = await candidateApi.incrementJobViewCount(job.job_id);
                if (result.success && result.data) {
                    setViewCount(result.data.view_count);
                }
            }
        };

        incrementViewCount();
    }, [job.job_id, job.view_count]);

    // Check if user has already applied for this job
    useEffect(() => {
        checkApplicationStatus();
        checkBookmarkStatus();
        loadSelectedCV(); // Load CV when component mounts
    }, [job.job_id, job.id]);

    // Calculate match score when CV is loaded
    useEffect(() => {
        if (selectedCVId) {
            calculateAIMatchScore(selectedCVId);
        }
    }, [selectedCVId]);

    // Listen for CV selection changes
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'triggerJobMatching' || e.key === 'selectedCVForMatching') {
                loadSelectedCV();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Listen for bookmark changes from other components
    useEffect(() => {
        const handleBookmarkChange = (event: CustomEvent) => {
            const { jobId: changedJobId, isBookmarked } = event.detail;
            const currentJobId = job.job_id || job.id?.toString();
            
            if (changedJobId === currentJobId) {
                setIsFavorited(isBookmarked);
                // Update cache
                if (currentJobId) {
                    bookmarkCache.setCache(currentJobId, isBookmarked);
                }
            }
        };

        window.addEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
        
        return () => {
            window.removeEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
        };
    }, [job.job_id, job.id]);

    // Fetch company data and similar jobs
    useEffect(() => {
        const fetchCompanyAndJobs = async () => {
            if (!job.company_id) return;

            try {
                // Fetch company data
                const companyResponse = await candidateApi.getCompanyById(job.company_id);
                const companyInfo = companyResponse.data || companyResponse;
                setCompanyData(companyInfo);

                // Fetch similar jobs from the same company
                const jobsResponse = await candidateApi.getCompanyJobs(job.company_id);
                const jobs = jobsResponse.data || jobsResponse;
                // Filter out current job and take first 4
                const filteredJobs = Array.isArray(jobs) 
                    ? jobs.filter((j: any) => j.job_id !== job.job_id).slice(0, 4)
                    : [];
                setSimilarJobs(filteredJobs);
            } catch (error) {
                console.error('Error fetching company data or similar jobs:', error);
            }
        };

        fetchCompanyAndJobs();
    }, [job.company_id, job.job_id]);

    const checkApplicationStatus = async () => {
        setCheckingApplication(true);
        try {
            const response = await candidateApi.getMyApplications();
            if (response.success && response.data) {
                const jobId = job.job_id || (job.id ? job.id.toString() : null);
                if (!jobId) {
                    console.error('No valid job ID found in job object:', job);
                    return;
                }
                const existingApplication = response.data.find((app: any) => 
                    app.job_id === jobId || app.job?.job_id === jobId
                );
                
                if (existingApplication) {
                    setApplicationStatus(existingApplication.current_status || existingApplication.status);
                }
            }
        } catch (error) {
            console.error('Error checking application status:', error);
            // Don't show error, just continue without status
        } finally {
            setCheckingApplication(false);
        }
    };

    const handleApplyClick = () => {
      setIsApplicationOpen(true);
    };
  
    const handleCloseApplication = () => {
      setIsApplicationOpen(false);
      // Recheck application status after closing (in case user applied)
      checkApplicationStatus();
    };

    // Check bookmark status
    const checkBookmarkStatus = async () => {
        try {
            const jobId = job.job_id || job.id?.toString();
            if (!jobId) return;

            const result = await bookmarkCache.getBookmarkStatus(jobId);
            setIsFavorited(result.isBookmarked);
            
            // Log cache usage for debugging
            console.log(`Bookmark ${jobId}: ${result.isBookmarked} (${result.fromCache ? 'cache' : 'API'})`);
        } catch (error) {
            console.error('Failed to check bookmark status:', error);
            setIsFavorited(false);
        }
    };

    const handleShareClick = async () => {
        try {
            // Generate the shareable link
            const shareUrl = `${window.location.origin}/candidate/job-detail/${job.job_id}`;
            console.log('Sharing job with URL:', shareUrl);
            
            // Try to use the modern Web Share API first (mobile-friendly)
            if (navigator.share) {
                console.log('Using Web Share API');
                await navigator.share({
                    title: `${job.title} at ${job.company}`,
                    text: `Check out this job opportunity: ${job.title} at ${job.company}`,
                    url: shareUrl
                });
            } else {
                console.log('Using Clipboard API fallback');
                // Fallback to clipboard API
                await navigator.clipboard.writeText(shareUrl);
                
                // Show success feedback
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 3000);
            }
        } catch (error) {
            console.error('Error sharing job:', error);
            
            // Ultimate fallback - try to copy to clipboard manually
            try {
                const textArea = document.createElement('textarea');
                textArea.value = `${window.location.origin}/candidate/job-detail/${job.job_id}`;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 3000);
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);
                alert('Unable to copy link. Please manually copy this URL: ' + `${window.location.origin}/candidate/job-detail/${job.job_id}`);
            }
        }
    };

    const handleFavoriteClick = async () => {
        try {
            const jobId = job.job_id || job.id?.toString();
            if (!jobId) {
                console.error('No job ID available for bookmark');
                return;
            }

            // Check authentication before making API call
            const token = localStorage.getItem('token');
            if (!token || !isTokenValid(token)) {
                alert('Bạn cần đăng nhập để sử dụng tính năng này');
                return;
            }

            if (isFavorited) {
                // Remove bookmark
                const response = await candidateApi.removeJobFromFavorites(jobId);
                            if (response.success) {
                setIsFavorited(false);
                // Update cache
                bookmarkCache.setCache(jobId, false);
                // Emit event to sync with other components
                window.dispatchEvent(new CustomEvent('bookmarkChanged', {
                    detail: { jobId, isBookmarked: false }
                }));
                } else if (response.requiresAuth) {
                    alert(response.message || 'Bạn cần đăng nhập để thực hiện thao tác này');
                }
            } else {
                // Add bookmark
                const response = await candidateApi.addJobToFavorites(jobId);
                if (response.success) {
                    setIsFavorited(true);
                    // Update cache
                    bookmarkCache.setCache(jobId, true);
                    // Emit event to sync with other components
                    window.dispatchEvent(new CustomEvent('bookmarkChanged', {
                        detail: { jobId, isBookmarked: true }
                    }));
                } else if (response.requiresAuth) {
                    alert(response.message || 'Bạn cần đăng nhập để lưu công việc này');
                }
            }
        } catch (error: any) {
            console.error('Failed to toggle bookmark:', error);
            alert('Có lỗi xảy ra khi thực hiện thao tác. Vui lòng thử lại.');
        }
    };



    const getStatusButtonStyle = (status?: string) => {
        switch (status) {
          case 'PENDING':
            return 'bg-yellow-100 text-yellow-700 border border-yellow-200 cursor-not-allowed';
          case 'REVIEWING':
            return 'bg-orange-100 text-orange-700 border border-orange-200 cursor-not-allowed';
          case 'SHORTLISTED':
            return 'bg-blue-100 text-blue-700 border border-blue-200 cursor-not-allowed';
          case 'INTERVIEWING':
            return 'bg-purple-100 text-purple-700 border border-purple-200 cursor-not-allowed';
          case 'TESTING':
            return 'bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-not-allowed';
          case 'OFFERED':
            return 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed';
          case 'HIRED':
            return 'bg-green-200 text-green-800 border border-green-300 cursor-not-allowed';
          case 'REJECTED':
            return 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed';
          default:
            return checkingApplication ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors';
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
          case 'PENDING':
            return 'Application Pending';
          case 'REVIEWING':
            return 'Under Review';
          case 'SHORTLISTED':
            return 'Shortlisted';
          case 'INTERVIEWING':
            return 'Interviewing';
          case 'TESTING':
            return 'Testing Phase';
          case 'OFFERED':
            return 'Offer Extended';
          case 'HIRED':
            return 'Hired';
          case 'REJECTED':
            return 'Application Rejected';
          default:
            return checkingApplication ? 'Checking...' : 'Apply';
        }
    };


    

    return (
        <>
            <div className="text-left mb-16">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                        <FiArrowLeft className="w-5 h-5" /> Back to job listings
                    </button>
                </div>

                {/* New Job Header */}
                <div className="border rounded-lg bg-white shadow-sm p-6 mb-8 transition-all duration-300 hover:shadow-lg hover:border-[#007BFF] cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center rounded-xl text-4xl font-bold`}>
                                {job.logo}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">{job.title}</h2>
                                <div className="flex items-center gap-3 text-gray-500 mt-2">
                                    <span>{job.company}</span>
                                    <span>&bull;</span>
                                    <span>{job.location}</span>
                                    <span>&bull;</span>
                                    <span>{job.type}</span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1.5">
                                        <FiEye /> 
                                        {viewCount > 0 ? (
                                            viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k seen` : `${viewCount} seen`
                                        ) : '0 seen'}
                                    </span>
                                    <span>&bull;</span>
                                    {isCalculatingMatch ? (
                                        <span className="flex items-center gap-1.5 text-gray-500">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Calculating Match...
                                        </span>
                                    ) : aiMatchScore !== null ? (
                                        <span className={`font-medium ${
                                            aiMatchScore >= 80 ? 'text-green-600' 
                                            : aiMatchScore >= 70 ? 'text-blue-600'
                                            : aiMatchScore >= 60 ? 'text-yellow-600'
                                            : aiMatchScore >= 50 ? 'text-orange-600'
                                            : 'text-red-600'
                                        }`}>
                                            Match: {aiMatchScore}%
                                        </span>
                                    ) : selectedCVId ? (
                                        <span className="text-gray-400">No match data</span>
                                    ) : (
                                        <span className="text-gray-400">Select CV to see match</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleShareClick}
                                className="p-3 text-gray-500 hover:text-[#007BFF] transition-colors"
                                title="Share this job"
                            >
                                <FiShare2 className="w-6 h-6" />
                            </button>
                            <button onClick={handleFavoriteClick} className={`p-3 transition-colors ${isFavorited ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}>
                                <FiBookmark className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                            </button>
                            <button 
                                onClick={applicationStatus || checkingApplication ? undefined : handleApplyClick}
                                disabled={!!applicationStatus || checkingApplication}
                                className={`px-8 py-3 rounded-lg text-lg ${getStatusButtonStyle(applicationStatus)}`}
                            >
                                {getStatusText(applicationStatus)}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <Section title="Description">
                            <div className="text-gray-600 leading-relaxed space-y-3">
                                {(job.description || "No description provided.").split('\n\n').map((paragraph, index) => (
                                    <p key={index} className="whitespace-pre-line">
                                        {paragraph.trim()}
                                    </p>
                                ))}
                            </div>
                        </Section>

                        <Section title="Responsibilities">
                            <ul className="space-y-2 list-inside">
                                {(job.whoYouAre || []).map((item, index) => <ListItem key={index}>{item}</ListItem>)}
                            </ul>
                        </Section>

                        <Section title="Requirements">
                            <ul className="space-y-2 list-inside">
                                {(job.requirements || []).map((item, index) => <ListItem key={index}>{item}</ListItem>)}
                            </ul>
                        </Section>

                        {job.benefits && job.benefits.length > 0 && (
                            <Section title="Benefits">
                                <ul className="space-y-2 list-inside">
                                    {job.benefits.map((item, index) => <ListItem key={index}>{item}</ListItem>)}
                                </ul>
                            </Section>
                        )}
                        
                        {job.niceToHaves && job.niceToHaves.length > 0 && (
                            <Section title="Nice-To-Haves">
                                <ul className="space-y-2 list-inside">
                                    {job.niceToHaves.map((item, index) => <ListItem key={index}>{item}</ListItem>)}
                                </ul>
                            </Section>
                        )}
                    </div>

                    {/* Right Column / Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <InfoCard title="About this role">
                            <div className="text-sm">
                                <p>{job.applied} applied <span className="text-gray-500">of {job.capacity} capacity</span></p>
                                <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                                    <div style={{width: `${(job.applied/job.capacity)*100}%`}} className="h-full bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <InfoRow label="Apply Before" value="July 31, 2021" />
                            <InfoRow label="Job Posted On" value="July 1, 2021" />
                            <InfoRow label="Job Type" value={job.type} />
                            <InfoRow label="Salary" value={job.salary || "$75k-$85k USD"} />
                        </InfoCard>
                        
                        <InfoCard title="Categories">
                            <div className="flex flex-wrap gap-2">
                                {job.tags.map(tag => <Pill key={tag} text={tag} />)}
                            </div>
                        </InfoCard>

                        <InfoCard title="Required Skills">
                            <div className="flex flex-wrap gap-2">
                                {['Project Management', 'Copywriting', 'English', 'Social Media Marketing', 'Copy Editing'].map(skill => (
                                    <span key={skill} className="px-3 py-1 bg-gray-100 text-[#007BFF] rounded-md text-sm font-medium">{skill}</span>
                                ))}
                            </div>
                        </InfoCard>
                    </div>
                </div>



                {/* About Company Section */}
                <div className="border-t border-gray-200 mt-8 pt-8">
                    <Section title={`About ${job.company}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-1 space-y-4">
                                <div className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl ${job.logoColor}`}>
                                    {companyData?.logo_url ? (
                                        <img src={companyData.logo_url} alt={`${job.company} Logo`} className="w-16 h-16 rounded-lg object-cover"/>
                                    ) : (
                                        job.logo
                                    )}
                                </div>

                                
                                {job.company_id && onCompanyClick && (
                                    <button 
                                        onClick={() => onCompanyClick(job.company_id!)}
                                        className="flex items-center gap-2 text-[#007BFF] font-medium hover:underline"
                                    >
                                       Read more about {job.company} <FiArrowRight />
                                    </button>
                                )}
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {companyData?.description || `${job.company} is a technology company that builds economic infrastructure for the internet. Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.`}
                                </p>
                                {companyData?.website && (
                                    <a 
                                        href={companyData.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[#007BFF] text-sm hover:underline"
                                    >
                                        Visit company website
                                    </a>
                                )}
                            </div>
                            <div className="lg:col-span-2 flex gap-4 h-80">
                                <div className="w-2/3">
                                    <img src={work1} alt="Office life 1" className="rounded-lg object-cover w-full h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"/>
                                </div>
                                <div className="w-1/3 flex flex-col gap-4">
                                    <img src={work2} alt="Office life 2" className="rounded-lg object-cover w-full h-full flex-1 min-h-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"/>
                                    <img src={work3} alt="Office life 3" className="rounded-lg object-cover w-full h-full flex-1 min-h-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"/>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Similar Jobs Section */}
                {similarJobs.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Similar Jobs</h3>

                            
                            {job.company_id && onCompanyClick && (
                                <button 
                                    onClick={() => onCompanyClick(job.company_id!)}
                                    className="text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline"
                                >
                                   Show all jobs <FiArrowRight/>
                               </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {similarJobs.map((sJob: any) => (
                                <SimilarJobCard 
                                    key={sJob.job_id || sJob.id} 
                                    job={sJob} 
                                    onJobClick={onJobClick || (() => console.warn('onJobClick not provided'))}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <JobApplication 
                    isOpen={isApplicationOpen}
                    onClose={handleCloseApplication}
                    onResumeClick={onResumeClick}
                    job={job}
                />

                {/* Share Toast Notification */}
                {showShareToast && (
                    <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transform transition-all duration-300 ease-out animate-bounce">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Job link copied to clipboard!
                    </div>
                )}
            </div>
        </>
    );
};

const SimilarJobCard: React.FC<{ job: any; onJobClick: (jobId: string) => void }> = ({ job, onJobClick }) => {
    const getTagStyle = (tag: string) => {
        switch (tag) {
          case 'Full-Time':
            return 'bg-green-100 text-green-700';
          case 'Marketing':
            return 'bg-yellow-100 text-yellow-700';
          case 'Design':
            return 'bg-blue-100 text-blue-700';
          default:
            return 'bg-gray-100 text-gray-600';
        }
    };

    // Transform job data from API
    const transformedJob = {
        job_id: job.job_id,
        title: job.title,
        company: job.company_name,
        location: [job.city_name, job.district_name].filter(Boolean).join(', ') || 'Remote',
        type: job.employment_type === 'FULL_TIME' ? 'Full-Time' : 
              job.employment_type === 'PART_TIME' ? 'Part-Time' :
              job.employment_type === 'CONTRACT' ? 'Contract' :
              job.employment_type === 'INTERNSHIP' ? 'Internship' :
              job.employment_type || 'Full-Time',
        logo: (job.company_name || job.title)?.charAt(0).toUpperCase() || 'J',
        logoColor: 'bg-blue-500',
        tags: [
            job.employment_type === 'FULL_TIME' ? 'Full-Time' : job.employment_type,
            job.category,
            job.remote_work_option && 'Remote'
        ].filter(Boolean).slice(0, 3)
    };

    return (
        <div 
            className="border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-50 hover:border-[#007BFF] transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1"
            onClick={() => {
                console.log('Similar job clicked:', transformedJob.job_id);
                console.log('Job data:', job);
                if (transformedJob.job_id) {
                    onJobClick(transformedJob.job_id);
                } else {
                    console.error('No job_id found in similar job:', job);
                }
            }}
        >
            <div className={`w-12 h-12 ${transformedJob.logoColor} text-white flex-shrink-0 flex items-center justify-center rounded-md text-xl font-bold`}>
                {transformedJob.logo}
            </div>
            <div className="text-left">
                <h4 className="font-semibold text-gray-900 text-base">{transformedJob.title}</h4>
                <p className="text-sm text-gray-500 my-1">{transformedJob.company} • {transformedJob.location}</p>
                <div className="flex flex-wrap gap-2 text-xs mt-2">
                    {transformedJob.tags.map((tag, j) => (
                        <span key={j} className={`px-2 py-1 rounded-full font-medium ${getTagStyle(tag)}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#007BFF] cursor-pointer">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        {children}
    </div>
);

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-3">
        <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
        <span className="text-gray-700">{children}</span>
    </li>
);

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#007BFF] cursor-pointer">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
    </div>
);

const Pill: React.FC<{ text: string }> = ({ text }) => {
    const colors = {
        'Marketing': 'bg-yellow-100 text-yellow-700',
        'Design': 'bg-green-100 text-green-700'
    };
    const colorClass = colors[text as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>{text}</span>;
}

export default JobDetail; 