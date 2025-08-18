import React, { useState, useEffect } from 'react';
import TestTaking from './TestTaking';
import TestSuccess from './TestSuccess';
import TestClosed from './TestClosed';
import DashboardSidebar from './DashboardSidebar';
import candidateApi from '../../services/candidateApi';

interface TestAssignment {
  result_id: string;
  test_id: string;
  application_id: string;
  test_name: string;
  test_description: string;
  time_limit: number;
  passing_score: number;
  job_title: string;
  company_name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMEOUT' | 'ABANDONED';
  created_at: string; // For assigned date
  start_time?: string; // For started date  
  submit_time?: string; // For completed date
  total_score?: number;
  percentage?: number; // Database column name
  passed?: boolean;
  time_taken_seconds?: number;
}

interface TestManagementProps {
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onProfileClick?: () => void;
  onMyApplicationsClick?: () => void;
  onFindJobsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onAgentAIClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

const TestManagement: React.FC<TestManagementProps> = ({
  onHomeClick,
  onDashboardClick,
  onProfileClick,
  onMyApplicationsClick,
  onFindJobsClick,
  onBrowseCompaniesClick,
  onAgentAIClick,
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [activeTab, setActiveTab] = useState('test-management');
  const [currentView, setCurrentView] = useState<'list' | 'taking' | 'success' | 'closed'>('list');
  const [selectedTest, setSelectedTest] = useState<TestAssignment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [testAssignments, setTestAssignments] = useState<TestAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      try {
        const response = await candidateApi.getMyTests({
          page: pagination.page,
          limit: pagination.limit,
          status: undefined // No filter for now
        });
        
        // Use actual API response data structure
        setTestAssignments(response.data);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        setError('Failed to load tests.');
        console.error('Error fetching tests:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [pagination.page, pagination.limit]);

  const handleTestClick = (test: TestAssignment) => {
    setSelectedTest(test);
    if (test.status === 'NOT_STARTED' || test.status === 'IN_PROGRESS') {
      setCurrentView('taking');
    } else if (test.status === 'COMPLETED') {
      setCurrentView('success');
    } else {
      setCurrentView('closed');
    }
  };

  const handleTestComplete = () => {
    setCurrentView('success');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedTest(null);
  };

  const handleGoHome = () => {
    setCurrentView('list');
    setSelectedTest(null);
    if (onDashboardClick) {
      onDashboardClick();
    }
  };

  // Render test taking view
  if (currentView === 'taking' && selectedTest) {
    return (
      <TestTaking
        test={selectedTest}
        onComplete={handleTestComplete}
        onBack={handleBackToList}
      />
    );
  }

  // Render test success view
  if (currentView === 'success' && selectedTest) {
    return (
      <TestSuccess
        test={selectedTest}
        onHome={handleGoHome}
        onBackToList={handleBackToList}
      />
    );
  }

  // Render test closed view
  if (currentView === 'closed' && selectedTest) {
    return (
      <TestClosed
        test={selectedTest}
        onBack={handleBackToList}
      />
    );
  }

  // Main test management list view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab}
        isCollapsed={false}
        onToggleSidebar={() => {}}
        onDashboardClick={onDashboardClick}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={() => setActiveTab('test-management')}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpCenterClick={onHelpCenterClick}
      />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Test Management</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Jul 19 - Jul 25</span>
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button 
              onClick={onHomeClick}
              className="px-4 py-2 text-[#007BFF] hover:text-white font-medium border border-[#007BFF] rounded-lg hover:bg-[#007BFF] transition-colors"
            >
              Back to homepage
            </button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Keep it up, Jake</h2>
          <p className="text-gray-600">Here are your available assessments from July 19 - July 25.</p>
        </div>

        {/* Assessment Guidelines Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 relative">
          <button 
            onClick={() => {}}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Assessment Guidelines</h3>
              <p className="text-gray-600 text-sm mb-1">
                Complete your assessments within the given time limit. Each assessment can only be taken once.
              </p>
              <p className="text-gray-600 text-sm">Review instructions carefully before starting.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button className="py-2 px-1 border-b-2 border-[#007BFF] text-[#007BFF] font-medium text-sm">
                All Tests ({pagination.total})
              </button>
            </nav>
          </div>
        </div>

        {/* Test History Section */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Section Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Available Assessments</h3>
              <div className="flex items-center space-x-3">
                <button 
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </button>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0111 20v-6.586a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                  </svg>
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center p-4">Loading tests...</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="text-center p-4 text-red-500">{error}</td></tr>
                ) : testAssignments.map((test, index) => {
                  // Get company initials for logo
                  const companyInitials = test.company_name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
                  const logoColors = ['bg-blue-500 text-white', 'bg-green-500 text-white', 'bg-purple-500 text-white', 'bg-red-500 text-white'];
                  const logoColor = logoColors[index % logoColors.length];
                  
                  return (
                    <tr key={test.result_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${logoColor} mr-3`}>
                            {companyInitials}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{test.company_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.test_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(test.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          test.status === 'NOT_STARTED' || test.status === 'IN_PROGRESS'
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : test.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleTestClick(test)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            test.status === 'NOT_STARTED' || test.status === 'IN_PROGRESS'
                              ? 'bg-[#007BFF] text-white hover:bg-[#0056b3]'
                              : test.status === 'COMPLETED'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                          }`}
                        >
                          {test.status === 'NOT_STARTED' || test.status === 'IN_PROGRESS' 
                            ? 'Take Test' 
                            : test.status === 'COMPLETED'
                            ? 'View Results'
                            : 'View Test'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tests
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isCurrentPage = pageNum === pagination.page;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            isCurrentPage
                              ? 'text-white bg-[#007BFF]'
                              : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <>
                        <span className="px-2 text-sm text-gray-500">...</span>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            pagination.page === pagination.totalPages
                              ? 'text-white bg-[#007BFF]'
                              : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          {pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestManagement; 