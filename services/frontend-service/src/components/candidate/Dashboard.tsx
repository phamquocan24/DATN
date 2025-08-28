import React, { useState, useEffect } from 'react';
import JobDetail from './JobDetail';
import JobApplication from './JobApplication';
import Avatar from '../../assets/Avatar17.png';
import DashboardSidebar from './DashboardSidebar';
import candidateApi from '../../services/candidateApi';

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





interface DashboardProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onHomeClick, 
  onProfileClick, 
  onMyApplicationsClick, 
  onTestManagementClick,
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState<'dashboard' | 'job-detail'>('dashboard');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // API Data States
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<Job[]>([]);
  const [userProfile, setUserProfile] = useState<any>({});
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Initialize isCollapsed from localStorage, default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('candidate-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Save isCollapsed to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('candidate-sidebar-collapsed', JSON.stringify(isCollapsed));
    } catch (error) {
      console.warn('Failed to save candidate sidebar state to localStorage:', error);
    }
  }, [isCollapsed]);

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

  // Fetch applications data (both recent and all for chart)
  useEffect(() => {
    const fetchApplicationsData = async () => {
      try {
        setApplicationsLoading(true);
        setApplicationsError(null);
        
        // Fetch recent applications (limit 5 for display)
        const recentResponse = await candidateApi.getMyApplications({ 
          limit: 5, 
          orderBy: 'created_at', 
          direction: 'DESC' 
        });
        
        // Fetch all applications for chart data
        const allResponse = await candidateApi.getMyApplications({ 
          limit: 100, // Large number to get all applications
          orderBy: 'created_at', 
          direction: 'DESC' 
        });
        
        if (recentResponse && recentResponse.data) {
          setRecentApplications(recentResponse.data);
        } else {
          setRecentApplications([]);
        }

        if (allResponse && allResponse.data) {
          setAllApplications(allResponse.data);
        } else {
          setAllApplications([]);
        }
      } catch (error: any) {
        console.error('Error fetching applications:', error);
        setApplicationsError('Unable to load applications');
        setRecentApplications([]);
        setAllApplications([]);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplicationsData();
  }, []);

  // Fetch suggested jobs data - using same logic as FindJobs
  useEffect(() => {
    const fetchSuggestedJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError(null);
        
        // Use same API call as FindJobs Suitable Jobs
        const response = await candidateApi.getRecommendedJobs({ 
          page: 1, 
          limit: 6 
        });
        
        if (response && response.data && Array.isArray(response.data)) {
          const transformedJobs = response.data.map((job: any, index: number) => ({
            job_id: job.job_id,
            id: parseInt(job.id || job.job_id) || 0,
            title: job.title,
            company: job.company_name || 'Company',
            location: [job.city_name, job.district_name, job.address]
              .filter(Boolean)
              .join(', ') || 'Remote',
            type: job.employment_type === 'FULL_TIME' ? 'Full-Time' 
                : job.employment_type === 'PART_TIME' ? 'Part-Time'
                : job.employment_type === 'CONTRACT' ? 'Contract'
                : job.employment_type === 'INTERNSHIP' ? 'Internship'
                : 'Full-Time',
            tags: [
              job.category,
              job.work_arrangement && job.work_arrangement.charAt(0) + job.work_arrangement.slice(1).toLowerCase(),
              job.featured && 'Featured',
              `Match: ${Math.round(job.match_score || 85)}%`
            ].filter(Boolean).slice(0, 3),
            logo: (job.company_name || job.title)?.charAt(0).toUpperCase() || 'J',
            logoColor: `bg-${['blue', 'green', 'purple', 'red', 'teal', 'orange'][index % 6]}-500 text-white`,
            match: Math.round(job.match_score || 85),
            applied: job.application_count || 0,
            capacity: job.max_applications || 1,
            salary: job.salary_min && job.salary_max 
              ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.currency || 'VND'}`
              : job.salary_min 
                ? `From ${job.salary_min.toLocaleString()} ${job.currency || 'VND'}`
                : 'Competitive Salary'
          }));
          setSuggestedJobs(transformedJobs);
        } else {
          // If no data, set empty array (same as FindJobs)
          setSuggestedJobs([]);
        }
      } catch (error: any) {
        console.error('Error fetching suggested jobs:', error);
        // Don't show error if user is not authenticated (same as FindJobs)
        if (error.response?.status === 401 || error.response?.status === 403) {
          setJobsError(null);
          setSuggestedJobs([]);
        } else {
          setJobsError('Unable to load job recommendations');
          setSuggestedJobs([]);
        }
      } finally {
        setJobsLoading(false);
      }
    };

    fetchSuggestedJobs();
  }, []);

  const handleGoToDashboard = () => {
    setActiveTab('dashboard');
  };

  const handleGoToTestManagement = () => {
    setActiveTab('test-management');
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setCurrentView('job-detail');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedJob(null);
  };

  const handleApplyJob = (job: Job) => {
    setSelectedJob(job);
    setIsApplicationModalOpen(true);
  };

  const handleCloseApplicationModal = () => {
    setIsApplicationModalOpen(false);
    setSelectedJob(null);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Calculate chart data from real applications
  const getApplicationStats = () => {
    const totalApplications = allApplications.length;
    
    // Count applications by status
    const statusCounts = allApplications.reduce((acc, app) => {
      const status = app.status || 'APPLIED';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Count interviews (INTERVIEW/INTERVIEWED status)
    const interviewCount = (statusCounts['INTERVIEW'] || 0) + (statusCounts['INTERVIEWED'] || 0);

    // Calculate percentages for chart based on actual database statuses
    const shortlistedCount = statusCounts['SHORTLISTED'] || 0;
    const assessmentCount = (statusCounts['ASSESSMENT'] || 0) + (statusCounts['TESTING'] || 0);
    const interviewingCount = (statusCounts['INTERVIEW'] || 0) + (statusCounts['INTERVIEWED'] || 0);
    const pendingCount = (statusCounts['APPLIED'] || 0) + (statusCounts['SUBMITTED'] || 0) + (statusCounts['SCREENING'] || 0) + (statusCounts['REVIEWING'] || 0);

    const total = shortlistedCount + assessmentCount + interviewingCount + pendingCount || 1; // Avoid division by zero

    return {
      totalApplications,
      interviewCount,
      chartData: {
        shortlisted: Math.round((shortlistedCount / total) * 100),
        assessment: Math.round((assessmentCount / total) * 100),
        interviewing: Math.round((interviewingCount / total) * 100),
        pending: Math.round((pendingCount / total) * 100)
      }
    };
  };

  const stats = getApplicationStats();







  // Render JobDetail when job-detail view is active
  if (currentView === 'job-detail' && selectedJob) {
    return (
      <JobDetail 
        job={selectedJob}
        onBack={handleBackToDashboard}
      />
    );
  }



  // Helper function to get status display text and color
  const getStatusDisplayText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'APPLIED': 'Applied',
      'SUBMITTED': 'Submitted',
      'SCREENING': 'Screening',
      'REVIEWING': 'Reviewing',
      'SHORTLISTED': 'Shortlisted',
      'INTERVIEW': 'Interview',
      'INTERVIEWED': 'Interviewed',
      'ASSESSMENT': 'Assessment',
      'TESTING': 'Testing',
      'OFFER': 'Offer',
      'OFFERED': 'Offered',
      'HIRED': 'Hired',
      'REJECTED': 'Rejected',
      'WITHDRAWN': 'Withdrawn'
    };
    return statusMap[status] || status;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    // Handle both API status values and display text
    const normalizedStatus = getStatusDisplayText(status);
    
    switch (normalizedStatus) {
      case 'Applied':
      case 'Submitted':
      case 'Screening':
      case 'Reviewing':
        return 'bg-orange-100 text-orange-700';
      case 'Interview':
      case 'Interviewed':
        return 'bg-blue-100 text-blue-700';
      case 'Rejected':
      case 'Withdrawn':
        return 'bg-red-100 text-red-700';
      case 'Shortlisted':
        return 'bg-green-100 text-green-700';
      case 'Assessment':
      case 'Testing':
        return 'bg-purple-100 text-purple-700';
      case 'Offer':
      case 'Offered':
        return 'bg-emerald-100 text-emerald-700';
      case 'Hired':
        return 'bg-green-200 text-green-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg min-h-screen border-l border-r border-gray-200 sticky top-0 z-10 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300`}>
        <DashboardSidebar 
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          onToggleSidebar={toggleSidebar}
          onDashboardClick={handleGoToDashboard}
          onMyApplicationsClick={onMyApplicationsClick}
          onTestManagementClick={onTestManagementClick}
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
          onHelpCenterClick={onHelpCenterClick}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button 
            onClick={onHomeClick}
            className="px-4 py-2 text-[#007BFF] hover:text-white font-medium border border-[#007BFF] rounded-lg hover:bg-[#007BFF] transition-colors"
          >
            Back to homepage
          </button>
        </div>

        {/* Welcome Message */}
        <div className="mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Good morning, {userProfile.full_name || 'User'}
          </h2>
          <p className="text-gray-600">Here is what's happening with your job search applications.</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
            <button className="text-sm text-[#007BFF] hover:text-[#0056b3]">📅</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Jobs Applied & Interviewed */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              {/* Total Jobs Applied */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-500 mb-2">Total Jobs Applied</p>
                    <p className="text-4xl font-bold text-gray-900">{stats.totalApplications}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Interviewed */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-500 mb-2">Interviewed</p>
                    <p className="text-4xl font-bold text-gray-900">{stats.interviewCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs Applied Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500 text-left">Jobs Applied Status</p>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32 group">
                <svg className="w-full h-full transform -rotate-90 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 42 42">
                  {/* Shortlisted */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3" 
                    strokeDasharray={`${stats.chartData.shortlisted} ${100 - stats.chartData.shortlisted}`} strokeDashoffset="0"
                    className="transition-all duration-300 hover:stroke-[#059669] cursor-pointer"
                    style={{filter: 'drop-shadow(0 0 0 transparent)'}}
                    onMouseEnter={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '4';
                      target.style.filter = 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '3';
                      target.style.filter = 'drop-shadow(0 0 0 transparent)';
                    }}
                  />
                  {/* Assessment */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="3" 
                    strokeDasharray={`${stats.chartData.assessment} ${100 - stats.chartData.assessment}`} 
                    strokeDashoffset={`-${stats.chartData.shortlisted}`}
                    className="transition-all duration-300 hover:stroke-[#7c3aed] cursor-pointer"
                    style={{filter: 'drop-shadow(0 0 0 transparent)'}}
                    onMouseEnter={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '4';
                      target.style.filter = 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '3';
                      target.style.filter = 'drop-shadow(0 0 0 transparent)';
                    }}
                  />
                  {/* Interview */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="3" 
                    strokeDasharray={`${stats.chartData.interviewing} ${100 - stats.chartData.interviewing}`} 
                    strokeDashoffset={`-${stats.chartData.shortlisted + stats.chartData.assessment}`}
                    className="transition-all duration-300 hover:stroke-[#2563eb] cursor-pointer"
                    style={{filter: 'drop-shadow(0 0 0 transparent)'}}
                    onMouseEnter={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '4';
                      target.style.filter = 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '3';
                      target.style.filter = 'drop-shadow(0 0 0 transparent)';
                    }}
                  />
                  {/* Pending */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3" 
                    strokeDasharray={`${stats.chartData.pending} ${100 - stats.chartData.pending}`} 
                    strokeDashoffset={`-${stats.chartData.shortlisted + stats.chartData.assessment + stats.chartData.interviewing}`}
                    className="transition-all duration-300 hover:stroke-[#d97706] cursor-pointer"
                    style={{filter: 'drop-shadow(0 0 0 transparent)'}}
                    onMouseEnter={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '4';
                      target.style.filter = 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as SVGCircleElement;
                      target.style.strokeWidth = '3';
                      target.style.filter = 'drop-shadow(0 0 0 transparent)';
                    }}
                  />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Shortlisted</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Assessment</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Interview</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Pending</span>
              </div>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Upcoming Interviews</h3>
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4 pb-2 border-b border-gray-200">Today, 26 November</div>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 w-16">10:00 AM</span>
              </div>
              <div className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500 w-16">10:30 AM</span>
                <img src={Avatar} alt="Joe Bartmann" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Joe Bartmann</p>
                  <p className="text-xs text-gray-500">HR Manager at Divvy</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 w-16">11:00 AM</span>
              </div>
            </div>
          </div>
        </div>



        {/* Recent Applications History */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 text-left">Recent Applications History</h3>
          </div>
          
          {applicationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-[#007BFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading applications...</span>
            </div>
          ) : applicationsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">{applicationsError}</p>
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent applications found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.application_id || app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                        app.company?.company_name ? 
                          `bg-blue-500 text-white` : 
                          'bg-gray-500 text-white'
                      }`}>
                        {(app.company?.company_name || app.job?.company_name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{app.job?.title || 'Job Title'}</h4>
                        <p className="text-sm text-gray-500">
                          {app.company?.company_name || app.job?.company_name || 'Company'} • 
                          {app.job?.location || 'Location'} • 
                          {app.job?.employment_type || 'Full-Time'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Date Applied</p>
                        <p className="text-sm font-medium">{formatDate(app.created_at || app.application_date)}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                        {getStatusDisplayText(app.status)}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Suggested Jobs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">Suggest Jobs</h3>
              <p className="text-sm text-gray-500">
                {jobsLoading ? 'Loading...' : `Showing ${suggestedJobs.length} results`}
              </p>
            </div>
          </div>

          {jobsLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-[#007BFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading job recommendations...</span>
            </div>
          ) : jobsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">{jobsError}</p>
            </div>
          ) : suggestedJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No job recommendations available</p>
              <p className="text-sm text-gray-400">Complete your profile to get personalized job recommendations</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {suggestedJobs.map((job) => (
                  <div key={job.job_id || job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#007BFF]/30 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${job.logoColor}`}>
                        {job.logo}
                      </div>
                      <div className="text-left">
                        <h4 
                          className="font-medium text-gray-900 hover:text-[#007BFF] cursor-pointer transition-colors"
                          onClick={() => handleJobClick(job)}
                        >
                          {job.title}
                        </h4>
                        <p className="text-sm text-gray-500">{job.company} • {job.location}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {job.type}
                          </span>
                          {job.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className={`px-2 py-1 text-xs rounded-full ${
                                tag.includes('Match:') 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {job.applied} applied of {job.capacity} capacity
                          </p>
                          {job.salary && (
                            <p className="text-xs text-gray-600 font-medium">
                              {job.salary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      className="bg-[#007BFF] text-white px-6 py-2 rounded-lg hover:bg-[#0056b3] transition-colors font-medium"
                      onClick={() => handleApplyJob(job)}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Pagination - Could be enhanced with actual pagination logic */}
              {suggestedJobs.length >= 10 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="px-3 py-1 bg-[#007BFF] text-white rounded">1</button>
                  <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">2</button>
                  <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">3</button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    
    {/* Job Application Modal */}
    {isApplicationModalOpen && selectedJob && (
      <JobApplication 
        isOpen={isApplicationModalOpen}
        job={{
          job_id: selectedJob.job_id,
          id: selectedJob.id,
          title: selectedJob.title,
          company: selectedJob.company,
          location: selectedJob.location,
          type: selectedJob.type,
          logo: selectedJob.logo,
          logoColor: selectedJob.logoColor
        }}
        onClose={handleCloseApplicationModal}
      />
    )}
  </>
  );
};

export default Dashboard; 