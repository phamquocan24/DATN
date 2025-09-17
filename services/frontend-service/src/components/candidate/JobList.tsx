import React, { useState, useEffect } from 'react';
import { JobApplication } from './JobApplication';
import candidateApi from '../../services/candidateApi';
import { FeaturedJobSkeleton } from '../common/SkeletonLoader';
import { isTokenValid } from '../../services/tokenUtils';
import bookmarkCache from '../../services/bookmarkCache';

interface JobListProps {
  onJobClick?: (jobId: string) => void;
  onFindJobsClick: () => void;
  onResumeClick?: () => void;
}

export const JobList: React.FC<JobListProps> = ({ onJobClick, onFindJobsClick, onResumeClick }) => {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [latestJobs, setLatestJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestJobsPagination, setLatestJobsPagination] = useState({
    page: 1,
    limit: 18, // Fetch 18 jobs to enable 3 slices (18 / 6 = 3 slices)
    total: 0
  });

  // Auto-rotation states
  const [featuredJobsSlice, setFeaturedJobsSlice] = useState(0);
  const [latestJobsSlice, setLatestJobsSlice] = useState(0);
  const featuredJobsPerSlice = 8; // 2 rows x 4 columns
  const latestJobsPerSlice = 6; // 3 rows x 2 columns

  // Auto-rotation for featured jobs every 10 seconds
  useEffect(() => {
    if (featuredJobs.length > featuredJobsPerSlice) {
      const interval = setInterval(() => {
        setFeaturedJobsSlice(prev => {
          const maxSlices = Math.ceil(featuredJobs.length / featuredJobsPerSlice);
          return (prev + 1) % maxSlices;
        });
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [featuredJobs.length, featuredJobsPerSlice]);

  // Auto-rotation for latest jobs every 12 seconds  
  useEffect(() => {
    if (latestJobs.length > latestJobsPerSlice) {
      const interval = setInterval(() => {
        setLatestJobsSlice(prev => {
          const maxSlices = Math.ceil(latestJobs.length / latestJobsPerSlice);
          return (prev + 1) % maxSlices;
        });
      }, 12000); // 12 seconds

      return () => clearInterval(interval);
    }
  }, [latestJobs.length, latestJobsPerSlice]);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Use correct API endpoints - with proper error handling
        let allJobsResponse, latestJobsResponse;
        
        try {
          allJobsResponse = await candidateApi.getFeaturedJobs();
        } catch (error) {
          console.warn('Failed to get featured jobs, falling back to all jobs:', error);
          allJobsResponse = await candidateApi.getAllJobs();
        }
        
        try {
          latestJobsResponse = await candidateApi.getLatestJobs({ 
            limit: latestJobsPagination.limit,
            page: latestJobsPagination.page 
          });
        } catch (error) {
          console.warn('Failed to get latest jobs, using featured jobs as fallback:', error);
          // Use featured jobs as fallback to avoid extra API call
          latestJobsResponse = allJobsResponse;
        }

        // Handle different API response structures
        const allJobsArray = Array.isArray(allJobsResponse) 
          ? allJobsResponse 
          : (allJobsResponse?.data || allJobsResponse?.jobs || []);
          
        const latestJobsArray = Array.isArray(latestJobsResponse) 
          ? latestJobsResponse 
          : (latestJobsResponse?.data || latestJobsResponse?.jobs || []);
          
        // Update latest jobs pagination from API response
        if (latestJobsResponse?.pagination) {
          setLatestJobsPagination(prev => ({
            ...prev,
            total: latestJobsResponse.pagination.total
          }));
        }

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

        // Load more jobs for rotation
        const featuredJobsData = allJobsArray.slice(0, 16).map(transformJob); // Load 16 for rotation (2 slices of 8)
        const latestJobsData = latestJobsArray.slice(0, 18).map(transformJob); // Load 18 for rotation (3 slices of 6)

        setFeaturedJobs(featuredJobsData);
        setLatestJobs(latestJobsData);
        setError(null);
        
        // Debug log
        console.log('Jobs loaded:', {
          featured: featuredJobsData.length,
          latest: latestJobsData.length,
          featuredSlices: Math.ceil(featuredJobsData.length / 8),
          latestSlices: Math.ceil(latestJobsData.length / 6)
        });
      } catch (err) {
        setError('Failed to load job listings.');
        console.error('Error fetching jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [latestJobsPagination.page, latestJobsPagination.limit]);



  const handleCloseApplication = () => {
    setIsApplicationOpen(false);
    setSelectedJob(null);
  };

  if (isLoading) {
    return (
      <>
        {/* Featured Jobs Skeleton */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="space-y-6">
              {Array.from({ length: 2 }, (_, rowIndex) => (
                <div key={`skeleton-featured-row-${rowIndex}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }, (_, colIndex) => (
                    <FeaturedJobSkeleton key={`skeleton-featured-${rowIndex}-${colIndex}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latest Jobs Skeleton */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="space-y-6">
              {Array.from({ length: 3 }, (_, rowIndex) => (
                <div key={`skeleton-latest-row-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }, (_, colIndex) => (
                    <FeaturedJobSkeleton key={`skeleton-latest-${rowIndex}-${colIndex}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
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
      
      // Skills & Technologies
      case 'quality assurance':
      case 'qa':
      case 'testing':
        return 'bg-cyan-100 text-cyan-700';
      case 'software development':
      case 'development':
      case 'programming':
        return 'bg-blue-100 text-blue-700';
      case 'devops':
      case 'dev ops':
        return 'bg-red-100 text-red-700';
      case 'ai':
      case 'artificial intelligence':
      case 'machine learning':
      case 'ml':
        return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700';
      case 'data science':
      case 'data analysis':
        return 'bg-emerald-100 text-emerald-700';
      case 'mobile development':
      case 'mobile':
      case 'ios':
      case 'android':
        return 'bg-green-100 text-green-700';
      case 'frontend':
      case 'front-end':
      case 'ui/ux':
        return 'bg-orange-100 text-orange-700';
      case 'backend':
      case 'back-end':
      case 'server':
        return 'bg-slate-100 text-slate-700';
      case 'fullstack':
      case 'full-stack':
        return 'bg-indigo-100 text-indigo-700';
      case 'cloud':
      case 'aws':
      case 'azure':
      case 'gcp':
        return 'bg-sky-100 text-sky-700';
      case 'database':
      case 'sql':
      case 'nosql':
        return 'bg-teal-100 text-teal-700';
      case 'security':
      case 'cybersecurity':
        return 'bg-red-100 text-red-700';
      case 'content marketing':
      case 'content':
        return 'bg-pink-100 text-pink-700';
      case 'supply chain':
        return 'bg-purple-100 text-purple-700';
      case 'hardware engineering':
      case 'hardware':
        return 'bg-gray-100 text-gray-700';
      
      // Business & Management
      case 'product management':
      case 'product manager':
        return 'bg-violet-100 text-violet-700';
      case 'business analysis':
      case 'business analyst':
        return 'bg-indigo-100 text-indigo-700';
      case 'project management':
      case 'project manager':
        return 'bg-amber-100 text-amber-700';
      case 'team leadership':
      case 'leadership':
        return 'bg-rose-100 text-rose-700';
      case 'risk management':
        return 'bg-red-100 text-red-700';
      
      // Methodologies
      case 'agile':
      case 'scrum':
        return 'bg-green-100 text-green-700';
      case 'kanban':
        return 'bg-blue-100 text-blue-700';
      case 'waterfall':
        return 'bg-slate-100 text-slate-700';
      
      // Design & Tools
      case 'figma':
      case 'sketch':
      case 'adobe xd':
        return 'bg-pink-100 text-pink-700';
      case 'adobe photoshop':
      case 'photoshop':
        return 'bg-blue-100 text-blue-700';
      case 'adobe illustrator':
      case 'illustrator':
        return 'bg-orange-100 text-orange-700';
      case 'wireframing':
      case 'prototyping':
        return 'bg-purple-100 text-purple-700';
      
      // Programming Languages
      case 'java':
      case 'java development':
        return 'bg-red-100 text-red-700';
      case 'python':
        return 'bg-green-100 text-green-700';
      case 'javascript':
      case 'js':
        return 'bg-yellow-100 text-yellow-700';
      case 'typescript':
      case 'ts':
        return 'bg-blue-100 text-blue-700';
      case 'react.js':
      case 'react':
        return 'bg-cyan-100 text-cyan-700';
      case 'node.js':
      case 'nodejs':
        return 'bg-green-100 text-green-700';
      case 'angular':
        return 'bg-red-100 text-red-700';
      case 'vue.js':
      case 'vue':
        return 'bg-green-100 text-green-700';
      case 'php':
        return 'bg-purple-100 text-purple-700';
      case 'c#':
      case 'csharp':
        return 'bg-purple-100 text-purple-700';
      case 'swift':
        return 'bg-orange-100 text-orange-700';
      case 'kotlin':
        return 'bg-purple-100 text-purple-700';
      
      // Testing & QA
      case 'selenium':
      case 'appium':
        return 'bg-cyan-100 text-cyan-700';
      case 'jest':
      case 'cypress':
        return 'bg-green-100 text-green-700';
      case 'junit':
      case 'pytest':
        return 'bg-orange-100 text-orange-700';
      case 'postman':
        return 'bg-amber-100 text-amber-700';
      
      // Analytics & Data
      case 'power bi':
      case 'tableau':
        return 'bg-blue-100 text-blue-700';
      case 'google analytics':
        return 'bg-orange-100 text-orange-700';
      case 'pandas':
      case 'numpy':
        return 'bg-blue-100 text-blue-700';
      case 'tensorflow':
      case 'pytorch':
        return 'bg-orange-100 text-orange-700';
      case 'big data':
      case 'hadoop':
      case 'apache spark':
        return 'bg-yellow-100 text-yellow-700';
      
      // Soft Skills
      case 'communication':
      case 'teamwork':
        return 'bg-green-100 text-green-700';
      case 'problem solving':
      case 'critical thinking':
        return 'bg-purple-100 text-purple-700';
      case 'time management':
        return 'bg-blue-100 text-blue-700';
      case 'customer service':
        return 'bg-pink-100 text-pink-700';
      
      // Domains
      case 'fintech':
        return 'bg-green-100 text-green-700';
      case 'healthtech':
        return 'bg-red-100 text-red-700';
      case 'edtech':
        return 'bg-blue-100 text-blue-700';
      case 'e-commerce':
        return 'bg-purple-100 text-purple-700';
      case 'blockchain':
      case 'cryptocurrency':
        return 'bg-yellow-100 text-yellow-700';
      
      // Version Control & Tools
      case 'git':
      case 'github':
      case 'gitlab':
        return 'bg-gray-100 text-gray-700';
      case 'jira':
      case 'confluence':
        return 'bg-blue-100 text-blue-700';
      case 'slack':
      case 'trello':
        return 'bg-green-100 text-green-700';
      
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

          const result = await bookmarkCache.getBookmarkStatus(jobId);
          setIsFavorited(result.isBookmarked);
        } catch (error) {
          console.error('Failed to check bookmark status:', error);
          setIsFavorited(false);
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
              Premium <span className="text-[#007BFF]">Opportunities</span>
            </h2>
            <button onClick={onFindJobsClick} className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Explore all positions
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Premium Opportunities - 2 rows x 4 columns */}
          <div className="space-y-6">
            {Array.from({ length: 2 }, (_, rowIndex) => (
              <div key={`featured-row-${rowIndex}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredJobs
                  .slice(featuredJobsSlice * featuredJobsPerSlice + rowIndex * 4, featuredJobsSlice * featuredJobsPerSlice + (rowIndex + 1) * 4)
                  .map((job, colIndex) => (
                    <JobCard key={`${job.id}-${featuredJobsSlice}-${rowIndex}-${colIndex}`} job={job} cardStyle="featured" onJobClick={onJobClick} />
                  ))}
              </div>
            ))}
          </div>
          
          {/* Featured Jobs Rotation Indicators */}
          {featuredJobs.length > featuredJobsPerSlice && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil(featuredJobs.length / featuredJobsPerSlice) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setFeaturedJobsSlice(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === featuredJobsSlice 
                      ? 'bg-[#007BFF] scale-110' 
                      : 'bg-gray-300 hover:bg-gray-400 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          )}
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
              Recent <span className="text-[#007BFF]">Openings</span>
            </h2>
            <button onClick={onFindJobsClick} className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Explore all positions
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Recent Openings - 3 rows x 2 columns */}
          <div className="space-y-6 mb-8">
            {Array.from({ length: 3 }, (_, rowIndex) => {
              const startIndex = latestJobsSlice * latestJobsPerSlice + rowIndex * 2;
              const endIndex = latestJobsSlice * latestJobsPerSlice + (rowIndex + 1) * 2;
              const slicedJobs = latestJobs.slice(startIndex, endIndex);
              
              console.log(`Latest Jobs Row ${rowIndex}:`, {
                latestJobsSlice,
                latestJobsPerSlice,
                startIndex,
                endIndex,
                totalJobs: latestJobs.length,
                slicedJobs: slicedJobs.length,
                jobTitles: slicedJobs.map(j => j.title)
              });
              
              return (
                <div key={`latest-row-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {slicedJobs.map((job, colIndex) => (
                    <JobCard key={`${job.id}-${latestJobsSlice}-${rowIndex}-${colIndex}`} job={job} cardStyle="latest" onJobClick={onJobClick} />
                  ))}
                </div>
              );
            })}
          </div>
          
          {/* Latest Jobs Rotation Indicators */}
          {latestJobs.length > latestJobsPerSlice && (
            <div className="flex justify-center space-x-2">
              {Array.from({ length: Math.ceil(latestJobs.length / latestJobsPerSlice) }, (_, i) => {
                console.log(`Latest Jobs Slice Indicator ${i}:`, {
                  totalJobs: latestJobs.length,
                  latestJobsPerSlice,
                  maxSlices: Math.ceil(latestJobs.length / latestJobsPerSlice),
                  currentSlice: latestJobsSlice,
                  isActive: i === latestJobsSlice
                });
                
                return (
                  <button
                    key={i}
                    onClick={() => setLatestJobsSlice(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === latestJobsSlice 
                        ? 'bg-[#007BFF] scale-110' 
                        : 'bg-gray-300 hover:bg-gray-400 hover:scale-105'
                    }`}
                  />
                );
              })}
            </div>
          )}
          

        </div>
      </div>
      
      {/* Job Application Modal */}
      {selectedJob && (
        <JobApplication 
          isOpen={isApplicationOpen}
          onClose={handleCloseApplication}
          onResumeClick={onResumeClick}
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