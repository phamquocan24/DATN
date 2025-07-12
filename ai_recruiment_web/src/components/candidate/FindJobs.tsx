import { useState } from 'react';
import { Footer } from './Footer';
import { JobApplication } from './JobApplication';
import GroupUnderline from '../../assets/Group.png';

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

interface FindJobsProps {
  onJobClick?: (jobId: string) => void;
}

export const FindJobs: React.FC<FindJobsProps> = ({ onJobClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Florence, Italy');
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
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
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsApplicationOpen(true);
  };

  const handleCloseApplication = () => {
    setIsApplicationOpen(false);
    setSelectedJob(null);
  };

  const jobs: Job[] = [
    {
      id: 1,
      title: 'Social Media Assistant',
      company: 'Nomad',
      location: 'Paris, France',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 87%'],
      logo: 'N',
      logoColor: 'bg-green-500 text-white',
      match: 87,
      applied: 5,
      capacity: 10,
      isNew: true
    },
    {
      id: 2,
      title: 'Interactive Developer',
      company: 'Terraform',
      location: 'Hamburg, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 100%'],
      logo: 'T',
      logoColor: 'bg-[#007BFF] text-white',
      match: 100,
      applied: 8,
      capacity: 12
    },
    {
      id: 3,
      title: 'Email Marketing',
      company: 'Revolut',
      location: 'Madrid, Spain',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 90%'],
      logo: 'R',
      logoColor: 'bg-black text-white',
      match: 90,
      applied: 0,
      capacity: 10
    },
    {
      id: 4,
      title: 'Product Designer',
      company: 'ClassPass',
      location: 'Berlin, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 87%'],
      logo: 'C',
      logoColor: 'bg-[#007BFF] text-white',
      match: 87,
      applied: 5,
      capacity: 10
    },
    {
      id: 5,
      title: 'Customer Manager',
      company: 'Pitch',
      location: 'Berlin, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 89%'],
      logo: 'P',
      logoColor: 'bg-black text-white',
      match: 89,
      applied: 5,
      capacity: 10
    },
    {
      id: 6,
      title: 'Social Media Assistant',
      company: 'Nomad',
      location: 'Paris, France',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 87%'],
      logo: 'N',
      logoColor: 'bg-green-500 text-white',
      match: 87,
      applied: 5,
      capacity: 10
    },
    {
      id: 7,
      title: 'Brand Designer',
      company: 'Dropbox',
      location: 'San Francisco, USA',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 95%'],
      logo: 'D',
      logoColor: 'bg-[#007BFF] text-white',
      match: 95,
      applied: 2,
      capacity: 10
    },
    {
      id: 8,
      title: 'Interactive Developer',
      company: 'Terraform',
      location: 'Hamburg, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 88%'],
      logo: 'T',
      logoColor: 'bg-[#007BFF] text-white',
      match: 88,
      applied: 8,
      capacity: 12
    },
    {
      id: 9,
      title: 'Email Marketing',
      company: 'Revolut',
      location: 'Madrid, Spain',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 90%'],
      logo: 'R',
      logoColor: 'bg-black text-white',
      match: 90,
      applied: 0,
      capacity: 10
    },
    {
      id: 10,
      title: 'Lead Engineer',
      company: 'Canva',
      location: 'Ankara, Turkey',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Match: 77%'],
      logo: 'C',
      logoColor: 'bg-teal-500 text-white',
      match: 77,
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
      <label className="flex-1 text-sm text-gray-700 cursor-pointer" onClick={onChange}>
        {label}
      </label>
      {count && <span className="text-sm text-gray-500">({count})</span>}
    </div>
  );

  const JobCard = ({ job, onApply }: { job: Job, onApply: (job: Job) => void }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer"
      onClick={() => onJobClick?.(job.id.toString())}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${job.logoColor}`}>
            {job.logo}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500">{job.company} • {job.location}</p>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleSavedJob(job.id);
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-5 h-5" fill={savedJobs.includes(job.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
          {job.type}
        </span>
        {job.tags.map((tag, index) => (
          <span 
            key={index} 
            className={`px-3 py-1 text-xs rounded-full font-medium ${
              tag.includes('Match:') 
                ? 'bg-[#007BFF]/10 text-[#007BFF]' 
                : 'bg-yellow-100 text-yellow-700'
            }`}
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
            onApply(job);
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
            <div className="text-center text-sm text-gray-600">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">UI Designer, UX Researcher, Android, Admin</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div className="w-80 bg-white rounded-lg p-6 h-fit">
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
            <div className="flex-1">
              {/* New Jobs Section */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">New Jobs</h2>
                    <p className="text-sm text-gray-500 mt-1">Showing 73 results</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Sort by:</span>
                      <select className="text-sm border border-gray-300 rounded px-3 py-1">
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
                  {jobs.slice(0, 5).map((job) => (
                    <JobCard key={job.id} job={job} onApply={handleApplyClick} />
                  ))}
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="w-8 h-8 bg-[#007BFF] text-white rounded font-medium">1</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">2</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">3</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">4</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">5</button>
                <span className="text-gray-400">...</span>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">33</button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Suitable Jobs Section */}
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Suitable Jobs</h2>
                    <p className="text-sm text-gray-500 mt-1">Showing 73 results</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Sort by:</span>
                      <select className="text-sm border border-gray-300 rounded px-3 py-1">
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
                  {jobs.slice(5, 10).map((job) => (
                    <JobCard key={job.id} job={job} onApply={handleApplyClick} />
                  ))}
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="w-8 h-8 bg-[#007BFF] text-white rounded font-medium">1</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">2</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">3</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">4</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">5</button>
                <span className="text-gray-400">...</span>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">33</button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Job Application Modal */}
      {selectedJob && (
        <JobApplication 
          isOpen={isApplicationOpen}
          onClose={handleCloseApplication}
          job={{
            id: selectedJob.id,
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

export default FindJobs; 