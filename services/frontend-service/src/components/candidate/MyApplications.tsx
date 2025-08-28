import React, { useState, useEffect } from 'react';
import JobDetail from './JobDetail';
import ApplicationDetail from './ApplicationDetail';
import DashboardSidebar from './DashboardSidebar';
import candidateApi from '../../services/candidateApi';

interface Application {
  id: string;
  application_id: string;
  job_id: string;
  candidate_id: string;
  company: string;
  role: string;
  dateApplied: string;
  status: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEWING' | 'TESTING' | 'OFFERED' | 'HIRED' | 'REJECTED';
  logo: string;
  logoColor: string;
  cv_id?: string;
  cover_letter?: string;
  applied_at?: string;
  updated_at?: string;
  job_title?: string;
  company_name?: string;
}

const mockJobDetails = {
  description: "Stripe is looking for Social Media Marketing expert to help manage our online networks. You will be responsible for monitoring our social media channels, creating content, finding effective ways to engage the community and incentivize others to engage on our channels.",
  requirements: [
    "Community engagement to ensure that is supported and actively represented online",
    "Focus on social media content development and publication",
    "Marketing and strategy support",
    "Stay on top of trends on social media platforms, and suggest content ideas to the team",
    "Engage with online communities"
  ],
  whoYouAre: [
    "You get energy from people and building the ideal work environment",
    "You have a sense for beautiful spaces and office experiences",
    "You are a confident office manager, ready for added responsibilities",
    "You're detail-oriented and creative",
    "You're a growth marketer and know how to run campaigns"
  ],
  niceToHaves: [
    "Fluent in English",
    "Project management skills",
    "Copy editing skills"
  ]
};

interface Job {
  job_id: string; // Primary ID (UUID from database)
  id?: number;    // Fallback for legacy data
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  logo: string;
  logoColor: string;
  match: number;
  applied: number;
  capacity: number;
  salary?: string;
}

