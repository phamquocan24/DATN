import React, { useState, useEffect } from 'react';
import companyApi, { Company, CompanySearchParams } from '../../services/companyApi';

const CompanyTestDemo: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const [testData] = useState({
    searchParams: {
      page: 1,
      limit: 10,
      search: '',
      industry: 'Technology',
      company_size: 'SMALL',
      verified_only: false
    } as CompanySearchParams,
    
    newCompany: {
      company_name: 'Demo Tech Company',
      company_description: 'A demo technology company for API testing',
      industry: 'Technology',
      company_size: 'SMALL' as const,
      company_website: 'https://demotechcompany.com',
      company_email: 'info@demotechcompany.com',
      company_phone: '+1 (555) 123-4567',
      company_address: '123 Tech Street, Silicon Valley, CA 94000',
      tax_code: 'TC123456789',
      founded_year: 2020
    }
  });

  useEffect(() => {
    runInitialTests();
  }, []);

  const addResult = (test: string, success: boolean, data: any, error?: string) => {
    const result = {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev]);
    console.log(`${test}:`, success ? 'SUCCESS' : 'FAILED', data || error);
  };

  const runInitialTests = async () => {
    setLoading(true);
    setError(null);

    // Test 1: Get All Companies
    try {
      const response = await companyApi.getAllCompanies(testData.searchParams);
      addResult('GET /companies', response.success, response.data);
      if (response.success) {
        setCompanies(response.data || []);
      }
    } catch (err: any) {
      addResult('GET /companies', false, null, err.message);
    }

    // Test 2: Get Industries
    try {
      const response = await companyApi.getIndustries();
      addResult('GET Industries', response.success, response.data);
    } catch (err: any) {
      addResult('GET Industries', false, null, err.message);
    }

    // Test 3: Get Company Sizes
    try {
      const response = companyApi.getCompanySizes();
      addResult('GET Company Sizes', response.success, response.data);
    } catch (err: any) {
      addResult('GET Company Sizes', false, null, err.message);
    }

    setLoading(false);
  };

  const testCreateCompany = async () => {
    setLoading(true);
    try {
      const response = await companyApi.createCompany(testData.newCompany);
      addResult('POST /companies (Create)', response.success, response.data);
      
      if (response.success && response.data) {
        setSelectedCompany(response.data);
        // Refresh companies list
        const refreshResponse = await companyApi.getAllCompanies();
        if (refreshResponse.success) {
          setCompanies(refreshResponse.data || []);
        }
      }
    } catch (err: any) {
      addResult('POST /companies (Create)', false, null, err.message);
    }
    setLoading(false);
  };

  const testGetCompanyById = async (companyId: string) => {
    setLoading(true);
    try {
      const response = await companyApi.getCompanyById(companyId);
      addResult(`GET /companies/${companyId}`, response.success, response.data);
      if (response.success) {
        setSelectedCompany(response.data);
      }
    } catch (err: any) {
      addResult(`GET /companies/${companyId}`, false, null, err.message);
    }
    setLoading(false);
  };

  const testGetCompanyStats = async (companyId: string) => {
    setLoading(true);
    try {
      const response = await companyApi.getCompanyStats(companyId);
      addResult(`GET /companies/${companyId}/stats`, response.success, response.data);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      addResult(`GET /companies/${companyId}/stats`, false, null, err.message);
    }
    setLoading(false);
  };

  const testGetCompanyRecruiters = async (companyId: string) => {
    setLoading(true);
    try {
      const response = await companyApi.getCompanyRecruiters(companyId);
      addResult(`GET /companies/${companyId}/recruiters`, response.success, response.data);
      if (response.success) {
        setRecruiters(response.data || []);
      }
    } catch (err: any) {
      addResult(`GET /companies/${companyId}/recruiters`, false, null, err.message);
    }
    setLoading(false);
  };

  const testUpdateCompany = async (companyId: string) => {
    setLoading(true);
    try {
      const updateData = {
        company_description: 'Updated description via API test',
        company_website: 'https://updated-demo-company.com'
      };
      
      const response = await companyApi.updateCompany(companyId, updateData);
      addResult(`PUT /companies/${companyId}`, response.success, response.data);
      
      if (response.success) {
        setSelectedCompany(response.data);
      }
    } catch (err: any) {
      addResult(`PUT /companies/${companyId}`, false, null, err.message);
    }
    setLoading(false);
  };

  const testDeleteCompany = async (companyId: string) => {
    setLoading(true);
    try {
      const response = await companyApi.deleteCompany(companyId);
      addResult(`DELETE /companies/${companyId}`, response.success, response.data);
      
      if (response.success) {
        setSelectedCompany(null);
        // Refresh companies list
        const refreshResponse = await companyApi.getAllCompanies();
        if (refreshResponse.success) {
          setCompanies(refreshResponse.data || []);
        }
      }
    } catch (err: any) {
      addResult(`DELETE /companies/${companyId}`, false, null, err.message);
    }
    setLoading(false);
  };

  const testSearchCompanies = async () => {
    setLoading(true);
    try {
      const searchParams = {
        search: 'tech',
        industry: 'Technology',
        page: 1,
        limit: 5
      };
      
      const response = await companyApi.searchCompanies(searchParams);
      addResult('GET /companies/search', response.success, response.data);
    } catch (err: any) {
      addResult('GET /companies/search', false, null, err.message);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Company API Integration Test</h1>
        
        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={runInitialTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Run Basic Tests
          </button>
          
          <button
            onClick={testCreateCompany}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Test Create Company
          </button>
          
          <button
            onClick={testSearchCompanies}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Test Search Companies
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Running tests...</span>
          </div>
        )}
      </div>

      {/* Companies List */}
      {companies.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Companies Found ({companies.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div
                key={company.company_id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium">{company.company_name}</h3>
                <p className="text-sm text-gray-600">{company.industry}</p>
                <p className="text-sm text-gray-600">{company.company_size}</p>
                
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => testGetCompanyById(company.company_id)}
                    disabled={loading}
                    className="w-full px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Get Details
                  </button>
                  
                  <button
                    onClick={() => testGetCompanyStats(company.company_id)}
                    disabled={loading}
                    className="w-full px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    Get Stats
                  </button>
                  
                  <button
                    onClick={() => testGetCompanyRecruiters(company.company_id)}
                    disabled={loading}
                    className="w-full px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                  >
                    Get Recruiters
                  </button>
                  
                  <button
                    onClick={() => testUpdateCompany(company.company_id)}
                    disabled={loading}
                    className="w-full px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                  >
                    Update
                  </button>
                  
                  <button
                    onClick={() => testDeleteCompany(company.company_id)}
                    disabled={loading}
                    className="w-full px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Company Details */}
      {selectedCompany && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Selected Company Details</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(selectedCompany, null, 2)}
          </pre>
        </div>
      )}

      {/* Company Stats */}
      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Company Statistics</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      )}

      {/* Recruiters */}
      {recruiters.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Company Recruiters ({recruiters.length})</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(recruiters, null, 2)}
          </pre>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">API Test Results ({results.length})</h2>
        
        {results.length === 0 ? (
          <p className="text-gray-500">No test results yet. Click "Run Basic Tests" to start.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.success 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.test}</span>
                  <span className="text-sm text-gray-500">{result.timestamp}</span>
                </div>
                
                <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                  {result.error && `: ${result.error}`}
                </div>
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Response Data
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Run Basic Tests</strong>: Test GET companies, industries, and company sizes</li>
          <li>• <strong>Test Create Company</strong>: Try to create a new company (needs HR/Recruiter role)</li>
          <li>• <strong>Test Search</strong>: Search companies by criteria</li>
          <li>• <strong>Company Actions</strong>: Click buttons on individual companies to test specific endpoints</li>
          <li>• <strong>Expected Behavior</strong>: Some operations may fail due to role permissions or missing data</li>
          <li>• <strong>Role Requirements</strong>: Create/Update/Delete require HR or Recruiter role</li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyTestDemo; 