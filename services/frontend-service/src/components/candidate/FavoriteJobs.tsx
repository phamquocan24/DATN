import { useState, useEffect, useCallback } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import candidateApi from '../../services/candidateApi';
import { isTokenValid } from '../../services/tokenUtils';
import { 
  batchCalculateAIMatchScores
} from '../../services/aiMatchingApi';

interface Job {
  job_id: string; // Primary ID from database (UUID)
  id?: number; // Legacy support for AI matching
  title: string;
  company: string;
  company_name?: string; // From API response
  location: string;
  city_name?: string; // From API response
  district_name?: string; // From API response
  type: string;
  employment_type?: string; // From API response
  work_arrangement?: string; // From API response
  tags: string[];
  logo: string;
  logo_url?: string; // From API response
  logoColor: string;
  match?: number;
  applied?: number;
  application_count?: number; // From API response
  capacity?: number;
  max_applications?: number; // From API response
  salary?: string;
  salary_min?: number; // From API response
  salary_max?: number; // From API response
  currency?: string; // From API response
  isNew?: boolean;
  isSaved?: boolean;
  saved_at?: string; // From API response
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

interface FavoriteJobsProps {
  onJobClick?: (jobId: string) => void;
}

export const FavoriteJobs: React.FC<FavoriteJobsProps> = ({ onJobClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [favoriteJobs, setFavoriteJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'company'>('newest');
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 0 });
  
  // AI Matching states
  const [selectedCVId, setSelectedCVId] = useState<string | null>(null);

  // Load selected CV from localStorage (triggered by Resume component)
  const loadSelectedCV = useCallback(() => {
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
  }, []);

  // Helper function to get match grade
  const getMatchGrade = (score: number): string => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 70) return 'VERY_GOOD';
    if (score >= 60) return 'GOOD';
    if (score >= 50) return 'FAIR';
    return 'POOR';
  };

  // Function to calculate AI match scores for favorite jobs
  const calculateAIMatchScoresForFavoriteJobs = async (cvId: string) => {
    if (!cvId || favoriteJobs.length === 0) return;

    console.log(`Calculating AI match scores for ${favoriteJobs.length} favorite jobs with CV: ${cvId}`);

    try {
      // Extract job IDs - use job_id (UUID) for API calls
      const jobIds = favoriteJobs.map(job => job.job_id).filter(Boolean);
      
      if (jobIds.length === 0) {
        console.warn('No valid job IDs found');
        return;
      }

      // Set calculating state for all jobs
      setFilteredJobs(prevJobs => 
        prevJobs.map(job => ({
          ...job,
          isCalculatingMatch: true
        }))
      );

      // Calculate batch match scores
      const batchResult = await batchCalculateAIMatchScores(cvId, jobIds);
      
      if (batchResult.success && batchResult.data) {
        // Update favorite jobs with match scores
        setFilteredJobs(prevJobs => 
          prevJobs.map(job => {
            const matchResult = batchResult.data?.find(result => result.job_id === job.job_id);
            
            if (matchResult && !matchResult.error) {
              return {
                ...job,
                aiMatchScore: matchResult.match_score,
                matchGrade: getMatchGrade(matchResult.match_score),
                isCalculatingMatch: false,
                match: matchResult.match_score // Update the existing match field too
              };
            }
            
            return {
              ...job,
              isCalculatingMatch: false
            };
          })
        );
        
        console.log(`Successfully calculated match scores for ${batchResult.data.filter(r => !r.error).length} favorite jobs`);
      }
    } catch (error) {
      console.error('Error calculating AI match scores for favorite jobs:', error);
      
      // Reset calculating state for all jobs
      setFilteredJobs(prevJobs => 
        prevJobs.map(job => ({
          ...job,
          isCalculatingMatch: false
        }))
      );
    }
  };

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

  // Transform API data to Job interface
  const transformJobData = (apiJob: any): Job => {
    const location = apiJob.address || [apiJob.city_name, apiJob.district_name].filter(Boolean).join(', ') || 'Remote'; // Address next to company
    
    // Create tags array
    const tags = [];
    if (apiJob.category) tags.push(apiJob.category);
    if (apiJob.city_name || apiJob.district_name) {
      const cityLocation = [apiJob.city_name, apiJob.district_name].filter(Boolean).join(', ');
      if (cityLocation) tags.push(cityLocation); // Location moved to tags
    }
    if (apiJob.remote_work_option) tags.push(apiJob.remote_work_option);
    
    // Create salary string
    let salary = '';
    if (apiJob.salary_min && apiJob.salary_max) {
      salary = `${apiJob.salary_min.toLocaleString()} - ${apiJob.salary_max.toLocaleString()} ${apiJob.currency || 'VND'}`;
    } else if (apiJob.salary_min) {
      salary = `From ${apiJob.salary_min.toLocaleString()} ${apiJob.currency || 'VND'}`;
    }

    return {
      job_id: apiJob.job_id,
      id: parseInt(apiJob.job_id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number for AI matching
      title: apiJob.title,
      company: apiJob.company_name,
      company_name: apiJob.company_name,
      location: location,
      city_name: apiJob.city_name,
      district_name: apiJob.district_name,
      type: apiJob.employment_type || 'Full-time',
      employment_type: apiJob.employment_type,
      work_arrangement: apiJob.work_arrangement,
      tags: tags,
      logo: apiJob.company_name?.charAt(0).toUpperCase() || 'C',
      logo_url: apiJob.logo_url,
      logoColor: 'bg-blue-100 text-blue-600',
      applied: apiJob.application_count || 0,
      application_count: apiJob.application_count,
      capacity: apiJob.max_applications || 100,
      max_applications: apiJob.max_applications,
      salary: salary,
      salary_min: apiJob.salary_min,
      salary_max: apiJob.salary_max,
      currency: apiJob.currency,
      saved_at: apiJob.saved_at,
      isSaved: true
    };
  };

  const fetchFavoriteJobs = async () => {
    setError(null);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token || !isTokenValid(token)) {
        setFavoriteJobs([]);
        setFilteredJobs([]);
        setError('Please login to view your saved jobs');
        return;
      }

      const response = await candidateApi.getFavoriteJobs();
      
      if (response.success && response.data) {
        const transformedJobs = response.data.map(transformJobData);
        setFavoriteJobs(transformedJobs);
        setFilteredJobs(transformedJobs);
        
        // Update pagination if available
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setFavoriteJobs([]);
        setFilteredJobs([]);
      }
    } catch (err: any) {
      console.error('Failed to load favorite jobs:', err);
      setError('Failed to load favorite jobs. Please try again.');
      setFavoriteJobs([]);
      setFilteredJobs([]);
    }
  };

  useEffect(() => {
    fetchFavoriteJobs();
    loadSelectedCV();
  }, [loadSelectedCV]);

  // Listen for bookmark changes from other components
  useEffect(() => {
    const handleBookmarkChange = () => {
      // Refresh favorites when bookmark status changes
      fetchFavoriteJobs();
    };

    const handleFocusChange = () => {
      // Refresh when window gains focus
      fetchFavoriteJobs();
    };

    // Listen for custom bookmark events
    window.addEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
    window.addEventListener('focus', handleFocusChange);

    return () => {
      window.removeEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
      window.removeEventListener('focus', handleFocusChange);
    };
  }, []);

  // Calculate match scores when favorite jobs are loaded or CV is selected
  useEffect(() => {
    if (selectedCVId && filteredJobs.length > 0) {
      calculateAIMatchScoresForFavoriteJobs(selectedCVId);
    }
  }, [selectedCVId, filteredJobs.length]);

  // Apply filters and search whenever they change
  useEffect(() => {
    let filtered = [...favoriteJobs];

    // Apply search query
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        job.location.toLowerCase().includes(searchTerm) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply location filter
    if (location.trim()) {
      const locationFilter = location.toLowerCase();
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter)
      );
    }

    // Apply employment type filter
    if (filters.employmentType.length > 0) {
      filtered = filtered.filter(job => 
        filters.employmentType.includes(job.type.toLowerCase()) ||
        filters.employmentType.includes(job.employment_type?.toLowerCase() || '')
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(job =>
        job.tags.some(tag => filters.categories.includes(tag.toLowerCase()))
      );
    }

    // Sort by selected option
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.saved_at || '').getTime() - new Date(a.saved_at || '').getTime();
        case 'oldest':
          return new Date(a.saved_at || '').getTime() - new Date(b.saved_at || '').getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'company':
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1, total: filtered.length }));
  }, [searchQuery, location, filters, favoriteJobs, sortBy]);

  const toggleSavedJob = async (jobId: string) => {
    try {
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token || !isTokenValid(token)) {
        alert('Please login to manage your saved jobs');
        return;
      }

      const response = await candidateApi.removeJobFromFavorites(jobId);
      if (response.success) {
        // Refresh the favorites list
        fetchFavoriteJobs();
        console.log(`Job removed from favorites`);
        
        // Emit event to sync with other components
        window.dispatchEvent(new CustomEvent('bookmarkChanged', {
          detail: { jobId, isBookmarked: false }
        }));
      } else {
        console.error(`Failed to remove job ${jobId} from favorites:`, response.message);
        alert('Failed to remove job from favorites. Please try again.');
      }
    } catch (error: any) {
      console.error(`Failed to remove job ${jobId} from favorites:`, error);
      alert('Failed to remove job from favorites. Please try again.');
    }
  };

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

  const JobCard = ({ job }: { job: Job }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer text-left"
      onClick={() => onJobClick?.(job.job_id)}
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
          onClick={(e) => {
            e.stopPropagation();
            toggleSavedJob(job.job_id);
          }}
          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
          title="Remove from favorites"
        >
          <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
          {job.type}
        </span>
        
        {/* AI Match Score Tag */}
        {selectedCVId && job.aiMatchScore !== undefined && (
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
            job.aiMatchScore >= 80 
              ? 'bg-green-100 text-green-700'
              : job.aiMatchScore >= 70 
              ? 'bg-blue-100 text-blue-700' 
              : job.aiMatchScore >= 60 
              ? 'bg-yellow-100 text-yellow-700'
              : job.aiMatchScore >= 50 
              ? 'bg-orange-100 text-orange-700'
              : 'bg-red-100 text-red-700'
          }`}>
            Match: {job.aiMatchScore}%
          </span>
        )}
        
        {/* Calculating Match Tag */}
        {selectedCVId && job.isCalculatingMatch && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
            <svg className="animate-spin h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Calculating Match...
          </span>
        )}
        
        {/* Other tags (filter out old Match tags) */}
        {job.tags.filter(tag => !tag.includes('Match:')).map((tag, index) => (
          <span 
            key={`${job.job_id}-tag-${index}`}
            className="px-3 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="text-sm text-gray-500">
            {job.applied} applied of {job.capacity} capacity
          </div>
          {job.salary && (
            <div className="text-sm font-medium text-gray-900 mt-1">
              {job.salary}
            </div>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onJobClick?.(job.job_id);
          }}
          className="bg-[#007BFF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0056b3] transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );

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
                
                <button className="bg-[#007BFF] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0056b3] transition-colors">
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
              {/* Favorite Jobs Section */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Favorite Jobs</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredJobs.length > 0 
                        ? `Showing ${Math.min(pagination.limit, filteredJobs.length - (pagination.page - 1) * pagination.limit)} of ${filteredJobs.length} saved jobs`
                        : favoriteJobs.length > 0 
                          ? `${favoriteJobs.length} saved jobs (filtered results: 0)`
                          : 'No saved jobs yet'
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 ml-auto">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Sort by:</span>
                      <select 
                        className="w-40 text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title' | 'company')}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title">Job Title (A-Z)</option>
                        <option value="company">Company (A-Z)</option>
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
                  {error ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : filteredJobs.length > 0 ? (
                    filteredJobs
                      .slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)
                      .map((job) => (
                        <JobCard key={job.job_id} job={job} />
                      ))
                  ) : favoriteJobs.length > 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs match your filters</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No favorite jobs yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start by clicking the bookmark icon on jobs you're interested in
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination - Only show if there are more than 5 jobs */}
              {filteredJobs.length > pagination.limit && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, Math.ceil(filteredJobs.length / pagination.limit)) }, (_, i) => {
                    const totalPages = Math.ceil(filteredJobs.length / pagination.limit);
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`w-8 h-8 rounded font-medium ${
                          pageNum === pagination.page
                            ? 'bg-[#007BFF] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {Math.ceil(filteredJobs.length / pagination.limit) > 5 && pagination.page < Math.ceil(filteredJobs.length / pagination.limit) - 2 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.ceil(filteredJobs.length / pagination.limit) }))}
                        className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        {Math.ceil(filteredJobs.length / pagination.limit)}
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(Math.ceil(filteredJobs.length / pagination.limit), prev.page + 1) }))}
                    disabled={pagination.page === Math.ceil(filteredJobs.length / pagination.limit)}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
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

export default FavoriteJobs; 