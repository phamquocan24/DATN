import { useState } from 'react';
import { 
  Header, 
  Hero, 
  CompanyLogos,
  Categories, 
  JobList, 
  CTA, 
  Footer, 
  AuthModal, 
  FindJobs, 
  FavoriteJobs, 
  Companies, 
  FindCompanies, 
  BrowseCompanies,
  JobDetail,
  CompanyProfile,
  Resume,
  ChatBot,
  Profile,
  Dashboard,
  MyApplications,
  TestManagement,
  FindJobsDashboard,
  AgentAI,
  Settings,
  HelpCenter
} from './components';

import './App.css';

type CurrentPage = 'home' | 'find-jobs' | 'find-jobs-dashboard' | 'agent-ai' | 'favorite-jobs' | 'companies' | 'find-companies' | 'browse-companies' | 'job-detail' | 'company-profile' | 'resume' | 'profile' | 'dashboard' | 'my-applications' | 'test-management' | 'settings' | 'help-center';

function App() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handlePageChange = (page: CurrentPage) => {
    setCurrentPage(page);
  };

  const handleAuthOpen = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentPage('job-detail');
  };

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setCurrentPage('company-profile');
  };

  const handleBackClick = () => {
    setCurrentPage('home');
    setSelectedJobId(null);
    setSelectedCompanyId(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Hero />
            <CompanyLogos />
            <Categories />
            <JobList onJobClick={handleJobClick} />
            <CTA />
          </>
        );
      case 'find-jobs':
        return <FindJobs onJobClick={handleJobClick} />;
      case 'find-jobs-dashboard':
        return <FindJobsDashboard 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
          onSettingsClick={() => setCurrentPage('settings')}
          onHelpCenterClick={() => setCurrentPage('help-center')}
        />;
      case 'agent-ai':
        return <AgentAI 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onSettingsClick={() => setCurrentPage('settings')}
        />;
      case 'favorite-jobs':
        return <FavoriteJobs onJobClick={handleJobClick} />;
      case 'companies':
        return <Companies onCompanyClick={handleCompanyClick} />;
      case 'find-companies':
        return <FindCompanies onCompanyClick={handleCompanyClick} />;
      case 'browse-companies':
        return <BrowseCompanies 
          onCompanyClick={handleCompanyClick} 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onSettingsClick={() => setCurrentPage('settings')}
        />;
                    case 'job-detail':
        // Mock job data for demonstration
        const mockJob = {
          id: parseInt(selectedJobId || '1'),
          title: 'Social Media Assistant',
          company: 'Nomad',
          location: 'Paris, France',
          type: 'Full-Time',
          tags: ['Marketing', 'Design', 'Match: 95%'],
          logo: 'N',
          logoColor: 'bg-blue-100',
          match: 95,
          applied: 5,
          capacity: 10,
          salary: '$40,000 - $60,000',
        };
        
        return (
          <JobDetail 
            job={mockJob}
            onBack={handleBackClick}
          />
        );
              case 'company-profile':
        return (
          <CompanyProfile 
            companyId={selectedCompanyId || undefined} 
            onBack={handleBackClick}
          />
        );
      case 'resume':
        return <Resume />;
      case 'profile':
        return <Profile 
          onHomeClick={handleBackClick} 
          onDashboardClick={() => setCurrentPage('dashboard')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onSettingsClick={() => setCurrentPage('settings')}
          onHelpCenterClick={() => setCurrentPage('help-center')}
        />;
      case 'dashboard':
        return <Dashboard 
          onHomeClick={handleBackClick} 
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
          onSettingsClick={() => setCurrentPage('settings')}
          onHelpCenterClick={() => setCurrentPage('help-center')}
        />;
      case 'my-applications':
        return <MyApplications 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
          onSettingsClick={() => setCurrentPage('settings')}
          onHelpCenterClick={() => setCurrentPage('help-center')}
        />;
      case 'test-management':
        return <TestManagement 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
          onSettingsClick={() => setCurrentPage('settings')}
        />;
      case 'settings':
        return <Settings 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
        />;
      case 'help-center':
        return <HelpCenter 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onFindJobsClick={() => setCurrentPage('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => setCurrentPage('browse-companies')}
          onAgentAIClick={() => setCurrentPage('agent-ai')}
          onSettingsClick={() => setCurrentPage('settings')}
        />;
      default:
        return (
          <>
            <Hero />
            <CompanyLogos />
            <Categories />
            <JobList onJobClick={handleJobClick} />
            <CTA />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onPageChange={handlePageChange} 
        currentPage={currentPage} 
        onAuthOpen={handleAuthOpen}
        onHomeClick={handleBackClick}
      />
      {renderPage()}
      {(currentPage === 'home' || 
        currentPage === 'dashboard' || 
        currentPage === 'profile' || 
        currentPage === 'my-applications' || 
        currentPage === 'test-management') && <Footer />}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} />
      <ChatBot />
    </div>
  );
}

export default App;