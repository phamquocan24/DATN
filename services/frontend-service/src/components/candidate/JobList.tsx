import React, { useState, useEffect } from 'react';
import { JobApplication } from './JobApplication';
import candidateApi from '../../services/candidateApi';
import favoritesService from '../../services/favoritesService';
import { isTokenValid } from '../../services/tokenUtils';

interface JobListProps {
  onJobClick?: (jobId: string) => void;
  onFindJobsClick: () => void;
}

export const JobList: React.FC<JobListProps> = ({ onJobClick, onFindJobsClick }) => {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [latestJobs, setLatestJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Use correct API endpoints - try getFeaturedJobs for featured jobs  
        const [allJobsResponse, latestJobsResponse] = await Promise.all([
          candidateApi.getFeaturedJobs().catch(() => candidateApi.getAllJobs()),
          candidateApi.getLatestJobs().catch(() => candidateApi.getAllJobs())
        ]);

        // Handle different API response structures
        const allJobsArray = Array.isArray(allJobsResponse) 
          ? allJobsResponse 
          : (allJobsResponse?.data || allJobsResponse?.jobs || []);
          
        const latestJobsArray = Array.isArray(latestJobsResponse) 
          ? latestJobsResponse 
          : (latestJobsResponse?.data || latestJobsResponse?.jobs || []);

        // Transform API data to match component interface - using real API structure
        const transformJob = (job: any, index: number) => ({
          job_id: job.job_id, // Primary ID from database
          id: job.id,
          title: job.title,
          company: job.company_name,
          location: [job.city_name, job.district_name, job.address]
            .filter(Boolean)
            .join(', ') || (job.remote_work_option ? 'Remote' : 'Location TBD'),
          type: job.employment_type === 'FULL_TIME' ? 'Full-Time' : 
                job.employment_type === 'PART_TIME' ? 'Part-Time' :
                job.employment_type === 'CONTRACT' ? 'Contract' :
                job.employment_type === 'INTERNSHIP' ? 'Internship' :
                job.employment_type || 'Full-Time',
          description: job.description ? 
            (job.description.length > 150 ? 
              job.description.substring(0, 150) + '...' : 
              job.description) : 
            'No description available',
          // Tags for both featured and latest jobs - only category, remote, and featured
          tags: [
            job.category,
            job.remote_work_option && 'Remote',
            job.featured && 'Featured'
          ].filter(Boolean).slice(0, 3),
          logo: (job.company_name || job.title)?.charAt(0).toUpperCase() || 'J',
          logoColor: `bg-${['blue', 'green', 'purple', 'red', 'teal', 'orange'][index % 6]}-500 text-white`,
          applied: job.application_count || 0,
          capacity: job.max_applications || 1
        });

        // Use first 4 jobs as featured (or could be jobs with featured flag)
        const featuredJobsData = allJobsArray.slice(0, 4).map(transformJob);
        const latestJobsData = latestJobsArray.slice(0, 6).map(transformJob);

        setFeaturedJobs(featuredJobsData);
        setLatestJobs(latestJobsData);
        setError(null);
      } catch (err) {
        setError('Failed to load job listings.');
        console.error('Error fetching jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);



  const handleCloseApplication = () => {
    setIsApplicationOpen(false);
    setSelectedJob(null);
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-white text-center">
        <svg className="animate-spin h-8 w-8 text-[#007BFF] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-600">Loading Jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 bg-red-50 text-center">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      // Employment Types
      case 'full-time':
      case 'full time':
        return 'bg-green-100 text-green-700';
      case 'part-time':
      case 'part time':
        return 'bg-blue-100 text-blue-700';
      case 'contract':
        return 'bg-purple-100 text-purple-700';
      case 'internship':
        return 'bg-orange-100 text-orange-700';
      
      // Work Options
      case 'remote':
        return 'bg-teal-100 text-teal-700';
      case 'hybrid':
        return 'bg-indigo-100 text-indigo-700';
      case 'onsite':
      case 'on-site':
        return 'bg-gray-100 text-gray-700';
      
      // Categories
      case 'marketing':
        return 'bg-pink-100 text-pink-700';
      case 'design':
        return 'bg-yellow-100 text-yellow-700';
      case 'business':
        return 'bg-violet-100 text-violet-700';
      case 'technology':
      case 'tech':
        return 'bg-red-100 text-red-700';
      case 'engineering':
        return 'bg-slate-100 text-slate-700';
      case 'sales':
        return 'bg-emerald-100 text-emerald-700';
      case 'hr':
      case 'human resources':
        return 'bg-rose-100 text-rose-700';
      case 'finance':
        return 'bg-amber-100 text-amber-700';
      
      // Special Tags
      case 'feature':
      case 'featured':
        return 'bg-[#007BFF]/10 text-[#007BFF]';
      
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const JobCard = ({ job, cardStyle, onJobClick }: { 
    job: any, 
    cardStyle: 'featured' | 'latest',
    onJobClick?: (jobId: string) => void
  }) => {
    const [isFavorited, setIsFavorited] = useState(false);

    // Check bookmark status when job loads
    useEffect(() => {
      const checkBookmarkStatus = async () => {
        try {
          const jobId = job.job_id || job.id?.toString();
          if (!jobId) return;

          // Check if user is authenticated
          const token = localStorage.getItem('token');
          if (!token || !isTokenValid(token)) {
            setIsFavorited(false);
            return;
          }

          const response = await candidateApi.checkJobBookmarkStatus(jobId);
          if (response.success && response.data) {
            setIsFavorited(response.data.is_bookmarked);
          }
        } catch (error) {
          console.error('Failed to check bookmark status:', error);
        }
      };
      
      checkBookmarkStatus();
    }, [job.job_id, job.id]);

    // Listen for bookmark changes from other components
    useEffect(() => {
      const handleBookmarkChange = (event: CustomEvent) => {
        const { jobId: changedJobId, isBookmarked } = event.detail;
        const currentJobId = job.job_id || job.id?.toString();
        
        if (changedJobId === currentJobId) {
          setIsFavorited(isBookmarked);
        }
      };

      window.addEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
      
      return () => {
        window.removeEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
      };
    }, [job.job_id, job.id]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      
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

    const latestJobCard = (
      <>
        {/* Apply Button and Bookmark for Latest */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorited 
                ? 'text-blue-500 hover:bg-blue-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onJobClick?.(job.job_id || job.id);
            }}
            className="bg-[#007BFF] text-white px-4 py-1.5 rounded-lg text-xs hover:bg-[#0056b3] transition-colors"
          >
            Apply
          </button>
        </div>
        {/* Latest Card Content */}
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${job.logoColor} flex-shrink-0`}>
            {job.logo}
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors mb-1 truncate">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500">
              {job.company} &bull; {job.location}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(job.type)}`}>
              {job.type}
            </span>
            {job.tags.map((tag: string, index: number) => (
              <span key={index} className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {job.applied} applied of {job.capacity} capacity
          </p>
        </div>
      </>
    );

    const featuredJobCard = (
      <>
        {/* Featured Card Content */}
        <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${job.logoColor}`}>
          {job.logo}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-xs rounded-full font-medium border border-[#007BFF] text-[#007BFF]`}>
            {job.type}
          </span>
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-lg transition-colors ${
              isFavorited 
                ? 'text-blue-500 hover:bg-blue-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 text-left">{job.title}</h3>
      <p className="text-sm text-gray-500 mb-4 text-left">
        {job.company} &bull; {job.location}
      </p>
      <p className="text-sm text-gray-600 mb-4 text-left truncate">
        {job.description}
      </p>
      <div className="flex flex-wrap gap-2 justify-start">
        {job.tags.map((tag: string, index: number) => (
          <span key={index} className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(tag)}`}>
            {tag}
          </span>
        ))}
      </div>
      </>
    );

    return (
      <div 
        className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#007BFF] transition-all duration-300 group cursor-pointer relative hover:shadow-lg hover:-translate-y-1"
        onClick={() => onJobClick?.(job.job_id || job.id)}
      >
        {cardStyle === 'latest' ? latestJobCard : featuredJobCard}
    </div>
  );
  };

  return (
    <>
      {/* Featured Jobs Section */}
      <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured <span className="text-[#007BFF]">jobs</span>
            </h2>
            <button onClick={onFindJobsClick} className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Show all jobs
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} cardStyle="featured" onJobClick={onJobClick} />
            ))}
          </div>
          </div>
        </div>

        {/* Latest Jobs Section */}
      <div 
        className="py-16 bg-gray-50"
        style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 100% 100%, 0 100%, 0 5%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Latest <span className="text-[#007BFF]">jobs open</span>
            </h2>
            <button onClick={onFindJobsClick} className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Show all jobs
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {latestJobs.map((job) => (
              <JobCard key={job.id} job={job} cardStyle="latest" onJobClick={onJobClick} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Job Application Modal */}
      {selectedJob && (
        <JobApplication 
          isOpen={isApplicationOpen}
          onClose={handleCloseApplication}
          job={{
            job_id: selectedJob.job_id, // Primary ID from database
            id: selectedJob.id, // Fallback for legacy data
            title: selectedJob.title,
            company: selectedJob.company,
            location: selectedJob.location,
            type: selectedJob.type,
            logo: selectedJob.logo,
            logoColor: selectedJob.logoColor
          }}
        />
      )}
    </>
  );
};

export default JobList; 