interface MyApplicationsProps {
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onProfileClick?: () => void;
  onFindJobsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onTestManagementClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

const MyApplications: React.FC<MyApplicationsProps> = ({
  onHomeClick,
  onDashboardClick,
  onProfileClick,
  onFindJobsClick,
  onBrowseCompaniesClick,
  onTestManagementClick,
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [activeTab, setActiveTab] = useState('applications');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'application-detail'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userProfile, setUserProfile] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // Separate state for controlling the fetch trigger
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(20);

  // Store selected application to access its status
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [withdrawingApplication, setWithdrawingApplication] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await candidateApi.getProfile();
        if (response && response.data) {
          setUserProfile(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const response = await candidateApi.getMyApplications({
          page: currentPage,
          limit: pageLimit,
          status: selectedStatusTab !== 'all' ? selectedStatusTab.toUpperCase() as any : undefined,
          orderBy: 'created_at',
          direction: 'DESC'
        });
        
        // Handle business-service API response structure
        const applicationsArray = Array.isArray(response)
          ? response
          : (response?.data || []);
        
        // Update pagination if available
        if (response?.pagination) {
          setPagination(response.pagination);
        }
        
        // Transform API data to match component interface
        const transformedApplications = applicationsArray.map((app: any) => ({
          id: app.application_id || app.id,
          application_id: app.application_id,
          job_id: app.job_id,
          candidate_id: app.candidate_id,
          company: app.job_title || app.company_name || app.job?.company?.name || 'Company',
          role: app.job_title || app.position || app.job?.title || 'Position',
          dateApplied: new Date(app.applied_at || app.created_at || Date.now()).toLocaleDateString(),
          status: app.current_status || app.status || 'PENDING',
          logo: (app.job_title || app.company_name || app.job?.company?.name || 'C').charAt(0).toUpperCase(),
          logoColor: 'bg-blue-500 text-white',
          cv_id: app.cv_id,
          cover_letter: app.cover_letter,
          applied_at: app.applied_at,
          updated_at: app.updated_at,
          job_title: app.job_title,
          company_name: app.company_name
        }));
        
        setApplications(transformedApplications);
        setError(null);
      } catch (err) {
        setError('Failed to load applications.');
        console.error('Error fetching applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [currentPage, pageLimit, selectedStatusTab]);

  // Convert Application to Job format for JobDetail
  const convertApplicationToJob = (application: Application): Job => {
    return {
      job_id: application.job_id || application.id, // Use job_id from application
      id: parseInt(application.id) || 0, // Fallback legacy ID
      title: application.role,
      company: application.company,
      location: 'Remote', // Default location, could be enhanced
      type: 'Full-Time', // Default type, could be enhanced
      tags: ['Marketing', 'Design', `Applied: ${application.dateApplied}`],
      logo: application.logo,
      logoColor: application.logoColor,
      match: 85, // Default match percentage
      applied: 1,
      capacity: 10,
      salary: '$40,000 - $60,000', // Default salary range,
      ...mockJobDetails
    };
  };

  const handleApplicationClick = (application: Application) => {
    const job = convertApplicationToJob(application);
    setSelectedJob(job);
    setSelectedApplication(application); // Store the original application
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedJob(null);
    setSelectedApplication(null);
  };

  const handleWithdrawApplication = async (applicationId: string, reason?: string) => {
    try {
      setWithdrawingApplication(applicationId);
      await candidateApi.withdrawApplication(applicationId, reason);
      
      // Refresh applications list
      const response = await candidateApi.getMyApplications({
        page: currentPage,
        limit: pageLimit,
        status: selectedStatusTab !== 'all' ? selectedStatusTab.toUpperCase() as any : undefined,
        orderBy: 'created_at',
        direction: 'DESC'
      });
      const applicationsArray = Array.isArray(response) ? response : (response?.data || []);
      
      const transformedApplications = applicationsArray.map((app: any) => ({
        id: app.application_id || app.id,
        application_id: app.application_id,
        job_id: app.job_id,
        candidate_id: app.candidate_id,
        company: app.job_title || app.company_name || app.job?.company?.name || 'Company',
        role: app.job_title || app.position || app.job?.title || 'Position',
        dateApplied: new Date(app.applied_at || app.created_at || Date.now()).toLocaleDateString(),
        status: app.current_status || app.status || 'PENDING',
        logo: (app.job_title || app.company_name || app.job?.company?.name || 'C').charAt(0).toUpperCase(),
        logoColor: 'bg-blue-500 text-white',
        cv_id: app.cv_id,
        cover_letter: app.cover_letter,
        applied_at: app.applied_at,
        updated_at: app.updated_at,
        job_title: app.job_title,
        company_name: app.company_name
      }));
      
      setApplications(transformedApplications);
      alert('Application withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application');
    } finally {
      setWithdrawingApplication(null);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: applications.length },
    { id: 'pending', label: 'Pending', count: applications.filter(app => app.status === 'PENDING').length },
    { id: 'reviewing', label: 'Reviewing', count: applications.filter(app => app.status === 'REVIEWING').length },
    { id: 'interviewing', label: 'Interviewing', count: applications.filter(app => app.status === 'INTERVIEWING').length },
    { id: 'testing', label: 'Testing', count: applications.filter(app => app.status === 'TESTING').length },
    { id: 'rejected', label: 'Rejected', count: applications.filter(app => app.status === 'REJECTED').length },
    { id: 'hired', label: 'Hired', count: applications.filter(app => app.status === 'HIRED').length }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'REVIEWING':
        return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'SHORTLISTED':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'INTERVIEWING':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Rejected':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'REVIEWING':
        return 'Reviewing';
      case 'SHORTLISTED':
        return 'Shortlisted';
      case 'INTERVIEWING':
        return 'Interviewing';
      case 'TESTING':
        return 'Testing';
      case 'OFFERED':
        return 'Offered';
      case 'HIRED':
        return 'Hired';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
                <DashboardSidebar
            activeTab={activeTab}
            isCollapsed={false}
            onToggleSidebar={() => {}}
            onDashboardClick={onDashboardClick}
            onMyApplicationsClick={() => setActiveTab('applications')}
            onTestManagementClick={onTestManagementClick}
            onProfileClick={onProfileClick}
            onSettingsClick={onSettingsClick}
            onHelpCenterClick={onHelpCenterClick}
          />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {currentView === 'application-detail' && selectedApplication ? (
          <ApplicationDetail
            applicationId={selectedApplication.application_id}
            onBack={handleBackToList}
          />
        ) : currentView === 'detail' && selectedJob ? (
          <JobDetail 
            job={selectedJob}
            onBack={handleBackToList}
            applicationStatus={selectedApplication?.status as any}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Keep it up, {userProfile.full_name || 'User'}</h2>
              <p className="text-gray-600">Here is job applications status from July 19 - July 25.</p>
            </div>

            {/* New Feature Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 relative text-left">
              <button 
                onClick={() => {}}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 mb-1">New Feature</h3>
                  <p className="text-gray-600 text-sm mb-1">
                    You can request a follow-up 7 days after applying for a job if the application status is in review.
                  </p>
                  <p className="text-gray-600 text-sm">Only one follow-up is allowed per job.</p>
                </div>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedStatusTab(tab.id);
                        setCurrentPage(1); // Reset to page 1 when changing status
                      }}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        selectedStatusTab === tab.id
                          ? 'border-[#007BFF] text-[#007BFF]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Applications History Section */}
            <div className="bg-white rounded-lg shadow-sm">
              {/* Section Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Applications History</h3>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={6} className="text-center p-4 text-red-500">{error}</td></tr>
                    ) : applications.map((application, index) => (
                      <tr 
                        key={application.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleApplicationClick(application)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${application.logoColor} mr-3`}>
                              {application.logo}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 hover:text-[#007BFF] transition-colors">
                                {application.company}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {application.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {application.dateApplied}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                            {getStatusDisplayName(application.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button 
                              className="text-gray-400 hover:text-gray-600 p-2"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click when clicking menu button
                                setShowDropdown(showDropdown === application.id ? null : application.id);
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {showDropdown === application.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                <div className="py-1">
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentView('application-detail');
                                      setSelectedApplication(application);
                                      setShowDropdown(null);
                                    }}
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Application Details
                                  </button>
                                  
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApplicationClick(application);
                                      setShowDropdown(null);
                                    }}
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM9 7h6v10H9V7z" />
                                    </svg>
                                    View Job Details
                                  </button>
                                  
                                  {(application.status === 'PENDING' || application.status === 'REVIEWING') && (
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                        setShowDropdown(null);
                                if (confirm('Are you sure you want to withdraw this application?')) {
                                  handleWithdrawApplication(application.id, 'Candidate withdrew application');
                                }
                              }}
                              disabled={withdrawingApplication === application.id}
                            >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      {withdrawingApplication === application.id ? 'Withdrawing...' : 'Withdraw Application'}
                            </button>
                          )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * pageLimit) + 1} to {Math.min(currentPage * pageLimit, pagination.total)} of {pagination.total} applications
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        disabled={currentPage <= 1}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          const isCurrentPage = pageNum === currentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
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
                              onClick={() => setCurrentPage(pagination.totalPages)}
                              className={`px-3 py-1 text-sm font-medium rounded ${
                                currentPage === pagination.totalPages
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
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= pagination.totalPages}
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
          </>
        )}
      </div>
    </div>
  );
};

export default MyApplications; 