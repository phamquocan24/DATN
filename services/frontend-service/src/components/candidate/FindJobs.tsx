import React, { useState, useEffect, useCallback } from 'react';
import JobDetail from './JobDetail';
import GroupUnderline from '../../assets/Group.png';
import Pagination from '../common/Pagination';
import { JobListItemSkeleton } from '../common/SkeletonLoader';
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
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0 });
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({ message: '', type: 'success', show: false });

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Fetch available locations
  const fetchAvailableLocations = useCallback(async () => {
    try {
      const response = await candidateApi.getAllJobs({ limit: 1000 }); // Get all jobs to extract locations
      if (response && response.data && Array.isArray(response.data)) {
        const locations = new Set<string>();
        
        response.data.forEach((job: any) => {
          // Add city names
          if (job.city_name) {
            locations.add(job.city_name);
          }
          
          // Add city + district combinations
          if (job.city_name && job.district_name) {
            locations.add(`${job.city_name}, ${job.district_name}`);
          }
          
          // Add full address if available
          if (job.address && job.address !== job.city_name) {
            locations.add(job.address);
          }
        });
        
        // Convert to sorted array
        const sortedLocations = Array.from(locations).sort();
        setAvailableLocations(sortedLocations);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  }, []);

  // Load locations on component mount
  useEffect(() => {
    fetchAvailableLocations();
  }, [fetchAvailableLocations]);
  
  
  // Suitable Jobs (Recommendations) states
  const [suitableJobs, setSuitableJobs] = useState<Job[]>([]);
  const [suitableJobsError, setSuitableJobsError] = useState<string | null>(null);
  
  // Location dropdown states
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [suitableJobsPagination, setSuitableJobsPagination] = useState({ 
    page: 1, 
    limit: 100, 
    total: 0, 
    totalPages: 0 
  });

  // Frontend pagination for display
  const [displayPagination, setDisplayPagination] = useState({ page: 1, itemsPerPage: 5 });
  const [suitableDisplayPagination, setSuitableDisplayPagination] = useState({ page: 1, itemsPerPage: 5 });

  // Helper functions for frontend pagination
  const getDisplayedJobs = () => {
    // When searching, show all results without pagination to avoid confusion
    if (searchQuery || location) {
      console.log('🔍 Search active - showing all results:', jobs.length);
      console.log('📋 Job titles being rendered:', jobs.map(job => job.title));
      return jobs;
    }
    
    const startIndex = (displayPagination.page - 1) * displayPagination.itemsPerPage;
    const endIndex = startIndex + displayPagination.itemsPerPage;
    const paginatedJobs = jobs.slice(startIndex, endIndex);
    console.log('📄 Pagination active - showing items:', startIndex, 'to', endIndex, 'of', jobs.length);
    console.log('📋 Paginated job titles:', paginatedJobs.map(job => job.title));
    return paginatedJobs;
  };

  const getDisplayedSuitableJobs = () => {
    const startIndex = (suitableDisplayPagination.page - 1) * suitableDisplayPagination.itemsPerPage;
    const endIndex = startIndex + suitableDisplayPagination.itemsPerPage;
    return suitableJobs.slice(startIndex, endIndex);
  };

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
    console.log('🔍 Fetching jobs with params:', { searchQuery, location, page: pagination.page });
    setIsLoading(true);
    setJobs([]); // Clear previous jobs to avoid showing stale data
    try {
      // Improve search by trying individual terms if original search returns few results
      let searchTerms = searchQuery ? searchQuery.trim().split(/\s+/) : [];
      let primarySearchTerm = searchQuery || undefined;
      
      const searchParams = {
        search: primarySearchTerm,
        location: location || undefined,
        employment_type: filters.employmentType.length > 0 ? filters.employmentType[0] : undefined,
        categories: filters.categories.length > 0 ? filters.categories[0] : undefined,
        page: pagination.page,
        limit: pagination.limit,
      };
      
      // Remove undefined values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key as keyof typeof searchParams] === undefined || searchParams[key as keyof typeof searchParams] === '') {
          delete searchParams[key as keyof typeof searchParams];
        }
      });
      
      console.log('📡 API call params:', searchParams);
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

      // DISABLE fallback search for now to prevent irrelevant results
      // TODO: Implement smart relevance filtering instead
      if (false && jobsArray.length < 3 && searchTerms.length > 1 && pagination.page === 1) {
        console.log('🔄 Few results found, trying individual search terms:', searchTerms);
        console.log('🔍 Original search results:', jobsArray.map(job => ({ title: job.title, company: job.company_name })));
        
        let allJobs = [...jobsArray];
        const jobIds = new Set(jobsArray.map((job: any) => job.job_id || job.id));
        
        for (const term of searchTerms) {
          if (term.length >= 3) { // Increase minimum term length to 3 for more relevance
            try {
              const termParams = { ...searchParams, search: term };
              console.log('🔍 Searching for term:', term);
              const termData = await candidateApi.searchJobs(termParams);
              
              let termJobs = [];
              if (Array.isArray(termData)) {
                termJobs = termData;
              } else if (termData?.data && Array.isArray(termData.data)) {
                termJobs = termData.data;
              } else if (termData?.jobs && Array.isArray(termData.jobs)) {
                termJobs = termData.jobs;
              }
              
              console.log(`📋 Term "${term}" results:`, termJobs.map(job => ({ title: job.title, company: job.company_name })));
              
              // Add unique jobs
              for (const job of termJobs) {
                const jobId = job.job_id || job.id;
                if (!jobIds.has(jobId)) {
                  allJobs.push(job);
                  jobIds.add(jobId);
                }
              }
            } catch (err) {
              console.warn('⚠️ Failed to search term:', term, err);
            }
          }
        }
        
        jobsArray = allJobs;
        console.log('✨ Combined search results:', jobsArray.length, 'jobs');
        console.log('📋 Final combined results:', jobsArray.map(job => ({ title: job.title, company: job.company_name })));
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

      console.log('✅ Jobs loaded:', formattedJobs.length);
      console.log('📋 First 3 job titles:', formattedJobs.slice(0, 3).map(job => ({ id: job.id || job.job_id, title: job.title })));
      console.log('🔍 Search Query:', searchQuery, 'Location:', location);
      console.log('🎯 Should show AI-Matched section:', !searchQuery && !location);
      setJobs(formattedJobs);
      // Only update total, not page/limit to avoid infinite loop
      const newTotal = jobsData?.total || jobsArray.length;
      setPagination(prev => ({ ...prev, total: newTotal }));
      setError(null);
    } catch (err) {
      console.error('❌ Failed to fetch jobs:', err);
      setError('Failed to fetch jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, pagination.page, pagination.limit, filters]);

  // Fetch jobs with debouncing for search query
  useEffect(() => {
    console.log('🔄 useEffect triggered with:', { searchQuery, location, page: pagination.page });
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout executed, calling fetchJobs');
      fetchJobs();
      // Reset display pagination when search criteria changes (but not when pagination.page changes)
      if (searchQuery || location || Object.values(filters).some(filter => filter.length > 0)) {
        setDisplayPagination(prev => ({ ...prev, page: 1 }));
        setSuitableDisplayPagination(prev => ({ ...prev, page: 1 }));
      }
    }, searchQuery ? 300 : 0); // 300ms debounce for search, immediate for pagination/filters

    return () => clearTimeout(timeoutId);
  }, [searchQuery, location, pagination.page, pagination.limit, filters, fetchJobs]);

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

  // Call fetchSuitableJobs when pagination changes - but only when not searching
  useEffect(() => {
    console.log('🔄 fetchSuitableJobs useEffect triggered:', { 
      searchQuery: `"${searchQuery}"`, 
      location: `"${location}"`,
      shouldLoad: !searchQuery && !location
    });
    
    if (!searchQuery && !location) {
      console.log('🎯 Loading AI-Matched jobs (no search active)');
      fetchSuitableJobs();
    } else {
      console.log('🚫 Skipping AI-Matched jobs (search active)', { searchQuery, location });
      setSuitableJobs([]); // Clear suitable jobs when searching
    }
  }, [fetchSuitableJobs, searchQuery, location]);

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
    console.log('🔍 Search button clicked with query:', `"${searchQuery}"`, 'location:', `"${location}"`);
    console.log('🔍 Search query length:', searchQuery?.length, 'Location length:', location?.length);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
    fetchJobs();
  };



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

    // Check bookmark status when job loads
    useEffect(() => {
      const checkBookmarkStatus = async () => {
        try {
          const jobId = job.job_id || job.id?.toString();
          if (!jobId) return;

          const result = await bookmarkCache.getBookmarkStatus(jobId);
          setIsJobSaved(result.isBookmarked);
        } catch (error) {
          console.error('Failed to check bookmark status:', error);
          setIsJobSaved(false);
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
            // Show success notification
            showNotification('Đã bỏ lưu công việc', 'success');
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
            // Show success notification
            showNotification('Lưu thành công! Công việc đã được thêm vào danh sách yêu thích', 'success');
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
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`
            px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300
            ${notification.type === 'success' ? 'bg-green-500 text-white' : 
              notification.type === 'error' ? 'bg-red-500 text-white' : 
              'bg-blue-500 text-white'}
          `}>
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="flex-shrink-0 ml-auto"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
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

            {/* Enhanced Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <div className="flex items-center px-4 py-3">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Job title, company, or keywords..."
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('🔤 Search input changed:', `"${value}"`, 'Length:', value.length);
                        setSearchQuery(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          console.log('⏎ Enter pressed, triggering search');
                          handleSearch();
                        }
                      }}
                      className="w-full outline-none text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  {/* Temporarily disabled search suggestions */}
                </div>
                
                <div className="flex-1 flex items-center px-4 py-3 border-l border-gray-200 relative">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full outline-none text-gray-900 bg-transparent appearance-none cursor-pointer"
                  >
                    <option value="">All locations</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 text-gray-400 ml-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Fresh Opportunities</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {isLoading 
                      ? 'Loading opportunities...'
                      : error 
                        ? 'Failed to load opportunities'
                        : `${jobs.length} career opportunities available`
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  {isLoading ? (
                    // Skeleton loading for job list
                    Array.from({ length: displayPagination.itemsPerPage }, (_, i) => (
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
                    getDisplayedJobs().map((job) => {
                      // Debug logging moved to getDisplayedJobs function
                      return <JobCard key={job.job_id || job.id} job={job} />;
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No positions found</h3>
                      <p className="text-gray-500">Try refining your search criteria or explore different filters</p>
                    </div>
                  )}
                </div>
              </div>

                {/* New Jobs Pagination - Hide when searching */}
                {jobs.length > displayPagination.itemsPerPage && !searchQuery && !location && (
                  <div className="flex justify-end mt-6">
                    <Pagination
                      currentPage={displayPagination.page}
                      totalPages={Math.ceil(jobs.length / displayPagination.itemsPerPage)}
                      totalItems={jobs.length}
                      itemsPerPage={displayPagination.itemsPerPage}
                      onPageChange={(page) => setDisplayPagination(prev => ({ ...prev, page }))}
                      showInfo={false}
                    />
                  </div>
                )}

              {/* Suitable Jobs Section - Hide when searching */}
              {(() => {
                console.log('🎯 AI-Matched section condition:', { 
                  searchQuery: `"${searchQuery}"`, 
                  location: `"${location}"`, 
                  searchQueryLength: searchQuery?.length,
                  shouldShow: !searchQuery && !location 
                });
                return null;
              })()}
              {!searchQuery && !location && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">AI-Matched Positions</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {suitableJobsError 
                      ? 'Failed to load AI matches'
                      : `${suitableJobs.length} AI-curated matches available`
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  {!suitableJobs.length && !suitableJobsError ? (
                    // Skeleton loading for suitable jobs
                    Array.from({ length: suitableDisplayPagination.itemsPerPage }, (_, i) => (
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
                    getDisplayedSuitableJobs().map((job) => (
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

                {/* Suitable Jobs Pagination */}
                {suitableJobs.length > suitableDisplayPagination.itemsPerPage && (
                  <div className="flex justify-end mt-6">
                    <Pagination
                      currentPage={suitableDisplayPagination.page}
                      totalPages={Math.ceil(suitableJobs.length / suitableDisplayPagination.itemsPerPage)}
                      totalItems={suitableJobs.length}
                      itemsPerPage={suitableDisplayPagination.itemsPerPage}
                      onPageChange={(page) => setSuitableDisplayPagination(prev => ({ ...prev, page }))}
                      showInfo={false}
                    />
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </>
  );
};

export default FindJobs;  