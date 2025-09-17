import React, { useState, useEffect } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import { companyApi, Company as ApiCompany } from '../../services/companyApi';



interface FindCompaniesProps {
  onCompanyClick?: (companyId: string) => void;
}

export const FindCompanies: React.FC<FindCompaniesProps> = ({ onCompanyClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Florence, Italy');

  const [filters, setFilters] = useState({
    industry: [] as string[],
    companySize: [] as string[]
  });
  const [collapsedSections, setCollapsedSections] = useState({
    industry: false,
    companySize: false
  });
  const [apiCompanies, setApiCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [industries, setIndustries] = useState<{name: string, count: number}[]>([]);
  const [companySizes, setCompanySizes] = useState<{name: string, count: number}[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const companiesPerPage = 6;

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await companyApi.getAllCompanies({
          page: currentPage,
          limit: companiesPerPage,
          search: searchQuery || undefined,
          industry: filters.industry.length > 0 ? filters.industry.join(',') : undefined,
          company_size: filters.companySize.length > 0 ? filters.companySize.join(',') : undefined
        });
        
        if (response.success) {
          setApiCompanies(response.data || []);
          
          // Update pagination info from API response
          const pagination = response.pagination;
          if (pagination) {
            setTotalPages(pagination.totalPages || 1);
            setTotalCompanies(pagination.total || 0);
          } else {
            // Fallback calculation if pagination not provided
            const total = response.data?.length || 0;
            setTotalPages(Math.ceil(total / companiesPerPage));
            setTotalCompanies(total);
          }
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
  }, [searchQuery, currentPage, filters]);

  // Reset page to 1 when search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Fetch industries from API
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await companyApi.getAllCompanies({
          page: 1,
          limit: 1000
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

          const industriesFromAPI = Array.from(industryMap.entries()).map(([name, count]) => ({
            name,
            count
          }));

          setIndustries(industriesFromAPI);

          // Generate company sizes
          const sizeMap = new Map<string, number>();
          companies.forEach((company: ApiCompany) => {
            if (company.company_size) {
              const count = sizeMap.get(company.company_size) || 0;
              sizeMap.set(company.company_size, count + 1);
            }
          });

          const sizesFromAPI = Array.from(sizeMap.entries()).map(([name, count]) => ({
            name,
            count
          }));

          setCompanySizes(sizesFromAPI);
        }
      } catch (error: any) {
        console.error('Error fetching industries:', error);
      }
    };

    fetchIndustries();
  }, []);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Filter handlers
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



  const ApiCompanyCard = ({ company }: { company: ApiCompany }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer text-left"
      onClick={() => onCompanyClick?.(company.company_id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold bg-blue-500 text-white">
            {company.company_name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors">
              {company.company_name}
            </h3>
            <p className="text-sm text-[#007BFF]">0 Jobs</p>
          </div>
        </div>

      </div>

      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {company.company_description || 'No description available'}
      </p>

      <div className="flex items-center flex-wrap gap-2">
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
              <span className="text-gray-800">FPT Software, VNG Corporation, Tiki, Grab</span>
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
                  {industries.map((industry) => (
                  <FilterCheckbox 
                      key={industry.name}
                      label={industry.name} 
                      count={industry.count}
                      checked={filters.industry.includes(industry.name)}
                      onChange={() => handleFilterChange('industry', industry.name)}
                    />
                  ))}


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
                  {companySizes.map((size) => (
                  <FilterCheckbox 
                      key={size.name}
                      label={size.name} 
                      count={size.count}
                      checked={filters.companySize.includes(size.name)}
                      onChange={() => handleFilterChange('companySize', size.name)}
                    />
                  ))}
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
                  <p className="text-sm font-normal text-gray-500">Showing {apiCompanies.length} of {totalCompanies} results</p>
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

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
                  <span className="ml-2 text-gray-600">Loading companies...</span>
                </div>
              )}

              {/* Error State */}
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

              {/* Empty State */}
              {!loading && !error && apiCompanies.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              )}

              {/* API Companies Grid */}
              {!loading && !error && apiCompanies.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {apiCompanies.map((company) => (
                    <ApiCompanyCard key={company.company_id} company={company} />
                  ))}
                </div>
              )}



              {/* Pagination */}
              {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                  {/* Previous Button */}
                  <button 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`p-2 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(pageNum => {
                      if (totalPages <= 7) return true;
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                      return false;
                    })
                    .map((pageNum, index, array) => (
                      <React.Fragment key={pageNum}>
                        {/* Add ellipsis if there's a gap */}
                        {index > 0 && pageNum - array[index - 1] > 1 && (
                <span className="text-gray-400">...</span>
                        )}
                        
                        <button
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded font-medium ${
                            currentPage === pageNum
                              ? 'bg-[#007BFF] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    ))
                  }

                  {/* Next Button */}
                  <button 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
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

export default FindCompanies; 