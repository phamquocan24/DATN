import React, { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';

interface Company {
  id: number;
  name: string;
  description: string;
  logo: string;
  logoColor: string;
  jobs: number;
  tags: string[];
  isSaved?: boolean;
}

interface BrowseCompaniesProps {
  onCompanyClick?: (companyId: string) => void;
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onAgentAIClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onFindJobsClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

export const BrowseCompanies: React.FC<BrowseCompaniesProps> = ({
  onCompanyClick,
  onHomeClick,
  onDashboardClick,
  onAgentAIClick,
  onMyApplicationsClick,
  onTestManagementClick,
  onFindJobsClick,
  onProfileClick,
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [searchQuery, setSearchQuery] = useState('Company title or keyword');
  const [location, setLocation] = useState('Florence, Italy');
  const [sortBy, setSortBy] = useState('Most relevant');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('browse-companies');
  const [isFilterVisible, setIsFilterVisible] = useState(false); // Default hidden

  // Company-specific filters
  const [filters, setFilters] = useState({
    industry: [] as string[],
    companySize: ['251-500'] as string[],
    companyType: [] as string[],
    location: [] as string[]
  });

  // Collapsible filter sections state
  const [collapsedSections, setCollapsedSections] = useState({
    industry: false,
    companySize: false,
    companyType: false,
    location: false
  });



  const companies: Company[] = [
    {
      id: 1,
      name: 'Stripe',
      description: 'Stripe is a software platform for starting and running internet businesses. Millions of businesses rely on Stripe\'s software tools...',
      logo: 'S',
      logoColor: 'bg-[#635BFF] text-white',
      jobs: 7,
      tags: ['Business', 'Payment gateway']
    },
    {
      id: 2,
      name: 'Truebill',
      description: 'Take control of your money. Truebill develops a mobile app that helps consumers take control of their financial...',
      logo: 'T',
      logoColor: 'bg-[#007BFF] text-white',
      jobs: 7,
      tags: ['Business']
    },
    {
      id: 3,
      name: 'Square',
      description: 'Square builds common business tools in unconventional ways so more people can start, run, and grow their businesses.',
      logo: 'S',
      logoColor: 'bg-black text-white',
      jobs: 7,
      tags: ['Business', 'Blockchain']
    },
    {
      id: 4,
      name: 'Coinbase',
      description: 'Coinbase is a digital currency wallet and platform where merchants and consumers can transact with new digital currencies.',
      logo: 'C',
      logoColor: 'bg-[#007BFF] text-white',
      jobs: 7,
      tags: ['Business', 'Blockchain']
    },
    {
      id: 5,
      name: 'Robinhood',
      description: 'Robinhood is lowering barriers, removing fees, and providing greater access to financial information.',
      logo: 'R',
      logoColor: 'bg-black text-white',
      jobs: 7,
      tags: ['Business']
    },
    {
      id: 6,
      name: 'Kraken',
      description: 'Based in San Francisco, Kraken is the world\'s largest global bitcoin exchange in euro volume and liquidity.',
      logo: 'K',
      logoColor: 'bg-purple-600 text-white',
      jobs: 7,
      tags: ['Business', 'Blockchain']
    }
  ];

  const industries = [
    { name: 'Advertising', count: 43 },
    { name: 'Business Service', count: 4 },
    { name: 'Blockchain', count: 5 },
    { name: 'Cloud', count: 15 },
    { name: 'Consumer Tech', count: 5 },
    { name: 'Education', count: 34 },
    { name: 'Fintech', count: 45 },
    { name: 'Gaming', count: 33 },
    { name: 'Food & Beverage', count: 5 },
    { name: 'Healthcare', count: 3 },
    { name: 'Hostinng', count: 5 },
    { name: 'Media', count: 4 }
  ];

  const companySizes = [
    { name: '1-50', count: 25 },
    { name: '51-150', count: 57 },
    { name: '151-250', count: 45 },
    { name: '251-500', count: 4 },
    { name: '501-1000', count: 43 },
    { name: '1000 - above', count: 23 }
  ];



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
    <div className="flex items-center space-x-3 py-1.5">
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

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    sectionKey: keyof typeof collapsedSections; 
    children: React.ReactNode; 
  }) => (
    <div className="mb-6">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full mb-3 text-left"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            collapsedSections[sectionKey] ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsedSections[sectionKey] && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const CompanyCard = ({ company }: { company: Company }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer text-left"
      onClick={() => onCompanyClick?.(company.id.toString())}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${company.logoColor}`}>
            {company.logo}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors">
              {company.name}
            </h3>
            <p className="text-sm text-[#007BFF]">{company.jobs} Jobs</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {company.description}
      </p>

      <div className="flex items-center flex-wrap gap-2">
        {company.tags.map((tag, index) => (
          <span 
            key={index} 
            className={`px-3 py-1 text-xs rounded-full font-medium ${
              tag === 'Business' 
                ? 'bg-green-100 text-green-700' 
                : tag === 'Payment gateway'
                ? 'bg-[#007BFF]/10 text-[#007BFF]'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab}
        onDashboardClick={onDashboardClick}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={onTestManagementClick}
        onFindJobsClick={onFindJobsClick}
        onBrowseCompaniesClick={() => setActiveTab('browse-companies')}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpCenterClick={onHelpCenterClick}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Browse Companies</h1>
                                  <button 
              onClick={onHomeClick}
              className="px-4 py-2 text-[#007BFF] hover:text-white font-medium border border-[#007BFF] rounded-lg hover:bg-[#007BFF] transition-colors"
            >
              Back to homepage
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Company title or keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
              />
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent appearance-none bg-white"
              >
                <option value="Florence, Italy">Florence, Italy</option>
                <option value="New York, USA">New York, USA</option>
                <option value="London, UK">London, UK</option>
              </select>
            </div>
            <button className="px-6 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors">
              Search
            </button>
          </div>
          
          <div className="text-sm text-gray-600 text-left">
            Popular: <span className="text-[#007BFF]">Twitter, Microsoft, Apple, Facebook</span>
          </div>
        </div>

        <div className="flex">
          {/* Filters Sidebar */}
          <div className={`${isFilterVisible ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white shadow-sm border-r border-gray-200`}>
            <div className="w-80 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Industry */}
                <FilterSection title="Industry" sectionKey="industry">
                  {industries.map((industry) => (
                    <FilterCheckbox
                      key={industry.name}
                      label={industry.name}
                      count={industry.count}
                      checked={filters.industry.includes(industry.name)}
                      onChange={() => handleFilterChange('industry', industry.name)}
                    />
                  ))}
                </FilterSection>

                {/* Company Size */}
                <FilterSection title="Company Size" sectionKey="companySize">
                  {companySizes.map((size) => (
                    <FilterCheckbox
                      key={size.name}
                      label={size.name}
                      count={size.count}
                      checked={filters.companySize.includes(size.name)}
                      onChange={() => handleFilterChange('companySize', size.name)}
                    />
                  ))}
                </FilterSection>

                {/* Company Type */}
                <FilterSection title="Company Type" sectionKey="companyType">
                  <FilterCheckbox
                    label="Startup"
                    count={15}
                    checked={filters.companyType.includes('Startup')}
                    onChange={() => handleFilterChange('companyType', 'Startup')}
                  />
                  <FilterCheckbox
                    label="Scale-up"
                    count={8}
                    checked={filters.companyType.includes('Scale-up')}
                    onChange={() => handleFilterChange('companyType', 'Scale-up')}
                  />
                  <FilterCheckbox
                    label="Enterprise"
                    count={12}
                    checked={filters.companyType.includes('Enterprise')}
                    onChange={() => handleFilterChange('companyType', 'Enterprise')}
                  />
                  <FilterCheckbox
                    label="Public Company"
                    count={20}
                    checked={filters.companyType.includes('Public Company')}
                    onChange={() => handleFilterChange('companyType', 'Public Company')}
                  />
                  <FilterCheckbox
                    label="Non-profit"
                    count={3}
                    checked={filters.companyType.includes('Non-profit')}
                    onChange={() => handleFilterChange('companyType', 'Non-profit')}
                  />
                </FilterSection>

                {/* Location */}
                <FilterSection title="Location" sectionKey="location">
                  <FilterCheckbox
                    label="Remote"
                    count={25}
                    checked={filters.location.includes('Remote')}
                    onChange={() => handleFilterChange('location', 'Remote')}
                  />
                  <FilterCheckbox
                    label="United States"
                    count={35}
                    checked={filters.location.includes('United States')}
                    onChange={() => handleFilterChange('location', 'United States')}
                  />
                  <FilterCheckbox
                    label="Europe"
                    count={28}
                    checked={filters.location.includes('Europe')}
                    onChange={() => handleFilterChange('location', 'Europe')}
                  />
                  <FilterCheckbox
                    label="Asia"
                    count={12}
                    checked={filters.location.includes('Asia')}
                    onChange={() => handleFilterChange('location', 'Asia')}
                  />
                  <FilterCheckbox
                    label="Canada"
                    count={8}
                    checked={filters.location.includes('Canada')}
                    onChange={() => handleFilterChange('location', 'Canada')}
                  />
                </FilterSection>
              </div>
            </div>
          </div>

          {/* Results - remove old filters sidebar */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">All Companies</h2>
                <span className="text-gray-500 text-sm">Showing 73 results</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                >
                  <option value="Most relevant">Most relevant</option>
                  <option value="Newest">Newest</option>
                  <option value="Oldest">Oldest</option>
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
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${viewMode === 'list' ? 'text-[#007BFF] bg-blue-50' : 'text-gray-500 hover:bg-gray-100'} rounded-l-lg`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${viewMode === 'grid' ? 'text-[#007BFF] bg-blue-50' : 'text-gray-500 hover:bg-gray-100'} border-l border-gray-300 rounded-r-lg`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l3-3 3 3v13M9 19h6M9 19l-3-3h3v-2h6v2h3l-3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="px-3 py-1 bg-[#007BFF] text-white rounded">1</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">2</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">3</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">4</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">5</button>
              <span className="px-3 py-1 text-gray-400">...</span>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">33</button>
              <button className="p-2 text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseCompanies; 