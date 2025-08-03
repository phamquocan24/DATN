import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import { CTA } from './CTA';
import GroupUnderline from '../../assets/Group.png';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { companyApi, Company as ApiCompany } from '../../services/companyApi';

interface Company {
  id: number;
  name: string;
  location: string;
  description: string;
  jobs: number;
  logo: string;
  logoColor: string;
  category: string;
  isFavorite?: boolean;
}

interface CompaniesProps {
  onCompanyClick?: (companyId: string) => void;
}

export const Companies: React.FC<CompaniesProps> = ({ onCompanyClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Florence, Italy');
  const [activeCategory, setActiveCategory] = useState('Design');
  const [favoriteCompanies, setFavoriteCompanies] = useState<number[]>([1]);
  const [apiCompanies, setApiCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recommended Companies
  const recommendedCompanies: Company[] = [
    {
      id: 1,
      name: 'Nomad',
      location: 'Paris, France',
      description: 'Nomad is located in Paris, France. Nomad has generated $728.8M in sales (USD).',
      jobs: 3,
      logo: 'N',
      logoColor: 'bg-green-500 text-white',
      category: 'Design',
      isFavorite: true
    },
    {
      id: 2,
      name: 'Discord',
      location: 'San Francisco, USA',
      description: "We'd love to work with someone like you. We care about creating a delightful experience.",
      jobs: 3,
      logo: 'D',
      logoColor: 'bg-purple-500 text-white',
      category: 'Technology'
    },
    {
      id: 3,
      name: 'Maze',
      location: 'Berlin, Germany',
      description: "We're a passionate bunch working from all over the world to build the future of rapid testing together.",
      jobs: 3,
      logo: 'M',
      logoColor: 'bg-[#007BFF] text-white',
      category: 'Design'
    },
    {
      id: 4,
      name: 'Udacity',
      location: 'Mountain View, USA',
      description: 'Udacity is the trusted market leader of online university that teaches the actual programming skills.',
      jobs: 3,
      logo: 'U',
      logoColor: 'bg-[#007BFF] text-white',
      category: 'Education'
    },
    {
      id: 5,
      name: 'Webflow',
      location: 'San Francisco, USA',
      description: 'Webflow is the leading visual development and hosting platform built from the ground up for the mobile age.',
      jobs: 3,
      logo: 'W',
      logoColor: 'bg-[#007BFF] text-white',
      category: 'Technology'
    },
    {
      id: 6,
      name: 'Foundation',
      location: 'New York, USA',
      description: 'Foundation helps creators mint and auction their digital artworks as NFTs on the Ethereum blockchain.',
      jobs: 3,
      logo: 'F',
      logoColor: 'bg-black text-white',
      category: 'Crypto'
    }
  ];

  // Companies by category
  const categories = [
    { name: 'Design', count: 24, active: true },
    { name: 'Fintech', count: 12, active: false },
    { name: 'Hosting', count: 8, active: false },
    { name: 'Business Service', count: 15, active: false },
    { name: 'Development', count: 18, active: false },
    { name: 'Marketing', count: 10, active: false },
    { name: 'Education', count: 22, active: false },
    { name: 'Crypto', count: 7, active: false },
  ];

  const designCompanies = [
    { name: 'Pentagram', logo: 'P', logoColor: 'bg-red-500 text-white', jobs: 3 },
    { name: 'Wolff Olins', logo: 'WO', logoColor: 'bg-black text-white', jobs: 4 },
    { name: 'Clay', logo: 'C', logoColor: 'bg-black text-white', jobs: 3 },
    { name: 'MediaMonks', logo: 'MM', logoColor: 'bg-black text-white', jobs: 5 },
    { name: 'Packer', logo: 'P', logoColor: 'bg-red-400 text-white', jobs: 3 },
    { name: 'Square', logo: 'S', logoColor: 'bg-black text-white', jobs: 3 },
    { name: 'Divy', logo: 'D', logoColor: 'bg-gray-800 text-white', jobs: 3 },
    { name: 'WebFlow', logo: 'W', logoColor: 'bg-[#007BFF] text-white', jobs: 5 }
  ];

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await companyApi.getAllCompanies({
          page: 1,
          limit: 50,
          search: searchQuery || undefined
        });
        
        if (response.success) {
          setApiCompanies(response.data || []);
        } else {
          setError('Failed to fetch companies');
        }
      } catch (err: any) {
        console.error('Error fetching companies:', err);
        setError(err.message || 'An error occurred while fetching companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [searchQuery]);

  const toggleFavorite = (companyId: number) => {
    setFavoriteCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const CompanyCard = ({ company, showDescription = true }: { company: Company, showDescription?: boolean }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer text-left"
      onClick={() => onCompanyClick?.(company.id.toString())}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${company.logoColor}`}>
          {company.logo}
        </div>
        <span className="text-sm text-[#007BFF] bg-[#007BFF]/10 px-3 py-1 rounded-full">
            {company.jobs} Jobs
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors text-lg mb-2">
        {company.name}
      </h3>

      {showDescription && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {company.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium border border-yellow-200">
            Business Service
          </span>
           {company.category !== 'Design' && 
             <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium border border-red-200">
                {company.category}
            </span>
           }
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(company.id);
          }}
          className={`transition-colors ${
            favoriteCompanies.includes(company.id) 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <svg className="w-5 h-5" fill={favoriteCompanies.includes(company.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );

  const SmallCompanyCard = ({ company }: { company: any }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#007BFF]/30 transition-all duration-200 group text-center cursor-pointer"
      onClick={() => onCompanyClick?.(company.id?.toString() || company.name)}
    >
      <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold ${company.logoColor} mx-auto mb-4 text-3xl`}>
        {company.logo}
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors mb-3">
        {company.name}
      </h3>
      <span className="text-sm text-[#007BFF] bg-[#007BFF]/10 px-3 py-1 rounded-full">
        {company.jobs} Jobs
      </span>
    </div>
  );

  const ApiCompanyCard = ({ company }: { company: ApiCompany }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer text-left"
      onClick={() => onCompanyClick?.(company.company_id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold bg-blue-500 text-white">
          {company.company_name?.charAt(0).toUpperCase() || 'C'}
        </div>
        <span className="text-sm text-[#007BFF] bg-[#007BFF]/10 px-3 py-1 rounded-full">
          0 Jobs
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors text-lg mb-2">
        {company.company_name}
      </h3>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {company.company_description || 'No description available'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {company.industry && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium border border-blue-200">
              {company.industry}
            </span>
          )}
          {company.company_size && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium border border-green-200">
              {company.company_size}
            </span>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Add bookmark functionality for API companies
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Design':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5zM21 15a2 2 0 00-2-2h-4a2 2 0 00-2 2v2a4 4 0 004 4h2a2 2 0 002-2v-2z" />
          </svg>
        );
      case 'Fintech':
        return (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
        );
      case 'Hosting':
        return (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.5 9h17"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.5 15h17"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-2.485 0-4.5 4.03-4.5 9s2.015 9 4.5 9 4.5-4.03 4.5-9-2.015-9-4.5-9z"></path>
            </svg>
        );
      case 'Business Service':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'Development':
        return (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
        );
      case 'Marketing':
        return (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        );
      case 'Education':
         return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path>
          </svg>
        );
      case 'Crypto':
        return (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
        );
      default:
        return null;
    }
  };

  const [categoryPage, setCategoryPage] = useState(0);
  const categoriesPerPage = 5;
  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);

  const handleNextCategory = () => {
      setCategoryPage(prev => Math.min(prev + 1, totalCategoryPages - 1));
  };

  const handlePrevCategory = () => {
      setCategoryPage(prev => Math.max(prev - 1, 0));
  };

  const displayedCategories = categories.slice(
      categoryPage * categoriesPerPage,
      (categoryPage + 1) * categoriesPerPage
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
            <div className="text-left text-sm text-gray-600">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">Twitter, Microsoft, Apple, Facebook</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* API Companies */}
          {(apiCompanies.length > 0 || loading || error) && (
            <div className="mb-16">
              <div className="mb-8 text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'Companies from Database'}
                </h2>
                <p className="text-gray-600">
                  {searchQuery ? 'Companies matching your search criteria' : 'Real companies from our platform'}
                </p>
              </div>

              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
                  <span className="ml-2 text-gray-600">Loading companies...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error loading companies</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !error && apiCompanies.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? 'Try adjusting your search terms' : 'No companies are available in the database yet'}
                  </p>
                </div>
              )}

              {!loading && !error && apiCompanies.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {apiCompanies.map((company) => (
                    <ApiCompanyCard key={company.company_id} company={company} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommended Companies - Only show if no API companies */}
          {apiCompanies.length === 0 && !loading && (
            <div className="mb-16">
              <div className="mb-8 text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Companies</h2>
                <p className="text-gray-600">Based on your profile, company preferences, and recent activity</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* CTA Section */}
        <div className="mb-16">
          <CTA onSignUpClick={() => {}} />
        </div>

        {/* Companies by Category */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 text-left">Companies by Category</h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handlePrevCategory}
                        disabled={categoryPage === 0}
                        className="bg-white border border-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleNextCategory}
                        disabled={categoryPage >= totalCategoryPages - 1}
                        className="bg-[#007BFF] text-white p-3 rounded-md hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed">
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            {/* Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    {displayedCategories.map((category) => (
                    <div
                        key={category.name}
                        onClick={() => setActiveCategory(category.name)}
                        className={`p-6 rounded-xl border transition-all duration-300 group cursor-pointer relative hover:shadow-lg hover:-translate-y-1 ${
                          activeCategory === category.name
                            ? 'bg-[#007BFF] text-white border-[#007BFF]'
                            : 'bg-white border-gray-200 text-[#007BFF] hover:bg-[#007BFF] hover:text-white'
                        }`}
                    >
                        <div className="w-auto flex items-center justify-start mb-4">
                            {getCategoryIcon(category.name)}
                        </div>
                        
                        <h3 className={`font-semibold mb-2 transition-colors text-left ${
                          activeCategory === category.name ? 'text-white' : 'text-gray-900 group-hover:text-white'
                        }`}>
                            {category.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                            <span className={`text-sm transition-colors ${
                              activeCategory === category.name ? 'text-white' : 'text-gray-500 group-hover:text-white'
                            }`}>
                                {category.count} companies
                            </span>
                            <svg className={`w-4 h-4 transition-colors ${
                              activeCategory === category.name ? 'text-white' : 'text-gray-400 group-hover:text-white'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                        <svg className="w-5 h-5 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                        <p>
                            Showing <span className="text-gray-900 font-medium">24 Results</span>
                        </p>
                    </div>
                </div>

                {/* Companies Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {designCompanies.map((company, index) => (
                    <SmallCompanyCard key={index} company={company} />
                    ))}
                </div>

                {/* View more link */}
                <div className="text-left">
                    <button className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
                    View more {activeCategory} companies
                    <FiArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </>
  );
};

export default Companies;
