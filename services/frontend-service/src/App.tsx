import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import candidateApi from './services/candidateApi';
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

type CurrentPage = 'home' | 'find-jobs' | 'agent-ai' | 'favorite-jobs' | 'companies' | 'find-companies' | 'browse-companies' | 'job-detail' | 'company-profile' | 'resume' | 'profile' | 'dashboard' | 'my-applications' | 'test-management' | 'settings' | 'help-center';

const pageToPath: Record<CurrentPage, string> = {
  home: '/',
  'find-jobs': '/find-jobs',
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
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing saved user from localStorage:', error);
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      // Set authorization header on app init
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    return savedToken;
  });
  
  // Initialize role states based on saved user
  const [, setIsAdmin] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return user?.role === 'ADMIN';
      }
    } catch (error) {
      console.error('Error parsing saved user for isAdmin:', error);
    }
    return false;
  });
  
  const [, setIsHr] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return user?.role === 'RECRUITER';
      }
    } catch (error) {
      console.error('Error parsing saved user for isHr:', error);
    }
    return false;
  });

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
          localStorage.setItem('user', JSON.stringify(user)); // Save user to localStorage
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
    localStorage.setItem('user', JSON.stringify(user)); // Save user to localStorage
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

  // JobDetailWrapper component to fetch and display job details
  const JobDetailWrapper = ({ jobId, onBack }: { jobId: string | null, onBack: () => void }) => {
    // Create initial placeholder job data
    const [jobData, setJobData] = useState<any>(() => ({
      job_id: jobId || '',
      id: parseInt(jobId || '0'),
      title: 'Loading...',
      company: 'Loading...',
      location: 'Loading...',
      type: 'Full-Time',
      tags: ['Loading'],
      logo: 'L',
      logoColor: 'bg-gray-400 text-white',
      match: 85,
      applied: 0,
      capacity: 1,
      salary: 'Loading...',
      description: 'Loading job details...',
      requirements: [],
      benefits: [],
      whoYouAre: [],
      niceToHaves: []
    }));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchJobDetails = async () => {
        if (!jobId) {
          setError('No job ID provided');
          return;
        }

        try {
          setError(null);
          const response = await candidateApi.getJobById(jobId);
          console.log('Job Details API Response:', response);
          
          // Handle different response structures - API returns array, take first item if array
          let jobDetails;
          if (response.data && Array.isArray(response.data)) {
            jobDetails = response.data[0]; // Take first job from array
          } else if (response.data) {
            jobDetails = response.data;
          } else {
            jobDetails = response;
          }

          if (!jobDetails) {
            throw new Error('No job data found');
          }
          
          // Transform API data to match JobDetail component interface - using real API structure
          const transformedJob = {
            job_id: jobDetails.job_id,
            id: jobDetails.id || parseInt(jobId),
            title: jobDetails.title,
            company: jobDetails.company_name,
            location: [jobDetails.city_name, jobDetails.district_name, jobDetails.address]
              .filter(Boolean)
              .join(', ') || 'Remote',
            type: jobDetails.employment_type === 'FULL_TIME' ? 'Full-Time' : 
                  jobDetails.employment_type === 'PART_TIME' ? 'Part-Time' :
                  jobDetails.employment_type === 'CONTRACT' ? 'Contract' :
                  jobDetails.employment_type === 'INTERNSHIP' ? 'Internship' :
                  jobDetails.employment_type || 'Full-Time',
            tags: [
              jobDetails.category,
              jobDetails.employment_type === 'FULL_TIME' ? 'Full-Time' : jobDetails.employment_type,
              jobDetails.remote_work_option && 'Remote',
              jobDetails.featured && 'Featured'
            ].filter(Boolean),
            logo: (jobDetails.company_name || jobDetails.title)?.charAt(0).toUpperCase() || 'J',
            logoColor: 'bg-blue-500 text-white',
            match: 85, // Default match score since not provided in API
            applied: parseInt(jobDetails.application_count) || 0,
            capacity: jobDetails.max_applications || 1,
            salary: jobDetails.salary_min && jobDetails.salary_max 
              ? `${jobDetails.salary_min.toLocaleString()} - ${jobDetails.salary_max.toLocaleString()} ${jobDetails.currency || 'VND'}`
              : jobDetails.salary_min 
                ? `From ${jobDetails.salary_min.toLocaleString()} ${jobDetails.currency || 'VND'}`
                : 'Competitive Salary',
            description: jobDetails.description,
            requirements: jobDetails.requirements 
              ? (typeof jobDetails.requirements === 'string' 
                  ? jobDetails.requirements.split('\n').filter(Boolean)
                  : jobDetails.requirements)
              : [],
            benefits: jobDetails.benefits 
              ? (typeof jobDetails.benefits === 'string' 
                  ? jobDetails.benefits.split('\n').filter(Boolean)
                  : jobDetails.benefits)
              : [],
            whoYouAre: jobDetails.responsibilities 
              ? (typeof jobDetails.responsibilities === 'string' 
                  ? jobDetails.responsibilities.split('\n').filter(Boolean)
                  : jobDetails.responsibilities)
              : [],
            niceToHaves: jobDetails.education_requirements || jobDetails.language_requirements
              ? [
                  jobDetails.education_requirements,
                  jobDetails.language_requirements
                ].filter(Boolean)
              : []
          };
          
          setJobData(transformedJob);
        } catch (err: any) {
          console.error('Error fetching job details:', err);
          setError('Failed to load job details');
        }
      };

      fetchJobDetails();
    }, [jobId]);

    if (error) {
      return (
        <div className="py-16 bg-red-50 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button 
            onClick={onBack}
            className="mt-4 bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-[#0056b3] transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      );
    }

    return (
      <JobDetail 
        job={jobData}
        onBack={onBack}
      />
    );
  };

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

      case 'agent-ai':
        return <AgentAI 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}


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
          onFindJobsClick={() => handlePageChange('find-jobs')}
          onProfileClick={() => handlePageChange('profile')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;

                    case 'job-detail':
        return (
          <JobDetailWrapper 
            jobId={selectedJobId}
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


          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'dashboard':
        return <Dashboard 
          onHomeClick={handleBackClick} 
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}
          onAgentAIClick={() => handlePageChange('agent-ai')}
          onSettingsClick={() => handlePageChange('settings')}
          onHelpCenterClick={() => handlePageChange('help-center')}
        />;
      case 'my-applications':
        return <MyApplications 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}


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


          onAgentAIClick={() => handlePageChange('agent-ai')}
          onHelpCenterClick={() => handlePageChange('help-center')}
          currentUser={currentUser}
        />;
      case 'help-center':
        return <HelpCenter 
          onHomeClick={handleBackClick}
          onDashboardClick={() => handlePageChange('dashboard')}
          onProfileClick={() => handlePageChange('profile')}
          onMyApplicationsClick={() => handlePageChange('my-applications')}
          onTestManagementClick={() => handlePageChange('test-management')}


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
            <AdminDashboard currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/job-listings"
        element={
          <ProtectedAdminRoute>
            <AdminJobListings currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/candidates"
        element={
          <ProtectedAdminRoute>
            <AdminCandidateManagement currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <ProtectedAdminRoute>
            <AdminQuestionManagement currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/statistics"
        element={
          <ProtectedAdminRoute>
            <AdminStatistics currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/activity-log"
        element={
          <ProtectedAdminRoute>
            <AdminActivityLog currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <ProtectedAdminRoute>
            <AdminFeedbackIssues currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedAdminRoute>
            <AdminSettings currentUser={currentUser} />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <ProtectedAdminRoute>
            <AdminAccountsList currentUser={currentUser} />
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
      <Route path="/hr/*" element={<ProtectedHrRoute><HrRoutes currentUser={currentUser} /></ProtectedHrRoute>} />

      {/* Candidate facing pages */}
      <Route path="/*" element={renderCandidateLayout()} />
    </Routes>
  );
};

export default App;
