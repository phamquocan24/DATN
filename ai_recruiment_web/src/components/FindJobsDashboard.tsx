import React, { useState } from 'react';
import Avatar from '../assets/Avatar17.png';
import JobDetail from './JobDetail';

interface Job {
  id: number;
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
}

interface FindJobsDashboardProps {
  onProfileClick?: () => void;
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onAgentAIClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onBrowseCompaniesClick?: () => void;
}

export const FindJobsDashboard: React.FC<FindJobsDashboardProps> = ({ 
  onProfileClick, 
  onHomeClick, 
  onDashboardClick,
  onAgentAIClick,
  onMyApplicationsClick,
  onTestManagementClick,
  onBrowseCompaniesClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Florence, Italy');
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    employmentType: [] as string[],
    categories: ['Business', 'Technology'] as string[],
    jobLevel: ['Director'] as string[],
    salaryRange: ['$3000 or above'] as string[]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('find-jobs');
  const [isFilterVisible, setIsFilterVisible] = useState(false); // Default hidden
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Collapsible filter sections state
  const [collapsedSections, setCollapsedSections] = useState({
    employmentType: false,
    categories: false,
    jobLevel: false,
    salaryRange: false
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'agent-ai', label: 'Agent AI', icon: '🤖' },
    { id: 'applications', label: 'My Applications', icon: '📄' },
    { id: 'test-management', label: 'Test Management', icon: '📝' },
    { id: 'find-jobs', label: 'Find Jobs', icon: '🔍' },
    { id: 'browse-companies', label: 'Browse Companies', icon: '🏢' },
    { id: 'public-profile', label: 'My Public Profile', icon: '👤' },
  ];

  const jobs: Job[] = [
    {
      id: 1,
      title: 'Social Media Assistant',
      company: 'Nomad',
      location: 'Paris, France',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 90%'],
      logo: 'N',
      logoColor: 'bg-green-500 text-white',
      match: 90,
      applied: 5,
      capacity: 10
    },
    {
      id: 2,
      title: 'Brand Designer',
      company: 'Dropbox',
      location: 'San Francisco, USA',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 42%'],
      logo: 'D',
      logoColor: 'bg-[#007BFF] text-white',
      match: 42,
      applied: 2,
      capacity: 10
    },
    {
      id: 3,
      title: 'Interactive Developer',
      company: 'Terraform',
      location: 'Hamburg, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 98%'],
      logo: 'T',
      logoColor: 'bg-[#007BFF] text-white',
      match: 98,
      applied: 8,
      capacity: 12
    },
    {
      id: 4,
      title: 'Email Marketing',
      company: 'Revolut',
      location: 'Madrid, Spain',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 55%'],
      logo: 'R',
      logoColor: 'bg-black text-white',
      match: 55,
      applied: 0,
      capacity: 10
    },
    {
      id: 5,
      title: 'Lead Engineer',
      company: 'Canva',
      location: 'Ankara, Turkey',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 57%'],
      logo: 'C',
      logoColor: 'bg-teal-500 text-white',
      match: 57,
      applied: 5,
      capacity: 10
    },
    {
      id: 6,
      title: 'Product Designer',
      company: 'ClassPass',
      location: 'Berlin, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 88%'],
      logo: 'C',
      logoColor: 'bg-[#007BFF] text-white',
      match: 88,
      applied: 5,
      capacity: 10
    },
    {
      id: 7,
      title: 'Customer Manager',
      company: 'Pitch',
      location: 'Berlin, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 30%'],
      logo: 'P',
      logoColor: 'bg-black text-white',
      match: 30,
      applied: 5,
      capacity: 10
    }
  ];

  const toggleSavedJob = (jobId: number) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
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

  const handleMenuClick = (itemId: string) => {
    setActiveTab(itemId);
    
    // Handle navigation based on menu item
    if (itemId === 'dashboard' && onDashboardClick) {
      onDashboardClick();
    } else if (itemId === 'public-profile' && onProfileClick) {
      onProfileClick();
    } else if (itemId === 'agent-ai' && onAgentAIClick) {
      onAgentAIClick();
    } else if (itemId === 'applications' && onMyApplicationsClick) {
      onMyApplicationsClick();
    } else if (itemId === 'test-management' && onTestManagementClick) {
      onTestManagementClick();
    } else if (itemId === 'browse-companies' && onBrowseCompaniesClick) {
      onBrowseCompaniesClick();
    }
    // For find-jobs, stay in current component
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setCurrentView('detail');
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
    <div className="flex items-center space-x-3 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-[#007BFF] border-gray-300 rounded focus:ring-[#007BFF] focus:ring-2"
      />
      <label className="text-gray-700 text-sm flex-1">
        {label} {count && <span className="text-gray-500">({count})</span>}
      </label>
    </div>
  );

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    sectionKey: keyof typeof collapsedSections; 
    children: React.ReactNode; 
  }) => (
    <div className="border-b border-gray-200 pb-6">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between mb-4 focus:outline-none"
      >
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            collapsedSections[sectionKey] ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${
        collapsedSections[sectionKey] ? 'max-h-0' : 'max-h-96'
      }`}>
        <div className="space-y-1">
          {children}
        </div>
      </div>
    </div>
  );

  const JobCard = ({ job }: { job: Job }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div 
          className="flex items-start space-x-4 flex-1 cursor-pointer"
          onClick={() => handleJobClick(job)}
        >
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${job.logoColor} text-lg font-semibold`}>
            {job.logo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1 hover:text-[#007BFF] transition-colors">{job.title}</h3>
            <p className="text-gray-600 mb-3">{job.company} • {job.location}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {job.type}
              </span>
              {job.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tag.includes('Match:') 
                      ? `bg-orange-100 text-orange-700` 
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="text-sm text-gray-500">
              {job.applied} applied of {job.capacity} capacity
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSavedJob(job.id);
            }}
            className={`p-2 rounded-lg transition-colors ${
              savedJobs.includes(job.id) 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleJobClick(job);
            }}
            className="px-6 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - synced with Profile */}
      <div className="w-64 bg-white shadow-lg">
        {/* Menu Items */}
        <nav className="p-4 pt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left mb-1 transition-all ${
                activeTab === item.id
                  ? 'bg-[#007BFF] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 text-left">
            SETTINGS
          </h3>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-left">
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-left">
            <span>❓</span>
            <span>Help Center</span>
          </button>
          
          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-3">
            <img src={Avatar} alt="User" className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium text-sm">Jake Gyll</p>
              <p className="text-gray-500 text-xs">jakegyll@email.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Filters Sidebar */}
        <div className={`${isFilterVisible ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white shadow-sm border-r border-gray-200`}>
          <div className="w-80 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Type of Employment */}
              <FilterSection title="Type of Employment" sectionKey="employmentType">
                <FilterCheckbox
                  label="Full-time"
                  count={3}
                  checked={filters.employmentType.includes('Full-time')}
                  onChange={() => handleFilterChange('employmentType', 'Full-time')}
                />
                <FilterCheckbox
                  label="Part-Time"
                  count={5}
                  checked={filters.employmentType.includes('Part-Time')}
                  onChange={() => handleFilterChange('employmentType', 'Part-Time')}
                />
                <FilterCheckbox
                  label="Remote"
                  count={2}
                  checked={filters.employmentType.includes('Remote')}
                  onChange={() => handleFilterChange('employmentType', 'Remote')}
                />
                <FilterCheckbox
                  label="Internship"
                  count={24}
                  checked={filters.employmentType.includes('Internship')}
                  onChange={() => handleFilterChange('employmentType', 'Internship')}
                />
                <FilterCheckbox
                  label="Contract"
                  count={3}
                  checked={filters.employmentType.includes('Contract')}
                  onChange={() => handleFilterChange('employmentType', 'Contract')}
                />
              </FilterSection>

              {/* Categories */}
              <FilterSection title="Categories" sectionKey="categories">
                <FilterCheckbox
                  label="Design"
                  count={24}
                  checked={filters.categories.includes('Design')}
                  onChange={() => handleFilterChange('categories', 'Design')}
                />
                <FilterCheckbox
                  label="Sales"
                  count={3}
                  checked={filters.categories.includes('Sales')}
                  onChange={() => handleFilterChange('categories', 'Sales')}
                />
                <FilterCheckbox
                  label="Marketing"
                  count={3}
                  checked={filters.categories.includes('Marketing')}
                  onChange={() => handleFilterChange('categories', 'Marketing')}
                />
                <FilterCheckbox
                  label="Business"
                  count={3}
                  checked={filters.categories.includes('Business')}
                  onChange={() => handleFilterChange('categories', 'Business')}
                />
                <FilterCheckbox
                  label="Human Resource"
                  count={6}
                  checked={filters.categories.includes('Human Resource')}
                  onChange={() => handleFilterChange('categories', 'Human Resource')}
                />
                <FilterCheckbox
                  label="Finance"
                  count={4}
                  checked={filters.categories.includes('Finance')}
                  onChange={() => handleFilterChange('categories', 'Finance')}
                />
                <FilterCheckbox
                  label="Engineering"
                  count={4}
                  checked={filters.categories.includes('Engineering')}
                  onChange={() => handleFilterChange('categories', 'Engineering')}
                />
                <FilterCheckbox
                  label="Technology"
                  count={5}
                  checked={filters.categories.includes('Technology')}
                  onChange={() => handleFilterChange('categories', 'Technology')}
                />
              </FilterSection>

              {/* Job Level */}
              <FilterSection title="Job Level" sectionKey="jobLevel">
                <FilterCheckbox
                  label="Entry Level"
                  count={57}
                  checked={filters.jobLevel.includes('Entry Level')}
                  onChange={() => handleFilterChange('jobLevel', 'Entry Level')}
                />
                <FilterCheckbox
                  label="Mid Level"
                  count={3}
                  checked={filters.jobLevel.includes('Mid Level')}
                  onChange={() => handleFilterChange('jobLevel', 'Mid Level')}
                />
                <FilterCheckbox
                  label="Senior Level"
                  count={5}
                  checked={filters.jobLevel.includes('Senior Level')}
                  onChange={() => handleFilterChange('jobLevel', 'Senior Level')}
                />
                <FilterCheckbox
                  label="Director"
                  count={12}
                  checked={filters.jobLevel.includes('Director')}
                  onChange={() => handleFilterChange('jobLevel', 'Director')}
                />
                <FilterCheckbox
                  label="VP or Above"
                  count={8}
                  checked={filters.jobLevel.includes('VP or Above')}
                  onChange={() => handleFilterChange('jobLevel', 'VP or Above')}
                />
              </FilterSection>

              {/* Salary Range */}
              <FilterSection title="Salary Range" sectionKey="salaryRange">
                <FilterCheckbox
                  label="$700 - $1000"
                  count={4}
                  checked={filters.salaryRange.includes('$700 - $1000')}
                  onChange={() => handleFilterChange('salaryRange', '$700 - $1000')}
                />
                <FilterCheckbox
                  label="$100 - $1500"
                  count={6}
                  checked={filters.salaryRange.includes('$100 - $1500')}
                  onChange={() => handleFilterChange('salaryRange', '$100 - $1500')}
                />
                <FilterCheckbox
                  label="$1500 - $2000"
                  count={10}
                  checked={filters.salaryRange.includes('$1500 - $2000')}
                  onChange={() => handleFilterChange('salaryRange', '$1500 - $2000')}
                />
                <FilterCheckbox
                  label="$3000 or above"
                  count={4}
                  checked={filters.salaryRange.includes('$3000 or above')}
                  onChange={() => handleFilterChange('salaryRange', '$3000 or above')}
                />
              </FilterSection>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="flex-1 p-8">
          {/* Conditional rendering based on view */}
          {currentView === 'detail' && selectedJob ? (
            <JobDetail 
              job={selectedJob} 
              onBack={handleBackToList}
            />
          ) : (
            <>
              {/* Header - moved above search bar */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Find Jobs</h1>
                <button 
                  onClick={onHomeClick}
                  className="flex items-center space-x-2 text-[#007BFF] hover:text-[#0056b3] font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to homepage</span>
                </button>
              </div>

          {/* Search Bar */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Job title or keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
              />
            </div>
            <div className="w-80 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent appearance-none"
              >
                <option value="Florence, Italy">Florence, Italy</option>
                <option value="Paris, France">Paris, France</option>
                <option value="Berlin, Germany">Berlin, Germany</option>
                <option value="Madrid, Spain">Madrid, Spain</option>
              </select>
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button className="px-8 py-3 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors font-medium">
              Search
            </button>
          </div>

          {/* Popular searches */}
          <div className="mb-6">
            <span className="text-gray-500 text-sm">Popular: </span>
            <span className="text-[#007BFF] text-sm">UI Designer, UX Researcher, Android, Admin</span>
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">All Jobs</h2>
              <span className="text-gray-500 text-sm">Showing 73 results</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent">
                <option>Most relevant</option>
                <option>Newest</option>
                <option>Salary: High to Low</option>
                <option>Salary: Low to High</option>
              </select>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={isFilterVisible ? 'Hide Filters' : 'Show Filters'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                <div className="flex border border-gray-300 rounded-lg">
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-l-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="p-2 text-[#007BFF] bg-blue-50 border-l border-gray-300 rounded-r-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l3-3 3 3v13M9 19h6M9 19l-3-3h3v-2h6v2h3l-3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-4 mb-8">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

              {/* Pagination */}
              <div className="flex items-center justify-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      currentPage === page
                        ? 'bg-[#007BFF] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <span className="text-gray-500">...</span>
                <button
                  onClick={() => setCurrentPage(33)}
                  className="w-10 h-10 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  33
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(33, prev + 1))}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      

    </div>
  );
};

export default FindJobsDashboard;