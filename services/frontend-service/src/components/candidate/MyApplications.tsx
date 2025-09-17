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
  status: 'SUBMITTED' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEWED' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
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
  
  // Withdraw modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<Application | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Helper function to map status tab to API status
  const getAPIStatus = (tabStatus: string): any => {
    const statusMap: { [key: string]: string } = {
      'pending': 'APPLIED',  // Changed to match backend
      'reviewing': 'REVIEWING', 
      'interviewing': 'INTERVIEWED',
      'testing': 'SHORTLISTED',
      'rejected': 'REJECTED',
      'hired': 'HIRED',
      'withdrawn': 'WITHDRAWN'
    };
    return statusMap[tabStatus] || tabStatus.toUpperCase();
  };



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

  // Debug dropdown status
  useEffect(() => {
    if (showDropdown) {
      const app = applications.find(a => a.id === showDropdown);
      if (app) {
        console.log('🔍 Dropdown opened for:', app.company, 'Status:', app.status, 'Can withdraw:', (app.status !== 'WITHDRAWN' && app.status !== 'HIRED' && app.status !== 'REJECTED'));
      }
    }
  }, [showDropdown, applications]);

  // Handle withdraw modal
  const handleWithdrawClick = (application: Application) => {
    setApplicationToWithdraw(application);
    setShowWithdrawModal(true);
    setShowDropdown(null);
  };

  const handleWithdrawCancel = () => {
    setShowWithdrawModal(false);
    setApplicationToWithdraw(null);
    setWithdrawReason('');
  };

  const handleWithdrawConfirm = async () => {
    if (!applicationToWithdraw) return;
    
    try {
      setWithdrawingApplication(applicationToWithdraw.id);
      await candidateApi.withdrawApplication(applicationToWithdraw.id, withdrawReason || 'Candidate withdrew application');
      
      // Refresh applications list
      const apiParams: any = {
        page: currentPage,
        limit: pageLimit,
        orderBy: 'created_at',
        direction: 'DESC'
      };
      
      // Only add status if not 'all'
      if (selectedStatusTab !== 'all') {
        apiParams.current_status = getAPIStatus(selectedStatusTab);
      }
      
      const response = await candidateApi.getMyApplications(apiParams);
      const applicationsArray = Array.isArray(response) ? response : (response?.data || []);
      
      const transformedApplications = applicationsArray.map((app: any, index: number) => {
        const companyName = app.company_name || app.job?.company?.name || 'Company';
        const logoColors = [
          'bg-green-500 text-white',
          'bg-blue-500 text-white', 
          'bg-red-500 text-white',
          'bg-purple-500 text-white',
          'bg-cyan-500 text-white'
        ];
        
        return {
          id: app.application_id || app.id,
          application_id: app.application_id,
          job_id: app.job_id,
          candidate_id: app.candidate_id,
          company: companyName,
          role: app.job_title || app.position || app.job?.title || 'Position',
          dateApplied: new Date(app.applied_at || app.created_at || Date.now()).toLocaleDateString(),
          status: app.current_status || app.status || 'SUBMITTED',
          logo: companyName.charAt(0).toUpperCase(),
          logoColor: logoColors[index % logoColors.length],
          cv_id: app.cv_id,
          cover_letter: app.cover_letter,
          applied_at: app.applied_at,
          updated_at: app.updated_at,
          job_title: app.job_title,
          company_name: app.company_name
        };
      });
      
      setApplications(transformedApplications);
      setShowWithdrawModal(false);
      setApplicationToWithdraw(null);
      setWithdrawReason('');
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này.');
      } else {
        alert('Không thể rút đơn ứng tuyển. Vui lòng thử lại.');
      }
    } finally {
      setWithdrawingApplication(null);
    }
  };

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const apiParams: any = {
          page: currentPage,
          limit: pageLimit,
          orderBy: 'created_at',
          direction: 'DESC'
        };
        
        // Only add status if not 'all'
        if (selectedStatusTab !== 'all') {
          apiParams.current_status = getAPIStatus(selectedStatusTab);
        }
        
        
        const response = await candidateApi.getMyApplications(apiParams);
        
        // Handle business-service API response structure
        const applicationsArray = Array.isArray(response)
          ? response
          : (response?.data || []);
        
        // Update pagination if available
        if (response?.pagination) {
          setPagination(response.pagination);
        }
        
        // Transform API data to match component interface
        const transformedApplications = applicationsArray.map((app: any, index: number) => {
          const companyName = app.company_name || app.job?.company?.name || 'Company';
          const logoColors = [
            'bg-green-500 text-white',
            'bg-blue-500 text-white', 
            'bg-red-500 text-white',
            'bg-purple-500 text-white',
            'bg-cyan-500 text-white'
          ];
          
          return {
            id: app.application_id || app.id,
            application_id: app.application_id,
            job_id: app.job_id,
            candidate_id: app.candidate_id,
            company: companyName,
            role: app.job_title || app.position || app.job?.title || 'Position',
            dateApplied: new Date(app.applied_at || app.created_at || Date.now()).toLocaleDateString(),
            status: app.current_status || app.status || 'SUBMITTED',
            logo: companyName.charAt(0).toUpperCase(),
            logoColor: logoColors[index % logoColors.length],
            cv_id: app.cv_id,
            cover_letter: app.cover_letter,
            applied_at: app.applied_at,
            updated_at: app.updated_at,
            job_title: app.job_title,
            company_name: app.company_name
          };
        });
        
        setApplications(transformedApplications);
        setError(null);
        
        // Debug: Log application statuses
        console.log('🔍 Application statuses:', transformedApplications.map((app: Application) => ({ 
          id: app.id, 
          company: app.company, 
          status: app.status 
        })));
      } catch (err: any) {
        // Only show error for actual API failures, not for empty results
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setError('Bạn cần đăng nhập để xem lịch sử ứng tuyển.');
        } else if (err?.response?.status === 404 || err?.message?.includes('404')) {
          // 404 usually means no applications found, not an error
          setApplications([]);
          setError(null);
        } else if (err?.response?.status >= 500) {
          setError('Lỗi hệ thống. Vui lòng thử lại sau.');
        } else {
          // For other errors, still show a generic message but less alarming
          setError('Không thể tải dữ liệu lúc này. Vui lòng thử lại.');
        }
        console.error('Error fetching applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [currentPage, pageLimit, selectedStatusTab, searchTerm]);

  // Filter applications based on search term
  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      app.company.toLowerCase().includes(searchLower) ||
      app.role.toLowerCase().includes(searchLower) ||
      app.status.toLowerCase().includes(searchLower)
    );
  });

  // Calculate status counts for tabs
  const statusTabs = [
    { 
      id: 'all', 
      label: 'All Applications', 
      count: applications.length 
    },
    { 
      id: 'pending', 
      label: 'Pending', 
      count: applications.filter(app => ['APPLIED', 'SUBMITTED', 'REVIEWING'].includes(app.status)).length 
    },
    { 
      id: 'reviewing', 
      label: 'In Review', 
      count: applications.filter(app => app.status === 'REVIEWING').length 
    },
    { 
      id: 'interviewing', 
      label: 'Interviewing', 
      count: applications.filter(app => app.status === 'INTERVIEWED').length 
    },
    { 
      id: 'testing', 
      label: 'Testing', 
      count: applications.filter(app => app.status === 'SHORTLISTED').length 
    },
    { 
      id: 'rejected', 
      label: 'Rejected', 
      count: applications.filter(app => app.status === 'REJECTED').length 
    },
    { 
      id: 'hired', 
      label: 'Hired', 
      count: applications.filter(app => app.status === 'HIRED').length 
    },
    { 
      id: 'withdrawn', 
      label: 'Withdrawn', 
      count: applications.filter(app => app.status === 'WITHDRAWN').length 
    }
  ];

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



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
      case 'SUBMITTED':
        return 'bg-blue-500 text-white shadow-sm hover:shadow-md transition-shadow';
      case 'REVIEWING':
        return 'bg-yellow-500 text-white shadow-sm hover:shadow-md transition-shadow';
      case 'SHORTLISTED':
        return 'bg-purple-500 text-white shadow-sm hover:shadow-md transition-shadow';
      case 'INTERVIEWED':
        return 'bg-indigo-500 text-white shadow-sm hover:shadow-md transition-shadow';
      case 'OFFERED':
        return 'bg-green-500 text-white shadow-sm hover:shadow-md transition-shadow';
      case 'REJECTED':
        return 'bg-red-500 text-white shadow-sm hover:shadow-md transition-shadow';
      case 'HIRED':
        return 'bg-emerald-600 text-white shadow-sm hover:shadow-md transition-shadow';
      case 'WITHDRAWN':
        return 'bg-gray-400 text-white shadow-sm hover:shadow-md transition-shadow';
      default:
        return 'bg-slate-400 text-white shadow-sm hover:shadow-md transition-shadow';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'APPLIED':
      case 'SUBMITTED':
        return 'Applied';
      case 'REVIEWING':
        return 'In Review';
      case 'SHORTLISTED':
        return 'Mini-test';
      case 'INTERVIEWED':
        return 'Interviewing';
      case 'OFFERED':
        return 'Offered';
      case 'HIRED':
        return 'Hired';
      case 'REJECTED':
        return 'Rejected';
      case 'WITHDRAWN':
        return 'Withdrawn';
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-50 flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
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
                      onClick={() => setShowSearchInput(!showSearchInput)}
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

              {/* Search Input */}
              {showSearchInput && (
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                      placeholder="Tìm kiếm theo tên công ty, vị trí, hoặc trạng thái..."
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {searchTerm && (
                    <p className="mt-2 text-sm text-gray-600">
                      Tìm thấy {filteredApplications.length} kết quả cho "{searchTerm}"
                    </p>
                  )}
                </div>
              )}

              {/* Table */}
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Company Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Roles</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Date Applied</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={6} className="text-center p-4 text-red-500">{error}</td></tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-8">
                        {searchTerm ? (
                          <>
                            <div className="text-gray-400 text-6xl mb-4">🔍</div>
                            <div className="text-gray-500 text-lg font-medium mb-2">Không tìm thấy kết quả</div>
                            <div className="text-gray-400 text-sm">Không có ứng tuyển nào phù hợp với từ khóa "{searchTerm}"</div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <div className="text-gray-500 text-lg font-medium mb-2">Không có thông tin</div>
                            <div className="text-gray-400 text-sm">Bạn chưa ứng tuyển công việc nào. Hãy tìm kiếm và ứng tuyển công việc phù hợp!</div>
                          </>
                        )}
                      </td></tr>
                    ) : filteredApplications.map((application, index) => (
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
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                              <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 opacity-80"></div>
                              {getStatusDisplayName(application.status)}
                            </span>
                          </div>
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
                                  {/* Debug status - moved to useEffect */}
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApplicationClick(application);
                                      setShowDropdown(null);
                                    }}
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Job Details
                                  </button>
                                  
                                  {(application.status !== 'WITHDRAWN' && application.status !== 'HIRED' && application.status !== 'REJECTED') && (
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleWithdrawClick(application);
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

              {/* Improved Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-medium">{((currentPage - 1) * pageLimit) + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageLimit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> applications
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center">
                        {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 7) {
                            pageNum = i + 1;
                          } else {
                            if (currentPage <= 4) {
                              pageNum = i + 1;
                            } else if (currentPage >= pagination.totalPages - 3) {
                              pageNum = pagination.totalPages - 6 + i;
                            } else {
                              pageNum = currentPage - 3 + i;
                            }
                          }
                          
                          const isCurrentPage = pageNum === currentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium border-t border-b ${
                                isCurrentPage
                                  ? 'text-[#007BFF] bg-blue-50 border-[#007BFF] border-l border-r'
                                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button 
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= pagination.totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawModal && applicationToWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Withdraw Application</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to withdraw your application for <span className="font-medium">{applicationToWithdraw.role}</span> at <span className="font-medium">{applicationToWithdraw.company}</span>?
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="withdrawReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for withdrawal (optional)
                </label>
                <textarea
                  id="withdrawReason"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                  rows={3}
                  placeholder="Please provide a reason for withdrawing your application..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleWithdrawCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawConfirm}
                  disabled={withdrawingApplication === applicationToWithdraw.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawingApplication === applicationToWithdraw.id ? 'Withdrawing...' : 'Withdraw Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications; 