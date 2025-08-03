import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  HelpCenter,
} from './components';
import {
  AdminDashboard,
  AdminJobListings,
  AdminCandidateManagement,
  AdminQuestionManagement,
  AdminStatistics,
  AdminActivityLog,
  AdminSettings,
  AdminFeedbackIssues,
  AdminAccountsList,
  AdminCompanyProfile,
  AdminCandidateDetail,
  AdminHRDetail,
} from './components/admin';
import HrRoutes from './components/hr/HrRoutes';

import './App.css';
import api from './services/api';
import authService from './services/authService';
import firebaseService from './services/firebase';

type CurrentPage = 'home' | 'find-jobs' | 'find-jobs-dashboard' | 'agent-ai' | 'favorite-jobs' | 'companies' | 'find-companies' | 'browse-companies' | 'job-detail' | 'company-profile' | 'resume' | 'profile' | 'dashboard' | 'my-applications' | 'test-management' | 'settings' | 'help-center';

const pageToPath: Record<CurrentPage, string> = {
  home: '/',
  'find-jobs': '/find-jobs',
  'find-jobs-dashboard': '/find-jobs-dashboard',
  'agent-ai': '/agent-ai',
  'favorite-jobs': '/favorite-jobs',
  companies: '/companies',
  'find-companies': '/find-companies',
  'browse-companies': '/browse-companies',
  'job-detail': '/job-detail',
  'company-profile': '/company-profile',
  resume: '/resume',
  profile: '/profile',
  dashboard: '/dashboard',
  'my-applications': '/my-applications',
  'test-management': '/test-management',
  settings: '/settings',
  'help-center': '/help-center',
};

const pathToPage: Record<string, CurrentPage> = Object.fromEntries(
  Object.entries(pageToPath).map(([page, path]) => [path, page as CurrentPage])
);


const App = () => {
  return (
    <Router>
      <MainContent />
    </Router>
  );
};

const MainContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  // Add authentication state management here
  const [isAdmin, setIsAdmin] = useState(false); // Default to false
  const [isHr, setIsHr] = useState(false); // Default to false

  // Protected Route components
  const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    // If we have a token but no currentUser yet, we're still loading
    if (token && !currentUser) {
      return <div>Loading...</div>;
    }
    
    // Check currentUser directly to avoid timing issues
    const userRole = currentUser?.role;
    if (!currentUser || userRole !== 'ADMIN') {
      return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
  };

  const ProtectedHrRoute = ({ children }: { children: React.ReactNode }) => {
    // If we have a token but no currentUser yet, we're still loading
    if (token && !currentUser) {
      return <div>Loading...</div>;
    }
    
    // Check currentUser directly to avoid timing issues  
    const userRole = currentUser?.role;
    if (!currentUser || userRole !== 'RECRUITER') {
      return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
  };

  const [currentPage, setCurrentPage] = useState<CurrentPage>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  useEffect(() => {
    const currentPath = location.pathname;
    const page = pathToPage[currentPath];
    if (page) {
      setCurrentPage(page);
    }
  }, [location.pathname]);

  // Initialize Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await firebaseService.initializeFirebase();
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.error('Firebase initialization failed:', error);
      }
    };
    
    initFirebase();
  }, []);

  // --- Effect to fetch user profile if token exists ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Only fetch if we have token but no currentUser (avoid conflict with handleAuthSuccess)
      if (token && !currentUser) {
        try {
          // Set token for all subsequent api requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
          // Set user roles based on backend format (ADMIN, CANDIDATE, RECRUITER)
          const userRole = user?.role as string;
          setIsAdmin(userRole === 'ADMIN');
          setIsHr(userRole === 'RECRUITER'); 
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          // Token might be invalid/expired
          handleLogout();
        }
      }
    };

    fetchUserProfile();
  }, [token]);




  const handlePageChange = (page: CurrentPage) => {
    const path = pageToPath[page];
    if (path) {
      navigate(path);
      setCurrentPage(page);
    }
  };

  const handleAuthOpen = (mode: 'login' | 'signup' | 'forgot-password') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: any, authToken: string) => {
    setToken(authToken);
    setCurrentUser(user);
    localStorage.setItem('token', authToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    // Set user roles based on backend format (ADMIN, CANDIDATE, RECRUITER)
    const userRole = user?.role as string;
    setIsAdmin(userRole === 'ADMIN');
    setIsHr(userRole === 'RECRUITER');
    
    setIsAuthModalOpen(false); // Close auth modal on success
    
    // Auto redirect based on user role
    if (userRole === 'ADMIN') {
      navigate('/admin');
    } else if (userRole === 'RECRUITER') {
      navigate('/hr');
    }
    // CANDIDATE users stay on current page or go to dashboard if needed
  };

  const handleLogout = () => {
    // Clear local state and storage immediately
    setToken(null);
    setCurrentUser(null);
    setIsAdmin(false);
    setIsHr(false);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    
    // Call logout API in background (don't wait for it)
    authService.logout().catch(error => {
      console.error('Logout API error:', error);
    });
    
    navigate('/');
    setCurrentPage('home');
  };

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    handlePageChange('job-detail');
  };

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanyId(companyId);
    handlePageChange('company-profile');
  };

  const handleBackClick = () => {
    handlePageChange('home');
    setSelectedJobId(null);
    setSelectedCompanyId(null);
  };

  const handleFindJobsClick = () => {
    handlePageChange('find-jobs');
  };

  // Removed unused handleApplyClick function

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Hero />
            <CompanyLogos />
            <Categories onFindJobsClick={handleFindJobsClick} />
            <CTA onSignUpClick={() => handleAuthOpen('signup')} />
            <JobList onJobClick={handleJobClick} onFindJobsClick={handleFindJobsClick} />
          </>
        );
      case 'find-jobs':
        return <FindJobs onJobClick={handleJobClick} />;
      case 'find-jobs-dashboard':
        return <FindJobsDashboard 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'agent-ai':
        return <AgentAI 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
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
          onDashboardClick={() => handlePageChange('dashboard')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
                    case 'job-detail':
        // Mock job data for demonstration
        const mockJob = {
          id: parseInt(selectedJobId || '1'),
          title: 'Social Media Assistant',
          company: 'Stripe',
          location: 'Paris, France',
          type: 'Full-Time',
          tags: ['Marketing', 'Design'],
          logo: 'S',
          logoColor: 'bg-purple-500',
          match: 95,
          applied: 5,
          capacity: 10,
          salary: '$75k-$85k USD',
          description: 'Stripe is looking for Social Media Marketing expert to help manage our online networks. You will be responsible for monitoring our social media channels, creating content, finding effective ways to engage the community and incentivize others to engage on our channels.',
          requirements: [
            'Community engagement to ensure that is supported and actively represented online',
            'Focus on social media content development and publication',
            'Marketing and strategy support',
            'Stay on top of trends on social media platforms, and suggest content ideas to the team',
            'Engage with online communities'
          ],
          whoYouAre: [
            'You get energy from people and building the ideal work environment',
            'You have a sense for beautiful spaces and office experiences',
            'You are a confident office manager, ready for added responsibilities',
            'You\'re detail-oriented and creative',
            'You\'re a growth marketer and know how to run campaigns'
          ],
          niceToHaves: [
            'Fluent in English',
            'Project management skills',
            'Copy editing skills'
          ]
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
          onDashboardClick={() => handlePageChange('dashboard')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'dashboard':
        return <Dashboard 
          onHomeClick={handleBackClick} 
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'my-applications':
        return <MyApplications 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'test-management':
        return <TestManagement 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'settings':
        return <Settings 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'help-center':
        return <HelpCenter 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onFindJobsClick={() => handlePageChange('find-jobs-dashboard')}
          onBrowseCompaniesClick={() => handlePageChange('browse-companies')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      default:
        return (
          <>
            <Hero />
            <CompanyLogos />
            <Categories onFindJobsClick={handleFindJobsClick}/>
            <CTA onSignUpClick={() => handleAuthOpen('signup')} />
            <JobList onJobClick={handleJobClick} onFindJobsClick={handleFindJobsClick} />
            <CTA onSignUpClick={() => handleAuthOpen('signup')} />
          </>
        );
    }
  };

  const renderCandidateLayout = () => (
    <div className="bg-white">
      <Header 
        onPageChange={handlePageChange} 
        currentPage={currentPage} 
        onAuthOpen={handleAuthOpen}
        onHomeClick={handleBackClick}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {renderPage()}
      {(currentPage === 'home' || 
        currentPage === 'dashboard' || 
        currentPage === 'profile' || 
        currentPage === 'my-applications' || 
        currentPage === 'test-management' ||
        currentPage === 'job-detail') && <Footer />}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        mode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />
      <ChatBot />
    </div>
  );

  return (
    <Routes>
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/job-listings"
        element={
          <ProtectedAdminRoute>
            <AdminJobListings />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/candidates"
        element={
          <ProtectedAdminRoute>
            <AdminCandidateManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <ProtectedAdminRoute>
            <AdminQuestionManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/statistics"
        element={
          <ProtectedAdminRoute>
            <AdminStatistics />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/activity-log"
        element={
          <ProtectedAdminRoute>
            <AdminActivityLog />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <ProtectedAdminRoute>
            <AdminFeedbackIssues />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedAdminRoute>
            <AdminSettings />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <ProtectedAdminRoute>
            <AdminAccountsList />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/accounts/hr/:id"
        element={<ProtectedAdminRoute><AdminHRDetail /></ProtectedAdminRoute>}
      />
      <Route
        path="/admin/company/:id"
        element={
          <ProtectedAdminRoute>
            <AdminCompanyProfile />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/candidates/:id"
        element={
          <ProtectedAdminRoute>
            <AdminCandidateDetail />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/hr/:id"
        element={
          <ProtectedAdminRoute>
            <AdminHRDetail />
          </ProtectedAdminRoute>
        }
      />

      {/* HR Routes */}
      <Route path="/hr/*" element={<ProtectedHrRoute><HrRoutes /></ProtectedHrRoute>} />

      {/* Candidate facing pages */}
      <Route path="/*" element={renderCandidateLayout()} />
    </Routes>
  );
};

export default App;
