import React, { useState } from 'react';
import FindJobsDashboard from './FindJobsDashboard';
import JobDetail from './JobDetail';
import JobApplication from './JobApplication';
import AgentAI from './AgentAI';
import Avatar from '../../assets/Avatar17.png';
import DashboardSidebar from './DashboardSidebar';

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





interface DashboardProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onMyApplicationsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onTestManagementClick?: () => void;
  onFindJobsClick?: () => void;
  onAgentAIClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onHomeClick, 
  onProfileClick, 
  onMyApplicationsClick, 
  onBrowseCompaniesClick,
  onTestManagementClick,
  onFindJobsClick,
  onAgentAIClick,
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState<'dashboard' | 'job-detail'>('dashboard');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const handleGoToDashboard = () => {
    setActiveTab('dashboard');
  };

  const handleGoToFindJobs = () => {
    if (onFindJobsClick) {
      onFindJobsClick();
    } else {
      setActiveTab('find-jobs');
    }
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





  // Render FindJobsDashboard when find-jobs is active
  if (activeTab === 'find-jobs') {
    return (
      <FindJobsDashboard 
        onProfileClick={onProfileClick}
        onHomeClick={onHomeClick}
        onDashboardClick={handleGoToDashboard}
        onAgentAIClick={() => setActiveTab('agent-ai')}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={handleGoToTestManagement}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
      />
    );
  }

  // Render JobDetail when job-detail view is active
  if (currentView === 'job-detail' && selectedJob) {
    return (
      <JobDetail 
        job={selectedJob}
        onBack={handleBackToDashboard}
      />
    );
  }

  // Render Agent AI interface when agent-ai is active
  if (activeTab === 'agent-ai') {
    return (
      <AgentAI 
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
        onDashboardClick={handleGoToDashboard}
        onFindJobsClick={handleGoToFindJobs}
        onTestManagementClick={handleGoToTestManagement}
      />
    );
  }

  const applicationHistory = [
    {
      id: 1,
      title: 'Social Media Assistant',
      company: 'Nomad',
      location: 'Paris, France',
      type: 'Full-Time',
      dateApplied: '24 July 2021',
      status: 'Đang xử lý',
      logo: 'N',
      logoColor: 'bg-green-500 text-white'
    },
    {
      id: 2,
      title: 'Social Media Assistant',
      company: 'Udacity',
      location: 'New York, USA',
      type: 'Full-Time',
      dateApplied: '23 July 2021',
      status: 'Phỏng vấn',
      logo: 'U',
      logoColor: 'bg-blue-500 text-white'
    },
    {
      id: 3,
      title: 'Social Media Assistant',
      company: 'Packer',
      location: 'Madrid, Spain',
      type: 'Full-Time',
      dateApplied: '22 July 2021',
      status: 'Từ chối',
      logo: 'P',
      logoColor: 'bg-red-500 text-white'
    }
  ];

  const suggestedJobs: Job[] = [
    {
      id: 1,
      title: 'Social Media Assistant',
      company: 'Nomad',
      location: 'Paris, France',
      type: 'Full-Time',
      tags: ['Marketing', 'Design', 'Match: 85%'],
      logo: 'N',
      logoColor: 'bg-green-500 text-white',
      match: 85,
      applied: 5,
      capacity: 10,
      salary: '$40,000 - $60,000'
    },
    {
      id: 2,
      title: 'Brand Designer',
      company: 'Dropbox',
      location: 'San Francisco, USA',
      type: 'Full-Time',
      tags: ['Marketing', 'Design', 'Match: 89%'],
      logo: 'D',
      logoColor: 'bg-[#007BFF] text-white',
      match: 89,
      applied: 2,
      capacity: 10,
      salary: '$50,000 - $70,000'
    },
    {
      id: 3,
      title: 'Lead Engineer',
      company: 'Canva',
      location: 'Ankara, Turkey',
      type: 'Full-Time',
      tags: ['Engineering', 'Technology', 'Match: 77%'],
      logo: 'C',
      logoColor: 'bg-teal-500 text-white',
      match: 77,
      applied: 5,
      capacity: 10,
      salary: '$60,000 - $80,000'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang xử lý':
        return 'bg-orange-100 text-orange-700';
      case 'Phỏng vấn':
        return 'bg-blue-100 text-blue-700';
      case 'Từ chối':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab}
        onDashboardClick={handleGoToDashboard}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={onTestManagementClick}
        onFindJobsClick={onFindJobsClick}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpCenterClick={onHelpCenterClick}
      />

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
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Good morning, Jake</h2>
          <p className="text-gray-600">Here is what's happening with your job search applications from July 19 - July 25.</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-500">Jul 19 - Jul 25</span>
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
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Total Jobs Applied</p>
                    <p className="text-4xl font-bold text-gray-900">45</p>
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
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Interviewed</p>
                    <p className="text-4xl font-bold text-gray-900">18</p>
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
              <p className="text-sm font-medium text-gray-500">Jobs Applied Status</p>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32 group">
                <svg className="w-full h-full transform -rotate-90 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 42 42">
                  {/* Đã tiếp nhận - 25% (0-25) */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3" 
                    strokeDasharray="25 75" strokeDashoffset="0"
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
                  {/* Mini-test - 25% (25-50) */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="3" 
                    strokeDasharray="25 75" strokeDashoffset="-25"
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
                  {/* Phỏng vấn - 25% (50-75) */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="3" 
                    strokeDasharray="25 75" strokeDashoffset="-50"
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
                  {/* Đang xử lý - 25% (75-100) */}
                  <circle 
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3" 
                    strokeDasharray="25 75" strokeDashoffset="-75"
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
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Đã tiếp nhận</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Mini-test</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Phỏng vấn</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Đang xử lý</span>
              </div>
            </div>
            <div className="text-center">
              <button className="text-[#007BFF] hover:text-[#0056b3] text-sm font-medium transition-colors">
                View All Applications →
              </button>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h3>
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
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications History</h3>
          </div>
          <div className="space-y-4">
            {applicationHistory.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${app.logoColor}`}>
                    {app.logo}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{app.title}</h4>
                    <p className="text-sm text-gray-500">{app.company} • {app.location} • {app.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date Applied</p>
                    <p className="text-sm font-medium">{app.dateApplied}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                    {app.status}
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
          <div className="mt-6 text-center">
            <button className="text-[#007BFF] hover:text-[#0056b3] font-medium text-sm">
              View all applications history →
            </button>
          </div>
        </div>

        {/* Suggested Jobs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Suggest Jobs</h3>
              <p className="text-sm text-gray-500">Showing 73 results</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select className="text-sm border border-gray-300 rounded px-2 py-1">
                <option>Most relevant</option>
                <option>Newest</option>
                <option>Salary</option>
              </select>
              <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {suggestedJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#007BFF]/30 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${job.logoColor}`}>
                    {job.logo}
                  </div>
                  <div>
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
                    <p className="text-xs text-gray-500 mt-1">
                      {job.applied} applied of {job.capacity} capacity
                    </p>
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
          
          {/* Pagination */}
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="px-3 py-1 bg-[#007BFF] text-white rounded">1</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">2</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">3</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">4</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">5</button>
            <span className="px-2 text-gray-400">...</span>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">33</button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    {/* Job Application Modal */}
    {isApplicationModalOpen && selectedJob && (
      <JobApplication 
        isOpen={isApplicationModalOpen}
        job={{
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