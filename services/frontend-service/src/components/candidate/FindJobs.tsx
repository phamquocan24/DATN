import React, { useState, useEffect, useCallback } from 'react';
import { Footer } from './Footer';
import JobDetail from './JobDetail';
import GroupUnderline from '../../assets/Group.png';
import Pagination from '../common/Pagination';
import { JobListItemSkeleton, JobCardSkeleton } from '../common/SkeletonLoader';
import candidateApi from '../../services/candidateApi'; // Sử dụng candidateApi
import { isTokenValid } from '../../services/tokenUtils';
import bookmarkCache from '../../services/bookmarkCache';


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
  isNew?: boolean;
  isSaved?: boolean;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  whoYouAre?: string[];
  niceToHaves?: string[];
  // AI Matching fields
  aiMatchScore?: number;
  matchGrade?: string;
  isCalculatingMatch?: boolean;
  detailedScores?: {
    skills_similarity: number;
    experience_similarity: number;
    education_similarity: number;
    description_similarity: number;
  };
}

interface FindJobsProps {
  onJobClick?: (jobId: string) => void;
  onCompanyClick?: (companyId: string) => void;
}

// Removed global bookmark cache - now using centralized bookmarkCache service

export const FindJobs: React.FC<FindJobsProps> = ({ onJobClick, onCompanyClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Suitable Jobs (Recommendations) states
  const [suitableJobs, setSuitableJobs] = useState<Job[]>([]);
  const [suitableJobsError, setSuitableJobsError] = useState<string | null>(null);
  const [suitableJobsPagination, setSuitableJobsPagination] = useState({ 
    page: 1, 
    limit: 5, 
    total: 0, 
    totalPages: 0 
  });


  // Match scores will be calculated only in JobDetail component

  const [filters, setFilters] = useState({
    employmentType: [] as string[],
    categories: [] as string[],
    jobLevel: [] as string[],
    salaryRange: [] as string[]
  });
  const [collapsedSections, setCollapsedSections] = useState({
    employmentType: false,
    categories: false,
    jobLevel: false,
    salaryRange: false
  });

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchParams = {
        query: searchQuery,
        location: location,
        type: filters.employmentType.join(','),
        categories: filters.categories.join(','),
        page: pagination.page,
        limit: pagination.limit,
      };
      
      const jobsData = await candidateApi.searchJobs(searchParams);
      
      let jobsArray = [];
      if (Array.isArray(jobsData)) {
        jobsArray = jobsData;
      } else if (jobsData?.data && Array.isArray(jobsData.data)) {
        jobsArray = jobsData.data;
        // Update pagination total from API response
        if (jobsData.pagination) {
          setPagination(prev => ({
            ...prev,
            total: jobsData.pagination.total
          }));
        }
      } else if (jobsData?.jobs && Array.isArray(jobsData.jobs)) {
        jobsArray = jobsData.jobs;
      }

      const formattedJobs = await Promise.all(jobsArray.map(async (job: any, index: number) => {
        // No automatic match calculation during job loading
        // Match scores will be calculated only when user selects a CV from Resume page

        return {
          job_id: job.job_id, // Primary ID from database
          id: Number(job.id || job._id) || 0, // Ensure it's a number
          company_id: job.company_id,
          title: job.title,
          company: job.company_name || job.company?.name || 'Company',
          location: job.address || job.city_name || job.location || 'Location', // Address next to company
          type: job.employment_type || job.type || 'Full Time',
          tags: [
            job.category,
            job.city_name || job.location, // Category in tags, location moved here
            job.remote_work_option
          ].filter(Boolean).slice(0, 3),
          logo: (job.company_name || job.company?.name || job.title)?.charAt(0).toUpperCase() || 'C',
          logoColor: [
            'bg-blue-500 text-white',
            'bg-green-500 text-white', 
            'bg-purple-500 text-white',
            'bg-red-500 text-white',
            'bg-teal-500 text-white'
          ][index % 5],
          match: 0, // Match scores calculated only in JobDetail
          applied: job.applicationsCount || 0,
          capacity: job.openPositions || 1,
          salary: job.salary,
          description: job.description || 'No description available.',
          requirements: Array.isArray(job.requirements) 
            ? job.requirements 
            : typeof job.requirements === 'string' 
              ? job.requirements.split('\n').filter((item: string) => item.trim())
              : ['No requirements listed.'],
          whoYouAre: Array.isArray(job.qualifications) 
            ? job.qualifications 
            : typeof job.qualifications === 'string' 
              ? job.qualifications.split('\n').filter((item: string) => item.trim())
              : ['No qualifications listed.'],
          niceToHaves: Array.isArray(job.niceToHave) 
            ? job.niceToHave 
            : typeof job.niceToHave === 'string' 
              ? job.niceToHave.split('\n').filter((item: string) => item.trim())
              : ['No nice-to-haves listed.'],
          benefits: Array.isArray(job.benefits) 
            ? job.benefits 
            : typeof job.benefits === 'string' 
              ? job.benefits.split('\n').filter((item: string) => item.trim())
              : ['Competitive salary', 'Health insurance', 'Flexible working hours'],
          view_count: job.view_count || 0
        };
      }));

      setJobs(formattedJobs);
      // Only update total, not page/limit to avoid infinite loop
      const newTotal = jobsData?.total || jobsArray.length;
      setPagination(prev => ({ ...prev, total: newTotal }));
      setError(null);
    } catch (err) {
      setError('Failed to fetch jobs.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, pagination.page, pagination.limit, filters]);

  // Fetch jobs with debouncing for search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, searchQuery ? 300 : 0); // 300ms debounce for search, immediate for pagination/filters

    return () => clearTimeout(timeoutId);
  }, [searchQuery, location, pagination.page, pagination.limit, filters]);

  // Match scores will be calculated only in JobDetail component

  // Fetch suitable jobs (recommendations) - using useCallback to prevent infinite loops
  const fetchSuitableJobs = useCallback(async () => {
    try {
      setSuitableJobsError(null);
      
      const response = await candidateApi.getRecommendedJobs({ 
        page: suitableJobsPagination.page, 
        limit: Math.min(suitableJobsPagination.limit, 50) // Max 50 per page
      });
      
      if (response && response.data && Array.isArray(response.data)) {
        // Update pagination info from API response
        if (response.pagination) {
          setSuitableJobsPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages
          }));
        }
        
        const transformedJobs = response.data.map((job: any, index: number) => {
          return {
          job_id: job.job_id,
          id: parseInt(job.id || job.job_id) || 0,
          title: job.title,
          company: job.company_name || 'Company',
          location: job.address || [job.city_name, job.district_name]
            .filter(Boolean)
            .join(', ') || 'Remote', // Address next to company
          type: job.employment_type === 'FULL_TIME' ? 'Full-Time' 
              : job.employment_type === 'PART_TIME' ? 'Part-Time'
              : job.employment_type === 'CONTRACT' ? 'Contract'
              : job.employment_type === 'INTERNSHIP' ? 'Internship'
              : 'Full-Time',
          tags: [
            job.category,
            [job.city_name, job.district_name].filter(Boolean).join(', '), // Location moved here
            job.remote_work_option
          ].filter(Boolean).slice(0, 3),
          logo: (job.company_name || job.title || 'Company')?.charAt(0).toUpperCase() || 'C',
          logoColor: [
            'bg-blue-500 text-white',
            'bg-green-500 text-white', 
            'bg-purple-500 text-white',
            'bg-red-500 text-white',
            'bg-teal-500 text-white',
            'bg-orange-500 text-white'
          ][index % 6],
          match: 0, // Match scores calculated only in JobDetail
          applied: job.application_count || 0,
          capacity: job.max_applications || 1,
          salary: job.salary_min && job.salary_max 
            ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.currency || 'VND'}`
            : job.salary_min 
              ? `From ${job.salary_min.toLocaleString()} ${job.currency || 'VND'}`
              : 'Competitive Salary',
          description: job.description || 'No description available.',
          requirements: Array.isArray(job.requirements) 
            ? job.requirements 
            : typeof job.requirements === 'string' 
              ? job.requirements.split('\n').filter((item: string) => item.trim())
              : ['No requirements listed.'],
          benefits: Array.isArray(job.benefits) 
            ? job.benefits
            : typeof job.benefits === 'string' 
              ? job.benefits.split('\n').filter((item: string) => item.trim())
              : ['No benefits listed.'],
          whoYouAre: Array.isArray(job.responsibilities) 
            ? job.responsibilities 
            : typeof job.responsibilities === 'string' 
              ? job.responsibilities.split('\n').filter((item: string) => item.trim())
              : ['No responsibilities listed.'],
          niceToHaves: [
            job.education_requirements,
            job.language_requirements?.join(', '),
            job.required_skills?.length > 0 ? `Skills: ${job.required_skills.join(', ')}` : null
          ].filter(Boolean)
        }; });
        setSuitableJobs(transformedJobs);
      } else {
        setSuitableJobs([]);
      }
    } catch (error) {
      console.error('Failed to fetch suitable jobs:', error);
      setSuitableJobsError('Failed to load job recommendations');
      setSuitableJobs([]);
    }
  }, [suitableJobsPagination.page, suitableJobsPagination.limit]);

  // Call fetchSuitableJobs when pagination changes
  useEffect(() => {
    fetchSuitableJobs();
  }, [fetchSuitableJobs]);

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
    fetchJobs();
  }

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setCurrentView('detail');
    // Also call the original onJobClick if provided
    if (onJobClick && job.id) {
      onJobClick(job.id.toString());
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedJob(null);
  };

  const FilterCheckbox = ({ 
    label, 
    count, 
    checked, 
    onChange 
  }: { 
    label: string; 
    count?: number; 
    checked: boolean; 
    onChange: () => void; 
  }) => (
    <div className="flex items-center space-x-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-[#007BFF] border-gray-300 rounded focus:ring-[#007BFF]"
      />
      <label className="flex-1 text-sm text-gray-700 cursor-pointer text-left" onClick={onChange}>
        {label}
      </label>
      {count && <span className="text-sm text-gray-500">({count})</span>}
    </div>
  );

  const JobCard = ({ job }: { job: Job }) => {
    const [isJobSaved, setIsJobSaved] = useState(false);
    const [hasCheckedBookmark, setHasCheckedBookmark] = useState(false);

    // Check bookmark status when job loads
    useEffect(() => {
      const checkBookmarkStatus = async () => {
        try {
          const jobId = job.job_id || job.id?.toString();
          if (!jobId) return;

          const result = await bookmarkCache.getBookmarkStatus(jobId);
          setIsJobSaved(result.isBookmarked);
          setHasCheckedBookmark(true);
        } catch (error) {
          console.error('Failed to check bookmark status:', error);
          setIsJobSaved(false);
          setHasCheckedBookmark(true);
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
          setIsJobSaved(isBookmarked);
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

    const handleBookmarkClick = async (e: React.MouseEvent) => {
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

        if (isJobSaved) {
          // Remove bookmark
          const response = await candidateApi.removeJobFromFavorites(jobId);
          if (response.success) {
            setIsJobSaved(false);
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
            setIsJobSaved(true);
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

    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer text-left"
        onClick={() => handleJobClick(job)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${job.logoColor}`}>
              {job.logo}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-gray-500">{job.company} • {job.location}</p>
            </div>
          </div>
                    <button 
            onClick={handleBookmarkClick}
            className={`p-2 rounded-lg transition-colors ${
              isJobSaved
                ? 'text-blue-500 hover:bg-blue-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill={isJobSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            {job.type}
          </span>
          
                  {/* Match scores calculated only in JobDetail */}
          
          {/* Other tags (filter out old Match tags) */}
          {job.tags.filter(tag => !tag.includes('Match:')).map((tag, index) => (
            <span 
              key={`${job.id}-tag-${index}`}
              className="px-3 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {job.applied} applied of {job.capacity} capacity
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleJobClick(job);
            }}
            className="bg-[#007BFF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0056b3] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    );
  };

  // Render JobDetail when detail view is active
  if (currentView === 'detail' && selectedJob) {
    return (
      <JobDetail 
        job={selectedJob}
        onBack={handleBackToList}
        onJobClick={onJobClick}
        onCompanyClick={onCompanyClick}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Find your <span className="text-[#007BFF] relative inline-block">
                  dream job
                  <img 
                    src={GroupUnderline} 
                    alt="underline" 
                    className="absolute -bottom-6 left-0 w-full h-6 object-contain transform scale-125"
                  />
                </span>
              </h1>
              <p className="text-gray-600 mt-4">
                Find your next career at companies like HubSpot, Nike, and Dropbox
              </p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Job title or keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div className="flex-1 flex items-center px-4 py-3 border-l border-gray-200">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Florence, Italy"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <button 
                  onClick={handleSearch}
                  className="bg-[#007BFF] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0056b3] transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Popular tags */}
            <div className="text-left text-sm text-gray-600">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">UI Designer, UX Researcher, Android, Admin</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div className="w-80 bg-white rounded-lg p-6 h-fit text-left">
              {/* Type of Employment */}
              <div className="mb-6">
                <h3 
                  className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer hover:text-[#007BFF] transition-colors"
                  onClick={() => toggleSection('employmentType')}
                >
                  Type of Employment
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${collapsedSections.employmentType ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
                {!collapsedSections.employmentType && (
                <div className="space-y-1">
                  <FilterCheckbox 
                    label="Full-time" 
                    count={3}
                    checked={filters.employmentType.includes('full-time')}
                    onChange={() => handleFilterChange('employmentType', 'full-time')}
                  />
                  <FilterCheckbox 
                    label="Part-Time" 
                    count={5}
                    checked={filters.employmentType.includes('part-time')}
                    onChange={() => handleFilterChange('employmentType', 'part-time')}
                  />
                  <FilterCheckbox 
                    label="Remote" 
                    count={2}
                    checked={filters.employmentType.includes('remote')}
                    onChange={() => handleFilterChange('employmentType', 'remote')}
                  />
                  <FilterCheckbox 
                    label="Internship" 
                    count={24}
                    checked={filters.employmentType.includes('internship')}
                    onChange={() => handleFilterChange('employmentType', 'internship')}
                  />
                  <FilterCheckbox 
                    label="Contract" 
                    count={3}
                    checked={filters.employmentType.includes('contract')}
                    onChange={() => handleFilterChange('employmentType', 'contract')}
                  />
                </div>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 
                  className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer hover:text-[#007BFF] transition-colors"
                  onClick={() => toggleSection('categories')}
                >
                  Categories
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${collapsedSections.categories ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
                {!collapsedSections.categories && (
                <div className="space-y-1">
                  <FilterCheckbox 
                    label="Design" 
                    count={24}
                    checked={filters.categories.includes('design')}
                    onChange={() => handleFilterChange('categories', 'design')}
                  />
                  <FilterCheckbox 
                    label="Sales" 
                    count={3}
                    checked={filters.categories.includes('sales')}
                    onChange={() => handleFilterChange('categories', 'sales')}
                  />
                  <FilterCheckbox 
                    label="Marketing" 
                    count={3}
                    checked={filters.categories.includes('marketing')}
                    onChange={() => handleFilterChange('categories', 'marketing')}
                  />
                  <FilterCheckbox 
                    label="Business" 
                    count={3}
                    checked={filters.categories.includes('business')}
                    onChange={() => handleFilterChange('categories', 'business')}
                  />
                  <FilterCheckbox 
                    label="Human Resource" 
                    count={6}
                    checked={filters.categories.includes('hr')}
                    onChange={() => handleFilterChange('categories', 'hr')}
                  />
                  <FilterCheckbox 
                    label="Finance" 
                    count={4}
                    checked={filters.categories.includes('finance')}
                    onChange={() => handleFilterChange('categories', 'finance')}
                  />
                  <FilterCheckbox 
                    label="Engineering" 
                    count={4}
                    checked={filters.categories.includes('engineering')}
                    onChange={() => handleFilterChange('categories', 'engineering')}
                  />
                  <FilterCheckbox 
                    label="Technology" 
                    count={5}
                    checked={filters.categories.includes('technology')}
                    onChange={() => handleFilterChange('categories', 'technology')}
                  />
                </div>
                )}
              </div>

              {/* Job Level */}
              <div className="mb-6">
                <h3 
                  className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer hover:text-[#007BFF] transition-colors"
                  onClick={() => toggleSection('jobLevel')}
                >
                  Job Level
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${collapsedSections.jobLevel ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
                {!collapsedSections.jobLevel && (
                <div className="space-y-1">
                  <FilterCheckbox 
                    label="Entry Level" 
                    count={57}
                    checked={filters.jobLevel.includes('entry')}
                    onChange={() => handleFilterChange('jobLevel', 'entry')}
                  />
                  <FilterCheckbox 
                    label="Mid Level" 
                    count={3}
                    checked={filters.jobLevel.includes('mid')}
                    onChange={() => handleFilterChange('jobLevel', 'mid')}
                  />
                  <FilterCheckbox 
                    label="Senior Level" 
                    count={5}
                    checked={filters.jobLevel.includes('senior')}
                    onChange={() => handleFilterChange('jobLevel', 'senior')}
                  />
                  <FilterCheckbox 
                    label="Director" 
                    count={12}
                    checked={filters.jobLevel.includes('director')}
                    onChange={() => handleFilterChange('jobLevel', 'director')}
                  />
                  <FilterCheckbox 
                    label="VP or Above" 
                    count={8}
                    checked={filters.jobLevel.includes('vp')}
                    onChange={() => handleFilterChange('jobLevel', 'vp')}
                  />
                </div>
                )}
              </div>

              {/* Salary Range */}
              <div className="mb-6">
                <h3 
                  className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer hover:text-[#007BFF] transition-colors"
                  onClick={() => toggleSection('salaryRange')}
                >
                  Salary Range
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${collapsedSections.salaryRange ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
                {!collapsedSections.salaryRange && (
                <div className="space-y-1">
                  <FilterCheckbox 
                    label="$700 - $1000" 
                    count={4}
                    checked={filters.salaryRange.includes('700-1000')}
                    onChange={() => handleFilterChange('salaryRange', '700-1000')}
                  />
                  <FilterCheckbox 
                    label="$100 - $1500" 
                    count={6}
                    checked={filters.salaryRange.includes('100-1500')}
                    onChange={() => handleFilterChange('salaryRange', '100-1500')}
                  />
                  <FilterCheckbox 
                    label="$1500 - $2000" 
                    count={10}
                    checked={filters.salaryRange.includes('1500-2000')}
                    onChange={() => handleFilterChange('salaryRange', '1500-2000')}
                  />
                  <FilterCheckbox 
                    label="$3000 or above" 
                    count={4}
                    checked={filters.salaryRange.includes('3000+')}
                    onChange={() => handleFilterChange('salaryRange', '3000+')}
                  />
                </div>
                )}
              </div>
            </div>

            {/* Job Listings */}
            <div className="flex-1 text-left">
              {/* New Jobs Section */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Fresh Opportunities</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {isLoading 
                          ? 'Loading opportunities...'
                          : error 
                            ? 'Failed to load opportunities'
                            : `Showing ${jobs.length} of ${pagination.total} career opportunities`
                        }
                      </p>
                  </div>
                  <div className="flex items-center space-x-4 ml-auto">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Sort by:</span>
                      <select className="w-40 text-sm border border-gray-300 rounded px-3 py-1">
                        <option>Most relevant</option>
                        <option>Newest</option>
                        <option>Salary</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      <button className="p-2 text-[#007BFF]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {isLoading ? (
                    // Skeleton loading for job list
                    Array.from({ length: pagination.limit }, (_, i) => (
                      <JobListItemSkeleton key={i} />
                    ))
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-2">⚠️ {error}</div>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="text-blue-500 hover:underline"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : jobs.length > 0 ? (
                    jobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No positions found</h3>
                      <p className="text-gray-500">Try refining your search criteria or explore different filters</p>
                    </div>
                  )}
                </div>
              </div>

                {/* New Jobs Pagination */}
                {pagination.total > pagination.limit && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={Math.ceil(pagination.total / pagination.limit)}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                    showInfo={true}
                  />
                )}

              {/* Suitable Jobs Section */}
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI-Matched Positions</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {suitableJobsError 
                        ? 'Failed to load AI matches'
                        : `Showing ${Math.min(suitableJobsPagination.limit, suitableJobs.length)} of ${suitableJobsPagination.total} AI-curated matches`
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 ml-auto">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Sort by:</span>
                      <select className="w-40 text-sm border border-gray-300 rounded px-3 py-1">
                        <option>Most relevant</option>
                        <option>Newest</option>
                        <option>Salary</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      <button className="p-2 text-[#007BFF]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {!suitableJobs.length && !suitableJobsError ? (
                    // Skeleton loading for suitable jobs
                    Array.from({ length: suitableJobsPagination.limit }, (_, i) => (
                      <JobListItemSkeleton key={i} />
                    ))
                  ) : suitableJobsError ? (
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-2">⚠️ {suitableJobsError}</div>
                      <p className="text-gray-500 mt-2">Please try again or login to see AI-powered job matches</p>
                      <button 
                        onClick={fetchSuitableJobs} 
                        className="mt-3 text-blue-500 hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : suitableJobs.length > 0 ? (
                    suitableJobs.map((job) => (
                      <JobCard key={job.job_id || job.id} job={job} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🎯</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No AI matches yet</h3>
                      <p className="text-gray-500">Complete your profile to unlock intelligent job matching</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Suitable Jobs Pagination */}
              {suitableJobsPagination.total > suitableJobsPagination.limit && (
                <Pagination
                  currentPage={suitableJobsPagination.page}
                  totalPages={Math.ceil(suitableJobsPagination.total / suitableJobsPagination.limit)}
                  totalItems={suitableJobsPagination.total}
                  itemsPerPage={suitableJobsPagination.limit}
                  onPageChange={(page) => setSuitableJobsPagination(prev => ({ ...prev, page }))}
                  showInfo={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </>
  );
};

export default FindJobs; 