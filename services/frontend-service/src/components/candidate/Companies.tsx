import React, { useState, useEffect } from 'react';
import { Footer } from './Footer';
import { CTA } from './CTA';
import GroupUnderline from '../../assets/Group.png';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { companyApi, Company as ApiCompany } from '../../services/companyApi';



interface CompaniesProps {
  onCompanyClick?: (companyId: string) => void;
}

export const Companies: React.FC<CompaniesProps> = ({ onCompanyClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Florence, Italy');
  const [activeCategory, setActiveCategory] = useState('Design');

  const [apiCompanies, setApiCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for recommended companies from API
  const [recommendedCompanies, setRecommendedCompanies] = useState<ApiCompany[]>([]);

  // State for categories from API
  const [categories, setCategories] = useState<{name: string, count: number, active: boolean}[]>([]);

  // State for companies by selected category
  const [companiesByCategory, setCompaniesByCategory] = useState<ApiCompany[]>([]);

  // Fetch recommended companies from API
  useEffect(() => {
    const fetchRecommendedCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await companyApi.getAllCompanies({
          page: 1,
          limit: 6,
          verified_only: true // Get verified companies as recommended
        });
        
        if (response.success) {
          setRecommendedCompanies(response.data || []);
        }
      } catch (error: any) {
        console.error('Error fetching recommended companies:', error);
        setError(error.message || 'Failed to fetch recommended companies');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedCompanies();
  }, []);

  // Fetch categories (industries) from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await companyApi.getAllCompanies({
          page: 1,
          limit: 1000 // Get all companies to analyze industries
        });
        
        if (response.success) {
          const companies = response.data || [];
          const industryMap = new Map<string, number>();
          
          companies.forEach((company: ApiCompany) => {
            if (company.industry) {
              const count = industryMap.get(company.industry) || 0;
              industryMap.set(company.industry, count + 1);
            }
          });

          const categoriesFromAPI = Array.from(industryMap.entries()).map(([name, count], index) => ({
            name,
            count,
            active: index === 0 // First category is active by default
          }));

          setCategories(categoriesFromAPI);
          
          // Set first category as active and fetch its companies
          if (categoriesFromAPI.length > 0) {
            setActiveCategory(categoriesFromAPI[0].name);
          }
        }
      } catch (error: any) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch companies by selected category
  useEffect(() => {
    const fetchCompaniesByCategory = async () => {
      if (!activeCategory) return;
      
      try {
        const response = await companyApi.getAllCompanies({
          page: 1,
          limit: 24,
          industry: activeCategory
        });
        
        if (response.success) {
          setCompaniesByCategory(response.data || []);
        }
      } catch (error: any) {
        console.error('Error fetching companies by category:', error);
      }
    };

    fetchCompaniesByCategory();
  }, [activeCategory]);

  // Fetch general companies for search
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await companyApi.getAllCompanies({
          page: 1,
          limit: 6,
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

    if (searchQuery) {
      fetchCompanies();
    }
  }, [searchQuery]);





  const ApiCompanyCard = ({ company }: { company: ApiCompany }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer text-left transform"
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
    </div>
  );

  const SmallApiCompanyCard = ({ company }: { company: ApiCompany }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#007BFF]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group text-center cursor-pointer transform"
      onClick={() => onCompanyClick?.(company.company_id)}
    >
      <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold bg-blue-500 text-white mx-auto mb-4 text-3xl`}>
        {company.company_name?.charAt(0).toUpperCase() || 'C'}
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors text-lg mb-2">
        {company.company_name}
      </h3>
      <span className="text-sm text-[#007BFF] bg-[#007BFF]/10 px-3 py-1 rounded-full">
        0 Jobs
      </span>
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
      case 'Information Technology':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'E-commerce':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
          </svg>
        );
      case 'Transportation Technology':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        );
      case 'Conglomerate Technology':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'Banking & Finance':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Software Development':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'Digital Marketing':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'Human Resources Technology':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
    }
  };

  const getSmallCategoryIcon = (categoryName: string) => {
    const icon = getCategoryIcon(categoryName);
    if (!icon) return null;
    
    // Clone the icon element and change size from w-8 h-8 to w-5 h-5
    return React.cloneElement(icon, {
      className: icon.props.className.replace('w-8 h-8', 'w-5 h-5')
    });
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
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended Companies'}
                </h2>
                <p className="text-gray-600">
                  {searchQuery ? 'Companies matching your search criteria' : 'Based on your profile, company preferences, and recent activity'}
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

          {/* Recommended Companies - Only show if no search query */}
          {!searchQuery && recommendedCompanies.length > 0 && (
            <div className="mb-16">
              <div className="mb-8 text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Companies</h2>
                <p className="text-gray-600">Based on your profile, company preferences, and recent activity</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedCompanies.map((company) => (
                  <ApiCompanyCard key={company.company_id} company={company} />
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
                        className={`p-6 rounded-xl border transition-all duration-300 group cursor-pointer relative hover:shadow-xl hover:-translate-y-2 transform ${
                          activeCategory === category.name
                            ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-lg -translate-y-1'
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
                        <div className="text-[#007BFF]">
                            {getSmallCategoryIcon(activeCategory) || (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                                </svg>
                            )}
                        </div>
                        <p>
                            Showing <span className="text-gray-900 font-medium">{companiesByCategory.length} Results</span>
                        </p>
                    </div>
                </div>

                {/* Companies Grid */}
                {companiesByCategory.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      {companiesByCategory.map((company) => (
                      <SmallApiCompanyCard key={company.company_id} company={company} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No companies found in {activeCategory} category</p>
                  </div>
                )}

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
