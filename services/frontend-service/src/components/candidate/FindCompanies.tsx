import { useState } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';

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

interface FindCompaniesProps {
  onCompanyClick?: (companyId: string) => void;
}

export const FindCompanies: React.FC<FindCompaniesProps> = ({ onCompanyClick }) => {
  const [searchQuery, setSearchQuery] = useState('Fintech');
  const [location, setLocation] = useState('Florence, Italy');
  const [savedCompanies, setSavedCompanies] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    industry: [] as string[],
    companySize: [] as string[]
  });
  const [collapsedSections, setCollapsedSections] = useState({
    industry: false,
    companySize: false
  });

  const companies: Company[] = [
    {
      id: 1,
      name: 'Stripe',
      description: 'Stripe is a software platform for starting and running internet businesses. Millions of businesses rely on Stripe\'s software tools...',
      logo: 'S',
      logoColor: 'bg-[#007BFF] text-white',
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
    },
    {
      id: 7,
      name: 'Revolut',
      description: 'When Revolut was founded in 2015, we had a vision to build a sustainable, digital alternative to traditional big banks.',
      logo: 'R',
      logoColor: 'bg-gray-800 text-white',
      jobs: 7,
      tags: ['Business']
    },
    {
      id: 8,
      name: 'Divvy',
      description: 'Divvy is a secure financial platform for businesses to manage payments and subscriptions.',
      logo: 'D',
      logoColor: 'bg-black text-white',
      jobs: 7,
      tags: ['Business', 'Blockchain']
    }
  ];

  const toggleSavedCompany = (companyId: number) => {
    setSavedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
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
      <label className="flex-1 text-sm text-gray-700 cursor-pointer text-left" onClick={onChange}>
        {label}
      </label>
      {count && <span className="text-sm text-gray-500">({count})</span>}
    </div>
  );

  const CompanyCard = ({ company }: { company: Company }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer text-left"
      onClick={() => onCompanyClick?.(company.id.toString())}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${company.logoColor}`}>
            {company.logo}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors">
              {company.name}
            </h3>
            <p className="text-sm text-[#007BFF]">{company.jobs} Jobs</p>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleSavedCompany(company.id);
          }}
          className={`text-gray-400 hover:text-red-500 transition-colors ${
            savedCompanies.includes(company.id) ? 'text-red-500' : ''
          }`}
        >
          <svg className="w-5 h-5" fill={savedCompanies.includes(company.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
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
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Find your <span className="text-[#007BFF] relative inline-block">
                  dream companies
                  <img 
                    src={GroupUnderline} 
                    alt="underline" 
                    className="absolute -bottom-6 left-0 w-full h-6 object-contain transform scale-125"
                  />
                </span>
              </h1>
              <p className="text-gray-600 mt-4">
                Find the dream companies you dream work for
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
                    placeholder="Company name or keyword"
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
              <span className="text-gray-800">Twitter, Microsoft, Apple, Facebook</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div className="w-80 bg-white rounded-lg p-6 h-fit text-left">
              {/* Industry */}
              <div className="mb-6">
                <h3 
                  className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer hover:text-[#007BFF] transition-colors"
                  onClick={() => toggleSection('industry')}
                >
                  Industry
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${collapsedSections.industry ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
                {!collapsedSections.industry && (
                <div className="space-y-1">
                  <FilterCheckbox 
                    label="Advertising" 
                    count={43}
                    checked={filters.industry.includes('advertising')}
                    onChange={() => handleFilterChange('industry', 'advertising')}
                  />
                  <FilterCheckbox 
                    label="Business Service" 
                    count={4}
                    checked={filters.industry.includes('business-service')}
                    onChange={() => handleFilterChange('industry', 'business-service')}
                  />
                  <FilterCheckbox 
                    label="Blockchain" 
                    count={5}
                    checked={filters.industry.includes('blockchain')}
                    onChange={() => handleFilterChange('industry', 'blockchain')}
                  />
                  <FilterCheckbox 
                    label="Cloud" 
                    count={15}
                    checked={filters.industry.includes('cloud')}
                    onChange={() => handleFilterChange('industry', 'cloud')}
                  />
                  <FilterCheckbox 
                    label="Consumer Tech" 
                    count={6}
                    checked={filters.industry.includes('consumer-tech')}
                    onChange={() => handleFilterChange('industry', 'consumer-tech')}
                  />
                  <FilterCheckbox 
                    label="Education" 
                    count={34}
                    checked={filters.industry.includes('education')}
                    onChange={() => handleFilterChange('industry', 'education')}
                  />
                  <FilterCheckbox 
                    label="Fintech" 
                    count={45}
                    checked={filters.industry.includes('fintech')}
                    onChange={() => handleFilterChange('industry', 'fintech')}
                  />
                  <FilterCheckbox 
                    label="Gaming" 
                    count={35}
                    checked={filters.industry.includes('gaming')}
                    onChange={() => handleFilterChange('industry', 'gaming')}
                  />
                  <FilterCheckbox 
                    label="Food & Beverage" 
                    count={5}
                    checked={filters.industry.includes('food-beverage')}
                    onChange={() => handleFilterChange('industry', 'food-beverage')}
                  />
                  <FilterCheckbox 
                    label="Healthcare" 
                    count={3}
                    checked={filters.industry.includes('healthcare')}
                    onChange={() => handleFilterChange('industry', 'healthcare')}
                  />
                  <FilterCheckbox 
                    label="Hosting" 
                    count={5}
                    checked={filters.industry.includes('hosting')}
                    onChange={() => handleFilterChange('industry', 'hosting')}
                  />
                  <FilterCheckbox 
                    label="Media" 
                    count={4}
                    checked={filters.industry.includes('media')}
                    onChange={() => handleFilterChange('industry', 'media')}
                  />
                </div>
                )}
              </div>

              {/* Company Size */}
              <div className="mb-6">
                <h3 
                  className="font-semibold text-gray-900 mb-4 flex items-center justify-between cursor-pointer hover:text-[#007BFF] transition-colors"
                  onClick={() => toggleSection('companySize')}
                >
                  Company Size
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${collapsedSections.companySize ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
                {!collapsedSections.companySize && (
                <div className="space-y-1">
                  <FilterCheckbox 
                    label="1-50" 
                    count={25}
                    checked={filters.companySize.includes('1-50')}
                    onChange={() => handleFilterChange('companySize', '1-50')}
                  />
                  <FilterCheckbox 
                    label="51-150" 
                    count={57}
                    checked={filters.companySize.includes('51-150')}
                    onChange={() => handleFilterChange('companySize', '51-150')}
                  />
                  <FilterCheckbox 
                    label="151-250" 
                    count={45}
                    checked={filters.companySize.includes('151-250')}
                    onChange={() => handleFilterChange('companySize', '151-250')}
                  />
                  <FilterCheckbox 
                    label="251-500" 
                    count={4}
                    checked={filters.companySize.includes('251-500')}
                    onChange={() => handleFilterChange('companySize', '251-500')}
                  />
                  <FilterCheckbox 
                    label="501-1000" 
                    count={43}
                    checked={filters.companySize.includes('501-1000')}
                    onChange={() => handleFilterChange('companySize', '501-1000')}
                  />
                  <FilterCheckbox 
                    label="1000 - above" 
                    count={25}
                    checked={filters.companySize.includes('1000+')}
                    onChange={() => handleFilterChange('companySize', '1000+')}
                  />
                </div>
                )}
              </div>
            </div>

            {/* Company Listings */}
            <div className="flex-1 text-left">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">All Companies</h2>
                  <p className="text-sm font-normal text-gray-500">Showing 73 results</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select className="w-40 text-sm border border-gray-300 rounded px-3 py-1">
                      <option>Most relevant</option>
                      <option>Newest</option>
                      <option>Company Size</option>
                      <option>Most Jobs</option>
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

              {/* Company Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">1</button>
                <button className="w-8 h-8 bg-[#007BFF] text-white rounded font-medium">2</button>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">3</button>
                <span className="text-gray-400">...</span>
                <button className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">10</button>
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
    </>
  );
};

export default FindCompanies; 