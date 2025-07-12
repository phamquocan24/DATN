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
  JobDetail,
  CompanyProfile,
  Resume,
  ChatBot,
  Profile,
  Dashboard,
  MyApplications,
  TestManagement
} from './components';

import './App.css';

type CurrentPage = 'home' | 'find-jobs' | 'favorite-jobs' | 'companies' | 'find-companies' | 'job-detail' | 'company-profile' | 'resume' | 'profile' | 'dashboard' | 'my-applications' | 'test-management';

function App() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handlePageChange = (page: CurrentPage) => {
    setCurrentPage(page);
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
      case 'favorite-jobs':
        return <FavoriteJobs onJobClick={handleJobClick} />;
      case 'companies':
        return <Companies onCompanyClick={handleCompanyClick} />;
      case 'find-companies':
        return <FindCompanies onCompanyClick={handleCompanyClick} />;
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
          onAgentAIClick={() => setCurrentPage('dashboard')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onFindJobsClick={() => setCurrentPage('find-jobs')}
          onBrowseCompaniesClick={() => setCurrentPage('companies')}
        />;
      case 'dashboard':
        return <Dashboard 
          onHomeClick={handleBackClick} 
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onBrowseCompaniesClick={() => setCurrentPage('companies')}
          onTestManagementClick={() => setCurrentPage('test-management')}
        />;
      case 'my-applications':
        return <MyApplications 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onFindJobsClick={() => setCurrentPage('find-jobs')}
          onBrowseCompaniesClick={() => setCurrentPage('companies')}
          onTestManagementClick={() => setCurrentPage('test-management')}
          onAgentAIClick={() => setCurrentPage('dashboard')} // Will navigate to agent AI in dashboard
        />;
      case 'test-management':
        return <TestManagement 
          onHomeClick={handleBackClick}
          onDashboardClick={() => setCurrentPage('dashboard')}
          onProfileClick={() => setCurrentPage('profile')}
          onMyApplicationsClick={() => setCurrentPage('my-applications')}
          onFindJobsClick={() => setCurrentPage('find-jobs')}
          onBrowseCompaniesClick={() => setCurrentPage('companies')}
          onAgentAIClick={() => setCurrentPage('dashboard')}
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
        onAuthOpen={() => setIsAuthModalOpen(true)}
        onHomeClick={handleBackClick}
      />
      {renderPage()}
      {(currentPage === 'home' || 
        currentPage === 'dashboard' || 
        currentPage === 'profile' || 
        currentPage === 'my-applications' || 
        currentPage === 'test-management') && <Footer />}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode="login" />
      <ChatBot />
    </div>
  );
}

export default App;