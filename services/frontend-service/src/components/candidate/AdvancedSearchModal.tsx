import React, { useState, useEffect } from 'react';
import { candidateApi } from '../../services/candidateApi';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export interface SearchFilters {
  search?: string;
  location?: string;
  employment_type?: string[];
  work_type?: string[];
  salary_min?: number;
  salary_max?: number;
  experience_min?: number;
  experience_max?: number;
  categories?: string[];
  job_level?: string[];
  education_level?: string;
  featured?: boolean;
  remote_friendly?: boolean;
  date_posted?: string;
  skills?: string[];
}

interface JobCategory {
  category: string;
  job_count: number;
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await candidateApi.getJobCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayFilterChange = (key: keyof SearchFilters, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentArray = (prev[key] as string[]) || [];
      if (checked) {
        return {
          ...prev,
          [key]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [key]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const handleSearch = () => {
    setLoading(true);
    onSearch(filters);
    setLoading(false);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Advanced Job Search</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <input
                type="text"
                placeholder="Job title, company, or keywords..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="City, state, or remote"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Employment Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { value: 'FULL_TIME', label: 'Full-time' },
                { value: 'PART_TIME', label: 'Part-time' },
                { value: 'CONTRACT', label: 'Contract' },
                { value: 'INTERNSHIP', label: 'Internship' },
                { value: 'FREELANCE', label: 'Freelance' }
              ].map(type => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters.employment_type || []).includes(type.value)}
                    onChange={(e) => handleArrayFilterChange('employment_type', type.value, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Work Arrangement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Work Arrangement
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'ONSITE', label: 'On-site' },
                { value: 'REMOTE', label: 'Remote' },
                { value: 'HYBRID', label: 'Hybrid' }
              ].map(type => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters.work_type || []).includes(type.value)}
                    onChange={(e) => handleArrayFilterChange('work_type', type.value, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Salary Range (VND)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="Min salary"
                  value={filters.salary_min || ''}
                  onChange={(e) => handleFilterChange('salary_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max salary"
                  value={filters.salary_max || ''}
                  onChange={(e) => handleFilterChange('salary_max', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Experience Level (Years)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="Min experience"
                  value={filters.experience_min || ''}
                  onChange={(e) => handleFilterChange('experience_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max experience"
                  value={filters.experience_max || ''}
                  onChange={(e) => handleFilterChange('experience_max', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Job Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                {categories.map(category => (
                  <label key={category.category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.categories || []).includes(category.category)}
                      onChange={(e) => handleArrayFilterChange('categories', category.category, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {category.category} ({category.job_count})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date Posted */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Posted
            </label>
            <select
              value={filters.date_posted || ''}
              onChange={(e) => handleFilterChange('date_posted', e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any time</option>
              <option value="last_24_hours">Last 24 hours</option>
              <option value="last_7_days">Last 7 days</option>
              <option value="last_30_days">Last 30 days</option>
              <option value="last_3_months">Last 3 months</option>
            </select>
          </div>

          {/* Special Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Special Filters
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.featured || false}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Featured jobs only</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.remote_friendly || false}
                  onChange={(e) => handleFilterChange('remote_friendly', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Remote-friendly</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Reset All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
