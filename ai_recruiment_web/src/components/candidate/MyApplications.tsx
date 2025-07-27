import React, { useState, useEffect } from 'react';
import JobDetail from './JobDetail';
import DashboardSidebar from './DashboardSidebar';
import api from '../../services/api';

interface Application {
  id: number;
  company: string;
  role: string;
  dateApplied: string;
  status: 'In Review' | 'Hired' | 'Mini-test' | 'Interviewing' | 'Rejected';
  logo: string;
  logoColor: string;
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
  id: number;
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
  onAgentAIClick?: () => void;
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
  onAgentAIClick,
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [activeTab, setActiveTab] = useState('applications');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store selected application to access its status
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);


  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/applications');
        setApplications(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load applications.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Convert Application to Job format for JobDetail
  const convertApplicationToJob = (application: Application): Job => {
    return {
      id: application.id,
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

  const statusTabs = [
    { id: 'all', label: 'All', count: 45 },
    { id: 'in-review', label: 'In Review', count: 34 },
    { id: 'interviewing', label: 'Interviewing', count: 18 },
    { id: 'mini-test', label: 'Mini-test', count: 5 },
    { id: 'rejected', label: 'Rejected', count: 2 },
    { id: 'hired', label: 'Hired', count: 1 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Review':
        return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Hired':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'Mini-test':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Interviewing':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Rejected':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab}
        onDashboardClick={onDashboardClick}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={() => setActiveTab('applications')}
        onTestManagementClick={onTestManagementClick}
        onFindJobsClick={onFindJobsClick}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpCenterClick={onHelpCenterClick}
      />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {currentView === 'detail' && selectedJob ? (
          <JobDetail 
            job={selectedJob}
            onBack={handleBackToList}
            applicationStatus={selectedApplication?.status}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Keep it up, Jake</h2>
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
                      onClick={() => setSelectedStatusTab(tab.id)}
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
                    ) : applications
                        .filter(app => selectedStatusTab === 'all' || app.status.toLowerCase().replace(' ', '-') === selectedStatusTab)
                        .map((application, index) => (
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
                            {application.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click when clicking menu button
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center space-x-1">
                      <button className="px-3 py-1 text-sm font-medium text-white bg-[#007BFF] rounded">1</button>
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900">2</button>
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900">3</button>
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900">4</button>
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900">5</button>
                      <span className="px-2 text-sm text-gray-500">...</span>
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900">33</button>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyApplications; 