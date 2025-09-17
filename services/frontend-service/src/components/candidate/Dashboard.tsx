import React, { useState, useEffect } from 'react';
import { Skeleton, TableRowSkeleton } from '../common/SkeletonLoader';
import JobDetail from './JobDetail';
import JobApplication from './JobApplication';
import Avatar from '../../assets/Avatar17.png';
import DashboardSidebar from './DashboardSidebar';
import candidateApi from '../../services/candidateApi';
import bookmarkCache from '../../services/bookmarkCache';
import { isTokenValid } from '../../services/tokenUtils';

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
}





interface DashboardProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
  onResumeClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onHomeClick, 
  onProfileClick, 
  onMyApplicationsClick, 
  onTestManagementClick,
  onSettingsClick,
  onHelpCenterClick,
  onResumeClick
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState<'dashboard' | 'job-detail'>('dashboard');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  
  // Bookmark states
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({ message: '', type: 'success', show: false });

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // API Data States
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<Job[]>([]);
  const [userProfile, setUserProfile] = useState<any>({});
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Enhanced state for smart recommendations
  const [recommendationMetadata, setRecommendationMetadata] = useState<any>({});
  const [recommendationParams, setRecommendationParams] = useState({
    top_k: 8,
    min_match_score: 60
  });

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
          orderBy: 'submitted_at', 
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

  // Enhanced fetch with smart recommendations
  useEffect(() => {
    const fetchSmartRecommendations = async () => {
      try {
        setJobsLoading(true);
        setJobsError(null);
        
        console.log('🎯 Fetching smart job recommendations with params:', recommendationParams);
        
        // Check if user has primary CV for better logging
        try {
          const userCVs = await candidateApi.getMyCVs();
          const primaryCV = userCVs.data?.find((cv: any) => cv.is_primary);
          console.log('📄 Primary CV status:', {
            hasPrimaryCV: !!primaryCV,
            cvId: primaryCV?.cv_id,
            fileName: primaryCV?.file_name,
            updatedAt: primaryCV?.updated_at
          });
        } catch (cvError) {
          console.warn('Could not check primary CV status:', cvError);
        }
        
        // Use AI recommendations API (calls AI service directly)
        const response = await candidateApi.getRecommendedJobsAI({
          top_k: recommendationParams.top_k
        });
        
        if (response && response.data && Array.isArray(response.data)) {
          console.log('🔍 Raw API response for recommendations:', response.data.slice(0, 2));
          console.log('📊 Match scores in response:', response.data.map(job => ({ 
            title: job.title, 
            match_score: job.match_score,
            match_percentage: Math.round(job.match_score || 0)
          })));
          
          // Transform smart recommendations for display
          const transformedJobs = response.data.map((job: any, index: number) => ({
            job_id: job.job_id,
            id: parseInt(job.id || job.job_id) || 0,
            title: job.title,
            company: job.company_name || 'Company',
            location: [job.city_name, job.district_name, job.address]
              .filter(Boolean)
              .join(', ') || 'Remote',
            type: formatEmploymentType(job.employment_type),
            tags: [
              job.category,
              job.fit_level && `${job.fit_level.charAt(0).toUpperCase()}${job.fit_level.slice(1)} Fit`,
              job.featured && 'Featured'
            ].filter(Boolean).slice(0, 3),
            logo: (job.company_name || job.title)?.charAt(0).toUpperCase() || 'J',
            logoColor: getCompanyLogoColor(job.company_name, index),
            // match_score from AI service is already percentage (0-100)
            match: Math.round(job.match_score || 0),
            applied: job.application_count || 0,
            capacity: job.max_applications || 1,
            // Enhanced fields from AI matching
            match_reasoning: job.match_reasoning,
            match_strengths: job.match_strengths || [],
            match_weaknesses: job.match_weaknesses || [],
            recommendation_rank: job.recommendation_rank,
            recommendation_reason: job.recommendation_reason,
            fit_level: job.fit_level
          }));
          
          setSuggestedJobs(transformedJobs);
          setRecommendationMetadata(response.metadata || {});
          
          console.log('✅ Smart recommendations loaded:', {
            count: transformedJobs.length,
            avgMatch: response.metadata?.average_match_score,
            topMatch: transformedJobs[0]?.match
          });
        } else {
          setSuggestedJobs([]);
          setRecommendationMetadata({});
        }
      } catch (error: any) {
        console.error('❌ Error fetching smart recommendations:', error);
        
        // Handle different error scenarios
        if (error.response?.status === 401 || error.response?.status === 403) {
          setJobsError(null);
          setSuggestedJobs([]);
        } else if (error.response?.status === 404) {
          setJobsError('Please upload and set a primary CV to get personalized recommendations');
        } else {
          setJobsError('Unable to load personalized job recommendations');
        }
        setSuggestedJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchSmartRecommendations();
  }, [recommendationParams]);

  // Load bookmark status for jobs
  useEffect(() => {
    const loadBookmarkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !isTokenValid(token)) return;

        // Get bookmarked jobs from cache
        const bookmarkedJobIds = new Set<string>();
        
        // For each job in suggested jobs, check bookmark status
        for (const job of suggestedJobs) {
          const jobId = job.job_id || job.id?.toString();
          if (jobId) {
            const isBookmarked = bookmarkCache.getCache(jobId);
            if (isBookmarked) bookmarkedJobIds.add(jobId);
          }
        }
        
        setBookmarkedJobs(bookmarkedJobIds);
      } catch (error) {
        console.error('Failed to load bookmark status:', error);
      }
    };

    if (suggestedJobs.length > 0) {
      loadBookmarkStatus();
    }
  }, [suggestedJobs]);

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

  // Handle bookmark toggle
  const handleBookmarkToggle = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const jobId = job.job_id || job.id?.toString();
      if (!jobId) {
        console.error('No job ID available for bookmark');
        return;
      }

      // Check authentication
      const token = localStorage.getItem('token');
      if (!token || !isTokenValid(token)) {
        showNotification('Bạn cần đăng nhập để sử dụng tính năng này', 'error');
        return;
      }

      const isCurrentlyBookmarked = bookmarkedJobs.has(jobId);

      if (isCurrentlyBookmarked) {
        // Remove bookmark
        const response = await candidateApi.removeJobFromFavorites(jobId);
        if (response.success) {
          setBookmarkedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
          bookmarkCache.setCache(jobId, false);
          showNotification('Đã bỏ lưu công việc', 'success');
          
          // Emit event to sync with other components
          window.dispatchEvent(new CustomEvent('bookmarkChanged', {
            detail: { jobId, isBookmarked: false }
          }));
        }
      } else {
        // Add bookmark
        const response = await candidateApi.addJobToFavorites(jobId);
        if (response.success) {
          setBookmarkedJobs(prev => new Set(prev).add(jobId));
          bookmarkCache.setCache(jobId, true);
          showNotification('Lưu thành công! Công việc đã được thêm vào danh sách yêu thích', 'success');
          
          // Emit event to sync with other components
          window.dispatchEvent(new CustomEvent('bookmarkChanged', {
            detail: { jobId, isBookmarked: true }
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to toggle bookmark:', error);
      showNotification('Có lỗi xảy ra khi thực hiện thao tác. Vui lòng thử lại.', 'error');
    }
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

  // Function to refresh recommendations
  const handleRefreshRecommendations = async () => {
    setJobsLoading(true);
    try {
      // Trigger AI recalculation if user has primary CV
      const userCVs = await candidateApi.getMyCVs();
      const primaryCV = userCVs.data?.find((cv: any) => cv.is_primary);
      
      console.log('🔄 Refreshing recommendations with primary CV:', {
        hasPrimaryCV: !!primaryCV,
        cvId: primaryCV?.cv_id,
        fileName: primaryCV?.file_name
      });
      
      // Clear any existing cache to force fresh calculation
      // Note: The API should handle cache invalidation, but we log for debugging
      console.log('💾 Requesting fresh AI analysis with current primary CV');
      
      // Force refresh (bypass cache) - use same API as main fetch
      const response = await candidateApi.getRecommendedJobsAI({
        top_k: recommendationParams.top_k,
        refresh_cache: true  // Add cache refresh parameter
      });
      
      // Update recommendations
      if (response && response.data && Array.isArray(response.data)) {
        const transformedJobs = response.data.map((job: any, index: number) => ({
          job_id: job.job_id,
          id: parseInt(job.id || job.job_id) || 0,
          title: job.title,
          company: job.company_name || 'Company',
          location: [job.city_name, job.district_name, job.address]
            .filter(Boolean)
            .join(', ') || 'Remote',
          type: formatEmploymentType(job.employment_type),
          tags: [
            job.category,
            job.fit_level && `${job.fit_level.charAt(0).toUpperCase()}${job.fit_level.slice(1)} Fit`,
            job.featured && 'Featured'
          ].filter(Boolean).slice(0, 3),
          logo: (job.company_name || job.title)?.charAt(0).toUpperCase() || 'J',
          logoColor: getCompanyLogoColor(job.company_name, index),
          // match_score from AI service is already percentage (0-100)
          match: Math.round(job.match_score || 0),
          applied: job.application_count || 0,
          capacity: job.max_applications || 1,
          match_reasoning: job.match_reasoning,
          match_strengths: job.match_strengths || [],
          match_weaknesses: job.match_weaknesses || [],
          recommendation_rank: job.recommendation_rank,
          recommendation_reason: job.recommendation_reason,
          fit_level: job.fit_level
        }));
        
        setSuggestedJobs(transformedJobs);
        setRecommendationMetadata(response.metadata || {});
      }
      
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
      setJobsError('Failed to refresh recommendations');
    } finally {
      setJobsLoading(false);
    }
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
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`
            px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300
            ${notification.type === 'success' ? 'bg-green-500 text-white' : 
              notification.type === 'error' ? 'bg-red-500 text-white' : 
              'bg-blue-500 text-white'}
          `}>
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="flex-shrink-0 ml-auto"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Skeleton width="w-16" height="h-4" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Skeleton width="w-20" height="h-4" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Skeleton width="w-24" height="h-4" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Skeleton width="w-16" height="h-4" />
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 5 }, (_, i) => (
                    <TableRowSkeleton key={i} columns={5} />
                  ))}
                </tbody>
              </table>
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
                  <div 
                    key={app.application_id || app.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#007BFF]/30 transition-colors cursor-pointer"
                    onClick={onMyApplicationsClick}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                        app.company_name ? 
                          `bg-blue-500 text-white` : 
                          'bg-gray-500 text-white'
                      }`}>
                        {(app.company_name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{app.job_title || 'Job Title'}</h4>
                        <p className="text-sm text-gray-500">
                          {app.company_name || 'Company'} • 
                          {app.city_name || 'Location'} • 
                          {app.employment_type === 'FULL_TIME' ? 'Full-Time' 
                            : app.employment_type === 'PART_TIME' ? 'Part-Time'
                            : app.employment_type === 'CONTRACT' ? 'Contract'
                            : app.employment_type === 'INTERNSHIP' ? 'Internship'
                            : 'Full-Time'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Date Applied</p>
                        <p className="text-sm font-medium">{formatDate(app.submitted_at)}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(app.current_status)}`}>
                        {getStatusDisplayText(app.current_status)}
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

        {/* Enhanced Smart Job Recommendations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Enhanced Header with Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                🎯 Smart Job Recommendations
                {recommendationMetadata.average_match_score && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Avg: {Math.round(recommendationMetadata.average_match_score)}% match
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                {jobsLoading ? 'Analyzing job compatibility...' : 
                 `Top ${suggestedJobs.length} matches from ${recommendationMetadata.total_jobs_analyzed || 0} jobs analyzed`
                }
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Top-K Selector */}
              <select 
                value={recommendationParams.top_k}
                onChange={(e) => setRecommendationParams(prev => ({
                  ...prev, 
                  top_k: parseInt(e.target.value)
                }))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={5}>Top 5</option>
                <option value={8}>Top 8</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
              </select>
              
              {/* Min Match Score Filter */}
              <select 
                value={recommendationParams.min_match_score}
                onChange={(e) => setRecommendationParams(prev => ({
                  ...prev, 
                  min_match_score: parseInt(e.target.value)
                }))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={50}>50%+ match</option>
                <option value={60}>60%+ match</option>
                <option value={70}>70%+ match</option>
                <option value={80}>80%+ match</option>
              </select>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefreshRecommendations}
                disabled={jobsLoading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <svg className={`w-4 h-4 mr-1 ${jobsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {jobsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Skeleton circle width="w-10" height="h-10" />
                    <div>
                      <Skeleton width="w-6" height="h-6" className="mb-1" />
                    </div>
                  </div>
                  <Skeleton width="w-full" height="h-5" className="mb-2" />
                  <Skeleton width="w-32" height="h-4" className="mb-3" />
                  <div className="space-y-2">
                    <Skeleton width="w-full" height="h-4" />
                    <Skeleton width="w-3/4" height="h-4" />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Skeleton width="w-20" height="h-6" />
                    <Skeleton width="w-16" height="h-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">{jobsError}</p>
            </div>
          ) : suggestedJobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">No job recommendations found</p>
              <p className="text-sm text-gray-400 mb-4">
                {jobsError || "Complete your profile and upload a CV to get personalized recommendations"}
              </p>
              <button
                onClick={() => onResumeClick?.()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload CV
              </button>
            </div>
          ) : (
            <>
              {/* Enhanced Job Cards with Match Details */}
              <div className="space-y-4">
                {suggestedJobs.map((job, index) => (
                  <div 
                    key={job.job_id || job.id} 
                    className="relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#007BFF]/30 transition-colors cursor-pointer group"
                    onClick={() => handleJobClick(job)}
                  >
                    {/* Ranking Badge */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${job.logoColor}`}>
                        {job.logo}
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 hover:text-[#007BFF] transition-colors">
                          {job.title}
                        </h4>
                          {/* Match Score Badge */}
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            job.match >= 90 ? 'bg-green-100 text-green-800' :
                            job.match >= 80 ? 'bg-blue-100 text-blue-800' :
                            job.match >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.match}% match
                          </span>
                          {/* Fit Level Badge */}
                          {(job as any).fit_level && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              (job as any).fit_level === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                              (job as any).fit_level === 'great' ? 'bg-green-100 text-green-700' :
                              (job as any).fit_level === 'good' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {(job as any).fit_level} fit
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-2">{job.company} • {job.location}</p>
                        
                        {/* Recommendation Reason */}
                        {(job as any).recommendation_reason && (
                          <p className="text-xs text-blue-600 mb-2 italic">
                            💡 {(job as any).recommendation_reason}
                          </p>
                        )}
                        
                        {/* Tags */}
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {job.type}
                          </span>
                          {job.tags.map((tag, tagIndex) => (
                            <span 
                              key={tagIndex} 
                              className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* Match Strengths (shown on hover) */}
                        {(job as any).match_strengths && (job as any).match_strengths.length > 0 && (
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-green-600">
                              <strong>Strengths:</strong> {(job as any).match_strengths.slice(0, 3).join(', ')}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {job.applied} applied of {job.capacity} capacity
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Bookmark Button */}
                      <button 
                        onClick={(e) => handleBookmarkToggle(job, e)}
                        className={`p-2 rounded-lg transition-colors ${
                          bookmarkedJobs.has(job.job_id || job.id?.toString() || '')
                            ? 'text-blue-500 hover:bg-blue-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={bookmarkedJobs.has(job.job_id || job.id?.toString() || '') ? 'Bỏ lưu' : 'Lưu công việc'}
                      >
                        <svg className="w-5 h-5" fill={bookmarkedJobs.has(job.job_id || job.id?.toString() || '') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                      
                      {/* Apply Button */}
                      <button 
                        className="bg-[#007BFF] text-white px-6 py-2 rounded-lg hover:bg-[#0056b3] transition-colors font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobClick(job);
                        }}
                      >
                        Apply
                      </button>
                    </div>
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
        onResumeClick={onResumeClick}
      />
    )}
  </>
  );
};

// Helper functions
const formatEmploymentType = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'FULL_TIME': 'Full-Time',
    'PART_TIME': 'Part-Time', 
    'CONTRACT': 'Contract',
    'INTERNSHIP': 'Internship'
  };
  return typeMap[type] || 'Full-Time';
};

const getCompanyLogoColor = (companyName: string, index: number) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500'];
  return `${colors[index % colors.length]} text-white`;
};

export default Dashboard; 