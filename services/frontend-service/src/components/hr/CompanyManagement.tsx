import React, { useState, useEffect } from 'react';
import companyApi, { Company, CreateCompanyData, UpdateCompanyData, CompanyStats } from '../../services/companyApi';

interface CompanyManagementProps {
  currentCompanyId?: string;
}

const CompanyManagement: React.FC<CompanyManagementProps> = ({ currentCompanyId }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<UpdateCompanyData>({
    company_name: '',
    company_description: '',
    company_website: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    industry: '',
    company_size: undefined,
    tax_code: '',
    founded_year: undefined
  });

  const [industries] = useState([
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
    'Retail', 'Real Estate', 'Transportation', 'Media', 'Hospitality',
    'Consulting', 'Energy', 'Government', 'Non-profit', 'Other'
  ]);

  const companySizes = [
    { value: 'STARTUP', label: 'Startup (1-10 employees)' },
    { value: 'SMALL', label: 'Small (11-50 employees)' },
    { value: 'MEDIUM', label: 'Medium (51-200 employees)' },
    { value: 'LARGE', label: 'Large (201-1000 employees)' },
    { value: 'ENTERPRISE', label: 'Enterprise (1000+ employees)' }
  ];

  useEffect(() => {
    if (currentCompanyId) {
      loadCompanyData();
    }
  }, [currentCompanyId]);

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name || '',
        company_description: company.company_description || '',
        company_website: company.company_website || '',
        company_email: company.company_email || '',
        company_phone: company.company_phone || '',
        company_address: company.company_address || '',
        industry: company.industry || '',
        company_size: company.company_size,
        tax_code: company.tax_code || '',
        founded_year: company.founded_year
      });
    }
  }, [company]);

  const loadCompanyData = async () => {
    if (!currentCompanyId) return;

    setLoading(true);
    setError(null);

    try {
      // Load company info
      const companyResponse = await companyApi.getCompanyById(currentCompanyId);
      if (companyResponse.success) {
        setCompany(companyResponse.data);
      }

      // Load company stats
      try {
        const statsResponse = await companyApi.getCompanyStats(currentCompanyId);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (statsError) {
        console.warn('Failed to load company stats:', statsError);
        // Stats are optional, don't show error to user
      }

    } catch (err: any) {
      console.error('Error loading company data:', err);
      setError(err.message || 'Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateCompanyData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentCompanyId || !company) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.company_name?.trim()) {
        setError('Company name is required');
        return;
      }

      const response = await companyApi.updateCompany(currentCompanyId, formData);
      
      if (response.success) {
        setCompany(response.data);
        setIsEditing(false);
        setSuccess('Company information updated successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to update company information');
      }
    } catch (err: any) {
      console.error('Error updating company:', err);
      setError(err.message || 'Failed to update company information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        company_name: company.company_name || '',
        company_description: company.company_description || '',
        company_website: company.company_website || '',
        company_email: company.company_email || '',
        company_phone: company.company_phone || '',
        company_address: company.company_address || '',
        industry: company.industry || '',
        company_size: company.company_size,
        tax_code: company.tax_code || '',
        founded_year: company.founded_year
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const formatCompanySize = (size: string) => {
    const sizeItem = companySizes.find(s => s.value === size);
    return sizeItem ? sizeItem.label : size;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading company information...</span>
      </div>
    );
  }

  if (!company && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Information</h3>
        <p className="text-gray-500">Company information not found or you don't have access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Company Management</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Company
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Company Information Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company name"
                />
              ) : (
                <p className="text-gray-900">{company?.company_name || 'Not specified'}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              {isEditing ? (
                <select
                  value={formData.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{company?.industry || 'Not specified'}</p>
              )}
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              {isEditing ? (
                <select
                  value={formData.company_size || ''}
                  onChange={(e) => handleInputChange('company_size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select company size</option>
                  {companySizes.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">
                  {company?.company_size ? formatCompanySize(company.company_size) : 'Not specified'}
                </p>
              )}
            </div>

            {/* Founded Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Founded Year
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.founded_year || ''}
                  onChange={(e) => handleInputChange('founded_year', parseInt(e.target.value) || undefined)}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 2020"
                />
              ) : (
                <p className="text-gray-900">{company?.founded_year || 'Not specified'}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.company_website || ''}
                  onChange={(e) => handleInputChange('company_website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              ) : (
                <p className="text-gray-900">
                  {company?.company_website ? (
                    <a 
                      href={company.company_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {company.company_website}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.company_email || ''}
                  onChange={(e) => handleInputChange('company_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@company.com"
                />
              ) : (
                <p className="text-gray-900">{company?.company_email || 'Not specified'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.company_phone || ''}
                  onChange={(e) => handleInputChange('company_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <p className="text-gray-900">{company?.company_phone || 'Not specified'}</p>
              )}
            </div>

            {/* Tax Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Code
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.tax_code || ''}
                  onChange={(e) => handleInputChange('tax_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tax identification number"
                />
              ) : (
                <p className="text-gray-900">{company?.tax_code || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* Address - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            {isEditing ? (
              <textarea
                value={formData.company_address || ''}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Company address"
              />
            ) : (
              <p className="text-gray-900">{company?.company_address || 'Not specified'}</p>
            )}
          </div>

          {/* Description - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.company_description || ''}
                onChange={(e) => handleInputChange('company_description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your company..."
              />
            ) : (
              <p className="text-gray-900">{company?.company_description || 'No description provided'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Stats */}
      {stats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Company Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total_jobs}</div>
                <div className="text-sm text-gray-600">Total Jobs Posted</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.active_jobs}</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.total_applications}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.pending_applications}</div>
                <div className="text-sm text-gray-600">Pending Applications</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement; 