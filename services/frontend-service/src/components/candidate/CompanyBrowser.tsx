import React, { useState, useEffect } from 'react';
import companyApi, { Company, CompanySearchParams } from '../../services/companyApi';

interface CompanyBrowserProps {
  onCompanySelect?: (company: Company) => void;
  showDetails?: boolean;
}

const CompanyBrowser: React.FC<CompanyBrowserProps> = ({ 
  onCompanySelect, 
  showDetails = true 
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<CompanySearchParams>({
    page: 1,
    limit: 20,
    search: '',
    industry: '',
    company_size: '',
    verified_only: false
  });
  const [industries, setIndustries] = useState<string[]>([]);
  const [companySizes] = useState([
    { value: 'STARTUP', label: 'Startup (1-10)' },
    { value: 'SMALL', label: 'Small (11-50)' },
    { value: 'MEDIUM', label: 'Medium (51-200)' },
    { value: 'LARGE', label: 'Large (201-1000)' },
    { value: 'ENTERPRISE', label: 'Enterprise (1000+)' }
  ]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Load initial data
  useEffect(() => {
    loadCompanies();
    loadIndustries();
  }, []);

  // Load companies when search params change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadCompanies();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchParams]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await companyApi.getAllCompanies(searchParams);
      
      if (response.success) {
        setCompanies(response.data || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        });
      } else {
        setError(response.error || 'Failed to load companies');
      }
    } catch (err: any) {
      console.error('Error loading companies:', err);
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const loadIndustries = async () => {
    try {
      const response = await companyApi.getIndustries();
      if (response.success) {
        setIndustries(response.data || []);
      }
    } catch (err) {
      console.error('Error loading industries:', err);
      // Set default industries if API fails
      setIndustries([
        'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
        'Retail', 'Real Estate', 'Transportation', 'Media', 'Hospitality'
      ]);
    }
  };

  const handleSearchChange = (field: keyof CompanySearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when searching
    }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setSearchParams({
      page: 1,
      limit: 20,
      search: '',
      industry: '',
      company_size: '',
      verified_only: false
    });
  };

  const getCompanyLogo = (company: Company) => {
    return company.company_logo_url || '/api/placeholder/80/80';
  };

  const formatCompanySize = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      'STARTUP': '1-10 employees',
      'SMALL': '11-50 employees',
      'MEDIUM': '51-200 employees',
      'LARGE': '201-1000 employees',
      'ENTERPRISE': '1000+ employees'
    };
    return sizeMap[size] || size;
  };

  return (
    <div className="company-browser">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Companies
            </label>
            <input
              type="text"
              value={searchParams.search || ''}
              onChange={(e) => handleSearchChange('search', e.target.value)}
              placeholder="Company name or keyword..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Industry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              value={searchParams.industry || ''}
              onChange={(e) => handleSearchChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Company Size Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
            </label>
            <select
              value={searchParams.company_size || ''}
              onChange={(e) => handleSearchChange('company_size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sizes</option>
              {companySizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          {/* Verified Only Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Options
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchParams.verified_only || false}
                onChange={(e) => handleSearchChange('verified_only', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Verified companies only</span>
            </label>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear All Filters
          </button>
          <div className="text-sm text-gray-500">
            {pagination.total} companies found
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading companies...</span>
        </div>
      )}

      {/* Companies Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.company_id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onCompanySelect?.(company)}
            >
              <div className="p-6">
                {/* Company Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={getCompanyLogo(company)}
                    alt={`${company.company_name} logo`}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {company.company_name}
                      </h3>
                      {company.is_verified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {company.industry && (
                      <p className="text-sm text-gray-500 mt-1">{company.industry}</p>
                    )}
                  </div>
                </div>

                {/* Company Info */}
                {showDetails && (
                  <>
                    {company.company_description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {company.company_description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      {company.company_size && (
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {formatCompanySize(company.company_size)}
                        </div>
                      )}

                      {company.company_address && (
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {company.company_address}
                        </div>
                      )}

                      {company.company_website && (
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a 
                            href={company.company_website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {company.company_website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* View Company Button */}
                <div className="mt-4 pt-4 border-t">
                  <button className="w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View Company Profile →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && companies.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or clear the filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && companies.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total companies)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.page - 2) + i;
              if (pageNum <= pagination.totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageNum === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBrowser; 